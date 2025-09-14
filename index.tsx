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

interface FrequencyDefinition {
  value: number;
  category: string;
  label: string;
  description: string;
}

const FREQUENCY_DEFINITIONS: FrequencyDefinition[] = [
    // Delta Frequencies (0.1 - 4 Hz)
    { value: 0.5, category: 'Delta', label: 'Pain Relief & Relaxation', description: 'Relaxation, helps soothe headaches. Pain relief. Thyroid, reproductive, excretory stimulant, whole brain toner.' },
    { value: 0.9, category: 'Delta', label: 'Euphoric Feeling', description: 'Associated with a feeling of euphoria.' },
    { value: 1.0, category: 'Delta', label: 'Well-being & Harmony', description: 'Feeling of well-being, harmony and balance. Pituitary stimulation to release growth hormone.' },
    { value: 1.05, category: 'Delta', label: 'Growth Hormone', description: 'Pituitary stimulation to release growth hormone (helps develop muscle, recover from injuries, rejuvenation). Helps hair grow and regain color.' },
    { value: 1.45, category: 'Delta', label: 'Tri-thalamic Entrainment', description: 'Tri-thalamic entrainment format; may benefit dyslexics and people with Alzheimer\'s.' },
    { value: 1.5, category: 'Delta', label: 'Universal Healing', description: 'Abrahams Universal Healing Rate. Sleep. Release from negative symptoms for chronic fatigue.' },
    { value: 2.0, category: 'Delta', label: 'Nerve Regeneration', description: 'Associated with nerve regeneration.' },
    { value: 2.5, category: 'Delta', label: 'Sedative Effect', description: 'Production of endogenous opiates (painkillers, reduce anxiety). Relieves migraine pain. Sedative effect.' },
    { value: 3.4, category: 'Delta', label: 'Restful Sleep', description: 'Helps achieve restful sleep.' },
    { value: 3.5, category: 'Delta', label: 'Unity & Regeneration', description: 'Feeling of unity with everything. Whole being regeneration, DNA stimulation. Enhancement of receptivity.' },
    { value: 3.9, category: 'Delta', label: 'Self-renewal & Awareness', description: 'Self-renewal, enhanced inner awareness. Crystal clear meditation, lucid dreams.' },
    { value: 4.0, category: 'Delta', label: 'Stress Reduction & Memory', description: 'Enkephalin release for reduced stress. Vital for memory and learning, problem solving, object naming. Extrasensory perception.' },
    
    // Theta Frequencies (4 - 8 Hz)
    { value: 4.5, category: 'Theta', label: 'Shamanic State', description: 'Brings about Shamanic/Tibetan state of consciousness, Tibetan chants.' },
    { value: 4.9, category: 'Theta', label: 'Deep Relaxation & Sleep', description: 'Induce relaxation and deeper sleep. Introspection, meditation.' },
    { value: 5.0, category: 'Theta', label: 'Problem Solving & Pain Relief', description: 'Reduces sleep required; Theta replaces need for extensive dreaming. Unusual problem solving. Relaxed states, pain relief (beta endorphin increases).' },
    { value: 5.35, category: 'Theta', label: 'Relaxing Breathing', description: 'Allows relaxing breathing, free and efficient.' },
    { value: 5.5, category: 'Theta', label: 'Inner Guidance & Intuition', description: 'Inner guidance, intuition. Shows vision of growth needed.' },
    { value: 6.0, category: 'Theta', label: 'Long Term Memory', description: 'Stimulation for long term memory.' },
    { value: 6.5, category: 'Theta', label: 'Creative Frontal Lobe', description: 'Centre of Theta frequency. Activates creative frontal lobe.' },
    { value: 7.0, category: 'Theta', label: 'Mental & Astral Projection', description: 'Mental & astral projection, bending objects, psychic surgery. Bone growth.' },
    { value: 7.5, category: 'Theta', label: 'Creative Thought', description: 'Activates creative thought for art, invention, music; problem solving. Ease of overcoming troublesome issues.' },
    { value: 7.83, category: 'Theta', label: 'Schumann Resonance (Earth)', description: 'Schumann earth resonance. Grounding, meditative, leaves you revitalized. Anti-jetlag, anti-mind control, improved stress tolerance.' },
    
    // Alpha Frequencies (8 - 12 Hz)
    { value: 8.0, category: 'Alpha', label: 'Super-learning', description: 'Super-learning new information, memorization, not comprehension. Inner-awareness of self, mind/body integration, balance.' },
    { value: 8.22, category: 'Alpha', label: 'Creativity (Mouth)', description: 'Associated with the mouth. Brings creativity.' },
    { value: 8.3, category: 'Alpha', label: 'Clairvoyance', description: 'Pick up visual images of mental objects; clairvoyance.' },
    { value: 9.0, category: 'Alpha', label: 'Body Imbalance Awareness', description: 'Awareness of causes of body imbalance & means for balance. Associated with Sacral/Svadhisthana chakra.' },
    { value: 10.0, category: 'Alpha', label: 'Mood Elevation (Serotonin)', description: 'Enhanced serotonin release. Mood elevation, arousal, stimulant. Provides relief from lost sleep, improves general mood.' },
    { value: 11.0, category: 'Alpha', label: 'Relaxed & Awake State', description: 'A relaxed yet awake state.' },
    { value: 12.0, category: 'Alpha', label: 'Mental Stability (Centering)', description: 'Centering, mental stability. Doorway to all other frequencies. Stimulate mental clarity. Associated with Throat/Vishuddha chakra.' },

    // Beta Frequencies (13 - 30 Hz)
    { value: 14.0, category: 'Beta', label: 'Alertness & Concentration', description: 'Awakeness, alert. Concentration on tasks, Focusing, vitality. Schumann Resonance (2nd frequency). Intelligence Enhancement (with 22.0 Hz).' },
    { value: 15.0, category: 'Beta', label: 'Increased Mental Ability', description: 'Increased mental ability, focus, alertness, IQ.' },
    { value: 16.0, category: 'Beta', label: 'Oxygen/Calcium Release', description: 'Bottom of hearing range. Releases oxygen/calcium into cells.' },
    { value: 18.0, category: 'Beta', label: 'Alertness & Stress', description: 'Fully awake, normal state of alertness, stress & anxiety. Improve hyperactive behavior.' },
    { value: 20.0, category: 'Beta', label: 'Energize & Soothe Tinnitus', description: 'Fatigue, energize. Schumann Resonance (3rd frequency). Stimulation of pineal gland. Helps with tinnitus.' },
    { value: 22.0, category: 'Beta', label: 'Intelligence Enhancement', description: 'Used with 14 Hz for intelligence enhancement. Used with 40 Hz for \'out of body\' travel and psychic healing.' },
    { value: 25.0, category: 'Beta', label: 'Visual Cortex Imprinting', description: 'Bypassing the eyes for images imprinting (visual cortex). Tested clinically with patients who complain of anxiety.' },
    { value: 26.0, category: 'Beta', label: 'Schumann Resonance (4th)', description: 'Schumann Resonance (4th frequency).' },
    { value: 30.0, category: 'Beta', label: 'Marijuana Withdrawal', description: 'Used for marijuana withdrawal.' },
    
    // Gamma Frequencies (30+ Hz)
    { value: 33.0, category: 'Gamma', label: 'Pyramid Frequency', description: 'Christ consciousness, hypersensitivity, Pyramid frequency (inside). Schumann Resonance (5th frequency).' },
    { value: 35.0, category: 'Gamma', label: 'Chakra Awakening', description: 'Awakening of mid-chakras, balance of chakras.' },
    { value: 38.0, category: 'Gamma', label: 'Endorphin Release', description: 'Associated with endorphin release.' },
    { value: 39.0, category: 'Gamma', label: 'Schumann Resonance (6th)', description: 'Schumann Resonance (6th frequency).' },
    { value: 40.0, category: 'Gamma', label: 'Problem Solving', description: 'Dominant when problem solving in fearful situations. Information-rich task processing & high-level information processing. "Operating system" frequency of the brain.' },
    { value: 45.0, category: 'Gamma', label: 'Schumann Resonance (7th)', description: 'Schumann Resonance (7th frequency).' },
    { value: 50.0, category: 'Gamma', label: 'Muscle Activity', description: 'Dominant frequency of polyphasic muscle activity.' },
    { value: 55.0, category: 'Gamma', label: 'Tantric Yoga (Kundalini)', description: 'Tantric yoga; stimulates the kundalini.' },

    // Lambda Frequencies
    { value: 63.0, category: 'Lambda', label: 'Astral Projection', description: 'Associated with astral projection.' },
    { value: 70.0, category: 'Lambda', label: 'Mental & Astral Projection', description: 'Mental & astral projection. Endorphin production/used with electroanalgesia.' },
    { value: 80.0, category: 'Lambda', label: 'Awareness & Control', description: 'Awareness & control of right direction. Stimulates 5-hydroxytryptamine production.' },
    { value: 83.0, category: 'Lambda', label: 'Third Eye Opening', description: 'Third eye opening for some people.' },
    { value: 90.0, category: 'Lambda', label: 'Good Feelings & Balance', description: 'Good feelings, security, well-being, balancing.' },
    { value: 105.0, category: 'Lambda', label: 'Overall View', description: 'Overall view of complete situation.' },
    { value: 108.0, category: 'Lambda', label: 'Total Knowing', description: 'Associated with total knowing.' },
    { value: 111.0, category: 'Lambda', label: 'Cell Regeneration', description: 'Beta endorphins. Cell regeneration.' },
    { value: 125.0, category: 'Lambda', label: 'Stimulation', description: 'General stimulation.' },
    
    // Planetary Frequencies
    { value: 126.22, category: 'Planetary', label: 'Sun: Centering', description: 'The Frequency Of The Sun. Advances the feeling of centering of magic & of the transcendental.' },
    { value: 136.1, category: 'Planetary', label: 'Earth Year (OM): Calming', description: 'Resonates with the earth year. Calming, meditative, relaxing, centering. Corresponds to "OM".' },
    { value: 141.27, category: 'Planetary', label: 'Mercury: Intellectuality', description: 'Mercury Orbit: intellectuality, mobility. Supports speech center and communicative-intellectual principle.' },
    { value: 144.72, category: 'Planetary', label: 'Mars: Activity & Energy', description: 'Mars Orbit: activity, energy, freedom, humor. Supports strength of will and focused energy.' },
    { value: 147.85, category: 'Planetary', label: 'Saturn: Concentration', description: 'Saturn Orbit: separation, sorrow, death. Enhances concentration and karmic connections; brings structure and order.' },
    { value: 172.06, category: 'Planetary', label: 'Platonic Year: Cheerfulness', description: 'Platonic Year Frequency. Supports cheerfulness, clarity of spirit. Associated with Crown Chakra.' },
    { value: 183.58, category: 'Planetary', label: 'Jupiter: Growth & Success', description: 'Jupiter Orbit: growth, success, justice, spirituality. Supports creative power and continuous construction.' },
    { value: 194.18, category: 'Planetary', label: 'Earth Day: Dynamic & Vitalizing', description: 'Synodic "Earth" Day. Dynamic, vitalizing, brings one into harmony with nature.' },
    { value: 207.36, category: 'Planetary', label: 'Uranus: Spontaneity', description: 'Uranus Orbit: spontaneity, independence, originality. Supports the power of surprise and renewal, has primeval and erotic power.' },
    { value: 210.42, category: 'Planetary', label: 'Synodic Moon: Sexual Energy', description: 'Synodic Moon. Stimulates sexual energy, supports erotic communication.' },
    { value: 211.44, category: 'Planetary', label: 'Neptune: The Unconscious', description: 'Neptune Orbit: the unconscious, secrets, imagination, spiritual love. Supports intuition and the unconsciousness.' },
    { value: 221.23, category: 'Planetary', label: 'Venus: Harmony & Love', description: 'Venus Orbit: harmony, beauty, love. Holds the principle of proportion and harmony.' },
    
    // Solfeggio & Other Frequencies
    { value: 360.0, category: 'Other', label: 'Balance Frequency', description: 'The "Balance Frequency"; brings sensations of joy and healing.' },
    { value: 396.0, category: 'Solfeggio', label: 'Liberating Guilt & Fear (UT)', description: '"Liberating Guilt and Fear" / Solfeggio Frequency \'UT\'.' },
    { value: 417.0, category: 'Solfeggio', label: 'Facilitating Change (Re)', description: '"Undoing Situations and Facilitating Change" / Solfeggio Frequency \'Re\'.' },
    { value: 441.0, category: 'Other', label: 'King\'s Chamber Frequency', description: 'The King\'s Chamber Frequency; acts towards preservation and equilibrium.' },
    { value: 528.0, category: 'Solfeggio', label: 'DNA Repair (MI)', description: '"Transformation and Miracles (DNA Repair)" / Solfeggio Frequency \'MI\'. Used by genetic scientists to mend DNA.' },
    { value: 639.0, category: 'Solfeggio', label: 'Connecting Relationships (FA)', description: '"Connecting/Relationships" / Solfeggio Frequency \'FA\'.' },
    { value: 741.0, category: 'Solfeggio', label: 'Awakening Intuition (SOL)', description: '"Awakening Intuition" / Solfeggio Frequency \'SOL\'.' },
    { value: 852.0, category: 'Solfeggio', label: 'Returning To Spiritual Order (LA)', description: '"Returning To Spiritual Order" / Solfeggio Frequency \'LA\'.' },

    // Rife Frequencies
    { value: 5000.0, category: 'Rife', label: 'Cure-all (Allergies)', description: 'Commonly used "cure-all" Rife frequency. Used for allergies but long exposures may destroy red blood cells.' },
];


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
    },
    (ctx: CanvasRenderingContext2D, height: number) => { // Sunset
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#f97316');    // orange-500
        gradient.addColorStop(0.5, '#f59e0b'); // amber-500
        gradient.addColorStop(1, '#fde047');    // yellow-300
        return gradient;
    },
    (ctx: CanvasRenderingContext2D, height: number) => { // Oceanic
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#0d9488'); // teal-600
        gradient.addColorStop(0.5, '#22d3ee'); // cyan-400
        gradient.addColorStop(1, '#60a5fa'); // blue-400
        return gradient;
    },
    (ctx: CanvasRenderingContext2D, height: number) => { // Monochrome
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#4b5563'); // gray-600
        gradient.addColorStop(0.5, '#d1d5db'); // gray-300
        gradient.addColorStop(1, '#ffffff'); // white
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
    const [selectedFrequencyPreset, setSelectedFrequencyPreset] = useState<string>('10');


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
    const volumeSliderRef = useRef<HTMLInputElement | null>(null);
    const ambientVolumeSliderRef = useRef<HTMLInputElement | null>(null);


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

    useEffect(() => {
        if (volumeSliderRef.current) {
            const percentage = volume * 100;
            volumeSliderRef.current.style.setProperty('--slider-progress', `${percentage}%`);
        }
    }, [volume]);

    useEffect(() => {
        if (ambientVolumeSliderRef.current) {
            const percentage = selectedAmbient === 'none' ? 0 : ambientVolume * 100;
            ambientVolumeSliderRef.current.style.setProperty('--slider-progress', `${percentage}%`);
        }
    }, [ambientVolume, selectedAmbient]);

    useEffect(() => {
        const matchingPreset = FREQUENCY_DEFINITIONS.find(p => p.value === frequency);
        if (matchingPreset) {
            setSelectedFrequencyPreset(String(matchingPreset.value));
        } else {
            setSelectedFrequencyPreset('custom');
        }
    }, [frequency]);

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

        const pointsToDraw = 128;
        const sliceWidth = canvas.width / (pointsToDraw - 1);
        
        const points = Array.from({ length: pointsToDraw }, (_, i) => {
            const dataIndex = Math.floor(i * (bufferLength / pointsToDraw));
            const v = Math.pow(dataArray[dataIndex] / 255.0, 2.2);
            const x = i * sliceWidth;
            const y = canvas.height - (v * canvas.height);
            return {x, y};
        });

        canvasCtx.beginPath();
        canvasCtx.moveTo(-1, canvas.height);
        canvasCtx.lineTo(points[0].x, points[0].y);

        for (let i = 0; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            canvasCtx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        
        canvasCtx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        canvasCtx.lineTo(canvas.width + 1, canvas.height);
        canvasCtx.closePath();
        canvasCtx.fill();

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

    const handleFrequencyPresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedFrequencyPreset(value);
        if (value !== 'custom') {
            setFrequency(parseFloat(value));
        }
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
                        <label htmlFor="frequency-preset" className="block text-sm font-medium text-gray-300 mb-2">
                            Frequency Presets & Definitions
                        </label>
                        <select
                            id="frequency-preset"
                            value={selectedFrequencyPreset}
                            onChange={handleFrequencyPresetChange}
                            className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus-ring-indigo"
                        >
                            <option value="custom">Custom Frequency</option>
                            {FREQUENCY_DEFINITIONS.map((preset) => (
                                <option key={preset.value} value={preset.value}>
                                    {preset.value} Hz ({preset.category}) - {preset.label}
                                </option>
                            ))}
                        </select>
                        <p className="mt-2 text-sm text-gray-400 h-10">
                            {
                                FREQUENCY_DEFINITIONS.find(p => String(p.value) === selectedFrequencyPreset)?.description || 'Enter a custom frequency or choose a preset from the list above.'
                            }
                        </p>
                    </div>

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
                            ref={volumeSliderRef}
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
                            ref={ambientVolumeSliderRef}
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
