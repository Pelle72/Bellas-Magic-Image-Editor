
import React from 'react';

interface UnsupportedRatioModalProps {
  aspectRatioString: string;
  onAddBorders: () => void;
  onAIExpand: () => void;
  onCancel: () => void;
}

const UnsupportedRatioModal: React.FC<UnsupportedRatioModalProps> = ({ 
  aspectRatioString, 
  onAddBorders, 
  onAIExpand, 
  onCancel 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in" aria-modal="true" role="dialog">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md flex flex-col gap-4">
        <h2 className="text-xl font-bold text-center text-yellow-400">⚠️ Bildförhållande ej stöds</h2>
        
        <div className="text-center space-y-2">
          <p className="text-base">
            Bilden har bildförhållandet <strong>{aspectRatioString}</strong>, vilket inte stöds direkt av AI:n.
          </p>
          <p className="text-sm text-gray-400">
            För bästa resultat rekommenderar vi att du justerar bilden till ett stött bildförhållande (1:1, 4:3, 3:4, 3:2, 2:3).
          </p>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <p className="text-sm font-semibold mb-3">Vad vill du göra?</p>
          
          <div className="space-y-2">
            <button
              onClick={onAddBorders}
              className="w-full px-4 py-3 bg-blue-600 rounded-md hover:bg-blue-500 font-semibold transition-colors text-left flex items-start"
            >
              <span className="text-xl mr-3">🖼️</span>
              <div>
                <div>Lägg till ramar</div>
                <div className="text-xs text-gray-300 font-normal">Lägg till svarta ramar för att passa ett stött bildförhållande</div>
              </div>
            </button>
            
            <button
              onClick={onAIExpand}
              className="w-full px-4 py-3 bg-purple-600 rounded-md hover:bg-purple-500 font-semibold transition-colors text-left flex items-start"
            >
              <span className="text-xl mr-3">✨</span>
              <div>
                <div>AI-expandera bild</div>
                <div className="text-xs text-gray-300 font-normal">Använd AI för att expandera bilden till ett stött bildförhållande</div>
              </div>
            </button>
            
            <button
              onClick={onCancel}
              className="w-full px-4 py-3 bg-gray-600 rounded-md hover:bg-gray-500 font-semibold transition-colors"
            >
              Fortsätt ändå
            </button>
          </div>
        </div>
        
        <p className="text-xs text-center text-gray-500">
          OBS: Om du fortsätter kan bilden bli distorterad eller beskuren vid AI-redigering.
        </p>
      </div>
    </div>
  );
};

export default UnsupportedRatioModal;
