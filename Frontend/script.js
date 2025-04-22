const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const fileInput = document.getElementById('fileInput');
const resultDiv = document.getElementById('result');
const loading = document.getElementById('loading');
const resetBtn = document.getElementById('reset');
const capturedImage = document.getElementById('capturedImage');
const capturedImageContainer = document.getElementById('capturedImageContainer');

let stream = null;

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } }
    });
    video.srcObject = stream;
  } catch (err) {
    console.error("No se pudo acceder a la cámara:", err);
    resultDiv.innerHTML = `<p class="error">No se pudo acceder a la cámara trasera.</p>`;
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}

// Captura de imagen desde cámara
captureBtn.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageUrl = canvas.toDataURL('image/jpeg');
  capturedImage.src = imageUrl;
  capturedImageContainer.style.display = 'block';
  sendImage(canvas);
  stopCamera();
});

// Subida de imagen desde archivo
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file || !file.type.startsWith('image/')) {
    resultDiv.innerHTML = `<p class="error">Archivo no válido. Selecciona una imagen.</p>`;
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 128, 128);
      capturedImage.src = canvas.toDataURL('image/jpeg');
      capturedImageContainer.style.display = 'block';
      sendImage(canvas);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

// Reiniciar
resetBtn.addEventListener('click', () => {
  capturedImageContainer.style.display = 'none';
  resultDiv.innerHTML = '';
  fileInput.value = '';
  startCamera();
});

// Enviar imagen al backend
function sendImage(canvasElement) {
  loading.style.display = 'block';
  resultDiv.innerHTML = '';

  canvasElement.toBlob(blob => {
    console.log('Tipo de blob:', typeof blob, blob); // Añadido para inspeccionar 'blob'
    const formData = new FormData();
    formData.append('image', blob, 'captura.jpg');

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
          resultDiv.innerHTML = `<p class="error">Error al interpretar la respuesta del servidor.</p>`;
          return;
        }

        if (res.ok) {
          resultDiv.innerHTML = `
            <p><strong>Resultado:</strong> ${data.prediction}</p>
            <p><strong>Confianza:</strong> ${(data.confidence * 100).toFixed(2)}%</p>
          `;
        } else {
          resultDiv.innerHTML = `<p class="error">Error del servidor: ${JSON.stringify(data)}</p>`;
        }
      })
      .catch(err => {
        loading.style.display = 'none';
        resultDiv.innerHTML = `<p class="error">Error al enviar la imagen: ${err.message}</p>`;
      });
  }, 'image/jpeg');
}

// Iniciar cámara al cargar la página
startCamera();
