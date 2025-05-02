const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const previewContainer = document.getElementById("previewContainer");
const confirmButton = document.getElementById("confirmButton");
const cancelButton = document.getElementById("cancelButton");
const resultContainer = document.getElementById("resultContainer");
const predictionText = document.getElementById("predictionText");
const resetButton = document.getElementById("resetButton");

let selectedFile = null;

imageInput.addEventListener("change", (e) => {
  selectedFile = e.target.files[0];
  if (!selectedFile) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    imagePreview.src = event.target.result;
    previewContainer.style.display = "flex";
  };
  reader.readAsDataURL(selectedFile);
});

cancelButton.addEventListener("click", () => {
  previewContainer.style.display = "none";
  imageInput.value = "";
  selectedFile = null;
});

confirmButton.addEventListener("click", async () => {
  if (!selectedFile) return;

  const formData = new FormData();
  formData.append("image", selectedFile);

  predictionText.innerText = "Analizando imagen...";
  resultContainer.classList.remove("hidden");

  try {
    // Paso 1: Validar si es imagen de nervio
    const nervioRes = await fetch("https://tubackend.onrender.com/predict_nervio", {
      method: "POST",
      body: formData,
    });

    const nervioData = await nervioRes.json();

    if (!nervioRes.ok || nervioData.prediction !== "Nervio") {
      predictionText.innerText = "La imagen no parece ser de un nervio óptico. Intenta con otra.";
      return;
    }

    // Paso 2: Si es válida, enviar al modelo de glaucoma
    const glaucomaRes = await fetch("https://tubackend.onrender.com/predict", {
      method: "POST",
      body: formData,
    });

    const result = await glaucomaRes.json();

    if (!glaucomaRes.ok) {
      predictionText.innerText = "Error en la predicción de glaucoma.";
      return;
    }

    // Mostrar predicción más probable
    predictionText.innerText = `Diagnóstico: ${result.prediction} (Confianza: ${(result.confidence * 100).toFixed(1)}%)`;

  } catch (error) {
    predictionText.innerText = "Error al procesar la imagen.";
    console.error(error);
  }
});

resetButton.addEventListener("click", () => {
  resultContainer.classList.add("hidden");
  previewContainer.style.display = "none";
  imageInput.value = "";
  selectedFile = null;
});