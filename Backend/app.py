from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import requests
from tensorflow.keras.preprocessing import image
from io import BytesIO
from PIL import Image

# Inicializar Flask
app = Flask(__name__)

# Cargar los modelos desde Hugging Face
MODEL_NERVIO_URL = 'https://huggingface.co/Glaucomate/Modelo-glaucoma/blob/main/nervio_optico_modelo_mobilenet.h5'
MODEL_GLACOMA_URL = 'https://huggingface.co/Glaucomate/Modelo-glaucoma/blob/main/modelo_clasificacion_glaucoma_mejorado.h5'

# Cargar los modelos
nervio_optico_modelo = tf.keras.models.load_model(MODEL_NERVIO_URL)
glaucoma_modelo = tf.keras.models.load_model(MODEL_GLACOMA_URL)

# Función para preprocesar la imagen
def preprocess_image(img):
    img = img.resize((224, 224))
    img_array = np.array(img) / 255.0  # Normalización
    img_array = np.expand_dims(img_array, axis=0)  # Agregar batch dimension
    return img_array

@app.route('/analizar/', methods=['POST'])
def analizar_imagen():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    # Leer la imagen
    img = Image.open(BytesIO(file.read()))
    
    # 1. Evaluar si es un nervio óptico
    img_array = preprocess_image(img)
    nervio_prediccion = nervio_optico_modelo.predict(img_array)
    
    # Si no se detecta un nervio óptico
    if nervio_prediccion[0] < 0.5:
        return jsonify({"nervio_optico": "No detectado"}), 200
    
    # 2. Evaluar la sospecha de glaucoma
    glaucoma_prediccion = glaucoma_modelo.predict(img_array)
    glaucoma_probabilidad = glaucoma_prediccion[0][0]  # Si es un valor continuo, para sigmoide
    
    resultado_glaucoma = "Sospecha de glaucoma" if glaucoma_probabilidad > 0.5 else "Sin sospecha de glaucoma"
    
    # Responder con los resultados
    return jsonify({
        "nervio_optico": "Detectado",
        "glaucoma": resultado_glaucoma,
        "probabilidad_glaucoma": glaucoma_probabilidad
    }), 200

if __name__ == '__main__':
    app.run(debug=True)
