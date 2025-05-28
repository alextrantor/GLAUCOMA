// src/AnalysisButton.jsx
import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = 'https://glaucoma-ntk9.onrender.com';

function AnalysisButton({ imageFile, onResults, t }) {
  const [loading, setLoading] = useState(false);

  const analyzeImage = async () => {
    if (!imageFile) return;

    setLoading(true);
    onResults(null);

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      // Paso 1: Validar si es nervio óptico
      const validateResponse = await axios.post(`${BACKEND_URL}/validate`, formData);
      const isOpticNerve = validateResponse.data.is_optic_nerve;

      if (!isOpticNerve) {
        onResults({
          opticNerveDetected: false,
          message: t('noOpticNerveMessage'),
        });
        setLoading(false);
        return;
      }

      // Paso 2: Si es nervio óptico, estimar CDR
      const analyzeResponse = await axios.post(`${BACKEND_URL}/analyze`, formData);
      const predictedCDR = analyzeResponse.data.predicted_cdr;
      const glaucomaSuspected = predictedCDR >= 0.5;

      onResults({
        opticNerveDetected: true,
        predictedCDR,
        glaucomaSuspected,
        message: glaucomaSuspected
          ? t('glaucomaDetectedMessage')
          : t('glaucomaNotDetectedMessage'),
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      onResults({
        error: true,
        message: t('error'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center my-4">
      <button
        onClick={analyzeImage}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
        disabled={!imageFile || loading}
      >
        {loading ? t('loading') : t('analyze')}
      </button>
    </div>
  );
}

export default AnalysisButton;
