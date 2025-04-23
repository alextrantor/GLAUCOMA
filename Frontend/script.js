const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const switchCameraBtn = document.getElementById('switchCamera');
const uploadInput = document.getElementById('uploadInput');
const resultDiv = document.getElementById('result');
const loadingDiv = document.getElementById('loading');

let stream = null;
let currentCamera = 'environment'; // 'user' para frontal

async function startCamera(facingMode = 'environment') {
  try {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode }
    });

    video.srcObject = stream;
    video.play();
    currentCamera = facingMode;
  } catch (error) {
    console.error('No se pudo acceder a la cámara:', error);
    if (facingMode === 'environment') {
      console.log('Intentando con la cámara frontal...');
      startCamera('user');
    } else {
      resultDiv.innerHTML = 'No se pudo acceder a ninguna cámara.';
    }
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}

function showLoading() {
  loadingDiv.style.display = 'block';
  resultDiv.innerHTML = '';
}

function hideLoading() {
  loadingDiv.style.display = 'none';
}

function drawAndSendImage(imageSource) {
  const ctx = canvas.getContext('2d');
  canvas.width = video.clientWidth;
  canvas.height = video.clientHeight;

  ctx.drawImage(imageSource, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(blob => {
    const formData = new FormData();
    formData.append('image', blob, 'captura.jpg');

    showLoading();

    fetch('https://glaucoma-ntk9.onrender.com/predict', {
      method: 'POST',
      body: formData
    })
    .then(async res => {
      let data;
      try {
        data = await res.json();
      } catch (e) {
        resultDiv.innerHTML = "Error al interpretar la respuesta del servidor.<br>Respuesta cruda: " + await res.text();
        return;
      }

      if (res.ok) {
        resultDiv.innerHTML = `<strong>Resultado:</strong> ${data.prediction}<br><strong>Confianza:</strong> ${data.confidence.toFixed(2)}`;
      } else {
        resultDiv.innerHTML = "Error del servidor: " + JSON.stringify(data);
      }
    })
    .catch(err => {
      resultDiv.innerHTML = "Error al enviar la imagen: " + err.message;
    })
    .finally(() => {
      hideLoading();
    });
  }, 'image/jpeg');
}

// Captura de imagen desde cámara
captureBtn.addEventListener('click', () => {
  drawAndSendImage(video);
});

// Cambio de cámara
switchCameraBtn.addEventListener('click', () => {
  const newFacingMode = currentCamera === 'environment' ? 'user' : 'environment';
  startCamera(newFacingMode);
});

// Subida de imagen desde el dispositivo
uploadInput.addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      drawAndSendImage(img);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// Iniciar con cámara trasera si es posible
startCamera();
