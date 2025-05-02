const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const previewImage = document.getElementById('previewImage');
const resultText = document.getElementById('resultText');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');

let stream;
let usingFrontCamera = false;
let capturedBlob = null;

// Mostrar imagen para confirmar
function showPreview(blob) {
  const url = URL.createObjectURL(blob);
  previewImage.src = url;
  document.getElementById('previewSection').style.display = 'block';
  video.style.display = 'none';
}

// Reiniciar vista
function reset() {
  document.getElementById('previewSection').style.display = 'none';
  resultText.textContent = '';
  video.style.display = 'block';
  capturedBlob = null;
}

// Capturar imagen del video
document.getElementById('captureBtn').onclick = () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  canvas.toBlob(blob => {
    capturedBlob = blob;
    showPreview(blob);
  }, 'image/jpeg');
};

// Subir imagen desde dispositivo
document.getElementById('uploadBtn').onclick = () => {
  document.getElementById('uploadInput').click();
};

document.getElementById('uploadInput').onchange = (e) => {
  const file = e.target.files[0];
  if (file) {
    capturedBlob = file;
    showPreview(file);
  }
};

// Cambiar entre cámaras
document.getElementById('flipBtn').onclick = () => {
  usingFrontCamera = !usingFrontCamera;
  startCamera();
};

// Confirmar y enviar al backend
confirmBtn.onclick = async () => {
  if (!capturedBlob) return;

  resultText.textContent = 'Analizando...';

  const formData = new FormData();
  formData.append('image', capturedBlob);

  try {
    const response = await fetch('https://render-backend-url.com/predict', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      resultText.textContent = `${data.prediction} (Confianza: ${(data.confidence * 100).toFixed(1)}%)`;
    } else {
      resultText.textContent = data.error || 'Error al analizar imagen';
    }
  } catch (error) {
    resultText.textContent = 'Fallo en el envío al servidor';
    console.error(error);
  }

  document.getElementById('previewSection').style.display = 'none';
};

// Cancelar envío
cancelBtn.onclick = reset;
document.getElementById('resetBtn').onclick = reset;

// Activar cámara
async function startCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: usingFrontCamera ? 'user' : 'environment'
      }
    });

    video.srcObject = stream;
  } catch (err) {
    alert('No se pudo acceder a la cámara');
  }
}

document.getElementById('cameraBtn').onclick = startCamera;
