// Elementos del tablero y puntuación
const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const piecesElement = document.getElementById("pieces");
const gameContainerElement = document.getElementById('game-container'); // Para el efecto de combo

// Elementos de Pantallas y Modales
const startScreenElement = document.getElementById('start-screen');
const modeSelectionAreaElement = document.getElementById('mode-selection-area');
const modeDescriptionPanelElement = document.getElementById('mode-description-panel');
const descriptionTitleElement = document.getElementById('description-title');
const descriptionTextElement = document.getElementById('description-text');
const gameArea = document.getElementById('game-area');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreElement = document.getElementById('finalScore'); // Ya existía, asegurar que esté aquí
const gameOverTitleElement = document.getElementById('gameOverTitle'); // Ya existía, asegurar que esté aquí
const comboStartEffectElement = document.getElementById('combo-start-effect'); // Nuevo elemento para efecto Combo Start

// Botones
const modeLevelsButton = document.getElementById('modeLevelsButton');
const modeComboButton = document.getElementById('modeComboButton');
const playSelectedModeButtonElement = document.getElementById('playSelectedModeButton');
const backToModeSelectionButtonElement = document.getElementById('backToModeSelectionButton');
const restartGameButton = document.getElementById('restartGameButton'); // Del modal de Game Over

// Estado del Juego (variables existentes)
const board = [];
let score = 0;
let selectedPiece = null;
let activePieceElement = null;
let draggedPieceElement = null;
let offsetX, offsetY;
let lastClientX, lastClientY;
const HORIZONTAL_DRAG_SENSITIVITY = 1.2;
let currentShadowCells = [];
const SHADOW_SNAP_THRESHOLD_CELLS = 1.5;
let highlightedPreCompleteCells = [];
const PREVIEW_LINE_COLOR = 'rgba(144, 238, 144, 0.8)';
const ANIMATION_DURATION = 500;
const FLOATING_SCORE_ANIMATION_DURATION = 1200;

// Nuevas variables de estado para la gestión de pantallas y modos
let currentGameMode = null; // 'levels' o 'combo' - para lógica interna del juego
let currentScreen = 'mode-select'; // 'mode-select', 'mode-description', 'gameplay', 'game-over'
let selectedModeForDescription = null; // Almacena el modo mientras se muestra su descripción

// --- NUEVA LÓGICA DE COMBOS ---
// Constantes para la nueva lógica de combos
const COMBO_BASE_POINTS = { // Puntos base por línea, antes de combo (REINTRODUCIDO)
    1: 100, // 1 línea
    2: 250, // 2 líneas
    3: 500, // 3 líneas
    4: 800  // 4 líneas (Tetris)
};
const COMBO_ACTIVATION_LINES_REQUIRED = 5; // Líneas para activar el combo
const COMBO_ACTIVATION_WINDOW_MS = 10000;  // Ventana de tiempo para activar (10s)
const COMBO_PROGRESSION_LINES_REQUIRED = 1; // Líneas para mantener/incrementar el combo
const COMBO_PROGRESSION_WINDOW_MS = 5000;   // Ventana de tiempo para progresar (5s)
const COMBO_MULTIPLIERS_NEW = [1, 2, 3, 4, 5]; // Multiplicadores: x1 (base), x2, x3, x4, x5
const MAX_COMBO_LEVEL = COMBO_MULTIPLIERS_NEW.length - 1;

// Estado del combo
let isComboActive = false;
let linesClearedForComboActivation = 0;
let timeOfFirstLineClearForActivation = 0;
let linesClearedInCurrentComboWindow = 0;
let currentComboLevel = 0; // Índice para COMBO_MULTIPLIERS_NEW
let comboProgressionTimeoutId = null;
let comboActivationHelperTimeoutId = null; // Para resetear el contador de activación si pasa mucho tiempo

let comboMessageElement = null; // Para "¡Combo xN!"
// window.comboTimeoutId = null; // Ya no se usa esta variable global así

const MODE_DETAILS = {
    levels: {
        title: "Modo Niveles (Campaña)",
        description: "Supera desafíos únicos en cada nivel. Completa objetivos específicos como descongelar celdas, recolectar ítems o alcanzar una puntuación antes de que se acaben tus movimientos. ¡Cada nivel es una nueva prueba! (Próximamente)"
    },
    combo: {
        title: "Modo Combo Infinito",
        description: "Juega sin fin e intenta alcanzar la mayor puntuación. ¡Encadena eliminaciones de líneas rápidamente para activar multiplicadores de combo! Si limpias 5 líneas en menos de 10 segundos, tu puntuación se duplica (x2). Sigue así para alcanzar x3, x4, ¡y hasta x5! Si tardas más de 5 segundos en eliminar al menos 1 línea, el combo se reinicia."
    }
};

// Definición de las piezas del Tetris
const PIECES = {
  O: [
    [
      [1, 1],
      [1, 1]
    ]
  ],
  I: [
    [[1, 1, 1, 1]], // Horizontal
    [[1], [1], [1], [1]]  // Vertical
  ],
  S: [
    [
      [0, 1, 1],
      [1, 1, 0]
    ],
    [
      [1, 0],
      [1, 1],
      [0, 1]
    ]
  ],
  Z: [
    [
      [1, 1, 0],
      [0, 1, 1]
    ],
    [
      [0, 1],
      [1, 1],
      [1, 0]
    ]
  ],
  L: [
    [
      [1, 0],
      [1, 0],
      [1, 1]
    ],
    [
      [1, 1, 1],
      [1, 0, 0]
    ],
    [
      [1, 1],
      [0, 1],
      [0, 1]
    ],
    [
      [0, 0, 1],
      [1, 1, 1]
    ]
  ],
  J: [
    [
      [0, 1],
      [0, 1],
      [1, 1]
    ],
    [
      [1, 0, 0],
      [1, 1, 1]
    ],
    [
      [1, 1],
      [1, 0],
      [1, 0]
    ],
    [
      [1, 1, 1],
      [0, 0, 1]
    ]
  ],
  T: [
    [
      [1, 1, 1],
      [0, 1, 0]
    ],
    [
      [0, 1],
      [1, 1],
      [0, 1]
    ],
    [
      [0, 1, 0],
      [1, 1, 1]
    ],
    [
      [1, 0],
      [1, 1],
      [1, 0]
    ]
  ],
  P1: [ [[1]] ], // 1x1
  P2H: [ [[1, 1]] ], // 1x2 Horizontal
  P2V: [ [[1], [1]] ], // 2x1 Vertical
  B3x3: [
    [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ]
  ],
  B2x3: [ // Rectángulo 2x3
    [
      [1, 1],
      [1, 1],
      [1, 1]
    ],
    // Su rotación a 3x2
    [
      [1, 1, 1],
      [1, 1, 1]
    ]
  ]
};

const PIECE_COLORS = ['#EF5350', '#4CAF50', '#2196F3', '#FFEB3B', '#9C27B0', '#00BCD4', '#FF9800']; // Rojo, Verde, Azul, Amarillo, Púrpura, Cian, Naranjo
// (Rojo, Verde, Azul, Amarillo, Púrpura, Cian, Naranjo - colores de Material Design)

const CELL_SIZE = 30; // Tamaño de la celda del tablero en píxeles
const GAP_SIZE = 2;   // Tamaño del gap entre celdas del tablero en píxeles

const pieceKeys = Object.keys(PIECES); // Nombres de las piezas: ['I', 'L', 'J', ...]

function hexToRgba(hex, alpha = 1) {
    if (!hex) return ''; // Devuelve string vacío si no hay hex, para resetear el estilo inline
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) { // #RGB
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) { // #RRGGBB
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function dragMove(event) {
  if (!draggedPieceElement) return;
  event.preventDefault();

  const currentClientX = event.clientX || event.touches[0].clientX;
  const currentClientY = event.clientY || event.touches[0].clientY;

  let deltaX = 0;
  let deltaY = 0;

  // Solo calcular delta si lastClientX/Y ya están definidos (es decir, no es el primer frame de arrastre)
  if (typeof lastClientX !== 'undefined') {
    deltaX = currentClientX - lastClientX;
    deltaY = currentClientY - lastClientY;
  }

  // Aplicar sensibilidad al movimiento horizontal
  const newPieceLeft = parseFloat(draggedPieceElement.style.left) + (deltaX * HORIZONTAL_DRAG_SENSITIVITY);
  const newPieceTop = parseFloat(draggedPieceElement.style.top) + deltaY; 

  draggedPieceElement.style.left = `${newPieceLeft}px`;
  draggedPieceElement.style.top = `${newPieceTop}px`;

  lastClientX = currentClientX;
  lastClientY = currentClientY;

  const draggedRect = draggedPieceElement.getBoundingClientRect();
  const pieceCenterX = draggedRect.left + draggedRect.width / 2;
  const pieceCenterY = draggedRect.top + draggedRect.height / 2;

  updatePieceShadow(pieceCenterX, pieceCenterY);
}

function updatePieceShadow(pieceCenterX, pieceCenterY) {
  // Limpiar sombra anterior
  currentShadowCells.forEach(cell => {
    cell.classList.remove('shadow');
    const r = parseInt(cell.dataset.row);
    const c = parseInt(cell.dataset.col);
    if (board[r][c] === 0) { 
        cell.style.backgroundColor = ''; 
    } else {
        cell.style.backgroundColor = cell.dataset.pieceColor || ''; 
    }
  });
  currentShadowCells = [];

  // Limpiar resaltado de previsualización de líneas anterior
  highlightedPreCompleteCells.forEach(cellInfo => {
    // Restaurar el color original guardado
    if (cellInfo.element) { // Asegurarse de que el elemento aún exista
        cellInfo.element.style.backgroundColor = cellInfo.originalColor;
    }
  });
  highlightedPreCompleteCells = [];

  if (!selectedPiece || !selectedPiece.color || !draggedPieceElement) return;
  // console.log("Update Shadow for:", selectedPiece.name, "at", pieceCenterX, pieceCenterY);

  const boardRect = boardElement.getBoundingClientRect();
  const cursorRelativeToBoardX = pieceCenterX - boardRect.left;
  const cursorRelativeToBoardY = pieceCenterY - boardRect.top;

  let bestSnapPos = null;
  let minDistanceSq = Infinity;

  const pieceMatrix = selectedPiece.matrix;
  const pieceActualWidth = pieceMatrix[0].length * CELL_SIZE + (pieceMatrix[0].length > 0 ? (pieceMatrix[0].length - 1) * GAP_SIZE : 0);
  const pieceActualHeight = pieceMatrix.length * CELL_SIZE + (pieceMatrix.length > 0 ? (pieceMatrix.length - 1) * GAP_SIZE : 0);

  for (let r_board = 0; r_board < 10; r_board++) {
    for (let c_board = 0; c_board < 10; c_board++) {
      if (canPlacePiece(pieceMatrix, r_board, c_board)) {
        // Calcular el centro de la pieza SI se colocara en (r_board, c_board)
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
    console.log("Best snap pos (shadow):", bestSnapPos.row, bestSnapPos.col, "Dist:", Math.sqrt(minDistanceSq));
    const tempBoard = board.map(row => [...row]);
    for (let r_piece = 0; r_piece < selectedPiece.matrix.length; r_piece++) {
      for (let c_piece = 0; c_piece < selectedPiece.matrix[r_piece].length; c_piece++) {
        if (selectedPiece.matrix[r_piece][c_piece] === 1) {
          const boardR = bestSnapPos.row + r_piece;
          const boardC = bestSnapPos.col + c_piece;
          if (boardR < 10 && boardC < 10 && boardR >= 0 && boardC >= 0) { 
            tempBoard[boardR][boardC] = 1; 
          }
        }
      }
    }
    // console.log("Temp board after simulated placement:", JSON.parse(JSON.stringify(tempBoard))); // Para ver el estado
    
    const { completedRows, completedCols } = checkPotentialLines(tempBoard, bestSnapPos, selectedPiece.matrix);
    console.log("Potential lines - Rows:", completedRows, "Cols:", completedCols);

    if (completedRows.length > 0 || completedCols.length > 0) {
        console.log("Found potential lines to highlight!");
        completedRows.forEach(r_idx => {
            for (let c_idx = 0; c_idx < 10; c_idx++) {
                let isPartOfCurrentPiece = false;
                for (let r_p = 0; r_p < selectedPiece.matrix.length; r_p++) {
                    for (let c_p = 0; c_p < selectedPiece.matrix[r_p].length; c_p++) {
                        if (selectedPiece.matrix[r_p][c_p] === 1 && 
                            bestSnapPos.row + r_p === r_idx && 
                            bestSnapPos.col + c_p === c_idx) {
                            isPartOfCurrentPiece = true; break;
                        }
                    }
                    if (isPartOfCurrentPiece) break;
                }

                if (!isPartOfCurrentPiece) {
                    const cellElement = boardElement.querySelector(`[data-row='${r_idx}'][data-col='${c_idx}']`);
                    if (cellElement) { // Condición original: && board[r_idx][c_idx] === 0. Eliminada para resaltar celdas ocupadas.
                        const originalBg = cellElement.style.backgroundColor || ''; // Guardar BG original o '' si no hay inline
                        console.log(`Highlighting cell for PREVIEW R:${r_idx}, C:${c_idx}. Original BG: ${originalBg}`);
                        cellElement.style.backgroundColor = PREVIEW_LINE_COLOR;
                        highlightedPreCompleteCells.push({element: cellElement, row: r_idx, col: c_idx, originalColor: originalBg });
                    }
                }
            }
        });
        completedCols.forEach(c_idx => {
            for (let r_idx = 0; r_idx < 10; r_idx++) {
                let isPartOfCurrentPiece = false;
                for (let r_p = 0; r_p < selectedPiece.matrix.length; r_p++) {
                    for (let c_p = 0; c_p < selectedPiece.matrix[r_p].length; c_p++) {
                        if (selectedPiece.matrix[r_p][c_p] === 1 && 
                            bestSnapPos.row + r_p === r_idx && 
                            bestSnapPos.col + c_p === c_idx) {
                            isPartOfCurrentPiece = true; break;
                        }
                    }
                    if (isPartOfCurrentPiece) break;
                }
                // Evitar doble resaltado si ya está en una fila completada
                const alreadyHighlighted = highlightedPreCompleteCells.some(info => info.row === r_idx && info.col === c_idx);
                if (!isPartOfCurrentPiece && !alreadyHighlighted) {
                    const cellElement = boardElement.querySelector(`[data-row='${r_idx}'][data-col='${c_idx}']`);
                    if (cellElement) { // Condición original: && board[r_idx][c_idx] === 0. Eliminada.
                         const originalBg = cellElement.style.backgroundColor || ''; // Guardar BG original o ''
                         console.log(`Highlighting cell for PREVIEW R:${r_idx}, C:${c_idx}. Original BG: ${originalBg}`);
                        cellElement.style.backgroundColor = PREVIEW_LINE_COLOR;
                        highlightedPreCompleteCells.push({element: cellElement, row: r_idx, col: c_idx, originalColor: originalBg });
                    }
                }
            }
        });
    } else {
        // console.log("No potential lines to highlight.");
    }

    // Dibujar sombra normal de la pieza (esto podría sobrescribir el PREVIEW_LINE_COLOR en las celdas de la pieza, lo cual está bien)
    const shadowColorRgba = hexToRgba(selectedPiece.color, 0.45);
    for (let r_offset = 0; r_offset < selectedPiece.matrix.length; r_offset++) {
      for (let c_offset = 0; c_offset < selectedPiece.matrix[r_offset].length; c_offset++) {
        if (selectedPiece.matrix[r_offset][c_offset] === 1) {
          const boardR_shadow = bestSnapPos.row + r_offset;
          const boardC_shadow = bestSnapPos.col + c_offset;
          if (boardR_shadow < 10 && boardC_shadow < 10 && boardR_shadow >= 0 && boardC_shadow >= 0) {
            const cellElement = boardElement.querySelector(`[data-row='${boardR_shadow}'][data-col='${boardC_shadow}']`);
            if (cellElement && board[boardR_shadow][boardC_shadow] === 0) { 
              cellElement.style.backgroundColor = shadowColorRgba;
              cellElement.classList.add('shadow');
              currentShadowCells.push(cellElement);
            }
          }
        }
      }
    }
  } else {
    // console.log("No valid snap position or too far for shadow.");
  }
}

function checkPotentialLines(tempBoard, piecePos, pieceMatrix) {
    // console.log("Checking potential lines with tempBoard:", JSON.parse(JSON.stringify(tempBoard)));
    const completedRows = [];
    const completedCols = [];
    const pieceCells = []; // Celdas ocupadas por la pieza que se está previsualizando

    for (let r = 0; r < pieceMatrix.length; r++) {
        for (let c = 0; c < pieceMatrix[r].length; c++) {
            if (pieceMatrix[r][c] === 1) {
                pieceCells.push({row: piecePos.row + r, col: piecePos.col + c});
            }
        }
    }

    // Verificar filas
    for (let r = 0; r < 10; r++) {
        if (tempBoard[r].every(cellState => cellState === 1)) {
            completedRows.push(r);
        }
    }
    // Verificar columnas
    for (let c = 0; c < 10; c++) {
        let colIsFull = true;
        for (let r = 0; r < 10; r++) {
            if (tempBoard[r][c] === 0) {
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

async function dragEnd(event) {
  if (!draggedPieceElement) return;

  // Limpiar resaltado de previsualización de líneas ANTES de cualquier otra cosa
  highlightedPreCompleteCells.forEach(cellInfo => {
    // Restaurar el color original guardado
    // Solo restaurar si la celda está actualmente con el color de previsualización
    // y si el elemento existe por si acaso.
    if (cellInfo.element && cellInfo.element.style.backgroundColor.toLowerCase() === PREVIEW_LINE_COLOR.toLowerCase()) {
        cellInfo.element.style.backgroundColor = cellInfo.originalColor;
    }
  });
  highlightedPreCompleteCells = [];

  // Limpiar la sombra visualmente de la pieza que se arrastraba
  currentShadowCells.forEach(cell => {
    cell.classList.remove('shadow');
    const r_cell = parseInt(cell.dataset.row);
    const c_cell = parseInt(cell.dataset.col);
    if (board[r_cell][c_cell] === 0) { 
        cell.style.backgroundColor = ''; 
    } else { 
        cell.style.backgroundColor = cell.dataset.pieceColor || ''; 
    }
  });
  currentShadowCells = [];

  document.removeEventListener('mousemove', dragMove);
  document.removeEventListener('touchmove', dragMove, { passive: false });
  document.removeEventListener('mouseup', dragEnd);
  document.removeEventListener('touchend', dragEnd);

  const draggedRect = draggedPieceElement.getBoundingClientRect(); // Obtener rect aquí, después de quitar listeners
  const finalPieceCenterX = draggedRect.left + draggedRect.width / 2;
  const finalPieceCenterY = draggedRect.top + draggedRect.height / 2;

  let placed = false;
  if (selectedPiece && selectedPiece.color) {
    const boardRect_dragEnd = boardElement.getBoundingClientRect();
    
    let bestPlacePos = null;
    let minDistanceSqForPlacement = Infinity;

    const pieceMatrix_dragEnd = selectedPiece.matrix;
    const pieceActualWidth_dragEnd = pieceMatrix_dragEnd[0].length * CELL_SIZE + (pieceMatrix_dragEnd[0].length > 0 ? (pieceMatrix_dragEnd[0].length - 1) * GAP_SIZE : 0);
    const pieceActualHeight_dragEnd = pieceMatrix_dragEnd.length * CELL_SIZE + (pieceMatrix_dragEnd.length > 0 ? (pieceMatrix_dragEnd.length - 1) * GAP_SIZE : 0);

    for (let r_board = 0; r_board < 10; r_board++) {
      for (let c_board = 0; c_board < 10; c_board++) {
        if (canPlacePiece(pieceMatrix_dragEnd, r_board, c_board)) {
          // Calcular el centro de la pieza SI se colocara en (r_board, c_board)
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
      console.log("Best place pos (dragEnd):", bestPlacePos.row, bestPlacePos.col, "Dist:", Math.sqrt(minDistanceSqForPlacement));
      placePiece(selectedPiece.matrix, bestPlacePos.row, bestPlacePos.col, selectedPiece.color);
      if (activePieceElement) activePieceElement.remove(); 
      placed = true;
      
      await checkAndClearLines(); 
      
      const newSinglePiece = generateSinglePieceElement();
      piecesElement.appendChild(newSinglePiece);
      
      checkGameOver();
    }
  }

  if (!placed) {
    if (activePieceElement) {
      activePieceElement.classList.remove('hidden-original');
    }
  }

  if (draggedPieceElement && draggedPieceElement.parentNode === document.body) {
    document.body.removeChild(draggedPieceElement);
  }
  
  draggedPieceElement = null;
  selectedPiece = null;
  activePieceElement = null;
  offsetX = 0;
  offsetY = 0;
}

function startDrag(event, pieceName, pieceMatrix, originalElement) {
  if (draggedPieceElement) return;
  event.preventDefault();

  // Obtener clientX/Y del evento actual
  const eventClientX = event.clientX || event.touches[0].clientX;
  const eventClientY = event.clientY || event.touches[0].clientY;

  // Guardar las posiciones iniciales del cliente para el cálculo de delta en dragMove
  lastClientX = eventClientX;
  lastClientY = eventClientY;

  const pieceColor = originalElement.pieceColor;
  selectedPiece = { name: pieceName, matrix: pieceMatrix, color: pieceColor };
  activePieceElement = originalElement;

  draggedPieceElement = activePieceElement.cloneNode(true);
  draggedPieceElement.classList.remove('available-piece-glow'); // Quitar animación de brillo del clon
  draggedPieceElement.pieceColor = pieceColor; 
  draggedPieceElement.classList.add('dragging'); // El estilo .dragging ya aplica la escala
  document.body.appendChild(draggedPieceElement);

  const draggedRect = draggedPieceElement.getBoundingClientRect();
  offsetX = draggedRect.width / 2;
  offsetY = draggedRect.height * 2;

  // Posicionar la pieza inicialmente con el offset aplicado
  draggedPieceElement.style.left = `${eventClientX - offsetX}px`;
  draggedPieceElement.style.top = `${eventClientY - offsetY}px`;

  activePieceElement.classList.add('hidden-original'); 
  
  // Para la primera llamada a updatePieceShadow, usamos el centro de la pieza ya posicionada
  const initialDraggedRect = draggedPieceElement.getBoundingClientRect();
  const initialPieceCenterX = initialDraggedRect.left + initialDraggedRect.width / 2;
  const initialPieceCenterY = initialDraggedRect.top + initialDraggedRect.height / 2;
  updatePieceShadow(initialPieceCenterX, initialPieceCenterY);

  document.addEventListener('mousemove', dragMove);
  document.addEventListener('touchmove', dragMove, { passive: false });
  document.addEventListener('mouseup', dragEnd);
  document.addEventListener('touchend', dragEnd);
}

function generateSinglePieceElement() {
  const pieceTypeNames = Object.keys(PIECES);
  const randomPieceTypeName = pieceTypeNames[Math.floor(Math.random() * pieceTypeNames.length)];
  const pieceRotations = PIECES[randomPieceTypeName];
  const pieceMatrix = pieceRotations[Math.floor(Math.random() * pieceRotations.length)];
  const pieceColor = PIECE_COLORS[Math.floor(Math.random() * PIECE_COLORS.length)];
  const pieceInListCellSize = 18;

  const pieceDiv = document.createElement('div');
  pieceDiv.classList.add('piece');
  pieceDiv.classList.add('available-piece-glow'); // Animación de brillo continuo
  pieceDiv.classList.add('new-piece-appear-animation'); // Animación de aparición
  pieceDiv.style.gridTemplateColumns = `repeat(${pieceMatrix[0].length}, ${pieceInListCellSize}px)`;
  pieceDiv.style.gridTemplateRows = `repeat(${pieceMatrix.length}, ${pieceInListCellSize}px)`;
  pieceDiv.dataset.pieceName = randomPieceTypeName; 
  pieceDiv.pieceMatrix = pieceMatrix;
  pieceDiv.pieceColor = pieceColor;

  pieceMatrix.forEach(row => {
    row.forEach(cellValue => {
      const cellDiv = document.createElement('div');
      cellDiv.style.width = `${pieceInListCellSize}px`; 
      cellDiv.style.height = `${pieceInListCellSize}px`;
      if (cellValue === 1) {
        cellDiv.style.backgroundColor = pieceColor;
        cellDiv.classList.add('piece-block');
      } else {
        cellDiv.style.visibility = 'hidden';
      }
      pieceDiv.appendChild(cellDiv);
    });
  });
  pieceDiv.addEventListener('mousedown', (e) => startDrag(e, randomPieceTypeName, pieceMatrix, pieceDiv));
  pieceDiv.addEventListener('touchstart', (e) => startDrag(e, randomPieceTypeName, pieceMatrix, pieceDiv), { passive: false });
  
  // Remover la clase de aparición después de que la animación termine
  setTimeout(() => {
    pieceDiv.classList.remove('new-piece-appear-animation');
  }, 400); // 400ms coincide con la duración de la animación en CSS

  return pieceDiv;
}

function displayPieces() {
  piecesElement.innerHTML = ''; // Limpiar al inicio
  for (let i = 0; i < 3; i++) {
    const newPieceElement = generateSinglePieceElement();
    piecesElement.appendChild(newPieceElement);
  }
}

// Inicializar tablero 10x10
function createBoardCells() {
    boardElement.innerHTML = ''; // Limpiar celdas existentes si se reinicia
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            const cellElement = document.createElement("div");
            cellElement.className = "cell";
            cellElement.dataset.row = row;
            cellElement.dataset.col = col;
            boardElement.appendChild(cellElement);
        }
    }
}

function initializeGameMode(mode) {
    console.log(`Initializing game mode: ${mode}`);
    currentGameMode = mode;
    currentScreen = 'gameplay';
    
    board.length = 0; 
    for (let i = 0; i < 10; i++) { 
        board.push(Array(10).fill(0));
    }
    score = 0;
    updateScore(0); 
    
    // Resetear estado del combo para la NUEVA lógica
    isComboActive = false;
    linesClearedForComboActivation = 0;
    timeOfFirstLineClearForActivation = 0;
    linesClearedInCurrentComboWindow = 0;
    currentComboLevel = 0;
    clearTimeout(comboProgressionTimeoutId);
    comboProgressionTimeoutId = null;
    clearTimeout(comboActivationHelperTimeoutId);
    comboActivationHelperTimeoutId = null;

    hideComboMessage();    
    updateComboVisuals(); // Asegurar que no haya efectos de combo al inicio
    // clearTimeout(window.comboTimeoutId); // Ya no se usa

    if(piecesElement) piecesElement.innerHTML = '';
    displayPieces(); 

    createBoardCells(); 
    updateScreenVisibility();

    console.log("Tablero y juego reiniciados para el modo:", mode);
    console.log("Board state after init: ", JSON.parse(JSON.stringify(board)));
}

function showModeSelector() {
    if (modeSelectorModal) {
        modeSelectorModal.classList.add('visible');
        modeSelectorModal.classList.remove('hidden');
    }
    if (gameArea) gameArea.classList.add('hidden');
    if (gameOverModal) {
        gameOverModal.classList.remove('visible');
        gameOverModal.classList.add('hidden');
    }
    // Limpiar tablero lógico y visual por si acaso antes de mostrar el selector
    board.length = 0; 
    if(boardElement) boardElement.innerHTML = '';
    if(piecesElement) piecesElement.innerHTML = '';
    score = 0;
    updateScore(0);
}

function canPlacePiece(pieceMatrix, startRow, startCol) {
  for (let r = 0; r < pieceMatrix.length; r++) {
    for (let c = 0; c < pieceMatrix[r].length; c++) {
      if (pieceMatrix[r][c] === 1) { // Si es un bloque de la pieza
        const boardR = startRow + r;
        const boardC = startCol + c;

        // Verificar límites del tablero
        if (boardR >= 10 || boardC >= 10 || boardR < 0 || boardC < 0) {
          return false; // Fuera de los límites
        }
        // Verificar si la celda del tablero ya está ocupada
        if (board[boardR][boardC] === 1) {
          return false; // Celda ocupada
        }
      }
    }
  }
  return true; // La pieza se puede colocar
}

function placePiece(pieceMatrix, startRow, startCol, pieceColorForBoard) {
  for (let r = 0; r < pieceMatrix.length; r++) {
    for (let c = 0; c < pieceMatrix[r].length; c++) {
      if (pieceMatrix[r][c] === 1) {
        const boardR = startRow + r;
        const boardC = startCol + c;
        board[boardR][boardC] = 1; // Marcar como ocupada en la lógica
        const cellToUpdate = boardElement.querySelector(`[data-row='${boardR}'][data-col='${boardC}']`);
        if (cellToUpdate) {
          cellToUpdate.style.backgroundColor = pieceColorForBoard;
          cellToUpdate.classList.add('piece-block');
          cellToUpdate.dataset.pieceColor = pieceColorForBoard;

          // Aplicar animación de pulsación
          cellToUpdate.classList.add('pulse-block-animation');
          // Remover la clase después de la animación para permitir que se repita
          setTimeout(() => {
            cellToUpdate.classList.remove('pulse-block-animation');
          }, 300); // 300ms coincide con la duración de la animación en CSS
        }
      }
    }
  }
}

function showFloatingScore(points, baseElement) {
    const scoreText = document.createElement('div');
    scoreText.textContent = `+${points}`;
    scoreText.classList.add('floating-score');
    document.body.appendChild(scoreText); // Añadir al body para posicionamiento absoluto global

    const baseRect = baseElement.getBoundingClientRect();
    const boardRect = boardElement.getBoundingClientRect();

    // Posicionar el texto flotante cerca del elemento base (ej. primera línea limpiada)
    // Ajustar para que aparezca más centrado en el tablero, no solo sobre la celda
    const boardCenterX = boardRect.left + boardRect.width / 2;
    const scoreTextWidthHalf = 75; // Ancho estimado del texto de puntuación / 2

    scoreText.style.left = `${boardCenterX - scoreTextWidthHalf}px`;
    scoreText.style.top = `${baseRect.top - 30}px`; // Un poco arriba de la línea

    scoreText.classList.add('floating-score-animation');

    setTimeout(() => {
        if (scoreText.parentNode) {
            scoreText.parentNode.removeChild(scoreText);
        }
    }, FLOATING_SCORE_ANIMATION_DURATION); // Duración de la animación CSS
}

async function checkAndClearLines() {
    console.log("--- checkAndClearLines INICIO ---");
    let linesClearedThisTurnCount = 0; 
    const cellsToAnimateAndClear = new Set(); 
    let firstClearedCellElement = null; 

    const numRows = board.length;
    const numCols = board[0].length;

    // 1. Identificar filas completas
    for (let r = 0; r < numRows; r++) {
        let rowIsFull = true;
        for (let c_idx = 0; c_idx < numCols; c_idx++) {
            if (board[r][c_idx] === 0) {
                rowIsFull = false; break;
            }
        }
        if (rowIsFull) {
            linesClearedThisTurnCount++;
            for (let c_idx = 0; c_idx < numCols; c_idx++) {
                const cellElement = boardElement.children[r * numCols + c_idx];
                if (cellElement) {
                    cellsToAnimateAndClear.add(cellElement);
                    if (!firstClearedCellElement) firstClearedCellElement = cellElement;
                }
            }
        }
    }

    // 2. Identificar columnas completas
    for (let c = 0; c < numCols; c++) {
        let colIsFull = true;
        for (let r_idx = 0; r_idx < numRows; r_idx++) {
            if (board[r_idx][c] === 0) {
                colIsFull = false; break;
            }
        }
        if (colIsFull) {
            let newColLine = false;
            for (let r_idx = 0; r_idx < numRows; r_idx++) {
                const cellElement = boardElement.children[r_idx * numCols + c];
                if (cellElement && !cellsToAnimateAndClear.has(cellElement)) newColLine = true;
                if (cellElement) {
                     cellsToAnimateAndClear.add(cellElement);
                     if (!firstClearedCellElement) firstClearedCellElement = cellElement;
                }
            }
            if (newColLine) linesClearedThisTurnCount++;
        }
    }
    
    console.log(`Líneas (filas/columnas) para procesar en combo: ${linesClearedThisTurnCount}`);

    if (linesClearedThisTurnCount > 0) {
        if (currentGameMode === 'combo') {
            const currentTime = Date.now();
            clearTimeout(comboProgressionTimeoutId); // Limpiar siempre el timer de progresión si se limpian líneas

            if (!isComboActive) {
                // --- Lógica de Activación del Combo ---
                if (linesClearedForComboActivation === 0) { // Primera limpieza en esta "racha" de activación
                    timeOfFirstLineClearForActivation = currentTime;
                    // Iniciar un helper para resetear el contador de activación si pasan los 10s sin lograrlo
                    clearTimeout(comboActivationHelperTimeoutId);
                    comboActivationHelperTimeoutId = setTimeout(() => {
                        console.log("Ventana de activación de combo expiró. Reseteando contador.");
                        linesClearedForComboActivation = 0;
                        timeOfFirstLineClearForActivation = 0;
                    }, COMBO_ACTIVATION_WINDOW_MS + 500); // +500ms de margen
                }
                
                if (currentTime - timeOfFirstLineClearForActivation < COMBO_ACTIVATION_WINDOW_MS) {
                    linesClearedForComboActivation += linesClearedThisTurnCount;
                    console.log(`Activación Combo: ${linesClearedForComboActivation}/${COMBO_ACTIVATION_LINES_REQUIRED} líneas en ${COMBO_ACTIVATION_WINDOW_MS / 1000}s`);

                    if (linesClearedForComboActivation >= COMBO_ACTIVATION_LINES_REQUIRED) {
                        isComboActive = true;
                        currentComboLevel = 1; // Inicia en x2 (índice 1)
                        linesClearedInCurrentComboWindow = 0; // Resetear para la primera ventana de progresión
                        clearTimeout(comboActivationHelperTimeoutId); // Ya no es necesario
                        linesClearedForComboActivation = 0; // Resetear para futura reactivación si se pierde
                        timeOfFirstLineClearForActivation = 0;


                        console.log(`¡COMBO ACTIVADO! Nivel: ${currentComboLevel} (x${COMBO_MULTIPLIERS_NEW[currentComboLevel]})`);
                        showComboMessage(COMBO_MULTIPLIERS_NEW[currentComboLevel], "¡Combo Activado!");
                        updateComboVisuals();
                        
                        // Mostrar efecto de Combo Start
                        if (comboStartEffectElement) {
                            comboStartEffectElement.classList.remove('hidden');
                            comboStartEffectElement.classList.add('animate');
                            setTimeout(() => {
                                comboStartEffectElement.classList.add('hidden');
                                comboStartEffectElement.classList.remove('animate');
                            }, 1200); // Duración de la animación comboStartZoom
                        }
                        
                        // Iniciar temporizador para la primera ventana de progresión
                        comboProgressionTimeoutId = setTimeout(handleComboProgressionTimeout, COMBO_PROGRESSION_WINDOW_MS);
                    }
                } else {
                    // Pasó demasiado tiempo desde la primera limpieza para activación, resetear.
                    console.log("Tiempo de activación de combo excedido. Reiniciando conteo de activación.");
                    linesClearedForComboActivation = linesClearedThisTurnCount; // Empezar nuevo conteo
                    timeOfFirstLineClearForActivation = currentTime;
                    clearTimeout(comboActivationHelperTimeoutId);
                     comboActivationHelperTimeoutId = setTimeout(() => {
                        linesClearedForComboActivation = 0;
                        timeOfFirstLineClearForActivation = 0;
                    }, COMBO_ACTIVATION_WINDOW_MS + 500);
                }

            } else { // --- Lógica de Progresión del Combo (isComboActive === true) ---
                linesClearedInCurrentComboWindow += linesClearedThisTurnCount;
                console.log(`Progresión Combo: ${linesClearedInCurrentComboWindow}/${COMBO_PROGRESSION_LINES_REQUIRED} líneas en ${COMBO_PROGRESSION_WINDOW_MS / 1000}s`);

                if (linesClearedInCurrentComboWindow >= COMBO_PROGRESSION_LINES_REQUIRED) {
                    if (currentComboLevel < MAX_COMBO_LEVEL) {
                        currentComboLevel++;
                    }
                    linesClearedInCurrentComboWindow = 0; // Resetear para la siguiente ventana
                    
                    console.log(`¡COMBO CONTINÚA! Nivel: ${currentComboLevel} (x${COMBO_MULTIPLIERS_NEW[currentComboLevel]})`);
                    showComboMessage(COMBO_MULTIPLIERS_NEW[currentComboLevel]);
                    updateComboVisuals();
                }
                // Siempre reiniciar el temporizador de progresión si se limpiaron líneas y el combo está activo
                comboProgressionTimeoutId = setTimeout(handleComboProgressionTimeout, COMBO_PROGRESSION_WINDOW_MS);
            }
        }

        // Cálculo de puntos y efectos visuales de limpieza (esto es general)
        const pointsEarned = calculatePoints(linesClearedThisTurnCount); 
        updateScore(pointsEarned);
        if (firstClearedCellElement) {
            showFloatingScore(pointsEarned, firstClearedCellElement);
        }

        cellsToAnimateAndClear.forEach(cellElement => {
            cellElement.classList.add('line-shrink-fade-out');
        });
        
        cellsToAnimateAndClear.forEach(cellElement => {
            const row_cell = parseInt(cellElement.dataset.row);
            const col_cell = parseInt(cellElement.dataset.col);
            board[row_cell][col_cell] = 0; 
            delete cellElement.dataset.pieceColor; 
            cellElement.classList.remove('piece-block'); 
            setTimeout(() => {
                if (cellElement && cellElement.parentNode) { 
                    cellElement.classList.remove('line-shrink-fade-out');
                    cellElement.style.opacity = ''; 
                    cellElement.style.transform = ''; 
                    cellElement.style.backgroundColor = ''; 
                }
            }, ANIMATION_DURATION);
        });

        if (checkGameOver()) {
            handleGameOver();
        } 
        return Promise.resolve(linesClearedThisTurnCount); 
    } else { 
        // NO se limpiaron líneas esta vez.
        // Si el combo estaba activo, el temporizador de progresión (comboProgressionTimeoutId) sigue corriendo.
        // Si expira, handleComboProgressionTimeout se encargará de romper el combo.
        // No rompemos el combo aquí solo por no limpiar líneas en un turno,
        // ya que el jugador tiene 5 segundos para lograr las 2 líneas.
        console.log("No se limpiaron líneas. El temporizador de progresión de combo (si activo) continúa.");
        return Promise.resolve(0); 
    }
}

function handleComboProgressionTimeout() {
    console.log("Temporizador de progresión de combo expiró.");
    if (isComboActive) {
        if (linesClearedInCurrentComboWindow < COMBO_PROGRESSION_LINES_REQUIRED) {
            console.log("No se cumplió el objetivo de líneas para mantener el combo. ¡COMBO ROTO!");
            isComboActive = false;
            currentComboLevel = 0; // Resetear al multiplicador base x1
            linesClearedForComboActivation = 0; // Permitir reactivación
            timeOfFirstLineClearForActivation = 0;
            hideComboMessage();
            updateComboVisuals();
        } else {
            // Se cumplió justo a tiempo o un poco antes, y checkAndClearLines ya reinició el timer.
            // Esto es un fallback, pero la lógica principal está en checkAndClearLines.
            // Si llegamos aquí y SÍ se cumplió, significa que la última limpieza de líneas
            // reinició el timer. No hacemos nada para romperlo.
            console.log("Objetivo cumplido a tiempo o el timer fue reiniciado. El combo continúa.");
             // Podríamos por seguridad resetear linesClearedInCurrentComboWindow aquí si no se hizo
             // linesClearedInCurrentComboWindow = 0; // Y reiniciar el timer
             // clearTimeout(comboProgressionTimeoutId);
             // comboProgressionTimeoutId = setTimeout(handleComboProgressionTimeout, COMBO_PROGRESSION_WINDOW_MS);

        }
    }
    linesClearedInCurrentComboWindow = 0; // Siempre resetear al expirar la ventana.
}

function calculatePoints(clearedLinesCount) {
    if (clearedLinesCount === 0) return 0;

    let basePoints = COMBO_BASE_POINTS[Math.min(clearedLinesCount, 4)] || COMBO_BASE_POINTS[1];
    let finalPoints = basePoints;
    let currentMultiplier = 1;

    if (currentGameMode === 'combo' && isComboActive && currentComboLevel >= 0 && currentComboLevel < COMBO_MULTIPLIERS_NEW.length) {
        currentMultiplier = COMBO_MULTIPLIERS_NEW[currentComboLevel];
        finalPoints = basePoints * currentMultiplier;
    }
    
    console.log(`Calculating points: lines=${clearedLinesCount}, base=${basePoints}, comboActive=${isComboActive}, comboLvl=${currentComboLevel}, multiplier=${currentMultiplier}, final=${Math.round(finalPoints)}`);
    return Math.round(finalPoints);
}

function updateScore(pointsJustEarned) {
    if (pointsJustEarned > 0) {
        score += pointsJustEarned;
    } else if (pointsJustEarned === 0 && score !== 0) {
        // No hacer nada si es 0 y el score no es 0 (ej. solo actualizar UI al inicio)
    } else {
        score = 0; // Resetear si pointsJustEarned es explícitamente para resetear (ej. 0 al inicio)
    }
    scoreElement.textContent = `Puntos: ${score}`;
    if (pointsJustEarned > 0) {
        console.log(`${pointsJustEarned} puntos obtenidos. Nuevo puntaje: ${score}`);
    }
}

function handleGameOver() {
    console.log("Handling Game Over. Current mode:", currentGameMode);
    // Limpieza de listeners de arrastre y estado de la pieza (igual que antes)
    if (draggedPieceElement && draggedPieceElement.parentNode === document.body) {
        document.body.removeChild(draggedPieceElement);
        if (activePieceElement) activePieceElement.classList.remove('hidden-original');
    }
    draggedPieceElement = null; selectedPiece = null; activePieceElement = null;
    currentShadowCells.forEach(cell => {
        cell.classList.remove('shadow');
        if (board[parseInt(cell.dataset.row)][parseInt(cell.dataset.col)] === 0) {
            cell.style.backgroundColor = ''; 
        }
    });
    currentShadowCells = [];
    highlightedPreCompleteCells.forEach(cellInfo => {
        if (cellInfo.element && cellInfo.element.style.backgroundColor.toLowerCase() === PREVIEW_LINE_COLOR.toLowerCase()) {
            cellInfo.element.style.backgroundColor = cellInfo.originalColor;
        }
    });
    highlightedPreCompleteCells = [];
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('touchmove', dragMove, { passive: false });
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchend', dragEnd);

    // Resetear estado del combo al terminar el juego
    isComboActive = false;
    linesClearedForComboActivation = 0;
    timeOfFirstLineClearForActivation = 0;
    linesClearedInCurrentComboWindow = 0;
    currentComboLevel = 0;
    clearTimeout(comboProgressionTimeoutId);
    comboProgressionTimeoutId = null;
    clearTimeout(comboActivationHelperTimeoutId);
    comboActivationHelperTimeoutId = null;
    hideComboMessage();
    updateComboVisuals();

    navigateTo('game-over'); 

    // Configurar y mostrar el modal de Game Over
    if (gameOverTitleElement) {
        gameOverTitleElement.textContent = currentGameMode === 'levels' ? "¡Nivel Fallido!" : "¡Juego Terminado!";
    }
    if (finalScoreElement) {
        finalScoreElement.textContent = `Puntaje Final: ${score}`;
    }
    
    gameOverModal.classList.remove('hidden'); // Asegurar que no esté hidden por navigateTo
    setTimeout(() => { // Aplicar transición de visibilidad
      gameOverModal.classList.add('visible');
    }, 20); 
}

function checkGameOver() {
  const availablePieceElements = piecesElement.querySelectorAll('.piece');
  if (availablePieceElements.length === 0 && boardIsEmpty()) { 
      return false; 
  }
  if (availablePieceElements.length === 0 && !boardIsEmpty()){ 
      handleGameOver();
      return true;
  }

  for (let pieceElement of availablePieceElements) {
    const pieceMatrix = pieceElement.pieceMatrix; 
    if (!pieceMatrix) continue; 

    for (let r_board = 0; r_board < 10; r_board++) {
      for (let c_board = 0; c_board < 10; c_board++) {
        if (canPlacePiece(pieceMatrix, r_board, c_board)) {
          return false; 
        }
      }
    }
  }
  handleGameOver();
  return true; 
}

function boardIsEmpty() {
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
            if (board[r][c] === 1) return false;
        }
    }
    return true;
}

// Event Listeners para selección de modo
if (modeLevelsButton) {
    modeLevelsButton.addEventListener('click', () => {
        navigateTo('mode-description', 'levels');
    });
}
if (modeComboButton) {
    modeComboButton.addEventListener('click', () => {
        navigateTo('mode-description', 'combo');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Botones del panel de descripción del modo
    if (playSelectedModeButtonElement) {
        playSelectedModeButtonElement.addEventListener('click', () => {
            if (selectedModeForDescription) {
                const initializationSuccessful = initializeGameMode(selectedModeForDescription);
                if (initializationSuccessful) { // Solo navegar a gameplay si la inicialización no fue detenida
                    navigateTo('gameplay');
                }
                // Si initializeGameMode devolvió false (ej. modo "Próximamente"), 
                // ya habrá llamado a navigateTo('mode-select'), así que no hacemos nada más aquí.
            }
        });
    }
    if (backToModeSelectionButtonElement) {
        backToModeSelectionButtonElement.addEventListener('click', () => {
            navigateTo('mode-select');
        });
    }

    // Botón de reinicio en el modal de Game Over
    if (restartGameButton) { 
        restartGameButton.addEventListener('click', () => {
            navigateTo('mode-select'); // Volver a la pantalla de selección de modo
        });
    }

    // Iniciar la aplicación mostrando la pantalla de selección de modo
    navigateTo('mode-select');
});

// --- FUNCIONES DE GESTIÓN DE PANTALLAS ---
function updateScreenVisibility() {
    console.log("Updating screen visibility for:", currentScreen);
    // Ocultar todo por defecto
    startScreenElement.classList.add('hidden');
    modeSelectionAreaElement.classList.add('hidden');
    modeDescriptionPanelElement.classList.add('hidden');
    gameArea.classList.add('hidden');
    
    // gameOverModal se maneja de forma un poco diferente debido a sus propias clases visible/hidden y animación
    // pero nos aseguramos que no esté 'visible' si no es la pantalla de game-over.
    if (currentScreen !== 'game-over') {
        gameOverModal.classList.remove('visible');
        gameOverModal.classList.add('hidden'); // Opcional, pero asegura el estado hidden
    }

    if (currentScreen === 'mode-select') {
        startScreenElement.classList.remove('hidden');
        modeSelectionAreaElement.classList.remove('hidden');
    } else if (currentScreen === 'mode-description') {
        startScreenElement.classList.remove('hidden');
        modeDescriptionPanelElement.classList.remove('hidden');
        if (selectedModeForDescription && MODE_DETAILS[selectedModeForDescription]) {
            descriptionTitleElement.textContent = MODE_DETAILS[selectedModeForDescription].title;
            descriptionTextElement.textContent = MODE_DETAILS[selectedModeForDescription].description;
        } else {
            descriptionTitleElement.textContent = "Error de Modo";
            descriptionTextElement.textContent = "No se pudo cargar la descripción para el modo seleccionado.";
            console.error("Error: selectedModeForDescription es inválido o no encontrado en MODE_DETAILS:", selectedModeForDescription);
        }
    } else if (currentScreen === 'gameplay') {
        gameArea.classList.remove('hidden');
    } else if (currentScreen === 'game-over') {
        // La visualización de gameOverModal se maneja en handleGameOver() para la transición.
        // Aquí solo nos aseguramos que otras áreas principales estén ocultas.
        startScreenElement.classList.add('hidden');
        gameArea.classList.add('hidden'); 
    }
}

function navigateTo(screen, modeData = null) {
    console.log(`Navigating to screen: ${screen}, Mode data: ${modeData}`);
    currentScreen = screen;
    if (screen === 'mode-description' && modeData) {
        selectedModeForDescription = modeData;
    } else if (screen === 'mode-select') {
        selectedModeForDescription = null; // Limpiar al volver a la selección
    }
    updateScreenVisibility();
}

// Funciones para mostrar/ocultar el mensaje de combo
function showComboMessage(multiplier, customText = null) { 
    if (!comboMessageElement) {
        comboMessageElement = document.createElement('div');
        comboMessageElement.id = 'combo-message';
        const scoreContainer = document.getElementById('score-container') || scoreElement.parentNode;
        if (scoreContainer) {
            scoreContainer.insertBefore(comboMessageElement, scoreElement);
        } else {
            document.body.appendChild(comboMessageElement); 
        }
    }

    // Limpiar clases de texto de combo anteriores
    for (let i = 1; i <= MAX_COMBO_LEVEL; i++) {
        comboMessageElement.classList.remove(`combo-text-level-${i}`);
    }

    // Aplicar nueva clase de texto de combo si el combo está activo y el nivel es mayor que 0
    if (isComboActive && currentComboLevel > 0 && currentComboLevel <= MAX_COMBO_LEVEL) {
        comboMessageElement.classList.add(`combo-text-level-${currentComboLevel}`);
    }

    comboMessageElement.textContent = customText ? `${customText} (x${multiplier})` : `¡Combo x${multiplier}!`;
    comboMessageElement.classList.add('visible');
    comboMessageElement.classList.remove('hidden');
}

function hideComboMessage() {
    if (comboMessageElement) {
        comboMessageElement.classList.add('hidden'); // Usar hidden para control con CSS
        comboMessageElement.classList.remove('visible');
        // Limpiar clases de texto de combo al ocultar
        for (let i = 1; i <= MAX_COMBO_LEVEL; i++) {
            comboMessageElement.classList.remove(`combo-text-level-${i}`);
        }
    }
}

// --- NUEVA FUNCIÓN PARA ACTUALIZAR VISUALES DEL COMBO ---
function updateComboVisuals() {
    if (!gameContainerElement) return;

    // Limpiar clases de combo anteriores del gameContainer
    for (let i = 1; i <= MAX_COMBO_LEVEL; i++) { 
        gameContainerElement.classList.remove(`combo-level-${i}`);
    }
    gameContainerElement.classList.remove('combo-board-active-effect');

    if (isComboActive && currentComboLevel > 0 && currentComboLevel <= MAX_COMBO_LEVEL) {
        gameContainerElement.classList.add(`combo-level-${currentComboLevel}`);
    }
}