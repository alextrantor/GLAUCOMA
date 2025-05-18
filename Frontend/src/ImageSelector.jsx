import React from 'react';
import { ImagePlus } from 'lucide-react';

function ImageSelector({ onImageSelected, t }) {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onImageSelected(file);
    }
  };

  return (
    <div className="mb-4">
      <label className="block mb-1 font-semibold">{t('selectImage')}</label>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition">
          <ImagePlus className="w-5 h-5" />
          <span>{t('loadImage')}</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      </div>
    </div>
  );
}

export default ImageSelector;
