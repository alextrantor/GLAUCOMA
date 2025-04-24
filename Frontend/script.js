const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const resultDiv = document.getElementById('result');
const loadingDiv = document.getElementById('loading');
const switchCameraBtn = document.getElementById('switchCameraBtn');
const captureBtn = document.getElementById('captureBtn');
const uploadBtn = document.getElementById('uploadBtn');
const uploadInput = document.getElementById('uploadInput');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');

let currentStream = null;
let useFrontCamera = false;
let currentImageBlob = null;

// ⏯ Inicializa cámara (trasera por defecto)
async function startCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  const constraints = {
    video: { facingMode: useFrontCamera ? "user" : "environment" },
    audio: false
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    currentStream = stream;
  } catch (err) {
    console.error("No se pudo acceder a la cámara:", err);
    resultDiv.textContent = "No se pudo acceder a la cámara.";
  }
}

// 🔄 Alternar entre cámaras
switchCameraBtn.addEventListener('click', () => {
  useFrontCamera = !useFrontCamera;
  startCamera();
});

// 📷 Captura desde video y muestra vista previa
captureBtn.addEventListener('click', () => {
  if (!video.srcObject) return;

  const width = 224;
  const height = 224;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, width, height);

  video.srcObject.getTracks().forEach(track => track.stop());

  canvas.toBlob(blob => {
    currentImageBlob = blob;
    showPreview(URL.createObjectURL(blob));
  }, 'image/jpeg');
});

// 📁 Subir imagen desde dispositivo
uploadBtn.addEventListener('click', () => {
  uploadInput.click();
});

uploadInput.addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const width = 224;
      const height = 224;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        currentImageBlob = blob;
        showPreview(canvas.toDataURL('image/jpeg'));
      }, 'image/jpeg');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// 👁‍🗨 Muestra vista previa y opciones
function showPreview(imageUrl) {
  previewImage.src = imageUrl;
  previewContainer.classList.remove('hidden');
  resultDiv.innerHTML = '';
  loadingDiv.classList.add('hidden');
}

// ✅ Enviar imagen confirmada al backend
confirmBtn.addEventListener('click', () => {
  if (!currentImageBlob) return;

  const formData = new FormData();
  formData.append('image', currentImageBlob, 'captura.jpg');

  previewContainer.classList.add('hidden');
  loadingDiv.classList.remove('hidden');
  resultDiv.innerHTML = '';

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
      console.error("Error al enviar imagen:", err);
      resultDiv.innerHTML = "Error al enviar la imagen: " + err.message;
    })
    .finally(() => {
      loadingDiv.classList.add('hidden');
    });
});

// ❌ Cancelar envío y reactivar cámara
cancelBtn.addEventListener('click', () => {
  previewContainer.classList.add('hidden');
  currentImageBlob = null;
  startCamera();
});

startCamera();
