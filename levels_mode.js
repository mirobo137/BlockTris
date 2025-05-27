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
        maxMoves: 25, 
        targetFrozenPiecesToClear: 3,
        initialFrozenPieces: [
            { row: 2, col: 2, initialStage: 3, id: "frozen_1" },
            { row: 4, col: 5, initialStage: 3, id: "frozen_2" },
            { row: 7, col: 7, initialStage: 3, id: "frozen_3" },
        ],
        starCriteria: 'movesRemaining',
        starsThresholds: { threeStars: 5, twoStars: 2 } // 3 estrellas >= 5 mov. restantes, 2 estrellas >= 2 mov. restantes, 1 estrella >= 0 mov. restantes
    },
    3: { 
        id: 3, 
        name: "Nivel 3", 
        objectiveText: "Próximamente...", 
        targetScore: 3000, 
        locked: true,
        starCriteria: null, // Sin definir aún
        starsThresholds: {}
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
  pieceDiv.addEventListener('mousedown', (e) => startDrag_levels(e, randomPieceTypeName, pieceMatrix, pieceDiv));
  pieceDiv.addEventListener('touchstart', (e) => startDrag_levels(e, randomPieceTypeName, pieceMatrix, pieceDiv), { passive: false });
  
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
    piecesElement.appendChild(newPieceElement);
  }
}

function startDrag_levels(event, pieceName, pieceMatrix, originalElement) {
  if (draggedPieceElement_levels) return;
  event.preventDefault();
  const eventClientX = event.clientX || event.touches[0].clientX;
  const eventClientY = event.clientY || event.touches[0].clientY;
  lastClientX_levels = eventClientX;
  lastClientY_levels = eventClientY;
  const pieceColor = originalElement.pieceColor;
  selectedPiece_levels = { name: pieceName, matrix: pieceMatrix, color: pieceColor };
  activePieceElement_levels = originalElement;
  draggedPieceElement_levels = activePieceElement_levels.cloneNode(true);
  draggedPieceElement_levels.classList.remove('available-piece-glow');
  draggedPieceElement_levels.pieceColor = pieceColor; 
  draggedPieceElement_levels.classList.add('dragging'); 
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

    // Verificar filas completas
    for (let r = 0; r < numRows; r++) {
        let rowIsFull = true;
        for (let c = 0; c < numCols; c++) {
            if (tempBoard[r][c] === 0) { // Si alguna celda está vacía
                rowIsFull = false;
                break;
            }
        }
        if (rowIsFull) {
            completedRows.push(r);
        }
    }

    // Verificar columnas completas
    for (let c = 0; c < numCols; c++) {
        let colIsFull = true;
        for (let r = 0; r < numRows; r++) {
            if (tempBoard[r][c] === 0) { // Si alguna celda está vacía
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
        } else if (board[r_cell][c_cell] === 1) {
            cell.style.backgroundColor = cell.dataset.pieceColor || ''; 
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
            placePiece_levels(selectedPiece_levels.matrix, bestPlacePos.row, bestPlacePos.col, selectedPiece_levels.color);
            if (activePieceElement_levels) activePieceElement_levels.remove(); 
            placed = true;
            await checkAndClearLines_levels(); 

            // Corrected piece replenishment: generate and append only one new piece
            const newSinglePiece_levels = generateSinglePieceElement_levels();
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
                if (board[boardR][boardC] === 1 || board[boardR][boardC] === 2) { 
                    return false; 
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
                        cellToUpdate.classList.remove('frozen-cell', 'frozen-stage-3', 'frozen-stage-2', 'frozen-stage-1');
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
            if (board[r][c_idx] === 0) { 
                rowIsFull = false; break;
            }
        }
        if (rowIsFull) {
            linesClearedThisTurnCount++;
            for (let c_idx = 0; c_idx < numCols; c_idx++) {
                const cellElement = boardElement.children[r * numCols + c_idx];
                cellsToClearLogically.add({row: r, col: c_idx, element: cellElement, isFrozen: board[r][c_idx] === 2});
            }
        }
    }
    for (let c = 0; c < numCols; c++) {
        let colIsFull = true;
        for (let r_idx = 0; r_idx < numRows; r_idx++) {
            if (board[r_idx][c] === 0) {
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
                if (!alreadyInSet) {
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
            element.classList.remove('frozen-stage-3', 'frozen-stage-2', 'frozen-stage-1');
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
            if (board[r][c] === 1 || board[r][c] === 2) return false;
        }
    }
    return true;
}

function checkGameOver_levels() {
  const levelConfig = levelsConfiguration[currentSelectedLevelId];
  if (!levelConfig) return false; 
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
    
    if (levelConfig.targetScore && !levelConfig.targetFrozenPiecesToClear && typeof levelConfig.maxMoves === 'undefined') { // Solo Nivel 1 (o similar)
        content = `<p><span class="info-label">Meta:</span> ${levelConfig.targetScore} Pts</p>`;
    } else { // Para niveles con movimientos y/o piezas congeladas (como Nivel 2)
        let parts = [];
        if (typeof levelConfig.maxMoves !== 'undefined') {
            parts.push(`<span class="info-label">Mov:</span> <span id="moves-remaining-display">${movesRemaining}</span>`);
        }
        if (levelConfig.targetFrozenPiecesToClear) {
            const clearedCount = frozenPiecesData.filter(p => p.currentStage <= 0).length;
            parts.push(`<span class="info-label">Hielo:</span> <span id="frozen-pieces-cleared-display">${clearedCount}</span>/${levelConfig.targetFrozenPiecesToClear}`);
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