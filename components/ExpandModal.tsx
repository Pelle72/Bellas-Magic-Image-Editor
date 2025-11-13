
import React, { useState } from 'react';

// Supported aspect ratios based on xAI/OpenAI API generation limits
// API supports: 1024x1024 (1:1), 1024x1536 (2:3), 1536x1024 (3:2)
// Aspect ratios that fit within these dimensions without excessive distortion
const ASPECT_RATIOS = [
    { value: '1:1', text: '1:1' },
    { value: '4:3', text: '4:3' },
    { value: '3:4', text: '3:4' },
    { value: '16:9', text: '16:9' },
    { value: '9:16', text: '9:16' },
    { value: '3:2', text: '3:2' },
    { value: '2:3', text: '2:3' },
];

interface ExpandModalProps {
  onExpand: (aspectRatio: string) => void;
  onClose: () => void;
}

const ExpandModal: React.FC<ExpandModalProps> = ({ onExpand, onClose }) => {
    const [selectedAspect, setSelectedAspect] = useState<string | null>(null);

    const handleExpandClick = () => {
        if (selectedAspect) {
            onExpand(selectedAspect);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md flex flex-col gap-4">
                <h2 className="text-xl font-bold text-center">Välj bildförhållande</h2>
                <p className="text-sm text-center text-gray-400 -mt-2">AI:n kommer att expandera din bild till det valda formatet.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ASPECT_RATIOS.map(({ value, text }) => (
                        <button
                            key={text}
                            onClick={() => setSelectedAspect(value)}
                            className={`py-3 text-base font-medium rounded-md transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 ${selectedAspect === value ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-gray-700 hover:bg-gray-600 hover:scale-105'}`}
                        >
                            {text}
                        </button>
                    ))}
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 rounded-md hover:bg-gray-500 font-semibold transition-colors"
                    >
                        Avbryt
                    </button>
                    <button
                        onClick={handleExpandClick}
                        className="px-6 py-2 bg-green-600 rounded-md hover:bg-green-500 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!selectedAspect}
                    >
                        Expandera
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExpandModal;
