import React from 'react';
import ImageSelector from './ImageSelector';
import ImageDisplay from './ImageDisplay';
import AnalysisButton from './AnalysisButton';
import ResultsDisplay from './ResultsDisplay';

function App() {
  return (
    <div>
      <h1>Glaucoma Screening Tool</h1>
      <ImageSelector />
      <ImageDisplay />
      <AnalysisButton />
      <ResultsDisplay />
    </div>
  );
}

export default App;
