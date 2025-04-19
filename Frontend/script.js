const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const resultDiv = document.getElementById('result');
const uploadInput = document.getElementById('uploadInput');
const capturedImageContainer = document.getElementById('capturedImageContainer');
const capturedImage = document.getElementById('capturedImage');

// Iniciar la cámara trasera
navigator.mediaDevices.getUserMedia({
  video: { facingMode: { exact: "environment" } }
})
.then(stream => {
  video.srcObject = stream;
  video.play();
})
.catch(err => {
  console.error("Error al acceder a la cámara trasera:", err);
  resultDiv.innerHTML = "No se pudo acceder a la cámara trasera.";
});

function stopCamera() {
  const stream = video.srcObject;
  const tracks = stream ? stream.getTracks() : [];
  tracks.forEach(track => track.stop());
}

// Función para enviar imagen (desde cámara o archivo)
function enviarImagen(blob) {
  const formData = new FormData();
  formData.append('image', blob, 'imagen.jpg');

  resultDiv.innerHTML = "Procesando...";

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
    console.error('Error al enviar imagen:', err);
    resultDiv.innerHTML = "Error al enviar la imagen: " + err.message;
  });
}

// Captura desde cámara
captureBtn.addEventListener('click', () => {
  const ctx = canvas.getContext('2d');
  canvas.width = 300;
  canvas.height = 300;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Detener la cámara
  stopCamera();

  const imageUrl = canvas.toDataURL('image/jpeg');
  capturedImage.src = imageUrl;
  capturedImageContainer.style.display = 'block';

  canvas.toBlob(blob => {
    enviarImagen(blob);
  }, 'image/jpeg');
});

// Cargar imagen desde archivo
uploadInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const ctx = canvas.getContext('2d');
      canvas.width = 300;
      canvas.height = 300;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageUrl = canvas.toDataURL('image/jpeg');
      capturedImage.src = imageUrl;
      capturedImageContainer.style.display = 'block';

      canvas.toBlob(blob => {
        enviarImagen(blob);
      }, 'image/jpeg');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});
