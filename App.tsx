
import React, { useState, useCallback, useMemo } from 'react';
import type { PixelCrop } from 'react-image-crop';

import type { ImageFile, EditedImage, ImageSession } from './types';
import { editImageWithPrompt, generatePromptFromImage, translateToEnglish } from './services/grokService';
import { outpaintImage } from './services/huggingFaceService';
import { removeBackground } from './backgroundRemovalService';
import { UploadIcon, SparklesIcon, DownloadIcon, ResetIcon, UndoIcon, RedoIcon, LightBulbIcon, EnhanceIcon, ExpandIcon, CropIcon, ZoomInIcon, RevertIcon, TrashIcon, RemoveBgIcon, ShieldIcon, ShareIcon, SettingsIcon } from './components/Icons';
import CropModal, { getCroppedImg } from './components/CropModal';
import ExpandModal from './components/ExpandModal';
import ImageViewer from './components/ImageViewer';
import ZoomModal from './components/ZoomModal';
import SettingsModal from './components/SettingsModal';
import { buildPromptWithDescription } from './utils/promptUtils';
import { downscaleImage, downscaleCanvasForAPI, isAspectRatioUnsupported, getAspectRatioString, getImageDimensions, calculateAspectRatioDimensions, resizeImageToAspectRatio } from './utils/imageUtils';
import UnsupportedRatioModal from './components/UnsupportedRatioModal';

const AgeGate: React.FC<{ onConfirm: () => void }> = ({ onConfirm }) => {
    const [showNoMessage, setShowNoMessage] = useState(false);

    const handleConfirm = () => {
        localStorage.setItem('ageVerified', 'true');
        onConfirm();
    };

    const handleDeny = () => {
        setShowNoMessage(true);
    };

    return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[101] p-6 text-center">
            {showNoMessage ? (
                 <div className="flex flex-col items-center">
                    <ShieldIcon className="w-16 h-16 text-yellow-400 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Åtkomst nekad</h2>
                    <p className="text-lg text-gray-300 max-w-md">
                        Du måste vara 18 år eller äldre för att använda den här applikationen.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <ShieldIcon className="w-16 h-16 text-yellow-400 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Bekräfta din ålder</h2>
                    <p className="text-lg text-gray-300 max-w-md mb-8">
                        Genom att fortsätta bekräftar du att du är 18 år eller äldre. Detta är för att möjliggöra full kreativ frihet med AI-verktygen.
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={handleDeny}
                            className="px-8 py-3 bg-gray-700 rounded-md hover:bg-gray-600 font-semibold transition-colors"
                        >
                            Nej, jag är inte 18
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-8 py-3 bg-purple-700 rounded-md hover:bg-purple-600 font-semibold transition-colors"
                        >
                            Ja, jag är 18+
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


const SplashScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => (
    <div
        className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[100] p-4 text-center cursor-pointer"
        onClick={onStart}
        role="button"
        tabIndex={0}
        aria-label="Starta applikationen"
    >
        <h1 className="neon-text">
            Bella's Magic<br />Image Editor
        </h1>
        <p className="absolute bottom-12 text-blue-400 text-base">
            ©2025 Digital Creative Content
        </p>
    </div>
);


const fileToImageFile = async (file: File): Promise<{imageFile: ImageFile, isUnsupported: boolean, aspectRatioString: string}> => {
    try {
        // Downscale image if it exceeds maximum dimensions
        const result = await downscaleImage(file);
        
        // Log if image was downscaled
        if (result.originalWidth !== result.newWidth || result.originalHeight !== result.newHeight) {
            console.log(`Image downscaled: ${result.originalWidth}x${result.originalHeight} → ${result.newWidth}x${result.newHeight}`);
        }
        
        const imageFile: ImageFile = {
            id: `${file.name}-${file.lastModified}-${Math.random()}`,
            file,
            base64: result.base64,
            mimeType: result.mimeType,
        };
        
        // Check if aspect ratio is unsupported
        const isUnsupported = isAspectRatioUnsupported(result.newWidth, result.newHeight);
        const aspectRatioString = getAspectRatioString(result.newWidth, result.newHeight);
        
        return { imageFile, isUnsupported, aspectRatioString };
    } catch (error) {
        console.error('Error processing image:', error);
        throw new Error('Kunde inte bearbeta bilden. Kontrollera att filen är en giltig bild.');
    }
};

const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
};

const App: React.FC = () => {
    const [isAgeVerified, setIsAgeVerified] = useState(() => {
      return typeof window !== 'undefined' && localStorage.getItem('ageVerified') === 'true';
    });
    const [isAppStarted, setIsAppStarted] = useState(false);
    
    const [sessions, setSessions] = useState<ImageSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    const [isCropping, setIsCropping] = useState(false);
    const [isExpanding, setIsExpanding] = useState(false);
    const [isZooming, setIsZooming] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [unsupportedRatioImage, setUnsupportedRatioImage] = useState<{
        imageFile: ImageFile;
        aspectRatioString: string;
    } | null>(null);

    const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);

    const updateActiveSession = (updater: (session: ImageSession) => ImageSession) => {
        setSessions(prev => prev.map(s => s.id === activeSessionId ? updater(s) : s));
    };

    const prompt = activeSession?.prompt ?? '';
    const setPrompt = (newPrompt: string) => {
        if (!activeSession) return;
        updateActiveSession(session => ({ ...session, prompt: newPrompt }));
    };

    const zoomRequest = activeSession?.zoomRequest ?? null;
    const setZoomRequest = (newZoomRequest: PixelCrop | null) => {
        if (!activeSession) return;
        updateActiveSession(session => ({ ...session, zoomRequest: newZoomRequest }));
    };

    const handleStart = useCallback(() => {
        const root = document.documentElement;
        if (root.requestFullscreen) {
            root.requestFullscreen().catch(err => console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`));
        }
        setIsAppStarted(true);
    }, []);
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsLoading(true);
            setLoadingMessage(`Laddar ${e.target.files.length} bild(er)...`);
            setError(null);
            try {
                const results = await Promise.all(
                    Array.from(e.target.files).map(fileToImageFile)
                );

                // Check if any image has unsupported ratio
                const firstUnsupported = results.find(r => r.isUnsupported);
                
                if (firstUnsupported) {
                    // Show modal for the first unsupported image
                    setUnsupportedRatioImage({
                        imageFile: firstUnsupported.imageFile,
                        aspectRatioString: firstUnsupported.aspectRatioString
                    });
                    setIsLoading(false);
                    setLoadingMessage('');
                    e.target.value = '';
                    return;
                }

                // All images have supported ratios, add them normally
                const newSessions: ImageSession[] = results.map(r => ({
                    id: r.imageFile.id,
                    original: r.imageFile,
                    history: [],
                    historyIndex: -1,
                    prompt: '',
                    zoomRequest: null
                }));

                setSessions(prev => [...prev, ...newSessions]);
                if (!activeSessionId || sessions.length === 0) {
                    setActiveSessionId(newSessions[0].id);
                }
            } catch (err) {
                setError('Kunde inte ladda bilderna. Försök igen.');
                console.error(err);
            } finally {
                setIsLoading(false);
                setLoadingMessage('');
                // Clear the input value to allow re-uploading the same file
                e.target.value = '';
            }
        }
    };

    const currentImage = useMemo(() => {
        if (!activeSession) return null;
        if (activeSession.historyIndex >= 0 && activeSession.history[activeSession.historyIndex]) {
            return activeSession.history[activeSession.historyIndex];
        }
        if (activeSession.original) {
            return { id: activeSession.original.id, base64: activeSession.original.base64, mimeType: activeSession.original.mimeType };
        }
        return null;
    }, [activeSession]);

    const canUndo = (activeSession?.historyIndex ?? -1) >= 0;
    const canRedo = activeSession ? activeSession.historyIndex < activeSession.history.length - 1 : false;

    const addEditToHistory = (newImage: EditedImage) => {
        updateActiveSession(session => {
            const newHistory = session.history.slice(0, session.historyIndex + 1);
            newHistory.push(newImage);
            return {
                ...session,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                zoomRequest: null
            };
        });
    };

    const handleEditImage = async () => {
        if (!currentImage || !prompt.trim()) {
            setError("Du måste välja en bild och skriva en redigeringsprompt.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage('Översätter instruktion...');
        setError(null);
        try {
            const englishPrompt = await translateToEnglish(prompt);
            setLoadingMessage('Applicerar magi...');
            const result = await editImageWithPrompt(currentImage.base64, currentImage.mimeType, englishPrompt);
            addEditToHistory({ ...result, id: `edit-${Date.now()}` });
        } catch (err: any) {
            setError(err.message || "Ett okänt fel inträffade vid redigering.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const handleGeneratePrompt = async () => {
        if (!currentImage) {
            setError("Välj en bild först för att generera en beskrivning.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage('Analyserar bild...');
        setError(null);
        try {
            const generatedPrompt = await generatePromptFromImage(currentImage.base64, currentImage.mimeType);
            setPrompt(generatedPrompt);
        } catch (err: any) {
            setError(err.message || "Kunde inte generera en beskrivning från bilden.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleEnhanceImage = async () => {
        if (!currentImage) {
            setError("Välj en bild först för att förbättra den.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage('Förbättrar och skalar upp bilden...');
        setError(null);
        try {
            // The API will generate at the maximum resolution it supports based on aspect ratio
            // (1536x1024 for landscape, 1024x1536 for portrait, 1024x1024 for square)
            const enhancePrompt = "Act as a professional photo restoration expert. Enhance this image to the highest quality possible. Focus on increasing sharpness, clarity, and detail without introducing artifacts. Correct any noise, improve lighting, and balance colors to make it look crisp and professional. The content and composition must remain identical to the original.";
            const result = await editImageWithPrompt(currentImage.base64, currentImage.mimeType, enhancePrompt);
            addEditToHistory({ ...result, id: `enhance-${Date.now()}` });
        } catch (err: any) {
            setError(err.message || "Ett okänt fel inträffade vid förbättring.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleExpandImage = async (aspectRatio: string) => {
        if (!currentImage) {
            setError("Välj en bild först för att expandera den.");
            return;
        }
        setIsExpanding(false);
        setIsLoading(true);
        setLoadingMessage(`Analyserar bildens innehåll...`);
        setError(null);

        try {
            // Use Grok to analyze the image for context
            const imageDescription = await generatePromptFromImage(currentImage.base64, currentImage.mimeType);
            setLoadingMessage(`Förbereder expansion till ${aspectRatio} med Hugging Face...`);

            // Calculate target dimensions based on aspect ratio
            const targetDimensions = calculateAspectRatioDimensions(aspectRatio);
            
            // Create a detailed outpainting prompt
            const outpaintPrompt = `${imageDescription}. Seamlessly extend this scene beyond the borders, maintaining consistent lighting, style, colors, and atmosphere. Fill the expanded areas naturally as if the scene continues.`;
            
            setLoadingMessage(`Expanderar bilden till ${aspectRatio} med Hugging Face Stable Diffusion...`);
            
            // Use Hugging Face outpainting for proper image expansion
            const result = await outpaintImage(
                currentImage.base64,
                currentImage.mimeType,
                targetDimensions.width,
                targetDimensions.height,
                outpaintPrompt
            );
            
            addEditToHistory({ ...result, id: `expand-${Date.now()}` });

        } catch (err: any) {
            setError(err.message || "Ett okänt fel inträffade vid expandering.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const handleRemoveBackground = async () => {
        if (!currentImage) {
            setError("Välj en bild först för att ta bort bakgrunden.");
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Tar bort bakgrund med AI...');
        setError(null);

        try {
            const result = await removeBackground(currentImage.base64, currentImage.mimeType);
            addEditToHistory({ ...result, id: `removebg-${Date.now()}` });
        } catch (err: any) {
            setError(err.message || "Ett okänt fel inträffade vid borttagning av bakgrund.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleCropComplete = (croppedImage: { base64: string; mimeType: string } | null) => {
        if (croppedImage) {
            addEditToHistory({ ...croppedImage, id: `crop-${Date.now()}` });
        }
        setIsCropping(false);
    };
    
    const handleZoomComplete = async ({ crop, imageElement, action }: {
        crop: PixelCrop;
        imageElement: HTMLImageElement;
        action: 'zoom' | 'zoom-and-crop';
    }) => {
        setIsZooming(false);

        if (action === 'zoom') {
            setZoomRequest(crop);
        } else if (action === 'zoom-and-crop') {
            if (!currentImage) return;

            setIsLoading(true);
            setLoadingMessage('Beskär bild...');
            setError(null);

            try {
                const croppedImage = await getCroppedImg(imageElement, crop);
                addEditToHistory({ ...croppedImage, id: `crop-${Date.now()}` });
            } catch (err: any) {
                setError(err.message || "Ett okänt fel inträffade vid beskärning.");
                console.error(err);
            } finally {
                setIsLoading(false);
                setLoadingMessage('');
            }
        }
    };

    const addBordersToImage = async (imageFile: ImageFile): Promise<ImageFile> => {
        // Get the closest supported aspect ratio
        const dimensions = await getImageDimensions(imageFile.base64, imageFile.mimeType);
        const aspectRatio = dimensions.width / dimensions.height;
        
        // Determine target dimensions based on aspect ratio
        let targetWidth: number, targetHeight: number;
        
        if (aspectRatio >= 0.9 && aspectRatio <= 1.1) {
            // Square
            targetWidth = targetHeight = 1024;
        } else if (aspectRatio < 1.0) {
            // Portrait - use 2:3 ratio
            targetWidth = 1024;
            targetHeight = 1536;
        } else {
            // Landscape - use 3:2 ratio
            targetWidth = 1536;
            targetHeight = 1024;
        }
        
        // Create canvas with target dimensions
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Kunde inte skapa canvas');
        
        // Fill with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        
        // Load the image
        const img = new Image();
        img.src = `data:${imageFile.mimeType};base64,${imageFile.base64}`;
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
        });
        
        // Calculate scaling to fit image within target dimensions
        const scale = Math.min(targetWidth / dimensions.width, targetHeight / dimensions.height);
        const scaledWidth = dimensions.width * scale;
        const scaledHeight = dimensions.height * scale;
        
        // Center the image
        const x = (targetWidth - scaledWidth) / 2;
        const y = (targetHeight - scaledHeight) / 2;
        
        // Draw the image centered with borders
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        // Convert to base64
        const newBase64 = canvas.toDataURL('image/png').split(',')[1];
        
        return {
            ...imageFile,
            base64: newBase64,
            mimeType: 'image/png'
        };
    };

    const handleUnsupportedRatioAddBorders = async () => {
        if (!unsupportedRatioImage) return;
        
        setIsLoading(true);
        setLoadingMessage('Lägger till ramar...');
        setError(null);
        
        try {
            const borderedImage = await addBordersToImage(unsupportedRatioImage.imageFile);
            
            const newSession: ImageSession = {
                id: borderedImage.id,
                original: borderedImage,
                history: [],
                historyIndex: -1,
                prompt: '',
                zoomRequest: null
            };
            
            setSessions(prev => [...prev, newSession]);
            if (!activeSessionId || sessions.length === 0) {
                setActiveSessionId(newSession.id);
            }
            
            setUnsupportedRatioImage(null);
        } catch (err: any) {
            setError(err.message || 'Kunde inte lägga till ramar.');
            console.error(err);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleUnsupportedRatioAIExpand = () => {
        if (!unsupportedRatioImage) return;
        
        // Add the image to sessions first
        const newSession: ImageSession = {
            id: unsupportedRatioImage.imageFile.id,
            original: unsupportedRatioImage.imageFile,
            history: [],
            historyIndex: -1,
            prompt: '',
            zoomRequest: null
        };
        
        setSessions(prev => [...prev, newSession]);
        setActiveSessionId(newSession.id);
        
        // Close the unsupported ratio modal and open expand modal
        setUnsupportedRatioImage(null);
        setIsExpanding(true);
    };

    const handleUnsupportedRatioCancel = () => {
        if (!unsupportedRatioImage) return;
        
        // Add the image anyway without modifications
        const newSession: ImageSession = {
            id: unsupportedRatioImage.imageFile.id,
            original: unsupportedRatioImage.imageFile,
            history: [],
            historyIndex: -1,
            prompt: '',
            zoomRequest: null
        };
        
        setSessions(prev => [...prev, newSession]);
        if (!activeSessionId || sessions.length === 0) {
            setActiveSessionId(newSession.id);
        }
        
        setUnsupportedRatioImage(null);
    };

    const handleUndo = () => {
        if (canUndo) {
            updateActiveSession(s => ({ ...s, historyIndex: s.historyIndex - 1, zoomRequest: null }));
        }
    };
    const handleRedo = () => {
        if (canRedo) {
            updateActiveSession(s => ({ ...s, historyIndex: s.historyIndex + 1, zoomRequest: null }));
        }
    };

    const handleReset = () => {
        if (activeSession) {
            updateActiveSession(s => ({ ...s, history: [], historyIndex: -1, prompt: '', zoomRequest: null }));
            setError(null);
        }
    };

    const handleDownload = () => {
        if (currentImage && activeSession) {
            const link = document.createElement('a');
            link.href = `data:${currentImage.mimeType};base64,${currentImage.base64}`;
            link.download = `edited_${activeSession.original.file.name || 'image.png'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleShare = async () => {
        if (!currentImage || !activeSession) {
            setError("Ingen bild att dela.");
            return;
        }

        if (!navigator.share) {
            setError("Din webbläsare stöder inte delningsfunktionen. Prova en modern mobil webbläsare.");
            return;
        }

        try {
            const blob = base64ToBlob(currentImage.base64, currentImage.mimeType);
            const fileName = `edited_${activeSession.original.file.name || 'image.png'}`;
            const file = new File([blob], fileName, { type: currentImage.mimeType });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Redigerad bild från Bella\'s Magic Editor',
                    text: 'Här är en bild jag redigerade!',
                });
            } else {
                 setError("Din webbläsare kan inte dela den här filtypen.");
            }
        } catch (error) {
            if ((error as DOMException).name !== 'AbortError') {
                console.error('Error sharing file:', error);
                setError("Kunde inte dela bilden. Ett fel inträffade.");
            }
        }
    };
    
    const handleSwitchImage = (sessionId: string) => {
        if (sessionId !== activeSessionId) {
            setActiveSessionId(sessionId);
        }
    };

    const handleDeleteImage = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation(); // Prevent triggering handleSwitchImage
        const sessionIndex = sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex === -1) return;
        
        const newSessions = sessions.filter(s => s.id !== sessionId);

        if (sessionId === activeSessionId) {
            if (newSessions.length === 0) {
                setActiveSessionId(null);
            } else {
                const newIndex = Math.max(0, sessionIndex - 1);
                setActiveSessionId(newSessions[newIndex].id);
            }
        }
        setSessions(newSessions);
    };

    if (!isAgeVerified) {
        return <AgeGate onConfirm={() => setIsAgeVerified(true)} />;
    }

    if (!isAppStarted) {
        return <SplashScreen onStart={handleStart} />;
    }

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans">
            <main className="container mx-auto p-4 flex flex-col lg:flex-row gap-8">
                {/* Control Panel */}
                <div className="w-full lg:w-1/3 lg:max-w-md flex flex-col gap-6 order-2 lg:order-1">
                    <header className="relative">
                        <h1 className="text-3xl font-bold text-center" style={{ fontFamily: "'MedievalSharp', cursive" }}>Bella's Magic Editor</h1>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="absolute top-0 right-0 p-2 hover:bg-gray-700 rounded-full transition-colors"
                            aria-label="Inställningar"
                            title="API-inställningar"
                        >
                            <SettingsIcon className="w-6 h-6" />
                        </button>
                    </header>

                    <div className="bg-gray-800 p-4 rounded-lg flex flex-col gap-4">
                       <h2 className="text-lg font-semibold">Redigera med magi</h2>
                        <p className="text-sm text-gray-400">Beskriv ändringarna du vill göra. Var kreativ!</p>
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder={activeSession ? "T.ex. 'byt bakgrund till en skog i solnedgången'..." : "Ladda upp en bild för att börja..."}
                            className="w-full h-32 p-2 bg-gray-900 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                            disabled={!activeSession}
                        />
                         <div className="grid grid-cols-2 gap-2">
                            <button onClick={handleEditImage} disabled={!activeSession || !prompt.trim()} className="col-span-2 flex items-center justify-center px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"><SparklesIcon className="w-5 h-5 mr-2" />Redigera bild</button>
                            
                            <button onClick={handleGeneratePrompt} disabled={!activeSession} className="flex items-center justify-center px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><LightBulbIcon className="w-5 h-5 mr-2" />Föreslå</button>
                            <button onClick={() => setPrompt('')} disabled={!activeSession || !prompt.trim()} className="flex items-center justify-center px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><TrashIcon className="w-5 h-5 mr-2" />Rensa</button>
                            
                            <button onClick={handleEnhanceImage} disabled={!activeSession} className="flex items-center justify-center px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><EnhanceIcon className="w-5 h-5 mr-2" />Förbättra</button>
                            <button onClick={() => setIsExpanding(true)} disabled={!activeSession} className="flex items-center justify-center px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ExpandIcon className="w-5 h-5 mr-2" />Expandera</button>
                            
                            <button onClick={handleRemoveBackground} disabled={!currentImage} className="col-span-2 flex items-center justify-center px-4 py-2 bg-purple-700 rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><RemoveBgIcon className="w-5 h-5 mr-2" />Ta bort bakgrund</button>
                            
                            <button onClick={() => setIsZooming(true)} disabled={!currentImage} className="flex items-center justify-center px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ZoomInIcon className="w-5 h-5 mr-2" />Zooma</button>
                            <button onClick={() => setIsCropping(true)} disabled={!currentImage} className="flex items-center justify-center px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><CropIcon className="w-5 h-5 mr-2" />Beskär</button>
                        </div>
                    </div>

                    <div className="flex justify-center gap-2 flex-wrap">
                        <button onClick={handleUndo} disabled={!canUndo} className="flex items-center justify-center px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><UndoIcon className="w-5 h-5 mr-2" />Ångra</button>
                        <button onClick={handleRedo} disabled={!canRedo} className="flex items-center justify-center px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><RedoIcon className="w-5 h-5 mr-2" />Gör om</button>
                        <button onClick={() => setZoomRequest(null)} disabled={!currentImage} className="flex items-center justify-center px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ResetIcon className="w-5 h-5 mr-2" />Nollställ vy</button>
                        <button onClick={handleReset} disabled={!activeSession} className="flex items-center justify-center px-4 py-2 bg-red-800 text-red-100 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><RevertIcon className="w-5 h-5 mr-2" />Nollställ bild</button>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg">
                        <label htmlFor="file-upload" className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 hover:border-gray-500 transition-colors">
                            <UploadIcon className="w-10 h-10 text-gray-400 mb-2" />
                            <span className="text-gray-400">
                                {sessions.length > 0 ? 'Lägg till bild(er)' : 'Ladda upp bild(er)'}
                            </span>
                            <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} multiple />
                        </label>
                        {activeSession && <p className="text-xs text-center mt-2 text-gray-400 truncate">Aktiv bild: {activeSession.original.file.name}</p>}
                    </div>
                    
                     <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleShare} disabled={!currentImage} className="flex items-center justify-center w-full px-4 py-3 bg-sky-600 rounded-md hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors">
                            <ShareIcon className="w-5 h-5 mr-2" />Dela
                        </button>
                        <button onClick={handleDownload} disabled={!currentImage} className="flex items-center justify-center w-full px-4 py-3 bg-green-600 rounded-md hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors">
                            <DownloadIcon className="w-5 h-5 mr-2" />Ladda ner
                        </button>
                    </div>

                </div>

                {/* Image Display Area */}
                 <div className="w-full lg:w-2/3 flex-grow flex flex-col gap-4 order-1 lg:order-2">
                    {/* Thumbnails */}
                    {sessions.length > 0 && (
                        <div className="bg-gray-800 rounded-lg p-2">
                             <div className="flex items-center gap-3 overflow-x-auto pb-1">
                                {sessions.map(session => {
                                    const thumb = session.historyIndex >= 0 ? session.history[session.historyIndex] : session.original;
                                    return (
                                        <div
                                            key={session.id}
                                            onClick={() => handleSwitchImage(session.id)}
                                            className={`relative flex-shrink-0 cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${activeSessionId === session.id ? 'ring-2 ring-blue-500' : 'ring-2 ring-transparent'}`}
                                            aria-label={`Välj bild ${session.original.file.name}`}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <img
                                                src={`data:${thumb.mimeType};base64,${thumb.base64}`}
                                                alt={session.original.file.name}
                                                className="w-20 h-20 object-cover"
                                            />
                                             <button
                                                onClick={(e) => handleDeleteImage(e, session.id)}
                                                className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                                                aria-label={`Ta bort bild ${session.original.file.name}`}
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                             </div>
                        </div>
                    )}

                    {/* Main Viewer */}
                    <div className="flex-grow flex flex-col items-center justify-center bg-black rounded-lg p-4 min-h-[50vh] lg:min-h-0 relative checkerboard-bg">
                        {isLoading && (
                            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-10">
                                <SparklesIcon className="w-16 h-16 text-blue-400 animate-pulse" />
                                <p className="mt-4 text-lg">{loadingMessage}</p>
                            </div>
                        )}
                        {error && (
                            <div className="absolute top-4 left-4 right-4 bg-red-800 bg-opacity-80 border border-red-600 text-white p-4 rounded-lg z-20 text-sm">
                            <p className="font-bold">Ett fel uppstod</p>
                            <p className="mt-1 whitespace-pre-wrap">{error}</p>
                            <button onClick={() => setError(null)} className="mt-2 text-xs font-bold underline">Stäng</button>
                            </div>
                        )}

                        {currentImage ? (
                            <ImageViewer
                                src={`data:${currentImage.mimeType};base64,${currentImage.base64}`}
                                alt="Redigerad bild"
                                zoomRequest={zoomRequest}
                            />
                        ) : (
                            <div className="text-center text-gray-500">
                                <UploadIcon className="w-24 h-24 mx-auto" />
                                <p className="mt-4">Ladda upp en bild för att börja trolla!</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            {isExpanding && (
                <ExpandModal
                    onExpand={handleExpandImage}
                    onClose={() => setIsExpanding(false)}
                />
            )}
            {isCropping && currentImage && (
                <CropModal
                    imageSrc={`data:${currentImage.mimeType};base64,${currentImage.base64}`}
                    onCropComplete={handleCropComplete}
                    onClose={() => setIsCropping(false)}
                />
            )}
            {isZooming && currentImage && (
                <ZoomModal
                    imageSrc={`data:${currentImage.mimeType};base64,${currentImage.base64}`}
                    onZoomComplete={handleZoomComplete}
                    onClose={() => setIsZooming(false)}
                />
            )}
            {isSettingsOpen && (
                <SettingsModal
                    onClose={() => setIsSettingsOpen(false)}
                />
            )}
            {unsupportedRatioImage && (
                <UnsupportedRatioModal
                    aspectRatioString={unsupportedRatioImage.aspectRatioString}
                    onAddBorders={handleUnsupportedRatioAddBorders}
                    onAIExpand={handleUnsupportedRatioAIExpand}
                    onCancel={handleUnsupportedRatioCancel}
                />
            )}
        </div>
    );
};

export default App;
