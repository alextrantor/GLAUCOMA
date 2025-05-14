from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import os
from io import BytesIO

app = FastAPI()

# CORS middleware to allow requests from your Netlify frontend
origins = ["*"]  # Adjust this to your Netlify URL in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define image size (should match your model's input size)
IMG_SIZE = (224, 224)

# Path to your saved models in Google Drive (adjust if necessary)
MODEL_PATH = '/content/drive/MyDrive/ai_glaucoma/modelos_guardados'
nerve_detection_model = None
cdr_regression_model = None

@app.on_event("startup")
async def startup_event():
    global nerve_detection_model
    global cdr_regression_model
    try:
        nerve_detection_model = load_model(os.path.join(MODEL_PATH, 'modelo_deteccion_nervio_universal.h5'))
        cdr_regression_model = load_model(os.path.join(MODEL_PATH, 'modelo_regresion_cdr.h5'),
                                          custom_objects={'mse': tf.keras.losses.MeanSquaredError()})
        print("Modelos cargados exitosamente en el backend.")
    except Exception as e:
        print(f"Error al cargar los modelos: {e}")

async def preprocess_image(file: UploadFile):
    try:
        contents = await file.read()
        img = Image.open(BytesIO(contents)).resize(IMG_SIZE)
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al procesar la imagen: {e}")

@app.post("/analyze/")
async def analyze_image(file: UploadFile = File(...)):
    if not nerve_detection_model or not cdr_regression_model:
        raise HTTPException(status_code=503, detail="Modelos no cargados.")

    image_array = await preprocess_image(file)

    # 1. Detect nerve
    nerve_probability = nerve_detection_model.predict(image_array)[0][0]
    is_nerve = nerve_probability < 0.5  # Assuming low probability means it's a nerve

    results = {"is_nerve": is_nerve, "cdr_prediction": None, "glaucoma_suspected": None}

    if is_nerve:
        # 2. Predict CDR
        cdr_prediction = cdr_regression_model.predict(image_array)[0][0]
        results["cdr_prediction"] = float(cdr_prediction)

        # 3. Classify based on CDR threshold
        cdr_threshold = 0.5
        results["glaucoma_suspected"] = cdr_prediction > cdr_threshold

    return results

# Create a requirements.txt file with the following content:
# fastapi
# uvicorn
# tensorflow
# Pillow
# python-multipart
# fastapi-cors
