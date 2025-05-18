import React, { useState } from 'react';
import ImageSelector from './ImageSelector';
import ImageDisplay from './ImageDisplay';
import AnalysisButton from './AnalysisButton';
import ResultsDisplay from './ResultsDisplay';
import { translations } from './i18n';

function App() {
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [language, setLanguage] = useState('es');

  const t = (key) => translations[language][key] || key;

  return (
    <div className="min-h-screen bg-blue-50 text-gray-800 p-4">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">{t('title')}</h1>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label={t('languageSelect')}
          >
            <option value="es">🇪🇸 Español</option>
            <option value="en">🇬🇧 English</option>
          </select>
        </div>

        <ImageSelector onImageSelected={setSelectedImageFile} t={t} />
        <ImageDisplay imageFile={selectedImageFile} t={t} />
        <AnalysisButton imageFile={selectedImageFile} onResults={setAnalysisResults} t={t} />
        <ResultsDisplay results={analysisResults} t={t} />
      </div>
    </div>
  );
}

export default App;
