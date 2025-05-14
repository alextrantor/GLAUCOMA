import React from 'react';

function ResultsDisplay({ results }) {
  return (
    <div>
      <h2>Resultados</h2>
      {results && (
        <div>
          <p>Nervio Óptico Detectado: {results.is_nerve ? 'Sí' : 'No'}</p>
          {results.is_nerve && (
            <div>
              <p>CDR предicha: {results.cdr_prediction ? results.cdr_prediction.toFixed(4) : 'N/A'}</p>
              <p>Sospecha de Glaucoma: {results.glaucoma_suspected ? 'Sí' : 'No'}</p>
            </div>
          )}
        </div>
      )}
      {!results && <p>Los resultados del análisis se mostrarán aquí.</p>}
    </div>
  );
}

export default ResultsDisplay;
