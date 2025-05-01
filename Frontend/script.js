let currentStream;
let usingFrontCamera = false;
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');
const fileInput = document.getElementById('fileInput');
const confirmSection = document.getElementById('confirmSection');
const resultDiv = document.getElementById('result');
const loading = document.getElementById('loading');

async function startCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  try {
    currentStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: usingFrontCamera ? 'user' : 'environment' },
      audio: false
    });
    video.srcObject = currentStream;
  } catch (e) {
    alert('No se pudo acceder a la cámara.');
  }
}

document.getElementById('flipBtn').addEventListener('click', () => {
  usingFrontCamera = !usingFrontCamera;
  startCamera();
});

document.getElementById('captureBtn').addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  showPreview(canvas.toDataURL());
});

document.getElementById('uploadBtn').addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = ev => showPreview(ev.target.result);
    reader.readAsDataURL(file);
  }
});

function showPreview(dataUrl) {
  video.classList.add('hidden');
  preview.src = dataUrl;
  preview.classList.remove('hidden');
  confirmSection.classList.remove('hidden');
  resultDiv.classList.add('hidden');
}

document.getElementById('cancelBtn').addEventListener('click', () => {
  preview.classList.add('hidden');
  video.classList.remove('hidden');
  confirmSection.classList.add('hidden');
});

document.getElementById('confirmBtn').addEventListener('click', async () => {
  loading.classList.remove('hidden');
  confirmSection.classList.add('hidden');

  const blob = await fetch(preview.src).then(res => res.blob());
  const formData = new FormData();
  formData.append('image', blob, 'image.jpg');

  try {
    const nervioResponse = await fetch('https://<tu-backend>.onrender.com/validate', { method: 'POST', body: formData });
    const nervioResult = await nervioResponse.json();

    if (!nervioResult.valid) {
      loading.classList.add('hidden');
      resultDiv.textContent = 'Imagen no válida. Por favor, sube un nervio óptico.';
      resultDiv.classList.remove('hidden');
      return;
    }

    const glaucomaResponse = await fetch('https://<tu-backend>.onrender.com/predict', { method: 'POST', body: formData });
    const glaucomaResult = await glaucomaResponse.json();

    loading.classList.add('hidden');
    resultDiv.innerHTML = `Resultado: ${glaucomaResult.prediction}<br>Confianza: ${(glaucomaResult.confidence * 100).toFixed(2)}%`;
    resultDiv.classList.remove('hidden');
  } catch (e) {
    loading.classList.add('hidden');
    resultDiv.textContent = 'Error al analizar la imagen.';
    resultDiv.classList.remove('hidden');
  }
});

startCamera();
