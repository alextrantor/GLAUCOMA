const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const uploadInput = document.getElementById('upload');
const resultDiv = document.getElementById('result');
const loadingDiv = document.getElementById('loading');
const capturedImage = document.getElementById('capturedImage');
const capturedImageContainer = document.getElementById('capturedImageContainer');

const canvasWidth = 320;
const canvasHeight = 320;

// Inicializa la cámara
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } }
    });
    video.srcObject = stream;
  } catch (err) {
    console.error("Error al acceder a la cámara:", err);
    resultDiv.innerHTML = "No se pudo acceder a la cámara.";
  }
}

// Detiene la cámara
function stopCamera() {
  const stream = video.srcObject;
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}

// Procesa una imagen para enviar al backend
function sendImage(blob) {
  const formData = new FormData();
  formData.append('image', blob, 'captura.jpg');

  loadingDiv.style.display = 'block';
  resultDiv.innerHTML = '';
  fetch('https://glaucoma-ntk9.onrender.com/predict', {
    method: 'POST',
    body: formData
  })
    .then(async res => {
      loadingDiv.style.display = 'none';
      let data;
      try {
        data = await res.json();
      } catch (e) {
        resultDiv.innerHTML = "Respuesta no válida del servidor: " + await res.text();
        return;
      }
      if (res.ok) {
        resultDiv.innerHTML = `<strong>Resultado:</strong> ${data.prediction}<br><strong>Confianza:</strong> ${(data.confidence * 100).toFixed(1)}%`;
      } else {
        resultDiv.innerHTML = "Error: " + JSON.stringify(data);
      }
    })
    .catch(err => {
      loadingDiv.style.display = 'none';
      console.error('Error al enviar la imagen:', err);
      resultDiv.innerHTML = "Error al enviar la imagen: " + err.message;
    });
}

// Captura desde la cámara
captureBtn.addEventListener('click', () => {
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);
  stopCamera();

  const imageUrl = canvas.toDataURL('image/jpeg');
  capturedImage.src = imageUrl;
  capturedImageContainer.style.display = 'block';

  canvas.toBlob(blob => sendImage(blob), 'image/jpeg');
});

// Carga desde archivo local
uploadInput.addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

      capturedImage.src = canvas.toDataURL('image/jpeg');
      capturedImageContainer.style.display = 'block';

      canvas.toBlob(blob => sendImage(blob), 'image/jpeg');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// Reinicio automático
window.onload = startCamera;