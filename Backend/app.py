from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.efficientnet import preprocess_input
from PIL import Image
import numpy as np
import os

app = Flask(__name__)
model = load_model("Backend/modelo_clasificacion_glaucoma_mejorado.h5")

IMG_SIZE = 128

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No se encontró imagen.'}), 400

    file = request.files['image']
    print(f"Recibida la imagen con nombre: {file.filename}")  # Log para verificar que la imagen llega
    try:
        img = Image.open(file).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
        img_array = np.expand_dims(preprocess_input(np.array(img)), axis=0)

        pred = model.predict(img_array)[0]
        label = 'Normal' if np.argmax(pred) == 0 else 'Sospecha de Glaucoma'

        return jsonify({
            'prediction': label,
            'confidence': float(np.max(pred))
        })
    except Exception as e:
        print(f"Error al procesar la imagen: {e}")  # Log de error
        return jsonify({'error': 'Error al procesar la imagen.'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
