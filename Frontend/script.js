const imageInput = document.getElementById('imageInput');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');
const previewContainer = document.getElementById('previewContainer');
const confirmButton = document.getElementById('confirmButton');
const cancelButton = document.getElementById('cancelButton');
const captureButton = document.getElementById('captureButton');
const loading = document.getElementById('loading');
const result = document.getElementById('result');

let imageToSend = null;

async function resizeImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const resizeCanvas = document.createElement('canvas');
            const ctx = resizeCanvas.getContext('2d');
            resizeCanvas.width = 224;
            resizeCanvas.height = 224;
            ctx.drawImage(img, 0, 0, 224, 224);
            resizeCanvas.toBlob(resolve, 'image/jpeg', 0.8); // Ajusta el formato y la calidad si es necesario
        };
        img.onerror = reject;
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function dataURLToFile(dataUrl, filename) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
}

// Activar cámara
captureButton.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
        video.style.display = 'block';

        captureButton.textContent = 'Tomar foto';
        captureButton.onclick = async () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);

            const capturedImageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
            const resizedImageBlob = await resizeImage(capturedImageBlob);
            imageToSend = new File([resizedImageBlob], 'captura_resized.jpg', { type: 'image/jpeg' });

            preview.src = URL.createObjectURL(imageToSend); // Usar URL.createObjectURL para previsualizar el Blob
            previewContainer.style.display = 'flex';
            video.srcObject.getTracks().forEach(track => track.stop());
            video.style.display = 'none';
        };
    } catch (err) {
        alert('No se pudo acceder a la cámara');
    }
});

// Cargar imagen
imageInput.addEventListener('change', async () => {
    const file = imageInput.files[0];
    if (!file) return;

    const resizedImageBlob = await resizeImage(file);
    imageToSend = new File([resizedImageBlob], file.name, { type: file.type });
    preview.src = URL.createObjectURL(imageToSend); // Usar URL.createObjectURL para previsualizar el Blob
    previewContainer.style.display = 'flex';
});

// Cancelar imagen
cancelButton.addEventListener('click', () => {
    previewContainer.style.display = 'none';
    imageToSend = null;
    preview.src = ''; // Limpiar la previsualización
});

// Confirmar imagen y enviar
confirmButton.addEventListener('click', async () => {
    if (!imageToSend) return;

    loading.style.display = 'block';
    result.textContent = '';

    const formData = new FormData();
    formData.append('image', imageToSend);

    try {
        const response = await fetch('https://glaucoma-ntk9.onrender.com/predict', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        loading.style.display = 'none';

        if (data.error) {
            result.textContent = `⚠️ ${data.error}`;
            result.style.color = '#b03838';
        } else {
            result.textContent = `🧠 Resultado: ${data.prediction} (${(data.confidence * 100).toFixed(1)}%)`;
            result.style.color = data.prediction === 'Sospecha de Glaucoma' ? '#b03838' : '#2c77b0';
        }

        previewContainer.style.display = 'none';
        imageToSend = null;
        preview.src = ''; // Limpiar la previsualización
    } catch (error) {
        loading.style.display = 'none';
        result.textContent = '❌ Error al procesar la imagen.';
        result.style.color = '#b03838';
    }
});
