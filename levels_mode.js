// Archivo para la lógica específica del Modo Niveles
console.log("levels_mode.js cargado");

// --- SISTEMA DE DETECCIÓN DE RENDIMIENTO DEL DISPOSITIVO ---
class DevicePerformanceDetector {
    constructor() {
        this.performanceLevel = 'medium'; // 'low', 'medium', 'high'
        this.metrics = {
            cores: navigator.hardwareConcurrency || 2,
            memory: navigator.deviceMemory || 2,
            connection: this.getConnectionSpeed(),
            gpu: null,
            frameRate: 60,
            renderTime: 0,
            batteryLevel: null,
            thermalState: 'nominal'
        };
        this.benchmarkResults = {
            canvasPerformance: 0,
            animationPerformance: 0,
            memoryUsage: 0,
            overallScore: 0
        };
        this.adaptiveSettings = this.getDefaultSettings();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        
        console.log("🔍 Iniciando detección de rendimiento del dispositivo...");
        
        // Detectar métricas básicas del dispositivo
        await this.detectDeviceSpecs();
        
        // Ejecutar benchmarks de rendimiento
        await this.runPerformanceBenchmarks();
        
        // Calcular nivel de rendimiento
        this.calculatePerformanceLevel();
        
        // Configurar ajustes adaptativos
        this.configureAdaptiveSettings();
        
        // Monitorear rendimiento en tiempo real
        this.startPerformanceMonitoring();
        
        this.isInitialized = true;
        console.log(`📱 Dispositivo clasificado como: ${this.performanceLevel.toUpperCase()}`);
        console.log("⚙️ Configuraciones adaptativas aplicadas:", this.adaptiveSettings);
    }

    async detectDeviceSpecs() {
        // Detectar número de núcleos de CPU
        this.metrics.cores = navigator.hardwareConcurrency || 2;
        
        // Detectar memoria RAM disponible
        this.metrics.memory = navigator.deviceMemory || 2;
        
        // Detectar velocidad de conexión
        this.metrics.connection = this.getConnectionSpeed();
        
        // Detectar información de GPU si está disponible
        await this.detectGPUInfo();
        
        // Detectar estado de batería
        await this.detectBatteryInfo();
        
        // Detectar estado térmico (si está disponible)
        this.detectThermalState();
    }

    getConnectionSpeed() {
        if (navigator.connection) {
            const connection = navigator.connection;
            const effectiveType = connection.effectiveType;
            
            switch (effectiveType) {
                case 'slow-2g': return 1;
                case '2g': return 2;
                case '3g': return 3;
                case '4g': return 4;
                default: return 3;
            }
        }
        return 3; // Valor por defecto
    }

    async detectGPUInfo() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    this.metrics.gpu = renderer;
                    
                    // Clasificar GPU basado en el renderer
                    if (renderer.includes('Adreno 6') || renderer.includes('Mali-G7') || 
                        renderer.includes('Apple A1') || renderer.includes('PowerVR')) {
                        this.metrics.gpuTier = 'high';
                    } else if (renderer.includes('Adreno 5') || renderer.includes('Mali-G5')) {
                        this.metrics.gpuTier = 'medium';
                    } else {
                        this.metrics.gpuTier = 'low';
                    }
                }
            }
        } catch (error) {
            console.warn("No se pudo detectar información de GPU:", error);
            this.metrics.gpuTier = 'medium';
        }
    }

    async detectBatteryInfo() {
        try {
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery();
                this.metrics.batteryLevel = battery.level;
                
                // Monitorear cambios en la batería
                battery.addEventListener('levelchange', () => {
                    this.metrics.batteryLevel = battery.level;
                    this.adjustForBatteryLevel();
                });
            }
        } catch (error) {
            console.warn("No se pudo acceder a la información de batería:", error);
        }
    }

    detectThermalState() {
        // Detectar estado térmico si está disponible (experimental)
        if ('thermal' in navigator) {
            navigator.thermal.addEventListener('change', (event) => {
                this.metrics.thermalState = event.state;
                this.adjustForThermalState();
            });
        }
    }

    async runPerformanceBenchmarks() {
        console.log("🧪 Ejecutando benchmarks de rendimiento...");
        
        // Benchmark de rendimiento de Canvas
        this.benchmarkResults.canvasPerformance = await this.benchmarkCanvasPerformance();
        
        // Benchmark de animaciones
        this.benchmarkResults.animationPerformance = await this.benchmarkAnimationPerformance();
        
        // Benchmark de uso de memoria
        this.benchmarkResults.memoryUsage = this.benchmarkMemoryUsage();
        
        // Calcular puntuación general
        this.calculateOverallScore();
    }

    async benchmarkCanvasPerformance() {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');
            
            const startTime = performance.now();
            let frames = 0;
            const maxFrames = 60;
            
            const testRender = () => {
                // Simular renderizado complejo
                ctx.clearRect(0, 0, 300, 300);
                
                for (let i = 0; i < 50; i++) {
                    ctx.fillStyle = `hsl(${i * 7}, 70%, 50%)`;
                    ctx.fillRect(Math.random() * 300, Math.random() * 300, 20, 20);
                    
                    ctx.strokeStyle = `hsl(${i * 5}, 60%, 40%)`;
                    ctx.beginPath();
                    ctx.arc(Math.random() * 300, Math.random() * 300, 10, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                frames++;
                if (frames < maxFrames) {
                    requestAnimationFrame(testRender);
                } else {
                    const endTime = performance.now();
                    const avgFrameTime = (endTime - startTime) / frames;
                    const score = Math.max(0, 100 - avgFrameTime);
                    resolve(score);
                }
            };
            
            testRender();
        });
    }

    async benchmarkAnimationPerformance() {
        return new Promise((resolve) => {
            const startTime = performance.now();
            let animationFrames = 0;
            const maxAnimations = 30;
            
            const testAnimation = () => {
                // Simular cálculos de animación complejos
                const particles = [];
                for (let i = 0; i < 100; i++) {
                    particles.push({
                        x: Math.random() * 1000,
                        y: Math.random() * 1000,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10
                    });
                }
                
                // Simular actualización de partículas
                particles.forEach(particle => {
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    particle.vx *= 0.99;
                    particle.vy *= 0.99;
                });
                
                animationFrames++;
                if (animationFrames < maxAnimations) {
                    requestAnimationFrame(testAnimation);
                } else {
                    const endTime = performance.now();
                    const avgAnimationTime = (endTime - startTime) / animationFrames;
                    const score = Math.max(0, 100 - avgAnimationTime * 2);
                    resolve(score);
                }
            };
            
            testAnimation();
        });
    }

    benchmarkMemoryUsage() {
        if (performance.memory) {
            const used = performance.memory.usedJSHeapSize;
            const total = performance.memory.totalJSHeapSize;
            const limit = performance.memory.jsHeapSizeLimit;
            
            const usageRatio = used / limit;
            return Math.max(0, 100 - (usageRatio * 100));
        }
        return 70; // Valor por defecto si no hay información de memoria
    }

    calculateOverallScore() {
        const weights = {
            canvas: 0.3,
            animation: 0.3,
            memory: 0.2,
            specs: 0.2
        };
        
        // Calcular puntuación de especificaciones
        const specsScore = (
            (this.metrics.cores / 8) * 25 +
            (this.metrics.memory / 8) * 25 +
            (this.metrics.connection / 4) * 25 +
            (this.metrics.gpuTier === 'high' ? 25 : this.metrics.gpuTier === 'medium' ? 15 : 5)
        );
        
        this.benchmarkResults.overallScore = 
            this.benchmarkResults.canvasPerformance * weights.canvas +
            this.benchmarkResults.animationPerformance * weights.animation +
            this.benchmarkResults.memoryUsage * weights.memory +
            specsScore * weights.specs;
    }

    calculatePerformanceLevel() {
        const score = this.benchmarkResults.overallScore;
        
        if (score >= 75) {
            this.performanceLevel = 'high';
        } else if (score >= 45) {
            this.performanceLevel = 'medium';
        } else {
            this.performanceLevel = 'low';
        }
        
        // Ajustar basado en métricas específicas
        if (this.metrics.cores <= 2 && this.metrics.memory <= 2) {
            this.performanceLevel = 'low';
        }
        
        if (this.metrics.batteryLevel && this.metrics.batteryLevel < 0.2) {
            // Reducir nivel si la batería está baja
            if (this.performanceLevel === 'high') this.performanceLevel = 'medium';
            else if (this.performanceLevel === 'medium') this.performanceLevel = 'low';
        }
    }

    getDefaultSettings() {
        return {
            maxParticles: 100,
            animationQuality: 'high',
            effectsEnabled: true,
            shadowsEnabled: true,
            particlePhysics: true,
            complexAnimations: true,
            frameRateTarget: 60,
            canvasResolution: 1.0,
            audioQuality: 'high',
            preloadAssets: true
        };
    }

    configureAdaptiveSettings() {
        switch (this.performanceLevel) {
            case 'low':
                this.adaptiveSettings = {
                    maxParticles: 20,
                    animationQuality: 'low',
                    effectsEnabled: false,
                    shadowsEnabled: false,
                    particlePhysics: false,
                    complexAnimations: false,
                    frameRateTarget: 30,
                    canvasResolution: 0.7,
                    audioQuality: 'low',
                    preloadAssets: false,
                    // Configuraciones específicas del juego
                    cementAnimationEnabled: false,
                    lightningEffectsReduced: true,
                    portalEffectsSimplified: true,
                    ringEffectsMinimal: true
                };
                break;
                
            case 'medium':
                this.adaptiveSettings = {
                    maxParticles: 50,
                    animationQuality: 'medium',
                    effectsEnabled: true,
                    shadowsEnabled: true,
                    particlePhysics: true,
                    complexAnimations: false,
                    frameRateTarget: 45,
                    canvasResolution: 0.85,
                    audioQuality: 'medium',
                    preloadAssets: true,
                    // Configuraciones específicas del juego
                    cementAnimationEnabled: true,
                    lightningEffectsReduced: false,
                    portalEffectsSimplified: false,
                    ringEffectsMinimal: false
                };
                break;
                
            case 'high':
                this.adaptiveSettings = {
                    maxParticles: 150,
                    animationQuality: 'high',
                    effectsEnabled: true,
                    shadowsEnabled: true,
                    particlePhysics: true,
                    complexAnimations: true,
                    frameRateTarget: 60,
                    canvasResolution: 1.0,
                    audioQuality: 'high',
                    preloadAssets: true,
                    // Configuraciones específicas del juego
                    cementAnimationEnabled: true,
                    lightningEffectsReduced: false,
                    portalEffectsSimplified: false,
                    ringEffectsMinimal: false
                };
                break;
        }
    }

    startPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const monitor = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                this.metrics.frameRate = frameCount;
                frameCount = 0;
                lastTime = currentTime;
                
                // Ajustar configuraciones si el rendimiento baja
                this.adjustSettingsBasedOnFrameRate();
            }
            
            requestAnimationFrame(monitor);
        };
        
        monitor();
    }

    adjustSettingsBasedOnFrameRate() {
        if (this.metrics.frameRate < 20 && this.performanceLevel !== 'low') {
            console.warn("⚠️ Rendimiento bajo detectado, reduciendo calidad...");
            this.performanceLevel = 'low';
            this.configureAdaptiveSettings();
        } else if (this.metrics.frameRate > 55 && this.performanceLevel === 'low') {
            console.log("✅ Rendimiento mejorado, aumentando calidad...");
            this.performanceLevel = 'medium';
            this.configureAdaptiveSettings();
        }
    }

    adjustForBatteryLevel() {
        if (this.metrics.batteryLevel < 0.15) {
            // Modo de ahorro extremo de batería
            this.adaptiveSettings.maxParticles = Math.min(this.adaptiveSettings.maxParticles, 10);
            this.adaptiveSettings.effectsEnabled = false;
            this.adaptiveSettings.frameRateTarget = 20;
        } else if (this.metrics.batteryLevel < 0.3) {
            // Modo de ahorro de batería
            this.adaptiveSettings.maxParticles = Math.min(this.adaptiveSettings.maxParticles, 30);
            this.adaptiveSettings.frameRateTarget = 30;
        }
    }

    adjustForThermalState() {
        if (this.metrics.thermalState === 'critical') {
            // Reducir drásticamente la carga de procesamiento
            this.adaptiveSettings.maxParticles = 5;
            this.adaptiveSettings.effectsEnabled = false;
            this.adaptiveSettings.frameRateTarget = 15;
        } else if (this.metrics.thermalState === 'serious') {
            this.adaptiveSettings.maxParticles = Math.min(this.adaptiveSettings.maxParticles, 20);
            this.adaptiveSettings.frameRateTarget = 25;
        }
    }

    // Métodos públicos para obtener configuraciones
    getMaxParticles() {
        return this.adaptiveSettings.maxParticles;
    }

    shouldUseEffects() {
        return this.adaptiveSettings.effectsEnabled;
    }

    getAnimationQuality() {
        return this.adaptiveSettings.animationQuality;
    }

    getFrameRateTarget() {
        return this.adaptiveSettings.frameRateTarget;
    }

    getCanvasResolution() {
        return this.adaptiveSettings.canvasResolution;
    }

    // Métodos específicos para el juego
    shouldUseCementAnimation() {
        return this.adaptiveSettings.cementAnimationEnabled !== false;
    }

    shouldReduceLightningEffects() {
        return this.adaptiveSettings.lightningEffectsReduced === true;
    }

    shouldSimplifyPortalEffects() {
        return this.adaptiveSettings.portalEffectsSimplified === true;
    }

    shouldUseMinimalRingEffects() {
        return this.adaptiveSettings.ringEffectsMinimal === true;
    }

    // Método para obtener un reporte completo
    getPerformanceReport() {
        return {
            level: this.performanceLevel,
            metrics: this.metrics,
            benchmarks: this.benchmarkResults,
            settings: this.adaptiveSettings
        };
    }
}

// Instancia global del detector de rendimiento
const devicePerformance = new DevicePerformanceDetector();

// --- FIN SISTEMA DE DETECCIÓN DE RENDIMIENTO ---

// HTML y funciones para el Loader de Inicialización
function createInitializationLoader() {
    let loaderElement = document.getElementById('initializationLoader');
    if (!loaderElement) {
        loaderElement = document.createElement('div');
        loaderElement.id = 'initializationLoader';
        loaderElement.style.position = 'fixed';
        loaderElement.style.left = '0';
        loaderElement.style.top = '0';
        loaderElement.style.width = '100%';
        loaderElement.style.height = '100%';
        loaderElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        loaderElement.style.display = 'flex';
        loaderElement.style.justifyContent = 'center';
        loaderElement.style.alignItems = 'center';
        loaderElement.style.zIndex = '20000'; // Asegurar que esté por encima de todo
        loaderElement.style.color = 'white';
        loaderElement.style.fontSize = '24px';
        loaderElement.style.fontFamily = 'Arial, sans-serif';
        loaderElement.innerHTML = '<span>Cargando nivel... 🚀</span>'; // Puedes usar un spinner CSS o GIF aquí
        document.body.appendChild(loaderElement);
    }
    return loaderElement;
}

function showInitializationLoader(message = 'Analizando rendimiento del dispositivo...') {
    const loader = createInitializationLoader();
    loader.querySelector('span').textContent = message;
    loader.style.display = 'flex';
}

function hideInitializationLoader() {
    const loader = document.getElementById('initializationLoader');
    if (loader) {
        loader.style.display = 'none';
    }
}
// Fin HTML y funciones para el Loader

// Elementos del DOM para el Modal de Victoria de Nivel
const levelVictoryModalElement = document.getElementById('levelVictoryModal');
const levelVictoryTitleElement = document.getElementById('levelVictoryTitle');
const levelVictoryMessageElement = document.getElementById('levelVictoryMessage');
const levelVictoryStarsElement = document.getElementById('levelVictoryStars');
const levelVictoryScoreElement = document.getElementById('levelVictoryScore');
const nextLevelButtonElement = document.getElementById('nextLevelButton');
const levelVictoryBackToSelectionButtonElement = document.getElementById('levelVictoryBackToSelectionButton');

// --- NUEVOS Elementos DOM para Modal de Objetivo Inicial ---
const levelObjectiveStartModalElement = document.getElementById('levelObjectiveStartModal');
const objectiveStartTitleElement = document.getElementById('objectiveStartTitle');
const objectiveStartTextElement = document.getElementById('objectiveStartText');
const objectiveStartConfirmButtonElement = document.getElementById('objectiveStartConfirmButton');
// --- FIN NUEVOS Elementos DOM ---

// Estado específico del Modo Niveles
let currentSelectedLevelId = null;
let playerLevelData = {
    // Ejemplo: 1: { stars: 2 }, 2: { stars: 0 }
};
let movesRemaining = 0; // Nueva variable para el contador de movimientos
let frozenPiecesData = []; // Para rastrear el estado de las piezas congeladas activas
let levelInitializationContinuation = null; // Para la continuación después del modal de objetivo
let levelStartTime = 0; // Para niveles con criterio de tiempo
let highlightedPreCompleteCells_levels = []; // Para previsualización de líneas

// --- NUEVAS VARIABLES PARA SISTEMA DE CEMENTO ---
let cementRainTimeoutId = null; // Para el temporizador de lluvia de cemento
let cementAnimationCanvas = null; // Canvas para animación de caída
let cementAnimationCtx = null; // Contexto del canvas de animación
let fallingCementPieces = []; // Array de piezas de cemento cayendo
let cementAnimationFrameId = null; // ID del frame de animación

// --- NUEVAS VARIABLES PARA SISTEMA DE ANILLOS ---
let ringsCollected = 0; // Contador de anillos recolectados
let totalRingsInLevel = 0; // Total de anillos en el nivel actual
let ringIdCounter = 0; // Contador para IDs únicos de anillos
let collectedRingEffects = []; // Array para efectos de recolección
let ringEffectAnimationId = null; // ID de animación de efectos de anillos

// --- NUEVAS VARIABLES PARA SISTEMA DE RAYOS ELÉCTRICOS ---
let lightningTimeoutId = null; // Para el temporizador de rayos
let lightningWarningTimeoutId = null; // Para la advertencia previa
let lightningCanvas = null; // Canvas para efectos de rayos
let lightningCtx = null; // Contexto del canvas de rayos
let electrifiedCells = new Map(); // Mapa de celdas electrificadas {key: {row, col, endTime}}
let lightningAnimationId = null; // ID de animación de rayos
let lightningEffects = []; // Array de efectos de rayos activos
let lightningParticles = []; // Partículas de efectos eléctricos
let lightningWarnings = []; // Array de advertencias de rayos
let isLightningWarningActive = false; // Si hay advertencia activa
let currentLightningTarget = null; // Objetivo actual del rayo
let lightningComboMultiplier = 1; // Multiplicador de combo eléctrico
let electricalSoundEnabled = true; // Control de sonidos eléctricos

// --- NUEVAS VARIABLES PARA EFECTOS DE ZONA ELECTRIFICADA ---
let electrifiedZoneEffects = []; // Array de efectos de zona electrificada
let electrifiedZoneParticles = []; // Partículas específicas de zona electrificada
let electrifiedArcs = []; // Arcos eléctricos entre celdas
let destructionEffects = []; // Efectos de destrucción de piezas
let stormIntensity = 1; // Intensidad de la tormenta (aumenta con el tiempo)
let stormStartTime = 0; // Tiempo de inicio de la tormenta

// --- NUEVAS VARIABLES PARA SISTEMA DE PORTALES DIMENSIONALES ---
let teleportTimeoutId = null; // Para el temporizador de teletransportación
let teleportWarningTimeoutId = null; // Para la advertencia previa
let portalCanvas = null; // Canvas para efectos de portales
let portalCtx = null; // Contexto del canvas de portales
let teleportAnimationId = null; // ID de animación de portales
let portalEffects = []; // Array de efectos de portales activos
let portalParticles = []; // Partículas de efectos dimensionales
let teleportWarnings = []; // Array de advertencias de teletransportación
let isTeleportWarningActive = false; // Si hay advertencia activa
let piecesToTeleport = []; // Piezas marcadas para teletransportación
let teleportIntensity = 1; // Intensidad de teletransportación (aumenta con el tiempo)
let portalStartTime = 0; // Tiempo de inicio del sistema de portales
let dimensionalRifts = []; // Efectos de grietas dimensionales

// --- CLASE PARA PIEZAS DE CEMENTO CAYENDO ---
class FallingCementPiece {
    constructor(targetRow, targetCol) {
        this.targetRow = targetRow;
        this.targetCol = targetCol;
        this.size = CELL_SIZE * 0.8; 
        this.rotation = (Math.random() - 0.5) * Math.PI / 4; 
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.landed = false;
        this.impacted = false;
        this.impactParticles = [];
        this.shadowOpacity = 0;

        this.calculateTargetPosition();
        
        this.x = this.targetX; 
        this.y = -this.size; 
        this.velocityY = 2 + Math.random() * 2; 
        this.gravity = 0.15 + Math.random() * 0.1;

        console.log(`[Cement] New Piece for [${this.targetRow},${this.targetCol}]. Canvas Target: x=${this.targetX?.toFixed(1)}, y=${this.targetY?.toFixed(1)}. Initial anim x=${this.x?.toFixed(1)}`);
    }
    
    calculateTargetPosition() {
        if (!boardElement) return;
        const boardRect = boardElement.getBoundingClientRect();
        this.targetX = boardRect.left + (this.targetCol * (CELL_SIZE + GAP_SIZE)) + (CELL_SIZE / 2);
        this.targetY = boardRect.top + (this.targetRow * (CELL_SIZE + GAP_SIZE)) + (CELL_SIZE / 2);
        this.x = this.targetX + (Math.random() - 0.5) * 100; // Pequeña variación horizontal inicial
    }
    
    update() {
        if (this.impacted) {
            // Actualizar partículas de impacto
            for (let i = this.impactParticles.length - 1; i >= 0; i--) {
                const particle = this.impactParticles[i];
                particle.update();
                if (particle.life <= 0) {
                    this.impactParticles.splice(i, 1);
                }
            }
            return this.impactParticles.length === 0; // Retorna true si terminó la animación
        }
        
        // Actualizar posición
        this.velocityY += this.gravity;
        this.y += this.velocityY;
        this.rotation += this.rotationSpeed;
        
        // Calcular sombra basada en la altura
        const distanceToTarget = Math.max(0, this.targetY - this.y);
        this.shadowOpacity = Math.max(0, 1 - (distanceToTarget / 300));
        
        // Verificar si llegó al objetivo
        if (this.y >= this.targetY) {
            this.impact();
            return false;
        }
        
        return false;
    }
    
    impact() {
        this.impacted = true;
        this.y = this.targetY;
        console.log(`[Cement] Impact at [${this.targetRow},${this.targetCol}]. Anim y=${this.y?.toFixed(1)} vs targetY=${this.targetY?.toFixed(1)}. Current anim x=${this.x?.toFixed(1)} vs targetX=${this.targetX?.toFixed(1)}`);
        
        // Crear partículas de impacto optimizadas basadas en el rendimiento
        const maxParticles = devicePerformance.shouldUseEffects() ? 
            Math.min(15, devicePerformance.getMaxParticles() / 3) : 0;
        
        for (let i = 0; i < maxParticles; i++) {
            this.impactParticles.push({
                x: this.x,
                y: this.y,
                speedX: (Math.random() - 0.5) * 8,
                speedY: (Math.random() - 0.5) * 8 - 2,
                life: Math.random() * 30 + 20,
                maxLife: Math.random() * 30 + 20,
                size: Math.random() * 3 + 1,
                update() {
                    this.life--;
                    this.x += this.speedX;
                    this.y += this.speedY;
                    this.speedY += 0.2; // Gravedad
                    this.speedX *= 0.98; // Fricción
                }
            });
        }
        
        // Colocar la pieza de cemento en el tablero
        this.placeCementBlock();
        
        // Efecto de temblor de pantalla (solo si los efectos están habilitados)
        if (devicePerformance.shouldUseEffects()) {
            this.createScreenShake();
        }
    }
    
    placeCementBlock() {
        if (board[this.targetRow] && typeof board[this.targetRow][this.targetCol] !== 'undefined') {
            // Marcar como cemento en el tablero lógico
            board[this.targetRow][this.targetCol] = 3; // 3 = cemento
            
            // Actualizar visualmente la celda
            const cellElement = boardElement.querySelector(`[data-row='${this.targetRow}'][data-col='${this.targetCol}']`);
            if (cellElement) {
                // Limpiar estilos anteriores
                cellElement.classList.remove('piece-block', 'frozen-cell', 'frozen-stage-2', 'frozen-stage-1');
                cellElement.style.backgroundColor = '';
                delete cellElement.dataset.pieceColor;
                delete cellElement.dataset.frozenId;
                delete cellElement.dataset.frozenStage;
                
                // Aplicar estilo de cemento
                cellElement.classList.add('cement-block');
                cellElement.dataset.cementBlock = 'true';
                
                // Animación de aparición
                cellElement.classList.add('cement-impact-animation');
                setTimeout(() => {
                    cellElement.classList.remove('cement-impact-animation');
                }, 500);
            }
        }
    }
    
    createScreenShake() {
        if (gameContainerElement) {
            gameContainerElement.classList.add('screen-shake');
            setTimeout(() => {
                gameContainerElement.classList.remove('screen-shake');
            }, 300);
        }
    }
    
    draw() {
        if (!cementAnimationCtx) return;
        
        cementAnimationCtx.save();
        
        // Dibujar sombra en el suelo solo si la pieza no ha impactado
        if (!this.impacted && this.shadowOpacity > 0) {
            cementAnimationCtx.globalAlpha = this.shadowOpacity * 0.5;
            cementAnimationCtx.fillStyle = '#000000';
            cementAnimationCtx.beginPath();
            cementAnimationCtx.ellipse(this.targetX, this.targetY + 5, this.size * 0.6, this.size * 0.3, 0, 0, Math.PI * 2);
            cementAnimationCtx.fill();
        }
        
        // Dibujar la pieza cayendo solo si no ha impactado
        if (!this.impacted) {
            cementAnimationCtx.globalAlpha = 1;
            cementAnimationCtx.translate(this.x, this.y);
            cementAnimationCtx.rotate(this.rotation);
            
            cementAnimationCtx.fillStyle = '#A0A0A0'; 
            cementAnimationCtx.strokeStyle = '#5A5A5A'; 
            cementAnimationCtx.lineWidth = 2;
            
            cementAnimationCtx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
            cementAnimationCtx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
            
            const gradient = cementAnimationCtx.createLinearGradient(-this.size/2, -this.size/2, this.size/2, this.size/2);
            gradient.addColorStop(0, '#B8B8B8'); 
            gradient.addColorStop(0.5, '#A0A0A0'); 
            gradient.addColorStop(1, '#707070'); 
            cementAnimationCtx.fillStyle = gradient;
            cementAnimationCtx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
            
            cementAnimationCtx.fillStyle = '#FFFFFF'; 
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    if (Math.random() > 0.6) {
                        cementAnimationCtx.globalAlpha = 0.6;
                        cementAnimationCtx.fillRect(
                            -this.size/2 + (i * this.size/4) + Math.random() * 3,
                            -this.size/2 + (j * this.size/4) + Math.random() * 3,
                            2, 2
                        );
                    }
                }
            }
            
            cementAnimationCtx.fillStyle = '#404040';
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (Math.random() > 0.8) {
                        cementAnimationCtx.globalAlpha = 0.4;
                        cementAnimationCtx.fillRect(
                            -this.size/2 + (i * this.size/3) + Math.random() * 4,
                            -this.size/2 + (j * this.size/3) + Math.random() * 4,
                            1, 1
                        );
                    }
                }
            }
            cementAnimationCtx.globalAlpha = 1;
            // El restore se hace después de dibujar las partículas o al final si no hay impacto
        } 
        // El save() inicial se restaura aquí después de dibujar la pieza o antes de las partículas
        cementAnimationCtx.restore(); 

        // Dibujar partículas de impacto (siempre se hace después del restore del estado de la pieza)
        if (this.impacted) {
            this.impactParticles.forEach(particle => {
                cementAnimationCtx.save(); // Save para cada partícula
                cementAnimationCtx.globalAlpha = particle.life / particle.maxLife;
                cementAnimationCtx.fillStyle = '#C0C0C0'; 
                cementAnimationCtx.beginPath();
                cementAnimationCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                cementAnimationCtx.fill();
                
                cementAnimationCtx.strokeStyle = '#808080';
                cementAnimationCtx.lineWidth = 0.5;
                cementAnimationCtx.stroke();
                cementAnimationCtx.restore(); // Restore para cada partícula
            });
        }
    }
}

// --- FUNCIONES DEL SISTEMA DE CEMENTO ---
function setupCementAnimationCanvas() {
    // Crear el canvas si no existe
    if (!cementAnimationCanvas) {
        cementAnimationCanvas = document.createElement('canvas');
        cementAnimationCanvas.id = 'cement-animation-canvas';
        
        // Insertarlo en el game-container
        if (gameContainerElement) {
            gameContainerElement.appendChild(cementAnimationCanvas);
        } else {
            document.body.appendChild(cementAnimationCanvas);
        }
        
        cementAnimationCtx = cementAnimationCanvas.getContext('2d');
    }
    
    // Configurar tamaño del canvas con optimización de rendimiento
    if (boardElement && gameContainerElement) {
        const containerRect = gameContainerElement.getBoundingClientRect();
        
        // Aplicar resolución optimizada basada en el rendimiento del dispositivo
        const optimizedSize = getOptimizedCanvasSize(containerRect.width, containerRect.height);
        cementAnimationCanvas.width = optimizedSize.width;
        cementAnimationCanvas.height = optimizedSize.height;
        
        // Posicionar el canvas
        cementAnimationCanvas.style.position = 'absolute';
        cementAnimationCanvas.style.top = '0';
        cementAnimationCanvas.style.left = '0';
        cementAnimationCanvas.style.pointerEvents = 'none';
        cementAnimationCanvas.style.zIndex = '1500';
    }
}

function startCementRain(levelConfig) {
    if (!levelConfig.cementRainInterval) return;
    
    console.log("Iniciando lluvia de cemento cada", levelConfig.cementRainInterval / 1000, "segundos");
    
    // Configurar el canvas de animación
    setupCementAnimationCanvas();
    
    // Función para hacer caer una pieza de cemento
    const dropCementPiece = () => {
        // Elegir posición aleatoria
        const randomRow = Math.floor(Math.random() * 10);
        const randomCol = Math.floor(Math.random() * 10);
        
        console.log(`Cayendo pieza de cemento en posición [${randomRow}, ${randomCol}]`);
        
        // Crear la pieza cayendo
        const fallingPiece = new FallingCementPiece(randomRow, randomCol);
        fallingCementPieces.push(fallingPiece);
        
        // Iniciar animación si no está corriendo
        if (!cementAnimationFrameId) {
            animateFallingCement();
        }
        
        // Programar la siguiente caída
        if (levelConfig && typeof levelConfig.cementRainInterval === 'number' && currentGameMode === 'levels') {
            cementRainTimeoutId = setTimeout(dropCementPiece, levelConfig.cementRainInterval);
        }
    };
    
    // Iniciar la primera caída después de 5 segundos
    cementRainTimeoutId = setTimeout(dropCementPiece, 5000);
}

// Variable global para control de frame rate de cemento
let lastCementFrameTime = 0;

function animateFallingCement() {
    if (!cementAnimationCtx || !cementAnimationCanvas) return;
    
    // Control de frame rate basado en el rendimiento del dispositivo
    const targetFrameRate = devicePerformance.getFrameRateTarget();
    const frameInterval = 1000 / targetFrameRate;
    
    const currentTime = performance.now();
    
    if (currentTime - lastCementFrameTime < frameInterval) {
        // Saltar este frame para mantener el frame rate objetivo
        if (fallingCementPieces.length > 0) {
            cementAnimationFrameId = requestAnimationFrame(animateFallingCement);
        } else {
            cementAnimationFrameId = null;
        }
        return;
    }
    
    lastCementFrameTime = currentTime;
    
    // Limpiar canvas
    cementAnimationCtx.clearRect(0, 0, cementAnimationCanvas.width, cementAnimationCanvas.height);
    
    // Actualizar y dibujar todas las piezas cayendo
    for (let i = fallingCementPieces.length - 1; i >= 0; i--) {
        const piece = fallingCementPieces[i];
        const finished = piece.update();
        
        // Solo dibujar si los efectos están habilitados
        if (devicePerformance.shouldUseEffects()) {
            piece.draw();
        }
        
        // Remover piezas que terminaron su animación
        if (finished) {
            fallingCementPieces.splice(i, 1);
        }
    }
    
    // Continuar animación si hay piezas
    if (fallingCementPieces.length > 0) {
        cementAnimationFrameId = requestAnimationFrame(animateFallingCement);
    } else {
        cementAnimationFrameId = null;
    }
}

function stopCementRain() {
    // Detener el temporizador
    if (cementRainTimeoutId) {
        clearTimeout(cementRainTimeoutId);
        cementRainTimeoutId = null;
    }
    
    // Detener animación
    if (cementAnimationFrameId) {
        cancelAnimationFrame(cementAnimationFrameId);
        cementAnimationFrameId = null;
    }
    
    // Limpiar piezas cayendo
    fallingCementPieces = [];
    
    // Limpiar canvas
    if (cementAnimationCtx && cementAnimationCanvas) {
        cementAnimationCtx.clearRect(0, 0, cementAnimationCanvas.width, cementAnimationCanvas.height);
    }
    
    console.log("Lluvia de cemento detenida");
}

function cleanupCementSystem() {
    stopCementRain();
    
    // Remover canvas si existe
    if (cementAnimationCanvas && cementAnimationCanvas.parentNode) {
        cementAnimationCanvas.parentNode.removeChild(cementAnimationCanvas);
        cementAnimationCanvas = null;
        cementAnimationCtx = null;
    }
}

// Definición de Niveles (ejemplo)
const levelsConfiguration = {
    1: { 
        id: 1, 
        name: "Nivel 1", 
        objectiveText: "Alcanza 1000 puntos", 
        targetScore: 1000, 
        maxTimeSeconds: null, 
        initialBoard: null, 
        availablePieces: null, 
        starCriteria: 'time', // Criterio para estrellas: 'time', 'movesRemaining', etc.
        starsThresholds: { threeStars: 60, twoStars: 90 } // 3 estrellas <= 60s, 2 estrellas <= 90s, 1 estrella > 90s
    }, 
    2: { 
        id: 2, 
        name: "Nivel 2 - Deshielo", 
        objectiveText: "Destruye 3 bloques de hielo completando filas o columnas utilizando los hielos.", 
        locked: false, // Desbloqueado para probar
        maxMoves: 35, // Aumentado de 25 a 30 movimientos
        targetFrozenPiecesToClear: 3,
        initialFrozenPieces: [
            { row: 2, col: 2, initialStage: 2, id: "frozen_1" }, // Cambiado de stage 3 a 2
            { row: 4, col: 5, initialStage: 2, id: "frozen_2" }, // Cambiado de stage 3 a 2
            { row: 7, col: 7, initialStage: 2, id: "frozen_3" }, // Cambiado de stage 3 a 2
        ],
        starCriteria: 'movesRemaining',
        starsThresholds: { threeStars: 8, twoStars: 4 } // Ajustado: 3 estrellas >= 8 mov. restantes, 2 estrellas >= 4 mov. restantes
    },
    3: { 
        id: 3, 
        name: "Nivel 3 - Lluvia de Cemento", 
        objectiveText: "Alcanza 1000 puntos mientras llueven bloques de cemento.", 
        targetScore: 1000, 
        locked: false, // Desbloqueado para probar
        maxTimeSeconds: null, // Sin límite de tiempo específico
        cementRainInterval: 25000, // 25 segundos en milisegundos
        starCriteria: 'time',
        starsThresholds: { threeStars: 120, twoStars: 180 } // 3 estrellas <= 2min, 2 estrellas <= 3min
    },
    4: { 
        id: 4, 
        name: "Nivel 4 - Cazador de Anillos", 
        objectiveText: "Recolecta 10 anillos dorados colocando las piezas que los contienen.", 
        targetRingsToCollect: 10,
        maxMoves: 20,
        locked: false, // Desbloqueado para probar
        starCriteria: 'movesRemaining',
        starsThresholds: { threeStars: 8, twoStars: 4 } // 3 estrellas >= 8 mov. restantes, 2 estrellas >= 4 mov. restantes
    },
    5: { 
        id: 5, 
        name: "Nivel 5 - Tormenta Eléctrica", 
        objectiveText: "Alcanza 1000 puntos en 60 segundos. Los rayos destruyen piezas y dejan zonas electrificadas.", 
        targetScore: 1000,
        maxTimeSeconds: 80, // 80 segundos límite (reducido de 90)
        lightningInterval: 10000, // Rayos cada 10 segundos (reducido de 20000)
        lightningWarningTime: 2000, // Advertencia de 2 segundos
        electrifiedDuration: 3000, // Zonas electrificadas por 3 segundos
        locked: false, // Desbloqueado para probar
        starCriteria: 'time',
        starsThresholds: { threeStars: 40, twoStars: 50 } // 3 estrellas <= 40s, 2 estrellas <= 50s (ajustado para el nuevo tiempo)
    },
    6: { 
        id: 6, 
        name: "Nivel 6 - Portal Dimensional", 
        objectiveText: "Alcanza 1000 puntos en 60 segundos. Las piezas se teletransportan al azar.", 
        targetScore: 1000,
        maxTimeSeconds: 60, // 60 segundos límite
        teleportInterval: 9000, // Teletransportación cada 9 segundos
        teleportWarningTime: 3000, // Advertencia de 3 segundos
        teleportIntensityIncrease: true, // La frecuencia aumenta con el tiempo
        locked: false, // Desbloqueado para probar
        starCriteria: 'time',
        starsThresholds: { threeStars: 35, twoStars: 45 } // Más difícil que el nivel 5
    },
    // --- NUEVOS NIVELES (7 - 20) ---
    7: {
        id: 7,
        name: "Nivel 7 - Congelación Avanzada",
        objectiveText: "Destruye 5 bloques de hielo resistentes (etapa 2).",
        locked: false,
        maxMoves: 40,
        targetFrozenPiecesToClear: 5,
        initialFrozenPieces: [
            { row: 1, col: 1, initialStage: 2, id: "frozen_adv_1" },
            { row: 1, col: 8, initialStage: 2, id: "frozen_adv_2" },
            { row: 8, col: 1, initialStage: 2, id: "frozen_adv_3" },
            { row: 8, col: 8, initialStage: 2, id: "frozen_adv_4" },
            { row: 4, col: 4, initialStage: 2, id: "frozen_adv_5" },
        ],
        starCriteria: 'movesRemaining',
        starsThresholds: { threeStars: 10, twoStars: 5 }
    },
    8: {
        id: 8,
        name: "Nivel 8 - Diluvio de Cemento",
        objectiveText: "Alcanza 1500 puntos bajo una intensa lluvia de cemento (cada 20s).",
        targetScore: 1500,
        locked: false,
        maxTimeSeconds: null,
        cementRainInterval: 20000, // Más frecuente que el Nivel 3 original
        starCriteria: 'time',
        starsThresholds: { threeStars: 150, twoStars: 210 } // Tiempo en segundos
    },
    9: {
        id: 9,
        name: "Nivel 9 - Fiebre del Oro Intensa",
        objectiveText: "Recolecta 12 anillos dorados con solo 22 movimientos.",
        targetRingsToCollect: 12,
        maxMoves: 22, // Más ajustado que el Nivel 4 original
        locked: false,
        starCriteria: 'movesRemaining',
        starsThresholds: { threeStars: 7, twoStars: 3 }
    },
    10: {
        id: 10,
        name: "Nivel 10 - Tormenta Implacable",
        objectiveText: "Sobrevive y alcanza 1200 puntos en 70s bajo rayos frecuentes (cada 8s).",
        targetScore: 1200,
        maxTimeSeconds: 70,
        lightningInterval: 8000, // Muy frecuentes
        lightningWarningTime: 1500,
        electrifiedDuration: 3000,
        locked: false,
        starCriteria: 'time',
        starsThresholds: { threeStars: 40, twoStars: 55 } // Tiempo en segundos
    },
    11: {
        id: 11,
        name: "Nivel 11 - Vórtice Caótico",
        objectiveText: "Consigue 1000 puntos en 50s mientras las piezas se teletransportan muy rápido (cada 7s).",
        targetScore: 1000,
        maxTimeSeconds: 50, // Menos tiempo
        teleportInterval: 7000, // Muy frecuentes
        teleportWarningTime: 2000,
        teleportIntensityIncrease: true,
        locked: false,
        starCriteria: 'time',
        starsThresholds: { threeStars: 25, twoStars: 40 } // Tiempo en segundos
    },
    12: {
        id: 12,
        name: "Nivel 12 - Hielo y Cemento Peliagudo",
        objectiveText: "Destruye 4 hielos (etapa 2) y alcanza 1000 puntos con lluvia de cemento (22s).",
        locked: false,
        maxMoves: 38,
        targetScore: 1000,
        targetFrozenPiecesToClear: 4,
        initialFrozenPieces: [
            { row: 2, col: 2, initialStage: 2, id: "hc_1" },
            { row: 2, col: 7, initialStage: 2, id: "hc_2" },
            { row: 7, col: 2, initialStage: 2, id: "hc_3" },
            { row: 7, col: 7, initialStage: 2, id: "hc_4" },
        ],
        cementRainInterval: 22000,
        starCriteria: 'movesRemaining',
        starsThresholds: { threeStars: 8, twoStars: 4 }
    },
    13: {
        id: 13,
        name: "Nivel 13 - Anillos Eléctricos Peligrosos",
        objectiveText: "Recolecta 10 anillos en 80s durante una tormenta eléctrica (rayos cada 10s).",
        targetRingsToCollect: 10,
        maxTimeSeconds: 80, // Menos tiempo
        locked: false,
        lightningInterval: 10000,
        lightningWarningTime: 2000,
        electrifiedDuration: 2500,
        starCriteria: 'time',
        starsThresholds: { threeStars: 45, twoStars: 65 } // Tiempo en segundos
    },
    14: {
        id: 14,
        name: "Nivel 14 - Cemento Dimensional Agobiante",
        objectiveText: "Alcanza 1200 puntos con lluvia de cemento (25s) y portales (10s) en 90s.",
        targetScore: 1200,
        maxTimeSeconds: 90, // Menos tiempo
        locked: false,
        cementRainInterval: 25000,
        teleportInterval: 10000,
        teleportWarningTime: 2500,
        teleportIntensityIncrease: true,
        starCriteria: 'time',
        starsThresholds: { threeStars: 50, twoStars: 70 } // Tiempo en segundos
    },
    15: {
        id: 15,
        name: "Nivel 15 - Infierno Helado Crítico",
        objectiveText: "Destruye 6 hielos (etapa 2) con solo 28 movimientos.",
        locked: false,
        maxMoves: 28, // Muy pocos movimientos
        targetFrozenPiecesToClear: 6,
        initialFrozenPieces: [
            { row: 0, col: 4, initialStage: 2, id: "fh_1" },
            { row: 2, col: 2, initialStage: 2, id: "fh_2" },
            { row: 2, col: 7, initialStage: 2, id: "fh_3" },
            { row: 5, col: 4, initialStage: 2, id: "fh_4" },
            { row: 7, col: 2, initialStage: 2, id: "fh_5" },
            { row: 7, col: 7, initialStage: 2, id: "fh_6" },
        ],
        starCriteria: 'movesRemaining',
        starsThresholds: { threeStars: 5, twoStars: 2 }
    },
    16: {
        id: 16,
        name: "Nivel 16 - Presión Temporal Extrema",
        objectiveText: "Alcanza 2000 puntos en solo 45 segundos.",
        targetScore: 2000,
        maxTimeSeconds: 45, // Muy ajustado
        locked: false,
        starCriteria: 'time',
        starsThresholds: { threeStars: 20, twoStars: 30 } // Tiempo en segundos, muy difícil
    },
    17: {
        id: 17,
        name: "Nivel 17 - Danza Eléctrica y Dimensional Frenética",
        objectiveText: "Haz 1500 puntos en 80s con rayos (9s) y portales (8s) muy frecuentes.",
        targetScore: 1500,
        maxTimeSeconds: 80,
        locked: false,
        lightningInterval: 9000,
        teleportInterval: 8000,
        teleportIntensityIncrease: true,
        starCriteria: 'time',
        starsThresholds: { threeStars: 40, twoStars: 60 } // Tiempo en segundos
    },
    18: {
        id: 18,
        name: "Nivel 18 - La Fortaleza de Cemento Final",
        objectiveText: "Alcanza 2500 puntos con lluvia de cemento (15s) y solo 25 movimientos.",
        targetScore: 2500,
        maxMoves: 25, // Muy restrictivo con el cemento
        locked: false,
        cementRainInterval: 15000, // Muy frecuente
        starCriteria: 'movesRemaining',
        starsThresholds: { threeStars: 6, twoStars: 2 }
    },
    19: {
        id: 19,
        name: "Nivel 19 - Triple Amenaza Combinada",
        objectiveText: "Recolecta 5 anillos y destruye 3 hielos, con rayos (10s) y tiempo de 100s.",
        targetRingsToCollect: 5,
        targetFrozenPiecesToClear: 3,
        initialFrozenPieces: [
            { row: 4, col: 1, initialStage: 2, id: "ta_1"},
            { row: 4, col: 4, initialStage: 2, id: "ta_2"},
            { row: 4, col: 8, initialStage: 2, id: "ta_3"},
        ],
        maxTimeSeconds: 100,
        lightningInterval: 10000,
        electrifiedDuration: 2000, // Hacer la electrificación un poco menos penalizante aquí
        locked: false,
        starCriteria: 'time',
        starsThresholds: { threeStars: 50, twoStars: 75 } // Tiempo en segundos
    },
    20: {
        id: 20,
        name: "Nivel 20 - Apocalipsis de Bloques",
        objectiveText: "¡SOBREVIVE! Alcanza 2000 puntos en 90s con cemento (18s), rayos (8s) y portales (9s).",
        targetScore: 2000, // Un poco menos de score para enfocar en supervivencia
        maxTimeSeconds: 90,
        locked: false,
        cementRainInterval: 18000,
        lightningInterval: 8000,
        electrifiedDuration: 3000,
        teleportInterval: 9000,
        teleportIntensityIncrease: true,
        starCriteria: 'time',
        starsThresholds: { threeStars: 45, twoStars: 65 } // Tiempo en segundos
    }
    // ... más niveles
};

// --- COMIENZO DE FUNCIONES COPIADAS Y ADAPTADAS DE SCRIPT.JS PARA MODO NIVELES ---

// Variables de estado para el arrastre específicas del modo niveles
let draggedPieceElement_levels = null;
let selectedPiece_levels = null;
let activePieceElement_levels = null;
let offsetX_levels = 0, offsetY_levels = 0;
let lastClientX_levels, lastClientY_levels;
let currentShadowCells_levels = [];

function generateSinglePieceElement_levels() {
  const pieceTypeNames = Object.keys(PIECES); 
  const randomPieceTypeName = pieceTypeNames[Math.floor(Math.random() * pieceTypeNames.length)];
  const pieceRotations = PIECES[randomPieceTypeName];
  const pieceMatrix = pieceRotations[Math.floor(Math.random() * pieceRotations.length)];
  const pieceColor = PIECE_COLORS[Math.floor(Math.random() * PIECE_COLORS.length)]; 
  const pieceInListCellSize = 18;

  const pieceDiv = document.createElement('div');
  pieceDiv.classList.add('piece');
  pieceDiv.classList.add('available-piece-glow'); 
  pieceDiv.classList.add('new-piece-appear-animation'); 
  pieceDiv.style.gridTemplateColumns = `repeat(${pieceMatrix[0].length}, ${pieceInListCellSize}px)`;
  pieceDiv.style.gridTemplateRows = `repeat(${pieceMatrix.length}, ${pieceInListCellSize}px)`;
  pieceDiv.dataset.pieceName = randomPieceTypeName; 
  pieceDiv.pieceMatrix = pieceMatrix;
  pieceDiv.pieceColor = pieceColor;
  
  // Asegurar que la pieza sea interactiva
  pieceDiv.style.cursor = 'grab';
  pieceDiv.style.userSelect = 'none';
  pieceDiv.style.touchAction = 'none'; // Importante para eventos táctiles

  pieceMatrix.forEach(row => {
    row.forEach(cellValue => {
      const cellDiv = document.createElement('div');
      cellDiv.style.width = `${pieceInListCellSize}px`; 
      cellDiv.style.height = `${pieceInListCellSize}px`;
      cellDiv.style.pointerEvents = 'none'; // Las celdas no deben interceptar eventos
      if (cellValue === 1) {
        cellDiv.style.backgroundColor = pieceColor;
        cellDiv.classList.add('piece-block');
      } else {
        cellDiv.style.visibility = 'hidden';
      }
      pieceDiv.appendChild(cellDiv);
    });
  });
  
  // Función de manejo de eventos mejorada
  const handleDragStart = (e) => {
    console.log("DEBUG: Evento de arrastre detectado en pieza:", randomPieceTypeName);
    startDrag_levels(e, randomPieceTypeName, pieceMatrix, pieceDiv);
  };
  
  // Registrar eventos con opciones específicas
  pieceDiv.addEventListener('mousedown', handleDragStart, { passive: false });
  pieceDiv.addEventListener('touchstart', handleDragStart, { passive: false });
  
  // Prevenir comportamientos por defecto que puedan interferir
  pieceDiv.addEventListener('dragstart', (e) => e.preventDefault());
  pieceDiv.addEventListener('selectstart', (e) => e.preventDefault());
  
  setTimeout(() => {
    pieceDiv.classList.remove('new-piece-appear-animation');
  }, 400); 

  return pieceDiv;
}

function displayPieces_levels() {
  if (!piecesElement) {
      console.error("Error: piecesElement no encontrado en displayPieces_levels.");
      return;
  }
  piecesElement.innerHTML = ''; 
  for (let i = 0; i < 3; i++) {
    const newPieceElement = generateSinglePieceElement_levels();
    
    // Añadir anillo si el nivel actual está configurado para tener anillos
    const currentLevelConfig = levelsConfiguration[currentSelectedLevelId];
    if (currentLevelConfig && currentLevelConfig.targetRingsToCollect) {
        // Podríamos añadir una probabilidad para que no todas las piezas tengan anillo,
        // o controlar cuántos anillos activos puede haber a la vez.
        // Por ahora, si el nivel tiene objetivo de anillos, cada nueva pieza tendrá uno.
        addRingToPiece(newPieceElement);
    }
    
    piecesElement.appendChild(newPieceElement);
  }
}

function startDrag_levels(event, pieceName, pieceMatrix, originalElement) {
  if (draggedPieceElement_levels) return;
  event.preventDefault();
  event.stopPropagation(); // Evitar propagación de eventos
  
  console.log("DEBUG: startDrag_levels iniciado para pieza:", pieceName);
  
  const eventClientX = event.clientX || event.touches[0].clientX;
  const eventClientY = event.clientY || event.touches[0].clientY;
  lastClientX_levels = eventClientX;
  lastClientY_levels = eventClientY;
  const pieceColor = originalElement.pieceColor;
  selectedPiece_levels = { name: pieceName, matrix: pieceMatrix, color: pieceColor };
  activePieceElement_levels = originalElement;
  
  // Clonar la pieza pero limpiar elementos problemáticos
  draggedPieceElement_levels = activePieceElement_levels.cloneNode(true);
  
  // Limpiar anillos del elemento clonado para evitar conflictos
  const clonedRings = draggedPieceElement_levels.querySelectorAll('.golden-ring');
  clonedRings.forEach(ring => ring.remove());
  
  // Limpiar datos de anillo del elemento clonado
  if (draggedPieceElement_levels.ringData) {
    delete draggedPieceElement_levels.ringData;
  }
  
  draggedPieceElement_levels.classList.remove('available-piece-glow');
  draggedPieceElement_levels.classList.remove('piece-with-ring'); // Remover clase de anillo
  draggedPieceElement_levels.pieceColor = pieceColor; 
  draggedPieceElement_levels.classList.add('dragging'); 
  
  // Asegurar que el elemento arrastrado tenga los estilos correctos
  draggedPieceElement_levels.style.position = 'fixed';
  draggedPieceElement_levels.style.zIndex = '9999';
  draggedPieceElement_levels.style.pointerEvents = 'none'; // Evitar interferencia con eventos
  
  document.body.appendChild(draggedPieceElement_levels);
  
  const draggedRect = draggedPieceElement_levels.getBoundingClientRect();
  offsetX_levels = draggedRect.width / 2;
  offsetY_levels = draggedRect.height * 2; 
  draggedPieceElement_levels.style.left = `${eventClientX - offsetX_levels}px`;
  draggedPieceElement_levels.style.top = `${eventClientY - offsetY_levels}px`;
  activePieceElement_levels.classList.add('hidden-original'); 
  
  const initialDraggedRect = draggedPieceElement_levels.getBoundingClientRect();
  const initialPieceCenterX = initialDraggedRect.left + initialDraggedRect.width / 2;
  const initialPieceCenterY = initialDraggedRect.top + initialDraggedRect.height / 2;
  updatePieceShadow_levels(initialPieceCenterX, initialPieceCenterY); 
  
  console.log("DEBUG: Event listeners añadidos para arrastre");
  document.addEventListener('mousemove', dragMove_levels);
  document.addEventListener('touchmove', dragMove_levels, { passive: false });
  document.addEventListener('mouseup', dragEnd_levels);
  document.addEventListener('touchend', dragEnd_levels);
}

function dragMove_levels(event) {
  if (!draggedPieceElement_levels) return;
  event.preventDefault();
  const currentClientX = event.clientX || event.touches[0].clientX;
  const currentClientY = event.clientY || event.touches[0].clientY;
  let deltaX = 0;
  let deltaY = 0;
  if (typeof lastClientX_levels !== 'undefined') {
    deltaX = currentClientX - lastClientX_levels;
    deltaY = currentClientY - lastClientY_levels;
  }
  const newPieceLeft = parseFloat(draggedPieceElement_levels.style.left) + (deltaX * HORIZONTAL_DRAG_SENSITIVITY); 
  const newPieceTop = parseFloat(draggedPieceElement_levels.style.top) + deltaY; 
  draggedPieceElement_levels.style.left = `${newPieceLeft}px`;
  draggedPieceElement_levels.style.top = `${newPieceTop}px`;
  lastClientX_levels = currentClientX;
  lastClientY_levels = currentClientY;
  const draggedRect = draggedPieceElement_levels.getBoundingClientRect();
  const pieceCenterX = draggedRect.left + draggedRect.width / 2;
  const pieceCenterY = draggedRect.top + draggedRect.height / 2;
  updatePieceShadow_levels(pieceCenterX, pieceCenterY); 
}

// --- NUEVA FUNCIÓN PARA VERIFICAR LÍNEAS POTENCIALES ---
function checkPotentialLines_levels(tempBoard, piecePos, pieceMatrix) {
    const completedRows = [];
    const completedCols = [];
    const numRows = tempBoard.length;
    const numCols = tempBoard[0].length;

    // Verificar filas completas (cemento NO cuenta para completar líneas)
    for (let r = 0; r < numRows; r++) {
        let rowIsFull = true;
        for (let c = 0; c < numCols; c++) {
            // Una línea está completa solo si tiene piezas normales (1) o congeladas (2), NO cemento (3)
            if (tempBoard[r][c] === 0 || tempBoard[r][c] === 3) { 
                rowIsFull = false;
                break;
            }
        }
        if (rowIsFull) {
            completedRows.push(r);
        }
    }

    // Verificar columnas completas (cemento NO cuenta para completar líneas)
    for (let c = 0; c < numCols; c++) {
        let colIsFull = true;
        for (let r = 0; r < numRows; r++) {
            // Una línea está completa solo si tiene piezas normales (1) o congeladas (2), NO cemento (3)
            if (tempBoard[r][c] === 0 || tempBoard[r][c] === 3) { 
                colIsFull = false;
                break;
            }
        }
        if (colIsFull) {
            completedCols.push(c);
        }
    }
    return { completedRows, completedCols };
}
// --- FIN NUEVA FUNCIÓN ---

function updatePieceShadow_levels(pieceCenterX, pieceCenterY) {
    // Limpiar sombra anterior
    currentShadowCells_levels.forEach(cell => {
        cell.classList.remove('shadow');
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        if (board[r][c] === 0) { 
            cell.style.backgroundColor = ''; 
        } else if (board[r][c] === 1) { 
            cell.style.backgroundColor = cell.dataset.pieceColor || ''; 
        } 
    });
    currentShadowCells_levels = [];

    // Limpiar resaltado de previsualización de líneas anterior
    highlightedPreCompleteCells_levels.forEach(cellElement => {
        if (cellElement) { // Asegurarse de que el elemento aún exista
            cellElement.classList.remove('line-preview-highlight-levels');
        }
    });
    highlightedPreCompleteCells_levels = [];

    if (!selectedPiece_levels || !selectedPiece_levels.color || !draggedPieceElement_levels) return;
    const boardRect = boardElement.getBoundingClientRect(); 
    let bestSnapPos = null;
    let minDistanceSq = Infinity;
    const pieceMatrix = selectedPiece_levels.matrix;
    const pieceActualWidth = pieceMatrix[0].length * CELL_SIZE + (pieceMatrix[0].length > 0 ? (pieceMatrix[0].length - 1) * GAP_SIZE : 0); 
    const pieceActualHeight = pieceMatrix.length * CELL_SIZE + (pieceMatrix.length > 0 ? (pieceMatrix.length - 1) * GAP_SIZE : 0);
    for (let r_board = 0; r_board < 10; r_board++) {
        for (let c_board = 0; c_board < 10; c_board++) {
            if (canPlacePiece_levels(pieceMatrix, r_board, c_board)) { 
                const potentialPieceTopLeftX = boardRect.left + c_board * (CELL_SIZE + GAP_SIZE);
                const potentialPieceTopLeftY = boardRect.top + r_board * (CELL_SIZE + GAP_SIZE);
                const potentialPieceCenterX = potentialPieceTopLeftX + pieceActualWidth / 2;
                const potentialPieceCenterY = potentialPieceTopLeftY + pieceActualHeight / 2;
                const distSq = (pieceCenterX - potentialPieceCenterX) ** 2 + (pieceCenterY - potentialPieceCenterY) ** 2;
                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    bestSnapPos = { row: r_board, col: c_board };
                }
            }
        }
    }
    const snapThresholdPixels = SHADOW_SNAP_THRESHOLD_CELLS * (CELL_SIZE + GAP_SIZE); 
    if (bestSnapPos && Math.sqrt(minDistanceSq) < snapThresholdPixels * pieceMatrix[0].length) {
        // Simular colocación para previsualización de líneas
        const tempBoard = board.map(row => [...row]);
        for (let r_piece = 0; r_piece < selectedPiece_levels.matrix.length; r_piece++) {
            for (let c_piece = 0; c_piece < selectedPiece_levels.matrix[r_piece].length; c_piece++) {
                if (selectedPiece_levels.matrix[r_piece][c_piece] === 1) {
                    const boardR = bestSnapPos.row + r_piece;
                    const boardC = bestSnapPos.col + c_piece;
                    if (boardR < 10 && boardC < 10 && boardR >= 0 && boardC >= 0) { 
                        tempBoard[boardR][boardC] = 1; // Marcar como ocupada (no importa si es 1 o 2 para checkPotentialLines)
                    }
                }
            }
        }
        
        const { completedRows, completedCols } = checkPotentialLines_levels(tempBoard, bestSnapPos, selectedPiece_levels.matrix);

        if (completedRows.length > 0 || completedCols.length > 0) {
            completedRows.forEach(r_idx => {
                for (let c_idx = 0; c_idx < 10; c_idx++) {
                    let isPartOfCurrentPiece = false;
                    for (let r_p = 0; r_p < selectedPiece_levels.matrix.length; r_p++) {
                        for (let c_p = 0; c_p < selectedPiece_levels.matrix[r_p].length; c_p++) {
                            if (selectedPiece_levels.matrix[r_p][c_p] === 1 && 
                                bestSnapPos.row + r_p === r_idx && 
                                bestSnapPos.col + c_p === c_idx) {
                                isPartOfCurrentPiece = true; break;
                            }
                        }
                        if (isPartOfCurrentPiece) break;
                    }

                    if (!isPartOfCurrentPiece) {
                        const cellElement = boardElement.querySelector(`[data-row='${r_idx}'][data-col='${c_idx}']`);
                        if (cellElement) {
                            cellElement.classList.add('line-preview-highlight-levels');
                            highlightedPreCompleteCells_levels.push(cellElement);
                        }
                    }
                }
            });
            completedCols.forEach(c_idx => {
                for (let r_idx = 0; r_idx < 10; r_idx++) {
                    let isPartOfCurrentPiece = false;
                    for (let r_p = 0; r_p < selectedPiece_levels.matrix.length; r_p++) {
                        for (let c_p = 0; c_p < selectedPiece_levels.matrix[r_p].length; c_p++) {
                            if (selectedPiece_levels.matrix[r_p][c_p] === 1 && 
                                bestSnapPos.row + r_p === r_idx && 
                                bestSnapPos.col + c_p === c_idx) {
                                isPartOfCurrentPiece = true; break;
                            }
                        }
                        if (isPartOfCurrentPiece) break;
                    }
                    const alreadyHighlighted = highlightedPreCompleteCells_levels.some(el => el === boardElement.querySelector(`[data-row='${r_idx}'][data-col='${c_idx}']`));
                    if (!isPartOfCurrentPiece && !alreadyHighlighted) {
                        const cellElement = boardElement.querySelector(`[data-row='${r_idx}'][data-col='${c_idx}']`);
                        if (cellElement) { 
                            cellElement.classList.add('line-preview-highlight-levels');
                            highlightedPreCompleteCells_levels.push(cellElement);
                        }
                    }
                }
            });
        }

        // Dibujar sombra normal de la pieza (esto podría sobrescribir el PREVIEW_LINE_COLOR en las celdas de la pieza, lo cual está bien)
        const shadowColorRgba = hexToRgba(selectedPiece_levels.color, 0.45); 
        for (let r_offset = 0; r_offset < selectedPiece_levels.matrix.length; r_offset++) {
            for (let c_offset = 0; c_offset < selectedPiece_levels.matrix[r_offset].length; c_offset++) {
                if (selectedPiece_levels.matrix[r_offset][c_offset] === 1) {
                    const boardR_shadow = bestSnapPos.row + r_offset;
                    const boardC_shadow = bestSnapPos.col + c_offset;
                    if (boardR_shadow < 10 && boardC_shadow < 10 && boardR_shadow >= 0 && boardC_shadow >= 0) {
                        const cellElement = boardElement.querySelector(`[data-row='${boardR_shadow}'][data-col='${boardC_shadow}']`);
                        if (cellElement && board[boardR_shadow][boardC_shadow] === 0) { 
                            cellElement.style.backgroundColor = shadowColorRgba;
                            cellElement.classList.add('shadow');
                            currentShadowCells_levels.push(cellElement);
                        }
                    }
                }
            }
        }
    } 
}

async function dragEnd_levels(event) {
    if (!draggedPieceElement_levels) return;

    // Limpiar resaltado de previsualización de líneas ANTES de cualquier otra cosa
    highlightedPreCompleteCells_levels.forEach(cellElement => {
        if (cellElement) {
            cellElement.classList.remove('line-preview-highlight-levels');
        }
    });
    highlightedPreCompleteCells_levels = [];

    currentShadowCells_levels.forEach(cell => {
        cell.classList.remove('shadow');
        const r_cell = parseInt(cell.dataset.row);
        const c_cell = parseInt(cell.dataset.col);
        if (board[r_cell][c_cell] === 0) { 
            cell.style.backgroundColor = ''; 
        } else if (board[r_cell][c_cell] === 1 && cell.dataset.pieceColor) {
            cell.style.backgroundColor = cell.dataset.pieceColor;
        } 
    });
    currentShadowCells_levels = [];
    document.removeEventListener('mousemove', dragMove_levels);
    document.removeEventListener('touchmove', dragMove_levels, { passive: false });
    document.removeEventListener('mouseup', dragEnd_levels);
    document.removeEventListener('touchend', dragEnd_levels);
    const draggedRect = draggedPieceElement_levels.getBoundingClientRect();
    const finalPieceCenterX = draggedRect.left + draggedRect.width / 2;
    const finalPieceCenterY = draggedRect.top + draggedRect.height / 2;
    let placed = false;
    if (selectedPiece_levels && selectedPiece_levels.color) {
        const boardRect_dragEnd = boardElement.getBoundingClientRect(); 
        let bestPlacePos = null;
        let minDistanceSqForPlacement = Infinity;
        const pieceMatrix_dragEnd = selectedPiece_levels.matrix;
        const pieceActualWidth_dragEnd = pieceMatrix_dragEnd[0].length * CELL_SIZE + (pieceMatrix_dragEnd[0].length > 0 ? (pieceMatrix_dragEnd[0].length - 1) * GAP_SIZE : 0);
        const pieceActualHeight_dragEnd = pieceMatrix_dragEnd.length * CELL_SIZE + (pieceMatrix_dragEnd.length > 0 ? (pieceMatrix_dragEnd.length - 1) * GAP_SIZE : 0);
        for (let r_board = 0; r_board < 10; r_board++) {
            for (let c_board = 0; c_board < 10; c_board++) {
                if (canPlacePiece_levels(pieceMatrix_dragEnd, r_board, c_board)) { 
                    const potentialPieceTopLeftX_dragEnd = boardRect_dragEnd.left + c_board * (CELL_SIZE + GAP_SIZE);
                    const potentialPieceTopLeftY_dragEnd = boardRect_dragEnd.top + r_board * (CELL_SIZE + GAP_SIZE);
                    const potentialPieceCenterX_dragEnd = potentialPieceTopLeftX_dragEnd + pieceActualWidth_dragEnd / 2;
                    const potentialPieceCenterY_dragEnd = potentialPieceTopLeftY_dragEnd + pieceActualHeight_dragEnd / 2;
                    const distSq = (finalPieceCenterX - potentialPieceCenterX_dragEnd) ** 2 + (finalPieceCenterY - potentialPieceCenterY_dragEnd) ** 2;
                    if (distSq < minDistanceSqForPlacement) {
                        minDistanceSqForPlacement = distSq;
                        bestPlacePos = { row: r_board, col: c_board };
                    }
                }
            }
        }
        const placeThresholdPixels = SHADOW_SNAP_THRESHOLD_CELLS * (CELL_SIZE + GAP_SIZE); 
        if (bestPlacePos && Math.sqrt(minDistanceSqForPlacement) < placeThresholdPixels * pieceMatrix_dragEnd[0].length) {
            // Colocar la pieza en el tablero
            placePiece_levels(selectedPiece_levels.matrix, bestPlacePos.row, bestPlacePos.col, selectedPiece_levels.color);
            
            const currentLevelConfigForRings = levelsConfiguration[currentSelectedLevelId];
            // Colocar anillo en el tablero si la pieza tenía uno y el nivel lo requiere
            if (currentLevelConfigForRings && currentLevelConfigForRings.targetRingsToCollect && activePieceElement_levels && activePieceElement_levels.ringData) {
                placeRingsOnBoard(selectedPiece_levels.matrix, bestPlacePos.row, bestPlacePos.col, activePieceElement_levels.ringData);
            }
            
            if (activePieceElement_levels) activePieceElement_levels.remove(); 
            placed = true;
            await checkAndClearLines_levels(); 

            // Corrected piece replenishment: generate and append only one new piece
            const newSinglePiece_levels = generateSinglePieceElement_levels();
            
            const currentLevelConfigForNewPieceRing = levelsConfiguration[currentSelectedLevelId];
            // Añadir anillo a la nueva pieza si el nivel actual está configurado para tener anillos
            if (currentLevelConfigForNewPieceRing && currentLevelConfigForNewPieceRing.targetRingsToCollect) {
                addRingToPiece(newSinglePiece_levels);
            }
            
            if (piecesElement) {
                piecesElement.appendChild(newSinglePiece_levels);
            } else {
                console.error("Error: piecesElement no encontrado en dragEnd_levels al intentar añadir nueva pieza.");
            }

            checkGameOver_levels(); 
        }
    }
    if (!placed) {
        if (activePieceElement_levels) {
            activePieceElement_levels.classList.remove('hidden-original');
        }
    }
    if (draggedPieceElement_levels && draggedPieceElement_levels.parentNode === document.body) {
        document.body.removeChild(draggedPieceElement_levels);
    }
    draggedPieceElement_levels = null;
    selectedPiece_levels = null;
    activePieceElement_levels = null;
    offsetX_levels = 0;
    offsetY_levels = 0;
}

function canPlacePiece_levels(pieceMatrix, startRow, startCol) {
    for (let r = 0; r < pieceMatrix.length; r++) {
        for (let c = 0; c < pieceMatrix[r].length; c++) {
            if (pieceMatrix[r][c] === 1) { 
                const boardR = startRow + r;
                const boardC = startCol + c;
                if (boardR >= 10 || boardC >= 10 || boardR < 0 || boardC < 0) {
                    return false; 
                }
                // Verificar si hay una pieza, hielo o cemento
                if (board[boardR][boardC] === 1 || board[boardR][boardC] === 2 || board[boardR][boardC] === 3) { 
                    return false; 
                }
                
                // VERIFICACIÓN MEJORADA: Zonas electrificadas inhabilitadas
                const cellKey = `${boardR}-${boardC}`;
                if (electrifiedCells.has(cellKey)) {
                    const electrifiedData = electrifiedCells.get(cellKey);
                    // Verificar si la electrificación sigue activa
                    if (Date.now() < electrifiedData.endTime) {
                        console.log(`🚫 Celda [${boardR}, ${boardC}] bloqueada por electrificación hasta`, new Date(electrifiedData.endTime).toLocaleTimeString());
                        return false;
                    }
                }
            }
        }
    }
    return true; 
}

function placePiece_levels(pieceMatrix, startRow, startCol, pieceColorForBoard) {
    for (let r = 0; r < pieceMatrix.length; r++) {
        for (let c = 0; c < pieceMatrix[r].length; c++) {
            if (pieceMatrix[r][c] === 1) {
                const boardR = startRow + r;
                const boardC = startCol + c;
                if (board[boardR][boardC] === 0) { 
                    board[boardR][boardC] = 1; 
                    const cellToUpdate = boardElement.querySelector(`[data-row='${boardR}'][data-col='${boardC}']`);
                    if (cellToUpdate) {
                        cellToUpdate.classList.remove('frozen-cell', 'frozen-stage-2', 'frozen-stage-1');
                        delete cellToUpdate.dataset.frozenId;
                        delete cellToUpdate.dataset.frozenStage;
                        cellToUpdate.style.backgroundColor = pieceColorForBoard;
                        cellToUpdate.classList.add('piece-block');
                        cellToUpdate.dataset.pieceColor = pieceColorForBoard;
                        cellToUpdate.classList.add('pulse-block-animation');
                        setTimeout(() => {
                            cellToUpdate.classList.remove('pulse-block-animation');
                        }, 300); 
                    }
                } else {
                    console.warn(`Intento de colocar pieza sobre celda no vacía en ${boardR},${boardC} con estado ${board[boardR][boardC]}`);
                }
            }
        }
    }
    const levelConfig = levelsConfiguration[currentSelectedLevelId];
    if (levelConfig && typeof levelConfig.maxMoves !== 'undefined') {
        movesRemaining--;
        const movesDisplay = document.getElementById('moves-remaining-display');
        if (movesDisplay) {
            movesDisplay.textContent = movesRemaining;
        }
    }
    
    // Verificar si se pueden reanudar las teletransportaciones (Nivel 6)
    checkAndResumeTeleportations();
}

// Nueva función para colocar anillos en el tablero
function placeRingsOnBoard(pieceMatrix, startRow, startCol, ringData) {
    if (!ringData || !ringData.hasRing) return;
    
    const ringPosition = ringData.ringPosition;
    const boardR = startRow + ringPosition.row;
    const boardC = startCol + ringPosition.col;
    
    // Verificar que la posición esté dentro del tablero
    if (boardR >= 0 && boardR < 10 && boardC >= 0 && boardC < 10) {
        const cellElement = boardElement.querySelector(`[data-row='${boardR}'][data-col='${boardC}']`);
        if (cellElement) {
            // Marcar la celda como conteniendo un anillo
            cellElement.dataset.hasRing = 'true';
            cellElement.dataset.ringId = ringData.ringId;
            
            // Añadir clase CSS para centrado
            cellElement.classList.add('cell-with-ring');
            
            // Crear el anillo visual en la celda del tablero
            createBoardRingElement(cellElement, ringData.ringId);
            
            console.log(`Anillo ${ringData.ringId} colocado en tablero en posición [${boardR}, ${boardC}]`);
        }
    }
}

// Nueva función para crear anillos en las celdas del tablero
function createBoardRingElement(cellElement, ringId) {
    // Verificar que no haya ya un anillo en esta celda
    const existingRing = cellElement.querySelector('.board-golden-ring');
    if (existingRing) {
        existingRing.remove();
    }
    
    const ringElement = document.createElement('div');
    ringElement.className = 'board-golden-ring';
    ringElement.id = `board_${ringId}`;
    
    // Estilos para el anillo en el tablero - CENTRADO PERFECTO
    ringElement.style.position = 'absolute';
    ringElement.style.top = '50%';
    ringElement.style.left = '50%';
    ringElement.style.transform = 'translate(-50%, -50%)';
    ringElement.style.width = '18px';
    ringElement.style.height = '18px';
    ringElement.style.pointerEvents = 'none';
    ringElement.style.zIndex = '1001';
    ringElement.style.margin = '0'; // Asegurar que no hay márgenes
    ringElement.style.padding = '0'; // Asegurar que no hay padding
    
    // Asegurar que la celda tenga posición relativa y esté preparada para el centrado
    cellElement.style.position = 'relative';
    cellElement.style.display = 'flex'; // Usar flexbox como respaldo
    cellElement.style.alignItems = 'center';
    cellElement.style.justifyContent = 'center';
    
    cellElement.appendChild(ringElement);
    
    console.log(`DEBUG: Anillo ${ringId} creado en tablero con centrado perfecto`);
}

async function checkAndClearLines_levels() {
    console.log("--- checkAndClearLines_levels INICIO ---");
    const levelConfig = levelsConfiguration[currentSelectedLevelId];
    if (!levelConfig) {
        console.error("checkAndClearLines_levels: No se encontró levelConfig para", currentSelectedLevelId);
        return Promise.resolve(0);
    }
    let linesClearedThisTurnCount = 0; 
    const cellsToClearLogically = new Set(); 
    const cellElementsForParticles = []; 
    const damagedFrozenCellsThisTurn = []; 
    const numRows = board.length;
    const numCols = board[0].length;
    for (let r = 0; r < numRows; r++) {
        let rowIsFull = true;
        for (let c_idx = 0; c_idx < numCols; c_idx++) {
            // Una fila está completa solo si NO tiene celdas vacías (0) ni cemento (3)
            if (board[r][c_idx] === 0 || board[r][c_idx] === 3) { 
                rowIsFull = false; break;
            }
        }
        if (rowIsFull) {
            linesClearedThisTurnCount++;
            for (let c_idx = 0; c_idx < numCols; c_idx++) {
                const cellElement = boardElement.children[r * numCols + c_idx];
                // Solo añadir celdas que NO sean cemento
                if (board[r][c_idx] !== 3) {
                    cellsToClearLogically.add({row: r, col: c_idx, element: cellElement, isFrozen: board[r][c_idx] === 2});
                }
            }
        }
    }
    for (let c = 0; c < numCols; c++) {
        let colIsFull = true;
        for (let r_idx = 0; r_idx < numRows; r_idx++) {
            // Una columna está completa solo si NO tiene celdas vacías (0) ni cemento (3)
            if (board[r_idx][c] === 0 || board[r_idx][c] === 3) {
                colIsFull = false; break;
            }
        }
        if (colIsFull) {
            linesClearedThisTurnCount++; 
            for (let r_idx = 0; r_idx < numRows; r_idx++) {
                const cellElement = boardElement.children[r_idx * numCols + c];
                let alreadyInSet = false;
                cellsToClearLogically.forEach(item => {
                    if (item.element === cellElement) alreadyInSet = true;
                });
                // Solo añadir celdas que NO sean cemento
                if (!alreadyInSet && board[r_idx][c] !== 3) {
                    cellsToClearLogically.add({row: r_idx, col: c, element: cellElement, isFrozen: board[r_idx][c] === 2});
                }
            }
        }
    }
    let pointsEarnedThisTurn = 0;
    if (cellsToClearLogically.size > 0) {
        cellsToClearLogically.forEach(cellData => {
            const { row, col, element: cellElement, isFrozen } = cellData;
            if (isFrozen) {
                const frozenPiece = frozenPiecesData.find(fp => fp.row === row && fp.col === col);
                if (frozenPiece && frozenPiece.currentStage > 0) {
                    frozenPiece.currentStage--;
                    damagedFrozenCellsThisTurn.push({element: cellElement, frozenPiece });
                    console.log(`Celda congelada en ${row},${col} (ID: ${frozenPiece.id}) dañada. Nuevo stage: ${frozenPiece.currentStage}`);
                    if (frozenPiece.currentStage <= 0) {
                        console.log(`Celda congelada en ${row},${col} (ID: ${frozenPiece.id}) DESTRUIDA!`);
                        board[row][col] = 0; 
                        if (!cellElementsForParticles.find(item => item.element === cellElement)) {
                            cellElementsForParticles.push({element: cellElement, color: cellElement.style.backgroundColor || '#ADD8E6'});
                        }
                    } 
                }
            } else { // Non-frozen cell
                if (board[row][col] === 1) { // Ensure it's a normal piece block
                    const originalColorForParticles = cellElement.dataset.pieceColor || cellElement.style.backgroundColor; // Get color for particles first

                    // Verificar si esta celda tiene un anillo y recolectarlo
                    if (cellElement.dataset.hasRing === 'true') {
                        const ringId = cellElement.dataset.ringId;
                        console.log(`Recolectando anillo ${ringId} de celda [${row}, ${col}] por línea completada`);
                        
                        // Crear efecto de recolección
                        const ringElement = cellElement.querySelector('.board-golden-ring');
                        if (ringElement) {
                            const ringRect = ringElement.getBoundingClientRect();
                            const centerX = ringRect.left + ringRect.width / 2;
                            const centerY = ringRect.top + ringRect.height / 2;
                            
                            const effect = new CollectedRingEffect(centerX, centerY);
                            collectedRingEffects.push(effect);
                            
                            if (!ringEffectAnimationId) {
                                animateRingEffects();
                            }
                            
                            // Animar recolección
                            ringElement.classList.add('ring-collected');
                            setTimeout(() => {
                                if (ringElement.parentNode) {
                                    ringElement.parentNode.removeChild(ringElement);
                                }
                            }, 600);
                        }
                        
                        // Actualizar contador
                        ringsCollected++;
                        updateRingsDisplay();
                        
                        // Limpiar datos del anillo
                        delete cellElement.dataset.hasRing;
                        delete cellElement.dataset.ringId;
                        cellElement.classList.remove('cell-with-ring'); // Limpiar clase CSS
                        
                        // Puntos por anillo
                        pointsEarnedThisTurn += 50;
                        
                        console.log(`Anillo recolectado! Total: ${ringsCollected}`);
                    }

                    board[row][col] = 0; // Logical clear - cell is now empty

                    // --- Explicitly clear visual appearance of the normal cell ---
                    cellElement.style.backgroundColor = '';
                    cellElement.classList.remove('piece-block');
                    cellElement.classList.remove('pulse-block-animation'); // Remove if present
                    // Clear any other visual styles that might have been set for a piece
                    cellElement.style.backgroundImage = ''; 
                    cellElement.style.border = '';          
                    cellElement.style.opacity = '';         
                    delete cellElement.dataset.pieceColor;  // Remove stored color data

                    // Add to particles (will use originalColorForParticles)
                    if (!cellElementsForParticles.find(item => item.element === cellElement)) {
                         cellElementsForParticles.push({element: cellElement, color: originalColorForParticles});
                    }
                    pointsEarnedThisTurn += 10;
                }
            }
        });
        damagedFrozenCellsThisTurn.forEach(dfc => {
            const { element, frozenPiece } = dfc;
            element.classList.remove('frozen-stage-2', 'frozen-stage-1');
            delete element.dataset.frozenStage; 
            if (frozenPiece.currentStage > 0) {
                element.classList.add(`frozen-stage-${frozenPiece.currentStage}`);
                element.dataset.frozenStage = frozenPiece.currentStage;
            } else { 
                element.classList.remove('frozen-cell'); 
                delete element.dataset.frozenId;
                element.style.backgroundColor = ''; 
                element.style.backgroundImage = '';
                element.style.border = '';
                element.style.opacity = '';
            }
        });
        if (pointsEarnedThisTurn > 0) {
            updateScore(pointsEarnedThisTurn); 
            if (cellElementsForParticles.length > 0 && cellElementsForParticles[0].element) {
                showFloatingScore(pointsEarnedThisTurn, cellElementsForParticles[0].element);
            }
        }
        
        // --- SISTEMA DE COMBO ELÉCTRICO PARA NIVEL 5 ---
        // COMENTADO TEMPORALMENTE - PARA USO FUTURO
        /*
        if (currentSelectedLevelId === 5 && cellsToClearLogically.size > 0) {
            let electrifiedCellsInLines = 0;
            
            // Contar celdas electrificadas en las líneas completadas
            cellsToClearLogically.forEach(cellData => {
                const { row, col } = cellData;
                const cellKey = `${row}-${col}`;
                if (electrifiedCells.has(cellKey)) {
                    const electrifiedData = electrifiedCells.get(cellKey);
                    if (electrifiedData.hasExistingPiece) {
                        electrifiedCellsInLines++;
                    }
                }
            });
            
            // Aplicar bonus por combo eléctrico
            if (electrifiedCellsInLines > 0) {
                let electricBonus = 0;
                let comboMessage = "";
                
                if (electrifiedCellsInLines === 1) {
                    electricBonus = 50;
                    comboMessage = "⚡ Chispa Eléctrica! +50";
                } else if (electrifiedCellsInLines === 2) {
                    electricBonus = 100;
                    comboMessage = "⚡⚡ Descarga Doble! +100";
                } else if (electrifiedCellsInLines >= 3) {
                    electricBonus = 200;
                    comboMessage = "⚡⚡⚡ TORMENTA ELÉCTRICA! +200";
                    
                    // Efecto especial para combos grandes
                    createElectricStormScreenEffect();
                }
                
                // Añadir puntos del combo
                pointsEarnedThisTurn += electricBonus;
                updateScore(electricBonus);
                
                // Mostrar mensaje de combo
                showElectricBonusMessage(comboMessage, cellElementsForParticles[0]?.element);
                
                // Crear efectos visuales especiales
                createElectricComboEffect(cellsToClearLogically, electrifiedCellsInLines);
                
                console.log(`🌩️ Combo eléctrico: ${electrifiedCellsInLines} celdas electrificadas, bonus: +${electricBonus}`);
            }
        }
        */
        
        console.log(`PARTICLE DEBUG (levels): Celdas para partículas: ${cellElementsForParticles.length}`);
        cellElementsForParticles.forEach(item => {
            if(!item.element) console.error("PARTICLE DEBUG (levels): item.element es undefined");
            else createParticleExplosion(item.element); 
        });
        if (levelConfig.targetFrozenPiecesToClear) {
            const totalClearedFrozenDisplay = document.getElementById('frozen-pieces-cleared-display');
            if (totalClearedFrozenDisplay) {
                const currentClearedCount = frozenPiecesData.filter(p => p.currentStage <= 0).length;
                totalClearedFrozenDisplay.textContent = currentClearedCount;
            }
        }
        // ---- FIN VERIFICACIÓN DE VICTORIA DE NIVEL ----

        // Determinar si los objetivos del nivel se han cumplido para llamar a handleLevelWin
        let objectivesReallyMet = false;
        if (levelConfig.targetScore) { // Para niveles basados en puntaje como el Nivel 1
            if (score >= levelConfig.targetScore) {
                objectivesReallyMet = true;
            }
        } else if (levelConfig.targetFrozenPiecesToClear) { // Para niveles como el Nivel 2
            const finalClearedCount = frozenPiecesData.filter(p => p.currentStage <= 0).length;
            if (finalClearedCount >= levelConfig.targetFrozenPiecesToClear) {
                objectivesReallyMet = true;
            }
        } else if (levelConfig.targetRingsToCollect) { // Para el Nivel 4
            if (ringsCollected >= levelConfig.targetRingsToCollect) {
                objectivesReallyMet = true;
            }
        }
        // Añadir aquí otras condiciones de victoria para futuros tipos de niveles

        if (objectivesReallyMet) {
            console.log("OBJETIVOS DEL NIVEL CUMPLIDOS! Llamando a handleLevelWin.");
            handleLevelWin(levelConfig); 
            return Promise.resolve(linesClearedThisTurnCount); 
        }
    }
    checkGameOver_levels(); 
    return Promise.resolve(linesClearedThisTurnCount); 
}

function handleGameOver_levels(reason = "¡Nivel Fallido!") {
    console.log("Handling Game Over for Levels. Reason:", reason);
    
    // Limpiar sistema de cemento
    cleanupCementSystem();
    
    // Limpiar sistema de anillos
    cleanupRingEffects();
    
    // Limpiar sistema de rayos
    cleanupLightningSystem();
    
    // Limpiar sistema de portales
    cleanupPortalSystem();
    
    if (draggedPieceElement_levels && draggedPieceElement_levels.parentNode === document.body) {
        document.body.removeChild(draggedPieceElement_levels);
        if (activePieceElement_levels) activePieceElement_levels.classList.remove('hidden-original');
    }
    draggedPieceElement_levels = null; 
    selectedPiece_levels = null; 
    activePieceElement_levels = null;
    if (currentShadowCells_levels) { 
        currentShadowCells_levels.forEach(cell => {
            cell.classList.remove('shadow');
            const r_cell = parseInt(cell.dataset.row);
            const c_cell = parseInt(cell.dataset.col);
            if (board[r_cell][c_cell] === 0) { 
                cell.style.backgroundColor = ''; 
            } else if (board[r_cell][c_cell] === 1 && cell.dataset.pieceColor) {
                cell.style.backgroundColor = cell.dataset.pieceColor;
            } 
        });
        currentShadowCells_levels = [];
    }
    document.removeEventListener('mousemove', dragMove_levels);
    document.removeEventListener('touchmove', dragMove_levels, { passive: false });
    document.removeEventListener('mouseup', dragEnd_levels);
    document.removeEventListener('touchend', dragEnd_levels);
    isComboActive = false; 
    currentComboLevel = 0;
    hideComboMessage(); 
    updateComboVisuals(); 
    if (gameOverTitleElement) { 
        gameOverTitleElement.textContent = reason; 
    }
    if (finalScoreElement) { 
        finalScoreElement.textContent = `Puntaje: ${score}`;
    }
    hideLevelObjective();
    if (levelVictoryModalElement && levelVictoryModalElement.classList.contains('visible')) {
        levelVictoryModalElement.classList.remove('visible');
        levelVictoryModalElement.classList.add('hidden');
    }
    if (gameOverModal) { 
        gameOverModal.classList.remove('hidden');
        gameOverModal.classList.add('levels-game-over-active');
        setTimeout(() => { 
          gameOverModal.classList.add('visible');
        }, 20); 
    }
    currentScreen = 'game-over'; 
    if (backgroundCanvas) backgroundCanvas.style.display = 'none'; 
    manageStarAnimation(false); 
    document.body.style.background = 'linear-gradient(to bottom right, #6D5B97, #A77DBA)';
}

function boardIsEmpty_levels() { 
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
            // Considerar cemento como "no vacío" pero no cuenta para game over
            if (board[r][c] === 1 || board[r][c] === 2) return false;
            // El cemento (3) no cuenta como "vacío" pero tampoco impide el juego
        }
    }
    return true;
}

function checkGameOver_levels() {
  const levelConfig = levelsConfiguration[currentSelectedLevelId];
  if (!levelConfig) return false; 
  
  // Verificar límite de tiempo para niveles con maxTimeSeconds (como Nivel 5)
  if (levelConfig.maxTimeSeconds && levelStartTime > 0) {
    const elapsedSeconds = (Date.now() - levelStartTime) / 1000;
    if (elapsedSeconds >= levelConfig.maxTimeSeconds) {
      // Verificar si se cumplió el objetivo antes del tiempo límite
      let objectivesMet = false;
      if (levelConfig.targetScore && score >= levelConfig.targetScore) {
        objectivesMet = true;
      }
      
      if (!objectivesMet) {
        handleGameOver_levels("¡Tiempo Agotado!");
        return true;
      }
    }
  }
  
  if (typeof levelConfig.maxMoves !== 'undefined' && movesRemaining <= 0) {
    let objectivesMet = true; 
    if (levelConfig.targetFrozenPiecesToClear) {
      const finalClearedCount = frozenPiecesData.filter(p => p.currentStage <= 0).length;
      if (finalClearedCount < levelConfig.targetFrozenPiecesToClear) {
        objectivesMet = false;
      }
    }
    if (!objectivesMet) {
      handleGameOver_levels("¡Sin Movimientos!");
      return true; 
    }
  }
  const availablePieceElements = piecesElement.querySelectorAll('.piece'); 
  if (availablePieceElements.length === 0 && !boardIsEmpty_levels()) { 
      handleGameOver_levels("¡Sin Piezas!"); 
      return true;
  }
  let canAnyPieceBePlaced = false;
  for (let pieceElement of availablePieceElements) {
    const pieceMatrix = pieceElement.pieceMatrix; 
    if (!pieceMatrix) continue; 
    for (let r_board = 0; r_board < 10; r_board++) {
      for (let c_board = 0; c_board < 10; c_board++) {
        if (canPlacePiece_levels(pieceMatrix, r_board, c_board)) {
          canAnyPieceBePlaced = true; 
          break; 
        }
      }
      if (canAnyPieceBePlaced) break; 
    }
    if (canAnyPieceBePlaced) break; 
  }
  if (!canAnyPieceBePlaced && availablePieceElements.length > 0) { 
    handleGameOver_levels("¡Sin Movimientos Posibles!");
    return true; 
  }
  return false; 
}

// --- FIN DE FUNCIONES COPIADAS Y ADAPTADAS --- 

// --- NUEVA FUNCIÓN PARA MOSTRAR MODAL DE OBJETIVO INICIAL ---
function showInitialObjectiveModal(levelConfig, continuationCallback) {
    if (!levelObjectiveStartModalElement || !objectiveStartTitleElement || !objectiveStartTextElement) {
        console.error("Faltan elementos del DOM para el modal de objetivo inicial.");
        if (typeof continuationCallback === 'function') {
            continuationCallback(); // Intentar continuar si faltan elementos del modal
        }
        return;
    }

    levelInitializationContinuation = continuationCallback;

    objectiveStartTitleElement.textContent = levelConfig.name || `Nivel ${levelConfig.id}`;
    let objectiveDesc = "";
    if (levelConfig.targetScore) {
        objectiveDesc += `Alcanza ${levelConfig.targetScore} puntos. `;
    }
    if (levelConfig.targetFrozenPiecesToClear) {
        objectiveDesc += `Destruye ${levelConfig.targetFrozenPiecesToClear} bloques de hielo. `;
    }
    if (typeof levelConfig.maxMoves !== 'undefined' && levelConfig.maxMoves > 0) {
        objectiveDesc += `Tienes ${levelConfig.maxMoves} movimientos.`;
    }
    objectiveStartTextElement.textContent = objectiveDesc.trim() || "¡Prepárate para el desafío!";
    
    levelObjectiveStartModalElement.classList.remove('hidden');
    setTimeout(() => {
        levelObjectiveStartModalElement.classList.add('visible');
    }, 20);
}

if (objectiveStartConfirmButtonElement) {
    objectiveStartConfirmButtonElement.addEventListener('click', () => {
        console.log("Botón ¡Entendido! presionado - cerrando modal de objetivo");
        
        // Ocultar el modal
        if (levelObjectiveStartModalElement) {
            levelObjectiveStartModalElement.classList.remove('visible');
            levelObjectiveStartModalElement.classList.add('hidden');
        }
        
        // Ejecutar la continuación si existe
        if (typeof levelInitializationContinuation === 'function') {
            console.log("Ejecutando continuación de inicialización del nivel");
            levelInitializationContinuation();
            levelInitializationContinuation = null; // Limpiar después de usar
        } else {
            console.error("No hay función de continuación definida");
        }
    });
} else {
    console.error("objectiveStartConfirmButtonElement no encontrado en el DOM");
}
// --- FIN FUNCIÓN MODAL OBJETIVO ---

// Funciones principales del modo niveles que usan las adaptadas
function showLevelVictoryModal(levelConfig, starsEarned, finalScore) {
    if (!levelVictoryModalElement) {
        console.error("El modal de victoria de nivel no se encontró en el DOM.");
        return;
    }

    if (levelVictoryTitleElement) levelVictoryTitleElement.textContent = `¡Nivel ${levelConfig.id} Superado!`;
    // levelVictoryMessageElement se puede personalizar más si se desea.
    if (levelVictoryScoreElement) levelVictoryScoreElement.textContent = `Puntaje: ${finalScore}`;

    // Generar estrellas
    if (levelVictoryStarsElement) {
        levelVictoryStarsElement.innerHTML = ''; // Limpiar estrellas anteriores
        for (let i = 0; i < 3; i++) {
            const starSpan = document.createElement('span');
            starSpan.className = i < starsEarned ? 'star filled' : 'star';
            starSpan.innerHTML = i < starsEarned ? '&#9733;' : '&#9734;'; // Estrella llena y vacía
            levelVictoryStarsElement.appendChild(starSpan);
        }
    }

    // Lógica para el botón "Siguiente Nivel"
    if (nextLevelButtonElement) {
        const nextLevelId = levelConfig.id + 1;
        if (levelsConfiguration[nextLevelId] && !levelsConfiguration[nextLevelId].locked) {
            nextLevelButtonElement.classList.remove('hidden');
            nextLevelButtonElement.onclick = () => {
                levelVictoryModalElement.classList.add('hidden');
                levelVictoryModalElement.classList.remove('visible');
                currentSelectedLevelId = nextLevelId;
                initializeLevel(nextLevelId);
            };
        } else {
            nextLevelButtonElement.classList.add('hidden'); // Ocultar si no hay siguiente nivel o está bloqueado
        }
    }

    if (levelVictoryBackToSelectionButtonElement) {
        levelVictoryBackToSelectionButtonElement.onclick = () => {
            levelVictoryModalElement.classList.add('hidden');
            levelVictoryModalElement.classList.remove('visible');
            showLevelSelectionScreen();
        };
    }

    // Ocultar otros modales si estuvieran visibles (improbable, pero por seguridad)
    if (gameOverModal && gameOverModal.classList.contains('visible')) {
        gameOverModal.classList.remove('visible');
        gameOverModal.classList.add('hidden');
    }
    hideLevelObjective(); // Ocultar el display de objetivo del nivel (el compacto)

    levelVictoryModalElement.classList.remove('hidden');
    setTimeout(() => { // Para la transición de opacidad si se añade en CSS
        levelVictoryModalElement.classList.add('visible');
    }, 20);
    currentScreen = 'level-victory'; // Nuevo estado de pantalla
}

function handleLevelWin(levelConfig) {
    console.log(`¡Nivel ${levelConfig.id} completado! Puntuación: ${score}, Criterio Estrellas: ${levelConfig.starCriteria}`);
    
    // Limpiar sistemas
    cleanupCementSystem();
    cleanupRingEffects();
    cleanupLightningSystem();
    cleanupPortalSystem();
    
    let starsEarned = 0;

    if (levelConfig.starCriteria === 'time' && levelConfig.starsThresholds) {
        const elapsedSeconds = (Date.now() - levelStartTime) / 1000;
        console.log(`Nivel completado en ${elapsedSeconds.toFixed(2)} segundos.`);
        if (elapsedSeconds <= levelConfig.starsThresholds.threeStars) {
            starsEarned = 3;
        } else if (elapsedSeconds <= levelConfig.starsThresholds.twoStars) {
            starsEarned = 2;
        } else {
            starsEarned = 1;
        }
        console.log(`Estrellas por tiempo: ${starsEarned}`);
    } else if (levelConfig.starCriteria === 'movesRemaining' && levelConfig.starsThresholds) {
        console.log(`Nivel completado con ${movesRemaining} movimientos restantes.`);
        if (movesRemaining >= levelConfig.starsThresholds.threeStars) {
            starsEarned = 3;
        } else if (movesRemaining >= levelConfig.starsThresholds.twoStars) {
            starsEarned = 2;
        } else if (movesRemaining >= 0) { // Asegurarse que al menos completó el nivel
            starsEarned = 1;
        } else {
            starsEarned = 0; // No debería ocurrir si ganó
        }
        console.log(`Estrellas por movimientos: ${starsEarned}`);
    } else {
        // Fallback: Si no hay criterio específico de estrellas, pero se cumplió el objetivo principal del nivel.
        // (Ej. Nivel 1 SÍ tiene criterio de tiempo, así que esto no se ejecutaría para Nivel 1)
        // (Ej. Nivel 2 SÍ tiene criterio de movimientos, así que esto no se ejecutaría para Nivel 2)
        // Esto es para niveles futuros sin starCriteria definidos pero que se ganan.
        console.log("No hay criterio de estrellas específico o no se aplicó, otorgando 1 estrella por defecto por ganar.");
        starsEarned = 1; 
    }
    
    // Asegurarse de que las estrellas no excedan 3, por si acaso.
    starsEarned = Math.max(0, Math.min(starsEarned, 3));

    if (!playerLevelData[levelConfig.id] || playerLevelData[levelConfig.id].stars < starsEarned) {
        playerLevelData[levelConfig.id] = { stars: starsEarned };
        console.log(`Nivel ${levelConfig.id} - Estrellas obtenidas: ${starsEarned}. Datos guardados:`, playerLevelData);
        // localStorage.setItem('blockTrisPlayerLevelData', JSON.stringify(playerLevelData));
    }

    const nextLevelId = levelConfig.id + 1;
    if (levelsConfiguration[nextLevelId]) {
        levelsConfiguration[nextLevelId].locked = false;
        console.log(`Nivel ${nextLevelId} desbloqueado.`);
    }

    console.log(`DEBUG: Antes de llamar a showLevelVictoryModal, starsEarned = ${starsEarned}, finalScore = ${score}`); // DEBUG
    showLevelVictoryModal(levelConfig, starsEarned, score);
    
}

function showLevelSelectionScreen() {
    console.log("Mostrando pantalla de selección de niveles...");
    if (levelVictoryModalElement && levelVictoryModalElement.classList.contains('visible')) {
        levelVictoryModalElement.classList.remove('visible');
        levelVictoryModalElement.classList.add('hidden');
    }
    if (gameOverModal && gameOverModal.classList.contains('levels-game-over-active')) {
        gameOverModal.classList.remove('levels-game-over-active');
        gameOverModal.classList.remove('visible');
        gameOverModal.classList.add('hidden');
    }
    currentScreen = 'level-select'; // Actualizar estado global de pantalla
    updateScreenVisibility(); // Esta función está en script.js pero debería ser accesible globalmente

    // Aquí podríamos actualizar dinámicamente las tarjetas de nivel (estrellas, bloqueos)
    // Por ahora, el HTML es estático, pero en el futuro lo haríamos aquí.
    renderLevelCards(); 

    // Añadir listeners a las tarjetas de nivel (si no se hizo ya en renderLevelCards)
    const levelCards = document.querySelectorAll('#levels-grid .level-card');
    levelCards.forEach(card => {
        card.addEventListener('click', handleLevelCardClick);
    });
}

function handleLevelCardClick(event) {
    const card = event.currentTarget;
    const levelId = parseInt(card.dataset.levelId);
    const levelConfig = levelsConfiguration[levelId];

    if (levelConfig && !levelConfig.locked) {
        console.log(`Nivel ${levelId} seleccionado.`);
        currentSelectedLevelId = levelId;
        initializeLevel(levelId);
    } else if (levelConfig && levelConfig.locked) {
        console.log(`Nivel ${levelId} está bloqueado.`);
        // Podríamos mostrar un mensaje o efecto visual
        alert("Este nivel está bloqueado. ¡Completa los niveles anteriores!");
    } else {
        console.error(`Configuración no encontrada para el nivel ${levelId}`);
    }
}

function renderLevelCards() {
    const grid = document.getElementById('levels-grid');
    if (!grid) return;
    
    // Crear contenedor si no existe
    let container = grid.parentElement.querySelector('.levels-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'levels-container';
        grid.parentElement.appendChild(container);
        container.appendChild(grid);
    }
    
    grid.innerHTML = ''; // Limpiar tarjetas existentes

    Object.values(levelsConfiguration).forEach(level => {
        const card = document.createElement('div');
        card.className = 'level-card';
        card.dataset.levelId = level.id;

        const numberSpan = document.createElement('span');
        numberSpan.className = 'level-number';
        numberSpan.textContent = level.id;
        card.appendChild(numberSpan);

        const starsDiv = document.createElement('div');
        starsDiv.className = 'level-stars';
        const userStars = playerLevelData[level.id] ? playerLevelData[level.id].stars : 0;
        for (let i = 0; i < 3; i++) {
            const starSpan = document.createElement('span');
            starSpan.className = i < userStars ? 'star filled' : 'star';
            starsDiv.appendChild(starSpan);
        }
        card.appendChild(starsDiv);

        if (level.locked) {
            card.classList.add('locked');
            const lockIcon = document.createElement('span');
            lockIcon.className = 'lock-icon';
            lockIcon.textContent = '🔒';
            card.appendChild(lockIcon);
        } else {
            const objectiveSpan = document.createElement('span');
            objectiveSpan.className = 'level-objective';
            objectiveSpan.textContent = level.objectiveText || `Objetivo: ${level.targetScore || 'N/A'} Pts`;
            card.appendChild(objectiveSpan);
        }
        grid.appendChild(card);
    });
    
    // Configurar detección de scroll para móviles
    setupMobileScrollDetection();
}

// --- FUNCIÓN PARA MEJORAR NAVEGACIÓN MÓVIL ---
function setupMobileScrollDetection() {
    const levelScreen = document.getElementById('level-selection-screen');
    if (!levelScreen) return;
    
    // Detectar primer scroll para ocultar indicador
    let hasScrolled = false;
    const handleScroll = () => {
        if (!hasScrolled && levelScreen.scrollTop > 50) {
            hasScrolled = true;
            levelScreen.classList.add('scrolled');
            levelScreen.removeEventListener('scroll', handleScroll);
        }
    };
    
    // Limpiar listener anterior si existe
    levelScreen.removeEventListener('scroll', handleScroll);
    levelScreen.addEventListener('scroll', handleScroll, { passive: true });
    
    // Resetear estado de scroll
    levelScreen.classList.remove('scrolled');
    
    // Mejorar experiencia táctil en móviles
    if (window.innerWidth <= 768) {
        // Añadir clase para estilos específicos de móvil
        levelScreen.classList.add('mobile-view');
        
        // Scroll suave al inicio
        levelScreen.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        levelScreen.classList.remove('mobile-view');
    }
}

function initializeLevel(levelId) {
    console.log(`Inicializando Nivel ${levelId}...`);
    
    const performInitialization = async () => {
        showInitializationLoader('Preparando nivel y analizando rendimiento...'); // Mostrar loader
        
        try {
            // Inicializar sistema de detección de rendimiento y esperar a que termine
            if (!devicePerformance.isInitialized) {
                await devicePerformance.initialize();
                console.log("🚀 Sistema de optimización de rendimiento activado");
                console.log("📊 Reporte de rendimiento:", devicePerformance.getPerformanceReport());
            } else {
                 // Si ya está inicializado, podríamos forzar una re-evaluación rápida o simplemente continuar
                 // Por ahora, solo mostramos un mensaje y continuamos.
                 console.log("🔁 Sistema de optimización ya inicializado. Usando configuraciones existentes.");
            }
        } catch (error) {
            console.warn("⚠️ Error al inicializar detección de rendimiento:", error);
            // Continuar igualmente con configuraciones por defecto si falla la detección
        } finally {
            hideInitializationLoader(); // Ocultar loader ANTES de mostrar el modal de objetivo
        }
        
        const levelConfig = levelsConfiguration[levelId];
        if (!levelConfig) {
            console.error(`No se encontró configuración para el nivel ${levelId}`);
            navigateTo('level-select'); 
            return;
        }
        currentSelectedLevelId = levelId;

        // Mostrar el modal de objetivo primero
        showInitialObjectiveModal(levelConfig, () => {
            // ... (resto del callback sin cambios)
            console.log("Continuando con la inicialización del nivel después del modal de objetivo.");
            levelStartTime = 0; 
            if (levelConfig.starCriteria === 'time') {
                levelStartTime = Date.now();
                console.log("Temporizador de nivel iniciado.");
            }

            if (levelVictoryModalElement && levelVictoryModalElement.classList.contains('visible')) {
                levelVictoryModalElement.classList.remove('visible');
                levelVictoryModalElement.classList.add('hidden');
            }
            if (gameOverModal && gameOverModal.classList.contains('levels-game-over-active')) {
                gameOverModal.classList.remove('levels-game-over-active');
                gameOverModal.classList.remove('visible');
                gameOverModal.classList.add('hidden');
            }

            currentGameMode = 'levels'; 
            currentScreen = 'gameplay';
            updateScreenVisibility(); 
            
            board.length = 0; 
            for (let i = 0; i < 10; i++) { 
                board.push(Array(10).fill(0));
            }
            score = 0;
            updateScore(0); 

            isComboActive = false;
            linesClearedForComboActivation = 0;
            timeOfFirstLineClearForActivation = 0;
            linesClearedInCurrentComboWindow = 0;
            currentComboLevel = 0;
            clearTimeout(comboProgressionTimeoutId);
            comboProgressionTimeoutId = null;
            clearTimeout(comboActivationHelperTimeoutId);
            comboActivationHelperTimeoutId = null;
            if (typeof hideComboMessage === 'function') hideComboMessage();    
            if (typeof updateComboVisuals === 'function') updateComboVisuals(); 
            if (backgroundCanvas) backgroundCanvas.style.display = 'none'; 
            if (typeof manageStarAnimation === 'function') manageStarAnimation(false);
            document.body.style.background = 'linear-gradient(to bottom right, #6D5B97, #A77DBA)'; 

            if(piecesElement) piecesElement.innerHTML = '';
            displayPieces_levels(); 

            createBoardCells(); 

            frozenPiecesData = []; 
            if (levelConfig.initialFrozenPieces && levelConfig.initialFrozenPieces.length > 0) {
                levelConfig.initialFrozenPieces.forEach(frozenPieceInfo => {
                    const { row, col, initialStage, id } = frozenPieceInfo;
                    if (board[row] && typeof board[row][col] !== 'undefined') {
                        board[row][col] = 2; 
                        const cellElement = boardElement.querySelector(`[data-row='${row}'][data-col='${col}']`);
                        if (cellElement) {
                            cellElement.classList.add('frozen-cell');
                            cellElement.classList.add(`frozen-stage-${initialStage}`);
                            cellElement.dataset.frozenId = id; 
                            cellElement.dataset.frozenStage = initialStage;
                        }
                        frozenPiecesData.push({ id, row, col, currentStage: initialStage, initialStage });
                    }
                });
                console.log("Piezas congeladas inicializadas:", frozenPiecesData);
            }

            if (typeof levelConfig.maxMoves !== 'undefined') {
                movesRemaining = levelConfig.maxMoves;
            } else {
                movesRemaining = 0; 
            }
            
            requestAnimationFrame(() => {
                 requestAnimationFrame(() => { 
                    if (particleCanvas && boardElement && gameContainerElement) { 
                        if (currentScreen === 'gameplay' && boardElement.offsetWidth > 0) {
                            setupParticleCanvas();
                        } else {
                            console.warn("PARTICLE DEBUG: No se configuró el canvas porque la pantalla de juego no está activa o boardElement no tiene dimensiones.");
                        }
                    } else {
                        console.warn("PARTICLE DEBUG: No se pudo configurar el canvas (desde rAF en initializeLevel) porque faltan elementos.");
                    }
                });
            });
            particles = [];
            if (animationFrameIdParticles) {
                cancelAnimationFrame(animationFrameIdParticles);
                animationFrameIdParticles = null;
                if(particleCtx && particleCanvas) particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
            }

            displayLevelObjective(levelConfig); 

            if (levelConfig.cementRainInterval) {
                if (devicePerformance.shouldUseCementAnimation()) {
                    startCementRain(levelConfig);
                } else {
                    console.log("🔧 Animación de cemento deshabilitada por optimización de rendimiento");
                    startSimplifiedCementRain(levelConfig);
                }
            }

            if (levelConfig.targetRingsToCollect) {
                initializeRingSystem(levelConfig);
            }

            if (levelConfig.lightningInterval) {
                if (devicePerformance.shouldReduceLightningEffects()) {
                    console.log("🔧 Efectos de rayos reducidos por optimización de rendimiento");
                    startSimplifiedLightningStorm(levelConfig);
                } else {
                    startLightningStorm(levelConfig);
                }
            }

            if (levelConfig.teleportInterval) {
                if (devicePerformance.shouldSimplifyPortalEffects()) {
                    console.log("🔧 Efectos de portales simplificados por optimización de rendimiento");
                    startSimplifiedDimensionalPortals(levelConfig);
                } else {
                    startDimensionalPortals(levelConfig);
                }
            }

            console.log(`Nivel ${levelId} inicializado correctamente.`);
            
            addPerformanceInfoButton();
        });
    };
    
    performInitialization();
}

function displayLevelObjective(levelConfig) { // VERSIÓN SIMPLIFICADA
    let objectiveDisplay = document.getElementById('level-info-display');
    if (!objectiveDisplay) {
        objectiveDisplay = document.createElement('div');
        objectiveDisplay.id = 'level-info-display';
        // Insertarlo antes del game-container, dentro de game-area si es posible, o como fallback antes del game-container
        const gameAreaElement = document.getElementById('game-area');
        const gameContainer = document.getElementById('game-container');
        if (gameAreaElement && gameContainer) {
            gameAreaElement.insertBefore(objectiveDisplay, gameContainer);
        } else if (gameContainer) {
            gameContainer.parentNode.insertBefore(objectiveDisplay, gameContainer);
        } else {
            document.body.appendChild(objectiveDisplay); 
            console.warn("#game-container o #game-area no encontrados, #level-info-display añadido al body.");
        }
    }

    let content = ""; // Reiniciar contenido
    
    // Nivel 5 - Tormenta Eléctrica con temporizador
    if (levelConfig.maxTimeSeconds && levelStartTime > 0) { // Condición generalizada para cualquier nivel con temporizador
        const remainingTime = Math.max(0, levelConfig.maxTimeSeconds - Math.floor((Date.now() - levelStartTime) / 1000));
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        let scoreText = "";
        if (levelConfig.targetScore) {
            scoreText = `<span class="info-label">Meta:</span> ${levelConfig.targetScore} Pts | `;
        }

        content = `<p>${scoreText}<span class="info-label">Tiempo:</span> <span id="time-remaining-display" class="${remainingTime <= 15 ? 'critical' : remainingTime <= 30 ? 'warning' : ''}">${timeString}</span></p>`;
        
        // Actualizar cada segundo
        setTimeout(() => {
            // Asegurarse de que la actualización solo ocurra si el nivel actual sigue siendo el mismo y tiene temporizador
            if (currentSelectedLevelId === levelConfig.id && levelConfig.maxTimeSeconds && levelStartTime > 0) {
                displayLevelObjective(levelsConfiguration[currentSelectedLevelId]); // Usar la configuración del nivel actual
            }
        }, 1000);
    } else if (levelConfig.targetScore && !levelConfig.targetFrozenPiecesToClear && !levelConfig.targetRingsToCollect && typeof levelConfig.maxMoves === 'undefined') { // Solo Nivel 1 (o similar)
        content = `<p><span class="info-label">Meta:</span> ${levelConfig.targetScore} Pts</p>`;
    } else { // Para niveles con movimientos y/o objetivos específicos
        let parts = [];
        if (typeof levelConfig.maxMoves !== 'undefined') {
            parts.push(`<span class="info-label">Mov:</span> <span id="moves-remaining-display">${movesRemaining}</span>`);
        }
        if (levelConfig.targetFrozenPiecesToClear) {
            const clearedCount = frozenPiecesData.filter(p => p.currentStage <= 0).length;
            parts.push(`<span class="info-label">Hielo:</span> <span id="frozen-pieces-cleared-display">${clearedCount}</span>/${levelConfig.targetFrozenPiecesToClear}`);
        }
        if (levelConfig.targetRingsToCollect) {
            parts.push(`<span class="info-label">Anillos:</span> <span id="rings-collected-display">${ringsCollected}</span>/${levelConfig.targetRingsToCollect}`);
        }
        if (parts.length > 0) {
            content = `<p>${parts.join(' | ')}</p>`;
        } else if (levelConfig.objectiveText) { // Fallback si no hay contadores específicos pero sí texto
             content = `<p>${levelConfig.objectiveText}</p>`; // Esto podría ser muy largo, pero es un fallback
        }
    }
    
    objectiveDisplay.innerHTML = content;
    if (content === "") {
        objectiveDisplay.classList.add('hidden'); // Ocultar si no hay nada que mostrar
    } else {
        objectiveDisplay.classList.remove('hidden');
    }
}

function hideLevelObjective() {
    const objectiveDisplay = document.getElementById('level-info-display');
    if (objectiveDisplay) {
        objectiveDisplay.classList.add('hidden');
    }
}

// ... (resto de las funciones originales de levels_mode.js)
// ... (resto de las funciones originales de script.js)
// ... (resto de las funciones originales de levels_mode.js) 

// --- CLASE PARA EFECTOS DE ANILLOS RECOLECTADOS ---
class CollectedRingEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.life = 60; // Duración del efecto en frames
        this.maxLife = 60;
        
        // Crear partículas doradas
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x,
                y: y,
                speedX: (Math.random() - 0.5) * 6,
                speedY: (Math.random() - 0.5) * 6 - 2,
                life: Math.random() * 40 + 20,
                maxLife: Math.random() * 40 + 20,
                size: Math.random() * 4 + 2,
                update() {
                    this.life--;
                    this.x += this.speedX;
                    this.y += this.speedY;
                    this.speedY += 0.15; // Gravedad ligera
                    this.speedX *= 0.98; // Fricción
                }
            });
        }
    }
    
    getRandomGoldColor() {
        const goldColors = [
            '#FFD700', // Oro clásico
            '#FFA500', // Naranja dorado
            '#FFFF00', // Amarillo brillante
            '#FFE55C', // Oro claro
            '#DAA520'  // Oro oscuro
        ];
        return goldColors[Math.floor(Math.random() * goldColors.length)];
    }
    
    update() {
        this.life--;
        
        // Actualizar partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        return this.life <= 0 && this.particles.length === 0;
    }
    
    draw() {
        // Dibujar usando elementos DOM en lugar de canvas para mayor compatibilidad
        this.particles.forEach(particle => {
            if (particle.life > 0) {
                // Crear elemento temporal para la partícula si no existe
                if (!particle.element) {
                    particle.element = document.createElement('div');
                    particle.element.className = 'ring-particle';
                    particle.element.style.position = 'absolute';
                    particle.element.style.pointerEvents = 'none';
                    particle.element.style.zIndex = '2000';
                    particle.element.style.width = particle.size + 'px';
                    particle.element.style.height = particle.size + 'px';
                    particle.element.style.borderRadius = '50%';
                    particle.element.style.backgroundColor = particle.color;
                    particle.element.style.boxShadow = `0 0 ${particle.size}px ${particle.color}`;
                    document.body.appendChild(particle.element);
                }
                
                // Actualizar posición y opacidad
                particle.element.style.left = particle.x + 'px';
                particle.element.style.top = particle.y + 'px';
                particle.element.style.opacity = particle.life / particle.maxLife;
                particle.element.style.transform = `rotate(${particle.rotation}rad) scale(${particle.life / particle.maxLife})`;
            }
        });
    }
    
    cleanup() {
        // Limpiar elementos DOM de las partículas
        this.particles.forEach(particle => {
            if (particle.element && particle.element.parentNode) {
                particle.element.parentNode.removeChild(particle.element);
            }
        });
        this.particles = [];
    }
} 

// --- FUNCIONES DEL SISTEMA DE ANILLOS ---
function addRingToPiece(pieceElement) {
    if (!pieceElement || !pieceElement.pieceMatrix) return;
    
    const matrix = pieceElement.pieceMatrix;
    const validPositions = [];
    
    // Encontrar todas las posiciones válidas (bloques de la pieza)
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] === 1) {
                validPositions.push({ row: r, col: c });
            }
        }
    }
    
    if (validPositions.length === 0) return;
    
    // Elegir posición aleatoria para el anillo
    const randomPos = validPositions[Math.floor(Math.random() * validPositions.length)];
    
    // Crear datos del anillo
    const ringId = `ring_${++ringIdCounter}`;
    pieceElement.ringData = {
        hasRing: true,
        ringPosition: randomPos,
        ringId: ringId
    };
    
    // Añadir clase visual
    pieceElement.classList.add('piece-with-ring');
    
    // Crear elemento visual del anillo
    createRingElement(pieceElement, randomPos, ringId);
    
    console.log(`Anillo ${ringId} añadido a pieza en posición [${randomPos.row}, ${randomPos.col}]`);
}

function createRingElement(pieceElement, position, ringId) {
    const ringElement = document.createElement('div');
    ringElement.className = 'golden-ring';
    ringElement.id = ringId;
    
    // NUEVO MÉTODO: Usar el mismo sistema que funciona en el tablero
    // En lugar de calcular posiciones manualmente, vamos a posicionar el anillo
    // directamente sobre la celda específica de la pieza
    
    // Encontrar la celda específica donde debe ir el anillo
    const pieceCells = pieceElement.querySelectorAll('.piece-block');
    const pieceMatrix = pieceElement.pieceMatrix;
    
    // Calcular el índice de la celda objetivo en el array de celdas
    let targetCellIndex = -1;
    let currentIndex = 0;
    
    for (let r = 0; r < pieceMatrix.length; r++) {
        for (let c = 0; c < pieceMatrix[r].length; c++) {
            if (pieceMatrix[r][c] === 1) { // Es una celda de pieza
                if (r === position.row && c === position.col) {
                    targetCellIndex = currentIndex;
                    break;
                }
                currentIndex++;
            }
        }
        if (targetCellIndex !== -1) break;
    }
    
    if (targetCellIndex !== -1 && pieceCells[targetCellIndex]) {
        const targetCell = pieceCells[targetCellIndex];
        
        // Aplicar el mismo método que funciona en el tablero
        targetCell.style.position = 'relative';
        
        // Configurar el anillo con posicionamiento absoluto centrado
        ringElement.style.position = 'absolute';
        ringElement.style.top = '50%';
        ringElement.style.left = '50%';
        ringElement.style.transform = 'translate(-50%, -50%)';
        ringElement.style.width = '14px'; // Ligeramente más pequeño para las piezas
        ringElement.style.height = '14px';
        ringElement.style.margin = '0';
        ringElement.style.padding = '0';
        ringElement.style.boxSizing = 'border-box';
        ringElement.style.zIndex = '1002';
        ringElement.style.pointerEvents = 'none';
        ringElement.style.userSelect = 'none';
        ringElement.style.touchAction = 'none';
        
        // Añadir el anillo directamente a la celda específica
        targetCell.appendChild(ringElement);
        
        console.log(`DEBUG: Anillo ${ringId} añadido directamente a la celda [${position.row}, ${position.col}] usando el método del tablero`);
    } else {
        console.error(`No se pudo encontrar la celda objetivo para el anillo en posición [${position.row}, ${position.col}]`);
    }
    
    // Asegurar que la pieza tenga overflow visible
    pieceElement.style.overflow = 'visible';
}

function collectRing(pieceElement) {
    if (!pieceElement || !pieceElement.ringData || !pieceElement.ringData.hasRing) {
        return false;
    }
    
    const ringData = pieceElement.ringData;
    const ringElement = document.getElementById(ringData.ringId);
    
    if (ringElement) {
        // Obtener posición del anillo para el efecto
        const ringRect = ringElement.getBoundingClientRect();
        const centerX = ringRect.left + ringRect.width / 2;
        const centerY = ringRect.top + ringRect.height / 2;
        
        // Crear efecto de recolección
        const effect = new CollectedRingEffect(centerX, centerY);
        collectedRingEffects.push(effect);
        
        // Iniciar animación de efectos si no está corriendo
        if (!ringEffectAnimationId) {
            animateRingEffects();
        }
        
        // Animar la recolección del anillo
        ringElement.classList.add('ring-collected');
        
        // Remover el anillo después de la animación
        setTimeout(() => {
            if (ringElement.parentNode) {
                ringElement.parentNode.removeChild(ringElement);
            }
        }, 600);
        
        // Actualizar contador
        ringsCollected++;
        updateRingsDisplay();
        
        // Limpiar datos del anillo de la pieza
        pieceElement.ringData.hasRing = false;
        pieceElement.classList.remove('piece-with-ring');
        
        console.log(`Anillo ${ringData.ringId} recolectado! Total: ${ringsCollected}`);
        
        // Mostrar puntuación flotante
        showFloatingScore(50, ringElement); // 50 puntos por anillo
        updateScore(50);
        
        return true;
    }
    
    return false;
}

function animateRingEffects() {
    // Actualizar todos los efectos de anillos
    for (let i = collectedRingEffects.length - 1; i >= 0; i--) {
        const effect = collectedRingEffects[i];
        const finished = effect.update();
        effect.draw();
        
        if (finished) {
            effect.cleanup();
            collectedRingEffects.splice(i, 1);
        }
    }
    
    // Continuar animación si hay efectos
    if (collectedRingEffects.length > 0) {
        ringEffectAnimationId = requestAnimationFrame(animateRingEffects);
    } else {
        ringEffectAnimationId = null;
    }
}

function updateRingsDisplay() {
    const ringsDisplay = document.getElementById('rings-collected-display');
    if (ringsDisplay) {
        ringsDisplay.textContent = ringsCollected;
    }
}

function initializeRingSystem(levelConfig) {
    if (!levelConfig.targetRingsToCollect) return;
    
    console.log("Inicializando sistema de anillos...");
    
    // Resetear contadores
    ringsCollected = 0;
    totalRingsInLevel = levelConfig.targetRingsToCollect;
    ringIdCounter = 0;
    
    // Limpiar efectos anteriores
    cleanupRingEffects();
    
    // Actualizar display
    updateRingsDisplay();
    
    console.log(`Sistema de anillos inicializado. Objetivo: ${totalRingsInLevel} anillos`);
}

function cleanupRingEffects() {
    // Detener animación
    if (ringEffectAnimationId) {
        cancelAnimationFrame(ringEffectAnimationId);
        ringEffectAnimationId = null;
    }
    
    // Limpiar efectos
    collectedRingEffects.forEach(effect => effect.cleanup());
    collectedRingEffects = [];
    
    // Limpiar partículas DOM restantes
    const particles = document.querySelectorAll('.ring-particle');
    particles.forEach(particle => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    });
    
    console.log("Sistema de anillos limpiado");
}

// --- FUNCIONES DEL SISTEMA DE RAYOS ELÉCTRICOS ---

function setupLightningCanvas() {
    // Crear canvas para efectos de rayos si no existe
    if (!lightningCanvas) {
        lightningCanvas = document.createElement('canvas');
        lightningCanvas.id = 'lightningCanvas';
        lightningCanvas.style.position = 'fixed';
        lightningCanvas.style.top = '0';
        lightningCanvas.style.left = '0';
        lightningCanvas.style.pointerEvents = 'none';
        lightningCanvas.style.zIndex = '1500';
        lightningCanvas.style.background = 'transparent'; // Asegurar fondo transparente
        document.body.appendChild(lightningCanvas);
        lightningCtx = lightningCanvas.getContext('2d');
        
        console.log("Canvas de rayos creado y añadido al DOM");
    }
    
    // Ajustar tamaño del canvas al tamaño de la ventana
    lightningCanvas.width = window.innerWidth;
    lightningCanvas.height = window.innerHeight;
    
    // Asegurar que el canvas esté visible
    lightningCanvas.style.display = 'block';
    lightningCanvas.style.visibility = 'visible';
    lightningCanvas.style.opacity = '1';
    
    console.log("Canvas de rayos configurado:", lightningCanvas.width, "x", lightningCanvas.height);
}

function startLightningStorm(levelConfig) {
    if (!levelConfig.lightningInterval) return;
    
    console.log("🌩️ Iniciando tormenta eléctrica cada", levelConfig.lightningInterval / 1000, "segundos");
    setupLightningCanvas();
    
    // Inicializar intensidad de tormenta
    stormIntensity = 1;
    stormStartTime = Date.now();
    
    // Función para programar el próximo rayo
    const scheduleNextLightning = () => {
        lightningTimeoutId = setTimeout(() => {
            triggerLightningWarning(levelConfig);
        }, levelConfig.lightningInterval);
    };
    
    // Programar el primer rayo más rápido para crear tensión inmediata
    const firstLightningDelay = Math.min(5000, levelConfig.lightningInterval / 2); // 5 segundos o la mitad del intervalo
    console.log(`⚡ Primer rayo programado en ${firstLightningDelay / 1000} segundos`);
    
    lightningTimeoutId = setTimeout(() => {
        triggerLightningWarning(levelConfig);
        // Después del primer rayo, usar el intervalo normal
        lightningTimeoutId = setTimeout(() => {
            scheduleNextLightning();
        }, levelConfig.lightningInterval);
    }, firstLightningDelay);
    
    // FORZAR inicio de animación inmediatamente
    if (!lightningAnimationId) {
        console.log("🎬 Iniciando animación de efectos de rayos");
        lightningAnimationId = requestAnimationFrame(animateLightningEffects);
    }
}

function triggerLightningWarning(levelConfig) {
    // DEBUG FLAGS
    window.debugPortalCanvasOnce = true;
    window.debugTeleportPieceOnce = true;

    if (!boardElement) return;
    
    // Calcular intensidad de tormenta basada en tiempo transcurrido
    const elapsedTime = Date.now() - stormStartTime;
    const timeProgress = Math.min(1, elapsedTime / (levelConfig.maxTimeSeconds * 1000));
    stormIntensity = 1 + timeProgress * 2; // Intensidad de 1 a 3
    
    console.log(`🌩️ Intensidad de tormenta: ${stormIntensity.toFixed(2)} (progreso: ${(timeProgress * 100).toFixed(1)}%)`);
    
    // Seleccionar objetivo aleatorio en el tablero
    const targetRow = Math.floor(Math.random() * 10);
    const targetCol = Math.floor(Math.random() * 10);
    
    // GUARDAR las coordenadas exactas para usar en el impacto
    currentLightningTarget = { row: targetRow, col: targetCol };
    isLightningWarningActive = true;
    
    console.log(`⚠️ Advertencia de rayo en posición [${targetRow}, ${targetCol}] con intensidad ${stormIntensity.toFixed(2)}`);
    
    // Mostrar advertencia visual
    showLightningWarning(targetRow, targetCol);
    
    // Programar el impacto del rayo - USAR LAS MISMAS COORDENADAS
    lightningWarningTimeoutId = setTimeout(() => {
        strikeLightning(currentLightningTarget.row, currentLightningTarget.col, levelConfig);
        
        // Programar el próximo rayo si la configuración del nivel actual lo permite
        const currentLevelConfig = levelsConfiguration[currentSelectedLevelId];
        if (currentLevelConfig && currentLevelConfig.lightningInterval && currentGameMode === 'levels') {
            // Reducir ligeramente el intervalo con la intensidad (más rayos cuando es más intenso)
            // Asegurarse de que stormIntensity es un número y >= 1
            const currentStormIntensity = (typeof stormIntensity === 'number' && stormIntensity >= 1) ? stormIntensity : 1;
            let adjustedInterval = currentLevelConfig.lightningInterval;
            
            // Aplicar ajuste de intensidad (similar a como se hizo con portales, opcionalmente)
            // Por ahora, mantendremos la lógica original de reducción si la tormenta está activa.
            // El factor (currentStormIntensity - 1) * 0.1 determina la reducción.
            // Limitar la reducción para que el intervalo no sea menor al 20% del original.
            const reductionMultiplier = Math.max(0.20, 1 - (currentStormIntensity - 1) * 0.1);
            adjustedInterval = currentLevelConfig.lightningInterval * reductionMultiplier;
            
            // Asegurar un intervalo mínimo.
            adjustedInterval = Math.max(500, adjustedInterval); // Mínimo 0.5 segundos

            console.log(`⚡ Próximo rayo en ${adjustedInterval / 1000} segundos (Intervalo base: ${currentLevelConfig.lightningInterval / 1000}, Intensidad: ${currentStormIntensity.toFixed(2)})`);
            
            lightningTimeoutId = setTimeout(() => {
                // Verificar que seguimos en el mismo nivel con rayos antes de volver a disparar
                if (currentSelectedLevelId === currentLevelConfig.id && levelsConfiguration[currentSelectedLevelId]?.lightningInterval) {
                    triggerLightningWarning(levelsConfiguration[currentSelectedLevelId]); // Usar la config más actualizada
                }
            }, adjustedInterval);
        } else {
            if (!(currentLevelConfig && currentLevelConfig.lightningInterval)) {
                console.log("⚡ No se reprograma rayo: el nivel actual no tiene lightningInterval.");
            }
        }
    }, levelConfig.lightningWarningTime);
}

function showLightningWarning(targetRow, targetCol) {
    if (!boardElement) return;
    
    const cellElement = boardElement.querySelector(`[data-row='${targetRow}'][data-col='${targetCol}']`);
    if (!cellElement) return;
    
    // Añadir clase de advertencia
    cellElement.classList.add('lightning-warning');
    
    // Crear efecto de nubes oscuras MEJORADO
    createStormClouds();
    
    // Sonido de trueno lejano (simulado con vibración de pantalla)
    if (gameContainerElement) {
        gameContainerElement.classList.add('storm-rumble');
        setTimeout(() => {
            gameContainerElement.classList.remove('storm-rumble');
        }, 2000);
    }
    
    // Añadir efecto de tormenta al contenedor del juego
    if (gameContainerElement) {
        gameContainerElement.classList.add('lightning-active');
    }
}

function createStormClouds() {
    // Crear elemento de nubes si no existe
    let stormCloudsElement = document.getElementById('storm-clouds-overlay');
    if (!stormCloudsElement) {
        stormCloudsElement = document.createElement('div');
        stormCloudsElement.id = 'storm-clouds-overlay';
        stormCloudsElement.className = 'storm-clouds';
        document.body.appendChild(stormCloudsElement);
    }
    
    // Mostrar las nubes
    stormCloudsElement.style.display = 'block';
    stormCloudsElement.style.opacity = '1';
    
    // Oscurecer ligeramente toda la pantalla en el canvas también
    if (lightningCanvas && lightningCtx) {
        lightningCtx.save();
        lightningCtx.fillStyle = 'rgba(20, 20, 40, 0.2)';
        lightningCtx.fillRect(0, 0, lightningCanvas.width, lightningCanvas.height);
        lightningCtx.restore();
    }
    
    // Programar la limpieza de las nubes después del impacto
    setTimeout(() => {
        if (stormCloudsElement) {
            stormCloudsElement.style.opacity = '0';
            setTimeout(() => {
                if (stormCloudsElement) {
                    stormCloudsElement.style.display = 'none';
                }
            }, 1000);
        }
    }, 3000);
}

function strikeLightning(targetRow, targetCol, levelConfig) {
    console.log(`⚡ RAYO IMPACTA en [${targetRow}, ${targetCol}] - DESTRUYENDO ÁREA 3x3!`);
    
    isLightningWarningActive = false;
    currentLightningTarget = null;
    
    // Limpiar advertencia visual
    const cellElement = boardElement.querySelector(`[data-row='${targetRow}'][data-col='${targetCol}']`);
    if (cellElement) {
        cellElement.classList.remove('lightning-warning');
    }
    
    // Limpiar efecto de tormenta del contenedor
    if (gameContainerElement) {
        gameContainerElement.classList.remove('lightning-active');
    }
    
    // Crear efecto visual del rayo
    createLightningBolt(targetRow, targetCol);
    
    // Electrificar la zona de impacto
    electrifyArea(targetRow, targetCol, levelConfig);
    
    // Efectos de pantalla
    createScreenFlash();
    createScreenShake();
    
    // Sonido de trueno (simulado)
    playThunderSound();
    
    // Limpiar nubes de tormenta gradualmente
    const stormCloudsElement = document.getElementById('storm-clouds-overlay');
    if (stormCloudsElement) {
        setTimeout(() => {
            stormCloudsElement.style.opacity = '0.3';
        }, 500);
        setTimeout(() => {
            stormCloudsElement.style.opacity = '0';
        }, 1500);
        setTimeout(() => {
            stormCloudsElement.style.display = 'none';
        }, 2500);
    }
}

function createLightningBolt(targetRow, targetCol) {
    if (!boardElement || !lightningCanvas) {
        console.error("❌ No se puede crear rayo: boardElement o lightningCanvas no disponibles");
        return;
    }
    
    const cellElement = boardElement.querySelector(`[data-row='${targetRow}'][data-col='${targetCol}']`);
    if (!cellElement) {
        console.error(`❌ No se encontró celda [${targetRow}, ${targetCol}] para crear rayo`);
        return;
    }
    
    const cellRect = cellElement.getBoundingClientRect();
    const targetX = cellRect.left + cellRect.width / 2;
    const targetY = cellRect.top + cellRect.height / 2;
    
    console.log(`⚡ Creando rayo en posición (${targetX}, ${targetY}) para celda [${targetRow}, ${targetCol}]`);
    
    // Punto de inicio del rayo (arriba de la pantalla)
    const startX = targetX + (Math.random() - 0.5) * 100;
    const startY = -50;
    
    // Crear múltiples rayos para efecto más dramático
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const bolt = new LightningBolt(
                startX + (Math.random() - 0.5) * 50,
                startY,
                targetX + (Math.random() - 0.5) * 20,
                targetY + (Math.random() - 0.5) * 20
            );
            lightningEffects.push(bolt);
            console.log(`⚡ Rayo ${i + 1}/3 creado y añadido a efectos. Total efectos: ${lightningEffects.length}`);
        }, i * 50);
    }
    
    // Crear efecto de impacto
    const impact = new LightningImpactEffect(targetX, targetY, 2);
    lightningEffects.push(impact);
    console.log(`💥 Efecto de impacto creado en (${targetX}, ${targetY}). Total efectos: ${lightningEffects.length}`);
    
    // Añadir partículas adicionales
    for (let i = 0; i < 30; i++) {
        lightningParticles.push(new ElectricParticle(
            targetX + (Math.random() - 0.5) * 40,
            targetY + (Math.random() - 0.5) * 40,
            Math.random() < 0.6 ? 'spark' : 'glow'
        ));
    }
    console.log(`✨ 30 partículas eléctricas creadas. Total partículas: ${lightningParticles.length}`);
    
    // Forzar inicio de animación si no está corriendo
    if (!lightningAnimationId) {
        console.log("🎬 Forzando inicio de animación de rayos");
        lightningAnimationId = requestAnimationFrame(animateLightningEffects);
    }
}

function electrifyArea(centerRow, centerCol, levelConfig) {
    const currentTime = Date.now();
    const endTime = currentTime + levelConfig.electrifiedDuration;
    
    // Área fija de 3x3 (sin escalado por tiempo)
    const areaSize = 3;
    const halfSize = Math.floor(areaSize / 2);
    
    console.log(`⚡ Electrificando área 3x3 centrada en [${centerRow}, ${centerCol}]`);
    
    // Electrificar área y destruir piezas existentes
    for (let r = centerRow - halfSize; r <= centerRow + halfSize; r++) {
        for (let c = centerCol - halfSize; c <= centerCol + halfSize; c++) {
            // Verificar límites del tablero
            if (r >= 0 && r < 10 && c >= 0 && c < 10) {
                const key = `${r}-${c}`;
                const cellElement = boardElement.querySelector(`[data-row='${r}'][data-col='${c}']`);
                
                // Si hay una pieza en esta posición, DESTRUIRLA con efectos espectaculares
                if (board[r][c] === 1) {
                    console.log(`💥 Destruyendo pieza en [${r}, ${c}] por impacto de rayo`);
                    
                    // Crear efecto de destrucción espectacular
                    if (cellElement) {
                        const rect = cellElement.getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;
                        const pieceColor = cellElement.dataset.pieceColor || cellElement.style.backgroundColor || '#EF5350';
                        
                        const destructionEffect = new PieceDestructionEffect(centerX, centerY, pieceColor);
                        destructionEffects.push(destructionEffect);
                    }
                    
                    // Limpiar el tablero lógico
                    board[r][c] = 0;
                    
                    // Limpiar visualmente la celda SIN efectos CSS
                    if (cellElement) {
                        // Limpiar todos los estilos y clases de pieza
                        cellElement.style.backgroundColor = '';
                        cellElement.classList.remove('piece-block', 'pulse-block-animation');
                        cellElement.style.backgroundImage = '';
                        cellElement.style.border = '';
                        cellElement.style.opacity = '';
                        delete cellElement.dataset.pieceColor;
                        
                        // Limpiar datos de anillo si los tenía
                        if (cellElement.dataset.hasRing === 'true') {
                            const ringElement = cellElement.querySelector('.board-golden-ring');
                            if (ringElement && ringElement.parentNode) {
                                ringElement.parentNode.removeChild(ringElement);
                            }
                            delete cellElement.dataset.hasRing;
                            delete cellElement.dataset.ringId;
                            cellElement.classList.remove('cell-with-ring');
                        }
                    }
                }
                
                // Crear efecto de zona electrificada con canvas
                const zoneEffect = new ElectrifiedZoneEffect(r, c, levelConfig.electrifiedDuration);
                electrifiedZoneEffects.push(zoneEffect);
                
                // Electrificar la celda (ahora vacía) para bloquear nuevas piezas
                electrifiedCells.set(key, {
                    row: r,
                    col: c,
                    endTime: endTime,
                    hasExistingPiece: false // Siempre false porque destruimos las piezas
                });
                
                // NO aplicar efectos CSS, solo marcar como electrificada
                if (cellElement) {
                    cellElement.dataset.electrifiedUntil = endTime;
                    // NO añadir clases CSS que cambien el color
                }
                
                console.log(`⚡ Celda [${r}, ${c}] electrificada hasta`, new Date(endTime).toLocaleTimeString());
            }
        }
    }
    
    // Programar limpieza automática
    setTimeout(() => {
        cleanupExpiredElectrification();
    }, levelConfig.electrifiedDuration + 100);
}

function cleanupExpiredElectrification() {
    const currentTime = Date.now();
    const expiredKeys = [];
    
    electrifiedCells.forEach((data, key) => {
        if (currentTime >= data.endTime) {
            expiredKeys.push(key);
            
            // Limpiar efectos visuales (solo datos, no CSS)
            const cellElement = boardElement.querySelector(`[data-row='${data.row}'][data-col='${data.col}']`);
            if (cellElement) {
                delete cellElement.dataset.electrifiedUntil;
                // NO remover clases CSS porque ya no las usamos
            }
        }
    });
    
    // Remover celdas expiradas
    expiredKeys.forEach(key => {
        electrifiedCells.delete(key);
        console.log(`🔌 Electrificación expirada en celda ${key}`);
    });
}

function createScreenFlash() {
    if (!lightningCanvas || !lightningCtx) return;
    
    // Flash blanco brillante
    lightningCtx.save();
    lightningCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    lightningCtx.fillRect(0, 0, lightningCanvas.width, lightningCanvas.height);
    lightningCtx.restore();
    
    // El flash se desvanecerá automáticamente en la próxima animación
    setTimeout(() => {
        if (lightningCtx) {
            lightningCtx.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);
        }
    }, 100);
}

function createScreenShake() {
    if (gameContainerElement) {
        gameContainerElement.classList.add('lightning-shake');
        setTimeout(() => {
            gameContainerElement.classList.remove('lightning-shake');
        }, 500);
    }
}

function playThunderSound() {
    // Simulación de sonido sin efectos visuales persistentes
    console.log("🔊 TRUENO!");
    
    // Solo crear un flash rápido en lugar de ondas persistentes
    if (lightningCanvas && lightningCtx) {
        lightningCtx.save();
        lightningCtx.globalAlpha = 0.2;
        lightningCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        lightningCtx.fillRect(0, 0, lightningCanvas.width, lightningCanvas.height);
        lightningCtx.restore();
        
        // El flash se limpiará automáticamente en la próxima animación
    }
}

function animateLightningEffects() {
    if (!lightningCtx) {
        console.warn("⚠️ lightningCtx no disponible en animateLightningEffects");
        return;
    }
    
    // Verificar si hay efectos activos
    const hasActiveEffects = lightningEffects.length > 0 || 
                           lightningParticles.length > 0 || 
                           isLightningWarningActive ||
                           electrifiedZoneEffects.length > 0 ||
                           destructionEffects.length > 0;
    
    // Debug: mostrar estado de efectos
    if (hasActiveEffects) {
        console.log(`🎬 Animando efectos: rayos=${lightningEffects.length}, partículas=${lightningParticles.length}, zonas=${electrifiedZoneEffects.length}, destrucción=${destructionEffects.length}, advertencia=${isLightningWarningActive}`);
    }
    
    // SIEMPRE limpiar el canvas completamente para evitar efectos persistentes
    lightningCtx.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);
    
    // Actualizar y dibujar efectos de rayos
    for (let i = lightningEffects.length - 1; i >= 0; i--) {
        const effect = lightningEffects[i];
        if (!effect.update()) {
            lightningEffects.splice(i, 1);
        } else {
            effect.draw();
        }
    }
    
    // Actualizar y dibujar partículas
    for (let i = lightningParticles.length - 1; i >= 0; i--) {
        const particle = lightningParticles[i];
        if (!particle.update()) {
            lightningParticles.splice(i, 1);
        } else {
            particle.draw();
        }
    }
    
    // Actualizar y dibujar efectos de zona electrificada
    for (let i = electrifiedZoneEffects.length - 1; i >= 0; i--) {
        const zoneEffect = electrifiedZoneEffects[i];
        if (!zoneEffect.update()) {
            electrifiedZoneEffects.splice(i, 1);
            console.log(`🔌 Efecto de zona electrificada terminado en [${zoneEffect.row}, ${zoneEffect.col}]`);
        } else {
            zoneEffect.draw();
        }
    }
    
    // Actualizar y dibujar efectos de destrucción
    for (let i = destructionEffects.length - 1; i >= 0; i--) {
        const destructionEffect = destructionEffects[i];
        if (!destructionEffect.update()) {
            destructionEffects.splice(i, 1);
            console.log(`💥 Efecto de destrucción terminado`);
        } else {
            destructionEffect.draw();
        }
    }
    
    // Dibujar efectos de advertencia si están activos
    if (isLightningWarningActive) {
        drawLightningWarningEffects();
    }
    
    // Continuar animación si hay efectos activos O si estamos en el Nivel 5
    if (hasActiveEffects || isLightningWarningActive || currentSelectedLevelId === 5) {
        lightningAnimationId = requestAnimationFrame(animateLightningEffects);
    } else {
        // Asegurar limpieza final del canvas
        lightningCtx.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);
        lightningAnimationId = null;
        console.log("🧹 Canvas de rayos limpiado completamente - animación detenida");
    }
}

function drawLightningWarningEffects() {
    if (!currentLightningTarget || !boardElement || !lightningCtx) return;
    
    const cellElement = boardElement.querySelector(`[data-row='${currentLightningTarget.row}'][data-col='${currentLightningTarget.col}']`);
    if (!cellElement) return;
    
    const cellRect = cellElement.getBoundingClientRect();
    const centerX = cellRect.left + cellRect.width / 2;
    const centerY = cellRect.top + cellRect.height / 2;
    
    // Efecto de objetivo pulsante
    const time = Date.now() * 0.01;
    const pulse = Math.sin(time) * 0.5 + 0.5;
    const radius = 20 + pulse * 10;
    
    lightningCtx.save();
    lightningCtx.globalAlpha = 0.7;
    lightningCtx.strokeStyle = `hsl(${60 + pulse * 60}, 100%, 70%)`;
    lightningCtx.lineWidth = 3;
    lightningCtx.shadowColor = lightningCtx.strokeStyle;
    lightningCtx.shadowBlur = 15;
    
    lightningCtx.beginPath();
    lightningCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    lightningCtx.stroke();
    
    // Cruz de objetivo
    lightningCtx.beginPath();
    lightningCtx.moveTo(centerX - radius, centerY);
    lightningCtx.lineTo(centerX + radius, centerY);
    lightningCtx.moveTo(centerX, centerY - radius);
    lightningCtx.lineTo(centerX, centerY + radius);
    lightningCtx.stroke();
    
    lightningCtx.restore();
}

function stopLightningStorm() {
    console.log("🌤️ Deteniendo tormenta eléctrica");
    
    // Limpiar temporizadores
    if (lightningTimeoutId) {
        clearTimeout(lightningTimeoutId);
        lightningTimeoutId = null;
    }
    
    if (lightningWarningTimeoutId) {
        clearTimeout(lightningWarningTimeoutId);
        lightningWarningTimeoutId = null;
    }
    
    // Detener animación
    if (lightningAnimationId) {
        cancelAnimationFrame(lightningAnimationId);
        lightningAnimationId = null;
    }
    
    // Limpiar efectos visuales
    lightningEffects = [];
    lightningParticles = [];
    electrifiedZoneEffects = []; // Limpiar nuevos efectos
    destructionEffects = []; // Limpiar efectos de destrucción
    isLightningWarningActive = false;
    currentLightningTarget = null;
    
    // Limpiar electrificación
    cleanupAllElectrification();
}

function cleanupAllElectrification() {
    electrifiedCells.forEach((data, key) => {
        const cellElement = boardElement.querySelector(`[data-row='${data.row}'][data-col='${data.col}']`);
        if (cellElement) {
            // Solo limpiar datos, no clases CSS
            delete cellElement.dataset.electrifiedUntil;
        }
    });
    
    electrifiedCells.clear();
    console.log("🔌 Toda la electrificación limpiada");
}

function cleanupLightningSystem() {
    stopLightningStorm();
    
    // Limpiar efectos visuales del contenedor
    if (gameContainerElement) {
        gameContainerElement.classList.remove('lightning-active', 'storm-rumble');
    }
    
    // Limpiar nubes de tormenta
    const stormCloudsElement = document.getElementById('storm-clouds-overlay');
    if (stormCloudsElement) {
        stormCloudsElement.remove();
    }
    
    // Limpiar todas las advertencias de rayos
    const warningElements = document.querySelectorAll('.lightning-warning');
    warningElements.forEach(element => {
        element.classList.remove('lightning-warning');
    });
    
    // Remover canvas
    if (lightningCanvas) {
        lightningCanvas.remove();
        lightningCanvas = null;
        lightningCtx = null;
    }
    
    console.log("⚡ Sistema de rayos limpiado completamente");
}

// --- FUNCIONES DE EFECTOS VISUALES PARA COMBOS ELÉCTRICOS ---

// COMENTADAS TEMPORALMENTE - PARA USO FUTURO

/*
function createElectricComboEffect(cellsToClear, comboLevel) {
    if (!cellsToClear || cellsToClear.size === 0) return;
    
    // Crear efectos de cadena eléctrica entre celdas
    const cellsArray = Array.from(cellsToClear);
    for (let i = 0; i < cellsArray.length - 1; i++) {
        const cell1 = cellsArray[i];
        const cell2 = cellsArray[i + 1];
        
        if (cell1.element && cell2.element) {
            createElectricChainEffect(cell1.element, cell2.element);
        }
    }
    
    // Crear partículas especiales según el nivel del combo
    cellsArray.forEach(cellData => {
        if (cellData.element) {
            createElectricDischargeEffect(cellData.element, comboLevel);
        }
    });
}

function createElectricChainEffect(element1, element2) {
    if (!element1 || !element2 || !lightningCanvas || !lightningCtx) return;
    
    const rect1 = element1.getBoundingClientRect();
    const rect2 = element2.getBoundingClientRect();
    
    const x1 = rect1.left + rect1.width / 2;
    const y1 = rect1.top + rect1.height / 2;
    const x2 = rect2.left + rect2.width / 2;
    const y2 = rect2.top + rect2.height / 2;
    
    // Crear rayo dorado conectando las celdas
    const chainBolt = new LightningBolt(x1, y1, x2, y2);
    chainBolt.color = '#FFD700'; // Dorado para combos
    chainBolt.thickness = 4;
    lightningEffects.push(chainBolt);
}

function createElectricDischargeEffect(cellElement, intensity = 1) {
    if (!cellElement) return;
    
    // Añadir clase de descarga eléctrica
    cellElement.classList.add('electric-discharge');
    setTimeout(() => {
        cellElement.classList.remove('electric-discharge');
    }, 300);
    
    // Crear partículas eléctricas
    const rect = cellElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 10 * intensity; i++) {
        lightningParticles.push(new ElectricParticle(
            centerX + (Math.random() - 0.5) * 30,
            centerY + (Math.random() - 0.5) * 30,
            'glow'
        ));
    }
}

function showElectricBonusMessage(message, referenceElement) {
    if (!referenceElement) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'electric-bonus-message';
    messageElement.textContent = message;
    
    // Posicionar el mensaje
    const rect = referenceElement.getBoundingClientRect();
    messageElement.style.left = (rect.left + rect.width / 2) + 'px';
    messageElement.style.top = (rect.top - 20) + 'px';
    messageElement.style.transform = 'translateX(-50%)';
    
    document.body.appendChild(messageElement);
    
    // Remover después de la animación
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 2000);
}

function createElectricStormScreenEffect() {
    // Efecto de vibración de pantalla
    if (gameContainerElement) {
        gameContainerElement.classList.add('electric-storm-shake');
        setTimeout(() => {
            gameContainerElement.classList.remove('electric-storm-shake');
        }, 800);
    }
    
    // Flash eléctrico dorado
    if (lightningCanvas && lightningCtx) {
        lightningCtx.save();
        lightningCtx.fillStyle = 'rgba(255, 215, 0, 0.6)'; // Dorado
        lightningCtx.fillRect(0, 0, lightningCanvas.width, lightningCanvas.height);
        lightningCtx.restore();
        
        setTimeout(() => {
            if (lightningCtx) {
                lightningCtx.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);
            }
        }, 150);
    }
    
    // Crear múltiples rayos dorados desde los bordes
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const startX = Math.random() * window.innerWidth;
            const startY = -50;
            const endX = Math.random() * window.innerWidth;
            const endY = window.innerHeight + 50;
            
            const stormBolt = new LightningBolt(startX, startY, endX, endY);
            stormBolt.color = '#FFD700';
            stormBolt.thickness = 6;
            lightningEffects.push(stormBolt);
        }, i * 100);
    }
}
*/

// --- CLASES PARA EFECTOS DE RAYOS ELÉCTRICOS ---

class LightningBolt {
    constructor(startX, startY, endX, endY) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.segments = [];
        this.life = 30; // Duración del rayo en frames
        this.maxLife = 30;
        this.thickness = Math.random() * 3 + 2;
        this.color = `hsl(${200 + Math.random() * 60}, 100%, ${70 + Math.random() * 30}%)`;
        this.generateSegments();
    }
    
    generateSegments() {
        const distance = Math.sqrt((this.endX - this.startX) ** 2 + (this.endY - this.startY) ** 2);
        const numSegments = Math.floor(distance / 20) + 3;
        
        this.segments = [];
        for (let i = 0; i <= numSegments; i++) {
            const t = i / numSegments;
            const x = this.startX + (this.endX - this.startX) * t;
            const y = this.startY + (this.endY - this.startY) * t;
            
            // Añadir variación aleatoria excepto en los extremos
            const offsetX = (i === 0 || i === numSegments) ? 0 : (Math.random() - 0.5) * 40;
            const offsetY = (i === 0 || i === numSegments) ? 0 : (Math.random() - 0.5) * 20;
            
            this.segments.push({ x: x + offsetX, y: y + offsetY });
        }
        
        // Añadir ramificaciones
        this.branches = [];
        for (let i = 1; i < this.segments.length - 1; i++) {
            if (Math.random() < 0.3) { // 30% de probabilidad de ramificación
                const segment = this.segments[i];
                const branchLength = Math.random() * 50 + 20;
                const branchAngle = (Math.random() - 0.5) * Math.PI;
                
                this.branches.push({
                    startX: segment.x,
                    startY: segment.y,
                    endX: segment.x + Math.cos(branchAngle) * branchLength,
                    endY: segment.y + Math.sin(branchAngle) * branchLength,
                    thickness: this.thickness * 0.6
                });
            }
        }
    }
    
    update() {
        this.life--;
        // Regenerar ocasionalmente para efecto de parpadeo
        if (Math.random() < 0.3) {
            this.generateSegments();
        }
        return this.life > 0;
    }
    
    draw() {
        if (!lightningCtx) return;
        
        const alpha = this.life / this.maxLife;
        lightningCtx.save();
        lightningCtx.globalAlpha = alpha;
        lightningCtx.strokeStyle = this.color;
        lightningCtx.lineWidth = this.thickness;
        lightningCtx.lineCap = 'round';
        lightningCtx.shadowColor = this.color;
        lightningCtx.shadowBlur = 10;
        
        // Dibujar rayo principal
        lightningCtx.beginPath();
        if (this.segments.length > 0) {
            lightningCtx.moveTo(this.segments[0].x, this.segments[0].y);
            for (let i = 1; i < this.segments.length; i++) {
                lightningCtx.lineTo(this.segments[i].x, this.segments[i].y);
            }
        }
        lightningCtx.stroke();
        
        // Dibujar ramificaciones
        this.branches.forEach(branch => {
            lightningCtx.lineWidth = branch.thickness;
            lightningCtx.beginPath();
            lightningCtx.moveTo(branch.startX, branch.startY);
            lightningCtx.lineTo(branch.endX, branch.endY);
            lightningCtx.stroke();
        });
        
        lightningCtx.restore();
    }
}

class ElectricParticle {
    constructor(x, y, type = 'spark') {
        this.x = x;
        this.y = y;
        this.type = type; // 'spark', 'glow', 'arc'
        this.speedX = (Math.random() - 0.5) * 4;
        this.speedY = (Math.random() - 0.5) * 4;
        this.life = Math.random() * 60 + 30;
        this.maxLife = this.life;
        this.size = Math.random() * 3 + 1;
        this.color = `hsl(${190 + Math.random() * 80}, 100%, ${60 + Math.random() * 40}%)`;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }
    
    update() {
        this.life--;
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedX *= 0.98; // Fricción
        this.speedY *= 0.98;
        this.rotation += this.rotationSpeed;
        
        // Efecto de gravedad ligera para chispas
        if (this.type === 'spark') {
            this.speedY += 0.1;
        }
        
        return this.life > 0;
    }
    
    draw() {
        if (!lightningCtx) return;
        
        const alpha = this.life / this.maxLife;
        lightningCtx.save();
        lightningCtx.globalAlpha = alpha;
        lightningCtx.translate(this.x, this.y);
        lightningCtx.rotate(this.rotation);
        
        if (this.type === 'spark') {
            lightningCtx.fillStyle = this.color;
            lightningCtx.shadowColor = this.color;
            lightningCtx.shadowBlur = 5;
            lightningCtx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        } else if (this.type === 'glow') {
            const gradient = lightningCtx.createRadialGradient(0, 0, 0, 0, 0, this.size);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, 'transparent');
            lightningCtx.fillStyle = gradient;
            lightningCtx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
        }
        
        lightningCtx.restore();
    }
}

class LightningImpactEffect {
    constructor(x, y, intensity = 1) {
        this.x = x;
        this.y = y;
        this.intensity = intensity;
        this.life = 30; // Reducido de 60 a 30 frames para que desaparezca más rápido
        this.maxLife = 30; // Reducido de 60 a 30 frames
        this.rings = [];
        this.particles = [];
        
        // Crear anillos de onda expansiva (menos anillos y más rápidos)
        for (let i = 0; i < 2; i++) { // Reducido de 3 a 2 anillos
            this.rings.push({
                radius: 0,
                maxRadius: 40 + i * 15, // Reducido el tamaño máximo
                speed: 3 + i * 1, // Aumentada la velocidad
                thickness: 2 - i * 0.5, // Reducido el grosor
                delay: i * 3 // Reducido el delay
            });
        }
        
        // Crear menos partículas de impacto
        for (let i = 0; i < 10 * intensity; i++) { // Reducido de 20 a 10
            this.particles.push(new ElectricParticle(x, y, Math.random() < 0.7 ? 'spark' : 'glow'));
        }
    }
    
    update() {
        this.life--;
        
        // Actualizar anillos
        this.rings.forEach(ring => {
            if (ring.delay <= 0) {
                ring.radius += ring.speed;
            } else {
                ring.delay--;
            }
        });
        
        // Actualizar partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update()) {
                this.particles.splice(i, 1);
            }
        }
        
        return this.life > 0 || this.particles.length > 0;
    }
    
    draw() {
        if (!lightningCtx) return;
        
        const alpha = Math.min(1, this.life / this.maxLife);
        
        // Dibujar anillos de onda expansiva
        lightningCtx.save();
        lightningCtx.globalAlpha = alpha;
        
        this.rings.forEach(ring => {
            if (ring.radius > 0 && ring.radius < ring.maxRadius) {
                const ringAlpha = 1 - (ring.radius / ring.maxRadius);
                lightningCtx.globalAlpha = alpha * ringAlpha;
                lightningCtx.strokeStyle = `hsl(220, 100%, 80%)`;
                lightningCtx.lineWidth = ring.thickness;
                lightningCtx.shadowColor = `hsl(220, 100%, 80%)`;
                lightningCtx.shadowBlur = 10;
                
                lightningCtx.beginPath();
                lightningCtx.arc(this.x, this.y, ring.radius, 0, Math.PI * 2);
                lightningCtx.stroke();
            }
        });
        
        lightningCtx.restore();
        
        // Dibujar partículas
        this.particles.forEach(particle => particle.draw());
    }
}

// --- EVENT LISTENER ESENCIAL PARA ENTRADA A NIVELES ---

// Event listener para el botón de confirmación del modal de objetivo inicial
if (objectiveStartConfirmButtonElement) {
    objectiveStartConfirmButtonElement.addEventListener('click', () => {
        console.log("Botón ¡Entendido! presionado - cerrando modal de objetivo");
        
        // Ocultar el modal
        if (levelObjectiveStartModalElement) {
            levelObjectiveStartModalElement.classList.remove('visible');
            levelObjectiveStartModalElement.classList.add('hidden');
        }
        
        // Ejecutar la continuación si existe
        if (typeof levelInitializationContinuation === 'function') {
            console.log("Ejecutando continuación de inicialización del nivel");
            levelInitializationContinuation();
            levelInitializationContinuation = null; // Limpiar después de usar
        } else {
            console.error("No hay función de continuación definida");
        }
    });
} else {
    console.error("objectiveStartConfirmButtonElement no encontrado en el DOM");
}

// Nueva función para crear efecto de destrucción de piezas por rayos
function createPieceDestructionEffect(cellElement) {
    if (!cellElement) return;
    
    // Añadir clase de destrucción eléctrica
    cellElement.classList.add('lightning-destruction');
    
    // Crear partículas de destrucción
    const rect = cellElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Crear múltiples partículas eléctricas
    for (let i = 0; i < 15; i++) {
        if (lightningParticles) {
            lightningParticles.push(new ElectricParticle(
                centerX + (Math.random() - 0.5) * 40,
                centerY + (Math.random() - 0.5) * 40,
                Math.random() < 0.6 ? 'spark' : 'glow'
            ));
        }
    }
    
    // Crear efecto de explosión usando el sistema de partículas existente
    if (typeof createParticleExplosion === 'function') {
        createParticleExplosion(cellElement);
    }
    
    // Remover la clase después de la animación
    setTimeout(() => {
        cellElement.classList.remove('lightning-destruction');
    }, 500);
    
    console.log(`💥 Efecto de destrucción creado para celda`);
}

// --- NUEVAS CLASES PARA EFECTOS ESPECTACULARES ---

// Clase para efectos de zona electrificada
class ElectrifiedZoneEffect {
    constructor(row, col, duration) {
        this.row = row;
        this.col = col;
        this.duration = duration;
        this.startTime = Date.now();
        this.particles = [];
        this.arcs = [];
        this.intensity = 1;
        this.pulsePhase = 0;
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        
        // Calcular posición en pantalla
        this.calculatePosition();
        
        // Crear partículas iniciales
        this.createParticles();
        
        console.log(`⚡ Creando efecto de zona electrificada en [${row}, ${col}] en posición (${this.x}, ${this.y})`);
    }
    
    calculatePosition() {
        if (!boardElement) {
            console.warn("⚠️ boardElement no disponible para calcular posición");
            return;
        }
        
        const cellElement = boardElement.querySelector(`[data-row='${this.row}'][data-col='${this.col}']`);
        if (cellElement) {
            const rect = cellElement.getBoundingClientRect();
            this.x = rect.left + rect.width / 2;
            this.y = rect.top + rect.height / 2;
            this.width = rect.width;
            this.height = rect.height;
            
            console.log(`📍 Posición calculada para celda [${this.row}, ${this.col}]: (${this.x}, ${this.y}) tamaño: ${this.width}x${this.height}`);
        } else {
            console.warn(`⚠️ No se encontró celda [${this.row}, ${this.col}] para calcular posición`);
            // Valores por defecto si no se encuentra la celda
            this.x = 100;
            this.y = 100;
            this.width = 30;
            this.height = 30;
        }
    }
    
    createParticles() {
        // Crear partículas eléctricas flotantes
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.x + (Math.random() - 0.5) * this.width,
                y: this.y + (Math.random() - 0.5) * this.height,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                life: Math.random() * 60 + 30,
                maxLife: Math.random() * 60 + 30,
                size: Math.random() * 2 + 1,
                color: `hsl(${180 + Math.random() * 60}, 100%, ${70 + Math.random() * 30}%)`,
                phase: Math.random() * Math.PI * 2
            });
        }
        
        console.log(`✨ Creadas ${this.particles.length} partículas para zona electrificada`);
    }
    
    update() {
        const elapsed = Date.now() - this.startTime;
        if (elapsed >= this.duration) return false;
        
        this.pulsePhase += 0.1;
        this.intensity = 0.5 + Math.sin(this.pulsePhase) * 0.5;
        
        // Recalcular posición en caso de que el tablero se haya movido
        this.calculatePosition();
        
        // Actualizar partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life--;
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.phase += 0.1;
            
            // Mantener partículas dentro del área
            if (particle.x < this.x - this.width/2) particle.speedX = Math.abs(particle.speedX);
            if (particle.x > this.x + this.width/2) particle.speedX = -Math.abs(particle.speedX);
            if (particle.y < this.y - this.height/2) particle.speedY = Math.abs(particle.speedY);
            if (particle.y > this.y + this.height/2) particle.speedY = -Math.abs(particle.speedY);
            
            if (particle.life <= 0) {
                // Regenerar partícula
                particle.x = this.x + (Math.random() - 0.5) * this.width;
                particle.y = this.y + (Math.random() - 0.5) * this.height;
                particle.life = particle.maxLife;
            }
        }
        
        return true;
    }
    
    draw() {
        if (!lightningCtx) return;
        
        lightningCtx.save();
        
        // Dibujar fondo electrificado
        const gradient = lightningCtx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.width * 0.7
        );
        gradient.addColorStop(0, `rgba(0, 255, 255, ${0.3 * this.intensity})`);
        gradient.addColorStop(0.5, `rgba(100, 200, 255, ${0.2 * this.intensity})`);
        gradient.addColorStop(1, 'transparent');
        
        lightningCtx.fillStyle = gradient;
        lightningCtx.fillRect(
            this.x - this.width/2, 
            this.y - this.height/2, 
            this.width, 
            this.height
        );
        
        // Dibujar borde eléctrico más visible
        lightningCtx.strokeStyle = `rgba(0, 255, 255, ${0.9 * this.intensity})`;
        lightningCtx.lineWidth = 3;
        lightningCtx.shadowColor = 'rgba(0, 255, 255, 0.8)';
        lightningCtx.shadowBlur = 15;
        lightningCtx.strokeRect(
            this.x - this.width/2, 
            this.y - this.height/2, 
            this.width, 
            this.height
        );
        
        // Dibujar partículas
        this.particles.forEach(particle => {
            const alpha = (particle.life / particle.maxLife) * this.intensity;
            lightningCtx.globalAlpha = alpha;
            
            // Partícula principal
            lightningCtx.fillStyle = particle.color;
            lightningCtx.shadowColor = particle.color;
            lightningCtx.shadowBlur = 8;
            lightningCtx.beginPath();
            lightningCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            lightningCtx.fill();
            
            // Efecto de chispa
            const sparkSize = particle.size * (1 + Math.sin(particle.phase) * 0.5);
            lightningCtx.globalAlpha = alpha * 0.5;
            lightningCtx.beginPath();
            lightningCtx.arc(particle.x, particle.y, sparkSize, 0, Math.PI * 2);
            lightningCtx.fill();
        });
        
        lightningCtx.restore();
    }
}

// Clase para efectos de destrucción espectacular
class PieceDestructionEffect {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.originalColor = color;
        this.life = 60;
        this.maxLife = 60;
        this.fragments = [];
        this.electricArcs = [];
        this.shockwave = { radius: 0, maxRadius: 50, speed: 3 };
        
        this.createFragments();
        this.createElectricArcs();
    }
    
    createFragments() {
        // Crear fragmentos de la pieza destruida
        for (let i = 0; i < 12; i++) {
            this.fragments.push({
                x: this.x,
                y: this.y,
                speedX: (Math.random() - 0.5) * 8,
                speedY: (Math.random() - 0.5) * 8 - 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3,
                rotation: 0,
                size: Math.random() * 4 + 2,
                life: Math.random() * 40 + 20,
                maxLife: Math.random() * 40 + 20,
                color: this.originalColor
            });
        }
    }
    
    createElectricArcs() {
        // Crear arcos eléctricos desde el centro
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const length = Math.random() * 30 + 20;
            this.electricArcs.push({
                startX: this.x,
                startY: this.y,
                endX: this.x + Math.cos(angle) * length,
                endY: this.y + Math.sin(angle) * length,
                life: Math.random() * 20 + 10,
                maxLife: Math.random() * 20 + 10,
                thickness: Math.random() * 2 + 1,
                segments: []
            });
        }
        
        // Generar segmentos para cada arco
        this.electricArcs.forEach(arc => this.generateArcSegments(arc));
    }
    
    generateArcSegments(arc) {
        const distance = Math.sqrt((arc.endX - arc.startX) ** 2 + (arc.endY - arc.startY) ** 2);
        const numSegments = Math.floor(distance / 5) + 2;
        
        arc.segments = [];
        for (let i = 0; i <= numSegments; i++) {
            const t = i / numSegments;
            const x = arc.startX + (arc.endX - arc.startX) * t;
            const y = arc.startY + (arc.endY - arc.startY) * t;
            
            // Añadir variación aleatoria
            const offsetX = (i === 0 || i === numSegments) ? 0 : (Math.random() - 0.5) * 10;
            const offsetY = (i === 0 || i === numSegments) ? 0 : (Math.random() - 0.5) * 10;
            
            arc.segments.push({ x: x + offsetX, y: y + offsetY });
        }
    }
    
    update() {
        this.life--;
        
        // Actualizar onda expansiva
        this.shockwave.radius += this.shockwave.speed;
        
        // Actualizar fragmentos
        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const fragment = this.fragments[i];
            fragment.life--;
            fragment.x += fragment.speedX;
            fragment.y += fragment.speedY;
            fragment.speedY += 0.2; // Gravedad
            fragment.speedX *= 0.98; // Fricción
            fragment.rotation += fragment.rotationSpeed;
            
            if (fragment.life <= 0) {
                this.fragments.splice(i, 1);
            }
        }
        
        // Actualizar arcos eléctricos
        for (let i = this.electricArcs.length - 1; i >= 0; i--) {
            const arc = this.electricArcs[i];
            arc.life--;
            
            // Regenerar segmentos ocasionalmente
            if (Math.random() < 0.3) {
                this.generateArcSegments(arc);
            }
            
            if (arc.life <= 0) {
                this.electricArcs.splice(i, 1);
            }
        }
        
        return this.life > 0 || this.fragments.length > 0 || this.electricArcs.length > 0;
    }
    
    draw() {
        if (!lightningCtx) return;
        
        lightningCtx.save();
        
        // Dibujar onda expansiva
        if (this.shockwave.radius < this.shockwave.maxRadius) {
            const alpha = 1 - (this.shockwave.radius / this.shockwave.maxRadius);
            lightningCtx.globalAlpha = alpha * 0.6;
            lightningCtx.strokeStyle = '#00ffff';
            lightningCtx.lineWidth = 3;
            lightningCtx.shadowColor = '#00ffff';
            lightningCtx.shadowBlur = 15;
            lightningCtx.beginPath();
            lightningCtx.arc(this.x, this.y, this.shockwave.radius, 0, Math.PI * 2);
            lightningCtx.stroke();
        }
        
        // Dibujar arcos eléctricos
        this.electricArcs.forEach(arc => {
            const alpha = arc.life / arc.maxLife;
            lightningCtx.globalAlpha = alpha;
            lightningCtx.strokeStyle = `hsl(${180 + Math.random() * 60}, 100%, 80%)`;
            lightningCtx.lineWidth = arc.thickness;
            lightningCtx.shadowColor = lightningCtx.strokeStyle;
            lightningCtx.shadowBlur = 8;
            
            lightningCtx.beginPath();
            if (arc.segments.length > 0) {
                lightningCtx.moveTo(arc.segments[0].x, arc.segments[0].y);
                for (let i = 1; i < arc.segments.length; i++) {
                    lightningCtx.lineTo(arc.segments[i].x, arc.segments[i].y);
                }
            }
            lightningCtx.stroke();
        });
        
        // Dibujar fragmentos
        this.fragments.forEach(fragment => {
            const alpha = fragment.life / fragment.maxLife;
            lightningCtx.globalAlpha = alpha;
            lightningCtx.save();
            lightningCtx.translate(fragment.x, fragment.y);
            lightningCtx.rotate(fragment.rotation);
            
            // Fragmento con brillo eléctrico
            lightningCtx.fillStyle = fragment.color;
            lightningCtx.shadowColor = '#00ffff';
            lightningCtx.shadowBlur = 5;
            lightningCtx.fillRect(-fragment.size/2, -fragment.size/2, fragment.size, fragment.size);
            
            lightningCtx.restore();
        });
        
        lightningCtx.restore();
    }
}

// --- FUNCIONES DEL SISTEMA DE PORTALES DIMENSIONALES ---

// Modificar setupPortalCanvas para separar la creación del dimensionamiento
function ensurePortalCanvasExists() {
    if (!portalCanvas) {
        portalCanvas = document.createElement('canvas');
        portalCanvas.id = 'portalCanvas';
        portalCanvas.style.position = 'fixed';
        portalCanvas.style.top = '0';
        portalCanvas.style.left = '0';
        portalCanvas.style.pointerEvents = 'none';
        portalCanvas.style.zIndex = '1600';
        portalCanvas.style.background = 'transparent';
        document.body.appendChild(portalCanvas);
        portalCtx = portalCanvas.getContext('2d');
        console.log("🌀 Canvas de portales creado y añadido al DOM");
    }
}

function resizePortalCanvas() {
    if (!portalCanvas) return;

    portalCanvas.width = document.documentElement.clientWidth;
    portalCanvas.height = document.documentElement.clientHeight;
    
    portalCanvas.style.display = 'block';
    portalCanvas.style.visibility = 'visible';
    portalCanvas.style.opacity = '1';
    
    console.log("🌀 Canvas de portales redimensionado/configurado:", portalCanvas.width, "x", portalCanvas.height);
}

function setupPortalCanvas() {
    ensurePortalCanvasExists();
    resizePortalCanvas();
}

function startDimensionalPortals(levelConfig) {
    if (!levelConfig.teleportInterval) return;
    
    console.log("🌀 Iniciando portales dimensionales cada", levelConfig.teleportInterval / 1000, "segundos");
    setupPortalCanvas(); // Llama a ensure y resize

    // Añadir listener para resize SI AÚN NO EXISTE
    if (!window.portalResizeListenerAttached) {
        window.addEventListener('resize', resizePortalCanvas);
        window.portalResizeListenerAttached = true;
        console.log("🌀 Event listener para resize de portalCanvas añadido.");
    }
    
    // Inicializar intensidad de portales
    teleportIntensity = 1;
    portalStartTime = Date.now();
    
    // Función para programar la próxima teletransportación
    const scheduleNextTeleport = () => {
        teleportTimeoutId = setTimeout(() => {
            triggerTeleportWarning(levelConfig);
        }, levelConfig.teleportInterval);
    };
    
    // Programar la primera teletransportación después de 10 segundos
    const firstTeleportDelay = Math.min(10000, levelConfig.teleportInterval);
    console.log(`🌀 Primera teletransportación programada en ${firstTeleportDelay / 1000} segundos`);
    
    teleportTimeoutId = setTimeout(() => {
        triggerTeleportWarning(levelConfig);
    }, firstTeleportDelay);
    
    // Iniciar animación de portales
    if (!teleportAnimationId) {
        console.log("🎬 Iniciando animación de efectos de portales");
        teleportAnimationId = requestAnimationFrame(animatePortalEffects);
    }
}

function triggerTeleportWarning(levelConfig) {
    // DEBUG FLAGS
    window.debugPortalCanvasOnce = true;
    window.debugTeleportPieceOnce = true;

    if (!boardElement) return;
    
    // Calcular intensidad basada en tiempo transcurrido
    const elapsedTime = Date.now() - portalStartTime;
    const timeProgress = Math.min(1, elapsedTime / (levelConfig.maxTimeSeconds * 1000));
    teleportIntensity = 1 + timeProgress * 1.5; // Intensidad de 1 a 2.5
    
    console.log(`🌀 Intensidad de portales: ${teleportIntensity.toFixed(2)} (progreso: ${(timeProgress * 100).toFixed(1)}%)`);
    
    // Encontrar piezas para teletransportar
    const piecesToMove = findPiecesToTeleport();
    
    if (piecesToMove.length === 0) {
        console.log("🌀 No hay piezas para teletransportar - programando próximo intento");
        // Programar el próximo intento más pronto (5 segundos) para verificar si hay nuevas piezas
        const retryDelay = 5000;
        console.log(`🌀 Reintentando teletransportación en ${retryDelay / 1000} segundos`);
        
        teleportTimeoutId = setTimeout(() => {
            triggerTeleportWarning(levelConfig);
        }, retryDelay);
        return;
    }
    
    piecesToTeleport = piecesToMove;
    isTeleportWarningActive = true;
    
    console.log(`⚠️ Advertencia de teletransportación para ${piecesToMove.length} piezas`);
    
    // Mostrar advertencia visual
    showTeleportWarning(piecesToMove);
    
    // Programar la teletransportación
    teleportWarningTimeoutId = setTimeout(() => {
        executeTeleportation(piecesToMove, levelConfig);
        scheduleNextTeleportCycle(levelConfig);
    }, levelConfig.teleportWarningTime);
}

function scheduleNextTeleportCycle(levelConfig) {
    // Programar el próximo ciclo SOLO si el nivel sigue activo
    if (levelConfig.teleportInterval && currentGameMode === 'levels' && currentSelectedLevelId === levelConfig.id) {
        // Reducir ligeramente el intervalo con la intensidad
        const adjustedInterval = levelConfig.teleportInterval * (1 - (teleportIntensity - 1) * 0.15);
        console.log(`🌀 Próxima teletransportación en ${adjustedInterval / 1000} segundos (intervalo ajustado por intensidad)`);
        
        teleportTimeoutId = setTimeout(() => {
            triggerTeleportWarning(levelConfig);
        }, adjustedInterval);
    }
}

function findPiecesToTeleport() {
    const pieces = [];
    
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
            if (board[r][c] === 1) { 
                pieces.push({ row: r, col: c });
            }
        }
    }
    
    console.log(`🌀 Piezas encontradas en el tablero: ${pieces.length}`);
    
    if (pieces.length === 0) {
        console.log("🌀 No hay piezas en el tablero para teletransportar");
        return [];
    }
    
    // Determinar cuántas piezas mover basado en la intensidad (LÓGICA MEJORADA)
    let numPiecesToMove;
    if (pieces.length === 1) {
        numPiecesToMove = 1;
    } else {
        // Con intensidad 1 (inicio), mueve entre 1 y ~2 piezas.
        // Con intensidad 1.5, mueve entre 1 y ~3 piezas (podría ser 2-3).
        // Con intensidad 2, mueve entre 2 y ~5 piezas (podría ser 3-5).
        const minBase = Math.floor(teleportIntensity * 0.8); // Ajustar multiplicador para mínimo deseado
        const maxBase = Math.floor(teleportIntensity * 2.0); // Ajustar multiplicador para máximo deseado

        let minToMove = Math.max(1, minBase); // Siempre al menos 1 si hay piezas
        minToMove = Math.min(minToMove, pieces.length); // No más que las piezas disponibles
        
        let maxToMove = Math.max(minToMove, maxBase); // El máximo no puede ser menor que el mínimo
        maxToMove = Math.min(maxToMove, pieces.length); // No más que las piezas disponibles
        
        if (minToMove >= maxToMove) {
            numPiecesToMove = minToMove;
        } else {
            numPiecesToMove = Math.floor(Math.random() * (maxToMove - minToMove + 1)) + minToMove;
        }
    }
    
    const selectedPieces = [];
    const availablePieces = [...pieces]; // Copia del array
    
    for (let i = 0; i < numPiecesToMove && availablePieces.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availablePieces.length);
        selectedPieces.push(availablePieces.splice(randomIndex, 1)[0]);
    }
    
    console.log(`🌀 Seleccionadas ${selectedPieces.length} piezas para teletransportar de ${pieces.length} disponibles`);
    return selectedPieces;
}

function showTeleportWarning(piecesToMove) {
    piecesToMove.forEach(piece => {
        const cellElement = boardElement.querySelector(`[data-row='${piece.row}'][data-col='${piece.col}']`);
        if (cellElement) {
            cellElement.classList.add('portal-warning');
            
            // YA NO CREAR PortalWarningEffect para el canvas aquí
            // const rect = cellElement.getBoundingClientRect();
            // const centerX = rect.left + rect.width / 2;
            // const centerY = rect.top + rect.height / 2;
            // const warningPortal = new PortalWarningEffect(centerX, centerY);
            // portalEffects.push(warningPortal); 
        }
    });
    
    // Considerar si createDimensionalDistortion() se mantiene o se elimina de la fase de advertencia.
    // Por ahora, lo mantenemos como un efecto general del canvas durante la advertencia.
    createDimensionalDistortion(); 
}

function executeTeleportation(piecesToMove, levelConfig) {
    console.log(`🌀 EJECUTANDO TELETRANSPORTACIÓN de ${piecesToMove.length} piezas`);
    
    isTeleportWarningActive = false;
    
    // Limpiar advertencias visuales
    piecesToMove.forEach(piece => {
        const cellElement = boardElement.querySelector(`[data-row='${piece.row}'][data-col='${piece.col}']`);
        if (cellElement) {
            cellElement.classList.remove('portal-warning');
        }
    });
    
    // Teletransportar cada pieza
    piecesToMove.forEach(piece => {
        teleportSinglePiece(piece);
    });
    
    // Crear efecto de onda dimensional
    createDimensionalWave();
    
    // Limpiar lista de piezas a teletransportar
    piecesToTeleport = [];
}

function teleportSinglePiece(piece) {
    const { row: oldRow, col: oldCol } = piece;
    
    // Obtener información de la pieza original
    const oldCellElement = boardElement.querySelector(`[data-row='${oldRow}'][data-col='${oldCol}']`);
    if (!oldCellElement || board[oldRow][oldCol] !== 1) {
        console.warn(`🌀 Pieza en [${oldRow}, ${oldCol}] ya no existe`);
        return;
    }
    
    const pieceColor = oldCellElement.dataset.pieceColor || oldCellElement.style.backgroundColor;
    const hasRing = oldCellElement.dataset.hasRing === 'true';
    const ringId = oldCellElement.dataset.ringId;
    
    // Encontrar nueva posición inteligente
    const newPosition = findIntelligentTeleportPosition(oldRow, oldCol);
    if (!newPosition) {
        console.warn(`🌀 No se encontró posición válida para teletransportar pieza de [${oldRow}, ${oldCol}]`);
        return;
    }
    
    const { row: newRow, col: newCol } = newPosition;
    
    // Crear efectos visuales de teletransportación
    createTeleportationEffect(oldRow, oldCol, newRow, newCol, pieceColor);
    
    // Limpiar posición original
    board[oldRow][oldCol] = 0;
    oldCellElement.style.backgroundColor = '';
    oldCellElement.classList.remove('piece-block');
    delete oldCellElement.dataset.pieceColor;
    
    // Limpiar anillo si lo tenía
    if (hasRing) {
        const ringElement = oldCellElement.querySelector('.board-golden-ring');
        if (ringElement && ringElement.parentNode) {
            ringElement.parentNode.removeChild(ringElement);
        }
        delete oldCellElement.dataset.hasRing;
        delete oldCellElement.dataset.ringId;
        oldCellElement.classList.remove('cell-with-ring');
    }
    
    // Colocar en nueva posición
    board[newRow][newCol] = 1;
    const newCellElement = boardElement.querySelector(`[data-row='${newRow}'][data-col='${newCol}']`);
    if (newCellElement) {
        newCellElement.style.backgroundColor = pieceColor;
        newCellElement.classList.add('piece-block');
        newCellElement.dataset.pieceColor = pieceColor;
        
        // Restaurar anillo si lo tenía
        if (hasRing) {
            newCellElement.dataset.hasRing = 'true';
            newCellElement.dataset.ringId = ringId;
            newCellElement.classList.add('cell-with-ring');
            createBoardRingElement(newCellElement, ringId);
        }
        
        // Animación de aparición
        newCellElement.classList.add('portal-appear');
        setTimeout(() => {
            newCellElement.classList.remove('portal-appear');
        }, 800);
    }
    
    console.log(`🌀 Pieza teletransportada de [${oldRow}, ${oldCol}] a [${newRow}, ${newCol}]`);
}

function findIntelligentTeleportPosition(excludeRow, excludeCol) {
    const validPositions = [];
    
    // Encontrar todas las posiciones vacías
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
            if (board[r][c] === 0 && !(r === excludeRow && c === excludeCol)) {
                validPositions.push({ row: r, col: c });
            }
        }
    }
    
    if (validPositions.length === 0) return null;
    
    // Filtrar posiciones que NO completarían líneas
    const safePositions = validPositions.filter(pos => {
        return !wouldCompleteLineAtPosition(pos.row, pos.col);
    });
    
    // Si hay posiciones seguras, usar esas; si no, usar cualquier posición válida
    const finalPositions = safePositions.length > 0 ? safePositions : validPositions;
    
    // Seleccionar posición aleatoria
    const randomIndex = Math.floor(Math.random() * finalPositions.length);
    return finalPositions[randomIndex];
}

function wouldCompleteLineAtPosition(row, col) {
    // Simular colocar una pieza en esta posición
    const tempBoard = board.map(r => [...r]);
    tempBoard[row][col] = 1;
    
    // Verificar si completaría una fila
    let rowComplete = true;
    for (let c = 0; c < 10; c++) {
        if (tempBoard[row][c] === 0 || tempBoard[row][c] === 3) { // 0 = vacío, 3 = cemento
            rowComplete = false;
            break;
        }
    }
    
    if (rowComplete) return true;
    
    // Verificar si completaría una columna
    let colComplete = true;
    for (let r = 0; r < 10; r++) {
        if (tempBoard[r][col] === 0 || tempBoard[r][col] === 3) { // 0 = vacío, 3 = cemento
            colComplete = false;
            break;
        }
    }
    
    return colComplete;
}

function createTeleportationEffect(oldRow, oldCol, newRow, newCol, pieceColor) {
    if (!boardElement || !portalCanvas) return;
    
    // Obtener posiciones en pantalla
    const oldCellElement = boardElement.querySelector(`[data-row='${oldRow}'][data-col='${oldCol}']`);
    const newCellElement = boardElement.querySelector(`[data-row='${newRow}'][data-col='${newCol}']`);
    
    if (!oldCellElement || !newCellElement) return;
    
    const oldRect = oldCellElement.getBoundingClientRect();
    const newRect = newCellElement.getBoundingClientRect();
    
    const oldX = oldRect.left + oldRect.width / 2;
    const oldY = oldRect.top + oldRect.height / 2;
    const newX = newRect.left + newRect.width / 2;
    const newY = newRect.top + newRect.height / 2;
    
    // Crear portal de salida
    const exitPortal = new TeleportationPortal(oldX, oldY, 'exit', pieceColor);
    portalEffects.push(exitPortal);
    
    // Crear portal de entrada (con delay)
    setTimeout(() => {
        const entryPortal = new TeleportationPortal(newX, newY, 'entry', pieceColor);
        portalEffects.push(entryPortal);
    }, 300);
    
    // Crear túnel dimensional conectando ambos portales
    const tunnel = new DimensionalTunnel(oldX, oldY, newX, newY, pieceColor);
    portalEffects.push(tunnel);
    
    // Crear partículas de teletransportación
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            portalParticles.push(new TeleportParticle(oldX, oldY, newX, newY, pieceColor));
        }, i * 15);
    }
    
    console.log(`🌀 Efectos de teletransportación creados de (${oldX}, ${oldY}) a (${newX}, ${newY})`);
}

function createDimensionalDistortion() {
    // Crear efecto de distorsión del espacio-tiempo
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const distortion = new DimensionalDistortion(centerX, centerY, teleportIntensity);
    portalEffects.push(distortion);
    
    console.log("🌀 Distorsión dimensional creada");
}

function createDimensionalWave() {
    // Crear onda expansiva dimensional
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const wave = new DimensionalWave(centerX, centerY, teleportIntensity);
    portalEffects.push(wave);
    
    console.log("🌀 Onda dimensional creada");
}

function animatePortalEffects() {
    if (!portalCtx) {
        console.warn("⚠️ portalCtx no disponible en animatePortalEffects");
        return;
    }
    
    // Verificar si hay efectos activos
    const hasActiveEffects = portalEffects.length > 0 || 
                           portalParticles.length > 0 || 
                           isTeleportWarningActive ||
                           dimensionalRifts.length > 0;
    
    // SIEMPRE limpiar el canvas completamente
    portalCtx.clearRect(0, 0, portalCanvas.width, portalCanvas.height);
    
    // Actualizar y dibujar efectos de portales
    for (let i = portalEffects.length - 1; i >= 0; i--) {
        const effect = portalEffects[i];
        if (!effect.update()) {
            portalEffects.splice(i, 1);
        } else {
            effect.draw();
        }
    }
    
    // Actualizar y dibujar partículas
    for (let i = portalParticles.length - 1; i >= 0; i--) {
        const particle = portalParticles[i];
        if (!particle.update()) {
            portalParticles.splice(i, 1);
        } else {
            particle.draw();
        }
    }
    
    // Actualizar y dibujar grietas dimensionales
    for (let i = dimensionalRifts.length - 1; i >= 0; i--) {
        const rift = dimensionalRifts[i];
        if (!rift.update()) {
            dimensionalRifts.splice(i, 1);
        } else {
            rift.draw();
        }
    }
    
    // Dibujar efectos de advertencia si están activos
    if (isTeleportWarningActive) {
        drawTeleportWarningEffects();
    }
    
    // Continuar animación si hay efectos definidos en hasActiveEffects
    if (hasActiveEffects) {
        teleportAnimationId = requestAnimationFrame(animatePortalEffects);
    } else {
        // Asegurar limpieza final del canvas
        if (portalCtx && portalCanvas) {
            portalCtx.clearRect(0, 0, portalCanvas.width, portalCanvas.height);
        }
        teleportAnimationId = null;
        console.log("🧹 Canvas de portales limpiado completamente - animación detenida porque no hay efectos.");
    }
}

function drawTeleportWarningEffects() {
    if (!piecesToTeleport || piecesToTeleport.length === 0 || !portalCtx || !portalCanvas) return;
    
    // console.log("DEBUG: drawTeleportWarningEffects está siendo llamada, pero no dibujará nada en el canvas para la advertencia inicial.");

    // Las siguientes líneas son para mantener los logs de depuración si aún son necesarios
    // para entender el estado del sistema en este punto, aunque no se dibuje.
    // Si ya no son necesarios, se pueden eliminar.
    const time = Date.now() * 0.008; 
    if (window.debugPortalCanvasOnce) {
        console.log("DEBUG Portal Canvas Rect (drawTeleportWarningEffects):", portalCanvas.getBoundingClientRect());
        console.log("DEBUG window scroll X,Y (drawTeleportWarningEffects):", window.scrollX, window.scrollY);
        window.debugPortalCanvasOnce = false; 
    }

    piecesToTeleport.forEach(piece => {
        const cellElement = boardElement.querySelector(`[data-row='${piece.row}'][data-col='${piece.col}']`);
        if (!cellElement) {
            return;
        }
        const cellRect = cellElement.getBoundingClientRect(); 
        if (cellRect.width === 0 && cellRect.height === 0) {
            return; 
        }

        if (piece === piecesToTeleport[0] && window.debugTeleportPieceOnce) {
            const centerX = cellRect.left + cellRect.width / 2;
            const centerY = cellRect.top + cellRect.height / 2;
            console.log(`DEBUG Cell [${piece.row},${piece.col}] Rect (drawTeleportWarningEffects):`, cellRect);
            console.log(`DEBUG Calculated centerX, centerY (drawTeleportWarningEffects): ${centerX}, ${centerY}`);
            window.debugTeleportPieceOnce = false; 
        }
    });

    // No hay código de dibujo aquí para el efecto de advertencia inicial en la celda.
    // Todo el resaltado de la celda se confía al CSS '.portal-warning'.
}

function stopDimensionalPortals() {
    console.log("🌀 Deteniendo portales dimensionales");
    
    // Limpiar temporizadores
    if (teleportTimeoutId) {
        clearTimeout(teleportTimeoutId);
        teleportTimeoutId = null;
    }
    
    if (teleportWarningTimeoutId) {
        clearTimeout(teleportWarningTimeoutId);
        teleportWarningTimeoutId = null;
    }
    
    // Detener animación
    if (teleportAnimationId) {
        cancelAnimationFrame(teleportAnimationId);
        teleportAnimationId = null;
    }
    
    // Limpiar efectos visuales
    portalEffects = [];
    portalParticles = [];
    dimensionalRifts = [];
    isTeleportWarningActive = false;
    piecesToTeleport = [];
    
    // Limpiar advertencias visuales
    const warningElements = document.querySelectorAll('.portal-warning');
    warningElements.forEach(element => {
        element.classList.remove('portal-warning');
    });
}

function cleanupPortalSystem() {
    stopDimensionalPortals();
    
    // Remover canvas
    if (portalCanvas) {
        portalCanvas.remove();
        portalCanvas = null;
        portalCtx = null;
    }

    // Quitar listener de resize SI EXISTE
    if (window.portalResizeListenerAttached) {
        window.removeEventListener('resize', resizePortalCanvas);
        window.portalResizeListenerAttached = false;
        console.log("🌀 Event listener para resize de portalCanvas eliminado.");
    }
    
    console.log("🌀 Sistema de portales limpiado completamente");
}

// --- CLASES PARA EFECTOS DE PORTALES DIMENSIONALES ---

class TeleportationPortal {
    constructor(x, y, type, pieceColor) {
        this.x = x;
        this.y = y;
        this.type = type; // 'exit' o 'entry'
        this.pieceColor = pieceColor;
        this.life = type === 'exit' ? 70 : 90; // Aumentar un poco la vida
        this.maxLife = this.life;
        this.radius = 0;
        this.maxRadius = 35; // Radio máximo un poco más grande
        this.rotation = Math.random() * Math.PI * 2; // Rotación inicial aleatoria
        this.rotationSpeed = (type === 'exit' ? 0.15 : -0.15) * (Math.random() * 0.5 + 0.75); // Velocidad de rotación variable
        this.pulsePhase = Math.random() * Math.PI;
        this.lineWidth = 2;
        this.sparks = []; // Para destellos

        // Crear espirales de energía (mantenemos algunas)
        this.spirals = [];
        const numSpirals = 5;
        for (let i = 0; i < numSpirals; i++) {
            this.spirals.push({
                angle: (i / numSpirals) * Math.PI * 2 + Math.random() * 0.5,
                radiusFactor: 0.6 + Math.random() * 0.3, // Radio variable
                speed: (0.1 + Math.random() * 0.1) * (type === 'exit' ? 1 : -1),
                phase: Math.random() * Math.PI * 2,
                length: 5 + Math.random() * 5
            });
        }
    }
    
    update() {
        this.life--;
        this.rotation += this.rotationSpeed;
        this.pulsePhase += 0.15; // Pulso más rápido
        this.lineWidth = 2 + Math.sin(this.pulsePhase * 2) * 1.5; // Grosor de línea pulsante

        const lifeRatio = this.life / this.maxLife;

        if (this.type === 'exit') {
            if (lifeRatio > 0.6) {
                this.radius = Math.min(this.maxRadius, this.radius + this.maxRadius * 0.1);
            } else {
                this.radius = Math.max(0, this.radius - this.maxRadius * 0.08);
            }
        } else { // 'entry'
            if (lifeRatio > 0.5) {
                this.radius = Math.min(this.maxRadius, this.radius + this.maxRadius * 0.08);
            } else {
                this.radius = Math.max(0, this.radius - this.maxRadius * 0.1);
            }
        }
        
        this.spirals.forEach(spiral => {
            spiral.angle += spiral.speed;
            spiral.phase += 0.2;
        });

        // Añadir chispas aleatoriamente
        if (Math.random() < 0.4 && this.radius > 5) { // Más chispas
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.sparks.push({
                x: Math.cos(angle) * this.radius * 0.9,
                y: Math.sin(angle) * this.radius * 0.9,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 20 + Math.random() * 20,
                color: this.type === 'exit' ? `hsl(${280 + Math.random()*40}, 100%, 75%)` : `hsl(${180 + Math.random()*40}, 100%, 75%)`
            });
        }

        // Actualizar chispas
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const s = this.sparks[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life--;
            s.vx *= 0.95;
            s.vy *= 0.95;
            if (s.life <= 0) {
                this.sparks.splice(i, 1);
            }
        }
        
        return this.life > 0;
    }
    
    draw() {
        if (!portalCtx) return;
        console.log(`[TeleportEffect] Drawing TeleportationPortal (type: ${this.type}) at x:${this.x.toFixed(1)}, y:${this.y.toFixed(1)}, radius:${this.radius.toFixed(1)}, alpha:${this.alpha.toFixed(2)}`);

        portalCtx.save();
        portalCtx.globalAlpha = this.alpha;
        portalCtx.translate(this.x, this.y);
        portalCtx.rotate(this.rotation);
        
        const alpha = Math.min(1, (this.life / this.maxLife) * 1.5); // Puede ser > 1 al inicio para más brillo
        const pulse = Math.sin(this.pulsePhase) * 0.2 + 0.8; // Pulso sutil del radio general
        const effectiveRadius = this.radius * pulse;

        // Dibujar chispas primero (detrás del portal)
        portalCtx.globalCompositeOperation = 'lighter';
        this.sparks.forEach(s => {
            portalCtx.fillStyle = s.color;
            portalCtx.beginPath();
            portalCtx.arc(s.x, s.y, Math.max(0, s.life / 10 + 1), 0, Math.PI * 2);
            portalCtx.fill();
        });
        portalCtx.globalCompositeOperation = 'source-over';
        
        // Gradiente radial del portal
        const gradient = portalCtx.createRadialGradient(0, 0, 0, 0, 0, effectiveRadius);
        const colorBase = this.type === 'exit' ? 290 : 200; // Tonos morados para salida, azules para entrada

        gradient.addColorStop(0, `hsla(${colorBase}, 100%, 70%, ${alpha * 0.8})`);
        gradient.addColorStop(0.6, `hsla(${colorBase + 20}, 100%, 60%, ${alpha * 0.5})`);
        gradient.addColorStop(1, `hsla(${colorBase + 40}, 100%, 50%, ${alpha * 0.2})`);
        
        portalCtx.fillStyle = gradient;
        portalCtx.beginPath();
        portalCtx.arc(0, 0, effectiveRadius, 0, Math.PI * 2);
        portalCtx.fill();
        
        // Anillo exterior brillante
        portalCtx.strokeStyle = `hsla(${colorBase - 20}, 100%, 80%, ${alpha * 0.9})`;
        portalCtx.lineWidth = this.lineWidth; // Usa el lineWidth pulsante
        portalCtx.shadowColor = portalCtx.strokeStyle;
        portalCtx.shadowBlur = 20 + Math.sin(this.pulsePhase) * 10;
        portalCtx.beginPath();
        portalCtx.arc(0, 0, effectiveRadius, 0, Math.PI * 2);
        portalCtx.stroke();

        // Anillo interior (más sutil)
        portalCtx.strokeStyle = `hsla(${colorBase}, 100%, 90%, ${alpha * 0.5})`;
        portalCtx.lineWidth = Math.max(1, this.lineWidth * 0.5);
        portalCtx.shadowBlur = 10;
        portalCtx.beginPath();
        portalCtx.arc(0, 0, effectiveRadius * 0.7, 0, Math.PI * 2);
        portalCtx.stroke();
        
        // Dibujar espirales de energía
        portalCtx.globalCompositeOperation = 'lighter';
        this.spirals.forEach((spiral, index) => {
            const spiralAlpha = alpha * (Math.sin(spiral.phase * 2) * 0.3 + 0.7);
            portalCtx.globalAlpha = Math.max(0, spiralAlpha);
            
            const x = Math.cos(spiral.angle) * effectiveRadius * spiral.radiusFactor;
            const y = Math.sin(spiral.angle) * effectiveRadius * spiral.radiusFactor;
            
            portalCtx.fillStyle = `hsla(${colorBase + index * 15}, 100%, ${75 + Math.sin(spiral.phase)*10}%, ${0.6 + Math.sin(spiral.phase)*0.3})`;
            portalCtx.shadowBlur = 8;
            portalCtx.beginPath();
            portalCtx.moveTo(x, y);
            for(let j = 0; j < 5; j++) {
                const tailX = x + Math.cos(spiral.angle + Math.PI + j*0.1) * spiral.length * (spiralAlpha * 0.5 + 0.5) * (j/5);
                const tailY = y + Math.sin(spiral.angle + Math.PI + j*0.1) * spiral.length * (spiralAlpha * 0.5 + 0.5) * (j/5);
                portalCtx.lineTo(tailX, tailY);
            }
            //portalCtx.arc(x, y, 2 + spiralAlpha * 2, 0, Math.PI * 2);
            portalCtx.fill();
        });
        portalCtx.globalCompositeOperation = 'source-over';
        
        portalCtx.restore();
    }
}

class DimensionalTunnel {
    constructor(startX, startY, endX, endY, pieceColor) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.pieceColor = pieceColor;
        this.life = 90;
        this.maxLife = 90;
        this.segments = [];
        this.particles = [];
        
        this.generateTunnel();
    }
    
    generateTunnel() {
        const distance = Math.sqrt((this.endX - this.startX) ** 2 + (this.endY - this.startY) ** 2);
        const numSegments = Math.floor(distance / 15) + 3;
        
        this.segments = [];
        for (let i = 0; i <= numSegments; i++) {
            const t = i / numSegments;
            const x = this.startX + (this.endX - this.startX) * t;
            const y = this.startY + (this.endY - this.startY) * t;
            
            // Añadir curvatura dimensional
            const curve = Math.sin(t * Math.PI) * 30;
            const perpX = -(this.endY - this.startY) / distance;
            const perpY = (this.endX - this.startX) / distance;
            
            this.segments.push({
                x: x + perpX * curve,
                y: y + perpY * curve,
                width: Math.sin(t * Math.PI) * 8 + 2
            });
        }
        
        // Crear partículas que viajan por el túnel
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                progress: Math.random(),
                speed: 0.02 + Math.random() * 0.03,
                size: Math.random() * 3 + 1,
                hue: Math.random() * 60 + 260
            });
        }
    }
    
    update() {
        this.life--;
        
        // Actualizar partículas del túnel
        this.particles.forEach(particle => {
            particle.progress += particle.speed;
            if (particle.progress > 1) {
                particle.progress = 0;
            }
        });
        
        // Regenerar túnel ocasionalmente para efecto ondulante
        if (Math.random() < 0.1) {
            this.generateTunnel();
        }
        
        return this.life > 0;
    }
    
    draw() {
        if (!portalCtx || this.segments.length === 0) return; // Mantener la guarda original si es relevante
        console.log(`[TeleportEffect] Drawing DimensionalTunnel from ${this.startX.toFixed(1)},${this.startY.toFixed(1)} to ${this.endX.toFixed(1)},${this.endY.toFixed(1)}, alpha:${this.alpha.toFixed(2)}, segments: ${this.segments.length}`);

        portalCtx.save();
        portalCtx.globalAlpha = this.alpha;
        
        // Dibujar túnel principal
        portalCtx.strokeStyle = `rgba(200, 100, 255, ${alpha * 0.6})`;
        portalCtx.lineWidth = 4;
        portalCtx.shadowColor = 'rgba(200, 100, 255, 0.8)';
        portalCtx.shadowBlur = 10;
        
        portalCtx.beginPath();
        if (this.segments.length > 0) {
            portalCtx.moveTo(this.segments[0].x, this.segments[0].y);
            for (let i = 1; i < this.segments.length; i++) {
                portalCtx.lineTo(this.segments[i].x, this.segments[i].y);
            }
        }
        portalCtx.stroke();
        
        // Dibujar partículas viajando por el túnel
        this.particles.forEach(particle => {
            const segmentIndex = Math.floor(particle.progress * (this.segments.length - 1));
            const segment = this.segments[segmentIndex];
            
            if (segment) {
                portalCtx.fillStyle = `hsl(${particle.hue}, 100%, 70%)`;
                portalCtx.shadowBlur = 6;
                portalCtx.beginPath();
                portalCtx.arc(segment.x, segment.y, particle.size, 0, Math.PI * 2);
                portalCtx.fill();
            }
        });
        
        portalCtx.restore();
    }
}

class TeleportParticle {
    constructor(startX, startY, endX, endY, pieceColor) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.x = startX;
        this.y = startY;
        this.progress = 0;
        this.speed = 0.015 + Math.random() * 0.02;
        this.life = 120;
        this.maxLife = 120;
        this.size = Math.random() * 4 + 2;
        this.hue = Math.random() * 60 + 260; // Púrpura/magenta
        this.trail = [];
        this.maxTrailLength = 8;
    }
    
    update() {
        this.life--;
        this.progress += this.speed;
        
        // Movimiento con curva dimensional
        const t = this.progress;
        const curve = Math.sin(t * Math.PI * 2) * 20;
        
        this.x = this.startX + (this.endX - this.startX) * t;
        this.y = this.startY + (this.endY - this.startY) * t + curve;
        
        // Actualizar trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        return this.life > 0 && this.progress < 1.2;
    }
    
    draw() {
        if (!portalCtx) return;
        
        const alpha = Math.min(1, this.life / this.maxLife);
        
        portalCtx.save();
        
        // Dibujar trail
        this.trail.forEach((point, index) => {
            const trailAlpha = alpha * (index / this.trail.length) * 0.5;
            portalCtx.globalAlpha = trailAlpha;
            portalCtx.fillStyle = `hsl(${this.hue}, 100%, 70%)`;
            portalCtx.beginPath();
            portalCtx.arc(point.x, point.y, this.size * 0.5, 0, Math.PI * 2);
            portalCtx.fill();
        });
        
        // Dibujar partícula principal
        portalCtx.globalAlpha = alpha;
        portalCtx.fillStyle = `hsl(${this.hue}, 100%, 80%)`;
        portalCtx.shadowColor = `hsl(${this.hue}, 100%, 60%)`;
        portalCtx.shadowBlur = 8;
        portalCtx.beginPath();
        portalCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        portalCtx.fill();
        
        portalCtx.restore();
    }
}

class PortalWarningEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 180; // 3 segundos a 60fps
        this.maxLife = 180;
        this.rings = [];
        
        // Crear anillos de advertencia
        for (let i = 0; i < 3; i++) {
            this.rings.push({
                radius: 0,
                maxRadius: 25 + i * 8,
                speed: 1 + i * 0.3,
                delay: i * 20,
                hue: 280 + i * 20
            });
        }
    }
    
    update() {
        this.life--;
        
        // Actualizar anillos
        this.rings.forEach(ring => {
            if (ring.delay <= 0) {
                ring.radius += ring.speed;
                if (ring.radius > ring.maxRadius) {
                    ring.radius = 0; // Reiniciar
                }
            } else {
                ring.delay--;
            }
        });
        
        return this.life > 0;
    }
    
    draw() {
        if (!portalCtx) return;
        
        const alpha = Math.min(1, this.life / this.maxLife);
        
        portalCtx.save();
        
        this.rings.forEach(ring => {
            if (ring.radius > 0) {
                const ringAlpha = alpha * (1 - ring.radius / ring.maxRadius);
                portalCtx.globalAlpha = ringAlpha;
                portalCtx.strokeStyle = `hsl(${ring.hue}, 100%, 70%)`;
                portalCtx.lineWidth = 2;
                portalCtx.shadowColor = portalCtx.strokeStyle;
                portalCtx.shadowBlur = 10;
                
                portalCtx.beginPath();
                portalCtx.arc(this.x, this.y, ring.radius, 0, Math.PI * 2);
                portalCtx.stroke();
            }
        });
        
        portalCtx.restore();
    }
}

class DimensionalDistortion {
    constructor(x, y, intensity) {
        this.x = x;
        this.y = y;
        this.intensity = intensity;
        this.life = 120;
        this.maxLife = 120;
        this.waves = [];
        
        // Crear ondas de distorsión
        for (let i = 0; i < 5; i++) {
            this.waves.push({
                radius: 0,
                maxRadius: 100 + i * 50,
                speed: 2 + i * 0.5,
                opacity: 0.3 - i * 0.05
            });
        }
    }
    
    update() {
        this.life--;
        
        this.waves.forEach(wave => {
            wave.radius += wave.speed;
            if (wave.radius > wave.maxRadius) {
                wave.radius = 0;
            }
        });
        
        return this.life > 0;
    }
    
    draw() {
        if (!portalCtx) return;
        
        const alpha = Math.min(1, this.life / this.maxLife);
        
        portalCtx.save();
        
        this.waves.forEach(wave => {
            if (wave.radius > 0) {
                const waveAlpha = alpha * wave.opacity * (1 - wave.radius / wave.maxRadius);
                portalCtx.globalAlpha = waveAlpha;
                portalCtx.strokeStyle = `hsl(280, 100%, 60%)`;
                portalCtx.lineWidth = 1;
                
                portalCtx.beginPath();
                portalCtx.arc(this.x, this.y, wave.radius, 0, Math.PI * 2);
                portalCtx.stroke();
            }
        });
        
        portalCtx.restore();
    }
}

class DimensionalWave {
    constructor(x, y, intensity) {
        this.x = x;
        this.y = y;
        this.intensity = intensity;
        this.life = 90;
        this.maxLife = 90;
        this.radius = 0;
        this.maxRadius = 200 * intensity;
        this.speed = 4;
    }
    
    update() {
        this.life--;
        this.radius += this.speed;
        
        return this.life > 0 && this.radius < this.maxRadius;
    }
    
    draw() {
        if (!portalCtx) return;
        
        const alpha = Math.min(1, this.life / this.maxLife) * (1 - this.radius / this.maxRadius);
        
        portalCtx.save();
        portalCtx.globalAlpha = alpha * 0.6;
        portalCtx.strokeStyle = `hsl(300, 100%, 70%)`;
        portalCtx.lineWidth = 4;
        portalCtx.shadowColor = 'hsl(300, 100%, 70%)';
        portalCtx.shadowBlur = 20;
        
        portalCtx.beginPath();
        portalCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        portalCtx.stroke();
        
        portalCtx.restore();
    }
}

// Función para verificar si se pueden reanudar las teletransportaciones
function checkAndResumeTeleportations() {
    const currentLevelConfig = levelsConfiguration[currentSelectedLevelId];

    // Solo verificar si el nivel actual usa portales y el canvas está activo
    if (!currentLevelConfig || !currentLevelConfig.teleportInterval || !portalCanvas) {
        return;
    }
    
    // Contar piezas en el tablero
    let piecesCount = 0;
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
            if (board[r][c] === 1) {
                piecesCount++;
            }
        }
    }
    
    console.log(`🌀 Verificando piezas disponibles: ${piecesCount}`);
    
    // Si hay piezas y no hay teletransportación programada, reanudar
    if (piecesCount > 0 && !teleportTimeoutId && !isTeleportWarningActive) {
        console.log("🌀 Reanudando teletransportaciones - hay piezas disponibles");
        // Usar la configuración del nivel actual
        teleportTimeoutId = setTimeout(() => {
            // Pasar la configuración del nivel actual a triggerTeleportWarning
            triggerTeleportWarning(currentLevelConfig);
        }, 3000); // Considerar si este delay de 3000ms debería ser configurable
    }
}

// --- FUNCIONES SIMPLIFICADAS PARA DISPOSITIVOS DE BAJO RENDIMIENTO ---

// Versión simplificada de lluvia de cemento (sin animaciones complejas)
function startSimplifiedCementRain(levelConfig) {
    console.log("🔧 Iniciando lluvia de cemento simplificada...");
    
    const dropSimplifiedCement = () => {
        if (currentGameMode !== 'levels' || currentSelectedLevelId !== levelConfig.id) {
            return; // Salir si ya no estamos en el nivel correcto
        }
        
        // Encontrar posición aleatoria válida
        const availablePositions = [];
        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
                if (board[r][c] === 0) { // Solo celdas vacías
                    availablePositions.push({ row: r, col: c });
                }
            }
        }
        
        if (availablePositions.length > 0) {
            const randomPos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
            
            // Colocar cemento directamente sin animación
            board[randomPos.row][randomPos.col] = 3;
            const cellElement = boardElement.querySelector(`[data-row='${randomPos.row}'][data-col='${randomPos.col}']`);
            if (cellElement) {
                cellElement.classList.add('cement-block');
                cellElement.dataset.cementBlock = 'true';
                
                // Efecto visual simple
                cellElement.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    cellElement.style.transform = '';
                }, 200);
            }
            
            console.log(`Cemento colocado en (${randomPos.row}, ${randomPos.col}) - Modo simplificado`);
        }
        
        // Programar siguiente caída
        const nextInterval = levelConfig.cementRainInterval + (Math.random() * 2000);
        cementRainTimeoutId = setTimeout(dropSimplifiedCement, nextInterval);
    };
    
    // Iniciar primera caída
    const initialDelay = 3000 + (Math.random() * 2000);
    cementRainTimeoutId = setTimeout(dropSimplifiedCement, initialDelay);
}

// Versión simplificada de tormenta eléctrica (efectos reducidos)
function startSimplifiedLightningStorm(levelConfig) {
    console.log("🔧 Iniciando tormenta eléctrica simplificada...");
    
    const triggerSimplifiedLightning = () => {
        if (currentGameMode !== 'levels' || currentSelectedLevelId !== levelConfig.id) {
            return;
        }
        
        // Encontrar piezas para destruir
        const piecesToDestroy = [];
        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
                if (board[r][c] === 1) { // Solo piezas normales
                    piecesToDestroy.push({ row: r, col: c });
                }
            }
        }
        
        if (piecesToDestroy.length > 0) {
            // Seleccionar hasta 3 piezas aleatoriamente
            const maxPieces = Math.min(3, piecesToDestroy.length);
            const selectedPieces = [];
            
            for (let i = 0; i < maxPieces; i++) {
                const randomIndex = Math.floor(Math.random() * piecesToDestroy.length);
                selectedPieces.push(piecesToDestroy.splice(randomIndex, 1)[0]);
            }
            
            // Destruir piezas con efecto visual simple
            selectedPieces.forEach(piece => {
                board[piece.row][piece.col] = 0;
                const cellElement = boardElement.querySelector(`[data-row='${piece.row}'][data-col='${piece.col}']`);
                if (cellElement) {
                    // Efecto visual simple
                    cellElement.style.backgroundColor = '#ffff00';
                    cellElement.style.boxShadow = '0 0 10px #ffff00';
                    
                    setTimeout(() => {
                        cellElement.classList.remove('piece-block');
                        cellElement.style.backgroundColor = '';
                        cellElement.style.boxShadow = '';
                        delete cellElement.dataset.pieceColor;
                    }, 300);
                }
            });
            
            console.log(`⚡ Rayo simplificado destruyó ${selectedPieces.length} piezas`);
        }
        
        // Programar siguiente rayo
        const nextInterval = levelConfig.lightningInterval + (Math.random() * 3000);
        lightningTimeoutId = setTimeout(triggerSimplifiedLightning, nextInterval);
    };
    
    // Iniciar primera tormenta
    const initialDelay = 5000 + (Math.random() * 3000);
    lightningTimeoutId = setTimeout(triggerSimplifiedLightning, initialDelay);
}

// Versión simplificada de portales dimensionales (sin efectos complejos)
function startSimplifiedDimensionalPortals(levelConfig) {
    console.log("🔧 Iniciando portales dimensionales simplificados...");
    
    const triggerSimplifiedTeleport = () => {
        if (currentGameMode !== 'levels' || currentSelectedLevelId !== levelConfig.id) {
            return;
        }
        
        // Encontrar piezas para teletransportar
        const availablePieces = [];
        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
                if (board[r][c] === 1) { // Solo piezas normales
                    availablePieces.push({ row: r, col: c });
                }
            }
        }
        
        if (availablePieces.length >= 2) {
            // Seleccionar 1-2 piezas aleatoriamente
            const numPieces = Math.min(2, Math.floor(Math.random() * 2) + 1);
            const selectedPieces = [];
            
            for (let i = 0; i < numPieces; i++) {
                const randomIndex = Math.floor(Math.random() * availablePieces.length);
                selectedPieces.push(availablePieces.splice(randomIndex, 1)[0]);
            }
            
            // Teletransportar cada pieza
            selectedPieces.forEach(piece => {
                // Encontrar nueva posición
                const emptyPositions = [];
                for (let r = 0; r < numRows; r++) {
                    for (let c = 0; c < numCols; c++) {
                        if (board[r][c] === 0 && (r !== piece.row || c !== piece.col)) {
                            emptyPositions.push({ row: r, col: c });
                        }
                    }
                }
                
                if (emptyPositions.length > 0) {
                    const newPos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
                    const oldCellElement = boardElement.querySelector(`[data-row='${piece.row}'][data-col='${piece.col}']`);
                    const newCellElement = boardElement.querySelector(`[data-row='${newPos.row}'][data-col='${newPos.col}']`);
                    
                    if (oldCellElement && newCellElement) {
                        // Obtener color de la pieza
                        const pieceColor = oldCellElement.dataset.pieceColor || '#8A2BE2';
                        
                        // Efecto visual simple en posición original
                        oldCellElement.style.backgroundColor = '#00ffff';
                        oldCellElement.style.transform = 'scale(0.8)';
                        
                        setTimeout(() => {
                            // Limpiar posición original
                            board[piece.row][piece.col] = 0;
                            oldCellElement.classList.remove('piece-block');
                            oldCellElement.style.backgroundColor = '';
                            oldCellElement.style.transform = '';
                            delete oldCellElement.dataset.pieceColor;
                            
                            // Colocar en nueva posición
                            board[newPos.row][newPos.col] = 1;
                            newCellElement.classList.add('piece-block');
                            newCellElement.style.backgroundColor = pieceColor;
                            newCellElement.dataset.pieceColor = pieceColor;
                            
                            // Efecto visual en nueva posición
                            newCellElement.style.backgroundColor = '#00ffff';
                            newCellElement.style.transform = 'scale(1.2)';
                            
                            setTimeout(() => {
                                newCellElement.style.backgroundColor = pieceColor;
                                newCellElement.style.transform = '';
                            }, 200);
                            
                        }, 300);
                    }
                    
                    console.log(`🌀 Pieza teletransportada de (${piece.row},${piece.col}) a (${newPos.row},${newPos.col}) - Modo simplificado`);
                }
            });
        }
        
        // Programar siguiente teletransportación
        const nextInterval = levelConfig.teleportInterval + (Math.random() * 4000);
        teleportTimeoutId = setTimeout(triggerSimplifiedTeleport, nextInterval);
    };
    
    // Iniciar primera teletransportación
    const initialDelay = 8000 + (Math.random() * 4000);
    teleportTimeoutId = setTimeout(triggerSimplifiedTeleport, initialDelay);
}

// Función para optimizar partículas basada en el rendimiento del dispositivo
function createOptimizedParticles(x, y, color, count = 10) {
    if (!devicePerformance.shouldUseEffects()) {
        return; // No crear partículas en dispositivos de bajo rendimiento
    }
    
    const maxParticles = devicePerformance.getMaxParticles();
    const actualCount = Math.min(count, Math.floor(maxParticles / 4));
    
    for (let i = 0; i < actualCount; i++) {
        if (particles.length < maxParticles) {
            particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                life: Math.random() * 30 + 20,
                maxLife: Math.random() * 30 + 20,
                color: color,
                size: Math.random() * 3 + 1
            });
        }
    }
}

// Función para ajustar la calidad de animaciones basada en el rendimiento
function getOptimizedAnimationDuration(baseDuration) {
    const quality = devicePerformance.getAnimationQuality();
    
    switch (quality) {
        case 'low':
            return Math.max(100, baseDuration * 0.5); // Animaciones más rápidas
        case 'medium':
            return baseDuration * 0.75;
        case 'high':
        default:
            return baseDuration;
    }
}

// Función para verificar si se deben usar sombras
function shouldUseShadows() {
    return devicePerformance.adaptiveSettings.shadowsEnabled;
}

// Función para obtener la resolución optimizada del canvas
function getOptimizedCanvasSize(baseWidth, baseHeight) {
    const resolution = devicePerformance.getCanvasResolution();
    return {
        width: Math.floor(baseWidth * resolution),
        height: Math.floor(baseHeight * resolution)
    };
}

// --- FIN FUNCIONES SIMPLIFICADAS ---

// --- FUNCIONES DE INTERFAZ DE RENDIMIENTO ---

// Función para mostrar información de rendimiento al usuario
function showPerformanceInfo() {
    const report = devicePerformance.getPerformanceReport();
    
    const modal = document.createElement('div');
    modal.className = 'performance-info-modal';
    modal.innerHTML = `
        <div class="performance-info-content">
            <h2>📱 Información de Rendimiento</h2>
            <div class="performance-section">
                <h3>🔍 Detección del Dispositivo</h3>
                <p><strong>Nivel de Rendimiento:</strong> <span class="performance-level ${report.level}">${report.level.toUpperCase()}</span></p>
                <p><strong>Núcleos de CPU:</strong> ${report.metrics.cores}</p>
                <p><strong>Memoria RAM:</strong> ${report.metrics.memory} GB</p>
                <p><strong>GPU:</strong> ${report.metrics.gpuTier || 'No detectada'}</p>
                <p><strong>Conexión:</strong> ${getConnectionTypeText(report.metrics.connection)}</p>
                <p><strong>FPS Actual:</strong> ${report.metrics.frameRate}</p>
                ${report.metrics.batteryLevel ? `<p><strong>Batería:</strong> ${Math.round(report.metrics.batteryLevel * 100)}%</p>` : ''}
            </div>
            
            <div class="performance-section">
                <h3>🧪 Resultados de Benchmarks</h3>
                <p><strong>Rendimiento Canvas:</strong> ${Math.round(report.benchmarks.canvasPerformance)}/100</p>
                <p><strong>Rendimiento Animaciones:</strong> ${Math.round(report.benchmarks.animationPerformance)}/100</p>
                <p><strong>Uso de Memoria:</strong> ${Math.round(report.benchmarks.memoryUsage)}/100</p>
                <p><strong>Puntuación General:</strong> ${Math.round(report.benchmarks.overallScore)}/100</p>
            </div>
            
            <div class="performance-section">
                <h3>⚙️ Configuraciones Aplicadas</h3>
                <p><strong>Máximo de Partículas:</strong> ${report.settings.maxParticles}</p>
                <p><strong>Calidad de Animación:</strong> ${report.settings.animationQuality}</p>
                <p><strong>Efectos Habilitados:</strong> ${report.settings.effectsEnabled ? 'Sí' : 'No'}</p>
                <p><strong>Sombras:</strong> ${report.settings.shadowsEnabled ? 'Sí' : 'No'}</p>
                <p><strong>FPS Objetivo:</strong> ${report.settings.frameRateTarget}</p>
                <p><strong>Resolución Canvas:</strong> ${Math.round(report.settings.canvasResolution * 100)}%</p>
            </div>
            
            <div class="performance-controls">
                <button onclick="forcePerformanceLevel('low')" class="perf-btn low">Forzar Bajo</button>
                <button onclick="forcePerformanceLevel('medium')" class="perf-btn medium">Forzar Medio</button>
                <button onclick="forcePerformanceLevel('high')" class="perf-btn high">Forzar Alto</button>
                <button onclick="resetPerformanceDetection()" class="perf-btn reset">Auto-Detectar</button>
            </div>
            
            <button onclick="closePerformanceInfo()" class="close-performance-btn">Cerrar</button>
        </div>
    `;
    
    // Agregar estilos
    const style = document.createElement('style');
    style.textContent = `
        .performance-info-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        }
        
        .performance-info-content {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 15px;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            color: white;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .performance-info-content h2 {
            margin-top: 0;
            text-align: center;
            color: #fff;
        }
        
        .performance-section {
            margin: 15px 0;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
        }
        
        .performance-section h3 {
            margin-top: 0;
            color: #ffd700;
        }
        
        .performance-level.low { color: #ff6b6b; }
        .performance-level.medium { color: #feca57; }
        .performance-level.high { color: #48dbfb; }
        
        .performance-controls {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin: 15px 0;
        }
        
        .perf-btn {
            padding: 8px 12px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
        }
        
        .perf-btn.low { background: #ff6b6b; color: white; }
        .perf-btn.medium { background: #feca57; color: black; }
        .perf-btn.high { background: #48dbfb; color: black; }
        .perf-btn.reset { background: #a55eea; color: white; }
        
        .perf-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .close-performance-btn {
            width: 100%;
            padding: 12px;
            background: #ff4757;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 15px;
        }
        
        .close-performance-btn:hover {
            background: #ff3838;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
}

// Función para cerrar la información de rendimiento
function closePerformanceInfo() {
    const modal = document.querySelector('.performance-info-modal');
    if (modal) {
        modal.remove();
    }
}

// Función para forzar un nivel de rendimiento específico
function forcePerformanceLevel(level) {
    devicePerformance.performanceLevel = level;
    devicePerformance.configureAdaptiveSettings();
    console.log(`🔧 Nivel de rendimiento forzado a: ${level.toUpperCase()}`);
    
    // Actualizar la información mostrada
    closePerformanceInfo();
    setTimeout(() => showPerformanceInfo(), 100);
}

// Función para resetear la detección automática
function resetPerformanceDetection() {
    devicePerformance.calculatePerformanceLevel();
    devicePerformance.configureAdaptiveSettings();
    console.log("🔄 Detección automática de rendimiento restablecida");
    
    // Actualizar la información mostrada
    closePerformanceInfo();
    setTimeout(() => showPerformanceInfo(), 100);
}

// Función auxiliar para obtener texto de tipo de conexión
function getConnectionTypeText(connectionLevel) {
    switch (connectionLevel) {
        case 1: return 'Muy Lenta (2G)';
        case 2: return 'Lenta (2G)';
        case 3: return 'Media (3G)';
        case 4: return 'Rápida (4G+)';
        default: return 'Desconocida';
    }
}

// Función para agregar botón de información de rendimiento a la interfaz
function addPerformanceInfoButton() {
    // Verificar si ya existe el botón
    if (document.getElementById('performance-info-btn')) return;
    
    const button = document.createElement('button');
    button.id = 'performance-info-btn';
    button.innerHTML = '📊';
    button.title = 'Información de Rendimiento';
    button.onclick = showPerformanceInfo;
    
    // Estilos del botón
    button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-size: 20px;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
    `;
    
    // Efectos hover
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
        button.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    });
    
    document.body.appendChild(button);
}

// Función para remover el botón de información de rendimiento
function removePerformanceInfoButton() {
    const button = document.getElementById('performance-info-btn');
    if (button) {
        button.remove();
    }
}

// --- FIN FUNCIONES DE INTERFAZ DE RENDIMIENTO ---

