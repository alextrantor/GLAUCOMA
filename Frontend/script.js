const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const resultDiv = document.getElementById('result');

// Acceder automáticamente a la cámara cuando la página cargue
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

// Detener la cámara después de la captura
function stopCamera() {
  const stream = video.srcObject;
  const tracks = stream.getTracks();
  tracks.forEach(track => track.stop());
}

// Congelar la imagen y enviarla al servidor para la predicción
captureBtn.addEventListener('click', () => {
  // Congelar la imagen cuando se captura
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  // Detener el flujo de la cámara después de capturar la imagen
  stopCamera();

  // Mostrar la imagen congelada
  const imageUrl = canvas.toDataURL('image/jpeg');
  const imgElement = document.createElement('img');
  imgElement.src = imageUrl;
  resultDiv.innerHTML = ''; // Limpiar cualquier mensaje previo
  resultDiv.appendChild(imgElement); // Mostrar la imagen congelada
  
  // Enviar la imagen al backend para predicción
  canvas.toBlob(blob => {
    const formData = new FormData();
    formData.append('image', blob, 'captura.jpg');
    
    // Enviar la imagen al backend para predicción
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
        resultDiv.innerHTML += `<strong>Resultado:</strong> ${data.prediction}<br><strong>Confianza:</strong> ${data.confidence.toFixed(2)}`;
      } else {
        resultDiv.innerHTML += "Error del servidor: " + JSON.stringify(data);
      }
    })
    .catch(err => {
      console.error('Error al enviar imagen:', err);
      resultDiv.innerHTML = "Error al enviar la imagen: " + err.message;
    });
  }, 'image/jpeg');
});
