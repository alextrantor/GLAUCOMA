const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const uploadInput = document.getElementById('upload');
const preview = document.getElementById('capturedImage');
const previewContainer = document.getElementById('previewContainer');
const loading = document.getElementById('loading');
const resultDiv = document.getElementById('result');

let stream;
let currentFacingMode = "environment";

async function initCamera(facingMode = "environment") {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
    video.srcObject = stream;
    video.play();
  } catch (err) {
    if (facingMode === "environment") {
      initCamera("user");
    } else {
      resultDiv.innerText = "No se pudo acceder a la cámara.";
    }
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}

function standardizeImage(img, callback) {
  const tempCanvas = document.createElement('canvas');
  const size = 128;
  tempCanvas.width = size;
  tempCanvas.height = size;
  const ctx = tempCanvas.getContext('2d');
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, size, size);

  const aspect = img.width / img.height;
  let drawWidth, drawHeight, offsetX, offsetY;

  if (aspect > 1) {
    drawWidth = size;
    drawHeight = size / aspect;
    offsetX = 0;
    offsetY = (size - drawHeight) / 2;
  } else {
    drawHeight = size;
    drawWidth = size * aspect;
    offsetX = (size - drawWidth) / 2;
    offsetY = 0;
  }

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  callback(tempCanvas);
}

function showPreview(dataUrl) {
  preview.src = dataUrl;
  previewContainer.style.display = "block";
  loading.style.display = "none";
}

function sendToServer(blob) {
  loading.style.display = "block";
  resultDiv.innerHTML = "";

  const formData = new FormData();
  formData.append('image', blob, 'image.jpg');

  fetch('https://glaucoma-ntk9.onrender.com/predict', {
    method: 'POST',
    body: formData
  })
    .then(async res => {
      let data;
      try {
        data = await res.json();
      } catch (e) {
        resultDiv.innerHTML = "Error en la respuesta del servidor: " + await res.text();
        return;
      }

      if (res.ok) {
        resultDiv.innerHTML = `<strong>Resultado:</strong> ${data.prediction}<br><strong>Confianza:</strong> ${data.confidence.toFixed(2)}`;
      } else {
        resultDiv.innerHTML = "Error: " + JSON.stringify(data);
      }
    })
    .catch(err => {
      resultDiv.innerHTML = "Error al enviar imagen: " + err.message;
    })
    .finally(() => {
      loading.style.display = "none";
    });
}

// Captura de imagen desde la cámara
captureBtn.addEventListener('click', () => {
  stopCamera();
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  const image = new Image();
  image.onload = () => {
    standardizeImage(image, standardized => {
      standardized.toBlob(blob => {
        showPreview(standardized.toDataURL('image/jpeg'));
        sendToServer(blob);
      }, 'image/jpeg');
    });
  };
  image.src = canvas.toDataURL('image/jpeg');
});

// Subida de imagen desde archivo
uploadInput.addEventListener('change', (e) => {
  if (e.target.files.length === 0) return;
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function (evt) {
    const image = new Image();
    image.onload = () => {
      standardizeImage(image, standardized => {
        standardized.toBlob(blob => {
          showPreview(standardized.toDataURL('image/jpeg'));
          sendToServer(blob);
        }, 'image/jpeg');
      });
    };
    image.src = evt.target.result;
  };
  reader.readAsDataURL(file);
});

// Iniciar con la cámara trasera si es posible
initCamera();
