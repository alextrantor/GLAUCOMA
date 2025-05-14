import React, { useState } from 'react';
import ImageSelector from './ImageSelector';
import ImageDisplay from './ImageDisplay';
import AnalysisButton from './AnalysisButton';
import ResultsDisplay from './ResultsDisplay';

function App() {
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  const handleImageSelected = (file) => {
    setSelectedImageFile(file);
    // Aquí podrías actualizar el componente ImageDisplay si lo deseas
  };

  return (
    <div>
      <h1>Glaucoma Screening Tool</h1>
      <ImageSelector onImageSelected={handleImageSelected} />
      <ImageDisplay imageFile={selectedImageFile} />
      <AnalysisButton imageFile={selectedImageFile} />
      <ResultsDisplay />
    </div>
  );
}

export default App;
