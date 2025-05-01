from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import tensorflow as tf
import requests
import io
import os

app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": "https://glaucomate.netlify.app"}})

# Cargar modelos desde Hugging Face
nervio_optico_model_url = 'https://huggingface.co/Glaucomate/Modelo-glaucoma/blob/main/nervio_optico_modelo_mobilenet.h5'
glaucoma_model_url = 'https://huggingface.co/Glaucomate/Modelo-glaucoma/blob/main/modelo_clasificacion_glaucoma_mejorado.h5'

# Función para cargar modelos desde Hugging Face
def load_model_from_huggingface(model_url):
    model_file = requests.get(model_url).content
    model = tf.keras.models.load_model(io.BytesIO(model_file))
    return model

nervio_optico_model = load_model_from_huggingface(nervio_optico_model_url)
glaucoma_model = load_model_from_huggingface(glaucoma_model_url)

IMG_SIZE = 224  # Tamaño de imagen adecuado para MobileNet

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No se encontró imagen.'}), 400
    
    file = request.files['image']
    try:
        # Procesar la imagen y convertirla
        img = Image.open(file).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)  # Añadir dimensión de batch
    except Exception as e:
        return jsonify({'error': f'Error al procesar la imagen: {str(e)}'}), 500

    # Verificar si es un nervio óptico
    nervio_optico_prediction = nervio_optico_model.predict(img_array)
    nervio_optico_detectado = nervio_optico_prediction[0][0] > 0.5  # Umbral de detección

    if not nervio_optico_detectado:
        return jsonify({'nervio_optico': 'No detectado', 'glaucoma': '', 'probabilidad_glaucoma': 0.0})

    # Si se detecta un nervio óptico, predecir glaucoma
    glaucoma_prediction = glaucoma_model.predict(img_array)
    probabilidad_glaucoma = glaucoma_prediction[0][0]

    if probabilidad_glaucoma > 0.5:
        glaucoma_result = 'Sospecha de glaucoma'
    else:
        glaucoma_result = 'Sin sospecha de glaucoma'

    return jsonify({
        'nervio_optico': 'Detectado',
        'glaucoma': glaucoma_result,
        'probabilidad_glaucoma': probabilidad_glaucoma
    })

@app.route('/', methods=['GET'])
def home():
    return "API de detección de glaucoma operativa."

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
