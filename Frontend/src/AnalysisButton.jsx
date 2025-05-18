import React from 'react';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

function ResultsDisplay({ results, t }) {
  if (!results) {
    return (
      <div className="text-center text-gray-500 italic mt-6">{t('waitingResults')}</div>
    );
  }

  return (
    <div className="mt-6 bg-blue-100 rounded-xl p-4 shadow-inner">
      <h2 className="text-lg font-bold text-blue-800 mb-3">{t('results')}</h2>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Eye className="text-blue-700 w-4 h-4" />
          <strong>{t('opticNerveDetected')}:</strong>
          <span className="ml-1">{results.optic_nerve_detected ? t('yes') : t('no')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-700 font-bold">CDR:</span>
          <span>{results.cdr || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2">
          {results.glaucoma_suspected ? (
            <XCircle className="text-red-600 w-4 h-4" />
          ) : (
            <CheckCircle className="text-green-600 w-4 h-4" />
          )}
          <strong>{t('glaucomaSuspected')}:</strong>
          <span>{results.glaucoma_suspected ? t('yes') : t('no')}</span>
        </div>
      </div>
    </div>
  );
}

export default ResultsDisplay;
