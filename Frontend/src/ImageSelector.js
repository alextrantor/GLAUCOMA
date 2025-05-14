import React, { useState, useRef } from 'react';

function ImageSelector({ onImageSelected }) {
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      onImageSelected(file); // Pass the selected file to the parent component
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div>
      <h2>Seleccionar Imagen</h2>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        ref={fileInputRef}
      />
      <button onClick={handleButtonClick}>Cargar Imagen</button>
      {selectedImage && (
        <div>
          <h3>Imagen Seleccionada:</h3>
          <img src={selectedImage} alt="Vista previa" style={{ maxWidth: '300px', maxHeight: '300px' }} />
        </div>
      )}
    </div>
  );
}

export default ImageSelector;
