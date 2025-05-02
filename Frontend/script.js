// Variables globales
let selectedImage = null;
let videoStream = null;
const videoElement = document.getElementById('video');
const previewContainer = document.getElementById('previewContainer');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');
const resetBtn = document.getElementById('resetBtn');
const resultContainer = document.getElementById('resultContainer');
const resultText = document.getElementById('resultText');

// Configuración del video
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        videoElement.srcObject = stream;
        videoStream = stream;
    } catch (error) {
        console.error("Error al acceder a la cámara:", error);
    }
}

setupCamera();

// Captura de imagen
document.getElementById('captureBtn').addEventListener('click', async () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    selectedImage = canvas.toDataURL('image/jpeg');
    const imgElement = document.createElement('img');
    imgElement.src = selectedImage;
    previewContainer.innerHTML = '';
    previewContainer.appendChild(imgElement);

    // Mostrar botones de confirmación
    confirmBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
});

// Cancelar la captura
cancelBtn.addEventListener('click', () => {
    previewContainer.innerHTML = '';
    confirmBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
});

// Confirmar la captura y enviar la imagen para validación
confirmBtn.addEventListener('click', () => {
    validateImage(selectedImage);
    confirmBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
});

// Reiniciar la interfaz
resetBtn.addEventListener('click', () => {
    previewContainer.innerHTML = '';
    resultContainer.style.display = 'none';
    document.getElementById('uploadInput').style.display = 'inline-block';
    document.getElementById('captureBtn').style.display = 'inline-block';
});

// Enviar la imagen al backend para validación
async function validateImage(imageData) {
    try {
        const formData = new FormData();
        const imageBlob = dataURLToBlob(imageData);
        formData.append('image', imageBlob, 'image.jpg');

        const response = await fetch('https://tu-backend-url/predict', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.error) {
            resultText.innerHTML = `Error: ${result.error}`;
            resultContainer.style.display = 'block';
            return;
        }

        if (result.prediction === 'Normal') {
            resultText.innerHTML = `Predicción: Normal (Confianza: ${result.confidence.toFixed(2)})`;
        } else {
            resultText.innerHTML = `Predicción: Sospecha de Glaucoma (Confianza: ${result.confidence.toFixed(2)})`;
        }

        resultContainer.style.display = 'block';
    } catch (error) {
        resultText.innerHTML = `Error al procesar la imagen: ${error.message}`;
        resultContainer.style.display = 'block';
    }
}

// Función para convertir la imagen base64 a Blob
function dataURLToBlob(dataUrl) {
    const [header, base64Data] = dataUrl.split(',');
    const mime = header.split(':')[1].split(';')[0];
    const byteString = atob(base64Data);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uintArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
        uintArray[i] = byteString.charCodeAt(i);
    }

    return new Blob([uintArray], { type: mime });
}
