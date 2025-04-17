const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const resultDiv = document.getElementById('result');
const loadingDiv = document.getElementById('loading');
const capturedImageContainer = document.getElementById('capturedImageContainer');
const capturedImage = document.getElementById('capturedImage');

navigator.mediaDevices.getUserMedia({
  video: { facingMode: { exact: "environment" } }
})
.then(stream => {
  video.srcObject = stream;
})
.catch(err => {
  console.error("Error al acceder a la cámara trasera:", err);
  resultDiv.innerHTML = "No se pudo acceder a la cámara trasera.";
});

captureBtn.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  // Congelar la imagen en el contenedor
  const dataURL = canvas.toDataURL('image/jpeg');
  capturedImage.src = dataURL;
  capturedImageContainer.style.display = 'block'; // Mostrar imagen capturada

  // Desactivar el botón y mostrar el mensaje de carga
  captureBtn.disabled = true;
  loadingDiv.style.display = 'block';

  canvas.toBlob(blob => {
    const formData = new FormData();
    formData.append('image', blob, 'captura.jpg');

    // Enviar la imagen al backend
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

      // Ocultar el mensaje de carga y habilitar el botón
      loadingDiv.style.display = 'none';
      captureBtn.disabled = false;
    })
    .catch(err => {
      console.error('Error al enviar imagen:', err);
      resultDiv.innerHTML = "Error al enviar la imagen: " + err.message;

      // Ocultar el mensaje de carga y habilitar el botón
      loadingDiv.style.display = 'none';
      captureBtn.disabled = false;
    });
  }, 'image/jpeg');
});

