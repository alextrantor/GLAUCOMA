const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const resultDiv = document.getElementById('result');
const switchCameraBtn = document.createElement('button');
switchCameraBtn.innerText = "Cambiar cámara";
switchCameraBtn.classList.add('capture-button');
document.querySelector('.camera').appendChild(switchCameraBtn);

let currentStream = null;
let usingFrontCamera = false;

// Función para iniciar la cámara
async function startCamera(facingMode = "environment") {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
      video: {
        facingMode: { exact: facingMode }
      }
    };

    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = currentStream;
    video.play();
  } catch (error) {
    if (facingMode === "environment") {
      console.warn("No se pudo acceder a la cámara trasera, intentando con la frontal.");
      usingFrontCamera = true;
      startCamera("user");
    } else {
      console.error("No se pudo acceder a ninguna cámara:", error);
      resultDiv.innerHTML = "No se pudo acceder a ninguna cámara.";
    }
  }
}

// Botón para cambiar cámara
switchCameraBtn.addEventListener('click', () => {
  usingFrontCamera = !usingFrontCamera;
  startCamera(usingFrontCamera ? "user" : "environment");
});

startCamera(); // Iniciar con cámara trasera

// Función para detener cámara
function stopCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
}

// Capturar imagen y enviarla
captureBtn.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = canvas.toDataURL('image/jpeg');
  const imgBlob = dataURLtoBlob(imageData);

  const formData = new FormData();
  formData.append('image', imgBlob, 'captura.jpg');

  resultDiv.innerHTML = "Procesando...";

  fetch('https://glaucoma-ntk9.onrender.com/predict', {
    method: 'POST',
    body: formData
  })
    .then(async res => {
      const data = await res.json();
      if (res.ok) {
        resultDiv.innerHTML = `<strong>Resultado:</strong> ${data.prediction}<br><strong>Confianza:</strong> ${data.confidence.toFixed(2)}`;
      } else {
        resultDiv.innerHTML = `Error del servidor: ${JSON.stringify(data)}`;
      }
    })
    .catch(err => {
      console.error('Error al enviar imagen:', err);
      resultDiv.innerHTML = "Error al enviar la imagen: " + err.message;
    });
});

// Convertir base64 a Blob
function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}