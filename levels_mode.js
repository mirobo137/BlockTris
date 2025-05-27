// Archivo para la lógica específica del Modo Niveles
console.log("levels_mode.js cargado");

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

// --- CLASE PARA PIEZAS DE CEMENTO CAYENDO ---
class FallingCementPiece {
    constructor(targetRow, targetCol) {
        this.targetRow = targetRow;
        this.targetCol = targetCol;
        this.x = 0; // Se calculará basado en la posición del tablero
        this.y = -100; // Empieza arriba de la pantalla
        this.targetX = 0; // Posición final X
        this.targetY = 0; // Posición final Y
        this.speedY = 2; // Velocidad inicial de caída
        this.acceleration = 0.3; // Aceleración de la gravedad
        this.rotation = 0; // Rotación de la pieza
        this.rotationSpeed = (Math.random() - 0.5) * 0.2; // Velocidad de rotación aleatoria
        this.size = CELL_SIZE; // Tamaño de la pieza
        this.shadowOpacity = 0; // Opacidad de la sombra
        this.impacted = false; // Si ya impactó
        this.impactParticles = []; // Partículas del impacto
        
        this.calculateTargetPosition();
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
        this.speedY += this.acceleration;
        this.y += this.speedY;
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
        
        // Crear partículas de impacto
        for (let i = 0; i < 15; i++) {
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
        
        // Efecto de temblor de pantalla
        this.createScreenShake();
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
        
        // Dibujar sombra en el suelo
        if (this.shadowOpacity > 0) {
            cementAnimationCtx.globalAlpha = this.shadowOpacity * 0.5;
            cementAnimationCtx.fillStyle = '#000000';
            cementAnimationCtx.beginPath();
            cementAnimationCtx.ellipse(this.targetX, this.targetY + 5, this.size * 0.6, this.size * 0.3, 0, 0, Math.PI * 2);
            cementAnimationCtx.fill();
        }
        
        // Dibujar la pieza cayendo
        cementAnimationCtx.globalAlpha = 1;
        cementAnimationCtx.translate(this.x, this.y);
        cementAnimationCtx.rotate(this.rotation);
        
        // Estilo de cemento con textura (más claro y visible)
        cementAnimationCtx.fillStyle = '#A0A0A0'; // Gris claro
        cementAnimationCtx.strokeStyle = '#5A5A5A'; // Borde gris medio
        cementAnimationCtx.lineWidth = 2;
        
        // Dibujar el bloque principal
        cementAnimationCtx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        cementAnimationCtx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
        
        // Añadir gradiente interno para efecto 3D
        const gradient = cementAnimationCtx.createLinearGradient(-this.size/2, -this.size/2, this.size/2, this.size/2);
        gradient.addColorStop(0, '#B8B8B8'); // Más claro arriba-izquierda
        gradient.addColorStop(0.5, '#A0A0A0'); // Color medio
        gradient.addColorStop(1, '#707070'); // Más oscuro abajo-derecha
        cementAnimationCtx.fillStyle = gradient;
        cementAnimationCtx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        
        // Añadir textura de cemento con puntos más visibles
        cementAnimationCtx.fillStyle = '#FFFFFF'; // Puntos blancos para textura
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
        
        // Añadir algunos puntos oscuros para contraste
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
        
        cementAnimationCtx.globalAlpha = 1; // Restaurar opacidad
        
        cementAnimationCtx.restore();
        
        // Dibujar partículas de impacto
        if (this.impacted) {
            this.impactParticles.forEach(particle => {
                cementAnimationCtx.save();
                cementAnimationCtx.globalAlpha = particle.life / particle.maxLife;
                cementAnimationCtx.fillStyle = '#C0C0C0'; // Color gris claro para las partículas
                cementAnimationCtx.beginPath();
                cementAnimationCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                cementAnimationCtx.fill();
                
                // Añadir un pequeño borde más oscuro para definición
                cementAnimationCtx.strokeStyle = '#808080';
                cementAnimationCtx.lineWidth = 0.5;
                cementAnimationCtx.stroke();
                cementAnimationCtx.restore();
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
    
    // Configurar tamaño del canvas
    if (boardElement && gameContainerElement) {
        const containerRect = gameContainerElement.getBoundingClientRect();
        cementAnimationCanvas.width = containerRect.width;
        cementAnimationCanvas.height = containerRect.height;
        
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
        if (currentSelectedLevelId === 3 && currentGameMode === 'levels') {
            cementRainTimeoutId = setTimeout(dropCementPiece, levelConfig.cementRainInterval);
        }
    };
    
    // Iniciar la primera caída después de 5 segundos
    cementRainTimeoutId = setTimeout(dropCementPiece, 5000);
}

function animateFallingCement() {
    if (!cementAnimationCtx || !cementAnimationCanvas) return;
    
    // Limpiar canvas
    cementAnimationCtx.clearRect(0, 0, cementAnimationCanvas.width, cementAnimationCanvas.height);
    
    // Actualizar y dibujar todas las piezas cayendo
    for (let i = fallingCementPieces.length - 1; i >= 0; i--) {
        const piece = fallingCementPieces[i];
        const finished = piece.update();
        piece.draw();
        
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
        objectiveText: "Destruye 3 bloques de hielo.", 
        locked: false, // Desbloqueado para probar
        maxMoves: 30, // Aumentado de 25 a 30 movimientos
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
        objectiveText: "Alcanza 1000 puntos mientras llueven bloques de cemento cada 25 segundos.", 
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
        maxMoves: 30,
        locked: false, // Desbloqueado para probar
        starCriteria: 'movesRemaining',
        starsThresholds: { threeStars: 8, twoStars: 4 } // 3 estrellas >= 8 mov. restantes, 2 estrellas >= 4 mov. restantes
    },
    5: { 
        id: 5, 
        name: "Nivel 5 - Tormenta Eléctrica", 
        objectiveText: "Alcanza 1000 puntos en 90 segundos mientras rayos electrifican el tablero.", 
        targetScore: 1000,
        maxTimeSeconds: 90, // 90 segundos límite
        lightningInterval: 20000, // Rayos cada 20 segundos
        lightningWarningTime: 2000, // Advertencia de 2 segundos
        electrifiedDuration: 8000, // Zonas electrificadas por 8 segundos
        locked: false, // Desbloqueado para probar
        starCriteria: 'time',
        starsThresholds: { threeStars: 60, twoStars: 75 } // 3 estrellas <= 60s, 2 estrellas <= 75s
    },
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
    
    // Añadir anillo si es el Nivel 4
    if (currentSelectedLevelId === 4) {
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
            
            // Colocar anillo en el tablero si la pieza tenía uno (Nivel 4)
            if (currentSelectedLevelId === 4 && activePieceElement_levels && activePieceElement_levels.ringData) {
                placeRingsOnBoard(selectedPiece_levels.matrix, bestPlacePos.row, bestPlacePos.col, activePieceElement_levels.ringData);
            }
            
            if (activePieceElement_levels) activePieceElement_levels.remove(); 
            placed = true;
            await checkAndClearLines_levels(); 

            // Corrected piece replenishment: generate and append only one new piece
            const newSinglePiece_levels = generateSinglePieceElement_levels();
            
            // Añadir anillo a la nueva pieza si es el Nivel 4
            if (currentSelectedLevelId === 4) {
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
                
                // NUEVA VERIFICACIÓN: Zonas electrificadas inhabilitadas
                const cellKey = `${boardR}-${boardC}`;
                if (electrifiedCells.has(cellKey)) {
                    const electrifiedData = electrifiedCells.get(cellKey);
                    // Solo bloquear si es una zona vacía electrificada (no una pieza existente electrificada)
                    if (!electrifiedData.hasExistingPiece && Date.now() < electrifiedData.endTime) {
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
        if (levelObjectiveStartModalElement) {
            levelObjectiveStartModalElement.classList.remove('visible');
            levelObjectiveStartModalElement.classList.add('hidden');
        }
        if (typeof levelInitializationContinuation === 'function') {
            levelInitializationContinuation();
        }
        levelInitializationContinuation = null;
    });
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
    
    const levelConfig = levelsConfiguration[levelId];
    if (!levelConfig) {
        console.error(`No se encontró configuración para el nivel ${levelId}`);
        navigateTo('level-select'); 
        return;
    }
    currentSelectedLevelId = levelId; // Establecer el ID del nivel actual

    // Mostrar el modal de objetivo primero
    showInitialObjectiveModal(levelConfig, () => {
        // Esta función se ejecutará cuando el jugador cierre el modal de objetivo
        console.log("Continuando con la inicialización del nivel después del modal de objetivo.");
        levelStartTime = 0; // Resetear por si acaso
        if (levelConfig.starCriteria === 'time') {
            levelStartTime = Date.now();
            console.log("Temporizador de nivel iniciado.");
        }

        // Ocultar otros modales si estuvieran visibles
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
        
        board.length = 0; 
        for (let i = 0; i < 10; i++) { 
            board.push(Array(10).fill(0));
        }
        score = 0;
        updateScore(0); 

        // Resetear estado de combo (copiado de la función original)
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
            if (particleCanvas && boardElement && gameContainerElement) { 
                setupParticleCanvas();
            } else {
                console.warn("PARTICLE DEBUG: No se pudo configurar el canvas (desde rAF en initializeLevel) porque faltan elementos.");
            }
        });
        particles = [];
        if (animationFrameIdParticles) {
            cancelAnimationFrame(animationFrameIdParticles);
            animationFrameIdParticles = null;
            if(particleCtx && particleCanvas) particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        }

        displayLevelObjective(levelConfig); // Llamar a la versión SIMPLIFICADA

        // Iniciar lluvia de cemento si es el Nivel 3
        if (levelConfig.id === 3 && levelConfig.cementRainInterval) {
            startCementRain(levelConfig);
        }

        // Inicializar sistema de anillos si es el Nivel 4
        if (levelConfig.id === 4 && levelConfig.targetRingsToCollect) {
            initializeRingSystem(levelConfig);
        }

        // Inicializar sistema de rayos si es el Nivel 5
        if (levelConfig.id === 5 && levelConfig.lightningInterval) {
            startLightningStorm(levelConfig);
        }

        updateScreenVisibility();
        console.log(`Nivel ${levelId} completamente cargado y listo para jugar.`);
    });
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
    if (levelConfig.id === 5 && levelConfig.maxTimeSeconds) {
        const remainingTime = Math.max(0, levelConfig.maxTimeSeconds - Math.floor((Date.now() - levelStartTime) / 1000));
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        content = `<p><span class="info-label">Meta:</span> ${levelConfig.targetScore} Pts | <span class="info-label">Tiempo:</span> <span id="time-remaining-display" class="${remainingTime <= 15 ? 'critical' : remainingTime <= 30 ? 'warning' : ''}">${timeString}</span></p>`;
        
        // Actualizar cada segundo
        setTimeout(() => {
            if (currentSelectedLevelId === 5 && levelStartTime > 0) {
                displayLevelObjective(levelConfig);
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
        lightningCanvas.style.position = 'absolute';
        lightningCanvas.style.top = '0';
        lightningCanvas.style.left = '0';
        lightningCanvas.style.pointerEvents = 'none';
        lightningCanvas.style.zIndex = '1000';
        document.body.appendChild(lightningCanvas);
        lightningCtx = lightningCanvas.getContext('2d');
    }
    
    // Ajustar tamaño del canvas
    lightningCanvas.width = window.innerWidth;
    lightningCanvas.height = window.innerHeight;
    
    console.log("Canvas de rayos configurado:", lightningCanvas.width, "x", lightningCanvas.height);
}

function startLightningStorm(levelConfig) {
    if (!levelConfig.lightningInterval) return;
    
    console.log("🌩️ Iniciando tormenta eléctrica cada", levelConfig.lightningInterval / 1000, "segundos");
    setupLightningCanvas();
    
    // Función para programar el próximo rayo
    const scheduleNextLightning = () => {
        lightningTimeoutId = setTimeout(() => {
            triggerLightningWarning(levelConfig);
        }, levelConfig.lightningInterval);
    };
    
    // Programar el primer rayo
    scheduleNextLightning();
    
    // Iniciar animación de efectos
    if (!lightningAnimationId) {
        animateLightningEffects();
    }
}

function triggerLightningWarning(levelConfig) {
    if (!boardElement) return;
    
    // Seleccionar objetivo aleatorio en el tablero
    const targetRow = Math.floor(Math.random() * 10);
    const targetCol = Math.floor(Math.random() * 10);
    
    // GUARDAR las coordenadas exactas para usar en el impacto
    currentLightningTarget = { row: targetRow, col: targetCol };
    isLightningWarningActive = true;
    
    console.log(`⚠️ Advertencia de rayo en posición [${targetRow}, ${targetCol}]`);
    
    // Mostrar advertencia visual
    showLightningWarning(targetRow, targetCol);
    
    // Programar el impacto del rayo - USAR LAS MISMAS COORDENADAS
    lightningWarningTimeoutId = setTimeout(() => {
        strikeLightning(currentLightningTarget.row, currentLightningTarget.col, levelConfig);
    }, levelConfig.lightningWarningTime);
    
    // Programar el próximo rayo
    lightningTimeoutId = setTimeout(() => {
        triggerLightningWarning(levelConfig);
    }, levelConfig.lightningInterval);
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
    console.log(`⚡ RAYO IMPACTA en [${targetRow}, ${targetCol}]!`);
    
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
    if (!boardElement || !lightningCanvas) return;
    
    const cellElement = boardElement.querySelector(`[data-row='${targetRow}'][data-col='${targetCol}']`);
    if (!cellElement) return;
    
    const cellRect = cellElement.getBoundingClientRect();
    const targetX = cellRect.left + cellRect.width / 2;
    const targetY = cellRect.top + cellRect.height / 2;
    
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
        }, i * 50);
    }
    
    // Crear efecto de impacto
    const impact = new LightningImpactEffect(targetX, targetY, 2);
    lightningEffects.push(impact);
    
    // Añadir partículas adicionales
    for (let i = 0; i < 30; i++) {
        lightningParticles.push(new ElectricParticle(
            targetX + (Math.random() - 0.5) * 40,
            targetY + (Math.random() - 0.5) * 40,
            Math.random() < 0.6 ? 'spark' : 'glow'
        ));
    }
}

function electrifyArea(centerRow, centerCol, levelConfig) {
    const currentTime = Date.now();
    const endTime = currentTime + levelConfig.electrifiedDuration;
    
    // Determinar el tamaño del área según la dificultad
    let areaSize = 3; // Por defecto 3x3
    const elapsedTime = (currentTime - levelStartTime) / 1000;
    if (elapsedTime > 45) { // Después de 45 segundos, área 5x5
        areaSize = 5;
    }
    
    const halfSize = Math.floor(areaSize / 2);
    
    // Electrificar área
    for (let r = centerRow - halfSize; r <= centerRow + halfSize; r++) {
        for (let c = centerCol - halfSize; c <= centerCol + halfSize; c++) {
            // Verificar límites del tablero
            if (r >= 0 && r < 10 && c >= 0 && c < 10) {
                const key = `${r}-${c}`;
                
                // Si hay una pieza en esta posición, electrificarla
                if (board[r][c] === 1) {
                    electrifiedCells.set(key, {
                        row: r,
                        col: c,
                        endTime: endTime,
                        hasExistingPiece: true
                    });
                    
                    // Aplicar efecto visual a la pieza existente
                    const cellElement = boardElement.querySelector(`[data-row='${r}'][data-col='${c}']`);
                    if (cellElement) {
                        cellElement.classList.add('electrified');
                        cellElement.dataset.electrifiedUntil = endTime;
                    }
                } else {
                    // Celda vacía - inhabilitar para nuevas piezas
                    electrifiedCells.set(key, {
                        row: r,
                        col: c,
                        endTime: endTime,
                        hasExistingPiece: false
                    });
                    
                    // Aplicar efecto visual de zona inhabilitada
                    const cellElement = boardElement.querySelector(`[data-row='${r}'][data-col='${c}']`);
                    if (cellElement) {
                        cellElement.classList.add('electrified', 'disabled');
                        cellElement.dataset.electrifiedUntil = endTime;
                    }
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
            
            // Limpiar efectos visuales
            const cellElement = boardElement.querySelector(`[data-row='${data.row}'][data-col='${data.col}']`);
            if (cellElement) {
                cellElement.classList.remove('electrified', 'disabled');
                delete cellElement.dataset.electrifiedUntil;
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
    // Simulación de sonido con efectos visuales adicionales
    console.log("🔊 TRUENO!");
    
    // Crear ondas de sonido visuales
    if (lightningCanvas && lightningCtx) {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const centerX = lightningCanvas.width / 2;
                const centerY = lightningCanvas.height / 2;
                
                lightningCtx.save();
                lightningCtx.globalAlpha = 0.3;
                lightningCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                lightningCtx.lineWidth = 2;
                lightningCtx.beginPath();
                lightningCtx.arc(centerX, centerY, i * 50, 0, Math.PI * 2);
                lightningCtx.stroke();
                lightningCtx.restore();
            }, i * 100);
        }
    }
}

function animateLightningEffects() {
    if (!lightningCtx) return;
    
    // Solo limpiar canvas si hay efectos activos para evitar parpadeos
    const hasActiveEffects = lightningEffects.length > 0 || lightningParticles.length > 0 || isLightningWarningActive;
    
    if (hasActiveEffects) {
        // Limpiar canvas con un fade suave en lugar de limpieza completa
        lightningCtx.save();
        lightningCtx.globalCompositeOperation = 'destination-out';
        lightningCtx.globalAlpha = 0.1; // Fade gradual en lugar de limpieza completa
        lightningCtx.fillRect(0, 0, lightningCanvas.width, lightningCanvas.height);
        lightningCtx.restore();
    }
    
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
    
    // Dibujar efectos de advertencia si están activos
    if (isLightningWarningActive) {
        drawLightningWarningEffects();
    }
    
    // Continuar animación solo si hay efectos activos o advertencias
    if (hasActiveEffects || isLightningWarningActive) {
        lightningAnimationId = requestAnimationFrame(animateLightningEffects);
    } else {
        // Limpiar completamente el canvas cuando no hay efectos
        lightningCtx.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);
        lightningAnimationId = null;
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
    isLightningWarningActive = false;
    currentLightningTarget = null;
    
    // Limpiar electrificación
    cleanupAllElectrification();
}

function cleanupAllElectrification() {
    electrifiedCells.forEach((data, key) => {
        const cellElement = boardElement.querySelector(`[data-row='${data.row}'][data-col='${data.col}']`);
        if (cellElement) {
            cellElement.classList.remove('electrified', 'disabled', 'lightning-warning');
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
        this.life = 60;
        this.maxLife = 60;
        this.rings = [];
        this.particles = [];
        
        // Crear anillos de onda expansiva
        for (let i = 0; i < 3; i++) {
            this.rings.push({
                radius: 0,
                maxRadius: 50 + i * 20,
                speed: 2 + i * 0.5,
                thickness: 3 - i * 0.5,
                delay: i * 5
            });
        }
        
        // Crear partículas de impacto
        for (let i = 0; i < 20 * intensity; i++) {
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