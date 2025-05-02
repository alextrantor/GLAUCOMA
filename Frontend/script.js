// Elementos del DOM
const fileInput = document.getElementById('fileInput');
const takePhotoBtn = document.getElementById('takePhotoBtn');
const previewImg = document.getElementById('previewImg');
const imagePreview = document.getElementById('imagePreview');
const confirmationSection = document.getElementById('confirmationSection');
const confirmBtn = document.getElementById('confirmBtn');
const retryBtn = document.getElementById('retryBtn');
const results = document.getElementById('results');
const predictionText = document.getElementById('prediction');
const confidenceText = document.getElementById('confidence');

// Variables
let selectedImage = null;

// Capturar o seleccionar la imagen
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function () {
            previewImg.src = reader.result;
            imagePreview.style.display = 'block';
            confirmationSection.style.display = 'block';
            selectedImage = file;
        };
        reader.readAsDataURL(file);
    }
});

// Tomar foto con la cámara (utilizar una librería como WebRTC si se necesita)
takePhotoBtn.addEventListener('click', () => {
    alert("Funcionalidad de cámara aún no implementada.");
});

// Confirmar y enviar la imagen
confirmBtn.addEventListener('click', () => {
    const formData = new FormData();
    formData.append('image', selectedImage);

    // Enviar la imagen al backend
    fetch('https://glaucoma-ntk9.onrender.com/predict', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            predictionText.textContent = data.error;
        } else {
            predictionText.textContent = `Predicción: ${data.prediction}`;
            confidenceText.textContent = `Confianza: ${data.confidence.toFixed(2)}`;
        }
        results.style.display = 'block';
    })
    .catch(err => {
        predictionText.textContent = 'Error al procesar la imagen.';
        confidenceText.textContent = '';
        results.style.display = 'block';
    });
});

// Reintentar
retryBtn.addEventListener('click', () => {
    fileInput.value = '';
    imagePreview.style.display = 'none';
    confirmationSection.style.display = 'none';
    results.style.display = 'none';
});
