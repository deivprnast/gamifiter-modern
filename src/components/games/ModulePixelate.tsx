import React, { useEffect, useRef, useState } from 'react';

interface ModulePixelateProps {
  progress: number; // 0 to 1
  filePath: string;
}

export const ModulePixelate: React.FC<ModulePixelateProps> = ({ progress, filePath }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const img = new Image();
    img.src = filePath;
    img.onload = () => {
      setImage(img);
      setLoading(false);
    };
    img.onerror = () => {
      console.error('Failed to load pixelate image:', filePath);
      setLoading(false);
    };
  }, [filePath]);

  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set resolution based on parent container width
    const containerWidth = canvas.parentElement?.clientWidth || 800;
    const aspectRatio = 16 / 9;
    canvas.width = containerWidth;
    canvas.height = containerWidth / aspectRatio;

    const { width, height } = canvas;

    // Draw original image on canvas to read pixel data
    // We can use an offscreen canvas to avoid visual flicker during pixelation
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offscreenCtx = offscreen.getContext('2d');
    if (!offscreenCtx) return;

    offscreenCtx.drawImage(image, 0, 0, width, height);

    if (progress === 0) {
      // 0% progress: draw a beautiful deep theme color
      ctx.fillStyle = '#0f172a'; // Deep slate
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = '#06B6D4';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔒 Splňte aspoň část výzvy pro zaostření obrazu', width / 2, height / 2);
    } else if (progress >= 1) {
      // 100% progress: clear unpixelated rendering
      ctx.drawImage(image, 0, 0, width, height);
    } else {
      // Pixelate effect
      const imgData = offscreenCtx.getImageData(0, 0, width, height);
      const pixels = imgData.data;

      // Calculate block size: from 50 (very pixelated) down to 2 (sharp)
      const pixelation = Math.max(1, Math.trunc((1 - progress) * 48 + 2));

      ctx.clearRect(0, 0, width, height);

      for (let x = 0; x < width; x += pixelation) {
        for (let y = 0; y < height; y += pixelation) {
          // Clamp values to prevent out of bounds read
          const px = Math.min(width - 1, x);
          const py = Math.min(height - 1, y);
          
          const i = (px + py * width) * 4;
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
          ctx.fillRect(x, y, pixelation, pixelation);
        }
      }
    }
  }, [image, progress]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (image && canvasRef.current) {
        const canvas = canvasRef.current;
        const containerWidth = canvas.parentElement?.clientWidth || 800;
        canvas.width = containerWidth;
        canvas.height = containerWidth / (16 / 9);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [image]);

  return (
    <div className="w-full h-full glass-card overflow-hidden flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Zaostřování molekulární DNA</h3>
          <p className="text-xs text-[#94A3B8]">Kroky vaší třídy zaostřují mikroskopický záběr řetězce DNA.</p>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-full px-3 py-1 text-xs text-[#06B6D4] font-semibold">
          Zaostření: {Math.round(progress * 100)} % (Pixel: {Math.max(1, Math.trunc((1 - progress) * 48 + 2))}px)
        </div>
      </div>

      {loading ? (
        <div className="w-full h-96 flex items-center justify-center bg-[#0B0F19] rounded-xl border border-[#1E293B]">
          <div className="text-[#06B6D4] animate-pulse">Načítání obrázku...</div>
        </div>
      ) : (
        <div className="w-full flex justify-center bg-[#070A13] p-2 rounded-xl border border-[#1E293B]">
          <canvas ref={canvasRef} className="w-full max-w-full rounded-lg" style={{ display: 'block' }} />
        </div>
      )}
    </div>
  );
};
