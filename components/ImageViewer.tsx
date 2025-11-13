
import React, { useRef, useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import type { PixelCrop } from 'react-image-crop';

interface ImageViewerProps {
  src: string;
  alt: string;
  zoomRequest: PixelCrop | null;
}

const ZoomController: React.FC<{
  zoomRequest: PixelCrop | null;
  imageRef: React.RefObject<HTMLImageElement>;
  wrapperRef: React.RefObject<HTMLDivElement>;
}> = ({ zoomRequest, imageRef, wrapperRef }) => {
  const { setTransform, resetTransform } = useControls();

  useEffect(() => {
    const image = imageRef.current;
    const wrapper = wrapperRef.current;

    if (!image || !wrapper) return;

    const performZoom = () => {
      // Ensure image and wrapper have dimensions.
      if (!image.naturalWidth || !wrapper.clientWidth) {
        return;
      }
      
      if (!zoomRequest || zoomRequest.width === 0 || zoomRequest.height === 0) {
        resetTransform(200);
        return;
      }

      const { naturalWidth, naturalHeight } = image;
      const { width: viewWidth, height: viewHeight } = wrapper.getBoundingClientRect();
      
      if (viewWidth === 0 || viewHeight === 0) return;

      const imageAspectRatio = naturalWidth / naturalHeight;
      const viewAspectRatio = viewWidth / viewHeight;

      let displayedWidth, displayedHeight;
      if (imageAspectRatio > viewAspectRatio) {
        displayedWidth = viewWidth;
        displayedHeight = viewWidth / imageAspectRatio;
      } else {
        displayedHeight = viewHeight;
        displayedWidth = viewHeight * imageAspectRatio;
      }

      const offsetX = (viewWidth - displayedWidth) / 2;
      const offsetY = (viewHeight - displayedHeight) / 2;
      const pixelScaleRatio = displayedWidth / naturalWidth;
      
      const cropWidthOnScreen = zoomRequest.width * pixelScaleRatio;
      const cropHeightOnScreen = zoomRequest.height * pixelScaleRatio;
      
      if (cropWidthOnScreen === 0 || cropHeightOnScreen === 0) return;

      const scaleX = viewWidth / cropWidthOnScreen;
      const scaleY = viewHeight / cropHeightOnScreen;
      const scale = Math.min(scaleX, scaleY) * 0.95; // 95% to leave a small margin

      const cropCenterX = zoomRequest.x + zoomRequest.width / 2;
      const cropCenterY = zoomRequest.y + zoomRequest.height / 2;

      const finalCropCenterX = (cropCenterX * pixelScaleRatio) + offsetX;
      const finalCropCenterY = (cropCenterY * pixelScaleRatio) + offsetY;

      const positionX = viewWidth / 2 - finalCropCenterX * scale;
      const positionY = viewHeight / 2 - finalCropCenterY * scale;
      
      setTransform(positionX, positionY, scale, 200, 'easeOut');
    };
    
    // Using a timeout to ensure all rendering and layout calculations are complete.
    const timer = setTimeout(performZoom, 100);

    return () => clearTimeout(timer);

  }, [zoomRequest, imageRef, wrapperRef, setTransform, resetTransform]);

  return null; // This component does not render anything.
};


const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt, zoomRequest }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [key, setKey] = useState(Date.now());

  // Force re-mount of TransformWrapper when src changes to reset its internal state
  useEffect(() => {
    setKey(Date.now());
  }, [src]);

  return (
    <div ref={wrapperRef} className="w-full h-full no-touch-actions">
      <TransformWrapper
        key={key}
        initialScale={1}
        limitToBounds={true}
        panning={{ velocityDisabled: true }}
        doubleClick={{ disabled: true }}
        wheel={{ step: 0.2 }}
      >
        <ZoomController zoomRequest={zoomRequest} imageRef={imageRef} wrapperRef={wrapperRef} />
        <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain"
            draggable="false"
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default ImageViewer;
