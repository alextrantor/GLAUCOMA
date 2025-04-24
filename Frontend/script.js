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

// Iniciar cámara
async function startCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  const constraints = {
    video: {
      facingMode: usingFrontCamera ? "user" : { exact: "environment" }
    }
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    video.srcObject = stream;
    video.play();
    video.style.display = 'block';
  } catch (err) {
    console.warn("No se encontró cámara trasera, intentando frontal...");
    if (!usingFrontCamera) {
      usingFrontCamera = true;
      startCamera();
    } else {
      resultDiv.innerHTML = "No se pudo acceder a la cámara.";
    }
  }
}

startCamera();

// Cambiar cámara
switchCameraBtn.addEventListener('click', () => {
  usingFrontCamera = !usingFrontCamera;
  startCamera();
});

// Procesar imagen estandarizada y enviarla
function processImage(imageSource) {
  const img = new Image();
  img.onload = () => {
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, size, size);

    const scale = Math.min(size / img.width, size / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (size - w) / 2;
    const y = (size - h) / 2;
    ctx.drawImage(img, x, y, w, h);

    const previewURL = canvas.toDataURL('image/jpeg');
    capturedImage.src = previewURL;
    capturedImageContainer.style.display = 'block';
    video.style.display = 'none';
    if (currentStream) currentStream.getTracks().forEach(track => track.stop());

    loadingDiv.style.display = 'block';
    resultDiv.innerHTML = "";

    canvas.toBlob(blob => {
      const formData = new FormData();
      formData.append('image', blob, 'image.jpg');

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
            resultDiv.innerHTML = "Error del servidor: " + JSON.stringify(data);
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

// Capturar imagen desde cámara
captureBtn.addEventListener('click', () => {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = video.videoWidth;
  tempCanvas.height = video.videoHeight;
  tempCanvas.getContext('2d').drawImage(video, 0, 0);
  const imageData = tempCanvas.toDataURL('image/jpeg');
  processImage(imageData);
});

// Cargar imagen desde el dispositivo
uploadInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    processImage(reader.result);
  };
  reader.readAsDataURL(file);
});
