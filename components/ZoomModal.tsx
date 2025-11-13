
import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';

interface ZoomModalProps {
  imageSrc: string;
  onZoomComplete: (result: { crop: PixelCrop; imageElement: HTMLImageElement; action: 'zoom' | 'zoom-and-crop' }) => void;
  onClose: () => void;
}

const ZoomModal: React.FC<ZoomModalProps> = ({ imageSrc, onZoomComplete, onClose }) => {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const imgRef = useRef<HTMLImageElement>(null);

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        const initialCrop = centerCrop(
            makeAspectCrop({ unit: '%', width: 50 }, undefined, width, height),
            width,
            height
        );
        setCrop(initialCrop);
    }

    const handleConfirm = (action: 'zoom' | 'zoom-and-crop') => {
        if (completedCrop?.width && completedCrop?.height && imgRef.current) {
            onZoomComplete({ crop: completedCrop, imageElement: imgRef.current, action });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[95vh] flex flex-col gap-4">
                <h2 className="text-xl font-bold text-center">Markera område att zooma in</h2>
                <div className="flex-grow min-h-0 flex items-center justify-center bg-gray-900/50 rounded-md">
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        className="max-w-full max-h-[70vh]"
                    >
                        <img
                            ref={imgRef}
                            alt="Bild att zooma"
                            src={imageSrc}
                            onLoad={onImageLoad}
                            style={{ maxHeight: '70vh', objectFit: 'contain' }}
                        />
                    </ReactCrop>
                </div>
                <div className="flex justify-end gap-4 pt-2 border-t border-gray-700">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 rounded-md hover:bg-gray-500 font-semibold transition-colors">Avbryt</button>
                    <button
                        onClick={() => handleConfirm('zoom')}
                        className="px-6 py-2 bg-blue-600 rounded-md hover:bg-blue-500 font-semibold transition-colors disabled:opacity-50"
                        disabled={!completedCrop?.width || !completedCrop?.height}
                    >
                        Zooma
                    </button>
                    <button
                        onClick={() => handleConfirm('zoom-and-crop')}
                        className="px-6 py-2 bg-green-600 rounded-md hover:bg-green-500 font-semibold transition-colors disabled:opacity-50"
                        disabled={!completedCrop?.width || !completedCrop?.height}
                    >
                        Zooma & Beskär
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ZoomModal;
