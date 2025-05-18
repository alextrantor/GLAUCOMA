import os
os.environ['CUDA_VISIBLE_DEVICES'] = '-1' # Forzar uso de CPU

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from io import BytesIO
from huggingface_hub import hf_hub_download
import traceback
import sys

app = FastAPI()

# CORS para permitir peticiones desde tu frontend
origins = ["https://glaucomate.netlify.app"] # Tu frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Permite todos los métodos (GET, POST, etc.)
    allow_headers=["*"], # Permite todas las cabeceras
)

IMG_SIZE = (224, 224)
HUGGINGFACE_REPO_ID = "Glaucomate/Modelo-glaucoma"
NERVIO_MODEL_FILENAME = "modelo_deteccion_nervio_universal.h5"
CDR_MODEL_FILENAME = "modelo_regresion_cdr.h5"

nerve_detection_model = None
cdr_regression_model = None

# Carga de modelos al iniciar la aplicación
@app.on_event("startup")
async def startup_event():
    global nerve_detection_model
    global cdr_regression_model
    try:
        print("Iniciando carga de modelos...")
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
            custom_objects={'mse': tf.keras.losses.MeanSquaredError()} # Asumiendo que 'mse' fue usado así al guardar
        )
        print(f"✅ Modelo de regresión CDR cargado desde: {cdr_path}")
        print("✅ Modelos cargados exitosamente desde Hugging Face.")

    except Exception as e:
        print(f"❌ Error catastrófico al cargar los modelos durante el inicio: {e}")
        traceback.print_exc()
        # Considera si sys.exit() es la mejor estrategia o si prefieres que la app corra y falle en las predicciones.
        # sys.exit(3) puede ser muy abrupto y dificultar el diagnóstico en Render si no ves logs fácilmente.
        # Por ahora, lo dejaré para que falle en el endpoint si los modelos no están.

@app.get("/")
def root():
    return {"message": "API de Glaucoma corriendo correctamente. Modelos cargados." if nerve_detection_model and cdr_regression_model else "API de Glaucoma corriendo, PERO HUBO UN FALLO AL CARGAR MODELOS."}

# Preprocesamiento de la imagen
async def preprocess_image(file: UploadFile):
    try:
        contents = await file.read()
        # MODIFICACIÓN CLAVE: Asegurar que la imagen sea RGB (3 canales)
        img = Image.open(BytesIO(contents)).convert('RGB').resize(IMG_SIZE)
        img_array = np.array(img) / 255.0  # Normalizar
        img_array = np.expand_dims(img_array, axis=0)  # Añadir dimensión de batch (1, 224, 224, 3)
        return img_array
    except Exception as e:
        print(f"Error en preprocess_image: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Error al procesar la imagen: {e}")

# Endpoint de análisis
@app.post("/analyze/")
async def analyze_image(image_data: bytes = File(...)): # ✅ Recibe bytes directamente
    print("Recibida solicitud en /analyze/")
    if not nerve_detection_model or not cdr_regression_model:
        print("Error crítico: Intento de análisis pero los modelos no están cargados.")
        raise HTTPException(status_code=503, detail="Modelos no disponibles en el servidor. Por favor, revise los logs del servidor.")

    try:
        print("Reconstruyendo imagen desde bytes...")
        image_array = np.frombuffer(image_data, dtype=np.float32).reshape((1, IMG_SIZE[0], IMG_SIZE[1], 3))
        print(f"Forma del array de imagen para predicción: {image_array.shape}") # Muy útil para depurar
    except Exception as e:
        print(f"Error al reconstruir la imagen desde bytes: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Error al reconstruir la imagen desde los datos recibidos: {e}")

    results = {
        "is_nerve": False, # Default a False
        "cdr_prediction": None,
        "glaucoma_suspected": None
    }

    try:
        print("Realizando predicción de detección de nervio...")
        nerve_probability = nerve_detection_model.predict(image_array)[0][0]
        # IMPORTANTE: Confirma esta lógica.
        # Si nerve_probability es P(es_nervio_apto), entonces is_nerve = nerve_probability > 0.5
        # Si nerve_probability es P(es_anormal_o_no_nervio), entonces is_nerve = nerve_probability < 0.5 (para que sea apto)
        # Tu código original: is_nerve = nerve_probability < 0.5. Lo mantengo asumiendo que es intencional.
        is_nerve_bool = bool(nerve_probability < 0.5)
        results["is_nerve"] = is_nerve_bool
        print(f"Resultado detección nervio: Probabilidad={nerve_probability}, EsNervioApto={is_nerve_bool}")

        if is_nerve_bool:
            print("Realizando predicción de CDR...")
            cdr_prediction_val = cdr_regression_model.predict(image_array)[0][0]
            results["cdr_prediction"] = float(cdr_prediction_val)
            # La sospecha de glaucoma usualmente es si CDR > umbral (ej. 0.5 o 0.65)
            results["glaucoma_suspected"] = bool(cdr_prediction_val > 0.65) # Umbral de ejemplo, ajusta según tu criterio médico/modelo
            print(f"Resultado predicción CDR: ValorCDR={cdr_prediction_val}, SospechaGlaucoma={results['glaucoma_suspected']}")
        else:
            print("No se considera nervio apto, no se calculará CDR.")

    except Exception as e:
        print(f"❌ Error durante la predicción del modelo: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error del servidor durante el análisis de la imagen con el modelo: {e}")

    print(f"Resultados finales del análisis: {results}")
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
