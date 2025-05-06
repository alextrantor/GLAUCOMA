from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import os
import requests

app = Flask(__name__)

# URLs de Hugging Face
NERVIO_URL = "https://huggingface.co/Glaucomate/Modelo-glaucoma/resolve/main/nervio_optico_modelo_mobilenet.h5"
GLAUCOMA_URL = "https://huggingface.co/Glaucomate/Modelo-glaucoma/resolve/main/modelo_clasificacion_glaucoma_mejorado.h5"

# Rutas locales donde se guardarán los modelos
NERVIO_MODEL_PATH = "nervio_model.h5"
GLAUCOMA_MODEL_PATH = "glaucoma_model.h5"

# Descargar si no existen
def download_model(url, filename):
    if not os.path.exists(filename):
        print(f"Descargando modelo desde {url}...")
        response = requests.get(url)
        with open(filename, "wb") as f:
            f.write(response.content)
        print(f"Modelo guardado en {filename}.")

# Descargar modelos al iniciar
download_model(NERVIO_URL, NERVIO_MODEL_PATH)
download_model(GLAUCOMA_URL, GLAUCOMA_MODEL_PATH)

# Cargar modelos
nervio_model = load_model(NERVIO_MODEL_PATH)
glaucoma_model = load_model(GLAUCOMA_MODEL_PATH)

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No se encontró imagen'}), 400

    file = request.files['image']
    try:
        img = Image.open(file.stream).convert('RGB')
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
    except Exception as e:
        return jsonify({'error': f'Error al procesar la imagen: {str(e)}'}), 500

    try:
        nervio_pred = nervio_model.predict(img_array)[0][0]
        if nervio_pred < 0.5:
            return jsonify({'error': 'Imagen no válida: no se detecta nervio óptico'}), 400

        glaucoma_pred = glaucoma_model.predict(img_array)[0]
        labels = ['Normal', 'Sospecha de Glaucoma']
        max_index = int(np.argmax(glaucoma_pred))
        confidence = float(np.max(glaucoma_pred))

        return jsonify({
            'prediction': labels[max_index],
            'confidence': confidence
        })
    except Exception as e:
        return jsonify({'error': f'Error en la predicción: {str(e)}'}), 500

@app.route('/', methods=['GET'])
def home():
    return "Backend de detección de glaucoma operativo."

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 10000)))
