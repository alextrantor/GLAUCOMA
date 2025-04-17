from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.efficientnet import preprocess_input
from PIL import Image
import numpy as np
import os

# Crear la app Flask y habilitar CORS
app = Flask(__name__)
CORS(app)

# Ruta absoluta al modelo dentro de la carpeta Backend
model_path = os.path.join(os.path.dirname(__file__), "modelo_clasificacion_glaucoma_mejorado.h5")
model = load_model(model_path)

IMG_SIZE = 128

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No se encontró imagen.'}), 400

    try:
        file = request.files['image']
        img = Image.open(file).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
        img_array = np.expand_dims(preprocess_input(np.array(img)), axis=0)

        pred = model.predict(img_array)[0]
        label = 'Normal' if np.argmax(pred) == 0 else 'Sospecha de Glaucoma'

        return jsonify({
            'prediction': label,
            'confidence': float(np.max(pred))
        })

    except Exception as e:
        return jsonify({'error': f'Error al procesar la imagen: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)



