const imageUpload = document.getElementById('image-upload');
const imagePreview = document.getElementById('image-preview');
const confirmBtn = document.getElementById('confirm-btn');
const retryBtn = document.getElementById('retry-btn');
const resultContainer = document.getElementById('result-container');
const resultNervioOptico = document.getElementById('result-nervio-optico');
const resultGlaucoma = document.getElementById('result-glaucoma');
const probabilidadGlaucoma = document.getElementById('probabilidad-glaucoma');

// Manejador de carga de imagen
imageUpload.addEventListener('change', handleImageUpload);

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                imagePreview.innerHTML = '';
                imagePreview.appendChild(img);
                confirmBtn.style.display = 'inline-block';
                retryBtn.style.display = 'inline-block';
            };
        };
        reader.readAsDataURL(file);
    }
}

// Confirmar la imagen para procesarla
confirmBtn.addEventListener('click', () => {
    const formData = new FormData();
    formData.append('file', imageUpload.files[0]);

    fetch('http://localhost:5000/analizar/', { // Cambia la URL por la de tu backend
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.nervio_optico === "No detectado") {
            resultNervioOptico.innerHTML = "No se detectó un nervio óptico en la imagen.";
            resultGlaucoma.innerHTML = "";
            probabilidadGlaucoma.innerHTML = "";
        } else {
            resultNervioOptico.innerHTML = "Nervio óptico detectado.";
            resultGlaucoma.innerHTML = "Resultado de glaucoma: " + data.glaucoma;
            probabilidadGlaucoma.innerHTML = "Probabilidad de glaucoma: " + (data.probabilidad_glaucoma * 100).toFixed(2) + "%";
        }
        resultContainer.style.display = 'block';
    })
    .catch(error => {
        console.error('Error al procesar la imagen:', error);
    });
});

// Volver a intentar subir otra imagen
retryBtn.addEventListener('click', () => {
    imagePreview.innerHTML = '<p>No se ha subido ninguna imagen.</p>';
    resultContainer.style.display = 'none';
    confirmBtn.style.display = 'none';
    retryBtn.style.display = 'none';
    imageUpload.value = ''; // Limpiar el input
});
