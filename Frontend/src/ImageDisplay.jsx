import React from 'react';
import { Image } from 'lucide-react';

function ImageDisplay({ imageFile, t }) {
  return (
    <div className="mb-4">
      <h2 className="font-semibold mb-2">{t('imageSelected')}</h2>
      {imageFile ? (
        <div className="border rounded-lg p-2">
          <img
            src={URL.createObjectURL(imageFile)}
            alt="Vista previa"
            className="w-full rounded-md shadow-md transition-transform duration-300 hover:scale-105"
          />
        </div>
      ) : (
        <p className="text-gray-500 italic flex items-center gap-2">
          <Image className="w-4 h-4" />
          {t('noImage')}
        </p>
      )}
    </div>
  );
}

export default ImageDisplay;
