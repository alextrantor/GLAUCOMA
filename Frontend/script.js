const uploadInput = document.getElementById("uploadInput");
const captureButton = document.getElementById("captureButton");
const confirmButton = document.getElementById("confirmButton");
const cancelButton = document.getElementById("cancelButton");
const cameraSelect = document.getElementById("cameraSelect");
const resultDiv = document.getElementById("result");
const previewImage = document.getElementById("previewImage");
const video = document.getElementById("video");

let currentStream = null;
let capturedImageBlob = null;

// Mostrar resultado
function showResult(message, isError = false) {
    resultDiv.innerText = message;
    resultDiv.style.color = isError ? "red" : "green";
    resultDiv.style.display = "block";
}

// Iniciar cámara
async function startCamera(facingMode = "environment") {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    try {
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: false
        });
        video.srcObject = currentStream;
    } catch (err) {
        showResult("Error al acceder a la cámara", true);
    }
}

// Capturar imagen
captureButton.onclick = () => {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(blob => {
        capturedImageBlob = blob;
        previewImage.src = URL.createObjectURL(blob);
        previewImage.style.display = "block";
        confirmButton.style.display = "inline-block";
        cancelButton.style.display = "inline-block";
        resultDiv.style.display = "none";
        video.style.display = "none";
    }, "image/jpeg");
};

// Subir desde dispositivo
uploadInput.onchange = event => {
    const file = event.target.files[0];
    if (file) {
        capturedImageBlob = file;
        previewImage.src = URL.createObjectURL(file);
        previewImage.style.display = "block";
        confirmButton.style.display = "inline-block";
        cancelButton.style.display = "inline-block";
        resultDiv.style.display = "none";
        video.style.display = "none";
    }
};

// Cancelar
cancelButton.onclick = () => {
    previewImage.src = "";
    previewImage.style.display = "none";
    confirmButton.style.display = "none";
    cancelButton.style.display = "none";
    resultDiv.style.display = "none";
    video.style.display = "block";
    capturedImageBlob = null;
};

// Confirmar envío
confirmButton.onclick = async () => {
    if (!capturedImageBlob) return;

    showResult("Analizando imagen...", false);

    const formData = new FormData();
    formData.append("image", capturedImageBlob);

    try {
        // Paso 1: validación de nervio óptico
        const nervioResponse = await fetch("https://backend-glaucomate.onrender.com/predict_nervio", {
            method: "POST",
            body: formData
        });

        const nervioData = await nervioResponse.json();

        if (!nervioResponse.ok || nervioData.prediction !== "nervio óptico") {
            showResult("La imagen no contiene un nervio óptico. Intenta con otra.", true);
            return;
        }

        // Paso 2: validación de glaucoma
        const glaucomaResponse = await fetch("https://backend-glaucomate.onrender.com/predict", {
            method: "POST",
            body: formData
        });

        const glaucomaData = await glaucomaResponse.json();

        if (!glaucomaResponse.ok) {
            throw new Error(glaucomaData.error || "Error en el análisis de glaucoma.");
        }

        showResult(`${glaucomaData.prediction} (Confianza: ${(glaucomaData.confidence * 100).toFixed(1)}%)`);

    } catch (error) {
        showResult("Error al procesar la imagen. Intenta nuevamente.", true);
        console.error(error);
    }
};

// Invertir cámara
cameraSelect.onclick = () => {
    const currentFacing = video.dataset.facing === "environment" ? "user" : "environment";
    video.dataset.facing = currentFacing;
    startCamera(currentFacing);
};

// Iniciar al cargar
window.onload = () => {
    video.dataset.facing = "environment";
    startCamera("environment");
};
