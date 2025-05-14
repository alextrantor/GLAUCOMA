import React from 'react';

function AnalysisButton({ imageFile, onResults }) { // Added onResults prop
  const handleAnalyzeClick = async () => {
    if (!imageFile) {
      alert('Por favor, selecciona una imagen primero.');
      return;
    }

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await fetch('https://glaucoma-ntk9.onrender.com/analyze/', { // Reemplaced placeholder URL
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onResults(data); // Call the onResults function to update the state in App
      } else {
        alert('Error al comunicarse con el backend.');
      }
    } catch (error) {
      console.error('Error de red:', error);
      alert('Error de red al comunicarse con el backend.');
    }
  };

  return (
    <button onClick={handleAnalyzeClick}>Analizar</button>
  );
}

export default AnalysisButton;
