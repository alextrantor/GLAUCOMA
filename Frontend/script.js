let video = document.querySelector("#video");
let captureBtn = document.querySelector("#captureBtn");
let uploadInput = document.querySelector("#uploadInput");
let previewContainer = document.querySelector("#previewContainer");
let confirmBtn = document.querySelector("#confirmBtn");
let cancelBtn = document.querySelector("#cancelBtn");
let resultContainer = document.querySelector("#resultContainer");
let resultText = document.querySelector("#resultText");
let resetBtn = document.querySelector("#resetBtn");
let selectedImageBlob = null;
let stream = null;
let usingBackCamera = true;

async function setupCamera() {
    try {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === "videoinput");
        const constraints = {
            video: {
                facingMode: usingBackCamera ? "environment" : "user"
            }
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        await video.play();
    } catch (err) {
        alert("No se pudo acceder a la cámara.");
    }
}

captureBtn.addEventListener("click", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 224;
    canvas.height = 224;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, 224, 224);
    canvas.toBlob(blob => {
        selectedImageBlob = blob;
        showPreview(blob);
    }, "image/jpeg");
});

uploadInput.addEventListener("change", event => {
    const file = event.target.files[0];
    if (file) {
        selectedImageBlob = file;
        showPreview(file);
    }
});

function showPreview(blob) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.src = e.target.result;
        img.className = "preview-image";
        previewContainer.innerHTML = "";
        previewContainer.appendChild(img);
        confirmBtn.style.display = "inline-block";
        cancelBtn.style.display = "inline-block";
    };
    reader.readAsDataURL(blob);
}

confirmBtn.addEventListener("click", () => {
    if (selectedImageBlob) {
        sendImage(selectedImageBlob);
    }
});

cancelBtn.addEventListener("click", () => {
    selectedImageBlob = null;
    previewContainer.innerHTML = "";
    confirmBtn.style.display = "none";
    cancelBtn.style.display = "none";
    resultContainer.style.display = "none";
});

resetBtn.addEventListener("click", () => {
    window.location.reload();
});

async function sendImage(imageBlob) {
    resultText.textContent = "Analizando imagen...";
    resultContainer.style.display = "block";

    const formData = new FormData();
    formData.append("image", imageBlob);

    try {
        // Paso 1: Validar si es un nervio óptico
        const response1 = await fetch("https://glaucoma-ntk9.onrender.com/validate", {
            method: "POST",
            body: formData
        });

        const result1 = await response1.json();

        if (response1.status !== 200 || !result1.valid) {
            resultText.textContent = "La imagen no corresponde a un nervio óptico. Por favor, intenta con otra.";
            return;
        }

        // Paso 2: Enviar al modelo de glaucoma
        const response2 = await fetch("https://glaucoma-ntk9.onrender.coms/predict", {
            method: "POST",
            body: formData
        });

        const result2 = await response2.json();

        if (response2.status !== 200) {
            throw new Error(result2.error || "Error al procesar la imagen");
        }

        resultText.textContent = `${result2.prediction} (Confianza: ${(result2.confidence * 100).toFixed(1)}%)`;

    } catch (error) {
        resultText.textContent = `Error: ${error.message}`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setupCamera();
});
