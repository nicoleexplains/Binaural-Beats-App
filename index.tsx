import React, { useState, useRef, useEffect, FC } from 'react';
import { createRoot } from 'react-dom/client';

const PlayIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

interface Preset {
  name: string;
  frequency: number;
  volume: number;
  selectedAmbient: string;
  ambientVolume: number;
}

const AMBIENT_SOUNDS: Record<string, string> = {
  none: 'None',
  whiteNoise: 'White Noise',
  rain: 'Rain',
  forest: 'Forest',
};

const AMBIENT_SOUND_URLS: Record<string, string> = {
  whiteNoise: 'https://cdn.pixabay.com/audio/2022/02/04/audio_308221293b.mp3',
  rain: 'https://cdn.pixabay.com/audio/2022/08/10/audio_502755e74f.mp3',
  forest: 'https://cdn.pixabay.com/audio/2022/11/18/audio_82c2288825.mp3',
};

const COLOR_SCHEMES = [
    (ctx: CanvasRenderingContext2D, height: number) => {
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#6366f1');    // indigo-500
        gradient.addColorStop(0.6, '#a855f7'); // purple-500
        gradient.addColorStop(1, '#ec4899');    // pink-500
        return gradient;
    },
    (ctx: CanvasRenderingContext2D, height: number) => {
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#10b981'); // emerald-500
        gradient.addColorStop(0.5, '#06b6d4'); // cyan-500
        gradient.addColorStop(1, '#3b82f6'); // blue-500
        return gradient;
    },
    (ctx: CanvasRenderingContext2D, height: number) => {
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#f97316'); // orange-500
        gradient.addColorStop(0.5, '#ef4444'); // red-500
        gradient.addColorStop(1, '#facc15'); // yellow-400
        return gradient;
    }
];


const App: FC = () => {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [frequency, setFrequency] = useState<number>(10.0);
    const [volume, setVolume] = useState<number>(0.5);
    const [selectedAmbient, setSelectedAmbient] = useState<string>('none');
    const [ambientVolume, setAmbientVolume] = useState<number>(0.3);
    const [presets, setPresets] = useState<Preset[]>([]);
    const [isVisualizerPaused, setIsVisualizerPaused] = useState<boolean>(false);
    const [colorSchemeIndex, setColorSchemeIndex] = useState<number>(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const leftOscillatorRef = useRef<OscillatorNode | null>(null);
    const rightOscillatorRef = useRef<OscillatorNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const ambientSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const ambientGainNodeRef = useRef<GainNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const audioBufferCacheRef = useRef<Record<string, AudioBuffer>>({});


    const baseFrequency = 220; // A3 note

    useEffect(() => {
        try {
            const savedPresets = localStorage.getItem('binauralPresets');
            if (savedPresets) {
                setPresets(JSON.parse(savedPresets));
            }
        } catch (error) {
            console.error("Failed to load presets from localStorage", error);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('binauralPresets', JSON.stringify(presets));
        } catch (error) {
            console.error("Failed to save presets to localStorage", error);
        }
    }, [presets]);


    const drawVisualizer = () => {
        if (!analyserRef.current || !canvasRef.current) return;
        const analyser = analyserRef.current;
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = '#1f2937'; // bg-gray-800
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        
        const gradient = COLOR_SCHEMES[colorSchemeIndex](canvasCtx, canvas.height);
        canvasCtx.fillStyle = gradient;

        const barsToDraw = 128; 
        const barSpacing = 1;
        const totalBarWidth = canvas.width / barsToDraw;
        const barWidth = Math.max(1, totalBarWidth - barSpacing);

        for (let i = 0; i < barsToDraw; i++) {
            const barHeightNormalized = dataArray[i] / 255.0;
            const barHeight = Math.pow(barHeightNormalized, 2.2) * canvas.height;
            const x = i * totalBarWidth;
            if (barHeight > 0) {
              canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            }
        }
        animationFrameIdRef.current = requestAnimationFrame(drawVisualizer);
    };
    
    const stopTone = () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (canvasRef.current) {
        const canvasCtx = canvasRef.current.getContext('2d');
        if (canvasCtx) {
            canvasCtx.fillStyle = '#1f2937';
            canvasCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().then(() => {
            audioContextRef.current = null;
        });
      }
    };

    const playAmbientSound = async (context: AudioContext) => {
        if (selectedAmbient === 'none' || !analyserRef.current) return;

        if (ambientSourceRef.current) {
            ambientSourceRef.current.stop();
            ambientSourceRef.current = null;
        }

        ambientGainNodeRef.current = context.createGain();
        ambientGainNodeRef.current.gain.setValueAtTime(ambientVolume, context.currentTime);
        ambientGainNodeRef.current.connect(analyserRef.current);

        const url = AMBIENT_SOUND_URLS[selectedAmbient];
        let audioBuffer = audioBufferCacheRef.current[url];

        if (!audioBuffer) {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                audioBuffer = await context.decodeAudioData(arrayBuffer);
                audioBufferCacheRef.current[url] = audioBuffer;
            } catch (error) {
                console.error("Failed to load ambient sound:", error);
                return;
            }
        }
        
        ambientSourceRef.current = context.createBufferSource();
        ambientSourceRef.current.buffer = audioBuffer;
        ambientSourceRef.current.loop = true;
        ambientSourceRef.current.connect(ambientGainNodeRef.current);
        ambientSourceRef.current.start();
    };

    const playTone = () => {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;

        analyserRef.current = context.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.connect(context.destination);

        // Binaural setup
        gainNodeRef.current = context.createGain();
        gainNodeRef.current.gain.setValueAtTime(volume, context.currentTime);
        gainNodeRef.current.connect(analyserRef.current);

        const leftPanner = context.createStereoPanner();
        leftPanner.pan.setValueAtTime(-1, context.currentTime);
        leftPanner.connect(gainNodeRef.current);
        
        leftOscillatorRef.current = context.createOscillator();
        leftOscillatorRef.current.type = 'sine';
        leftOscillatorRef.current.frequency.setValueAtTime(baseFrequency - (frequency / 2), context.currentTime);
        leftOscillatorRef.current.connect(leftPanner);
        leftOscillatorRef.current.start();

        const rightPanner = context.createStereoPanner();
        rightPanner.pan.setValueAtTime(1, context.currentTime);
        rightPanner.connect(gainNodeRef.current);

        rightOscillatorRef.current = context.createOscillator();
        rightOscillatorRef.current.type = 'sine';
        rightOscillatorRef.current.frequency.setValueAtTime(baseFrequency + (frequency / 2), context.currentTime);
        rightOscillatorRef.current.connect(rightPanner);
        rightOscillatorRef.current.start();
        
        playAmbientSound(context);
        
        setIsVisualizerPaused(false);
        if (!isVisualizerPaused) {
           drawVisualizer();
        }
    };

    const handleTogglePlay = () => {
        if (isPlaying) {
            stopTone();
        } else {
            playTone();
        }
        setIsPlaying(!isPlaying);
    };
    
    const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = parseFloat(e.target.value);
        if (isNaN(value)) value = 0;
        if (value < 0) value = 0;
        if (value > 5000) value = 5000;
        setFrequency(value);
    };

    const handleSavePreset = () => {
        const name = prompt('Enter a name for this preset:');
        if (name) {
            const newPreset: Preset = { name, frequency, volume, selectedAmbient, ambientVolume };
            setPresets(prevPresets => [...prevPresets, newPreset]);
        }
    };

    const handleLoadPreset = (preset: Preset) => {
        setFrequency(preset.frequency);
        setVolume(preset.volume);
        setSelectedAmbient(preset.selectedAmbient);
        setAmbientVolume(preset.ambientVolume);
    };

    const handleDeletePreset = (presetName: string) => {
        if (window.confirm(`Are you sure you want to delete the preset "${presetName}"?`)) {
            setPresets(prevPresets => prevPresets.filter(p => p.name !== presetName));
        }
    };

    const handleToggleVisualizerPause = () => {
        const willBePaused = !isVisualizerPaused;
        setIsVisualizerPaused(willBePaused);
        if (willBePaused && animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        } else if (!willBePaused && isPlaying) {
            drawVisualizer();
        }
    };

    const handleResetVisualizer = () => {
        if (canvasRef.current) {
            const canvasCtx = canvasRef.current.getContext('2d');
            if (canvasCtx) {
                canvasCtx.fillStyle = '#1f2937'; // bg-gray-800
                canvasCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
    };

    const handleChangeColorScheme = () => {
        setColorSchemeIndex(prev => (prev + 1) % COLOR_SCHEMES.length);
    };

    useEffect(() => {
        if (isPlaying && audioContextRef.current && leftOscillatorRef.current && rightOscillatorRef.current) {
            const currentTime = audioContextRef.current.currentTime;
            leftOscillatorRef.current.frequency.linearRampToValueAtTime(baseFrequency - (frequency / 2), currentTime + 0.1);
            rightOscillatorRef.current.frequency.linearRampToValueAtTime(baseFrequency + (frequency / 2), currentTime + 0.1);
        }
    }, [frequency, isPlaying]);

    useEffect(() => {
        if (isPlaying && gainNodeRef.current && audioContextRef.current) {
            gainNodeRef.current.gain.linearRampToValueAtTime(volume, audioContextRef.current.currentTime + 0.1);
        }
    }, [volume, isPlaying]);
    
    useEffect(() => {
        if (isPlaying && ambientGainNodeRef.current && audioContextRef.current) {
            ambientGainNodeRef.current.gain.linearRampToValueAtTime(ambientVolume, audioContextRef.current.currentTime + 0.1);
        }
    }, [ambientVolume, isPlaying]);
    
    useEffect(() => {
        if (isPlaying && audioContextRef.current) {
            playAmbientSound(audioContextRef.current);
        }
    }, [selectedAmbient]);

    useEffect(() => {
        if(canvasRef.current){
             const canvasCtx = canvasRef.current.getContext('2d');
             if (canvasCtx) {
                canvasCtx.fillStyle = '#1f2937';
                canvasCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
        return () => {
            if (audioContextRef.current) {
                stopTone();
            }
        };
    }, []);

    return (
        <main className="flex items-center justify-center min-h-screen p-4 bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-2xl shadow-2xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Binaural Beat Generator</h1>
                    <p className="mt-2 text-gray-400">Craft your focus frequency</p>
                </div>

                <canvas ref={canvasRef} width="320" height="100" className="w-full rounded-lg"></canvas>

                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-300">Visualizer Controls</h3>
                    <div className="flex space-x-2">
                        <button onClick={handleToggleVisualizerPause} disabled={!isPlaying} className="flex-1 py-2 px-3 text-sm font-semibold text-white bg-gray-600 rounded-md hover:bg-gray-700 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-ring-indigo">
                            {isVisualizerPaused ? 'Resume' : 'Pause'}
                        </button>
                         <button onClick={handleChangeColorScheme} disabled={!isPlaying} className="flex-1 py-2 px-3 text-sm font-semibold text-white bg-gray-600 rounded-md hover:bg-gray-700 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-ring-indigo">
                            Change Colors
                        </button>
                        <button onClick={handleResetVisualizer} disabled={!isPlaying} className="flex-1 py-2 px-3 text-sm font-semibold text-white bg-gray-600 rounded-md hover:bg-gray-700 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-ring-indigo">
                            Reset
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label htmlFor="frequency" className="block text-sm font-medium text-gray-300 mb-2">
                            Frequency ({frequency.toFixed(2)} Hz)
                        </label>
                        <input
                            id="frequency"
                            type="number"
                            min="0"
                            max="5000"
                            step="0.1"
                            value={frequency}
                            onChange={handleFrequencyChange}
                            aria-label="Binaural frequency in Hertz"
                            className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus-ring-indigo"
                        />
                    </div>

                    <div>
                        <label htmlFor="volume" className="block text-sm font-medium text-gray-300 mb-2">
                            Binaural Beat Volume
                        </label>
                        <input
                            id="volume"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            aria-label="Binaural beat volume control"
                        />
                    </div>
                    
                    <div className="pt-4 border-t border-gray-700">
                         <label htmlFor="ambient-sound" className="block text-sm font-medium text-gray-300 mb-2">
                            Ambient Sound
                        </label>
                        <select
                            id="ambient-sound"
                            value={selectedAmbient}
                            onChange={(e) => setSelectedAmbient(e.target.value)}
                            className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus-ring-indigo"
                        >
                            {Object.entries(AMBIENT_SOUNDS).map(([key, name]) => (
                                <option key={key} value={key}>{name}</option>
                            ))}
                        </select>
                    </div>

                     <div>
                        <label htmlFor="ambient-volume" className="block text-sm font-medium text-gray-300 mb-2">
                           Ambient Volume
                        </label>
                        <input
                            id="ambient-volume"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={ambientVolume}
                            onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                            aria-label="Ambient sound volume control"
                            disabled={selectedAmbient === 'none'}
                        />
                    </div>
                </div>
                
                <button
                    onClick={handleTogglePlay}
                    aria-label={isPlaying ? 'Pause tone' : 'Play tone'}
                    className="w-full flex items-center justify-center py-3 px-4 text-white font-bold bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus-ring-indigo"
                >
                    {isPlaying ? (
                        <PauseIcon className="w-6 h-6 mr-2" />
                    ) : (
                        <PlayIcon className="w-6 h-6 mr-2" />
                    )}
                    {isPlaying ? 'Pause' : 'Play'}
                </button>

                <div className="pt-6 border-t border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4">Presets</h2>
                    <button
                        onClick={handleSavePreset}
                        className="w-full mb-4 py-2 px-4 text-white font-semibold bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors duration-200 focus-ring-indigo"
                    >
                        Save Current Settings
                    </button>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {presets.length > 0 ? (
                            presets.map((preset) => (
                                <div key={preset.name} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-white">{preset.name}</p>
                                        <p className="text-sm text-gray-400">
                                          {preset.frequency.toFixed(2)} Hz, Vol: {(preset.volume * 100).toFixed(0)}%
                                          {preset.selectedAmbient !== 'none' && `, ${AMBIENT_SOUNDS[preset.selectedAmbient]} Vol: ${(preset.ambientVolume * 100).toFixed(0)}%`}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleLoadPreset(preset)}
                                            aria-label={`Load preset ${preset.name}`}
                                            className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus-ring-indigo"
                                        >
                                            Load
                                        </button>
                                        <button
                                            onClick={() => handleDeletePreset(preset.name)}
                                            aria-label={`Delete preset ${preset.name}`}
                                            className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus-ring-red"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500">No saved presets yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
