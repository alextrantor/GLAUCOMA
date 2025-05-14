import React from 'react';

function ImageDisplay({ imageFile }) {
  const imageUrl = imageFile ? URL.createObjectURL(imageFile) : null;

  return (
    <div>
      <h2>Imagen Seleccionada</h2>
      {imageUrl && (
        <img src={imageUrl} alt="Vista previa" style={{ maxWidth: '300px', maxHeight: '300px' }} />
      )}
      {!imageUrl && <p>No se ha seleccionado ninguna imagen.</p>}
    </div>
  );
}

export default ImageDisplay;
