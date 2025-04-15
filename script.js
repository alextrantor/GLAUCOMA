
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const resultDiv = document.getElementById('result');

navigator.mediaDevices.getUserMedia({ 
  video: { facingMode: { exact: "environment" } } 
})
.then(stream => {
  video.srcObject = stream;
})
.catch(err => {
  console.error("Error al acceder a la cámara trasera:", err);
  alert("No se pudo acceder a la cámara trasera.");
});

captureBtn.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  canvas.toBlob(blob => {
    const formData = new FormData();
    formData.append('image', blob, 'captura.jpg');
    
    fetch('https://glaucoma-ntk9.onrender.com/predict', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      resultDiv.innerHTML = `<strong>Resultado:</strong> ${data.prediction}<br><strong>Confianza:</strong> ${data.confidence.toFixed(2)}`;
    })
    .catch(err => {
      console.error('Error en la predicción:', err);
      resultDiv.textContent = "Ocurrió un error al procesar la imagen.";
    });
  }, 'image/jpeg');
});
