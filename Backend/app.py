import os
import sys
import traceback
from io import BytesIO
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import hf_hub_download
from PIL import Image
from tensorflow.keras.models import load_model
from starlette.responses import JSONResponse
from typing import Optional, Dict, Any

# Configuración de entorno
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce logs de TensorFlow
IMG_SIZE = (224, 224)

# Configuración de modelos
HUGGINGFACE_REPO_ID = "Glaucomate/Modelo-glaucoma"
NERVIO_MODEL_FILENAME = "modelo_deteccion_nervio_universal.h5"
CDR_MODEL_FILENAME = "modelo_regresion_cdr.h5"

app = FastAPI(
    title="API de Detección de Glaucoma",
    description="API para análisis automatizado de nervio óptico y detección de glaucoma",
    version="1.0.1"
)

# Configuración CORS mejorada
origins = [
    "https://glaucomate.netlify.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Variables globales para modelos
nerve_detection_model: Optional[tf.keras.Model] = None
cdr_regression_model: Optional[tf.keras.Model] = None

def load_model_with_retry(repo_id: str, filename: str, max_retries: int = 3) -> tf.keras.Model:
    """Carga un modelo con reintentos y manejo de errores mejorado"""
    last_error = None
    for attempt in range(max_retries):
        try:
            model_path = hf_hub_download(
                repo_id=repo_id,
                filename=filename,
                repo_type="model",
                cache_dir=".cache"
            )
            return load_model(model_path)
        except Exception as e:
            last_error = e
            print(f"Intento {attempt + 1} fallido: {str(e)}")
            if attempt < max_retries - 1:
                tf.keras.backend.clear_session()
                import time
                time.sleep(2 ** attempt)  # Backoff exponencial
    raise RuntimeError(f"No se pudo cargar el modelo después de {max_retries} intentos") from last_error

@app.on_event("startup")
async def startup_event():
    """Carga los modelos al iniciar la aplicación con manejo robusto de errores"""
    global nerve_detection_model, cdr_regression_model
    
    try:
        print("🔄 Iniciando carga de modelos desde Hugging Face...")
        
        # Cargar modelo de detección de nervio óptico
        nerve_detection_model = load_model_with_retry(
            HUGGINGFACE_REPO_ID, 
            NERVIO_MODEL_FILENAME
        )
        print(f"✅ Modelo de detección de nervio cargado. Resumen:")
        nerve_detection_model.summary(print_fn=lambda x: print(f"  {x}"))
        
        # Cargar modelo de regresión CDR con métricas personalizadas
        cdr_regression_model = load_model_with_retry(
            HUGGINGFACE_REPO_ID,
            CDR_MODEL_FILENAME,
            custom_objects={
                'mse': tf.keras.losses.MeanSquaredError(),
                'mae': tf.keras.losses.MeanAbsoluteError()
            }
        )
        print(f"✅ Modelo de regresión CDR cargado. Resumen:")
        cdr_regression_model.summary(print_fn=lambda x: print(f"  {x}"))
        
        # Precalentar modelos para primera inferencia más rápida
        dummy_input = np.zeros((1, *IMG_SIZE, 3), dtype=np.float32)
        nerve_detection_model.predict(dummy_input)
        cdr_regression_model.predict(dummy_input)
        
        print("🚀 Todos los modelos cargados y listos para inferencia")
    except Exception as e:
        print("❌ Error crítico durante la carga de modelos:")
        traceback.print_exc()
        sys.exit(1)

@app.get("/", include_in_schema=False)
def health_check() -> Dict[str, Any]:
    """Endpoint de verificación de salud"""
    status = {
        "api_status": "running",
        "models_loaded": bool(nerve_detection_model and cdr_regression_model),
        "nerve_model": "loaded" if nerve_detection_model else "missing",
        "cdr_model": "loaded" if cdr_regression_model else "missing"
    }
    return status

async def validate_and_preprocess_image(file: UploadFile) -> np.ndarray:
    """Valida y preprocesa la imagen de entrada con manejo robusto de errores"""
    try:
        # Validar tipo de archivo
        if file.content_type not in ["image/jpeg", "image/png"]:
            raise HTTPException(400, "Solo se aceptan imágenes JPEG o PNG")
        
        # Leer y validar tamaño
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:  # 10MB máximo
            raise HTTPException(413, "La imagen es demasiado grande (máximo 10MB)")
        
        # Procesar imagen
        img = Image.open(BytesIO(contents))
        
        # Verificar dimensiones mínimas
        if min(img.size) < 100:
            raise HTTPException(400, "La imagen es demasiado pequeña (mínimo 100x100px)")
        
        # Convertir a RGB si es necesario
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Redimensionar manteniendo relación de aspecto
        img.thumbnail((512, 512))  # Reducción inicial
        img_resized = img.resize(IMG_SIZE, Image.Resampling.LANCZOS)
        
        # Normalización mejorada
        img_array = np.array(img_resized, dtype=np.float32) / 255.0
        
        # Verificar valores NaN/Inf
        if not np.all(np.isfinite(img_array)):
            raise HTTPException(400, "La imagen contiene valores no válidos")
            
        return np.expand_dims(img_array, axis=0)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Error al procesar la imagen: {str(e)}") from e

@app.post("/analyze/", response_model=Dict[str, Any])
async def analyze_image(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Endpoint principal para análisis de glaucoma"""
    if not nerve_detection_model or not cdr_regression_model:
        raise HTTPException(503, "Servicio no disponible temporalmente. Modelos no cargados.")
    
    try:
        # Preprocesamiento robusto
        image_array = await validate_and_preprocess_image(file)
        
        # 1. Detección de nervio óptico
        nerve_prob = nerve_detection_model.predict(image_array, verbose=0)[0][0]
        is_nerve = nerve_prob > 0.85  # Umbral más estricto
        
        if not is_nerve:
            return {
                "status": "rejected",
                "message": "No se detectó un nervio óptico con suficiente confianza",
                "confidence": float(nerve_prob),
                "suggestions": [
                    "Asegúrese de que la imagen esté bien centrada",
                    "Verifique que el enfoque sea adecuado",
                    "Intente con otra imagen más clara"
                ]
            }
        
        # 2. Predicción CDR
        cdr_pred = float(cdr_regression_model.predict(image_array, verbose=0)[0][0])
        
        # Resultado estructurado
        return {
            "status": "success",
            "is_optic_nerve": True,
            "nerve_confidence": float(nerve_prob),
            "cdr_ratio": round(cdr_pred, 3),
            "glaucoma_risk": cdr_pred > 0.5,
            "risk_level": "high" if cdr_pred > 0.7 else 
                         "moderate" if cdr_pred > 0.5 else 
                         "low",
            "recommendation": "Alto riesgo de glaucoma. Consulte a un especialista." 
                            if cdr_pred > 0.7 else
                            "Posible riesgo de glaucoma. Se recomienda evaluación oftalmológica."
                            if cdr_pred > 0.5 else
                            "Sin signos evidentes de glaucoma.",
            "analysis_details": {
                "model_versions": {
                    "nerve_detection": "1.0",
                    "cdr_regression": "1.0"
                },
                "processing_time_ms": 0  # Podrías añadir métricas reales
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error interno durante el análisis: {str(e)}") from e

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Manejador global de excepciones mejorado"""
    error_id = f"ERR-{os.urandom(4).hex()}"
    
    # Log detallado del error
    print(f"\n🔥 [{error_id}] Error no manejado en {request.url}:")
    traceback.print_exc()
    
    # Respuesta estructurada
    response = {
        "error": "internal_server_error",
        "error_id": error_id,
        "message": "Ocurrió un error inesperado. Por favor intente más tarde."
    }
    
    if isinstance(exc, HTTPException):
        response.update({
            "error": exc.status_code,
            "message": exc.detail
        })
    
    return JSONResponse(
        status_code=getattr(exc, 'status_code', 500),
        content=response,
        headers={
            "Access-Control-Allow-Origin": origins[0] if origins else "*",
            "X-Error-ID": error_id
        }
    )