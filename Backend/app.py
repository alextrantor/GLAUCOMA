from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.efficientnet import preprocess_input
from huggingface_hub import hf_hub_download
from PIL import Image
import numpy as np
import os

app = Flask(__name__)

# --- Parámetros ---
IMG_SIZE = 128

# --- Cargar el modelo desde Hugging Face ---
try:
    model_path = hf_hub_download(
        repo_id="Glacomate/modelo-glaucoma",
        filename="modelo_clasificacion_glaucoma_mejorado.h5"
    )
    model = load_model(model_path)
    print("✅ Modelo cargado correctamente desde Hugging Face.")
except Exception as e:
    print(f"❌ Error al cargar el modelo: {e}")
    model = None

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No se encontró imagen.'}), 400

    file = request.files['image']
    
    try:
        img = Image.open(file).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
        img_array = np.expand_dims(preprocess_input(np.array(img)), axis=0)
        print("🖼️ Imagen procesada correctamente.")
    except Exception as e:
        return jsonify({'error': f'Error al procesar la imagen: {str(e)}'}), 500

    try:
        pred = model.predict(img_array)[0]
        label = 'Normal' if np.argmax(pred) == 0 else 'Sospecha de Glaucoma'
        confidence = float(np.max(pred))
        print(f"🔍 Predicción: {label}, Confianza: {confidence:.4f}")
    except Exception as e:
        return jsonify({'error': f'Error en la predicción: {str(e)}'}), 500

    return jsonify({
        'prediction': label,
        'confidence': confidence
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    print(f"🚀 Servidor corriendo en el puerto {port}")
    app.run(host='0.0.0.0', port=port)
