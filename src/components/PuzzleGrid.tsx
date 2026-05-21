import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { LevelConfig, Puzzle, Rect } from '../types';

interface PuzzleGridProps {
    config: LevelConfig;
    puzzle: Puzzle;
    placedBlocks: Rect[];
    onPlaceBlock: (rect: Rect) => void;
    onRemoveBlock: (id: number) => void;
}

export function PuzzleGrid({ config, puzzle, placedBlocks, onPlaceBlock, onRemoveBlock }: PuzzleGridProps) {
    const gridRef = useRef<HTMLDivElement>(null);
    const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
    const [dragCurrent, setDragCurrent] = useState<{x: number, y: number} | null>(null);

    const getCellFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!gridRef.current) return null;
        const bounds = gridRef.current.getBoundingClientRect();
        
        let localX = e.clientX - bounds.left;
        let localY = e.clientY - bounds.top;
        
        // Clamp to prevent out of bounds when dragging outside grid
        localX = Math.max(0, Math.min(localX, bounds.width - 0.1));
        localY = Math.max(0, Math.min(localY, bounds.height - 0.1));
        
        const cellWidth = bounds.width / config.width;
        const cellHeight = bounds.height / config.height;
        
        return {
            x: Math.floor(localX / cellWidth),
            y: Math.floor(localY / cellHeight)
        };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const blockIdStr = target.getAttribute('data-block-id');
        
        // If clicking an existing placed block, remove it
        if (blockIdStr) {
            onRemoveBlock(parseInt(blockIdStr, 10));
            return;
        }

        const cell = getCellFromEvent(e);
        if (!cell) return;

        setDragStart(cell);
        setDragCurrent(cell);
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragStart) return;
        const cell = getCellFromEvent(e);
        if (!cell) return;
        setDragCurrent(cell);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragStart || !dragCurrent) return;
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
        
        const x1 = Math.min(dragStart.x, dragCurrent.x);
        const y1 = Math.min(dragStart.y, dragCurrent.y);
        const x2 = Math.max(dragStart.x, dragCurrent.x);
        const y2 = Math.max(dragStart.y, dragCurrent.y);
        
        const rect: Rect = { x: x1, y: y1, w: x2 - x1 + 1, h: y2 - y1 + 1 };
        onPlaceBlock(rect);
        
        setDragStart(null);
        setDragCurrent(null);
    };

    const currentDragRect = dragStart && dragCurrent ? {
        x: Math.min(dragStart.x, dragCurrent.x),
        y: Math.min(dragStart.y, dragCurrent.y),
        w: Math.max(dragStart.x, dragCurrent.x) - Math.min(dragStart.x, dragCurrent.x) + 1,
        h: Math.max(dragStart.y, dragCurrent.y) - Math.min(dragStart.y, dragCurrent.y) + 1
    } : null;

    return (
        <div 
            ref={gridRef}
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${config.width}, 1fr)`,
                gridTemplateRows: `repeat(${config.height}, 1fr)`,
            }}
            className="w-full h-full border-4 border-black relative select-none touch-none bg-white shadow-[8px_8px_0_0_#000] rounded-xl overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {/* Layer 0: Empty/White Substrate Cells */}
            {puzzle.puzzleCells.map(c => (
                <div 
                    key={`bg-${c.x}-${c.y}`}
                    style={{ gridColumn: c.x + 1, gridRow: c.y + 1 }}
                    className="bg-transparent border-r-2 border-b-2 border-dashed border-black/20 touch-none pointer-events-none"
                />
            ))}

            {/* Layer 1: Placed Completed Blocks */}
            {placedBlocks.map(b => (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    key={`block-${b.id}`}
                    data-block-id={b.id}
                    style={{
                        gridColumn: `${b.x + 1} / span ${b.w}`,
                        gridRow: `${b.y + 1} / span ${b.h}`,
                    }}
                    className={`m-[2px] rounded-lg border-4 border-black shadow-[4px_4px_0_0_#000] ${b.theme?.bg || 'bg-zinc-200'} cursor-pointer hover:brightness-110 pointer-events-auto z-10 box-border`}
                />
            ))}

            {/* Layer 2: Active Drag Overlay Preview */}
            {currentDragRect && (
                <div
                    style={{
                        gridColumn: `${currentDragRect.x + 1} / span ${currentDragRect.w}`,
                        gridRow: `${currentDragRect.y + 1} / span ${currentDragRect.h}`,
                    }}
                    className="bg-[#00E5FF]/30 border-4 border-[#00E5FF] rounded-lg border-dashed pointer-events-none z-20 m-[2px]"
                />
            )}

            {/* Layer 3: Requirements Numbers */}
            {puzzle.puzzleCells.map(c => {
                if (c.value === 0) return null;
                const parentBlock = placedBlocks.find(b => c.x >= b.x && c.x < b.x + b.w && c.y >= b.y && c.y < b.y + b.h);
                const textColor = parentBlock?.theme ? 'text-black' : 'text-black';
                
                return (
                    <div
                        key={`num-${c.x}-${c.y}`}
                        style={{ gridColumn: c.x + 1, gridRow: c.y + 1 }}
                        className={`pointer-events-none flex items-center justify-center font-black text-2xl md:text-3xl lg:text-4xl z-30 transition-colors duration-200 ${textColor} drop-shadow-[2px_2px_0_#FFF]`}
                    >
                        {c.value}
                    </div>
                );
            })}
        </div>
    );
}
