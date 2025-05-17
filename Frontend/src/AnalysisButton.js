import React from 'react';

function AnalysisButton({ imageFile, onResults }) {
  const handleAnalyzeClick = async () => {
    if (!imageFile) {
      alert('Por favor, selecciona una imagen primero.');
      return;
    }

    const reader = new FileReader();

    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const targetSize = 224;

        // Redimensionar la imagen a 224x224
        canvas.width = targetSize;
        canvas.height = targetSize;
        ctx.drawImage(img, 0, 0, targetSize, targetSize);

        // Convertir la imagen en Blob y enviarla
        canvas.toBlob(async (blob) => {
          const formData = new FormData();
          formData.append('file', blob, 'processed_image.png'); // ✅ CAMPO CORRECTO

          try {
            const response = await fetch('https://glaucoma-ntk9.onrender.com/analyze/', {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              onResults(data);
            } else {
              alert('❌ Error al comunicarse con el backend.');
            }
          } catch (error) {
            console.error('Error de red:', error);
            alert('❌ Error de red al comunicarse con el backend.');
          }
        }, 'image/png');
      };
      img.src = event.target.result;
    };

    reader.readAsDataURL(imageFile);
  };

  return (
    <button
      onClick={handleAnalyzeClick}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={!imageFile}
    >
      Analizar imagen
    </button>
  );
}

export default AnalysisButton;
