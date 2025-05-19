import React, { useState } from 'react';
import { Loader2, Brain } from 'lucide-react';

function AnalysisButton({ imageFile, onResults, t }) {
  const [loading, setLoading] = useState(false);
  const [checkingBackend, setCheckingBackend] = useState(false);

  const BACKEND_URL = 'https://glaucoma-ntk9.onrender.com';

  const checkBackendStatus = async () => {
    setCheckingBackend(true);
    try {
      const res = await fetch(`${BACKEND_URL}/`, { method: 'GET' });
      return res.ok;
    } catch (e) {
      return false;
    } finally {
      setCheckingBackend(false);
    }
  };

  const handleAnalysis = async () => {
    if (!imageFile) return;

    setLoading(true);

    const backendReady = await checkBackendStatus();
    if (!backendReady) {
      alert(t('startingServer') || 'El servidor está despertando, por favor espera unos segundos e intenta de nuevo.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const response = await fetch(`${BACKEND_URL}/analyze/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error en la respuesta del servidor');

      const result = await response.json();
      onResults(result);
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
      alert(t('error'));
    } finally {
      setLoading(false);
    }
  };

  if (!imageFile) return null;

  return (
    <div className="text-center mt-4">
      <button
        onClick={handleAnalysis}
        disabled={loading || checkingBackend}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow transition ${
          loading || checkingBackend
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {(loading || checkingBackend) ? (
          <>
            <Loader2 className="animate-spin w-4 h-4" />
            {checkingBackend ? t('checkingBackend') || 'Conectando...' : t('analyzing')}
          </>
        ) : (
          <>
            <Brain className="w-4 h-4" />
            {t('analyze')}
          </>
        )}
      </button>
    </div>
  );
}

export default AnalysisButton;
