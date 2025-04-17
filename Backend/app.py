from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.efficientnet import preprocess_input
from PIL import Image
import numpy as np
import os

app = Flask(__name__)

# Cargar el modelo de clasificación
try:
    model = load_model("modelo_clasificacion_glaucoma_mejorado.h5")
    print("Modelo cargado correctamente.")
except Exception as e:
    print(f"Error al cargar el modelo: {e}")
    model = None

IMG_SIZE = 128

@app.route('/predict', methods=['POST'])
def predict():
    # Comprobar si la imagen está presente en la solicitud
    if 'image' not in request.files:
        return jsonify({'error': 'No se encontró imagen.'}), 400

    file = request.files['image']
    
    try:
        # Intentar abrir y procesar la imagen
        img = Image.open(file).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
        img_array = np.expand_dims(preprocess_input(np.array(img)), axis=0)
        print("Imagen procesada correctamente.")
    except Exception as e:
        return jsonify({'error': f'Error al procesar la imagen: {str(e)}'}), 500

    try:
        # Realizar la predicción
        pred = model.predict(img_array)[0]
        label = 'Normal' if np.argmax(pred) == 0 else 'Sospecha de Glaucoma'
        confidence = float(np.max(pred))
        print(f"Predicción: {label}, Confianza: {confidence}")
    except Exception as e:
        return jsonify({'error': f'Error en la predicción: {str(e)}'}), 500

    # Devolver la respuesta con la predicción y la confianza
    return jsonify({
        'prediction': label,
        'confidence': confidence
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    print(f"Servidor corriendo en el puerto {port}")
    app.run(host='0.0.0.0', port=port)
