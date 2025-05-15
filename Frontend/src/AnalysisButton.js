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

        // Resize the image to 224x224 (you might need to handle aspect ratio more carefully)
        canvas.width = targetSize;
        canvas.height = targetSize;
        ctx.drawImage(img, 0, 0, targetSize, targetSize);

        // Get the image data as a Blob
        canvas.toBlob(async (blob) => {
          const formData = new FormData();
          formData.append('image', blob, 'processed_image.png'); // Send as PNG for consistency

          try {
            const response = await fetch('https://glaucoma-ntk9.onrender.com/analyze/', {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              onResults(data);
            } else {
              alert('Error al comunicarse con el backend.');
            }
          } catch (error) {
            console.error('Error de red:', error);
            alert('Error de red al comunicarse con el backend.');
          }
        }, 'image/png');
      };
      img.src = event.target.result;
    };

    reader.readAsDataURL(imageFile);
  };

  return (
    <button onClick={handleAnalyzeClick}>Analizar</button>
  );
}

export default AnalysisButton;
