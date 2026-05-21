import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Play, CheckCircle2, Trophy, Loader2 } from 'lucide-react';
import { PuzzleGrid } from './components/PuzzleGrid';
import { LevelConfig, Puzzle, Rect, ColorTheme, Cell } from './types';
import { initAuth, googleSignIn, logout } from './lib/auth';
import { User } from 'firebase/auth';
import { addScoreToLeaderboard, getTop10Scores } from './lib/sheets';

const LEVELS: LevelConfig[] = [
    { 
        level: 1, label: "Awakening", width: 5, height: 5,
        numbers: [{ x: 0, y: 0, value: 2 }, { x: 2, y: 0, value: 3 }, { x: 0, y: 1, value: 2 }, { x: 3, y: 1, value: 4 }, { x: 2, y: 2, value: 4 }, { x: 1, y: 4, value: 4 }, { x: 2, y: 3, value: 2 }, { x: 4, y: 4, value: 4 }]
    },
    { 
        level: 2, label: "Genin", width: 6, height: 6,
        numbers: [{ x: 0, y: 0, value: 4 }, { x: 2, y: 1, value: 4 }, { x: 4, y: 0, value: 4 }, { x: 0, y: 3, value: 3 }, { x: 1, y: 3, value: 4 }, { x: 5, y: 2, value: 3 }, { x: 4, y: 4, value: 6 }, { x: 1, y: 4, value: 2 }, { x: 1, y: 5, value: 3 }, { x: 4, y: 5, value: 3 }]
    },
    { 
        level: 3, label: "Chunin", width: 7, height: 7,
        numbers: [{ x: 1, y: 3, value: 21 }, { x: 5, y: 1, value: 12 }, { x: 5, y: 5, value: 16 }]
    },
    { 
        level: 4, label: "Jonin", width: 8, height: 8,
        numbers: [{ x: 0, y: 4, value: 16 }, { x: 4, y: 1, value: 24 }, { x: 3, y: 6, value: 12 }, { x: 6, y: 5, value: 12 }]
    },
    { 
        level: 5, label: "Anbu", width: 9, height: 9,
        numbers: [{ x: 1, y: 4, value: 27 }, { x: 6, y: 1, value: 18 }, { x: 4, y: 4, value: 18 }, { x: 7, y: 7, value: 18 }]
    },
    { 
        level: 6, label: "Kage", width: 10, height: 10,
        numbers: [{ x: 0, y: 2, value: 10 }, { x: 3, y: 3, value: 15 }, { x: 6, y: 0, value: 10 }, { x: 8, y: 3, value: 15 }, { x: 0, y: 8, value: 5 }, { x: 2, y: 6, value: 20 }, { x: 7, y: 7, value: 25 }]
    },
    { 
        level: 7, label: "Sannin", width: 11, height: 11,
        numbers: [{ x: 5, y: 0, value: 22 }, { x: 0, y: 5, value: 18 }, { x: 6, y: 3, value: 27 }, { x: 4, y: 8, value: 30 }, { x: 9, y: 7, value: 24 }]
    },
    { 
        level: 8, label: "Hero", width: 12, height: 12,
        numbers: [{ x: 1, y: 1, value: 12 }, { x: 1, y: 8, value: 24 }, { x: 4, y: 3, value: 21 }, { x: 4, y: 9, value: 15 }, { x: 7, y: 2, value: 18 }, { x: 7, y: 8, value: 18 }, { x: 10, y: 4, value: 27 }, { x: 10, y: 10, value: 9 }]
    },
    { 
        level: 9, label: "Demigod", width: 13, height: 13,
        numbers: [{ x: 2, y: 1, value: 15 }, { x: 9, y: 1, value: 24 }, { x: 3, y: 4, value: 21 }, { x: 10, y: 4, value: 18 }, { x: 2, y: 7, value: 12 }, { x: 8, y: 7, value: 27 }, { x: 3, y: 10, value: 24 }, { x: 10, y: 11, value: 28 }]
    },
    { 
        level: 10, label: "God Mode", width: 14, height: 14,
        numbers: [{ x: 3, y: 0, value: 14 }, { x: 10, y: 0, value: 14 }, { x: 0, y: 4, value: 12 }, { x: 0, y: 10, value: 12 }, { x: 4, y: 13, value: 12 }, { x: 10, y: 13, value: 12 }, { x: 13, y: 4, value: 10 }, { x: 13, y: 10, value: 10 }, { x: 4, y: 4, value: 25 }, { x: 9, y: 4, value: 25 }, { x: 4, y: 9, value: 25 }, { x: 9, y: 9, value: 25 }]
    },
];

const THEMES: ColorTheme[] = [
    { bg: 'bg-[#FF90E8]', border: 'border-black', text: 'text-black' },
    { bg: 'bg-[#FFC900]', border: 'border-black', text: 'text-black' },
    { bg: 'bg-[#00E5FF]', border: 'border-black', text: 'text-black' },
    { bg: 'bg-[#B0FF2B]', border: 'border-black', text: 'text-black' },
    { bg: 'bg-[#FF5C00]', border: 'border-black', text: 'text-black' },
    { bg: 'bg-[#B966EC]', border: 'border-black', text: 'text-black' },
    { bg: 'bg-[#FF2E93]', border: 'border-black', text: 'text-black' },
    { bg: 'bg-[#00D084]', border: 'border-black', text: 'text-black' },
    { bg: 'bg-[#3A86FF]', border: 'border-black', text: 'text-black' },
];

const getRandomTheme = () => THEMES[Math.floor(Math.random() * THEMES.length)];

const padId = (id: number) => id.toString().padStart(2, '0');

export default function App() {
    const [currentLevel, setCurrentLevel] = useState<number>(1);
    const [gridConfig, setGridConfig] = useState<LevelConfig>(LEVELS[0]);
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [placedBlocks, setPlacedBlocks] = useState<Rect[]>([]);
    
    // milliseconds for high precision session time
    const [elapsedMs, setElapsedMs] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isWon, setIsWon] = useState<boolean>(false);

    // Auth & Leaderboard State
    const [needsAuth, setNeedsAuth] = useState(true);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [username, setUsername] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const [leaderboard, setLeaderboard] = useState<{name: string, timeMs: number}[]>([]);
    const [isSubmittingScore, setIsSubmittingScore] = useState(false);
    const [hasStartedGame, setHasStartedGame] = useState(false);

    useEffect(() => {
        const unsubscribe = initAuth(
            (u, token) => {
                setUser(u);
                setNeedsAuth(false);
            },
            () => setNeedsAuth(true)
        );
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        setIsLoggingIn(true);
        try {
            const result = await googleSignIn();
            if (result) {
                setUser(result.user);
                setNeedsAuth(false);
            }
        } catch (err) {
            console.error('Login failed:', err);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = async () => {
        setIsLoggingIn(true);
        try {
            await logout();
            setUser(null);
            setNeedsAuth(true);
            setHasStartedGame(false);
            setUsername('');
        } catch (err) {
            console.error('Logout failed:', err);
        } finally {
            setIsLoggingIn(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        if (!needsAuth && hasStartedGame) {
            getTop10Scores().then(scores => {
                if (mounted) setLeaderboard(scores);
            });
        }
        return () => { mounted = false; };
    }, [needsAuth, hasStartedGame]);

    const initLevel = useCallback((level: number) => {
        let config = LEVELS.find(l => l.level === level);
        if (!config) {
            config = LEVELS[0]; // fallback safely
        }
        
        const puzzleCells: Cell[] = [];
        for (let y = 0; y < config.height; y++) {
            for (let x = 0; x < config.width; x++) {
                puzzleCells.push({ x, y, value: 0 });
            }
        }
        
        config.numbers.forEach(n => {
            const cell = puzzleCells.find(c => c.x === n.x && c.y === n.y);
            if (cell) cell.value = n.value;
        });

        setGridConfig(config);
        setPuzzle({ puzzleCells, solution: [] });
        setPlacedBlocks([]);
        if (level === 1) {
            setElapsedMs(0); // Only reset timer dynamically when going back to level 1
        }
        setIsPlaying(true);
        setIsWon(false);
        setCurrentLevel(config.level);
    }, []);

    useEffect(() => {
        if (!puzzle && hasStartedGame) initLevel(currentLevel);
    }, [initLevel, puzzle, currentLevel, hasStartedGame]);

    useEffect(() => {
        let reqId: number;
        let lastTime = performance.now();
        
        const tick = (time: number) => {
            if (isPlaying && !isWon) {
                const delta = time - lastTime;
                setElapsedMs(prev => prev + delta);
            }
            lastTime = time;
            reqId = requestAnimationFrame(tick);
        };
        
        reqId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(reqId);
    }, [isPlaying, isWon]);

    useEffect(() => {
        if (!puzzle || placedBlocks.length === 0) return;
        
        const totalCoveredArea = placedBlocks.reduce((sum, b) => sum + (b.w * b.h), 0);
        if (totalCoveredArea === gridConfig.width * gridConfig.height) {
            setIsWon(true);
            setIsPlaying(false);
            
            if (gridConfig.level === 10) {
                // Submit score to Google Sheets
                setIsSubmittingScore(true);
                const finalName = username.trim() || user?.displayName || 'Anonymous';
                addScoreToLeaderboard(finalName, elapsedMs)
                    .then(() => getTop10Scores())
                    .then((scores) => {
                        setLeaderboard(scores);
                        setIsSubmittingScore(false);
                    })
                    .catch((e) => {
                        console.error('Failed to submit score:', e);
                        setIsSubmittingScore(false);
                    });
            }
        }
    }, [placedBlocks, puzzle, gridConfig, username, user, elapsedMs]);

    const handlePlaceBlock = (rect: Rect) => {
        if (!puzzle || isWon) return;
        const area = rect.w * rect.h;
        
        const hasOverlap = placedBlocks.some(b => 
            rect.x < b.x + b.w && rect.x + rect.w > b.x &&
            rect.y < b.y + b.h && rect.y + rect.h > b.y
        );
        if (hasOverlap) return;
        
        const numbersInside = puzzle.puzzleCells.filter(c => 
            c.value > 0 &&
            c.x >= rect.x && c.x < rect.x + rect.w &&
            c.y >= rect.y && c.y < rect.y + rect.h
        );
        
        if (numbersInside.length === 1 && numbersInside[0].value === area) {
            const newId = Date.now();
            const theme = getRandomTheme();
            setPlacedBlocks(prev => [...prev, { ...rect, id: newId, theme }]);
        }
    };

    const handleRemoveBlock = (id: number) => {
        if (isWon) return;
        setPlacedBlocks(prev => prev.filter(b => b.id !== id));
    };

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        const centis = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
        return `${minutes}:${seconds}.${centis}`;
    };

    const progressPercentage = useMemo(() => {
        if (!puzzle) return 0;
        const totalCoveredArea = placedBlocks.reduce((sum, b) => sum + (b.w * b.h), 0);
        return Math.floor((totalCoveredArea / (gridConfig.width * gridConfig.height)) * 100);
    }, [placedBlocks, puzzle, gridConfig]);

    if (needsAuth) {
        return (
            <div className="min-h-screen bg-slate-800 md:p-8 flex items-center justify-center font-sans tracking-wide">
                <div className="bg-[#F7FFF7] p-10 rounded-[2rem] border-[6px] border-black shadow-[12px_12px_0_0_#000] max-w-lg w-full flex flex-col items-center text-center">
                    <h1 className="text-5xl font-black text-black mb-4 uppercase tracking-tighter drop-shadow-[2px_2px_0_#FFF]">
                        Shikaku <br/><span className="text-[#00E5FF]">Speedrun</span>
                    </h1>
                    <p className="font-bold mb-8 text-lg">Connect your Google account to save your speedrun times to Google Sheets!</p>
                    
                    <button 
                        onClick={handleLogin}
                        disabled={isLoggingIn}
                        className="w-full flex items-center justify-center gap-4 bg-white hover:bg-zinc-50 border-4 border-black p-4 rounded-2xl shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                    >
                        {isLoggingIn ? (
                            <Loader2 className="animate-spin text-black" size={28} />
                        ) : (
                            <>
                                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-8 h-8">
                                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                                </svg>
                                <span className="text-xl font-black tracking-tight text-black">Sign in with Google</span>
                            </>
                        )}
                    </button>
                    {!isLoggingIn && (
                        <p className="text-xs text-zinc-500 font-bold mt-4">Requires permission to access Google Sheets to store your Leaderboard times.</p>
                    )}
                </div>
            </div>
        );
    }

    if (!hasStartedGame) {
        return (
            <div className="min-h-screen bg-slate-800 md:p-8 flex items-center justify-center font-sans tracking-wide">
                <div className="bg-[#B0FF2B] p-10 rounded-[2rem] border-[6px] border-black shadow-[12px_12px_0_0_#000] max-w-lg w-full flex flex-col items-center">
                    <h2 className="text-4xl font-black text-black mb-6 uppercase tracking-tighter drop-shadow-[2px_2px_0_#FFF]">Ready to Run?</h2>
                    
                    <div className="w-full mb-8 flex flex-col">
                        <label className="text-sm font-black uppercase text-black mb-2 tracking-widest text-left">SPEEDRUNNER NAME</label>
                        <input 
                            type="text" 
                            className="w-full bg-white border-4 border-black rounded-xl p-4 text-xl font-black outline-none focus:ring-4 focus:ring-black placeholder:text-zinc-400 shadow-[4px_4px_0_0_#000]"
                            placeholder={user?.displayName || "Anonymous"} 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <button 
                        onClick={() => {
                            setHasStartedGame(true);
                            initLevel(1);
                        }}
                        className="w-full flex items-center justify-center gap-3 py-5 bg-[#FF5C00] hover:bg-[#FF7A33] text-black border-4 border-black rounded-2xl font-black text-2xl uppercase tracking-widest active:translate-y-2 active:translate-x-2 active:shadow-none shadow-[8px_8px_0_0_#000] transition-all"
                    >
                        Start Game <Play size={24} fill="currentColor" strokeWidth={3}/>
                    </button>
                </div>
            </div>
        );
    }

    if (!puzzle) return null;

    return (
        <div className="min-h-screen bg-slate-800 md:p-8 flex flex-col xl:flex-row items-center xl:items-start justify-center gap-8 font-sans tracking-wide">
            <div className="w-full max-w-6xl xl:max-w-5xl md:rounded-3xl bg-[#F7FFF7] shadow-[12px_12px_0_0_#000] border-[6px] border-black p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 relative overflow-hidden">
                
                {/* Top User Row */}
                <div className="md:col-span-12 flex justify-between items-center bg-white rounded-2xl p-4 shadow-[4px_4px_0_0_#000] border-4 border-black">
                    <div className="font-black text-xl md:text-2xl uppercase tracking-widest text-black flex items-center gap-2">
                        <Trophy className="text-[#FFC900]" strokeWidth={3} /> Shikaku Run
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="font-bold text-black hidden sm:block">Player: <span className="text-[#00E5FF] font-black">{user?.displayName || username || 'Anonymous'}</span></div>
                        <button onClick={handleLogout} disabled={isLoggingIn} className="bg-[#FF2E93] hover:bg-[#FF5C00] text-black px-4 py-2 font-black border-2 border-black rounded-xl shadow-[2px_2px_0_0_#000] active:translate-y-1 active:translate-x-1 active:shadow-none text-sm uppercase transition-all flex items-center gap-2 disabled:opacity-50">
                            {isLoggingIn ? <Loader2 className="animate-spin" size={16} /> : 'Logout'}
                        </button>
                    </div>
                </div>

                {/* Top Statistics Row */}
                <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {/* Current Level */}
                    <div className="bg-[#B0FF2B] rounded-2xl shadow-[4px_4px_0_0_#000] border-4 border-black p-4 xl:p-6 flex flex-col justify-center">
                        <div className="text-[11px] font-black text-black tracking-widest mb-1 uppercase">Current Level</div>
                        <div className="text-3xl font-black italic text-black tracking-tight drop-shadow-[2px_2px_0_#FFF]">
                            Lvl {padId(currentLevel)} <span className="text-black font-black opacity-60 text-xl">/ 10</span>
                        </div>
                    </div>

                    {/* Timer */}
                    <div className="bg-[#00E5FF] rounded-2xl shadow-[4px_4px_0_0_#000] border-4 border-black p-4 xl:p-6 flex flex-col justify-center">
                        <div className="text-[11px] font-black text-black tracking-widest mb-1 uppercase">Global Timer</div>
                        <div className="text-3xl font-black font-mono text-black tracking-tighter drop-shadow-[2px_2px_0_#FFF]">
                            {formatTime(elapsedMs)}
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="bg-[#FF90E8] rounded-2xl shadow-[4px_4px_0_0_#000] border-4 border-black p-4 xl:p-6 flex flex-col justify-center">
                        <div className="text-[11px] font-black text-black tracking-widest mb-2 uppercase">Progress</div>
                        <div className="flex items-center gap-3">
                            <div className="text-2xl font-black text-black drop-shadow-[2px_2px_0_#FFF] leading-none">{progressPercentage}%</div>
                            <div className="w-full h-4 border-2 border-black bg-white rounded-full overflow-hidden shadow-inner">
                                <motion.div 
                                    className="h-full bg-[#FF2E93] border-r-2 border-black" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercentage}%` }}
                                    transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reset Button */}
                    <button 
                        onClick={() => initLevel(currentLevel)}
                        className="bg-[#FFE66D] hover:bg-[#FFD100] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0_0_#000] text-black font-black rounded-2xl shadow-[4px_4px_0_0_#000] border-4 border-black p-4 xl:p-6 flex flex-col items-center justify-center transition-all uppercase tracking-widest text-lg"
                    >
                        <RotateCcw size={24} strokeWidth={3} className="mb-1" />
                        Restart
                    </button>
                </div>

                {/* Left Sidebar Layout */}
                <div className="md:col-span-3 flex flex-col gap-6">
                    <div className="bg-white rounded-2xl shadow-[4px_4px_0_0_#000] border-4 border-black p-6 flex flex-col flex-grow">
                        <div className="text-[12px] font-black text-black tracking-widest mb-4 uppercase inline-block border-b-4 border-black pb-1">Rules</div>
                        <p className="text-sm font-bold text-black mb-6 leading-relaxed">
                            Draw <span className="text-[#FF2E93] font-black text-base">rectangles</span> on the grid! Each MUST contain exactly <span className="text-[#00D084] font-black text-base">ONE NUMBER</span> equal to its area!
                        </p>
                        
                        <ul className="space-y-4 mb-auto">
                            <li className="flex items-center text-sm font-black text-black gap-3">
                                <CheckCircle2 className="text-[#00D084]" size={20} strokeWidth={3} /> Grid Covered
                            </li>
                            <li className="flex items-center text-sm font-black text-black gap-3">
                                <CheckCircle2 className="text-[#FF2E93]" size={20} strokeWidth={3} /> No Overlaps
                            </li>
                            <li className="flex items-center text-sm font-black text-black gap-3">
                                <CheckCircle2 className="text-[#3A86FF]" size={20} strokeWidth={3} /> Exact Area
                            </li>
                        </ul>
                    </div>

                    <div className="bg-black rounded-2xl shadow-[4px_4px_0_0_#FFE66D] border-4 border-black p-6 text-white relative overflow-hidden transform hover:-rotate-1 transition-transform mt-auto">
                        <div className="text-[11px] font-black text-[#FFE66D] tracking-widest mb-2 uppercase">Pro-Tip!</div>
                        <p className="text-sm font-bold text-white leading-relaxed font-sans">
                            "Start from the corners or prime numbers! They only have one way to go!"
                        </p>
                    </div>
                </div>

                {/* Main Grid View */}
                <div className="md:col-span-9 bg-white rounded-3xl shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] border-4 border-black p-4 sm:p-6 xl:p-10 flex items-center justify-center min-h-[500px]">
                    <div className="w-full h-full max-w-2xl aspect-square flex flex-col">
                        <PuzzleGrid 
                            config={gridConfig}
                            puzzle={puzzle}
                            placedBlocks={placedBlocks}
                            onPlaceBlock={handlePlaceBlock}
                            onRemoveBlock={handleRemoveBlock}
                        />
                    </div>
                </div>
            </div>

            {/* Wall of Fame Board */}
            <div className="w-full max-w-sm xl:w-96 md:rounded-3xl bg-[#00E5FF] shadow-[12px_12px_0_0_#000] border-[6px] border-black p-6 flex flex-col shrink-0">
                <div className="flex items-center gap-3 border-b-4 border-black pb-4 mb-6">
                    <Trophy className="text-[#FFC900] bg-black p-2 rounded-xl" size={48} strokeWidth={2} />
                    <h3 className="font-black text-3xl uppercase text-black leading-tight drop-shadow-[2px_2px_0_#FFF]">Wall of Fame</h3>
                </div>
                {leaderboard.length === 0 ? (
                    <p className="font-bold text-black/70 text-center py-10 bg-white border-4 border-black shadow-[4px_4px_0_0_#000] rounded-xl flex-grow flex items-center justify-center">No scores yet.<br/>Be the first!</p>
                ) : (
                    <ul className="space-y-3 flex-grow">
                        {leaderboard.slice(0, 10).map((entry, idx) => (
                            <li key={idx} className="font-black text-black flex justify-between items-center text-lg bg-white p-3 rounded-xl border-4 border-black shadow-[4px_4px_0_0_#000] transform hover:-translate-y-1 hover:-translate-x-1 transition-transform">
                                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                    <span className={`w-8 h-8 flex items-center justify-center border-2 border-black rounded-full text-sm shrink-0 ${idx === 0 ? 'bg-[#FFE66D]' : idx === 1 ? 'bg-zinc-300' : idx === 2 ? 'bg-[#FF90E8]' : 'bg-transparent'}`}>
                                        {idx + 1}
                                    </span>
                                    <span className="truncate">{entry.name}</span>
                                </div>
                                <span className="font-mono bg-[#B0FF2B] px-3 py-1 rounded-lg border-2 border-black ml-2 text-sm shrink-0 shadow-[2px_2px_0_0_#000]">{formatTime(entry.timeMs)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Victory Splash screen */}
            <AnimatePresence>
                {isWon && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            className="bg-[#FFE66D] border-8 border-black rounded-[2rem] shadow-[16px_16px_0_0_#000] flex flex-col items-center p-10 mt-10 text-center max-w-md w-full relative"
                        >
                            <div className="absolute -top-12 bg-[#00E5FF] border-4 border-black p-4 rounded-full shadow-[4px_4px_0_0_#000] animate-bounce text-black">
                                <CheckCircle2 size={48} strokeWidth={3}/>
                            </div>
                            
                            {currentLevel === 10 ? (
                                <>
                                    <h2 className="text-5xl font-black text-black mb-4 mt-6 drop-shadow-[2px_2px_0_#FFF] uppercase tracking-tight">YOU DID IT!</h2>
                                    <p className="text-black font-black text-xl mb-2">Game Cleared in:</p>
                                    <div className="text-4xl font-mono text-black font-black bg-white px-6 py-2 border-4 border-black shadow-[4px_4px_0_0_#000] rounded-xl mb-6">
                                        {formatTime(elapsedMs)}
                                    </div>

                                    {isSubmittingScore ? (
                                        <div className="flex flex-col items-center justify-center space-y-4 mb-6">
                                            <Loader2 className="animate-spin text-black" size={32} />
                                            <p className="font-bold text-black uppercase">Saving to Leaderboard...</p>
                                        </div>
                                    ) : (
                                        <div className="w-full bg-white border-4 border-black rounded-xl p-4 mb-6 text-left shadow-[4px_4px_0_0_#000]">
                                            <div className="flex items-center gap-2 border-b-4 border-black pb-2 mb-2">
                                                <Trophy className="text-[#FFC900]" size={24} strokeWidth={3} />
                                                <h3 className="font-black text-xl uppercase">Top 10 Leaders</h3>
                                            </div>
                                            {leaderboard.length === 0 ? (
                                                <p className="font-bold text-zinc-500 text-sm">No scores yet. You are the first!</p>
                                            ) : (
                                                <ol className="list-decimal list-inside space-y-1">
                                                    {leaderboard.map((entry, idx) => (
                                                        <li key={idx} className="font-bold text-black flex justify-between">
                                                            <span className="truncate flex-1 max-w-[150px]">{idx + 1}. {entry.name}</span>
                                                            <span className="font-mono text-zinc-600">{formatTime(entry.timeMs)}</span>
                                                        </li>
                                                    ))}
                                                </ol>
                                            )}
                                        </div>
                                    )}

                                    <button 
                                        onClick={() => initLevel(1)}
                                        disabled={isSubmittingScore}
                                        className="w-full flex items-center justify-center gap-3 py-5 bg-[#FF5C00] hover:bg-[#FF7A33] text-black border-4 border-black rounded-2xl font-black text-2xl uppercase tracking-widest active:translate-y-2 active:translate-x-2 active:shadow-none shadow-[8px_8px_0_0_#000] transition-all disabled:opacity-50"
                                    >
                                        Play Again <Play size={24} fill="currentColor" strokeWidth={3}/>
                                    </button>
                                </>
                            ) : (

                                <>
                                    <h2 className="text-5xl font-black text-black mb-4 mt-6 drop-shadow-[2px_2px_0_#FFF] uppercase tracking-tight">CLEARED!</h2>
                                    <p className="text-black font-black text-lg mb-8 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0_0_#000] rounded-lg">Current Time: {formatTime(elapsedMs)}</p>
                                    
                                    <button 
                                        onClick={() => initLevel(currentLevel + 1)}
                                        className="w-full flex items-center justify-center gap-3 py-5 bg-[#B0FF2B] hover:bg-[#C2FF4D] text-black border-4 border-black rounded-2xl font-black text-2xl uppercase tracking-widest active:translate-y-2 active:translate-x-2 active:shadow-none shadow-[8px_8px_0_0_#000] transition-all"
                                    >
                                        Next Level <Play size={24} fill="currentColor" strokeWidth={3}/>
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
