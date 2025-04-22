from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
from tensorflow.keras.applications.efficientnet import preprocess_input
from model_loader import get_model
import os

app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": "https://glaucomate.netlify.app"}})  # Configuración de CORS para tu frontend

# Cargar modelo
model = get_model()

IMG_SIZE = 128

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No se encontró imagen.'}), 400

    file = request.files['image']
    try:
        img = Image.open(file).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
        img_array = np.expand_dims(preprocess_input(np.array(img)), axis=0)
    except Exception as e:
        return jsonify({'error': f'Error al procesar la imagen: {str(e)}'}), 500

    try:
        pred = model.predict(img_array)[0]
        label = 'Normal' if np.argmax(pred) == 0 else 'Sospecha de Glaucoma'
        confidence = float(np.max(pred))
    except Exception as e:
        return jsonify({'error': f'Error en la predicción: {str(e)}'}), 500

    return jsonify({
        'prediction': label,
        'confidence': confidence
    })

@app.route('/', methods=['GET'])
def home():
    return "API de detección de glaucoma operativa."

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
