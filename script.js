const board = [];
const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
let score = 0;

// Elementos del Modal de Game Over
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreElement = document.getElementById('finalScore');
const restartGameButton = document.getElementById('restartGameButton');

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

let selectedPiece = null;
let activePieceElement = null; // Elemento DOM de la pieza en la lista #pieces
let draggedPieceElement = null; // Elemento DOM clonado que se arrastra
let offsetX, offsetY;
let lastClientX, lastClientY; // Para calcular deltas en dragMove
const HORIZONTAL_DRAG_SENSITIVITY = 1.2; // Mueve la pieza 1.2x más rápido horizontalmente que el dedo

const piecesElement = document.getElementById("pieces");
const pieceKeys = Object.keys(PIECES); // Nombres de las piezas: ['I', 'L', 'J', ...]

const CELL_SIZE = 30; // Tamaño de la celda del tablero en píxeles
const GAP_SIZE = 2;   // Tamaño del gap entre celdas del tablero en píxeles

let currentShadowCells = [];
const SHADOW_SNAP_THRESHOLD_CELLS = 1.5; // Umbral para "ajustar" la sombra, en unidades de celdas
let highlightedPreCompleteCells = []; // Para celdas de previsualización de líneas completas
const PREVIEW_LINE_COLOR = 'rgba(144, 238, 144, 0.8)'; // Verde claro para previsualización

const ANIMATION_DURATION = 500; // ms, DEBE COINCIDIR CON CSS (antes 2000ms, ahora 0.5s)
const FLOATING_SCORE_ANIMATION_DURATION = 1200; // ms, debe coincidir con CSS para .floating-score-animation

// Función de ayuda para convertir HEX a RGBA
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

// Funciones de Arrastrar y Soltar
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

  for (let r_board = 0; r_board < 10; r_board++) {
    for (let c_board = 0; c_board < 10; c_board++) {
      if (canPlacePiece(selectedPiece.matrix, r_board, c_board)) {
        const cellRectCenterX = boardRect.left + (c_board * (CELL_SIZE + GAP_SIZE)) + (CELL_SIZE / 2);
        const cellRectCenterY = boardRect.top + (r_board * (CELL_SIZE + GAP_SIZE)) + (CELL_SIZE / 2);
        const distSq = (pieceCenterX - cellRectCenterX) ** 2 + (pieceCenterY - cellRectCenterY) ** 2;
        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          bestSnapPos = { row: r_board, col: c_board };
        }
      }
    }
  }

  const snapThresholdPixels = SHADOW_SNAP_THRESHOLD_CELLS * (CELL_SIZE + GAP_SIZE);
  if (bestSnapPos && Math.sqrt(minDistanceSq) < snapThresholdPixels * selectedPiece.matrix[0].length) {
    console.log("Best snap pos:", bestSnapPos.row, bestSnapPos.col);
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

// Nueva función auxiliar para verificar líneas potenciales
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

    for (let r_board = 0; r_board < 10; r_board++) {
      for (let c_board = 0; c_board < 10; c_board++) {
        if (canPlacePiece(selectedPiece.matrix, r_board, c_board)) {
          const cellRectCenterX = boardRect_dragEnd.left + (c_board * (CELL_SIZE + GAP_SIZE)) + (CELL_SIZE / 2);
          const cellRectCenterY = boardRect_dragEnd.top + (r_board * (CELL_SIZE + GAP_SIZE)) + (CELL_SIZE / 2);
          const distSq = (finalPieceCenterX - cellRectCenterX) ** 2 + (finalPieceCenterY - cellRectCenterY) ** 2;

          if (distSq < minDistanceSqForPlacement) {
            minDistanceSqForPlacement = distSq;
            bestPlacePos = { row: r_board, col: c_board };
          }
        }
      }
    }

    const placeThresholdPixels = SHADOW_SNAP_THRESHOLD_CELLS * (CELL_SIZE + GAP_SIZE);
    if (bestPlacePos && Math.sqrt(minDistanceSqForPlacement) < placeThresholdPixels * selectedPiece.matrix[0].length) {
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
for (let row = 0; row < 10; row++) {
  board[row] = [];
  for (let col = 0; col < 10; col++) {
    board[row][col] = 0;
    const cellElement = document.createElement("div");
    cellElement.className = "cell";
    cellElement.dataset.row = row;
    cellElement.dataset.col = col;
    boardElement.appendChild(cellElement);
  }
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
    const scoreTextElement = document.createElement('div');
    scoreTextElement.textContent = `+${points}`;
    scoreTextElement.classList.add('floating-score');
    
    const gameContainer = document.getElementById('game-container');
    const boardRect_float = boardElement.getBoundingClientRect(); 
    const gameContainerRect = gameContainer.getBoundingClientRect();

    const boardCenterXInContainer = (boardRect_float.left - gameContainerRect.left) + (boardRect_float.width / 2);
    const boardCenterYInContainer = (boardRect_float.top - gameContainerRect.top) + (boardRect_float.height / 2);

    scoreTextElement.style.left = `${boardCenterXInContainer}px`;
    scoreTextElement.style.top = `${boardCenterYInContainer - 30}px`; 
    scoreTextElement.style.transform = 'translateX(-50%)'; 

    gameContainer.appendChild(scoreTextElement);
    scoreTextElement.classList.add('floating-score-animation');

    setTimeout(() => {
        if (scoreTextElement.parentNode) {
            scoreTextElement.parentNode.removeChild(scoreTextElement);
        }
    }, FLOATING_SCORE_ANIMATION_DURATION); 
}

async function checkAndClearLines() {
    console.log("--- checkAndClearLines INICIO ---");
    let linesClearedThisTurn = 0;
    const rowsToClearIndices = [];
    const colsToClearIndices = [];
    const cellsToAnimateAndClear = new Set(); 
    let firstClearedCellElement = null; 

    for (let r = 0; r < 10; r++) {
        if (board[r].every(cellState => cellState === 1)) {
            rowsToClearIndices.push(r);
            for (let c_cell = 0; c_cell < 10; c_cell++) {
                const cellElement = boardElement.querySelector(`[data-row='${r}'][data-col='${c_cell}']`);
                if (cellElement) {
                    cellsToAnimateAndClear.add(cellElement);
                    if (!firstClearedCellElement) firstClearedCellElement = cellElement;
                }
            }
        }
    }

    for (let c = 0; c < 10; c++) {
        let colIsFull = true;
        for (let r_idx = 0; r_idx < 10; r_idx++) {
            if (board[r_idx][c] === 0) {
                colIsFull = false;
                break;
            }
        }
        if (colIsFull) {
            colsToClearIndices.push(c);
            for (let r_idx = 0; r_idx < 10; r_idx++) {
                const cellElement = boardElement.querySelector(`[data-row='${r_idx}'][data-col='${c}']`);
                if (cellElement) {
                    cellsToAnimateAndClear.add(cellElement);
                    if (!firstClearedCellElement) firstClearedCellElement = cellElement; 
                }
            }
        }
    }

    linesClearedThisTurn = rowsToClearIndices.length;
    colsToClearIndices.forEach(c_idx => {
        let isNewColLine = false;
        for (let r_idx = 0; r_idx < 10; r_idx++) {
            if (!rowsToClearIndices.includes(r_idx) && board[r_idx][c_idx] === 1) {
                isNewColLine = true;
                break;
            }
        }
        if (isNewColLine) {
            linesClearedThisTurn++;
        }
    });
    console.log(`Líneas calculadas para puntaje: ${linesClearedThisTurn}`);
    console.log(`Celdas a animar y limpiar: ${cellsToAnimateAndClear.size}`);

    if (cellsToAnimateAndClear.size > 0) {
        cellsToAnimateAndClear.forEach(cellElement => {
            cellElement.classList.add('line-shrink-fade-out'); 
        });

        console.log("Clase 'line-shrink-fade-out' añadida. Realizando limpieza lógica inmediatamente.");
        
        // La limpieza lógica ahora ocurre inmediatamente.
        // La animación CSS se ejecutará visualmente de forma independiente.
        cellsToAnimateAndClear.forEach(cellElement => {
            const row_cell = parseInt(cellElement.dataset.row);
            const col_cell = parseInt(cellElement.dataset.col);
            board[row_cell][col_cell] = 0; 
            // No establecemos backgroundColor aquí todavía, dejamos que la animación lo maneje primero.
            delete cellElement.dataset.pieceColor; 
            cellElement.classList.remove('piece-block'); 

            // Programar la limpieza de estilos de animación después de que la animación termine
            setTimeout(() => {
                // Comprobar si la celda/elemento aún existe en el DOM por si acaso
                if (cellElement && cellElement.parentNode) { 
                    cellElement.classList.remove('line-shrink-fade-out');
                    cellElement.style.opacity = ''; 
                    cellElement.style.transform = ''; 
                    cellElement.style.backgroundColor = ''; // Crucial: Resetear al color de celda vacía por defecto
                }
            }, ANIMATION_DURATION);
        });

        if (linesClearedThisTurn > 0) {
            console.log(`${linesClearedThisTurn} línea(s) eliminada(s). Actualizando puntaje...`);
            const pointsEarned = calculatePoints(linesClearedThisTurn);
            updateScore(pointsEarned); 
            if (firstClearedCellElement) { 
                showFloatingScore(pointsEarned, firstClearedCellElement);
            }
        }
        // Ya no devolvemos una promesa basada en setTimeout, sino que resolvemos inmediatamente
        // porque la lógica principal de limpieza ya se hizo.
        // La función sigue siendo async por el 'await' en dragEnd, y esto es compatible.
        return Promise.resolve();
    } else {
      return Promise.resolve();
    }
}

function calculatePoints(clearedLinesCount) {
    let points = clearedLinesCount * 10;
    if (clearedLinesCount > 1) {
        points += (clearedLinesCount - 1) * clearedLinesCount * 5; 
    }
    return points;
}

function updateScore(pointsJustEarned) { 
  if (pointsJustEarned > 0) {
    score += pointsJustEarned;
    scoreElement.textContent = `Puntos: ${score}`;
    console.log(`${pointsJustEarned} puntos obtenidos. Nuevo puntaje: ${score}`);
  } 
}

function handleGameOver() {
  if (draggedPieceElement && draggedPieceElement.parentNode === document.body) {
    document.body.removeChild(draggedPieceElement);
    if (activePieceElement) {
      activePieceElement.classList.remove('hidden-original');
    }
  }
  draggedPieceElement = null;
  selectedPiece = null;
  activePieceElement = null;
  currentShadowCells.forEach(cell => cell.classList.remove('shadow'));
  currentShadowCells = [];
  document.removeEventListener('mousemove', dragMove);
  document.removeEventListener('touchmove', dragMove, { passive: false });
  document.removeEventListener('mouseup', dragEnd);
  document.removeEventListener('touchend', dragEnd);

  const modal = gameOverModal || document.getElementById('gameOverModal');
  const scoreEl = finalScoreElement || document.getElementById('finalScore');

  if (modal && scoreEl) {
    scoreEl.textContent = `Puntaje Final: ${score}`;
    modal.style.display = 'flex'; 
    setTimeout(() => { 
      modal.classList.add('visible');
    }, 20); 
  } else {
    console.error("No se pudieron encontrar los elementos del modal de Game Over. Mostrando alert como fallback.");
    alert(`¡Juego Terminado!\nPuntaje Final: ${score}`);
  }
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

scoreElement.textContent = `Puntos: ${score}`;
displayPieces();
checkGameOver();

document.addEventListener('DOMContentLoaded', () => {
    const effectiveRestartButton = restartGameButton || document.getElementById('restartGameButton');
    if (effectiveRestartButton) { 
        effectiveRestartButton.addEventListener('click', () => {
            window.location.reload(); 
        });
    }
});