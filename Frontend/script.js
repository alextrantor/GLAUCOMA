const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const resultDiv = document.getElementById('result');

// Acceder a la cámara trasera
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

// Capturar imagen y enviarla al backend
captureBtn.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  canvas.toBlob(blob => {
    if (!blob) {
      console.error("No se pudo convertir el canvas a blob.");
      resultDiv.innerHTML = "Error al procesar la imagen.";
      return;
    }

    const formData = new FormData();
    formData.append('image', blob, 'captura.jpg');

    console.log("Enviando imagen al backend...");

    fetch('https://glaucoma-ntk9.onrender.com/predict', {
      method: 'POST',
      body: formData
    })
    .then(async res => {
      let data;
      try {
        data = await res.json();
      } catch (e) {
        const raw = await res.text();
        console.error("Respuesta cruda del servidor:", raw);
        resultDiv.innerHTML = "Error al interpretar la respuesta del servidor.";
        return;
      }

      if (res.ok) {
        resultDiv.innerHTML = `<strong>Resultado:</strong> ${data.prediction}<br><strong>Confianza:</strong> ${data.confidence.toFixed(2)}`;
      } else {
        console.error("Respuesta con error:", data);
        resultDiv.innerHTML = "Error del servidor: " + JSON.stringify(data);
      }
    })
    .catch(err => {
      console.error('Error al enviar la imagen:', err);
      resultDiv.innerHTML = "Error al enviar la imagen: " + err.message;
    });

  }, 'image/jpeg');
});
