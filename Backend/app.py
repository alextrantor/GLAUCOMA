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

# Forzar uso de CPU (útil si no tienes GPU disponible)
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'

app = FastAPI()

# CORS para permitir peticiones desde tu frontend
origins = ["https://glaucomate.netlify.app"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IMG_SIZE = (224, 224)

# Repositorio y nombres de modelos en Hugging Face
HUGGINGFACE_REPO_ID = "Glaucomate/Modelo-glaucoma"
NERVIO_MODEL_FILENAME = "modelo_deteccion_nervio_universal.h5"
CDR_MODEL_FILENAME = "modelo_regresion_cdr.h5"

nerve_detection_model = None
cdr_regression_model = None

@app.on_event("startup")
async def startup_event():
    global nerve_detection_model, cdr_regression_model
    try:
        print("🔄 Iniciando carga de modelos desde Hugging Face...")
        nerve_path = hf_hub_download(
            repo_id=HUGGINGFACE_REPO_ID,
            filename=NERVIO_MODEL_FILENAME,
            repo_type="model"
        )
        nerve_detection_model = load_model(nerve_path)
        print(f"✅ Modelo de detección de nervio cargado desde: {nerve_path}")

        cdr_path = hf_hub_download(
            repo_id=HUGGINGFACE_REPO_ID,
            filename=CDR_MODEL_FILENAME,
            repo_type="model"
        )
        cdr_regression_model = load_model(
            cdr_path,
            custom_objects={'mse': tf.keras.losses.MeanSquaredError()}
        )
        print(f"✅ Modelo de regresión CDR cargado desde: {cdr_path}")
        print("✅ Todos los modelos cargados correctamente.")
    except Exception as e:
        print("❌ Error al cargar los modelos:")
        traceback.print_exc()
        sys.exit(3)

@app.get("/")
def root():
    if nerve_detection_model and cdr_regression_model:
        return {"message": "✅ API de Glaucoma corriendo. Modelos cargados correctamente."}
    else:
        return {"message": "⚠️ API corriendo, pero los modelos NO están cargados."}

async def preprocess_image(file: UploadFile):
    try:
        contents = await file.read()
        img = Image.open(BytesIO(contents)).convert('RGB')
        
        try:
            img_resized = img.resize(IMG_SIZE, Image.Resampling.NEAREST)
        except AttributeError:
            img_resized = img.resize(IMG_SIZE, Image.NEAREST)
            
        img_array = np.array(img_resized)
        img_array = img_array / 255.0
        img_array = img_array.astype(np.float32)
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        print(f"❌ Error en preprocess_image: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Error al procesar la imagen: {str(e)}")

@app.post("/analyze/")
async def analyze_image(file: UploadFile = File(...)):
    if not nerve_detection_model or not cdr_regression_model:
        raise HTTPException(status_code=503, detail="Modelos no cargados. Intenta de nuevo en unos momentos.")

    try:
        image_array = await preprocess_image(file)
        print(f"📸 Imagen preprocesada correctamente. Shape: {image_array.shape}, dtype: {image_array.dtype}")

        nerve_probability = nerve_detection_model.predict(image_array)[0][0]
        print(f"🔍 Probabilidad de nervio óptico: {nerve_probability:.4f}")

        # Nuevo umbral alto para asegurar que sea un nervio óptico real
        is_nerve = bool(nerve_probability > 0.9)

        results = {
            "is_nerve": is_nerve,
            "cdr_prediction": None,
            "glaucoma_suspected": None
        }

        if not is_nerve:
            print("❌ Imagen rechazada: no se detectó un nervio óptico con suficiente confianza.")
            raise HTTPException(
                status_code=400,
                detail="La imagen no parece contener un nervio óptico. Intenta con otra imagen más clara y centrada."
            )

        cdr_prediction_numpy = cdr_regression_model.predict(image_array)[0][0]
        print(f"🔎 Predicción CDR: {cdr_prediction_numpy:.4f}")
        results["cdr_prediction"] = float(cdr_prediction_numpy)
        results["glaucoma_suspected"] = bool(cdr_prediction_numpy > 0.5)

        print(f"✅ Análisis completado: {results}")
        return results

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error en la predicción: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en la predicción con los modelos: {str(e)}")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"🔥 Excepción no manejada globalmente: {exc}")
    traceback.print_exc()
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers={"Access-Control-Allow-Origin": origins[0] if origins else "*"}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno en el servidor. Inténtalo más tarde."},
        headers={"Access-Control-Allow-Origin": origins[0] if origins else "*"}
    )
