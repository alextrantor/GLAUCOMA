from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import io
import tensorflow as tf

# Cargar el modelo de validación de nervio óptico
nervio_model = load_model('https://huggingface.co/Glaucomate/Modelo-glaucoma/blob/main/nervio_optico_modelo_mobilenet.h5', compile=False)

# Cargar el modelo de clasificación de glaucoma
glaucoma_model = load_model('https://huggingface.co/Glaucomate/Modelo-glaucoma/blob/main/modelo_clasificacion_glaucoma_mejorado.h5', compile=False)

app = Flask(__name__)

# Ruta para procesar las imágenes
@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image part'}), 400

    file = request.files['image']
    img = Image.open(file.stream).convert('RGB')
    img = img.resize((224, 224))  # Redimensionar la imagen para que coincida con la entrada del modelo

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
    app.run(debug=True, host='0.0.0.0')
