import { Puzzle, Rect, Cell } from '../types';

export function generatePuzzle(width: number, height: number): Puzzle {
    let rects: Rect[] = [{ id: 0, x: 0, y: 0, w: width, h: height }];
    let nextId = 1;
    
    // Target average area per block. Limits how many blocks are generated.
    const targetRectsCount = Math.floor((width * height) / 4.5) + 1;
    const MAX_ITERATIONS = 400; // safety prevent infinite loops
    let iter = 0;
    
    while (rects.length < targetRectsCount && iter < MAX_ITERATIONS) {
        iter++;
        
        // Sort by area descending so we prefer to split larger blocks first
        rects.sort((a, b) => (b.w * b.h) - (a.w * a.h));
        
        // Slightly randomized selection among the larger half of rectangles
        let rIndex = 0;
        if (Math.random() > 0.6) {
            const candidates = Math.max(1, Math.floor(rects.length / 2));
            rIndex = Math.floor(Math.random() * candidates);
        }
        
        const r = rects[rIndex];
        
        if (r.w <= 1 && r.h <= 1) continue;
        
        let splitVertically = false;
        
        // Force split axis if ratio is highly skewed to keep blocks squarish
        if (r.w >= r.h * 1.5) {
            splitVertically = true; // split left/right
        } else if (r.h >= r.w * 1.5) {
            splitVertically = false; // split top/bottom
        } else {
            splitVertically = Math.random() > 0.5;
        }
        
        // Failsafe fallback
        if (splitVertically && r.w < 2) splitVertically = false;
        if (!splitVertically && r.h < 2) splitVertically = true;
        
        if (splitVertically && r.w >= 2) {
             // Split X (Width)
             const minW = Math.max(1, Math.floor(r.w * 0.25));
             const maxW = Math.min(r.w - 1, Math.ceil(r.w * 0.75));
             const splitX = minW + Math.floor(Math.random() * (maxW - minW + 1));
             
             const r1 = { id: nextId++, x: r.x, y: r.y, w: splitX, h: r.h };
             const r2 = { id: nextId++, x: r.x + splitX, y: r.y, w: r.w - splitX, h: r.h };
             rects.splice(rIndex, 1, r1, r2);
             
        } else if (!splitVertically && r.h >= 2) {
             // Split Y (Height)
             const minH = Math.max(1, Math.floor(r.h * 0.25));
             const maxH = Math.min(r.h - 1, Math.ceil(r.h * 0.75));
             const splitY = minH + Math.floor(Math.random() * (maxH - minH + 1));
             
             const r1 = { id: nextId++, x: r.x, y: r.y, w: r.w, h: splitY };
             const r2 = { id: nextId++, x: r.x, y: r.y + splitY, w: r.w, h: r.h - splitY };
             rects.splice(rIndex, 1, r1, r2);
        }
    }
    
    // Convert mathematical split to cells and puzzle definition
    const puzzleCells: Cell[] = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            puzzleCells.push({ x, y, value: 0 });
        }
    }
    
    const solution: Rect[] = [];
    
    rects.forEach((r) => {
        // Place the area requirement number in one random cell within the partition
        const numX = r.x + Math.floor(Math.random() * r.w);
        const numY = r.y + Math.floor(Math.random() * r.h);
        const area = r.w * r.h;
        
        const cell = puzzleCells.find(c => c.x === numX && c.y === numY);
        if (cell) cell.value = area;
        
        solution.push({ ...r });
    });
    
    return { puzzleCells, solution };
}
