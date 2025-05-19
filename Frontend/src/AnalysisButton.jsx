import React, { useState } from 'react';
import { Loader2, Brain } from 'lucide-react';

function AnalysisButton({ imageFile, onResults, t }) {
  const [loading, setLoading] = useState(false);

  const handleAnalysis = async () => {
    if (!imageFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const response = await fetch('https://glaucoma-ntk9.onrender.com/analyze', {
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
        disabled={loading}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow transition ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin w-4 h-4" />
            {t('analyzing')}
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