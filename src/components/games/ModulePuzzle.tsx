import React, { useEffect, useRef, useState } from 'react';
import seedrandom from 'seedrandom';

interface ModulePuzzleProps {
  progress: number; // 0 to 1
  filePath: string;
  seed: string; // e.g. group name or user ID
}

export const ModulePuzzle: React.FC<ModulePuzzleProps> = ({ progress, filePath, seed }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(true);

  // Load image
  useEffect(() => {
    setLoading(true);
    const img = new Image();
    img.src = filePath;
    img.onload = () => {
      setImage(img);
      setLoading(false);
    };
    img.onerror = () => {
      console.error('Failed to load puzzle image:', filePath);
      setLoading(false);
    };
  }, [filePath]);

  // Render puzzle on canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use container-relative sizing
    const containerWidth = canvas.parentElement?.clientWidth || 800;
    const aspectRatio = 16 / 9;
    canvas.width = containerWidth;
    canvas.height = containerWidth / aspectRatio;

    const { width, height } = canvas;
    const cols = 12;
    const rows = 8;
    const totalTiles = cols * rows;
    
    // Number of tiles to reveal
    const toRevealCount = Math.min(totalTiles, Math.round(progress * totalTiles));

    // Draw the source image scaled to the canvas
    ctx.drawImage(image, 0, 0, width, height);

    // Create array of tile indices [0, 1, 2 ... 95]
    const tileIndices = Array.from({ length: totalTiles }, (_, idx) => idx);

    // Shuffle tile indices using seedrandom
    const rng = seedrandom(seed);
    const shuffledIndices = [...tileIndices];
    for (let i = shuffledIndices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
    }

    // Get the set of indices that are revealed
    const revealedSet = new Set(shuffledIndices.slice(0, toRevealCount));

    const tileWidth = width / cols;
    const tileHeight = height / rows;

    // Draw overlays on unrevealed tiles
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const index = c + r * cols;
        const x = c * tileWidth;
        const y = r * tileHeight;

        if (!revealedSet.has(index)) {
          // Unrevealed tile: fill with glass/dark theme color
          ctx.fillStyle = '#111827'; // Slate dark grey
          ctx.fillRect(x, y, tileWidth, tileHeight);

          // Add a subtle inner shadow or detail for locked tiles
          ctx.strokeStyle = '#1E293B'; // Dark border
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, tileWidth, tileHeight);
          
          // Small padlock icon in the center of locked tile (if large enough)
          if (tileWidth > 30 && tileHeight > 30) {
            ctx.fillStyle = '#475569';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔒', x + tileWidth / 2, y + tileHeight / 2);
          }
        } else {
          // Revealed tile: draw grid borders if not at 100% progress
          if (progress < 1) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, tileWidth, tileHeight);
          }
        }
      }
    }
  }, [image, progress, seed]);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      if (image && canvasRef.current) {
        // Trigger re-render by drawing again
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
          <h3 className="text-lg font-bold text-white">Odhalování skrytého obrázku</h3>
          <p className="text-xs text-[#94A3B8]">Splněním výzvy odkrýváte části krumlovského zámku.</p>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-full px-3 py-1 text-xs text-[#06B6D4] font-semibold">
          Odhaleno: {Math.round(progress * 100)} % ({Math.round(progress * 96)} / 96 dlaždic)
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
