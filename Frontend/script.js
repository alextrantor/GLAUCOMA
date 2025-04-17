const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const resultDiv = document.getElementById('result');
let stream;
let capturedImageBlob;

navigator.mediaDevices.getUserMedia({ 
  video: { facingMode: { exact: "environment" } } 
})
.then(s => {
  stream = s;
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

  // Mostrar la imagen capturada antes de detener la cámara
  canvas.toBlob(blob => {
    capturedImageBlob = blob;
    const img = document.createElement('img');
    img.src = URL.createObjectURL(blob);
    resultDiv.innerHTML = ''; // Limpiar cualquier mensaje anterior
    resultDiv.appendChild(img); // Mostrar la imagen capturada
    resultDiv.innerHTML += '<br><strong>Procesando imagen...</strong>'; // Mensaje de proceso

    // Detener la cámara después de capturar la imagen
    stream.getTracks().forEach(track => track.stop());

    const formData = new FormData();
    formData.append('image', blob, 'captura.jpg');

    // Enviar la imagen al backend para la predicción
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
        resultDiv.innerHTML += `<br><button id="takeAnother">Tomar otra foto</button>`;
        
        // Mostrar opción de tomar otra foto
        document.getElementById('takeAnother').addEventListener('click', () => {
          // Activar la cámara nuevamente
          navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: { exact: "environment" } } 
          }).then(s => {
            stream = s;
            video.srcObject = stream;
            resultDiv.innerHTML = ""; // Limpiar resultados previos
          }).catch(err => {
            console.error("Error al acceder a la cámara trasera:", err);
            resultDiv.innerHTML = "No se pudo acceder a la cámara trasera.";
          });
        });
      } else {
        resultDiv.innerHTML = "Error del servidor: " + JSON.stringify(data);
      }
    })
    .catch(err => {
      console.error('Error al enviar imagen:', err);
      resultDiv.innerHTML = "Error al

