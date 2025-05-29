import React, { useState, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as tf from '@tensorflow/tfjs';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate image type
    if (!file.type.match('image.(jpeg|jpg|png)')) {
      toast.error('Please upload a JPEG or PNG image');
      resetFileInput();
      return;
    }

    // Check image size (e.g., <5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (max 5MB)');
      resetFileInput();
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // Display preview
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target.result);
      reader.readAsDataURL(file);

      // Load models
      const [opticNerveModel, excavationModel] = await Promise.all([
        tf.loadLayersModel(process.env.REACT_APP_MODEL1_URL),
        tf.loadLayersModel(process.env.REACT_APP_MODEL2_URL)
      ]);

      // Process image
      const tensor = await preprocessImage(file);
      const opticNervePrediction = await opticNerveModel.predict(tensor).data();
      
      // Check if optic nerve is detected (threshold: 70% confidence)
      if (opticNervePrediction[0] < 0.7) {
        setResult('No optic nerve detected - please upload a clearer image');
        return;
      }

      // Classify excavation
      const excavationPrediction = await excavationModel.predict(tensor).data();
      const ratio = excavationPrediction[0].toFixed(2);
      
      setResult({
        classification: ratio >= 0.5 ? 'Glaucoma Suspect' : 'Normal',
        confidence: ratio
      });

    } catch (error) {
      console.error('Model error:', error);
      toast.error(`Analysis failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      resetFileInput();
    }
  };

  const preprocessImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const tensor = tf.browser.fromPixels(img)
            .resizeNearestNeighbor([224, 224]) // Match model input size
            .div(255.0) // Normalize [0-1]
            .expandDims();
          resolve(tensor);
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="app-container">
      <h1>Glaucoma Screening</h1>
      
      <div className="upload-box" onClick={triggerFileInput}>
        {image ? (
          <img src={image} alt="Upload preview" className="image-preview" />
        ) : (
          <p>Click to upload optic nerve image</p>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg, image/png"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
        disabled={isLoading}
      />

      {isLoading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Analyzing...</p>
        </div>
      )}

      {result && (
        <div className={`result-box ${result.classification?.includes('Glaucoma') ? 'warning' : 'normal'}`}>
          <h2>Result: {result.classification || result}</h2>
          {result.confidence && (
            <p>Excavation ratio: {result.confidence}</p>
          )}
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={5000} />
    </div>
  );
}

export default App;