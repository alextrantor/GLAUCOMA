const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const fileInput = document.getElementById('fileInput');
const resultDiv = document.getElementById('result');
const capturedImage = document.getElementById('capturedImage');
const capturedContainer = document.getElementById('capturedImageContainer');
const loading = document.getElementById('loading');
const retryBtn = document.getElementById('retry');
const switchCamBtn = document.getElementById('switchCamera');

let currentStream = null;
let usingFrontCamera = false;

function stopCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
}

async function startCamera(facingMode = "environment") {
  stopCamera();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
    currentStream = stream;
    video.srcObject = stream;
    video.play();
  } catch (err) {
    console.warn("No se pudo usar la cámara solicitada, intentando con otra...");
    if (facingMode === "environment") {
      startCamera("user");
      usingFrontCamera = true;
    } else {
      resultDiv.innerHTML = "No se pudo acceder a la cámara.";
    }
  }
}

// Cambiar entre cámaras
switchCamBtn.addEventListener('click', () => {
  usingFrontCamera = !usingFrontCamera;
  const mode = usingFrontCamera ? "user" : "environment";
  startCamera(mode);
});

// Reiniciar cámara
retryBtn.addEventListener('click', () => {
  resultDiv.innerHTML = '';
  capturedContainer.style.display = 'none';
  video.style.display = 'block';
  startCamera(usingFrontCamera ? "user" : "environment");
});

// Capturar imagen desde cámara
captureBtn.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const dataURL = canvas.toDataURL('image/jpeg');
  video.style.display = 'none';
  stopCamera();

  capturedImage.src = dataURL;
  capturedContainer.style.display = 'block';

  sendToServer(canvas);
});

// Subir imagen desde archivo
fileInput.addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    capturedImage.src = e.target.result;
    capturedContainer.style.display = 'block';
    video.style.display = 'none';
  };
  reader.readAsDataURL(file);

  sendToServer(file);
});

// Enviar imagen al backend
function sendToServer(imageSource) {
  resultDiv.innerHTML = '';
  loading.style.display = 'block';

  const formData = new FormData();
  if (imageSource instanceof Blob) {
    formData.append('image', imageSource, 'captura.jpg');
  } else if (imageSource instanceof HTMLCanvasElement) {
    imageSource.toBlob(blob => {
      formData.append('image', blob, 'captura.jpg');
      makeRequest(formData);
    }, 'image/jpeg');
    return;
  } else if (imageSource instanceof File) {
    formData.append('image', imageSource);
  }

  makeRequest(formData);
}

function makeRequest(formData) {
  fetch('https://glaucoma-ntk9.onrender.com/predict', {
    method: 'POST',
    body: formData
  })
    .then(async res => {
      loading.style.display = 'none';
      let data;
      try {
        data = await res.json();
      } catch (e) {
        resultDiv.innerHTML = "Error al interpretar la respuesta del servidor.";
        return;
      }

      if (res.ok) {
        resultDiv.innerHTML = `<strong>Resultado:</strong> ${data.prediction}<br><strong>Confianza:</strong> ${data.confidence.toFixed(2)}`;
      } else {
        resultDiv.innerHTML = `Error del servidor: ${JSON.stringify(data)}`;
      }
    })
    .catch(err => {
      loading.style.display = 'none';
      resultDiv.innerHTML = "Error al enviar la imagen: " + err.message;
    });
}

// Iniciar cámara al cargar
window.addEventListener('load', () => {
  startCamera();
});
