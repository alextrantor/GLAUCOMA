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
  resultDiv.innerHTML = "No se pudo acceder a la cámara trasera.";
});

captureBtn.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  // Ver imagen antes de enviarla
  const imageURL = canvas.toDataURL('image/jpeg');
  const imgElement = new Image();
  imgElement.src = imageURL;
  document.body.appendChild(imgElement);  // Muestra la imagen en la página para verificar

  canvas.toBlob(blob => {
    // Reducir el tamaño de la imagen antes de enviarla (por ejemplo, a 500 KB)
    const maxSize = 500 * 1024;  // 500 KB
    if (blob.size > maxSize) {
      const imgElement = new Image();
      imgElement.src = canvas.toDataURL('image/jpeg', 0.7);  // Ajusta calidad (0.7 es el 70%)
      document.body.appendChild(imgElement);  // Muestra la imagen comprimida

      imgElement.onload = () => {
        canvas.width = imgElement.width;
        canvas.height = imgElement.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgElement, 0, 0);

        canvas.toBlob(newBlob => {
          const formData = new FormData();
          formData.append('image', newBlob, 'captura_comprimida.jpg');
          
          fetch('https://glaucoma-ntk9.onrender.com/predict', {
            method: 'POST',
            body: formData
          })
          .then(async res => {
            const rawText = await res.text();
            console.log("Respuesta cruda del backend:", rawText);
            
            try {
              const data = JSON.parse(rawText);
              resultDiv.innerHTML = `<strong>Resultado:</strong> ${data.prediction}<br><strong>Confianza:</strong> ${data.confidence.toFixed(2)}`;
            } catch (e) {
              resultDiv.innerHTML = "Error al interpretar JSON.<br>Respuesta cruda: " + rawText;
            }
          })
          .catch(err => {
            console.error('Error al enviar imagen:', err);
            resultDiv.innerHTML = "Error al enviar la imagen: " + err.message;
          });
        }, 'image/jpeg');
      };
    } else {
      // Si la imagen no es muy grande, enviarla directamente
      const formData = new FormData();
      formData.append('image', blob, 'captura.jpg');
      
      fetch('https://glaucoma-ntk9.onrender.com/predict', {
        method: 'POST',
        body: formData
      })
      .then(async res => {
        const rawText = await res.text();
        console.log("Respuesta cruda del backend:", rawText);
        
        try {
          const data = JSON.parse(rawText);
          resultDiv.innerHTML = `<strong>Resultado:</strong> ${data.prediction}<br><strong>Confianza:</strong> ${data.confidence.toFixed(2)}`;
        } catch (e) {
          resultDiv.innerHTML = "Error al interpretar JSON.<br>Respuesta cruda: " + rawText;
        }
      })
      .catch(err => {
        console.error('Error al enviar imagen:', err);
        resultDiv.innerHTML = "Error al enviar la imagen: " + err.message;
      });
    }
  }, 'image/jpeg');
});

