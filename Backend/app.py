from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import tensorflow as tf
import os
import requests
from io import BytesIO
from tensorflow.keras.applications.mobilenet import preprocess_input
from tensorflow.keras.models import load_model

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "https://glaucomate.netlify.app"}})

IMG_SIZE = 128

# URLs directos (RAW) de Hugging Face
NERVIO_MODEL_URL = "https://huggingface.co/Glaucomate/Modelo-glaucoma/resolve/main/nervio_optico_modelo_mobilenet.h5"
GLAUCOMA_MODEL_URL = "https://huggingface.co/Glaucomate/Modelo-glaucoma/resolve/main/modelo_clasificacion_glaucoma_mejorado.h5"

# Cargar modelos desde Hugging Face (una sola vez)
def download_model(url, filename):
    if not os.path.exists(filename):
        response = requests.get(url)
        with open(filename, "wb") as f:
            f.write(response.content)

download_model(NERVIO_MODEL_URL, "modelo_nervio.h5")
download_model(GLAUCOMA_MODEL_URL, "modelo_glaucoma.h5")

modelo_nervio = load_model("modelo_nervio.h5")
modelo_glaucoma = load_model("modelo_glaucoma.h5")


def preprocess_image(file):
    try:
        image = Image.open(file).convert("RGB")
        image = image.resize((IMG_SIZE, IMG_SIZE))
        array = np.expand_dims(preprocess_input(np.array(image)), axis=0)
        return array
    except Exception as e:
        raise ValueError(f"Error procesando imagen: {e}")

@app.route('/')
def home():
    return "API operativa para detección de glaucoma y validación de nervio óptico."

@app.route('/predict_nervio', methods=['POST'])
def predict_nervio():
    if 'image' not in request.files:
        return jsonify({'error': 'No se proporcionó ninguna imagen.'}), 400

    try:
        img_array = preprocess_image(request.files['image'])
        prediction = modelo_nervio.predict(img_array)[0]
        label = 'Nervio' if np.argmax(prediction) == 0 else 'No Nervio'
        confidence = float(np.max(prediction))
        return jsonify({'prediction': label, 'confidence': confidence})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict_glaucoma():
    if 'image' not in request.files:
        return jsonify({'error': 'No se proporcionó ninguna imagen.'}), 400

    try:
        img_array = preprocess_image(request.files['image'])
        prediction = modelo_glaucoma.predict(img_array)[0]
        label = 'Normal' if np.argmax(prediction) == 0 else 'Sospecha de Glaucoma'
        confidence = float(np.max(prediction))
        return jsonify({'prediction': label, 'confidence': confidence})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)