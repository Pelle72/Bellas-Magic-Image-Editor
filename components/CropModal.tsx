
import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';

export async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<{ base64: string, mimeType: string }> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';
  
  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  
  // Fix: Removed quotes from variable names to make them valid identifiers.
  const targetWidth = crop.width * scaleX;
  const targetHeight = crop.height * scaleY;

  ctx.drawImage(
    image,
    cropX,
    cropY,
    targetWidth,
    targetHeight,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return new Promise((resolve) => {
    const mimeType = image.src.match(/:(.*?);/)?.[1] ?? 'image/png';
    const base64 = canvas.toDataURL(mimeType).split(',')[1];
    resolve({ base64, mimeType });
  });
}

interface CropModalProps {
  imageSrc: string;
  onCropComplete: (croppedImage: { base64: string, mimeType: string } | null) => void;
  onClose: () => void;
}

const ASPECT_RATIOS = [
    { value: undefined, text: 'Fri' },
    { value: 1 / 1, text: '1:1' },
    { value: 4 / 3, text: '4:3' },
    { value: 3 / 4, text: '3:4' },
    { value: 16 / 9, text: '16:9' },
    { value: 9 / 16, text: '9:16' },
    { value: 3 / 2, text: '3:2' },
    { value: 2 / 3, text: '2:3' },
];

const CropModal: React.FC<CropModalProps> = ({ imageSrc, onCropComplete, onClose }) => {
    const [aspect, setAspect] = useState<number | undefined>(undefined);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const imgRef = useRef<HTMLImageElement>(null);

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        const initialCrop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                aspect,
                width,
                height
            ),
            width,
            height
        );
        setCrop(initialCrop);
    }

    // When aspect ratio changes, reset the crop selection to a centered 90% view.
    useEffect(() => {
        if (imgRef.current) {
            const { width, height } = imgRef.current;
            if (width > 0 && height > 0) {
                const newCrop = centerCrop(
                    makeAspectCrop(
                        {
                            unit: '%',
                            width: 90,
                        },
                        aspect,
                        width,
                        height
                    ),
                    width,
                    height
                );
                setCrop(newCrop);
                setCompletedCrop(undefined); // Reset completed crop as well
            }
        }
    }, [aspect]);

    const handleDoCrop = async () => {
        if (completedCrop?.width && completedCrop?.height && imgRef.current) {
            try {
                const croppedImage = await getCroppedImg(
                    imgRef.current,
                    completedCrop
                );
                onCropComplete(croppedImage);
            } catch (e) {
                console.error('Crop failed:', e);
                onCropComplete(null);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[95vh] flex flex-col gap-4">
                <h2 className="text-xl font-bold text-center">Beskär bild</h2>
                <div className="flex-grow min-h-0 flex items-center justify-center bg-gray-900/50 rounded-md">
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={aspect}
                        className="max-w-full max-h-[65vh]"
                    >
                        <img
                            ref={imgRef}
                            alt="Bild att beskära"
                            src={imageSrc}
                            onLoad={onImageLoad}
                            style={{ maxHeight: '65vh', objectFit: 'contain' }}
                        />
                    </ReactCrop>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                     <span className="font-semibold text-gray-300">Bildförhållande:</span>
                     <div className="flex gap-2 flex-wrap justify-center">
                        {ASPECT_RATIOS.map(({ value, text }) => (
                            <button
                                key={text}
                                onClick={() => setAspect(value)}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${aspect === value ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-700 hover:bg-gray-600'}`}
                            >
                                {text}
                            </button>
                        ))}
                     </div>
                </div>
                <div className="flex justify-end gap-4 pt-2 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 rounded-md hover:bg-gray-500 font-semibold transition-colors"
                    >
                        Avbryt
                    </button>
                    <button
                        onClick={handleDoCrop}
                        className="px-6 py-2 bg-green-600 rounded-md hover:bg-green-500 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!completedCrop?.width || !completedCrop?.height}
                    >
                        Beskär
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CropModal;
