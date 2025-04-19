# model_loader.py
import os
from huggingface_hub import hf_hub_download
from tensorflow.keras.models import load_model

MODEL_PATH = "modelo_clasificacion_glaucoma_mejorado.h5"
HUGGINGFACE_REPO = "Glaucomate/Modelo-glaucoma"
FILENAME = "modelo_clasificacion_glaucoma_mejorado.h5"

def get_model():
    if not os.path.exists(MODEL_PATH):
        print("Descargando modelo desde Hugging Face...")
        hf_hub_download(repo_id=HUGGINGFACE_REPO, filename=FILENAME, local_dir=".", local_dir_use_symlinks=False)
    return load_model(MODEL_PATH)
