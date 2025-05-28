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
    } catch (error) {
      console.error('Error verificando el backend:', error);
      console.error('🌐 Error al verificar el backend:', error);
      return false;
    } finally {
      setCheckingBackend(false);
@@ -27,7 +27,10 @@

    const backendReady = await checkBackendStatus();
    if (!backendReady) {
      alert(t('startingServer') || 'El servidor está despertando, por favor espera unos segundos e intenta de nuevo.');
      alert(
        t?.('startingServer') ||
          '⏳ El servidor se está iniciando. Espera unos segundos e intenta de nuevo.'
      );
      setLoading(false);
      return;
    }
@@ -42,14 +45,20 @@
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.detail || 'Error inesperado del servidor.');
      }

      const result = await response.json();
      console.log('✅ Resultados recibidos:', result);
      onResults(result);
    } catch (error) {
      console.error('Error al analizar la imagen:', error);
      alert(t('error') || 'Ocurrió un error durante el análisis. Intenta nuevamente.');
      console.error('❌ Error durante el análisis:', error);
      alert(
        t?.('error') ||
          '⚠️ Ocurrió un error durante el análisis. Intenta nuevamente más tarde.'
      );
    } finally {
      setLoading(false);
    }
@@ -62,26 +71,29 @@
      <button
        onClick={handleAnalysis}
        disabled={loading || checkingBackend}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow transition ${
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          loading || checkingBackend
            ? 'bg-gray-400 cursor-not-allowed'
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        aria-busy={loading || checkingBackend}
      >
        {(loading || checkingBackend) ? (
        {loading || checkingBackend ? (
          <>
            <Loader2 className="animate-spin w-4 h-4" />
            {checkingBackend ? (t('checkingBackend') || 'Conectando...') : t('analyzing')}
            {checkingBackend
              ? t?.('checkingBackend') || 'Conectando...'
              : t?.('analyzing') || 'Analizando...'}
          </>
        ) : (
          <>
            <Brain className="w-4 h-4" />
            {t('analyze')}
            {t?.('analyze') || 'Analizar'}
          </>
        )}
      </button>
    </div>
  );
}

export default AnalysisButton