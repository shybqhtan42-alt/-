import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { 
  Maximize2, 
  Minimize2, 
  Camera, 
  Sun, 
  Moon, 
  CloudRain, 
  Wind, 
  Siren, 
  Award, 
  Search, 
  Sparkles, 
  AlertTriangle, 
  RotateCw, 
  SlidersHorizontal, 
  Volume2, 
  VolumeX, 
  ChevronLeft, 
  ChevronRight, 
  Radio,
  UserCheck,
  CheckCircle2,
  X,
  ShieldCheck,
  KeyRound,
  FileText,
  Package
} from 'lucide-react';
import { SchoolConfig, CurrentUser, CarModelType, SuspectVehicle } from '../types';

interface ThreeGameSimulatorProps {
  config: SchoolConfig;
  currentUser: CurrentUser;
  score: number;
  onUpdateScore: (newScore: number) => void;
  weather: 'clear' | 'night' | 'rain' | 'dust';
  onWeatherChange: (w: 'clear' | 'night' | 'rain' | 'dust') => void;
  timeOfDay: 'day' | 'night';
  onTimeOfDayChange: (t: 'day' | 'night') => void;
  selectedRole: 'officer' | 'civilian';
  selectedCarModel: CarModelType;
  carColorHex: string;
  onOpenInspection: (carIndex?: number) => void;
  suspectCarsCount?: number;
  onChangeVehicleRequest?: () => void;
  suspectCars?: SuspectVehicle[];
  onUpdateSuspectCars?: (cars: SuspectVehicle[]) => void;
}

// Module-scope zero-GC vectors
const _tempVec3 = new THREE.Vector3();

// Detect software WebGL to guarantee stable 60fps
const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return false;
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
})();

// Preset default suspect cars for in-game checkpoint inspection
const DEFAULT_IN_GAME_SUSPECTS: SuspectVehicle[] = [
  {
    id: 'veh-1',
    model: 'تويوتا كامري 2024',
    color: 'أبيض لؤلؤي',
    plateNumber: 'أ ب ح | 159',
    driverName: 'فهد بن ناصر الدوسري',
    nationalId: '1088492011',
    city: 'الرياض',
    licenseStatus: 'سارية',
    trunkItems: [
      { name: 'فأرة كمبيوتر لاسلكية', isIllegal: false, count: 1 },
      { name: 'مفتاح عجل احتياطي', isIllegal: false, count: 1 },
      { name: 'مجموعة أدوات تصليح ومفكات', isIllegal: false, count: 1 },
      { name: 'سكين طعام ومستلزمات رحلات', isIllegal: false, count: 1 },
    ],
    status: 'pending',
  },
  {
    id: 'veh-2',
    model: 'هيونداي سوناتا 2023',
    color: 'رمادي داكن',
    plateNumber: 'ر ق م | 884',
    driverName: 'سعد بن عبد الرحمن القرني',
    nationalId: '1074559203',
    city: 'مكة المكرمة',
    licenseStatus: 'منتهية',
    trunkItems: [
      { name: 'حقيبة سفر شخصية', isIllegal: false, count: 2 },
      { name: 'شهادة تدريب معتمدة', isIllegal: false, count: 1 },
      { name: 'ألعاب نارية غير مرخصة', isIllegal: true, count: 5 },
    ],
    status: 'pending',
  },
  {
    id: 'veh-3',
    model: 'تويوتا يارس 2025',
    color: 'فضي معدني',
    plateNumber: 'ص ك ب | 442',
    driverName: 'خالد بن مسفر القحطاني',
    nationalId: '1099234812',
    city: 'جدة',
    licenseStatus: 'سارية',
    trunkItems: [
      { name: 'كتب ومذكرات مدرسية', isIllegal: false, count: 4 },
      { name: 'طفاية حريق ومثلث طوارئ', isIllegal: false, count: 1 },
      { name: 'كاميرا تصوير فوتوغرافي', isIllegal: false, count: 1 },
    ],
    status: 'pending',
  },
];

export const ThreeGameSimulator: React.FC<ThreeGameSimulatorProps> = ({
  score,
  onUpdateScore,
  weather,
  onWeatherChange,
  timeOfDay,
  onTimeOfDayChange,
  selectedRole,
  selectedCarModel,
  carColorHex,
  onOpenInspection,
  onChangeVehicleRequest,
  suspectCars = DEFAULT_IN_GAME_SUSPECTS,
  onUpdateSuspectCars,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);

  // HUD & Game UI States
  const [speedKmh, setSpeedKmh] = useState(0);
  const [gear, setGear] = useState<'D' | 'R'>('D'); // Drive / Reverse
  const [cameraMode, setCameraMode] = useState<'third' | 'cockpit'>('third');
  const [sirenOn, setSirenOn] = useState(selectedRole === 'officer');
  const [headlightLevel, setHeadlightLevel] = useState<0 | 1 | 2>(2); // 0=Off, 1=Low, 2=High
  const [turnSignal, setTurnSignal] = useState<'none' | 'left' | 'right' | 'hazard'>('none');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flashOverlay, setFlashOverlay] = useState(false);
  const [saherAlert, setSaherAlert] = useState<string | null>(null);
  const [complianceMessage, setComplianceMessage] = useState<string | null>(null);
  const [isPortraitWarning, setIsPortraitWarning] = useState(false);

  // Player On-Foot vs Driving Mode ("يستطيع العسكري ان يخرج من سيارته ويفتح بنفسه داخل اللعبة")
  const [playerMode, setPlayerMode] = useState<'driving' | 'on_foot'>('driving');
  const [nearSuspectCarIndex, setNearSuspectCarIndex] = useState<number | null>(null);
  const [activeInGameInspectionCar, setActiveInGameInspectionCar] = useState<SuspectVehicle | null>(null);
  const [inspectionTab, setInspectionTab] = useState<'id' | 'trunk'>('id');
  const [inGameSuspectsList, setInGameSuspectsList] = useState<SuspectVehicle[]>(suspectCars);

  // Landmarks proximity banners
  const [checkpointProximity, setCheckpointProximity] = useState(false);
  const [hospitalProximity, setHospitalProximity] = useState(false);
  const [stationProximity, setStationProximity] = useState(false);

  // Visual Steering Wheel Angle (degrees)
  const [steeringWheelAngle, setSteeringWheelAngle] = useState(0);

  // Real-time Audio Engine Nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineNodesRef = useRef<{
    osc1: OscillatorNode | null;
    osc2: OscillatorNode | null;
    gain: GainNode | null;
    noiseNode: AudioBufferSourceNode | null;
    noiseGain: GainNode | null;
    sirenOsc: OscillatorNode | null;
    sirenGain: GainNode | null;
  }>({
    osc1: null,
    osc2: null,
    gain: null,
    noiseNode: null,
    noiseGain: null,
    sirenOsc: null,
    sirenGain: null,
  });

  // Driving & Walking input states
  const inputRef = useRef({
    accelerate: false,
    brake: false,
    steerLeft: false,
    steerRight: false,
    handbrake: false,
    // On-Foot Inputs
    walkForward: false,
    walkBackward: false,
    turnLeft: false,
    turnRight: false,
  });

  // Physical State (Player car and on-foot officer)
  const physicsRef = useRef({
    x: 0,
    y: 0,
    z: -30, // Start safely in center lane
    speed: 0,
    maxForwardSpeed: 44, // ~160 km/h
    maxReverseSpeed: -14, // ~50 km/h
    acceleration: 22,
    reverseAccel: 14,
    braking: 35,
    drag: 0.985,
    lateralSpeed: 16,
    steerInput: 0,
    heading: 0,
    gear: 'D' as 'D' | 'R',
    roadLength: 1800,
    saherZ: -680,
    saherTriggered: false,
    complianceTimer: 0,
    signalBlinkTimer: 0,
    signalBlinkOn: false,
    checkpointZ: -350,
    hospitalZ: -180,
    stationZ: -520,
    overpassZ1: -120,
    overpassZ2: -900,
    // On-foot officer coordinates
    officerX: 2.2,
    officerZ: -30,
    officerHeading: 0,
    officerWalking: false,
  });

  // Ref mirror for props in tick
  const stateRef = useRef({
    cameraMode,
    gear,
    sirenOn,
    turnSignal,
    soundEnabled,
    score,
    selectedRole,
    selectedCarModel,
    playerMode,
  });
  useEffect(() => {
    stateRef.current = {
      cameraMode,
      gear,
      sirenOn,
      turnSignal,
      soundEnabled,
      score,
      selectedRole,
      selectedCarModel,
      playerMode,
    };
    physicsRef.current.gear = gear;
  }, [cameraMode, gear, sirenOn, turnSignal, soundEnabled, score, selectedRole, selectedCarModel, playerMode]);

  // Keep internal list in sync with parent if provided
  useEffect(() => {
    if (suspectCars && suspectCars.length > 0) {
      setInGameSuspectsList(suspectCars);
    }
  }, [suspectCars]);

  // Three.js internal references
  const threeRefs = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    carGroup: THREE.Group | null;
    carBodyMesh: THREE.Mesh | null;
    carRoofMesh: THREE.Mesh | null;
    carInteriorGroup: THREE.Group | null;
    cockpitSteeringWheel: THREE.Group | null;
    playerOfficerMesh: THREE.Group | null;
    headlightLeft: THREE.SpotLight | null;
    headlightRight: THREE.SpotLight | null;
    turnSignalLightL: THREE.PointLight | null;
    turnSignalLightR: THREE.PointLight | null;
    turnSignalMeshL: THREE.Mesh | null;
    turnSignalMeshR: THREE.Mesh | null;
    strobeBlue: THREE.PointLight | null;
    strobeRed: THREE.PointLight | null;
    strobeMeshBlue: THREE.Mesh | null;
    strobeMeshRed: THREE.Mesh | null;
    taillightMesh: THREE.Mesh | null;
    reverseLightMesh: THREE.Mesh | null;
    frontWheels: THREE.Group[];
    rearWheels: THREE.Group[];
    aiCars: { group: THREE.Group; speed: number; baseSpeed: number; laneX: number; length: number; isStopped: boolean; suspectData?: SuspectVehicle }[];
    saherFlashLight: THREE.PointLight | null;
    dirLight: THREE.DirectionalLight | null;
    hemiLight: THREE.HemisphereLight | null;
    rainSystem: THREE.Points | null;
    dustSystem: THREE.Points | null;
    frameId: number;
    isDisposed: boolean;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    carGroup: null,
    carBodyMesh: null,
    carRoofMesh: null,
    carInteriorGroup: null,
    cockpitSteeringWheel: null,
    playerOfficerMesh: null,
    headlightLeft: null,
    headlightRight: null,
    turnSignalLightL: null,
    turnSignalLightR: null,
    turnSignalMeshL: null,
    turnSignalMeshR: null,
    strobeBlue: null,
    strobeRed: null,
    strobeMeshBlue: null,
    strobeMeshRed: null,
    taillightMesh: null,
    reverseLightMesh: null,
    frontWheels: [],
    rearWheels: [],
    aiCars: [],
    saherFlashLight: null,
    dirLight: null,
    hemiLight: null,
    rainSystem: null,
    dustSystem: null,
    frameId: 0,
    isDisposed: false,
  });

  // Sound effects helper
  const playSound = useCallback((type: 'click' | 'horn' | 'gear' | 'saher' | 'compliance' | 'door') => {
    if (!stateRef.current.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        g.gain.setValueAtTime(0.12, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      } else if (type === 'gear' || type === 'door') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(240, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);
        g.gain.setValueAtTime(0.2, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'horn') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const g = ctx.createGain();
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(390, ctx.currentTime);
        osc2.frequency.setValueAtTime(495, ctx.currentTime);
        g.gain.setValueAtTime(0.22, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc1.connect(g);
        osc2.connect(g);
        g.connect(ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.46);
        osc2.stop(ctx.currentTime + 0.46);
      } else if (type === 'saher') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1);
        g.gain.setValueAtTime(0.3, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.36);
      } else if (type === 'compliance') {
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          g.gain.setValueAtTime(0.12, now + idx * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.26);
        });
      }
    } catch {}
  }, []);

  // Initialize Web Audio Engine
  const initAudioEngine = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      if (!engineNodesRef.current.osc1) {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const masterGain = ctx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(45, ctx.currentTime);
        osc2.frequency.setValueAtTime(90, ctx.currentTime);

        masterGain.gain.setValueAtTime(0.06, ctx.currentTime);
        osc1.connect(masterGain);
        osc2.connect(masterGain);
        masterGain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        engineNodesRef.current.osc1 = osc1;
        engineNodesRef.current.osc2 = osc2;
        engineNodesRef.current.gain = masterGain;

        // Road Surface Noise
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99 * b0 + white * 0.05;
          b1 = 0.95 * b1 + white * 0.08;
          b2 = 0.85 * b2 + white * 0.12;
          output[i] = (b0 + b1 + b2) * 0.2;
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(320, ctx.currentTime);
        noiseFilter.Q.setValueAtTime(1.2, ctx.currentTime);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.015, ctx.currentTime);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseSource.start();

        engineNodesRef.current.noiseNode = noiseSource;
        engineNodesRef.current.noiseGain = noiseGain;
      }
    } catch {}
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      initAudioEngine();
      if (stateRef.current.playerMode === 'driving') {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') inputRef.current.accelerate = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') inputRef.current.brake = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') inputRef.current.steerLeft = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') inputRef.current.steerRight = true;
        if (e.code === 'Space') inputRef.current.handbrake = true;
      } else {
        // On-foot movement controls
        if (e.code === 'KeyW' || e.code === 'ArrowUp') inputRef.current.walkForward = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') inputRef.current.walkBackward = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') inputRef.current.turnLeft = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') inputRef.current.turnRight = true;
      }

      // Exit/Enter car toggle (E)
      if (e.code === 'KeyE') {
        togglePlayerMode();
      }
      if (e.code === 'KeyC') {
        setCameraMode((prev) => (prev === 'third' ? 'cockpit' : 'third'));
      }
      if (e.code === 'KeyH') playSound('horn');
      if (e.code === 'KeyL') setHeadlightLevel((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
      if (e.code === 'KeyQ') setTurnSignal((prev) => (prev === 'left' ? 'none' : 'left'));
      if (e.code === 'KeyF') setSirenOn((prev) => !prev);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        inputRef.current.accelerate = false;
        inputRef.current.walkForward = false;
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        inputRef.current.brake = false;
        inputRef.current.walkBackward = false;
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        inputRef.current.steerLeft = false;
        inputRef.current.turnLeft = false;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        inputRef.current.steerRight = false;
        inputRef.current.turnRight = false;
      }
      if (e.code === 'Space') inputRef.current.handbrake = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [initAudioEngine, playSound]);

  // Toggle exit/enter car ("نزول وركوب العسكري من الدورية")
  const togglePlayerMode = useCallback(() => {
    playSound('door');
    setPlayerMode((prev) => {
      const next = prev === 'driving' ? 'on_foot' : 'driving';
      if (next === 'on_foot') {
        // Position officer next to driver side of car
        const p = physicsRef.current;
        p.officerX = p.x + 1.8;
        p.officerZ = p.z;
        p.officerHeading = 0;
        // When on foot, enforce third-person perspective
        setCameraMode('third');
      }
      return next;
    });
  }, [playSound]);

  // Update dynamic vehicle paint color
  useEffect(() => {
    if (threeRefs.current.carBodyMesh) {
      const isPolice = selectedRole === 'officer' || selectedCarModel === 'police_dodge' || selectedCarModel === 'police_fj';
      const col = isPolice ? 0xffffff : parseInt(carColorHex.replace('#', '0x'), 16);
      (threeRefs.current.carBodyMesh.material as THREE.MeshStandardMaterial).color.setHex(col);
    }
  }, [carColorHex, selectedCarModel, selectedRole]);

  // Update environment & lights
  useEffect(() => {
    const scene = threeRefs.current.scene;
    const dir = threeRefs.current.dirLight;
    const hemi = threeRefs.current.hemiLight;
    if (!scene || !dir || !hemi) return;

    const isNight = timeOfDay === 'night' || weather === 'night';
    scene.background = new THREE.Color(isNight ? 0x050811 : weather === 'dust' ? 0xd1a967 : 0x88b7e8);
    scene.fog = new THREE.FogExp2(
      isNight ? 0x070c18 : weather === 'dust' ? 0xcaa35a : 0x93bfe9,
      weather === 'dust' ? 0.015 : isNight ? 0.006 : 0.0025
    );
    hemi.color.setHex(isNight ? 0x223355 : 0xffffff);
    hemi.groundColor.setHex(isNight ? 0x050510 : 0x443322);
    hemi.intensity = isNight ? 0.4 : 1.2;
    dir.color.setHex(isNight ? 0x334466 : 0xfffaed);
    dir.intensity = isNight ? 0.5 : 2.0;

    if (threeRefs.current.rainSystem) {
      threeRefs.current.rainSystem.visible = weather === 'rain';
    }
    if (threeRefs.current.dustSystem) {
      threeRefs.current.dustSystem.visible = weather === 'dust';
    }
  }, [weather, timeOfDay]);

  // Update Headlight intensities
  useEffect(() => {
    if (threeRefs.current.headlightLeft && threeRefs.current.headlightRight) {
      const intensity = headlightLevel === 2 ? 4.5 : headlightLevel === 1 ? 2.0 : 0;
      threeRefs.current.headlightLeft.intensity = intensity;
      threeRefs.current.headlightRight.intensity = intensity;
    }
  }, [headlightLevel]);

  // In-Game Inspection Handlers ("تفتيش داخل اللعبة مباشرة بدون ما أخرج")
  const handleClearCurrentCar = () => {
    if (!activeInGameInspectionCar) return;
    playSound('compliance');
    const newScore = score + 20;
    onUpdateScore(newScore);

    const updated = inGameSuspectsList.map((c) =>
      c.id === activeInGameInspectionCar.id ? { ...c, status: 'cleared' as const } : c
    );
    setInGameSuspectsList(updated);
    if (onUpdateSuspectCars) onUpdateSuspectCars(updated);

    // Release lead AI car to drive away
    if (threeRefs.current.aiCars.length > 0) {
      const leadAi = threeRefs.current.aiCars.find((ai) => ai.isStopped);
      if (leadAi) {
        leadAi.isStopped = false;
        leadAi.speed = 18; // Drives away cleanly!
      }
    }

    setActiveInGameInspectionCar(null);
  };

  const handleTicketCurrentCar = () => {
    if (!activeInGameInspectionCar) return;
    playSound('saher');
    const newScore = score + 10;
    onUpdateScore(newScore);

    const updated = inGameSuspectsList.map((c) =>
      c.id === activeInGameInspectionCar.id ? { ...c, status: 'ticketed' as const } : c
    );
    setInGameSuspectsList(updated);
    if (onUpdateSuspectCars) onUpdateSuspectCars(updated);

    if (threeRefs.current.aiCars.length > 0) {
      const leadAi = threeRefs.current.aiCars.find((ai) => ai.isStopped);
      if (leadAi) {
        leadAi.isStopped = false;
        leadAi.speed = 16;
      }
    }

    setActiveInGameInspectionCar(null);
  };

  const handleConfiscateTrunkItem = (itemName: string) => {
    playSound('gear');
    if (!activeInGameInspectionCar) return;
    const updated = inGameSuspectsList.map((c) => {
      if (c.id === activeInGameInspectionCar.id) {
        return {
          ...c,
          trunkItems: c.trunkItems.map((item) =>
            item.name === itemName ? { ...item, isIllegal: false, count: 0 } : item
          ),
        };
      }
      return c;
    });
    setInGameSuspectsList(updated);
    if (onUpdateSuspectCars) onUpdateSuspectCars(updated);
    setActiveInGameInspectionCar(updated.find((c) => c.id === activeInGameInspectionCar.id) || null);
  };

  // Helper to build a realistic 3D human officer character
  const createRealisticOfficer = (isSaluting: boolean = false, isStationary: boolean = false) => {
    const person = new THREE.Group();

    // 1. Military Uniform Trousers & Boots
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x181e29, roughness: 0.8 });
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.9, 8), pantsMat);
    legL.position.set(-0.16, 0.45, 0);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.9, 8), pantsMat);
    legR.position.set(0.16, 0.45, 0);
    person.add(legL, legR);

    // Boots
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.4 });
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.14, 0.28), bootMat);
    bootL.position.set(-0.16, 0.07, -0.04);
    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.14, 0.28), bootMat);
    bootR.position.set(0.16, 0.07, -0.04);
    person.add(bootL, bootR);

    // 2. Uniform Torso / Shirt
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.65, 0.28), shirtMat);
    torso.position.set(0, 1.15, 0);
    person.add(torso);

    // Tactical Duty Belt with Holster
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.3), beltMat);
    belt.position.set(0, 0.88, 0);
    const holster = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.12), beltMat);
    holster.position.set(0.26, 0.84, 0);
    person.add(belt, holster);

    // Gold Lieutenant Stars / Epaulets on shoulders
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
    const epauletL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.12), goldMat);
    epauletL.position.set(-0.25, 1.48, 0);
    const epauletR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.12), goldMat);
    epauletR.position.set(0.25, 1.48, 0);
    person.add(epauletL, epauletR);

    // 3. Human Head, Face, Hair & Mustache
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.6 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), skinMat);
    head.position.set(0, 1.62, 0);
    person.add(head);

    // Mustache
    const mustacheMat = new THREE.MeshBasicMaterial({ color: 0x1c1917 });
    const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.04), mustacheMat);
    mustache.position.set(0, 1.57, -0.155);
    person.add(mustache);

    // Military Cap with Saudi Golden Crest
    const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
    const capCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.09, 16), capMat);
    capCrown.position.set(0, 1.76, -0.02);
    const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.12), new THREE.MeshStandardMaterial({ color: 0x000000 }));
    capVisor.position.set(0, 1.72, -0.16);
    const capBadge = new THREE.Mesh(new THREE.CircleGeometry(0.04, 12), goldMat);
    capBadge.position.set(0, 1.77, -0.17);
    person.add(capCrown, capVisor, capBadge);

    // 4. Arms & Hands
    const armMat = shirtMat;
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.55, 8), armMat);
    armL.position.set(-0.29, 1.15, 0);
    person.add(armL);

    if (isSaluting) {
      const armRUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.32, 8), armMat);
      armRUpper.position.set(0.32, 1.35, -0.05);
      armRUpper.rotation.z = -Math.PI / 3;
      armRUpper.rotation.x = -Math.PI / 4;

      const armRForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.32, 8), armMat);
      armRForearm.position.set(0.24, 1.62, -0.15);
      armRForearm.rotation.z = Math.PI / 2.5;

      const handR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.12), skinMat);
      handR.position.set(0.18, 1.72, -0.18);
      person.add(armRUpper, armRForearm, handR);
    } else if (isStationary) {
      // Holding illuminated traffic baton
      const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.55, 8), armMat);
      armR.position.set(0.29, 1.15, 0);
      armR.rotation.x = -Math.PI / 5;

      const baton = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
      baton.position.set(0.29, 1.0, -0.25);
      baton.rotation.x = Math.PI / 4;
      person.add(armR, baton);
    } else {
      const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.55, 8), armMat);
      armR.position.set(0.29, 1.15, 0);
      person.add(armR);
    }

    return person;
  };

  // Helper to build realistic, properly proportioned 3D wheels
  // ("العجلات كبيره جدا" -> تم تصغير القطر للقياس الواقعي 0.29m مع جنوط ألمنيوم أنيقة وكليبرات فرامل حمراء)
  const createRealisticProportionedWheel = () => {
    const wheelGroup = new THREE.Group();

    // 1. Realistic Sized Tire: Radius = 0.29m, Width = 0.20m (realistic proportion!)
    const tireGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.20, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x171717,
      roughness: 0.9,
      metalness: 0.1,
    });
    const tire = new THREE.Mesh(tireGeo, tireMat);
    wheelGroup.add(tire);

    // 2. Metallic Rim Lip (Chrome / Brushed Alloy)
    const rimLipGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.21, 24);
    rimLipGeo.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.15,
    });
    const rimLip = new THREE.Mesh(rimLipGeo, rimMat);
    wheelGroup.add(rimLip);

    // 3. Multi-Spoke Luxury Wheel Face
    const spokeCount = 6;
    for (let s = 0; s < spokeCount; s++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.36, 0.215), rimMat);
      spoke.rotation.x = (s * Math.PI) / spokeCount;
      wheelGroup.add(spoke);
    }

    // 4. Center Hub Cap
    const capGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.22, 16);
    capGeo.rotateZ(Math.PI / 2);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.1 });
    const cap = new THREE.Mesh(capGeo, capMat);
    wheelGroup.add(cap);

    // 5. Red Brake Caliper
    const caliperMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.7, roughness: 0.3 });
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.10), caliperMat);
    caliper.position.set(0, 0.11, 0);
    wheelGroup.add(caliper);

    return wheelGroup;
  };

  // ==========================================
  // MAIN THREE.JS MOUNT & RENDER LOOP
  // ==========================================
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    threeRefs.current.isDisposed = false;

    // 1. WebGL Renderer
    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 450;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);
    threeRefs.current.renderer = renderer;

    // 2. Scene
    const scene = new THREE.Scene();
    threeRefs.current.scene = scene;

    const pmremGen = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGen.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGen.dispose();

    // 3. Perspective Camera (Near plane 0.05m to prevent any interior clipping!)
    const pInit = physicsRef.current;
    const camera = new THREE.PerspectiveCamera(58, width / height, 0.05, 950);
    camera.position.set(pInit.x, 2.3, pInit.z + 6.6);
    camera.lookAt(pInit.x, 0.9, pInit.z - 12);
    threeRefs.current.camera = camera;

    // 4. Lighting Rig
    const isNight = timeOfDay === 'night' || weather === 'night';
    scene.background = new THREE.Color(isNight ? 0x050811 : weather === 'dust' ? 0xd1a967 : 0x88b7e8);
    scene.fog = new THREE.FogExp2(
      isNight ? 0x070c18 : weather === 'dust' ? 0xcaa35a : 0x93bfe9,
      weather === 'dust' ? 0.015 : isNight ? 0.006 : 0.0025
    );

    const hemiLight = new THREE.HemisphereLight(
      isNight ? 0x223355 : 0xffffff,
      isNight ? 0x050510 : 0x443322,
      isNight ? 0.4 : 1.2
    );
    scene.add(hemiLight);
    threeRefs.current.hemiLight = hemiLight;

    const dirLight = new THREE.DirectionalLight(isNight ? 0x334466 : 0xfffaed, isNight ? 0.5 : 2.0);
    dirLight.position.set(50, 80, 40);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 280;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);
    threeRefs.current.dirLight = dirLight;

    // 5. HIGHWAY WITH REALISTIC ASPHALT & SIDE-MOUNTED LIGHT POLES
    const roadWidth = 24;
    const roadLength = pInit.roadLength;

    // Desert terrain ground
    const groundGeo = new THREE.PlaneGeometry(1200, roadLength + 400, 8, 8);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isNight ? 0x161c24 : weather === 'dust' ? 0xb5894b : 0xd3b382,
      roughness: 0.95,
      metalness: 0.05,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, -0.05, -roadLength / 2 + 100);
    groundMesh.receiveShadow = !isSoftwareGl;
    scene.add(groundMesh);

    // Highway Asphalt
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength, 1, 32);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x16181d,
      roughness: 0.85,
      metalness: 0.1,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0, -roadLength / 2 + 100);
    roadMesh.receiveShadow = !isSoftwareGl;
    scene.add(roadMesh);

    // Edge lines
    const edgeLineGeo = new THREE.PlaneGeometry(0.35, roadLength);
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const leftEdge = new THREE.Mesh(edgeLineGeo, yellowMat);
    leftEdge.rotation.x = -Math.PI / 2;
    leftEdge.position.set(-roadWidth / 2 + 0.6, 0.02, -roadLength / 2 + 100);
    const rightEdge = new THREE.Mesh(edgeLineGeo, yellowMat);
    rightEdge.rotation.x = -Math.PI / 2;
    rightEdge.position.set(roadWidth / 2 - 0.6, 0.02, -roadLength / 2 + 100);
    scene.add(leftEdge, rightEdge);

    // White dashed lane dividers
    const dashCount = Math.floor(roadLength / 9);
    const dashGeo = new THREE.PlaneGeometry(0.25, 4.5);
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
    const dashInstL = new THREE.InstancedMesh(dashGeo, whiteMat, dashCount);
    const dashInstR = new THREE.InstancedMesh(dashGeo, whiteMat, dashCount);
    const matTemp = new THREE.Matrix4();
    const rotTemp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    const scaleTemp = new THREE.Vector3(1, 1, 1);

    for (let i = 0; i < dashCount; i++) {
      const zPos = 100 - i * 9;
      matTemp.compose(new THREE.Vector3(-4, 0.02, zPos), rotTemp, scaleTemp);
      dashInstL.setMatrixAt(i, matTemp);
      matTemp.compose(new THREE.Vector3(4, 0.02, zPos), rotTemp, scaleTemp);
      dashInstR.setMatrixAt(i, matTemp);
    }
    dashInstL.instanceMatrix.needsUpdate = true;
    dashInstR.instanceMatrix.needsUpdate = true;
    scene.add(dashInstL, dashInstR);

    // Overpass Bridges
    const createOverpassBridge = (bridgeZ: number, label: string) => {
      const bGroup = new THREE.Group();
      const deckMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
      const deck = new THREE.Mesh(new THREE.BoxGeometry(roadWidth + 14, 2.2, 14), deckMat);
      deck.position.set(0, 9.5, bridgeZ);
      bGroup.add(deck);

      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
      const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 9.5, 12), pillarMat);
      pL.position.set(-roadWidth / 2 - 2, 4.75, bridgeZ);
      const pR = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 9.5, 12), pillarMat);
      pR.position.set(roadWidth / 2 + 2, 4.75, bridgeZ);
      bGroup.add(pL, pR);

      const bridgeSignCanvas = document.createElement('canvas');
      bridgeSignCanvas.width = 512;
      bridgeSignCanvas.height = 128;
      const bCtx = bridgeSignCanvas.getContext('2d')!;
      bCtx.fillStyle = '#065f46';
      bCtx.fillRect(0, 0, 512, 128);
      bCtx.strokeStyle = '#ffffff';
      bCtx.lineWidth = 6;
      bCtx.strokeRect(6, 6, 500, 116);
      bCtx.fillStyle = '#ffffff';
      bCtx.textAlign = 'center';
      bCtx.direction = 'rtl';
      bCtx.font = 'bold 36px Arial';
      bCtx.fillText(label, 256, 75);

      const bTex = new THREE.CanvasTexture(bridgeSignCanvas);
      const bSign = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), new THREE.MeshBasicMaterial({ map: bTex }));
      bSign.position.set(0, 9.5, bridgeZ + 7.1);
      bGroup.add(bSign);

      scene.add(bGroup);
    };

    createOverpassBridge(pInit.overpassZ1, 'تقاطع مخرج 15 - الكوبري العلوي 🛣️');
    createOverpassBridge(pInit.overpassZ2, 'كوبري أمن الطرق والمستشفى العام 🏥');

    // 7. REALISTIC SAHER RADAR POST
    const saherGroup = new THREE.Group();
    const saherBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xd4d8dd, roughness: 0.3, metalness: 0.4 })
    );
    saherBox.position.set(roadWidth / 2 + 2.5, 1.1, pInit.saherZ);
    saherGroup.add(saherBox);

    const lensMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), lensMat);
    lens.position.set(roadWidth / 2 + 1.89, 1.6, pInit.saherZ + 0.61);
    lens.rotation.y = -Math.PI / 6;
    saherGroup.add(lens);

    const saherFlashLight = new THREE.PointLight(0xffffff, 0, 45);
    saherFlashLight.position.set(roadWidth / 2 + 2.4, 2.0, pInit.saherZ + 1.0);
    scene.add(saherFlashLight);
    threeRefs.current.saherFlashLight = saherFlashLight;
    scene.add(saherGroup);

    // 8. POLICE PATROL HQ STATION & DETAILED INTERIOR WITH REAL PEOPLE
    const stationGroup = new THREE.Group();
    const stZ = pInit.stationZ;

    const stBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(32, 12, 34),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
    );
    stBuilding.position.set(-roadWidth / 2 - 24, 6, stZ);
    stationGroup.add(stBuilding);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.9,
    });
    const officeGlass = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), glassMat);
    officeGlass.position.set(-roadWidth / 2 - 7.9, 4.5, stZ);
    officeGlass.rotation.y = Math.PI / 2;
    stationGroup.add(officeGlass);

    const deskMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const desk1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 4.0), deskMat);
    desk1.position.set(-roadWidth / 2 - 12, 1.0, stZ);
    const monitorMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
    const monitor1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.8), monitorMat);
    monitor1.position.set(-roadWidth / 2 - 12, 1.8, stZ);
    stationGroup.add(desk1, monitor1);

    const insideOfficer = createRealisticOfficer(false, false);
    insideOfficer.position.set(-roadWidth / 2 - 13.5, 0.5, stZ);
    insideOfficer.rotation.y = Math.PI / 2;
    stationGroup.add(insideOfficer);

    scene.add(stationGroup);

    // 9. REALISTIC HIGHWAY PATROL CHECKPOINT
    const cpGroup = new THREE.Group();
    const cpZ = pInit.checkpointZ;

    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
    const canopyRoof = new THREE.Mesh(new THREE.BoxGeometry(roadWidth + 8, 0.8, 22), canopyMat);
    canopyRoof.position.set(0, 7.0, cpZ);
    const cpPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 7.0, 8), canopyMat);
    cpPost1.position.set(-roadWidth / 2 - 2, 3.5, cpZ - 8);
    const cpPost2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 7.0, 8), canopyMat);
    cpPost2.position.set(-roadWidth / 2 - 2, 3.5, cpZ + 8);
    const cpPost3 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 7.0, 8), canopyMat);
    cpPost3.position.set(roadWidth / 2 + 2, 3.5, cpZ - 8);
    const cpPost4 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 7.0, 8), canopyMat);
    cpPost4.position.set(roadWidth / 2 + 2, 3.5, cpZ + 8);
    cpGroup.add(canopyRoof, cpPost1, cpPost2, cpPost3, cpPost4);

    // Checkpoint Sign
    const cpSignCanvas = document.createElement('canvas');
    cpSignCanvas.width = 1024;
    cpSignCanvas.height = 256;
    const cpCtx = cpSignCanvas.getContext('2d')!;
    cpCtx.fillStyle = '#0f172a';
    cpCtx.fillRect(0, 0, 1024, 256);
    cpCtx.strokeStyle = '#f59e0b';
    cpCtx.lineWidth = 12;
    cpCtx.strokeRect(10, 10, 1004, 236);
    cpCtx.fillStyle = '#ffffff';
    cpCtx.textAlign = 'center';
    cpCtx.direction = 'rtl';
    cpCtx.font = 'bold 44px Arial';
    cpCtx.fillText('مركز القوات الخاصة لأمن الطرق', 512, 90);
    cpCtx.fillStyle = '#f59e0b';
    cpCtx.font = 'bold 40px Arial';
    cpCtx.fillText('نقطة تفتيش أمنية | قف للتفتيش', 512, 175);
    const cpSignTex = new THREE.CanvasTexture(cpSignCanvas);
    const cpSign = new THREE.Mesh(new THREE.PlaneGeometry(16, 3.8), new THREE.MeshBasicMaterial({ map: cpSignTex }));
    cpSign.position.set(0, 7.0, cpZ + 11.1);
    cpGroup.add(cpSign);

    // Traffic Cones marking inspection lane
    const coneGeo = new THREE.ConeGeometry(0.2, 0.65, 12);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
    for (let c = 0; c < 5; c++) {
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(-2.5 + c * 1.2, 0.32, cpZ + 14 - c * 2.5);
      cpGroup.add(cone);
    }

    // Static Highway Patrol Toyota FJ / Prado (JM-602) at Checkpoint
    const checkpointPatrol = new THREE.Group();
    const cpSuvBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 4.6), new THREE.MeshStandardMaterial({ color: 0x111827 }));
    cpSuvBody.position.y = 0.8;
    const cpSuvRoof = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.75, 2.6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    cpSuvRoof.position.set(0, 1.55, -0.1);
    const cpBullBar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.15), new THREE.MeshStandardMaterial({ color: 0x0a0a0c }));
    cpBullBar.position.set(0, 0.7, -2.35);
    checkpointPatrol.add(cpSuvBody, cpSuvRoof, cpBullBar);
    checkpointPatrol.position.set(roadWidth / 2 - 3.5, 0, cpZ);
    cpGroup.add(checkpointPatrol);

    // Saluting officer by patrol car
    const salutingOfficer = createRealisticOfficer(true, false);
    salutingOfficer.position.set(roadWidth / 2 - 5.5, 0, cpZ + 0.5);
    salutingOfficer.rotation.y = Math.PI / 4;
    cpGroup.add(salutingOfficer);

    // Traffic Inspection officer with illuminated signal baton at checkpoint
    const wandOfficer = createRealisticOfficer(false, true);
    wandOfficer.position.set(-2.2, 0, cpZ + 9);
    wandOfficer.rotation.y = 0;
    cpGroup.add(wandOfficer);

    scene.add(cpGroup);

    // 10. AI HIGHWAY TRAFFIC WITH CHECKPOINT QUEUING LOGIC
    // ("اذا وقفت سيارة تمشي ببطء وتقف في نقطة التفتيش ولا تدخل في السيارات")
    const aiCarsList: {
      group: THREE.Group;
      speed: number;
      baseSpeed: number;
      laneX: number;
      length: number;
      isStopped: boolean;
      suspectData?: SuspectVehicle;
    }[] = [];

    const aiConfigs = [
      { x: 0, z: cpZ + 10, speed: 0, color: 0xf8fafc, suspect: inGameSuspectsList[0] }, // Lead car stopped at inspection!
      { x: 0, z: cpZ + 22, speed: 0, color: 0x475569, suspect: inGameSuspectsList[1] }, // Second car queuing behind it!
      { x: -4, z: -180, speed: 28, color: 0x94a3b8 },
      { x: 4, z: -550, speed: 26, color: 0x1e293b },
      { x: -4, z: -800, speed: 32, color: 0xb45309 },
    ];

    aiConfigs.forEach((cfg, idx) => {
      const aiGrp = new THREE.Group();
      // Body
      const aiBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.85, 0.7, 4.4),
        new THREE.MeshStandardMaterial({ color: cfg.color, metalness: 0.6, roughness: 0.3 })
      );
      aiBody.position.y = 0.55;
      aiGrp.add(aiBody);

      // Cabin
      const aiCabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.65, 0.6, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.1 })
      );
      aiCabin.position.set(0, 1.15, -0.2);
      aiGrp.add(aiCabin);

      // 4 Realistic proportioned wheels on AI cars
      const wFL = createRealisticProportionedWheel();
      wFL.position.set(-0.92, 0.3, -1.3);
      const wFR = createRealisticProportionedWheel();
      wFR.position.set(0.92, 0.3, -1.3);
      const wRL = createRealisticProportionedWheel();
      wRL.position.set(-0.92, 0.3, 1.3);
      const wRR = createRealisticProportionedWheel();
      wRR.position.set(0.92, 0.3, 1.3);
      aiGrp.add(wFL, wFR, wRL, wRR);

      // Tail & Headlights
      const aiTail = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.05), new THREE.MeshBasicMaterial({ color: 0xff1122 }));
      aiTail.position.set(0, 0.65, 2.21);
      const aiHead = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 0.05), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      aiHead.position.set(0, 0.6, -2.21);
      aiGrp.add(aiTail, aiHead);

      aiGrp.position.set(cfg.x, 0, cfg.z);
      scene.add(aiGrp);

      aiCarsList.push({
        group: aiGrp,
        speed: cfg.speed,
        baseSpeed: cfg.speed === 0 ? 25 : cfg.speed,
        laneX: cfg.x,
        length: roadLength,
        isStopped: cfg.speed === 0,
        suspectData: cfg.suspect,
      });
    });
    threeRefs.current.aiCars = aiCarsList;

    // 11. ON-FOOT PLAYER OFFICER CHARACTER
    // ("يستطيع العسكري ان يخرج من سيارته ويفتح بنفسه داخل اللعبة")
    const playerOfficerMesh = createRealisticOfficer(false, false);
    playerOfficerMesh.visible = false;
    scene.add(playerOfficerMesh);
    threeRefs.current.playerOfficerMesh = playerOfficerMesh;

    // ==========================================================
    // 12. HERO CAR WITH LUXURIOUS LEXUS COCKPIT & ACCURATE WHEELS
    // ==========================================================
    const carGroup = new THREE.Group();
    threeRefs.current.carGroup = carGroup;

    const isPolice = selectedRole === 'officer' || selectedCarModel === 'police_dodge' || selectedCarModel === 'police_fj';
    const isBMWTwoTone = selectedCarModel === 'bmw_i7';
    const mainBodyColor = isPolice ? 0xffffff : isBMWTwoTone ? 0x064e3b : parseInt(carColorHex.replace('#', '0x'), 16) || 0xf4f4f5;

    // Car Body Hull (Width 1.74m)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: mainBodyColor,
      metalness: 0.75,
      roughness: 0.18,
    });
    const bodyGeo = new THREE.BoxGeometry(1.74, 0.65, 4.6);
    const carHull = new THREE.Mesh(bodyGeo, bodyMat);
    carHull.position.y = 0.58;
    carHull.castShadow = !isSoftwareGl;
    carGroup.add(carHull);
    threeRefs.current.carBodyMesh = carHull;

    // Roof Mesh
    const roofColor = isBMWTwoTone ? 0xd1d5db : isPolice ? 0x111827 : mainBodyColor;
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, metalness: 0.85, roughness: 0.15 });
    const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.62, 2.4), roofMat);
    roofMesh.position.set(0, 1.25, -0.2);
    carGroup.add(roofMesh);
    threeRefs.current.carRoofMesh = roofMesh;

    // Grille & Headlights
    const grilleMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 });
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.45, 0.12), grilleMat);
    grille.position.set(0, 0.58, -2.31);
    carGroup.add(grille);

    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const headlightL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.08), headlightMat);
    headlightL.position.set(-0.68, 0.65, -2.32);
    const headlightR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.08), headlightMat);
    headlightR.position.set(0.68, 0.65, -2.32);
    carGroup.add(headlightL, headlightR);

    // Spotlights
    const beamL = new THREE.SpotLight(0xfffaed, 4.5, 80, Math.PI / 6, 0.35, 1.2);
    beamL.position.set(-0.68, 0.65, -2.3);
    const beamTargetL = new THREE.Object3D();
    beamTargetL.position.set(-0.68, 0.2, -40);
    scene.add(beamTargetL);
    beamL.target = beamTargetL;
    carGroup.add(beamL);
    threeRefs.current.headlightLeft = beamL;

    const beamR = new THREE.SpotLight(0xfffaed, 4.5, 80, Math.PI / 6, 0.35, 1.2);
    beamR.position.set(0.68, 0.65, -2.3);
    const beamTargetR = new THREE.Object3D();
    beamTargetR.position.set(0.68, 0.2, -40);
    scene.add(beamTargetR);
    beamR.target = beamTargetR;
    carGroup.add(beamR);
    threeRefs.current.headlightRight = beamR;

    // Turn Signals
    const amberSignalMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
    const signalMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.08), amberSignalMat);
    signalMeshL.position.set(-0.85, 0.65, -2.31);
    const signalMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.08), amberSignalMat);
    signalMeshR.position.set(0.85, 0.65, -2.31);
    carGroup.add(signalMeshL, signalMeshR);
    threeRefs.current.turnSignalMeshL = signalMeshL;
    threeRefs.current.turnSignalMeshR = signalMeshR;

    const signalLightL = new THREE.PointLight(0xf59e0b, 0, 15);
    signalLightL.position.set(-1.0, 0.7, -2.2);
    carGroup.add(signalLightL);
    threeRefs.current.turnSignalLightL = signalLightL;

    const signalLightR = new THREE.PointLight(0xf59e0b, 0, 15);
    signalLightR.position.set(1.0, 0.7, -2.2);
    carGroup.add(signalLightR);
    threeRefs.current.turnSignalLightR = signalLightR;

    // Taillights & Reverse light
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xff1122 });
    const taillightBar = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.14, 0.08), taillightMat);
    taillightBar.position.set(0, 0.72, 2.31);
    carGroup.add(taillightBar);
    threeRefs.current.taillightMesh = taillightBar;

    const reverseLightMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
    const reverseLight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.09), reverseLightMat);
    reverseLight.position.set(0, 0.56, 2.32);
    carGroup.add(reverseLight);
    threeRefs.current.reverseLightMesh = reverseLight;

    // License Plate
    const plateCanvas = document.createElement('canvas');
    plateCanvas.width = 256;
    plateCanvas.height = 128;
    const pCtx = plateCanvas.getContext('2d')!;
    pCtx.fillStyle = '#ffffff';
    pCtx.fillRect(0, 0, 256, 128);
    pCtx.strokeStyle = '#1e293b';
    pCtx.lineWidth = 6;
    pCtx.strokeRect(4, 4, 248, 120);
    pCtx.fillStyle = '#0f172a';
    pCtx.font = 'bold 36px monospace';
    pCtx.textAlign = 'center';
    pCtx.fillText(isPolice ? 'أ ن س | 999' : 'ص ك ب | 442', 128, 55);
    pCtx.font = 'bold 24px sans-serif';
    pCtx.fillStyle = '#15803d';
    pCtx.fillText('السعودية KSA', 128, 100);
    const plateTex = new THREE.CanvasTexture(plateCanvas);
    const plateMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.35), new THREE.MeshBasicMaterial({ map: plateTex }));
    plateMesh.position.set(0, 0.42, 2.32);
    carGroup.add(plateMesh);

    // Police Lightbar if officer
    if (isPolice) {
      const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.25), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 }));
      barBase.position.set(0, 1.58, -0.15);
      carGroup.add(barBase);

      const strobeMeshBlue = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.15, 0.22), new THREE.MeshBasicMaterial({ color: 0x0066ff }));
      strobeMeshBlue.position.set(-0.32, 1.68, -0.15);
      carGroup.add(strobeMeshBlue);
      threeRefs.current.strobeMeshBlue = strobeMeshBlue;

      const strobeBlue = new THREE.PointLight(0x0077ff, 3.5, 25);
      strobeBlue.position.set(-0.32, 1.85, -0.15);
      carGroup.add(strobeBlue);
      threeRefs.current.strobeBlue = strobeBlue;

      const strobeMeshRed = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.15, 0.22), new THREE.MeshBasicMaterial({ color: 0xff1122 }));
      strobeMeshRed.position.set(0.32, 1.68, -0.15);
      carGroup.add(strobeMeshRed);
      threeRefs.current.strobeMeshRed = strobeMeshRed;

      const strobeRed = new THREE.PointLight(0xff1122, 3.5, 25);
      strobeRed.position.set(0.32, 1.85, -0.15);
      carGroup.add(strobeRed);
      threeRefs.current.strobeRed = strobeRed;
    }

    // PROPERLY PROPORTIONED WHEELS (Radius 0.29m, Width 0.20m at height 0.30m)
    // ("العجلات كبيره جدا" -> تم ضبط القياس الواقعي تماماً!)
    const frontWheels: THREE.Group[] = [];
    const rearWheels: THREE.Group[] = [];

    const wheelFL = createRealisticProportionedWheel();
    wheelFL.position.set(-0.90, 0.30, -1.35);
    carGroup.add(wheelFL);
    frontWheels.push(wheelFL);

    const wheelFR = createRealisticProportionedWheel();
    wheelFR.position.set(0.90, 0.30, -1.35);
    carGroup.add(wheelFR);
    frontWheels.push(wheelFR);

    const wheelRL = createRealisticProportionedWheel();
    wheelRL.position.set(-0.90, 0.30, 1.35);
    carGroup.add(wheelRL);
    rearWheels.push(wheelRL);

    const wheelRR = createRealisticProportionedWheel();
    wheelRR.position.set(0.90, 0.30, 1.35);
    carGroup.add(wheelRR);
    rearWheels.push(wheelRR);

    threeRefs.current.frontWheels = frontWheels;
    threeRefs.current.rearWheels = rearWheels;

    // ==========================================================
    // LUXURY LEXUS LC/LS COCKPIT INTERIOR
    // (مطابق تماماً لصورة الكوكتيل المرفقة IMG_f6d4cc00-bba4-4117-95e6-18a4785b86bc_f9036751.jpg)
    // ==========================================================
    const interiorGroup = new THREE.Group();

    // Materials matching reference photo:
    const burgundyMat = new THREE.MeshStandardMaterial({ color: 0x801336, roughness: 0.65 });
    const softBlackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.75 });
    const chromeTrimMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 });

    // Front Windshield Frame & A-Pillars (Framing view of outside road!)
    const aPillarL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), softBlackMat);
    aPillarL.position.set(-0.84, 1.35, -0.65);
    aPillarL.rotation.z = -0.32;
    aPillarL.rotation.x = -0.45;

    const aPillarR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), softBlackMat);
    aPillarR.position.set(0.84, 1.35, -0.65);
    aPillarR.rotation.z = 0.32;
    aPillarR.rotation.x = -0.45;

    const roofHeader = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.12, 0.2), softBlackMat);
    roofHeader.position.set(0, 1.62, -0.45);

    interiorGroup.add(aPillarL, aPillarR, roofHeader);

    // Rearview Mirror at top center
    const mirrorCase = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.11, 0.05), softBlackMat);
    mirrorCase.position.set(0, 1.54, -0.5);
    const mirrorGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.09), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.98, roughness: 0.05 }));
    mirrorGlass.position.set(0, 1.54, -0.47);
    interiorGroup.add(mirrorCase, mirrorGlass);

    // Dashboard Base: Burgundy leather lower shelf + black soft-touch top
    const dashBase = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.38, 0.6), burgundyMat);
    dashBase.position.set(0, 0.88, -0.65);

    const dashTop = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.12, 0.65), softBlackMat);
    dashTop.position.set(0, 1.08, -0.68);

    interiorGroup.add(dashBase, dashTop);

    // Digital Instrument Cluster with F-Sport Circular Ring
    const clusterCanvas = document.createElement('canvas');
    clusterCanvas.width = 512;
    clusterCanvas.height = 256;
    const clCtx = clusterCanvas.getContext('2d')!;
    clCtx.fillStyle = '#090d16';
    clCtx.fillRect(0, 0, 512, 256);
    // Silver instrument gauge ring
    clCtx.strokeStyle = '#e2e8f0';
    clCtx.lineWidth = 14;
    clCtx.beginPath();
    clCtx.arc(256, 128, 95, 0, Math.PI * 2);
    clCtx.stroke();
    // Inner RPM ticks
    clCtx.strokeStyle = '#38bdf8';
    clCtx.lineWidth = 6;
    clCtx.beginPath();
    clCtx.arc(256, 128, 80, Math.PI * 0.7, Math.PI * 1.8);
    clCtx.stroke();
    clCtx.fillStyle = '#ffffff';
    clCtx.font = 'bold 54px monospace';
    clCtx.textAlign = 'center';
    clCtx.fillText('120', 256, 140);
    clCtx.font = 'bold 22px sans-serif';
    clCtx.fillStyle = '#38bdf8';
    clCtx.fillText('KM/H  ·  D', 256, 175);
    const clusterTex = new THREE.CanvasTexture(clusterCanvas);
    const clusterMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.24), new THREE.MeshBasicMaterial({ map: clusterTex }));
    clusterMesh.position.set(-0.36, 1.12, -0.52);
    clusterMesh.rotation.x = -0.22;
    interiorGroup.add(clusterMesh);

    // Central Widescreen Navigation Display
    const navCanvas = document.createElement('canvas');
    navCanvas.width = 512;
    navCanvas.height = 256;
    const nCtx = navCanvas.getContext('2d')!;
    nCtx.fillStyle = '#0f172a';
    nCtx.fillRect(0, 0, 512, 256);
    nCtx.fillStyle = '#1e293b';
    nCtx.fillRect(8, 8, 496, 240);
    nCtx.strokeStyle = '#3b82f6';
    nCtx.lineWidth = 12;
    nCtx.beginPath();
    nCtx.moveTo(256, 240);
    nCtx.lineTo(256, 30);
    nCtx.stroke();
    nCtx.fillStyle = '#10b981';
    nCtx.font = 'bold 28px Arial';
    nCtx.textAlign = 'center';
    nCtx.fillText('📍 طريق الرياض - مكة السريع', 256, 55);
    nCtx.fillStyle = '#fbbf24';
    nCtx.font = 'bold 22px Arial';
    nCtx.fillText('نقطة تفتيش أمن الطرق بعد 300م', 256, 195);
    const navTex = new THREE.CanvasTexture(navCanvas);
    const navScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.28), new THREE.MeshBasicMaterial({ map: navTex }));
    navScreen.position.set(0.24, 1.10, -0.54);
    navScreen.rotation.x = -0.15;
    interiorGroup.add(navScreen);

    // Center Console Tunnel & Iconic Curved Passenger Grab Handle (Lexus LC signature!)
    const centerTunnel = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 1.1), softBlackMat);
    centerTunnel.position.set(0, 0.72, 0.1);

    // Curved handle on right of console
    const handleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.55, 12);
    const handleMesh = new THREE.Mesh(handleGeo, burgundyMat);
    handleMesh.position.set(0.25, 0.95, -0.1);
    handleMesh.rotation.x = 0.5;

    // Gear Shifter Lever
    const shifterBoot = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 12), softBlackMat);
    shifterBoot.position.set(-0.06, 0.94, -0.1);
    const shifterKnob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), chromeTrimMat);
    shifterKnob.position.set(-0.06, 1.02, -0.1);

    interiorGroup.add(centerTunnel, handleMesh, shifterBoot, shifterKnob);

    // Burgundy Leather Sports Bucket Seats with deep side bolsters
    const seatL = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.65, 0.52), burgundyMat);
    seatL.position.set(-0.38, 0.72, 0.35);
    const seatBackL = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.65, 0.14), burgundyMat);
    seatBackL.position.set(-0.38, 1.15, 0.55);
    seatBackL.rotation.x = 0.15;

    const seatR = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.65, 0.52), burgundyMat);
    seatR.position.set(0.38, 0.72, 0.35);
    const seatBackR = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.65, 0.14), burgundyMat);
    seatBackR.position.set(0.38, 1.15, 0.55);
    seatBackR.rotation.x = 0.15;

    // Left and Right Door Panels with Burgundy inserts
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 1.6), burgundyMat);
    doorL.position.set(-0.84, 0.95, 0.1);
    const doorR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 1.6), burgundyMat);
    doorR.position.set(0.84, 0.95, 0.1);

    interiorGroup.add(seatL, seatBackL, seatR, seatBackR, doorL, doorR);

    // 3D Animated Lexus Sports Steering Wheel
    const stWheelGroup = new THREE.Group();
    stWheelGroup.position.set(-0.36, 1.06, -0.36);
    stWheelGroup.rotation.x = -0.32;

    const stWheelRingGeo = new THREE.TorusGeometry(0.19, 0.024, 14, 28);
    const stWheelRing = new THREE.Mesh(stWheelRingGeo, softBlackMat);
    stWheelGroup.add(stWheelRing);

    // Center Lexus Emblem Horn Pad
    const stWheelCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.035, 16), softBlackMat);
    stWheelCenter.rotation.x = Math.PI / 2;
    const stLogo = new THREE.Mesh(new THREE.CircleGeometry(0.032, 16), chromeTrimMat);
    stLogo.position.set(0, 0, 0.022);
    stWheelGroup.add(stWheelCenter, stLogo);

    // Spokes
    const stSpokeL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.032, 0.02), softBlackMat);
    stSpokeL.position.set(-0.08, 0, 0);
    const stSpokeR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.032, 0.02), softBlackMat);
    stSpokeR.position.set(0.08, 0, 0);
    const stSpokeB = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.15, 0.02), softBlackMat);
    stSpokeB.position.set(0, -0.08, 0);
    stWheelGroup.add(stSpokeL, stSpokeR, stSpokeB);

    interiorGroup.add(stWheelGroup);
    threeRefs.current.cockpitSteeringWheel = stWheelGroup;

    carGroup.add(interiorGroup);
    threeRefs.current.carInteriorGroup = interiorGroup;

    // Place car in scene
    carGroup.position.set(pInit.x, 0, pInit.z);
    scene.add(carGroup);

    // Weather Particles
    const rainCount = isSoftwareGl ? 200 : 1000;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3] = (Math.random() - 0.5) * 80;
      rainPos[i * 3 + 1] = Math.random() * 40;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({ color: 0xaaccff, size: 0.25, transparent: true, opacity: 0.6 });
    const rainSystem = new THREE.Points(rainGeo, rainMat);
    rainSystem.visible = weather === 'rain';
    scene.add(rainSystem);
    threeRefs.current.rainSystem = rainSystem;

    const dustCount = isSoftwareGl ? 150 : 600;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 90;
      dustPos[i * 3 + 1] = Math.random() * 25;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xc89642, size: 0.4, transparent: true, opacity: 0.45 });
    const dustSystem = new THREE.Points(dustGeo, dustMat);
    dustSystem.visible = weather === 'dust';
    scene.add(dustSystem);
    threeRefs.current.dustSystem = dustSystem;

    // Resize handler
    const handleResize = () => {
      if (!mount || !renderer || !camera) return;
      const newW = mount.clientWidth;
      const newH = mount.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // ==========================================
    // 13. TICK / SIMULATION ANIMATION LOOP
    // ==========================================
    let lastTime = performance.now();
    let flasherTimer = 0;

    const tick = (now: number) => {
      if (threeRefs.current.isDisposed) return;

      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      const p = physicsRef.current;
      const input = inputRef.current;
      const s = stateRef.current;

      // 1. DRIVING VS ON-FOOT PHYSICS
      if (s.playerMode === 'driving') {
        // Vehicle Driving Mode
        const isReverseGear = p.gear === 'R';

        if (isReverseGear) {
          if (input.accelerate) {
            p.speed = Math.max(p.speed - p.reverseAccel * dt, p.maxReverseSpeed);
          } else if (input.brake) {
            p.speed = Math.min(p.speed + p.braking * dt, 0);
          } else if (input.handbrake) {
            p.speed *= Math.pow(0.85, dt * 60);
          } else {
            p.speed *= Math.pow(p.drag, dt * 60);
            if (Math.abs(p.speed) < 0.05) p.speed = 0;
          }
        } else {
          if (input.accelerate) {
            p.speed = Math.min(p.speed + p.acceleration * dt, p.maxForwardSpeed);
          } else if (input.brake) {
            if (p.speed <= 0.1 && input.brake) {
              p.speed = Math.max(p.speed - p.reverseAccel * dt, p.maxReverseSpeed);
            } else {
              p.speed = Math.max(p.speed - p.braking * dt, 0);
            }
          } else if (input.handbrake) {
            p.speed *= Math.pow(0.85, dt * 60);
          } else {
            p.speed *= Math.pow(p.drag, dt * 60);
            if (Math.abs(p.speed) < 0.05) p.speed = 0;
          }
        }

        p.z -= p.speed * dt;

        let targetSteer = 0;
        if (input.steerLeft) targetSteer -= 1;
        if (input.steerRight) targetSteer += 1;

        p.steerInput = THREE.MathUtils.damp(p.steerInput, targetSteer, 12, dt);

        if (Math.abs(p.speed) > 0.15) {
          const dirMult = p.speed >= 0 ? 1 : -1;
          p.x += p.steerInput * p.lateralSpeed * dt * dirMult;
        }

        p.heading = -p.steerInput * 0.12 * (p.speed >= 0 ? 1 : -0.7);
        setSteeringWheelAngle(Math.round(p.steerInput * 45));

        const maxRoadX = roadWidth / 2 - 1.8;
        if (p.x < -maxRoadX) p.x = -maxRoadX;
        if (p.x > maxRoadX) p.x = maxRoadX;

        // Loop highway
        if (p.z < -roadLength + 150) {
          p.z = 40;
          p.saherTriggered = false;
        }
        if (p.z > 80) {
          p.z = -roadLength + 200;
        }

        if (threeRefs.current.playerOfficerMesh) {
          threeRefs.current.playerOfficerMesh.visible = false;
        }
      } else {
        // ON-FOOT OFFICER MODE ("يستطيع العسكري ان يخرج من سيارته ويفتح بنفسه داخل اللعبة")
        p.speed = 0;
        const walkSpeed = 5.5;
        const turnSpeed = 2.8;

        if (input.turnLeft) p.officerHeading += turnSpeed * dt;
        if (input.turnRight) p.officerHeading -= turnSpeed * dt;

        let walkDir = 0;
        if (input.walkForward) walkDir += 1;
        if (input.walkBackward) walkDir -= 1;

        if (walkDir !== 0) {
          p.officerX -= Math.sin(p.officerHeading) * walkDir * walkSpeed * dt;
          p.officerZ -= Math.cos(p.officerHeading) * walkDir * walkSpeed * dt;
          p.officerWalking = true;
        } else {
          p.officerWalking = false;
        }

        // Update on-foot officer 3D model
        if (threeRefs.current.playerOfficerMesh) {
          threeRefs.current.playerOfficerMesh.visible = true;
          threeRefs.current.playerOfficerMesh.position.set(p.officerX, 0, p.officerZ);
          threeRefs.current.playerOfficerMesh.rotation.y = p.officerHeading;
        }

        // Check distance to suspect cars for in-game inspection
        let foundCarIdx: number | null = null;
        aiCarsList.forEach((ai, idx) => {
          if (ai.isStopped || Math.abs(ai.group.position.z - p.checkpointZ) < 30) {
            const dist = Math.hypot(p.officerX - ai.group.position.x, p.officerZ - ai.group.position.z);
            if (dist < 4.2) {
              foundCarIdx = idx;
            }
          }
        });
        setNearSuspectCarIndex(foundCarIdx);
      }

      // Update Hero Car Mesh
      if (carGroup) {
        carGroup.position.set(p.x, 0, p.z);
        carGroup.rotation.y = p.heading;

        const wheelRotSpeed = p.speed * 2.6 * dt;
        frontWheels.forEach((w) => {
          w.rotation.x += wheelRotSpeed;
          w.rotation.y = -p.steerInput * 0.45;
        });
        rearWheels.forEach((w) => {
          w.rotation.x += wheelRotSpeed;
        });

        if (threeRefs.current.cockpitSteeringWheel) {
          threeRefs.current.cockpitSteeringWheel.rotation.z = -p.steerInput * 1.35;
        }

        // Reverse white lights
        if (threeRefs.current.reverseLightMesh) {
          const isReversing = p.speed < -0.2 || (p.gear === 'R' && input.accelerate);
          (threeRefs.current.reverseLightMesh.material as THREE.MeshBasicMaterial).color.setHex(
            isReversing ? 0xffffff : 0x444444
          );
        }

        // CRITICAL FIX: Hide exterior roof and hull in cockpit mode to eliminate ANY clipping ("المنظور متداخل")!
        const isCockpit = s.cameraMode === 'cockpit' && s.playerMode === 'driving';
        if (threeRefs.current.carRoofMesh) {
          threeRefs.current.carRoofMesh.visible = !isCockpit;
        }
        if (threeRefs.current.carBodyMesh) {
          // Keep hull visible or slightly lower so hood remains visible looking forward
          threeRefs.current.carBodyMesh.visible = true;
        }
        if (threeRefs.current.strobeMeshBlue && threeRefs.current.strobeMeshRed) {
          threeRefs.current.strobeMeshBlue.visible = !isCockpit;
          threeRefs.current.strobeMeshRed.visible = !isCockpit;
        }
      }

      // 2. AI HIGHWAY TRAFFIC & CHECKPOINT QUEUING
      // ("اذا وقفت سيارة تجي تدخل في السيارة وتمشي بدون ما توقف.. التفتيش يجب كل سيارة تمشي ببطء وتقف")
      aiCarsList.forEach((ai, idx) => {
        // Approaching checkpoint: decelerate to inspection stop line
        const distToCheckpoint = ai.group.position.z - p.checkpointZ;

        if (distToCheckpoint > 0 && distToCheckpoint < 75) {
          // Slow down approaching checkpoint
          ai.speed = THREE.MathUtils.damp(ai.speed, 5, 4, dt);

          // Lead car stops at inspection point
          if (idx === 0 && !ai.isStopped) {
            if (distToCheckpoint < 12) {
              ai.speed = 0;
              ai.isStopped = true;
            }
          }
        }

        // Queue check: don't hit car ahead in same lane!
        aiCarsList.forEach((otherAi, otherIdx) => {
          if (idx !== otherIdx && Math.abs(ai.laneX - otherAi.laneX) < 1.5) {
            const zDiff = ai.group.position.z - otherAi.group.position.z;
            if (zDiff > 0 && zDiff < 9.5) {
              // Car ahead is too close, match speed or stop behind it!
              ai.speed = Math.min(ai.speed, otherAi.speed * 0.85);
              if (otherAi.speed < 1.0) {
                ai.speed = 0;
              }
            }
          }
        });

        // Don't hit player car if player is stopped in front of AI!
        if (Math.abs(ai.laneX - p.x) < 2.0) {
          const zDiffPlayer = ai.group.position.z - p.z;
          if (zDiffPlayer > 0 && zDiffPlayer < 10) {
            ai.speed = Math.min(ai.speed, Math.max(0, p.speed) * 0.9);
            if (p.speed <= 0.5) ai.speed = 0;
          }
        }

        if (!ai.isStopped) {
          ai.group.position.z -= ai.speed * dt;
        }

        // Recycle AI cars if they reach end of highway
        if (ai.group.position.z < -roadLength + 100) {
          ai.group.position.z = 60;
          ai.speed = ai.baseSpeed;
          ai.isStopped = false;
        }
      });

      // Update Emergency Strobe Flashers
      if (s.sirenOn && (s.selectedRole === 'officer' || s.selectedCarModel === 'police_dodge' || s.selectedCarModel === 'police_fj')) {
        flasherTimer += dt * 8;
        const isBlueTurn = Math.floor(flasherTimer) % 2 === 0;

        if (threeRefs.current.strobeBlue && threeRefs.current.strobeRed) {
          threeRefs.current.strobeBlue.intensity = isBlueTurn ? 5.0 : 0;
          threeRefs.current.strobeRed.intensity = isBlueTurn ? 0 : 5.0;
        }
        if (threeRefs.current.strobeMeshBlue && threeRefs.current.strobeMeshRed) {
          (threeRefs.current.strobeMeshBlue.material as THREE.MeshBasicMaterial).color.setHex(
            isBlueTurn ? 0x66aaff : 0x002266
          );
          (threeRefs.current.strobeMeshRed.material as THREE.MeshBasicMaterial).color.setHex(
            isBlueTurn ? 0x440000 : 0xff3344
          );
        }
      } else if (threeRefs.current.strobeBlue && threeRefs.current.strobeRed) {
        threeRefs.current.strobeBlue.intensity = 0;
        threeRefs.current.strobeRed.intensity = 0;
      }

      // Update Turn Signal Blinker
      p.signalBlinkTimer += dt;
      if (p.signalBlinkTimer > 0.35) {
        p.signalBlinkTimer = 0;
        p.signalBlinkOn = !p.signalBlinkOn;
      }

      const isBlinkingL = p.signalBlinkOn && (s.turnSignal === 'left' || s.turnSignal === 'hazard');
      const isBlinkingR = p.signalBlinkOn && (s.turnSignal === 'right' || s.turnSignal === 'hazard');

      if (threeRefs.current.turnSignalLightL && threeRefs.current.turnSignalMeshL) {
        threeRefs.current.turnSignalLightL.intensity = isBlinkingL ? 3.0 : 0;
        (threeRefs.current.turnSignalMeshL.material as THREE.MeshBasicMaterial).color.setHex(
          isBlinkingL ? 0xfbbf24 : 0x78350f
        );
      }
      if (threeRefs.current.turnSignalLightR && threeRefs.current.turnSignalMeshR) {
        threeRefs.current.turnSignalLightR.intensity = isBlinkingR ? 3.0 : 0;
        (threeRefs.current.turnSignalMeshR.material as THREE.MeshBasicMaterial).color.setHex(
          isBlinkingR ? 0xfbbf24 : 0x78350f
        );
      }

      // Sync Speedometer
      const curKmh = Math.round(Math.abs(p.speed) * 3.6);
      setSpeedKmh(curKmh);

      // Continuous Engine Sound & Road Noise
      if (s.soundEnabled && engineNodesRef.current.osc1 && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        const speedRatio = Math.min(Math.abs(p.speed) / p.maxForwardSpeed, 1.0);
        const baseFreq = 45 + speedRatio * 180 + (input.accelerate ? 30 : 0);
        engineNodesRef.current.osc1.frequency.setTargetAtTime(baseFreq, ctx.currentTime, 0.08);
        if (engineNodesRef.current.osc2) {
          engineNodesRef.current.osc2.frequency.setTargetAtTime(baseFreq * 2, ctx.currentTime, 0.08);
        }
        if (engineNodesRef.current.noiseGain) {
          engineNodesRef.current.noiseGain.gain.setTargetAtTime(speedRatio * 0.08, ctx.currentTime, 0.1);
        }
      }

      // SAHER SPEED CAMERA DETECTION (120 km/h)
      const distToSaher = Math.abs(p.z - p.saherZ);
      if (distToSaher < 18 && !p.saherTriggered) {
        if (curKmh > 120) {
          p.saherTriggered = true;
          setFlashOverlay(true);
          setTimeout(() => setFlashOverlay(false), 120);
          setTimeout(() => setFlashOverlay(true), 240);
          setTimeout(() => setFlashOverlay(false), 380);

          if (threeRefs.current.saherFlashLight) {
            threeRefs.current.saherFlashLight.intensity = 15;
            setTimeout(() => {
              if (threeRefs.current.saherFlashLight) threeRefs.current.saherFlashLight.intensity = 0;
            }, 300);
          }

          playSound('saher');
          const newScore = Math.max(0, s.score - 100);
          onUpdateScore(newScore);
          setSaherAlert(`📸 رصد ساهر: تم تصويرك بسرعة ${curKmh} كم/س! خصم 100 نقطة`);
          setTimeout(() => setSaherAlert(null), 4500);
        }
      }

      // Proximity checks
      setCheckpointProximity(Math.abs(p.z - p.checkpointZ) < 35 && Math.abs(p.x) < 8);
      setHospitalProximity(Math.abs(p.z - p.hospitalZ) < 40);
      setStationProximity(Math.abs(p.z - p.stationZ) < 45);

      // ========================================================
      // 3. CAMERA MODES: PRISTINE COCKPIT & THIRD PERSON
      // ========================================================
      if (camera && carGroup) {
        if (s.playerMode === 'on_foot') {
          // Follow on-foot officer in 3D!
          const distBack = 3.8;
          const heightUp = 1.9;
          const targetCamX = p.officerX - Math.sin(p.officerHeading) * distBack;
          const targetCamZ = p.officerZ + Math.cos(p.officerHeading) * distBack;

          camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 10, dt);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, heightUp, 10, dt);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 10, dt);

          _tempVec3.set(p.officerX, 1.4, p.officerZ);
          camera.lookAt(_tempVec3);
        } else if (s.cameraMode === 'third') {
          // CHASE CAM: Clean view of vehicle and road
          const distBack = 6.2;
          const heightUp = 2.15;
          const targetCamX = p.x - Math.sin(p.heading) * distBack;
          const targetCamZ = p.z + Math.cos(p.heading) * distBack;

          camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 10, dt);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, heightUp, 10, dt);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 10, dt);

          _tempVec3.set(p.x, 0.9, p.z - 12);
          camera.lookAt(_tempVec3);
        } else if (s.cameraMode === 'cockpit') {
          // PRISTINE LEXUS COCKPIT VIEW (مطابق تماماً للصورة IMG_f6d4cc00... بدون أي تداخل أو قص هندسي!)
          // Positioned at driver eye level looking forward through the clear windshield
          const camEyeX = p.x - 0.36;
          const camEyeY = 1.26;
          const camEyeZ = p.z - 0.12;

          camera.position.set(camEyeX, camEyeY, camEyeZ);
          _tempVec3.set(
            camEyeX - Math.sin(p.heading) * 16,
            1.15,
            camEyeZ - Math.cos(p.heading) * 16
          );
          camera.lookAt(_tempVec3);
        }
      }

      renderer.render(scene, camera);
      threeRefs.current.frameId = requestAnimationFrame(tick);
    };

    threeRefs.current.frameId = requestAnimationFrame(tick);

    return () => {
      threeRefs.current.isDisposed = true;
      cancelAnimationFrame(threeRefs.current.frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.clear();
      if (mount) mount.innerHTML = '';
      if (engineNodesRef.current.osc1) {
        try {
          engineNodesRef.current.osc1.stop();
          engineNodesRef.current.osc2?.stop();
        } catch {}
      }
    };
  }, []);

  // Fullscreen Landscape Toggle
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-slate-950 rounded-3xl border-2 border-indigo-900 shadow-2xl select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'aspect-[16/9] min-h-[440px]'
      }`}
    >
      {/* 3D WebGL Canvas */}
      <div 
        ref={canvasMountRef} 
        onClick={initAudioEngine}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" 
      />

      {/* Portrait Mode Warning Overlay */}
      {isPortraitWarning && !isFullscreen && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white">
          <RotateCw className="w-12 h-12 text-amber-400 animate-spin mb-3" />
          <h3 className="text-base font-black mb-1">الرجاء تدوير الجهاز إلى الوضع الأفقي (Landscape)</h3>
          <p className="text-xs text-slate-300 max-w-sm mb-4">
            اللعبة مصممة لتعمل بالعرض الكامل لمحاكاة طرق وسيارات المملكة ثلاثية الأبعاد بوضوح.
          </p>
          <button
            onClick={handleToggleFullscreen}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            <span>تشغيل بالعرض (ملء الشاشة)</span>
          </button>
        </div>
      )}

      {/* Saher Screen Flash Overlay */}
      {flashOverlay && (
        <div className="absolute inset-0 bg-white pointer-events-none z-40 animate-out fade-out duration-200" />
      )}

      {/* Saher Alert Notification Banner */}
      {saherAlert && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-rose-950/95 text-rose-100 border-2 border-rose-500 px-6 py-2 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-black animate-in slide-in-from-top-4">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
          <span>{saherAlert}</span>
        </div>
      )}

      {/* Compliance Reward Notification Banner */}
      {complianceMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-emerald-950/95 text-emerald-100 border-2 border-emerald-400 px-6 py-2 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-black animate-in slide-in-from-top-4">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{complianceMessage}</span>
        </div>
      )}

      {/* TOP HUD BAR - Sleek, Unclipped & Accessible */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {/* Speedometer & Gear Display */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-slate-950/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-1.5 rounded-2xl shadow-lg flex items-center gap-3 text-white">
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-400 leading-none">
                {speedKmh}
              </div>
              <div className="text-[9px] text-slate-400 font-bold">كم / س</div>
            </div>
            <div className="h-7 w-px bg-slate-700" />
            <div className="flex items-center gap-1 font-mono font-black text-xs sm:text-sm">
              <button
                onClick={() => {
                  setGear('D');
                  playSound('gear');
                }}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                  gear === 'D' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-white'
                }`}
              >
                D
              </button>
              <button
                onClick={() => {
                  setGear('R');
                  playSound('gear');
                }}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                  gear === 'R' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-white'
                }`}
              >
                R
              </button>
            </div>
          </div>

          {/* Mode Badge: Driving vs On-Foot */}
          <div className="bg-slate-950/80 border border-indigo-500/40 px-3 py-1.5 rounded-2xl text-xs font-bold text-indigo-300 flex items-center gap-1.5 shadow-md">
            <span>{playerMode === 'driving' ? '🚘 قيادة المركبة' : '👮 ترجل على الأقدام'}</span>
          </div>
        </div>

        {/* Right Controls: Points, Camera, Exit Car, Audio, Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Points */}
          <div className="bg-slate-950/90 backdrop-blur-md border border-amber-500/40 px-3 py-1.5 rounded-2xl shadow-lg flex items-center gap-1.5 text-white">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-black text-amber-400">{score}</span>
          </div>

          {/* Exit / Enter Car Button ("يستطيع العسكري ان يخرج من سيارته") */}
          <button
            onClick={togglePlayerMode}
            className={`px-3 py-1.5 rounded-2xl border text-xs font-black transition-all shadow-lg flex items-center gap-1.5 cursor-pointer ${
              playerMode === 'on_foot'
                ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/50'
                : 'bg-slate-900/90 text-amber-300 border-amber-500/40 hover:bg-slate-800'
            }`}
            title="النزول / الركوب من السيارة (E)"
          >
            <span>{playerMode === 'on_foot' ? '🚔 ركوب الدورية' : '🚶‍♂️ نزول تفتيش'}</span>
          </button>

          {/* Camera View Switcher */}
          {playerMode === 'driving' && (
            <button
              onClick={() => setCameraMode((prev) => (prev === 'third' ? 'cockpit' : 'third'))}
              className={`px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer ${
                cameraMode === 'cockpit'
                  ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400/40 font-black'
                  : 'bg-slate-950/90 text-slate-200 border-slate-700 hover:bg-slate-800'
              }`}
              title="تبديل المنظور: قمرة القيادة لكزس / منظور خارجي (C)"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {cameraMode === 'cockpit' ? 'داخل المقصورة' : 'منظور خارجي'}
              </span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => {
              initAudioEngine();
              setSoundEnabled((prev) => !prev);
            }}
            className="p-2 bg-slate-950/90 hover:bg-slate-800 text-slate-200 rounded-2xl border border-slate-700 transition-colors shadow-lg cursor-pointer"
            title="تشغيل / كتم الصوت"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 bg-slate-950/90 hover:bg-slate-800 text-slate-200 rounded-2xl border border-slate-700 transition-colors shadow-lg cursor-pointer"
            title="ملء الشاشة"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* IN-GAME DIRECT CHECKPOINT INSPECTION PROMPT BANNER */}
      {/* ("التفتيش يكون داخل اللعبة وليس اخرج.. اقدر أوقف الشخص أو السيارة في نفس اللعبة بدون ما أخرج") */}
      {playerMode === 'on_foot' && nearSuspectCarIndex !== null && !activeInGameInspectionCar && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 animate-in zoom-in-95">
          <button
            onClick={() => {
              const carData = inGameSuspectsList[nearSuspectCarIndex] || inGameSuspectsList[0];
              setActiveInGameInspectionCar(carData);
              playSound('click');
            }}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-2xl border-2 border-white flex items-center gap-2.5 hover:scale-105 transition-transform cursor-pointer"
          >
            <Search className="w-5 h-5 text-slate-950" />
            <span>🔍 فحص المركبة وطلب أوراق السائق (تفتيش داخل المحاكاة)</span>
          </button>
        </div>
      )}

      {/* FULL IN-GAME 3D INSPECTION CARD MODAL OVERLAY */}
      {activeInGameInspectionCar && (
        <div className="absolute inset-0 z-40 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in zoom-in-95">
          <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl max-w-lg w-full text-white shadow-2xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/40">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">نقطة الضبط الأمني - محضر التفتيش الميداني</h3>
                  <p className="text-[10px] text-slate-400">إجراءات التحقق من المركبة والسائق مباشرة داخل المحاكاة</p>
                </div>
              </div>
              <button
                onClick={() => setActiveInGameInspectionCar(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs: Driver Card vs Trunk Inspection */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => setInspectionTab('id')}
                className={`py-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  inspectionTab === 'id' ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>بيانات وهوية السائق</span>
              </button>
              <button
                onClick={() => setInspectionTab('trunk')}
                className={`py-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  inspectionTab === 'trunk' ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>تفتيش شنطة السيارة ({activeInGameInspectionCar.trunkItems.length})</span>
              </button>
            </div>

            {/* Tab 1: Driver & Vehicle ID Details */}
            {inspectionTab === 'id' && (
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">اسم السائق:</span>
                  <span className="font-black text-white">{activeInGameInspectionCar.driverName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">رقم الهوية الوطنية:</span>
                  <span className="font-mono font-bold text-amber-300">{activeInGameInspectionCar.nationalId}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">طراز المركبة ولونها:</span>
                  <span className="font-bold text-white">{activeInGameInspectionCar.model} ({activeInGameInspectionCar.color})</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">رقم اللوحة:</span>
                  <span className="font-mono font-bold bg-slate-900 px-2 py-0.5 rounded text-amber-300 border border-slate-700">
                    {activeInGameInspectionCar.plateNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">حالة رخصة القيادة:</span>
                  <span className={`font-black px-2 py-0.5 rounded text-[11px] ${
                    activeInGameInspectionCar.licenseStatus === 'سارية'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                  }`}>
                    {activeInGameInspectionCar.licenseStatus}
                  </span>
                </div>
              </div>
            )}

            {/* Tab 2: Trunk Inspection */}
            {inspectionTab === 'trunk' && (
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs max-h-48 overflow-y-auto">
                <div className="text-[11px] text-amber-300 font-bold mb-1">
                  محتويات شنطة السيارة التي تم العثور عليها أثناء التفتيش:
                </div>
                {activeInGameInspectionCar.trunkItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      item.isIllegal
                        ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.isIllegal ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold">{item.name} (عدد: {item.count})</div>
                        <div className="text-[10px] text-slate-400">
                          {item.isIllegal ? '⚠️ مادة غير نظامية مخالفة للأنظمة!' : 'محتوى شخصي نظامي'}
                        </div>
                      </div>
                    </div>
                    {item.isIllegal && item.count > 0 && (
                      <button
                        onClick={() => handleConfiscateTrunkItem(item.name)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                      >
                        مصادرة المادة
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons: Clear vs Ticket */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleTicketCurrentCar}
                className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-600 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer"
              >
                تسجيل مخالفة مرورية
              </button>
              <button
                onClick={handleClearCurrentCar}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer"
              >
                السماح بالمرور (+20 نقطة) 🌟
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BOTTOM CONTROLS CONSOLE - CLEAN, RESPONSIVE, ZERO CLIPPING
          ("ادوات التحكم تظهر كاملا بدون نص تطلع ونص ماتطلع")
         ======================================================== */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex items-end justify-between pointer-events-none">
        {playerMode === 'driving' ? (
          <>
            {/* Left: Pedals */}
            <div className="flex items-center gap-2.5 pointer-events-auto">
              {/* Brake / Reverse Pedal */}
              <button
                onPointerDown={() => {
                  initAudioEngine();
                  inputRef.current.brake = true;
                }}
                onPointerUp={() => (inputRef.current.brake = false)}
                onPointerLeave={() => (inputRef.current.brake = false)}
                className="w-14 h-18 sm:w-16 sm:h-20 rounded-2xl bg-gradient-to-b from-slate-800 to-rose-950 active:from-rose-700 active:to-rose-900 border-2 border-rose-500 text-white font-black text-xs flex flex-col items-center justify-center backdrop-blur-md shadow-2xl transition-all select-none cursor-pointer group"
              >
                <div className="w-8 h-1 bg-rose-400/50 mb-1 rounded-full group-active:bg-white" />
                <span className="text-[10px] font-mono font-bold tracking-wider">BRAKE</span>
                <span className="text-[10px] font-black text-rose-300">
                  {gear === 'R' ? 'فرامل ريوس' : 'فرامل'}
                </span>
              </button>

              {/* Gas Pedal */}
              <button
                onPointerDown={() => {
                  initAudioEngine();
                  inputRef.current.accelerate = true;
                }}
                onPointerUp={() => (inputRef.current.accelerate = false)}
                onPointerLeave={() => (inputRef.current.accelerate = false)}
                className="w-16 h-22 sm:w-18 sm:h-24 rounded-2xl bg-gradient-to-b from-slate-800 to-emerald-950 active:from-emerald-600 active:to-emerald-800 border-2 border-emerald-400 text-white font-black text-xs flex flex-col items-center justify-center backdrop-blur-md shadow-2xl transition-all select-none cursor-pointer group"
              >
                <div className="w-10 h-1 bg-emerald-400/50 mb-1 rounded-full group-active:bg-white" />
                <div className="w-10 h-1 bg-emerald-400/50 mb-1 rounded-full group-active:bg-white" />
                <span className="text-[10px] font-mono font-bold tracking-wider">GAS</span>
                <span className="text-xs font-black text-emerald-300">
                  {gear === 'R' ? 'ريوس وراء' : 'بنزين قدام'}
                </span>
              </button>
            </div>

            {/* Center: Tools Console */}
            <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-2xl flex items-center gap-2 shadow-2xl">
              {/* Gear Quick Toggle */}
              <button
                onClick={() => {
                  initAudioEngine();
                  setGear((prev) => (prev === 'D' ? 'R' : 'D'));
                  playSound('gear');
                }}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-black transition-all cursor-pointer ${
                  gear === 'R' ? 'bg-rose-600 text-white border-rose-400' : 'bg-emerald-600 text-white border-emerald-400'
                }`}
                title="تبديل القير (D قدام / R ريوس)"
              >
                <span>{gear === 'R' ? 'ريوس (R)' : 'قدام (D)'}</span>
              </button>

              <div className="h-5 w-px bg-slate-700" />

              {/* Left Turn Signal */}
              <button
                onClick={() => {
                  initAudioEngine();
                  setTurnSignal((prev) => (prev === 'left' ? 'none' : 'left'));
                  playSound('click');
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  turnSignal === 'left'
                    ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
                title="إشارة يسار"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Hazard Flasher */}
              <button
                onClick={() => {
                  initAudioEngine();
                  setTurnSignal((prev) => (prev === 'hazard' ? 'none' : 'hazard'));
                  playSound('click');
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  turnSignal === 'hazard'
                    ? 'bg-red-600 text-white border-red-400 animate-pulse'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
                title="فليشر رباعي"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>

              {/* Right Turn Signal */}
              <button
                onClick={() => {
                  initAudioEngine();
                  setTurnSignal((prev) => (prev === 'right' ? 'none' : 'right'));
                  playSound('click');
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  turnSignal === 'right'
                    ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
                title="إشارة يمين"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="h-5 w-px bg-slate-700" />

              {/* Headlights Switch */}
              <button
                onClick={() => {
                  initAudioEngine();
                  setHeadlightLevel((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
                }}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                  headlightLevel === 2
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                    : headlightLevel === 1
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
                title="الكشافات (L)"
              >
                <span>💡 {headlightLevel === 2 ? 'عالي' : headlightLevel === 1 ? 'واطي' : 'مطفأ'}</span>
              </button>

              {/* Horn Button */}
              <button
                onClick={() => {
                  initAudioEngine();
                  playSound('horn');
                }}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 cursor-pointer active:scale-95"
                title="بوري / هرن (H)"
              >
                <Radio className="w-4 h-4" />
              </button>

              {/* Siren Button */}
              {(selectedRole === 'officer' || selectedCarModel === 'police_dodge' || selectedCarModel === 'police_fj') && (
                <button
                  onClick={() => {
                    initAudioEngine();
                    setSirenOn((prev) => !prev);
                  }}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    sirenOn ? 'bg-red-600 text-white border-red-400 animate-pulse' : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                  title="سارينة أمن الطرق (F)"
                >
                  <Siren className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Right: Steering Touch Buttons & Wheel */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onPointerDown={() => {
                  initAudioEngine();
                  inputRef.current.steerLeft = true;
                }}
                onPointerUp={() => (inputRef.current.steerLeft = false)}
                onPointerLeave={() => (inputRef.current.steerLeft = false)}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-900/90 active:bg-blue-600 border border-slate-700 text-white font-black flex items-center justify-center shadow-lg transition-all cursor-pointer"
                title="انعطاف يسار"
              >
                ◀
              </button>

              {/* Visual Steering Wheel */}
              <div
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl flex items-center justify-center transition-transform duration-75 select-none"
                style={{ transform: `rotate(${steeringWheelAngle}deg)` }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-slate-700 flex items-center justify-center">
                  <div className="absolute w-full h-1.5 bg-slate-800" />
                  <div className="absolute h-full w-1.5 bg-slate-800" />
                  <div
                    onClick={() => {
                      initAudioEngine();
                      playSound('horn');
                    }}
                    className="w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center shadow-inner cursor-pointer active:scale-90"
                  >
                    <span className="text-[9px]">📯</span>
                  </div>
                </div>
              </div>

              <button
                onPointerDown={() => {
                  initAudioEngine();
                  inputRef.current.steerRight = true;
                }}
                onPointerUp={() => (inputRef.current.steerRight = false)}
                onPointerLeave={() => (inputRef.current.steerRight = false)}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-900/90 active:bg-blue-600 border border-slate-700 text-white font-black flex items-center justify-center shadow-lg transition-all cursor-pointer"
                title="انعطاف يمين"
              >
                ▶
              </button>
            </div>
          </>
        ) : (
          /* ON-FOOT WALKING CONTROLS - Officer walking outside vehicle */
          <div className="w-full flex items-center justify-between pointer-events-auto">
            {/* Walk Forward / Backward */}
            <div className="flex items-center gap-2">
              <button
                onPointerDown={() => (inputRef.current.walkForward = true)}
                onPointerUp={() => (inputRef.current.walkForward = false)}
                onPointerLeave={() => (inputRef.current.walkForward = false)}
                className="w-14 h-14 rounded-2xl bg-blue-600 active:bg-blue-500 text-white font-black text-sm border-2 border-blue-400 flex flex-col items-center justify-center shadow-2xl cursor-pointer"
              >
                <span>▲</span>
                <span className="text-[9px]">للأمام</span>
              </button>
              <button
                onPointerDown={() => (inputRef.current.walkBackward = true)}
                onPointerUp={() => (inputRef.current.walkBackward = false)}
                onPointerLeave={() => (inputRef.current.walkBackward = false)}
                className="w-14 h-14 rounded-2xl bg-slate-800 active:bg-slate-700 text-white font-black text-sm border border-slate-600 flex flex-col items-center justify-center shadow-2xl cursor-pointer"
              >
                <span>▼</span>
                <span className="text-[9px]">للخلف</span>
              </button>
            </div>

            {/* Center: Action prompt to inspect or return to car */}
            <div className="flex items-center gap-3">
              {nearSuspectCarIndex !== null && (
                <button
                  onClick={() => {
                    const carData = inGameSuspectsList[nearSuspectCarIndex] || inGameSuspectsList[0];
                    setActiveInGameInspectionCar(carData);
                    playSound('click');
                  }}
                  className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl border-2 border-white shadow-2xl flex items-center gap-2 cursor-pointer animate-bounce"
                >
                  <Search className="w-4 h-4" />
                  <span>تفتيش السيارة والشخص 🔍</span>
                </button>
              )}

              <button
                onClick={togglePlayerMode}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm rounded-2xl border-2 border-indigo-400 shadow-2xl flex items-center gap-2 cursor-pointer"
              >
                <span>🚔 ركوب الدورية ومتابعة السير</span>
              </button>
            </div>

            {/* Turn Left / Right on foot */}
            <div className="flex items-center gap-2">
              <button
                onPointerDown={() => (inputRef.current.turnLeft = true)}
                onPointerUp={() => (inputRef.current.turnLeft = false)}
                onPointerLeave={() => (inputRef.current.turnLeft = false)}
                className="w-14 h-14 rounded-2xl bg-slate-800 active:bg-slate-700 text-white font-black text-sm border border-slate-600 flex flex-col items-center justify-center shadow-2xl cursor-pointer"
              >
                <span>◀</span>
                <span className="text-[9px]">يسار</span>
              </button>
              <button
                onPointerDown={() => (inputRef.current.turnRight = true)}
                onPointerUp={() => (inputRef.current.turnRight = false)}
                onPointerLeave={() => (inputRef.current.turnRight = false)}
                className="w-14 h-14 rounded-2xl bg-slate-800 active:bg-slate-700 text-white font-black text-sm border border-slate-600 flex flex-col items-center justify-center shadow-2xl cursor-pointer"
              >
                <span>▶</span>
                <span className="text-[9px]">يمين</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
