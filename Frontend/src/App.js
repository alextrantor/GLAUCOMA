import React, { useState } from 'react';

function AnalysisButton({ imageFile, onResults, t }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!imageFile) {
      setError(t('noImage'));
      return;
    }

    setLoading(true);
    setError(null);
    onResults(null); // Limpia resultados anteriores

    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch('https://glaucoma-ntk9.onrender.com/analyze/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.detail || t('error');
        setError(errorMsg);
        return;
      }

      onResults(data);
    } catch (err) {
      console.error(err);
      setError(t('error') || 'No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 text-center">
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? t('loading') : t('analyze')}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}

export default AnalysisButton;
