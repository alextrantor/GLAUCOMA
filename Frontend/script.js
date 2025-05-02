let selectedImageFile = null;

// Manejador para input de imagen
document.getElementById('imageInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    selectedImageFile = file;

    const reader = new FileReader();
    reader.onload = function (event) {
        const preview = document.getElementById('imagePreview');
        preview.src = event.target.result;
        preview.style.display = 'block';

        document.getElementById('imagePreviewContainer').style.display = 'block';
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('message').innerText = '';
    };
    reader.readAsDataURL(file);
});

// Botón para enviar imagen
function submitImage() {
    if (!selectedImageFile) {
        alert("Por favor selecciona o toma una imagen primero.");
        return;
    }

    const formData = new FormData();
    formData.append('image', selectedImageFile);

    document.getElementById('submitBtn').disabled = true;
    document.getElementById('message').innerText = 'Procesando imagen...';

    fetch('https://glaucoma-ntk9.onrender.com/predict', {
        method: 'POST',
        body: formData
    })
    .then(async response => {
        const data = await response.json();

        if (!response.ok || data.error) {
            document.getElementById('message').innerText = '❌ ' + (data.error || 'Error al analizar la imagen.');
            resetPreview();
            return;
        }

        const pred = data.prediction;
        const prob = (data.confidence * 100).toFixed(2);

        document.getElementById('message').innerHTML = `✅ <strong>Resultado:</strong> ${pred}<br><strong>Confianza:</strong> ${prob}%`;
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('message').innerText = '❌ Error al procesar la imagen.';
    })
    .finally(() => {
        document.getElementById('submitBtn').disabled = false;
    });
}

// Función auxiliar para reiniciar previsualización
function resetPreview() {
    selectedImageFile = null;
    document.getElementById('imageInput').value = '';
    document.getElementById('imagePreview').src = '';
    document.getElementById('imagePreviewContainer').style.display = 'none';
    document.getElementById('submitBtn').disabled = true;
}
