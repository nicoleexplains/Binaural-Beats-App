
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

// --- Sound Synthesis Helpers ---
const createNoiseBuffer = (ctx: AudioContext, type: 'white' | 'pink') => {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    if (type === 'white') {
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    } else {
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11;
            b6 = white * 0.115926;
        }
    }
    return buffer;
};

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

const AMBIENT_SOUNDS = ['None', 'Rain', 'Ocean Waves', 'White Noise', 'Pink Noise'];

const App = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [frequency, setFrequency] = useState(4.0);
    const [volume, setVolume] = useState(0.5);
    const [presets, setPresets] = useState<Preset[]>([]);
    const [selectedPreset, setSelectedPreset] = useState<string>('');
    const [newPresetName, setNewPresetName] = useState('');
    const [selectedAmbient, setSelectedAmbient] = useState('None');
    const [ambientVolume, setAmbientVolume] = useState(0.5);
    const [waveformType, setWaveformType] = useState<'curve' | 'bars' | 'line' | 'dots' | 'circle'>('curve');
    const [visualizerSmoothing, setVisualizerSmoothing] = useState(0.8);
    const [visualizerTheme, setVisualizerTheme] = useState<'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan'>('indigo');

    const audioContextRef = useRef<AudioContext | null>(null);
    const leftChannelRef = useRef<OscillatorNode | null>(null);
    const rightChannelRef = useRef<OscillatorNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    // Fix: Initialize useRef with null. This resolves an error with older React type definitions where calling useRef without an argument is not supported when a generic is provided.
    const animationFrameRef = useRef<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ambientNodesRef = useRef<{ source: AudioBufferSourceNode, output: AudioNode, lfo?: OscillatorNode } | null>(null);
    const ambientGainNodeRef = useRef<GainNode | null>(null);
    const uiAudioContextRef = useRef<AudioContext | null>(null);

    const playUISound = useCallback((type: 'click' | 'save' | 'delete') => {
        try {
            if (!uiAudioContextRef.current) {
                uiAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = uiAudioContextRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const envelope = ctx.createGain();
            osc.connect(envelope);
            envelope.connect(ctx.destination);

            const now = ctx.currentTime;
            if (type === 'click') {
                osc.frequency.setValueAtTime(800, now);
                envelope.gain.setValueAtTime(0.1, now);
                envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'save') {
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
                envelope.gain.setValueAtTime(0.1, now);
                envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'delete') {
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
                envelope.gain.setValueAtTime(0.1, now);
                envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            }
        } catch (e) {
            console.error("Error playing UI sound:", e);
        }
    }, []);

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

    const VISUALIZER_THEMES = {
        indigo: { primary: 'rgb(129, 140, 248)', glow: 'rgba(129, 140, 248, 0.5)', accent: 'rgb(99, 102, 241)' },
        emerald: { primary: 'rgb(52, 211, 153)', glow: 'rgba(52, 211, 153, 0.5)', accent: 'rgb(16, 185, 129)' },
        amber: { primary: 'rgb(251, 191, 36)', glow: 'rgba(251, 191, 36, 0.5)', accent: 'rgb(245, 158, 11)' },
        rose: { primary: 'rgb(251, 113, 133)', glow: 'rgba(251, 113, 133, 0.5)', accent: 'rgb(244, 63, 94)' },
        cyan: { primary: 'rgb(34, 211, 238)', glow: 'rgba(34, 211, 238, 0.5)', accent: 'rgb(6, 182, 212)' },
    };

    const drawVisualizer = useCallback(() => {
        if (!analyserRef.current || !canvasRef.current) {
            if (isPlaying) animationFrameRef.current = requestAnimationFrame(drawVisualizer);
            return;
        }

        const analyser = analyserRef.current;
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        // Set smoothing
        analyser.smoothingTimeConstant = visualizerSmoothing;

        // Set canvas resolution for high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
        }
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const theme = VISUALIZER_THEMES[visualizerTheme];
        
        canvasCtx.fillStyle = 'rgb(10, 10, 12)'; // Match app bg
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid lines for hardware feel
        canvasCtx.strokeStyle = 'rgba(55, 65, 81, 0.3)';
        canvasCtx.lineWidth = 1;
        const gridSize = 40 * dpr;
        for (let i = 0; i < canvas.width; i += gridSize) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(i, 0);
            canvasCtx.lineTo(i, canvas.height);
            canvasCtx.stroke();
        }
        for (let i = 0; i < canvas.height; i += gridSize) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(0, i);
            canvasCtx.lineTo(canvas.width, i);
            canvasCtx.stroke();
        }

        canvasCtx.lineWidth = 2 * dpr;
        canvasCtx.strokeStyle = theme.primary;
        canvasCtx.fillStyle = theme.primary;
        canvasCtx.shadowBlur = 10;
        canvasCtx.shadowColor = theme.glow;
        
        switch (waveformType) {
            case 'curve':
            case 'line':
                analyser.getByteTimeDomainData(dataArray);
                canvasCtx.beginPath();
                const sliceWidth = canvas.width / bufferLength;
                let x = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = (v * canvas.height) / 2;
                    if (i === 0) {
                        canvasCtx.moveTo(x, y);
                    } else {
                        canvasCtx.lineTo(x, y);
                    }
                    x += sliceWidth;
                }
                canvasCtx.lineTo(canvas.width, canvas.height / 2);
                canvasCtx.stroke();
                break;
            case 'dots':
                analyser.getByteTimeDomainData(dataArray);
                const dotSpacing = 8 * dpr;
                for (let i = 0; i < bufferLength; i += 4) {
                    const v = dataArray[i] / 128.0;
                    const y = (v * canvas.height) / 2;
                    const dotX = (i / bufferLength) * canvas.width;
                    canvasCtx.beginPath();
                    canvasCtx.arc(dotX, y, 1.5 * dpr, 0, Math.PI * 2);
                    canvasCtx.fill();
                }
                break;
            case 'bars':
                if (!audioContextRef.current) break;
                analyser.getByteFrequencyData(dataArray);
            
                const numBars = 64;
                const barSpacing = 2 * dpr;
                const barWidth = (canvas.width - (numBars - 1) * barSpacing) / numBars;
                let barX = 0;
            
                const sampleRate = audioContextRef.current.sampleRate;
                const maxFreq = sampleRate / 2;
                const minVisibleFreq = 20;
                const minLogFreq = Math.log(minVisibleFreq);
                const maxLogFreq = Math.log(maxFreq);
                const logRange = maxLogFreq - minLogFreq;
            
                for (let i = 0; i < numBars; i++) {
                    const logStart = minLogFreq + (logRange / numBars) * i;
                    const logEnd = minLogFreq + (logRange / numBars) * (i + 1);
                    const freqStart = Math.exp(logStart);
                    const freqEnd = Math.exp(logEnd);
                    const startIndex = Math.floor(freqStart * bufferLength / maxFreq);
                    const endIndex = Math.min(Math.ceil(freqEnd * bufferLength / maxFreq), bufferLength - 1);
                    
                    let maxAmp = 0;
                    for (let j = startIndex; j <= endIndex; j++) {
                        if (dataArray[j] > maxAmp) maxAmp = dataArray[j];
                    }
            
                    const barHeight = (maxAmp / 255) * canvas.height;
                    canvasCtx.fillRect(barX, canvas.height - barHeight, barWidth, barHeight);
                    barX += barWidth + barSpacing;
                }
                break;
            case 'circle':
                analyser.getByteFrequencyData(dataArray);
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const radius = Math.min(centerX, centerY) * 0.6;
                
                canvasCtx.beginPath();
                for (let i = 0; i < bufferLength; i += 4) {
                    const angle = (i / bufferLength) * Math.PI * 2;
                    const amp = dataArray[i] / 255;
                    const r = radius + amp * 50 * dpr;
                    const circleX = centerX + Math.cos(angle) * r;
                    const circleY = centerY + Math.sin(angle) * r;
                    if (i === 0) canvasCtx.moveTo(circleX, circleY);
                    else canvasCtx.lineTo(circleX, circleY);
                }
                canvasCtx.closePath();
                canvasCtx.stroke();
                break;
        }
        
        canvasCtx.shadowBlur = 0; // Reset shadow for next frame
        animationFrameRef.current = requestAnimationFrame(drawVisualizer);
    }, [waveformType, isPlaying, visualizerSmoothing, visualizerTheme]);


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
            
            // Setup Ambient Gain
            ambientGainNodeRef.current = audioCtx.createGain();
            ambientGainNodeRef.current.gain.setValueAtTime(ambientVolume, audioCtx.currentTime);
            ambientGainNodeRef.current.connect(audioCtx.destination);

            animationFrameRef.current = requestAnimationFrame(drawVisualizer);
        } else {
            if (audioContextRef.current) {
                if (audioContextRef.current.state !== 'closed') {
                    audioContextRef.current.close().catch(e => console.error(e));
                }
                audioContextRef.current = null;
                ambientNodesRef.current = null;
                ambientGainNodeRef.current = null;
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
                if (audioContextRef.current.state !== 'closed') {
                    audioContextRef.current.close().catch(e => console.error(e));
                }
                audioContextRef.current = null;
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
        if (!isPlaying || !audioContextRef.current || !ambientGainNodeRef.current) return;
        
        const ctx = audioContextRef.current;
        
        // Stop previous ambient sound
        if (ambientNodesRef.current) {
            ambientNodesRef.current.source.stop();
            ambientNodesRef.current.lfo?.stop();
            ambientNodesRef.current = null;
        }

        if (selectedAmbient === 'None') return;

        let source: AudioBufferSourceNode;
        let output: AudioNode;
        let lfo: OscillatorNode | undefined;

        if (selectedAmbient === 'White Noise') {
            source = ctx.createBufferSource();
            source.buffer = createNoiseBuffer(ctx, 'white');
            source.loop = true;
            output = source;
        } else if (selectedAmbient === 'Pink Noise') {
            source = ctx.createBufferSource();
            source.buffer = createNoiseBuffer(ctx, 'pink');
            source.loop = true;
            output = source;
        } else if (selectedAmbient === 'Rain') {
            source = ctx.createBufferSource();
            source.buffer = createNoiseBuffer(ctx, 'pink');
            source.loop = true;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 1000;
            source.connect(filter);
            output = filter;
        } else if (selectedAmbient === 'Ocean Waves') {
            source = ctx.createBufferSource();
            source.buffer = createNoiseBuffer(ctx, 'white');
            source.loop = true;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 500;
            
            lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.1;
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 400;
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);
            
            source.connect(filter);
            lfo.start();
            output = filter;
        } else {
            return;
        }

        source.connect(ambientGainNodeRef.current);
        source.start();
        ambientNodesRef.current = { source, output, lfo };

    }, [selectedAmbient, isPlaying]);

    useEffect(() => {
        if (ambientGainNodeRef.current && audioContextRef.current) {
            ambientGainNodeRef.current.gain.setValueAtTime(ambientVolume, audioContextRef.current.currentTime);
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
        playUISound('click');
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
            playUISound('click');
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
    };

    const handleAmbientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedAmbient(e.target.value);
        playUISound('click');
    };
    
    const handleAmbientVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setAmbientVolume(newVolume);
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
        playUISound('save');
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
            playUISound('save');
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
        playUISound('delete');
    };

    const handleChangeWaveform = () => {
        const types: ('curve' | 'bars' | 'line' | 'dots' | 'circle')[] = ['curve', 'bars', 'line', 'dots', 'circle'];
        const currentIndex = types.indexOf(waveformType);
        setWaveformType(types[(currentIndex + 1) % types.length]);
        playUISound('click');
    };
    
    const currentFrequencyDefinition = FREQUENCY_DEFINITIONS.find(def => def.value === frequency);
    const groupedFrequencies = FREQUENCY_DEFINITIONS.reduce((acc, freq) => {
        const category = freq.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(freq);
        return acc;
    }, {} as Record<string, FrequencyDefinition[]>);

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-[#f3f4f6] flex items-center justify-center p-4 selection:bg-indigo-500/30">
            <div className="w-full max-w-5xl bg-[#151619] rounded-2xl shadow-2xl p-6 md:p-10 space-y-8 border border-[#374151] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                
                <header className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tighter uppercase italic text-center">Binaural Beat <span className="text-indigo-500">Tone Generator</span></h1>
                    </div>
                    <p className="micro-label">by Nicole Tate | Professional Auditory Entrainment System v2.0</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-6">
                        <div className="hw-card p-6 rounded-xl">
                            <h2 className="micro-label mb-6 flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                                Master Output
                            </h2>
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <button
                                    onClick={togglePlay}
                                    className={`w-24 h-24 flex items-center justify-center bg-[#1f2937] hover:bg-[#374151] rounded-full transition-all duration-300 border-2 border-[#374151] group ${isPlaying ? 'is-playing-glow border-indigo-500' : ''}`}
                                    aria-label={isPlaying ? 'Pause' : 'Play'}
                                >
                                    {isPlaying ? 
                                        <PauseIcon className="h-10 w-10 text-indigo-400 group-hover:scale-110 transition-transform" /> : 
                                        <PlayIcon className="h-10 w-10 text-white group-hover:scale-110 transition-transform" />
                                    }
                                </button>
                                <div className="flex-grow w-full space-y-4">
                                    <div className="flex justify-between items-end">
                                        <label htmlFor="volume" className="micro-label">Main Gain</label>
                                        <div className="readout px-4 py-2 rounded font-mono text-base text-indigo-400 glow-text">
                                            {(volume * 100).toFixed(0)}<span className="text-xs ml-1 opacity-50">dB</span>
                                        </div>
                                    </div>
                                    <input
                                        id="volume"
                                        type="range" min="0" max="1" step="0.01"
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        className="w-full"
                                        style={{ '--slider-progress': `${volume * 100}%` } as React.CSSProperties}
                                    />
                                    <div className="flex justify-between micro-label opacity-30">
                                        <span>-INF</span>
                                        <span>0dB</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hw-card p-6 rounded-xl">
                            <h2 className="micro-label mb-6 flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                                Frequency Synthesis
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="readout p-4 rounded-lg flex flex-col items-center justify-center space-y-1">
                                    <span className="micro-label">Current Frequency</span>
                                    <span className="font-mono text-4xl text-indigo-400 glow-text leading-none">
                                        {frequency.toFixed(2)}
                                        <span className="text-sm ml-1 text-indigo-500/50">Hz</span>
                                    </span>
                                </div>
                                <div className="flex flex-col justify-center space-y-3">
                                    <label htmlFor="frequency-preset" className="micro-label">Preset Library</label>
                                    <select
                                        id="frequency-preset" value={frequency} onChange={handleFrequencyPresetChange}
                                        className="w-full bg-[#0a0a0c] border border-[#374151] rounded-lg p-3 focus:ring-2 focus:ring-indigo-500/50 outline-none text-base text-[#9ca3af] appearance-none cursor-pointer hover:border-indigo-500/30 transition-colors"
                                    >
                                        {Object.entries(groupedFrequencies).map(([category, freqs]) => (
                                            <optgroup label={category} key={category} className="bg-[#151619] text-[#4b5563]">
                                                {freqs.map(def => (
                                                    <option key={`${def.value}-${def.label}`} value={def.value} className="text-[#f3f4f6]">{def.label} ({def.value} Hz)</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-8">
                                 <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label htmlFor="frequency-slider" className="micro-label">Manual Sweep (0.1 - 1000 Hz)</label>
                                    </div>
                                    <input
                                        id="frequency-slider"
                                        type="range" min="0.1" max="1000" step="0.01"
                                        value={frequency}
                                        onChange={handleFrequencyChange}
                                        className="w-full"
                                        style={{ '--slider-progress': `${((frequency - 0.1) / (1000 - 0.1)) * 100}%` } as React.CSSProperties}
                                    />
                                    <div className="flex justify-between micro-label opacity-30 mt-2">
                                        <span>0.1 Hz</span>
                                        <span>500 Hz</span>
                                        <span>1000 Hz</span>
                                    </div>
                                </div>
                                
                                {currentFrequencyDefinition && (
                                    <div className="p-5 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-[10px] font-bold uppercase tracking-tighter">
                                                {currentFrequencyDefinition.category}
                                            </span>
                                            <p className="text-sm font-bold text-[#f3f4f6] uppercase tracking-wide">{currentFrequencyDefinition.label}</p>
                                        </div>
                                        <p className="text-[#9ca3af] text-sm leading-relaxed italic">"{currentFrequencyDefinition.description}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5 space-y-6 flex flex-col">
                        <div className="hw-card p-6 rounded-xl flex-grow flex flex-col">
                            <h2 className="micro-label mb-6 flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                                Signal Visualizer
                            </h2>
                            <div className="bg-black rounded-lg w-full flex-grow aspect-[4/3] border border-[#374151] overflow-hidden relative group">
                                <canvas ref={canvasRef} className="w-full h-full"></canvas>
                                <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="px-2 py-1 bg-black/80 border border-indigo-500/30 rounded text-[8px] font-mono text-indigo-400 uppercase">
                                        Live Feed
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-6">
                               <button 
                                   onClick={handleChangeWaveform} 
                                   className="w-full bg-[#1f2937] hover:bg-[#374151] text-[#f3f4f6] text-xs font-bold uppercase tracking-widest py-3 px-4 rounded-lg transition duration-200 border border-[#374151] active:translate-y-0.5"
                                >
                                   View Mode
                                </button>
                                <div className="flex items-center justify-center text-xs font-mono font-bold uppercase tracking-widest text-indigo-400 bg-black/40 border border-[#374151] rounded-lg">
                                    {waveformType}
                                </div>
                           </div>

                           <div className="mt-6 space-y-4">
                               <div className="space-y-2">
                                   <div className="flex justify-between items-center">
                                       <label className="micro-label">Smoothing</label>
                                       <span className="font-mono text-[10px] text-indigo-400">{(visualizerSmoothing * 100).toFixed(0)}%</span>
                                   </div>
                                   <input 
                                       type="range" min="0.1" max="0.99" step="0.01"
                                       value={visualizerSmoothing}
                                       onChange={(e) => setVisualizerSmoothing(parseFloat(e.target.value))}
                                       className="w-full"
                                       style={{ '--slider-progress': `${((visualizerSmoothing - 0.1) / (0.99 - 0.1)) * 100}%` } as React.CSSProperties}
                                   />
                               </div>

                               <div className="space-y-2">
                                   <label className="micro-label">Color Theme</label>
                                   <div className="flex justify-between gap-2">
                                       {(['indigo', 'emerald', 'amber', 'rose', 'cyan'] as const).map((t) => (
                                           <button
                                               key={t}
                                               onClick={() => { playUISound('click'); setVisualizerTheme(t); }}
                                               className={`flex-grow h-6 rounded-md transition-all duration-200 border-2 ${visualizerTheme === t ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                               style={{ backgroundColor: VISUALIZER_THEMES[t].accent }}
                                               title={t}
                                           />
                                       ))}
                                   </div>
                               </div>
                           </div>
                        </div>

                        <div className="hw-card p-6 rounded-xl">
                            <h2 className="micro-label mb-6 flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                                Ambient Engine
                            </h2>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="ambient-select" className="micro-label">Source</label>
                                        <select
                                            id="ambient-select" value={selectedAmbient} onChange={handleAmbientChange}
                                            className="w-full bg-[#0a0a0c] border border-[#374151] rounded-lg p-3 focus:ring-2 focus:ring-indigo-500/50 outline-none text-xs text-[#9ca3af] appearance-none cursor-pointer"
                                        >
                                            {AMBIENT_SOUNDS.map(sound => (
                                                <option key={sound} value={sound}>{sound}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label htmlFor="ambient-volume" className="micro-label">Level</label>
                                            <span className="font-mono text-xs text-indigo-400">{(ambientVolume * 100).toFixed(0)}%</span>
                                        </div>
                                        <input
                                            id="ambient-volume"
                                            type="range" min="0" max="1" step="0.01"
                                            value={ambientVolume} onChange={handleAmbientVolumeChange}
                                            className="w-full"
                                            style={{ '--slider-progress': `${ambientVolume * 100}%` } as React.CSSProperties}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hw-card p-6 rounded-xl">
                            <h2 className="micro-label mb-6 flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                                Memory Bank
                            </h2>
                            <div className="space-y-4">
                                <div className="flex space-x-2">
                                    <input
                                        type="text" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)}
                                        placeholder="NEW_PRESET_ID"
                                        className="flex-grow bg-[#0a0a0c] border border-[#374151] rounded-lg p-3 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-mono text-[#f3f4f6] placeholder:text-[#4b5563]"
                                    />
                                    <button
                                        onClick={handleSavePreset}
                                        className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest py-3 px-6 rounded-lg transition duration-200 shadow-lg shadow-indigo-500/20 active:translate-y-0.5"
                                    >
                                        Store
                                    </button>
                                </div>
                                <div className="flex space-x-2">
                                    <select
                                        value={selectedPreset} onChange={handleLoadPreset}
                                        className="flex-grow bg-[#0a0a0c] border border-[#374151] rounded-lg p-3 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm text-[#9ca3af] appearance-none cursor-pointer"
                                    >
                                        <option value="">RECALL...</option>
                                        {presets.map(p => ( <option key={p.name} value={p.name}>{p.name}</option> ))}
                                    </select>
                                    <button
                                        onClick={handleDeletePreset} disabled={!selectedPreset}
                                        className="bg-red-950/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 text-xs font-bold uppercase tracking-widest py-3 px-6 rounded-lg transition duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:translate-y-0.5"
                                    >
                                        Purge
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <footer className="pt-6 border-t border-[#374151] flex justify-between items-center">
                    <div className="flex space-x-4">
                        <div className="flex items-center space-x-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="micro-label">{isPlaying ? 'System Active' : 'Standby'}</span>
                        </div>
                    </div>
                    <div className="micro-label opacity-30">
                        Binaural Beat Tone Generator © 2026 | by Nicole Tate
                    </div>
                </footer>
            </div>
        </div>
    );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}