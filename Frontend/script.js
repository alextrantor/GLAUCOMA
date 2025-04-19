const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const uploadInput = document.getElementById('upload');
const resultDiv = document.getElementById('result');
const loading = document.getElementById('loading');

// Iniciar cámara automáticamente
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
  .then(stream => {
    video.srcObject = stream;
    video.play();
  })
  .catch(err => {
    console.error("No se pudo acceder a la cámara:", err);
    resultDiv.textContent = "Error al acceder a la cámara.";
  });

function stopCamera() {
  const stream = video.srcObject;
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}

function enviarImagen(blob) {
  const formData = new FormData();
  formData.append('image', blob, 'imagen.jpg');
  loading.style.display = 'block';
  resultDiv.innerHTML = '';

  fetch('https://glaucoma-ntk9.onrender.com/predict', {
    method: 'POST',
    body: formData
  })
  .then(async res => {
    loading.style.display = 'none';
    const data = await res.json();
    if (res.ok) {
      resultDiv.innerHTML = `<strong>Resultado:</strong> ${data.prediction}<br><strong>Confianza:</strong> ${(data.confidence * 100).toFixed(2)}%`;
    } else {
      resultDiv.textContent = "Error en la predicción: " + JSON.stringify(data);
    }
  })
  .catch(err => {
    loading.style.display = 'none';
    console.error('Error al enviar imagen:', err);
    resultDiv.textContent = "Error al enviar la imagen.";
  });
}

// Capturar desde cámara
captureBtn.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  stopCamera();
  canvas.toBlob(enviarImagen, 'image/jpeg');
});

// Subir imagen desde dispositivo
uploadInput.addEventListener('change', () => {
  const file = uploadInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob(enviarImagen, 'image/jpeg');
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});
