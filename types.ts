
import type { PixelCrop } from 'react-image-crop';

export interface ImageFile {
  id: string;
  file: File;
  base64: string;
  mimeType: string;
}

export interface EditedImage {
  id: string;
  base64: string;
  mimeType: string;
}

export interface ImageSession {
  id: string;
  original: ImageFile;
  history: EditedImage[];
  historyIndex: number;
  prompt: string;
  zoomRequest: PixelCrop | null;
}
