const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const switchCameraBtn = document.getElementById('switchCamera');
const uploadInput = document.getElementById('upload');
const resultDiv = document.getElementById('result');
const loadingDiv = document.getElementById('loading');
const capturedImage = document.getElementById('capturedImage');
const capturedImageContainer = document.getElementById('capturedImageContainer');

let currentStream = null;
let usingFrontCamera = false;

// Función para iniciar la cámara
async function startCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  try {
    const constraints = {
      video: {
        facingMode: usingFrontCamera ? "user" : { exact: "environment" }
      }
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    video.srcObject = stream;
  } catch (err) {
    if (!usingFrontCamera) {
      usingFrontCamera = true;
      startCamera();
    } else {
      resultDiv.innerHTML = "No se pudo acceder a la cámara.";
    }
  }
}

startCamera();

// Cambiar entre cámara frontal y trasera
switchCameraBtn.addEventListener('click', () => {
  usingFrontCamera = !usingFrontCamera;
  startCamera();
});

// Procesa una imagen (capturada o subida)
function processAndSendImage(imageSource) {
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    // Crear canvas cuadrado y centrar la imagen
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = "white"; // fondo blanco
    ctx.fillRect(0, 0, size, size);

    let scale = Math.min(size / img.width, size / img.height);
    let w = img.width * scale;
    let h = img.height * scale;
    let x = (size - w) / 2;
    let y = (size - h) / 2;

    ctx.drawImage(img, x, y, w, h);

    // Mostrar la imagen procesada
    const previewURL = canvas.toDataURL('image/jpeg');
    capturedImage.src = previewURL;
    capturedImageContainer.style.display = 'block';
    video.style.display = 'none';
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    loadingDiv.style.display = 'block';
    resultDiv.innerHTML = "";

    // Convertir a blob y enviar
    canvas.toBlob(blob => {
      const formData = new FormData();
      formData.append('image', blob, 'imagen.jpg');

      fetch('https://glaucoma-ntk9.onrender.com/predict', {
        method: 'POST',
        body: formData
      })
        .then(async res => {
          loadingDiv.style.display = 'none';
          const data = await res.json();
          if (res.ok) {
            resultDiv.innerHTML = `<strong>Resultado:</strong> ${data.prediction}<br><strong>Confianza:</strong> ${data.confidence.toFixed(2)}`;
          } else {
            resultDiv.innerHTML = "Error: " + JSON.stringify(data);
          }
        })
        .catch(err => {
          loadingDiv.style.display = 'none';
          resultDiv.innerHTML = "Error al enviar la imagen: " + err.message;
        });
    }, 'image/jpeg');
  };
  img.src = imageSource;
}

// Capturar imagen desde la cámara
captureBtn.addEventListener('click', () => {
  const snapshot = document.createElement('canvas');
  snapshot.width = video.videoWidth;
  snapshot.height = video.videoHeight;
  snapshot.getContext('2d').drawImage(video, 0, 0);
  const imageData = snapshot.toDataURL('image/jpeg');
  processAndSendImage(imageData
