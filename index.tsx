
import React, { useState, useRef, useEffect, FC, useCallback } from 'react';
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

// --- Sound Effect URLs ---
const CLICK_SOUND_URL = 'https://cdn.pixabay.com/audio/2022/03/15/audio_2433fe1503.mp3';
const SAVE_LOAD_SOUND_URL = 'https://cdn.pixabay.com/audio/2022/03/10/audio_c848a67228.mp3';
const DELETE_SOUND_URL = 'https://cdn.pixabay.com/audio/2022/03/15/audio_7621a1f196.mp3';

const FREQUENCY_DEFINITIONS: FrequencyDefinition[] = [
    // Epsilon (< 0.5 Hz)
    { value: 0.4, category: 'Epsilon', label: 'Extraordinary Consciousness (< 0.5 Hz)', description: 'Extraordinary states of consciousness, high states of meditation, ecstatic states, high-level inspiration, spiritual insight, out-of-body experiences, Yogic states of suspended animation.' },

    // Delta (0.1 - 4 Hz)
    { value: 0.1, category: 'Delta', label: 'Organ/Muscle Resonances (0.1-1 Hz)', description: 'Organ/muscle resonances' },
    { value: 0.1, category: 'Delta', label: 'Deep Sleep & Lucid Dreaming (0.1-3 Hz)', description: 'Deep sleep, lucid dreaming, increased immune functions, hypnosis. Decreased awareness of the physical world; access to unconscious information.' },
    { value: 0.5, category: 'Delta', label: 'Headache & Pain Relief', description: 'Relaxation, helps soothe headaches. Pain relief. Thyroid, reproductive, excretory stimulant, whole brain toner.' },
    { value: 0.5, category: 'Delta', label: 'Pain Relief & Endorphin Release (0.5-1.5 Hz)', description: 'Pain relief. Endorphin release, better hypnosis.' },
    { value: 0.5, category: 'Delta', label: 'Deep Dreamless Sleep (0.5-4 Hz)', description: 'Deep dreamless sleep, trance, suspended animation. Anti-aging (reduces cortisol, increases DHEA & melatonin). Provides intuition, empathetic attunement & instinctual insight.' },
    { value: 0.9, category: 'Delta', label: 'Euphoric Feeling', description: 'Euphoric feeling.' },
    { value: 1.0, category: 'Delta', label: 'Well-being & Harmony', description: 'Feeling of well-being, harmony and balance. Pituitary stimulation to release growth hormone.' },
    { value: 1.05, category: 'Delta', label: 'Growth Hormone Release', description: 'Pituitary stimulation to release growth hormone (helps develop muscle, recover from injuries, rejuvenation). Helps hair grow and regain color.' },
    { value: 1.45, category: 'Delta', label: 'Tri-thalamic Entrainment', description: 'Tri-thalamic entrainment format; may benefit dyslexics and people with Alzheimer\'s.' },
    { value: 1.5, category: 'Delta', label: 'Universal Healing Rate', description: 'Abrahams Universal Healing Rate. Sleep. Release from negative symptoms for chronic fatigue.' },
    { value: 2.0, category: 'Delta', label: 'Nerve Regeneration', description: 'Nerve regeneration.' },
    { value: 2.5, category: 'Delta', label: 'Endogenous Opiates / Migraine Relief', description: 'Production of endogenous opiates (painkillers, reduce anxiety). Relieves migraine pain. Sedative effect.' },
    { value: 3.4, category: 'Delta', label: 'Restful Sleep', description: 'Helps achieve restful sleep.' },
    { value: 3.5, category: 'Delta', label: 'Unity & Whole Being Regeneration', description: 'Feeling of unity with everything. Whole being regeneration, DNA stimulation. Enhancement of receptivity.' },
    { value: 3.9, category: 'Delta', label: 'Self-Renewal & Inner Awareness', description: 'Self-renewal, enhanced inner awareness. Crystal clear meditation, lucid dreams.' },
    { value: 4.0, category: 'Delta', label: 'Memory, Learning & ESP', description: 'Enkephalin release for reduced stress. Vital for memory and learning, problem solving, object naming. Extrasensory perception. Astral Projection, Telepathy.' },
    { value: 1, category: 'Delta', label: 'Profound Relaxation (1-3 Hz)', description: 'Profound relaxation, restorative sleep, tranquility and peace.' },

    // Theta (4 - 8 Hz)
    { value: 4, category: 'Theta', label: 'Creativity & Subconscious Access (4-7 Hz)', description: 'Recall, fantasy, imagery, creativity, planning, dreaming. Access to subconscious images, deep meditation, reduced blood pressure, said to cure addictions. Profound inner peace, emotional healing, lowers mental fatigue.' },
    { value: 4.5, category: 'Theta', label: 'Shamanic/Tibetan State', description: 'Brings about Shamanic/Tibetan state of consciousness, Tibetan chants.' },
    { value: 4.9, category: 'Theta', label: 'Deep Relaxation & Introspection', description: 'Induce relaxation and deeper sleep. Introspection, meditation.' },
    { value: 5.0, category: 'Theta', label: 'Problem Solving & Pain Relief', description: 'Reduces sleep required; Theta replaces need for extensive dreaming. Unusual problem solving. Relaxed states, pain relief (beta endorphin increases).' },
    { value: 5.35, category: 'Theta', label: 'Relaxed Breathing', description: 'Allows relaxing breathing, free and efficient.' },
    { value: 5.5, category: 'Theta', label: 'Inner Guidance & Intuition', description: 'Inner guidance, intuition. Shows vision of growth needed.' },
    { value: 6.0, category: 'Theta', label: 'Long Term Memory Stimulation', description: 'Long term memory stimulation.' },
    { value: 6.5, category: 'Theta', label: 'Creative Frontal Lobe Activation', description: 'Centre of Theta frequency. Activates creative frontal lobe.' },
    { value: 7.0, category: 'Theta', label: 'Mental & Astral Projection', description: 'Mental & astral projection, bending objects, psychic surgery. Bone growth.' },
    { value: 7.5, category: 'Theta', label: 'Creative Thought & Spirit Guide Contact', description: 'Activates creative thought for art, invention, music; problem solving. Ease of overcoming troublesome issues. Contact with spirit guides.' },
    { value: 7.83, category: 'Theta', label: 'Schumann Earth Resonance', description: 'Schumann earth resonance. Grounding, meditative, leaves you revitalized. Anti-jetlag, anti-mind control, improved stress tolerance. Psychic healing experiments.' },
    { value: 3, category: 'Theta', label: 'Deep Relaxation & Memory (3-8 Hz)', description: 'Deep relaxation, meditation. Lucid dreaming. Increased memory, focus, creativity.' },

    // Alpha (8 - 12 Hz)
    { value: 8, category: 'Alpha', label: 'Super-learning & Mind/Body Integration (8-10 Hz)', description: 'Super-learning new information, memorization, not comprehension. Inner-awareness of self, mind/body integration, balance.' },
    { value: 8, category: 'Alpha', label: 'Light Relaxation & "Super Learning" (8-12 Hz)', description: 'Light relaxation, "super learning", positive thinking. Creative problem solving, accelerated learning, mood elevation, stress reduction.' },
    { value: 8, category: 'Alpha', label: 'Relaxed & Tranquil State (8-13 Hz)', description: 'Non-drowsy but relaxed, tranquil state; body/mind integration. Amplifies dowsing, empty-mind states, detachment, daydreams.' },
    { value: 8.22, category: 'Alpha', label: 'Mouth Associated Creativity', description: 'Associated with the mouth. Brings creativity.' },
    { value: 8.3, category: 'Alpha', label: 'Clairvoyance / Mental Object Imaging', description: 'Pick up visual images of mental objects; clairvoyance.' },
    { value: 9.0, category: 'Alpha', label: 'Body Imbalance Awareness (Sacral Chakra)', description: 'Awareness of causes of body imbalance & means for balance. Associated with Sacral/Svadhisthana chakra.' },
    { value: 10.0, category: 'Alpha', label: 'Serotonin Release & Mood Elevation', description: 'Enhanced serotonin release. Mood elevation, arousal, stimulant. Provides relief from lost sleep, improves general mood. Dramatically reduce headaches. Analgesic, safest frequency, for hangover & jet lag. Anti-convulsant.' },
    { value: 11.0, category: 'Alpha', label: 'Relaxed yet Awake State', description: 'Relaxed yet awake state.' },
    { value: 12.0, category: 'Alpha', label: 'Mental Stability & Clarity (Throat Chakra)', description: 'Centering, mental stability. Doorway to all other frequencies. Stimulate mental clarity. Associated with Throat/Vishuddha chakra.' },
    { value: 11, category: 'Alpha', label: 'Increased Focus & Awareness (11-14 Hz)', description: 'Increased focus and awareness.' },
    { value: 12, category: 'Alpha', label: 'Passive Information Absorption (12-14 Hz)', description: 'Learning frequency, good for absorbing information passively.' },

    // Beta (13 - 30 Hz)
    { value: 12, category: 'Beta', label: 'Relaxed Focus (SMR) (12-15 Hz)', description: 'Relaxed focus, improved attentive abilities. Treating hyperactivity. Sensori-motor Rhythm (SMR) for treatment of mild autism.' },
    { value: 13, category: 'Beta', label: 'Focused External Attention (13-27 Hz)', description: 'Promotes focused attention toward external stimuli. Alert mental activity, normal waking consciousness, active thought processes.' },
    { value: 13, category: 'Beta', label: 'Problem Solving & Conscious Thinking (13-30 Hz)', description: 'Problem solving, conscious thinking. Normal wakefulness, motivation, outer awareness, survival.' },
    { value: 14.0, category: 'Beta', label: 'Alertness & Vitality (Schumann 2nd)', description: 'Awakeness, alert. Concentration on tasks, Focusing, vitality. Schumann Resonance (2nd frequency). Intelligence Enhancement (with 22.0 Hz).' },
    { value: 15, category: 'Beta', label: 'Increased Mental Ability & Focus (15-18 Hz)', description: 'Increased mental ability, focus, alertness, IQ.' },
    { value: 16.0, category: 'Beta', label: 'Oxygen/Calcium Release', description: 'Bottom of hearing range. Releases oxygen/calcium into cells.' },
    { value: 18, category: 'Beta', label: 'Euphoria (Can Cause Headaches) (18-24 Hz)', description: 'Euphoria, can result in headaches, anxiety.' },
    { value: 18.0, category: 'Beta', label: 'Alertness, Stress & Anxiety (18.0+ Hz)', description: 'Fully awake, normal state of alertness, stress & anxiety. Improve hyperactive behavior.' },
    { value: 20.0, category: 'Beta', label: 'Fatigue & Energize (Schumann 3rd)', description: 'Fatigue, energize. Schumann Resonance (3rd frequency). Stimulation of pineal gland. Helps with tinnitus. Commonly used "cure-all" Rife Frequency.' },
    { value: 22.0, category: 'Beta', label: 'Intelligence Enhancement (with 14Hz)', description: 'Used with 14 Hz for intelligence enhancement. Used with 40 Hz for \'out of body\' travel and psychic healing.' },
    { value: 25.0, category: 'Beta', label: 'Visual Cortex Stimulation (Anxiety)', description: 'Bypassing the eyes for images imprinting (visual cortex). Tested clinically with patients who complain of anxiety.' },
    { value: 26.0, category: 'Beta', label: 'Schumann Resonance (4th)', description: 'Schumann Resonance (4th frequency).' },
    { value: 27, category: 'Beta', label: 'Cat Purr / Restorative Effects (27-44 Hz)', description: 'Frequency range that cats purr at, said to have restorative effects on the body, particularly bone healing and strengthening.' },
    { value: 30.0, category: 'Beta', label: 'Marijuana Withdrawal', description: 'Used for marijuana withdrawal.' },

    // Gamma (30+ Hz)
    { value: 30, category: 'Gamma', label: 'Fear Situation Decision Making (30-60 Hz)', description: 'Decision making in a fear situation, muscle tension.' },
    { value: 33.0, category: 'Gamma', label: 'Christ Consciousness (Schumann 5th)', description: 'Christ consciousness, hypersensitivity, Pyramid frequency (inside). Schumann Resonance (5th frequency).' },
    { value: 35.0, category: 'Gamma', label: 'Mid-Chakra Awakening', description: 'Awakening of mid-chakras, balance of chakras.' },
    { value: 36, category: 'Gamma', label: 'High-Level Information Processing (36-44 Hz)', description: 'Learning Frequencies, when actively studying or thinking; maintains alertness. Associated with high-level information processing and good memory.' },
    { value: 38.0, category: 'Gamma', label: 'Endorphin Release', description: 'Endorphin release.' },
    { value: 39.0, category: 'Gamma', label: 'Schumann Resonance (6th)', description: 'Schumann Resonance (6th frequency).' },
    { value: 40.0, category: 'Gamma', label: 'Problem Solving & High-Level Processing', description: 'Dominant when problem solving in fearful situations. Information-rich task processing & high-level information processing. Binding mechanism for perception, connecting cortex and thalamus. "Operating system" frequency of the brain.' },
    { value: 45.0, category: 'Gamma', label: 'Schumann Resonance (7th)', description: 'Schumann Resonance (7th frequency).' },
    { value: 50.0, category: 'Gamma', label: 'Polyphasic Muscle Activity', description: 'Dominant frequency of polyphasic muscle activity.' },
    { value: 55.0, category: 'Gamma', label: 'Tantric Yoga / Kundalini Stimulation', description: 'Tantric yoga; stimulates the kundalini.' },

    // Lambda (60-120 Hz)
    { value: 60, category: 'Lambda', label: 'Central Nervous System Activity (60-120 Hz)', description: 'Little known but includes central nervous system activity.' },
    { value: 63.0, category: 'Lambda', label: 'Astral Projection', description: 'Astral projection.' },
    { value: 70.0, category: 'Lambda', label: 'Mental & Astral Projection / Endorphins', description: 'Mental & astral projection. Endorphin production/used with electroanalgesia.' },
    { value: 80.0, category: 'Lambda', label: 'Awareness & 5-HTP Production', description: 'Awareness & control of right direction. Stimulates 5-hydroxytryptamine production.' },
    { value: 83.0, category: 'Lambda', label: 'Third Eye Opening', description: 'Third eye opening for some people.' },
    { value: 90.0, category: 'Lambda', label: 'Good Feelings & Balancing', description: 'Good feelings, security, well-being, balancing.' },
    { value: 105.0, category: 'Lambda', label: 'Overall View of Situation', description: 'Overall view of complete situation.' },
    { value: 108.0, category: 'Lambda', label: 'Total Knowing', description: 'Total knowing.' },
    { value: 111.0, category: 'Lambda', label: 'Beta Endorphins & Cell Regeneration', description: 'Beta endorphins. Cell regeneration.' },
    { value: 120, category: 'Lambda', label: 'Psychokinesis & Transmutation (120-500 Hz)', description: 'PSI, moving of objects, changing matter, transmutation, psychokinesis.' },
    { value: 125.0, category: 'Lambda', label: 'Stimulation', description: 'Stimulation.' },

    // Planetary
    { value: 126.22, category: 'Planetary', label: 'Sun: Centering & Transcendental', description: 'The Frequency Of The Sun. Advances the feeling of centering of magic & of the transcendental.' },
    { value: 136.1, category: 'Planetary', label: 'Earth Year (OM): Calming & Meditative', description: 'Resonates with the earth year. Calming, meditative, relaxing, centering. Corresponds to "OM".' },
    { value: 140.25, category: 'Planetary', label: 'Pluto: Power, Crisis & Changes', description: 'Pluto Orbit: power, crisis & changes. Supports magic group dynamic principle.' },
    { value: 141.27, category: 'Planetary', label: 'Mercury: Intellect & Communication', description: 'Mercury Orbit: intellectuality, mobility. Supports speech center and communicative-intellectual principle.' },
    { value: 144.72, category: 'Planetary', label: 'Mars: Activity, Energy & Freedom', description: 'Mars Orbit: activity, energy, freedom, humor. Supports strength of will and focused energy.' },
    { value: 147.85, category: 'Planetary', label: 'Saturn: Concentration & Karmic Connections', description: 'Saturn Orbit: separation, sorrow, death. Enhances concentration and karmic connections; brings structure and order.' },
    { value: 172.06, category: 'Planetary', label: 'Platonic Year: Cheerfulness & Spirit (Crown Chakra)', description: 'Platonic Year Frequency. Supports cheerfulness, clarity of spirit. Associated with Crown Chakra.' },
    { value: 183.58, category: 'Planetary', label: 'Jupiter: Growth, Success & Spirituality', description: 'Jupiter Orbit: growth, success, justice, spirituality. Supports creative power and continuous construction.' },
    { value: 194.18, category: 'Planetary', label: 'Synodic "Earth" Day: Dynamic & Vitalizing', description: 'Synodic "Earth" Day. Dynamic, vitalizing, brings one into harmony with nature.' },
    { value: 207.36, category: 'Planetary', label: 'Uranus: Spontaneity & Independence', description: 'Uranus Orbit: spontaneity, independence, originality. Supports the power of surprise and renewal, has primeval and erotic power.' },
    { value: 210.42, category: 'Planetary', label: 'Synodic Moon: Sexual Energy', description: 'Synodic Moon. Stimulates sexual energy, supports erotic communication.' },
    { value: 211.44, category: 'Planetary', label: 'Neptune: The Unconscious & Intuition', description: 'Neptune Orbit: the unconscious, secrets, imagination, spiritual love. Supports intuition and the unconsciousness.' },
    { value: 221.23, category: 'Planetary', label: 'Venus: Harmony, Beauty & Love', description: 'Venus Orbit: harmony, beauty, love. Holds the principle of proportion and harmony.' },

    // Solfeggio & Other
    { value: 360.0, category: 'Solfeggio & Other', label: 'Balance Frequency: Joy & Healing', description: 'The "Balance Frequency"; brings sensations of joy and healing.' },
    { value: 384.0, category: 'Solfeggio & Other', label: 'Gurdjieff Vibration (Root Chakra)', description: 'Gurdjieff vibration associated with root chakra.' },
    { value: 396.0, category: 'Solfeggio & Other', label: 'UT: Liberating Guilt and Fear', description: '"Liberating Guilt and Fear" / Solfeggio Frequency \'UT\'.' },
    { value: 417.0, category: 'Solfeggio & Other', label: 'RE: Undoing Situations & Change', description: '"Undoing Situations and Facilitating Change" / Solfeggio Frequency \'Re\'.' },
    { value: 441.0, category: 'Solfeggio & Other', label: "King's Chamber Frequency", description: "The King's Chamber Frequency; acts towards preservation and equilibrium." },
    { value: 528.0, category: 'Solfeggio & Other', label: 'MI: Transformation & Miracles (DNA Repair)', description: '"Transformation and Miracles (DNA Repair)" / Solfeggio Frequency \'MI\'. Used by genetic scientists to mend DNA.' },
    { value: 639.0, category: 'Solfeggio & Other', label: 'FA: Connecting & Relationships', description: '"Connecting/Relationships" / Solfeggio Frequency \'FA\'.' },
    { value: 741.0, category: 'Solfeggio & Other', label: 'SOL: Awakening Intuition', description: '"Awakening Intuition" / Solfeggio Frequency \'SOL\'.' },
    { value: 852.0, category: 'Solfeggio & Other', label: 'LA: Returning To Spiritual Order', description: '"Returning To Spiritual Order" / Solfeggio Frequency \'LA\'.' },

    // Rife
    { value: 5000, category: 'Rife', label: 'Cure-all (Allergies)', description: 'Commonly used "cure-all" Rife frequency. Used for allergies but long exposures destroy red blood cells.' },
    { value: 10000, category: 'Rife', label: 'Cure-all (Alcoholism, Allergies, Headaches)', description: 'Commonly used "cure-all" Rife frequency. Used to treat alcoholism, allergies, headaches.' },
];

const AMBIENT_SOUNDS = {
  'None': '',
  'Rain': 'https://cdn.pixabay.com/audio/2022/08/11/audio_29a28b52a5.mp3',
  'Forest': 'https://cdn.pixabay.com/audio/2022/11/17/audio_8b24b2169b.mp3',
  'Ocean Waves': 'https://cdn.pixabay.com/audio/2023/09/24/audio_959b85c2f7.mp3',
  'White Noise': 'https://cdn.pixabay.com/audio/2022/05/29/audio_3439c2bdbd.mp3',
};

const App = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [frequency, setFrequency] = useState(4.0);
    const [volume, setVolume] = useState(0.5);
    const [presets, setPresets] = useState<Preset[]>([]);
    const [selectedPreset, setSelectedPreset] = useState<string>('');
    const [newPresetName, setNewPresetName] = useState('');
    const [selectedAmbient, setSelectedAmbient] = useState('None');
    const [ambientVolume, setAmbientVolume] = useState(0.5);
    const [waveformType, setWaveformType] = useState<'curve' | 'bars' | 'line'>('curve');

    const audioContextRef = useRef<AudioContext | null>(null);
    const leftChannelRef = useRef<OscillatorNode | null>(null);
    const rightChannelRef = useRef<OscillatorNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    // Fix: Initialize useRef with null. This resolves an error with older React type definitions where calling useRef without an argument is not supported when a generic is provided.
    const animationFrameRef = useRef<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
    const soundEffectAudioRef = useRef<HTMLAudioElement | null>(null);

    const playSound = (soundUrl: string) => {
        if (!soundEffectAudioRef.current) {
            soundEffectAudioRef.current = new Audio();
        }
        soundEffectAudioRef.current.src = soundUrl;
        soundEffectAudioRef.current.play().catch(e => console.error("Error playing sound effect:", e));
    };

    useEffect(() => {
        try {
            const savedPresets = localStorage.getItem('binauralPresets');
            if (savedPresets) {
                setPresets(JSON.parse(savedPresets));
            }
        } catch (error) {
            console.error("Failed to load presets from local storage:", error);
        }
    }, []);

    const drawVisualizer = useCallback(() => {
        if (!analyserRef.current || !canvasRef.current) {
            if (isPlaying) animationFrameRef.current = requestAnimationFrame(drawVisualizer);
            return;
        }

        const analyser = analyserRef.current;
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        // Set canvas resolution for high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
        }
        
        const scaledWidth = rect.width;
        const scaledHeight = rect.height;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        canvasCtx.fillStyle = 'rgb(17, 24, 39)'; // bg-gray-900
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        canvasCtx.lineWidth = 2 * dpr;
        canvasCtx.strokeStyle = 'rgb(129, 140, 248)'; // indigo-400
        canvasCtx.beginPath();
        
        switch (waveformType) {
            case 'curve':
            case 'line':
                analyser.getByteTimeDomainData(dataArray);
                const sliceWidth = scaledWidth / bufferLength;
                let x = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = v * scaledHeight / 2;
                    if (i === 0) {
                        canvasCtx.moveTo(x * dpr, y * dpr);
                    } else {
                        canvasCtx.lineTo(x * dpr, y * dpr);
                    }
                    x += sliceWidth;
                }
                canvasCtx.lineTo(canvas.width, canvas.height / 2);
                canvasCtx.stroke();
                break;
            case 'bars':
                analyser.getByteFrequencyData(dataArray);
                const barWidth = (scaledWidth / bufferLength) * 2.5;
                let barX = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (dataArray[i] / 255) * scaledHeight;
                    const r = barHeight + 100 * (i/bufferLength);
                    const g = 140;
                    const b = 248;
                    canvasCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    canvasCtx.fillRect(barX * dpr, (scaledHeight - barHeight) * dpr, barWidth * dpr, barHeight * dpr);
                    barX += barWidth + 1;
                }
                break;
        }
        
        animationFrameRef.current = requestAnimationFrame(drawVisualizer);
    }, [waveformType, isPlaying]);


    useEffect(() => {
        if (isPlaying) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioCtx = audioContextRef.current;
            
            const baseFreq = 220;
            leftChannelRef.current = audioCtx.createOscillator();
            rightChannelRef.current = audioCtx.createOscillator();
            leftChannelRef.current.type = 'sine';
            rightChannelRef.current.type = 'sine';
            leftChannelRef.current.frequency.setValueAtTime(baseFreq - (frequency / 2), audioCtx.currentTime);
            rightChannelRef.current.frequency.setValueAtTime(baseFreq + (frequency / 2), audioCtx.currentTime);
            
            gainNodeRef.current = audioCtx.createGain();
            gainNodeRef.current.gain.setValueAtTime(volume, audioCtx.currentTime);
            
            analyserRef.current = audioCtx.createAnalyser();
            analyserRef.current.fftSize = 2048;

            const merger = audioCtx.createChannelMerger(2);
            
            leftChannelRef.current.connect(merger, 0, 0);
            rightChannelRef.current.connect(merger, 0, 1);
            merger.connect(gainNodeRef.current);
            gainNodeRef.current.connect(analyserRef.current);
            analyserRef.current.connect(audioCtx.destination);
            
            leftChannelRef.current.start();
            rightChannelRef.current.start();
            
            animationFrameRef.current = requestAnimationFrame(drawVisualizer);
        } else {
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(e => console.error(e));
                audioContextRef.current = null;
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                // Also clear the canvas
                const canvas = canvasRef.current;
                 if (canvas) {
                    const canvasCtx = canvas.getContext('2d');
                    if (canvasCtx) {
                      canvasCtx.fillStyle = 'rgb(17, 24, 39)'; // bg-gray-900
                      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                }
            }
        }

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(e => console.error(e));
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying]);

    useEffect(() => {
        if (isPlaying && audioContextRef.current && leftChannelRef.current && rightChannelRef.current) {
            const baseFreq = 220;
            const audioCtx = audioContextRef.current;
            leftChannelRef.current.frequency.setValueAtTime(baseFreq - (frequency / 2), audioCtx.currentTime);
            rightChannelRef.current.frequency.setValueAtTime(baseFreq + (frequency / 2), audioCtx.currentTime);
        }
    }, [frequency, isPlaying]);

    useEffect(() => {
        if (isPlaying && gainNodeRef.current && audioContextRef.current) {
            gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
        }
    }, [volume, isPlaying]);

    useEffect(() => {
        if (!ambientAudioRef.current) {
            ambientAudioRef.current = new Audio();
            ambientAudioRef.current.loop = true;
        }
        if (selectedAmbient !== 'None' && AMBIENT_SOUNDS[selectedAmbient]) {
            if (ambientAudioRef.current.src !== AMBIENT_SOUNDS[selectedAmbient]) {
                 ambientAudioRef.current.src = AMBIENT_SOUNDS[selectedAmbient];
            }
            if (isPlaying) {
                ambientAudioRef.current.play().catch(e => console.error("Error playing ambient sound:", e));
            }
        } else {
            ambientAudioRef.current.pause();
            ambientAudioRef.current.src = '';
        }
    }, [selectedAmbient, isPlaying]);

    useEffect(() => {
        if (ambientAudioRef.current) {
            ambientAudioRef.current.volume = ambientVolume;
        }
    }, [ambientVolume]);
    
    useEffect(() => {
        if (isPlaying) {
             animationFrameRef.current = requestAnimationFrame(drawVisualizer);
        } else {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
    }, [drawVisualizer, isPlaying]);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
        playSound(CLICK_SOUND_URL);
    };

    const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value) && value >= 0.1 && value <= 1000) {
            setFrequency(value);
        }
    };
    
    const handleFrequencyPresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            setFrequency(value);
            playSound(CLICK_SOUND_URL);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        const slider = e.target;
        slider.style.setProperty('--slider-progress', `${newVolume * 100}%`);
    };

    const handleAmbientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedAmbient(e.target.value);
        playSound(CLICK_SOUND_URL);
    };
    
    const handleAmbientVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setAmbientVolume(newVolume);
        const slider = e.target;
        slider.style.setProperty('--slider-progress', `${newVolume * 100}%`);
    };

    const handleSavePreset = () => {
        if (newPresetName.trim() === '') {
            alert('Please enter a name for the preset.');
            return;
        }
        const newPreset: Preset = { name: newPresetName.trim(), frequency, volume, selectedAmbient, ambientVolume };
        const updatedPresets = [...presets, newPreset];
        setPresets(updatedPresets);
        localStorage.setItem('binauralPresets', JSON.stringify(updatedPresets));
        setNewPresetName('');
        playSound(SAVE_LOAD_SOUND_URL);
    };
    
    const handleLoadPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const presetName = e.target.value;
        setSelectedPreset(presetName);
        const preset = presets.find(p => p.name === presetName);
        if (preset) {
            setFrequency(preset.frequency);
            setVolume(preset.volume);
            setSelectedAmbient(preset.selectedAmbient);
            setAmbientVolume(preset.ambientVolume);
            playSound(SAVE_LOAD_SOUND_URL);
        }
    };

    const handleDeletePreset = () => {
        if (!selectedPreset) {
            alert('Please select a preset to delete.');
            return;
        }
        const updatedPresets = presets.filter(p => p.name !== selectedPreset);
        setPresets(updatedPresets);
        localStorage.setItem('binauralPresets', JSON.stringify(updatedPresets));
        setSelectedPreset('');
        playSound(DELETE_SOUND_URL);
    };

    const handleChangeWaveform = () => {
        setWaveformType(prev => {
            if (prev === 'curve') return 'bars';
            if (prev === 'bars') return 'line';
            return 'curve';
        });
        playSound(CLICK_SOUND_URL);
    };
    
    const currentFrequencyDefinition = FREQUENCY_DEFINITIONS.find(def => def.value === frequency);
    const groupedFrequencies = FREQUENCY_DEFINITIONS.reduce((acc, freq) => {
        const category = freq.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(freq);
        return acc;
    }, {} as Record<string, FrequencyDefinition[]>);

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
                <header>
                    <h1 className="text-3xl font-bold text-indigo-400 text-center">Binaural Beat Generator</h1>
                    <p className="text-center text-gray-400 mt-2">Craft your own soundscape for focus, relaxation, or meditation.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <h2 className="text-xl font-semibold mb-4 text-gray-200">Master Controls</h2>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={togglePlay}
                                    className="p-4 bg-indigo-500 hover:bg-indigo-600 rounded-full transition-all duration-200 ease-in-out focus-ring-indigo"
                                    aria-label={isPlaying ? 'Pause' : 'Play'}
                                >
                                    {isPlaying ? <PauseIcon className="h-8 w-8 text-white" /> : <PlayIcon className="h-8 w-8 text-white" />}
                                </button>
                                <div className="w-full">
                                    <label htmlFor="volume" className="block text-sm font-medium text-gray-300">Tone Volume</label>
                                    <input
                                        id="volume"
                                        type="range" min="0" max="1" step="0.01"
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        className="mt-1"
                                        style={{ '--slider-progress': `${volume * 100}%` } as React.CSSProperties}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-700 p-4 rounded-lg">
                            <h2 className="text-xl font-semibold mb-2 text-gray-200">Frequency Control</h2>
                             <p className="text-gray-400 mb-4 text-sm">Target Frequency: {frequency.toFixed(2)} Hz</p>
                            <div className="space-y-4">
                                 <div>
                                    <label htmlFor="frequency-slider" className="block text-sm font-medium text-gray-300">Adjust Frequency (0.1 - 1000 Hz)</label>
                                    <input
                                        id="frequency-slider"
                                        type="range" min="0.1" max="1000" step="0.01"
                                        value={frequency}
                                        onChange={handleFrequencyChange}
                                        className="w-full mt-1"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="frequency-preset" className="block text-sm font-medium text-gray-300">Select Frequency Preset</label>
                                    <select
                                        id="frequency-preset" value={frequency} onChange={handleFrequencyPresetChange}
                                        className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-md p-2 focus-ring-indigo"
                                    >
                                        {Object.entries(groupedFrequencies).map(([category, freqs]) => (
                                            <optgroup label={category} key={category}>
                                                {freqs.map(def => (
                                                    <option key={`${def.value}-${def.label}`} value={def.value}>{def.label} ({def.value} Hz)</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                {currentFrequencyDefinition && (
                                    <div className="p-3 bg-gray-800 rounded-md text-sm">
                                        <p className="font-semibold text-indigo-300">{currentFrequencyDefinition.label}</p>
                                        <p className="text-gray-400 mt-1">{currentFrequencyDefinition.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-700 p-4 rounded-lg">
                            <h2 className="text-xl font-semibold mb-4 text-gray-200">Ambient Sound</h2>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="ambient-select" className="block text-sm font-medium text-gray-300">Choose a sound</label>
                                    <select
                                        id="ambient-select" value={selectedAmbient} onChange={handleAmbientChange}
                                        className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-md p-2 focus-ring-indigo"
                                    >
                                        {Object.keys(AMBIENT_SOUNDS).map(sound => (
                                            <option key={sound} value={sound}>{sound}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="ambient-volume" className="block text-sm font-medium text-gray-300">Ambient Volume</label>
                                    <input
                                        id="ambient-volume"
                                        type="range" min="0" max="1" step="0.01"
                                        value={ambientVolume} onChange={handleAmbientVolumeChange}
                                        className="mt-1"
                                        style={{ '--slider-progress': `${ambientVolume * 100}%` } as React.CSSProperties}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 flex flex-col">
                        <div className="bg-gray-700 p-4 rounded-lg flex-grow flex flex-col">
                            <h2 className="text-xl font-semibold mb-4 text-gray-200">Visualizer</h2>
                            <div className="bg-gray-900 rounded-md w-full flex-grow aspect-[16/9] min-h-[200px] md:min-h-0">
                                <canvas ref={canvasRef} className="w-full h-full rounded-md"></canvas>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                               <button 
                                   onClick={handleChangeWaveform} 
                                   className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 focus-ring-indigo"
                                >
                                   Change Waveform
                               </button>
                               <p className="col-span-1 flex items-center justify-center text-gray-300 bg-gray-800 rounded-md">
                                   Style: <span className="font-semibold capitalize ml-2">{waveformType}</span>
                               </p>
                           </div>
                        </div>

                        <div className="bg-gray-700 p-4 rounded-lg">
                            <h2 className="text-xl font-semibold mb-4 text-gray-200">Presets</h2>
                            <div className="space-y-4">
                                <div className="flex space-x-2">
                                    <input
                                        type="text" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)}
                                        placeholder="New preset name"
                                        className="flex-grow bg-gray-800 border border-gray-600 rounded-md p-2 focus-ring-indigo"
                                    />
                                    <button
                                        onClick={handleSavePreset}
                                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 focus-ring-indigo"
                                    >
                                        Save
                                    </button>
                                </div>
                                <div className="flex space-x-2">
                                    <select
                                        value={selectedPreset} onChange={handleLoadPreset}
                                        className="flex-grow bg-gray-800 border border-gray-600 rounded-md p-2 focus-ring-indigo"
                                    >
                                        <option value="">Load a preset...</option>
                                        {presets.map(p => ( <option key={p.name} value={p.name}>{p.name}</option> ))}
                                    </select>
                                    <button
                                        onClick={handleDeletePreset} disabled={!selectedPreset}
                                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition duration-200 focus-ring-red"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
