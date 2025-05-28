// src/ResultsDisplay.jsx
import React from 'react';

function ResultsDisplay({ results, t }) {
  if (!results) {
    return (
      <div className="mt-6 p-4 border rounded-lg bg-gray-50 text-center text-gray-600">
        {t('waitingResults')}
      </div>
    );
  }

  if (results.error) {
    return (
      <div className="mt-6 p-4 border rounded-lg bg-red-100 text-red-700">
        {t('error')}
      </div>
    );
  }

  const { opticNerveDetected, predictedCDR } = results;

  if (!opticNerveDetected) {
    return (
      <div className="mt-6 p-4 border rounded-lg bg-yellow-100 text-yellow-800">
        {t('noOpticNerveMessage')}
      </div>
    );
  }

  const cdrValue = predictedCDR?.toFixed(3) || '0.000';
  const glaucomaSuspected = parseFloat(cdrValue) > 0.5;

  return (
    <div className="mt-6 p-4 border rounded-lg bg-green-50 text-gray-800">
      <h2 className="text-lg font-semibold mb-2">{t('results')}</h2>
      <p>
        {t('opticNerveDetected')}: <strong>{t('yes')}</strong>
      </p>
      <p>
        {t('cdr')}: <strong>{cdrValue}</strong>
      </p>
      <p className={`mt-2 font-semibold ${glaucomaSuspected ? 'text-red-600' : 'text-green-700'}`}>
        {glaucomaSuspected ? t('glaucomaDetectedMessage') : t('glaucomaNotDetectedMessage')}
      </p>
    </div>
  );
}

export default ResultsDisplay;
