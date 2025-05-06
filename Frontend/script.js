const imageInput = document.getElementById('imageInput');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');
const previewContainer = document.getElementById('previewContainer');
const confirmButton = document.getElementById('confirmButton');
const cancelButton = document.getElementById('cancelButton');
const captureButton = document.getElementById('captureButton');
const loading = document.getElementById('loading');
const result = document.getElementById('result');

let imageToSend = null;

// Activar cámara
captureButton.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
    video.style.display = 'block';

    captureButton.textContent = 'Tomar foto';
    captureButton.onclick = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      imageToSend = dataURLToFile(canvas.toDataURL(), 'captura.jpg');
      preview.src = canvas.toDataURL();
      previewContainer.style.display = 'flex';
      video.srcObject.getTracks().forEach(track => track.stop());
      video.style.display = 'none';
    };
  } catch (err) {
    alert('No se pudo acceder a la cámara');
  }
});

// Cargar imagen
imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    previewContainer.style.display = 'flex';
    imageToSend = file;
  };
  reader.readAsDataURL(file);
});

// Cancelar imagen
cancelButton.addEventListener('click', () => {
  previewContainer.style.display = 'none';
  imageToSend = null;
});

// Confirmar imagen y enviar
confirmButton.addEventListener('click', async () => {
  if (!imageToSend) return;

  loading.style.display = 'block';
  result.textContent = '';

  const formData = new FormData();
  formData.append('image', imageToSend);

  try {
    const response = await fetch('https://glaucoma-ntk9.onrender.com/predict', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    loading.style.display = 'none';

    if (data.error) {
      result.textContent = `⚠️ ${data.error}`;
      result.style.color = '#b03838';
    } else {
      result.textContent = `🧠 Resultado: ${data.prediction} (${(data.confidence * 100).toFixed(1)}%)`;
      result.style.color = data.prediction === 'Sospecha de Glaucoma' ? '#b03838' : '#2c77b0';
    }

    previewContainer.style.display = 'none';
    imageToSend = null;
  } catch (error) {
    loading.style.display = 'none';
    result.textContent = '❌ Error al procesar la imagen.';
    result.style.color = '#b03838';
  }
});

function dataURLToFile(dataUrl, filename) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}
