import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as tf from '@tensorflow/tfjs';

function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPEG/PNG)');
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Load Optic Nerve Detection Model
      const opticNerveModel = await tf.loadLayersModel(`${process.env.REACT_APP_MODEL1_URL}`);
      const imageTensor = await convertImageToTensor(file);
      const opticNervePrediction = await opticNerveModel.predict(imageTensor).data();

      // Step 2: Check if optic nerve is detected (threshold: 0.7 confidence)
      if (opticNervePrediction[0] < 0.7) {
        setResult('Error: No optic nerve detected');
        return;
      }

      // Step 3: Load Excavation Classifier Model
      const excavationModel = await tf.loadLayersModel(`${process.env.REACT_APP_MODEL2_URL}`);
      const excavationPrediction = await excavationModel.predict(imageTensor).data();
      const ratio = excavationPrediction[0];

      // Step 4: Classify
      setResult(ratio >= 0.5 ? 'Glaucoma Suspect' : 'Normal');
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const convertImageToTensor = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const tensor = tf.browser.fromPixels(img)
            .resizeNearestNeighbor([224, 224]) // Adjust based on model input size
            .toFloat()
            .expandDims();
          resolve(tensor);
        };
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isLoading} />
      {isLoading && <p>Processing...</p>}
      {result && <p>Result: {result}</p>}
      <ToastContainer />
    </div>
  );
}

export default App;