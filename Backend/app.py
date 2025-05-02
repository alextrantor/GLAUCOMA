from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import os
import requests
import tensorflow as tf

app = Flask(__name__)

# URLs de los modelos en Hugging Face (archivos directos, no vista HTML)
NERVIO_MODEL_URL = "https://huggingface.co/Glaucomate/Modelo-glaucoma/resolve/main/nervio_optico_modelo_mobilenet.h5"
GLAUCOMA_MODEL_URL = "https://huggingface.co/Glaucomate/Modelo-glaucoma/resolve/main/modelo_clasificacion_glaucoma_mejorado.h5"

# Nombres de los archivos locales
NERVIO_MODEL_PATH = "nervio_model.h5"
GLAUCOMA_MODEL_PATH = "glaucoma_model.h5"

# Función para descargar el modelo si no está
def download_model(url, filename):
    if not os.path.exists(filename):
        print(f"Descargando modelo: {filename}")
        response = requests.get(url)
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f"Modelo {filename} descargado.")

# Descargar modelos si es necesario
download_model(NERVIO_MODEL_URL, NERVIO_MODEL_PATH)
download_model(GLAUCOMA_MODEL_URL, GLAUCOMA_MODEL_PATH)

# Cargar los modelos
nervio_model = load_model(NERVIO_MODEL_PATH)
glaucoma_model = load_model(GLAUCOMA_MODEL_PATH)

# Endpoint de predicción
@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No se encontró la imagen.'}), 400

    file = request.files['image']

    try:
        # Procesar imagen
        img = Image.open(file.stream).convert("RGB")
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        # Predicción de validación de nervio óptico
        nervio_pred = nervio_model.predict(img_array)[0][0]
        if nervio_pred < 0.5:
            return jsonify({'error': 'La imagen no contiene un nervio óptico.'}), 400

        # Predicción de glaucoma
        glaucoma_pred = glaucoma_model.predict(img_array)[0]
        label = 'Normal' if np.argmax(glaucoma_pred) == 0 else 'Sospecha de Glaucoma'
        confidence = float(np.max(glaucoma_pred))

        return jsonify({
            'prediction': label,
            'confidence': confidence
        })

    except Exception as e:
        return jsonify({'error': f'Error al procesar la imagen: {str(e)}'}), 500

@app.route('/', methods=['GET'])
def home():
    return "API de detección de glaucoma y validación de nervio óptico activa."

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
