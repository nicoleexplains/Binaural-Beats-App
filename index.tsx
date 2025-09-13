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

const App: FC = () => {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [frequency, setFrequency] = useState<number>(10.0);
    const [volume, setVolume] = useState<number>(0.5);

    const audioContextRef = useRef<AudioContext | null>(null);
    const leftOscillatorRef = useRef<OscillatorNode | null>(null);
    const rightOscillatorRef = useRef<OscillatorNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);

    const baseFrequency = 220; // A3 note

    const drawVisualizer = () => {
        if (!analyserRef.current || !canvasRef.current) {
            return;
        }

        const analyser = analyserRef.current;
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        
        if (!canvasCtx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = '#1f2937'; // bg-gray-800
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = '#818cf8'; // indigo-400

        canvasCtx.beginPath();

        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * canvas.height / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
        
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
            canvasCtx.fillStyle = '#1f2937'; // bg-gray-800
            canvasCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            canvasCtx.beginPath();
            canvasCtx.moveTo(0, canvasRef.current.height / 2);
            canvasCtx.lineTo(canvasRef.current.width, canvasRef.current.height / 2);
            canvasCtx.strokeStyle = '#4b5563'; // gray-600
            canvasCtx.stroke();
        }
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().then(() => {
            audioContextRef.current = null;
            leftOscillatorRef.current = null;
            rightOscillatorRef.current = null;
            gainNodeRef.current = null;
            analyserRef.current = null;
        });
      }
    };

    const playTone = () => {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;

        analyserRef.current = context.createAnalyser();
        analyserRef.current.fftSize = 2048;

        gainNodeRef.current = context.createGain();
        gainNodeRef.current.gain.setValueAtTime(volume, context.currentTime);
        gainNodeRef.current.connect(analyserRef.current);
        analyserRef.current.connect(context.destination);

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
        
        drawVisualizer();
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

    useEffect(() => {
        if (isPlaying && audioContextRef.current && leftOscillatorRef.current && rightOscillatorRef.current) {
            const currentTime = audioContextRef.current.currentTime;
            leftOscillatorRef.current.frequency.linearRampToValueAtTime(baseFrequency - (frequency / 2), currentTime + 0.1);
            rightOscillatorRef.current.frequency.linearRampToValueAtTime(baseFrequency + (frequency / 2), currentTime + 0.1);
        }
    }, [frequency, isPlaying]);

    useEffect(() => {
        if (isPlaying && audioContextRef.current && gainNodeRef.current) {
            gainNodeRef.current.gain.linearRampToValueAtTime(volume, audioContextRef.current.currentTime + 0.1);
        }
    }, [volume, isPlaying]);
    
    useEffect(() => {
        if(canvasRef.current){
             const canvasCtx = canvasRef.current.getContext('2d');
             if (canvasCtx) {
                canvasCtx.fillStyle = '#1f2937';
                canvasCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                canvasCtx.beginPath();
                canvasCtx.moveTo(0, canvasRef.current.height / 2);
                canvasCtx.lineTo(canvasRef.current.width, canvasRef.current.height / 2);
                canvasCtx.strokeStyle = '#4b5563';
                canvasCtx.stroke();
            }
        }
        return () => {
            if (audioContextRef.current) {
                stopTone();
            }
        };
    }, []);

    return (
        <main className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-2xl shadow-2xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Binaural Beat Generator</h1>
                    <p className="mt-2 text-gray-400">Craft your focus frequency</p>
                </div>

                <canvas ref={canvasRef} width="320" height="100" className="w-full rounded-lg"></canvas>

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
                        <p className="mt-2 text-xs text-gray-500">Enter a value between 0.00 and 5000.0</p>
                    </div>

                    <div>
                        <label htmlFor="volume" className="block text-sm font-medium text-gray-300 mb-2">
                            Volume
                        </label>
                        <input
                            id="volume"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            aria-label="Volume control"
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
            </div>
        </main>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
