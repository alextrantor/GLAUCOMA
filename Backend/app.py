from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from PIL import Image
import numpy as np
import tensorflow as tf
import requests
from io import BytesIO
import traceback

app = FastAPI()

# Permitir acceso desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Puedes restringir esto a tu dominio de frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tamaño esperado por los modelos
IMG_SIZE = (224, 224)

# Rutas de modelos en Hugging Face
NERVO_MODEL_URL = "https://huggingface.co/Glaucomate/Modelo-glaucoma/resolve/main/nervio_optico_modelo_mobilenet.h5"
GLAUCOMA_MODEL_URL = "https://huggingface.co/Glaucomate/Modelo-glaucoma/resolve/main/modelo_clasificacion_glaucoma_mejorado.h5"

# Inicializar modelos como None
nerve_detection_model = None
cdr_regression_model = None

# Cargar modelo desde Hugging Face
def load_model_from_hf(url):
    response = requests.get(url)
    if response.status_code == 200:
        with BytesIO(response.content) as model_bytes:
            return tf.keras.models.load_model(model_bytes)
    else:
        raise Exception(f"Error al descargar modelo desde {url}")

@app.on_event("startup")
def load_models():
    global nerve_detection_model, cdr_regression_model
    try:
        print("🔄 Cargando modelos desde Hugging Face...")
        nerve_detection_model = load_model_from_hf(NERVO_MODEL_URL)
        print("✅ Modelo de detección de nervio cargado.")
        cdr_regression_model = load_model_from_hf(GLAUCOMA_MODEL_URL)
        print("✅ Modelo de clasificación de glaucoma cargado.")
    except Exception as e:
        print(f"❌ Error al cargar modelos: {e}")
        traceback.print_exc()

@app.post("/analyze/")
async def analyze_image(file: UploadFile = File(...)):
    print("📥 Recibida solicitud en /analyze/")
    
    if not nerve_detection_model or not cdr_regression_model:
        print("❌ Modelos no están cargados.")
        raise HTTPException(status_code=503, detail="Modelos no disponibles.")

    try:
        contents = await file.read()
        img = Image.open(BytesIO(contents)).convert('RGB').resize(IMG_SIZE)
        img_array = np.array(img) / 255.0
        image_array = np.expand_dims(img_array, axis=0).astype(np.float32)
        print(f"✅ Imagen preprocesada. Shape: {image_array.shape}")
    except Exception as e:
        print(f"❌ Error al procesar imagen: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Error al procesar la imagen: {e}")

    results = {
        "is_nerve": False,
        "cdr_prediction": None,
        "glaucoma_suspected": None
    }

    try:
        print("🔍 Realizando predicción de nervio óptico...")
        nerve_prob = nerve_detection_model.predict(image_array)[0][0]
        is_nerve_bool = bool(nerve_prob < 0.5)  # lógica del modelo binario
        results["is_nerve"] = is_nerve_bool
        print(f"📊 Probabilidad nervio: {nerve_prob:.4f} -> ¿Es nervio?: {is_nerve_bool}")

        if is_nerve_bool:
            print("🔬 Realizando predicción de CDR...")
            cdr_val = cdr_regression_model.predict(image_array)[0][0]
            results["cdr_prediction"] = float(cdr_val)
            results["glaucoma_suspected"] = bool(cdr_val > 0.65)
            print(f"📈 CDR: {cdr_val:.4f} -> ¿Sospecha de glaucoma?: {results['glaucoma_suspected']}")
        else:
            print("🛑 Imagen no válida como nervio óptico.")

    except Exception as e:
        print(f"❌ Error durante la predicción: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error durante la predicción: {e}")

    return JSONResponse(content=results)