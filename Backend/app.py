import requests
from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import io
import tensorflow as tf
from tensorflow.keras.preprocessing import image

app = Flask(__name__)

# Función para descargar el modelo desde Hugging Face
def download_model(url):
    response = requests.get(url)
    if response.status_code == 200:
        # Guardar el modelo en un archivo temporal en memoria
        return tf.keras.models.load_model(io.BytesIO(response.content))
    else:
        raise Exception(f"Error al descargar el modelo: {response.status_code}")

# Descargar los modelos de Hugging Face
nervio_model_url = 'https://huggingface.co/Glaucomate/Modelo-glaucoma/blob/main/nervio_optico_modelo_mobilenet.h5'
glaucoma_model_url = 'https://huggingface.co/Glaucomate/Modelo-glaucoma/blob/main/modelo_clasificacion_glaucoma_mejorado.h5'

try:
    nervio_model = download_model(nervio_model_url)
    glaucoma_model = download_model(glaucoma_model_url)
    print("Modelos cargados correctamente.")
except Exception as e:
    print(f"Error al cargar los modelos: {str(e)}")

# Ruta para procesar las imágenes
@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image part'}), 400
    
    file = request.files['image']
    img = Image.open(file.stream).convert('RGB')
    img = img.resize((224, 224))  # Redimensionar la imagen

    # Convertir la imagen en array
    img_array = np.array(img) / 255.0  # Normalizar la imagen
    img_array = np.expand_dims(img_array, axis=0)

    # Verificar si la imagen es de un nervio óptico
    nervio_pred = nervio_model.predict(img_array)
    if nervio_pred[0] < 0.5:  # Si no es un nervio óptico
        return jsonify({'error': 'Imagen no válida'}), 400

    # Si es un nervio óptico, predecir glaucoma
    glaucoma_pred = glaucoma_model.predict(img_array)
    prediction = 'Normal' if glaucoma_pred[0][0] < 0.5 else 'Sospecha de Glaucoma'
    confidence = float(np.max(glaucoma_pred))

    return jsonify({
        'prediction': prediction,
        'confidence': confidence
    })

if __name__ == '__main__':
    app.run(debug=True)
