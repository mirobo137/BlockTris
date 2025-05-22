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
let offsetX, offsetY; // Para un arrastre más natural

const piecesElement = document.getElementById("pieces");
const pieceKeys = Object.keys(PIECES); // Nombres de las piezas: ['I', 'L', 'J', ...]

const CELL_SIZE = 30; // Tamaño de la celda del tablero en píxeles
const GAP_SIZE = 2;   // Tamaño del gap entre celdas del tablero en píxeles

let currentShadowCells = [];
const SHADOW_SNAP_THRESHOLD_CELLS = 1.5; // Umbral para "ajustar" la sombra, en unidades de celdas

const ANIMATION_DURATION = 500; // ms, DEBE COINCIDIR CON CSS (antes 2000ms, ahora 0.5s)

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

  const clientX = event.clientX || event.touches[0].clientX;
  const clientY = event.clientY || event.touches[0].clientY;

  // El clon se mueve para que su esquina superior izquierda esté en clientX - offsetX, clientY - offsetY
  const newPieceLeft = clientX - offsetX;
  const newPieceTop = clientY - offsetY;
  draggedPieceElement.style.left = `${newPieceLeft}px`;
  draggedPieceElement.style.top = `${newPieceTop}px`;

  // Calcular el NUEVO centro de la pieza flotante para la sombra
  const draggedRect = draggedPieceElement.getBoundingClientRect();
  const pieceCenterX = draggedRect.left + draggedRect.width / 2;
  const pieceCenterY = draggedRect.top + draggedRect.height / 2;

  updatePieceShadow(pieceCenterX, pieceCenterY); // Pasar el centro de la pieza flotante
}

function updatePieceShadow(pieceCenterX, pieceCenterY) {
  // Limpiar sombra anterior
  currentShadowCells.forEach(cell => {
    cell.classList.remove('shadow');
    // Restaura el color original solo si no está ocupada por una pieza real
    const r = parseInt(cell.dataset.row);
    const c = parseInt(cell.dataset.col);
    if (board[r][c] === 0) {
        cell.style.backgroundColor = ''; // O el color de celda vacía si es diferente a ''
    } else {
        cell.style.backgroundColor = cell.dataset.pieceColor || ''; // Color de la pieza que la ocupa
    }
  });
  currentShadowCells = [];

  if (!selectedPiece || !selectedPiece.color || !draggedPieceElement) return;

  const boardRect = boardElement.getBoundingClientRect();
  // Coordenadas del cursor relativas al tablero
  const cursorRelativeToBoardX = pieceCenterX - boardRect.left;
  const cursorRelativeToBoardY = pieceCenterY - boardRect.top;

  let bestSnapPos = null;
  let minDistanceSq = Infinity;

  // Iterar sobre todas las celdas del tablero como posibles puntos de anclaje (esquina superior izquierda de la pieza)
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (canPlacePiece(selectedPiece.matrix, r, c)) {
        // Calcular el centro de la celda (r,c) del tablero en coordenadas de pantalla
        const cellCenterX = boardRect.left + (c * (CELL_SIZE + GAP_SIZE)) + (CELL_SIZE / 2);
        const cellCenterY = boardRect.top + (r * (CELL_SIZE + GAP_SIZE)) + (CELL_SIZE / 2);

        // Para el "snap", consideramos la distancia desde el cursor (que sigue al dedo)
        // hasta el centro de la *primera celda* de la pieza si se colocara en (r,c).
        // Esto es una simplificación; una mejor heurística podría ser el centro de la pieza.
        const distSq = (pieceCenterX - cellCenterX) ** 2 + (pieceCenterY - cellCenterY) ** 2;

        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          bestSnapPos = { row: r, col: c };
        }
      }
    }
  }

  // Aplicar umbral de distancia para el "snap"
  const snapThresholdPixels = SHADOW_SNAP_THRESHOLD_CELLS * (CELL_SIZE + GAP_SIZE);
  if (bestSnapPos && Math.sqrt(minDistanceSq) < snapThresholdPixels * selectedPiece.matrix[0].length) { // Umbral más generoso
    // Si encontramos una posición válida y está dentro del umbral, mostrar la sombra ahí
    const shadowColorRgba = hexToRgba(selectedPiece.color, 0.45);
    for (let r_offset = 0; r_offset < selectedPiece.matrix.length; r_offset++) {
      for (let c_offset = 0; c_offset < selectedPiece.matrix[r_offset].length; c_offset++) {
        if (selectedPiece.matrix[r_offset][c_offset] === 1) {
          const boardR = bestSnapPos.row + r_offset;
          const boardC = bestSnapPos.col + c_offset;
          // Doble verificación por si acaso, aunque canPlacePiece ya lo hizo
          if (boardR < 10 && boardC < 10 && boardR >= 0 && boardC >= 0) {
            const cellElement = boardElement.querySelector(`[data-row='${boardR}'][data-col='${boardC}']`);
            if (cellElement && board[boardR][boardC] === 0) { // Sombrear solo si la celda está vacía
              cellElement.style.backgroundColor = shadowColorRgba;
              cellElement.classList.add('shadow');
              currentShadowCells.push(cellElement);
            }
          }
        }
      }
    }
  } else {
    // Si no hay posición válida o está demasiado lejos, no mostrar sombra.
    // `currentShadowCells` ya está vacío y la sombra anterior fue limpiada.
  }
}

async function dragEnd(event) {
  if (!draggedPieceElement) return;

  // Limpiar la sombra visualmente ANTES de cualquier lógica de colocación.
  currentShadowCells.forEach(cell => {
    cell.classList.remove('shadow');
    const r = parseInt(cell.dataset.row);
    const c = parseInt(cell.dataset.col);
    if (board[r][c] === 0) { // Solo limpiar si la celda del tablero está lógicamente vacía
        cell.style.backgroundColor = ''; 
    } else { // Si no, restaurar el color de la pieza que la ocupa
        cell.style.backgroundColor = cell.dataset.pieceColor || ''; 
    }
  });
  currentShadowCells = []; // Limpiar el array de celdas de sombra

  document.removeEventListener('mousemove', dragMove);
  document.removeEventListener('touchmove', dragMove, { passive: false });
  document.removeEventListener('mouseup', dragEnd);
  document.removeEventListener('touchend', dragEnd);

  // const clientX = event.clientX || (event.changedTouches && event.changedTouches[0].clientX);
  // const clientY = event.clientY || (event.changedTouches && event.changedTouches[0].clientY);
  // Usar el centro de la pieza flotante para la lógica de colocación final
  const draggedRect = draggedPieceElement.getBoundingClientRect();
  const finalPieceCenterX = draggedRect.left + draggedRect.width / 2;
  const finalPieceCenterY = draggedRect.top + draggedRect.height / 2;

  let placed = false;
  if (selectedPiece && selectedPiece.color) {
    const boardRect = boardElement.getBoundingClientRect();
    
    let bestPlacePos = null;
    let minDistanceSqForPlacement = Infinity;

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (canPlacePiece(selectedPiece.matrix, r, c)) {
          // Centro de la celda (r,c) del tablero
          const cellCenterX = boardRect.left + (c * (CELL_SIZE + GAP_SIZE)) + (CELL_SIZE / 2);
          const cellCenterY = boardRect.top + (r * (CELL_SIZE + GAP_SIZE)) + (CELL_SIZE / 2);
          // Distancia desde el centro de la pieza flotante al centro de la celda candidata
          const distSq = (finalPieceCenterX - cellCenterX) ** 2 + (finalPieceCenterY - cellCenterY) ** 2;

          if (distSq < minDistanceSqForPlacement) {
            minDistanceSqForPlacement = distSq;
            bestPlacePos = { row: r, col: c };
          }
        }
      }
    }

    const placeThresholdPixels = SHADOW_SNAP_THRESHOLD_CELLS * (CELL_SIZE + GAP_SIZE);
    if (bestPlacePos && Math.sqrt(minDistanceSqForPlacement) < placeThresholdPixels * selectedPiece.matrix[0].length) {
      // Colocar la pieza en la mejor posición encontrada si está dentro del umbral
      placePiece(selectedPiece.matrix, bestPlacePos.row, bestPlacePos.col, selectedPiece.color);
      if (activePieceElement) activePieceElement.remove(); // Eliminar pieza de la lista de disponibles
      placed = true;
      
      await checkAndClearLines(); // No necesitamos la variable linesWereCleared aquí por ahora
      
      const newSinglePiece = generateSinglePieceElement();
      piecesElement.appendChild(newSinglePiece);
      
      checkGameOver();
    }
  }

  // Si no se colocó la pieza (fuera del umbral o no cabe), restaurar la pieza original en la lista
  if (!placed) {
    if (activePieceElement) {
      activePieceElement.classList.remove('hidden-original');
    }
  }

  // Limpiar la pieza arrastrada del DOM
  if (draggedPieceElement && draggedPieceElement.parentNode === document.body) {
    document.body.removeChild(draggedPieceElement);
  }
  
  // Resetear estado de arrastre
  draggedPieceElement = null;
  selectedPiece = null;
  activePieceElement = null;
  offsetX = 0;
  offsetY = 0;
}

function startDrag(event, pieceName, pieceMatrix, originalElement) {
  if (draggedPieceElement) return;
  event.preventDefault();

  const pieceColor = originalElement.pieceColor;
  selectedPiece = { name: pieceName, matrix: pieceMatrix, color: pieceColor };
  activePieceElement = originalElement;

  draggedPieceElement = activePieceElement.cloneNode(true);
  draggedPieceElement.pieceColor = pieceColor; 
  draggedPieceElement.classList.add('dragging'); // El estilo .dragging ya aplica la escala
  document.body.appendChild(draggedPieceElement);

  // Posicionar el clon para que el evento (dedo/cursor) esté en su centro.
  // Primero, obtener dimensiones del clon DESPUÉS de que se haya aplicado la clase .dragging.
  // Para ello, forzamos un reflow/repaint si es necesario, o esperamos que las dimensiones estén disponibles.
  // Una forma simple es obtenerlas después de añadirlo al DOM y aplicar la clase.
  const draggedRect = draggedPieceElement.getBoundingClientRect();
  const clientX = event.clientX || event.touches[0].clientX;
  const clientY = event.clientY || event.touches[0].clientY;

  offsetX = draggedRect.width / 2;
  // offsetY = draggedRect.height / 2; // Original: centra la pieza en el cursor
  // offsetY = draggedRect.height + 15; // Modificación anterior
  // offsetY = draggedRect.height + (draggedRect.height / 2); // Modificación previa más reciente

  // Nuevo offsetY: Posiciona la pieza aún más arriba del punto de toque.
  offsetY = draggedRect.height * 2; // Ejemplo: el toque está una altura de pieza por debajo de su borde inferior.

  draggedPieceElement.style.left = `${clientX - offsetX}px`;
  draggedPieceElement.style.top = `${clientY - offsetY}px`;

  activePieceElement.classList.add('hidden-original'); 
  updatePieceShadow(clientX, clientY); // clientX, clientY es donde está el centro de la pieza

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
        }
      }
    }
  }
}

async function checkAndClearLines() {
    console.log("--- checkAndClearLines INICIO ---");
    let linesClearedThisTurn = 0;
    const rowsToClearIndices = [];
    const colsToClearIndices = [];
    const cellsToAnimateAndClear = new Set(); // Renombrado para claridad

    // 1. Identificar filas completas
    for (let r = 0; r < 10; r++) {
        if (board[r].every(cellState => cellState === 1)) {
            rowsToClearIndices.push(r);
            for (let c = 0; c < 10; c++) {
                const cellElement = boardElement.querySelector(`[data-row='${r}'][data-col='${c}']`);
                if (cellElement) cellsToAnimateAndClear.add(cellElement);
            }
        }
    }

    // 2. Identificar columnas completas
    for (let c = 0; c < 10; c++) {
        let colIsFull = true;
        for (let r = 0; r < 10; r++) {
            if (board[r][c] === 0) {
                colIsFull = false;
                break;
            }
        }
        if (colIsFull) {
            colsToClearIndices.push(c);
            for (let r = 0; r < 10; r++) {
                const cellElement = boardElement.querySelector(`[data-row='${r}'][data-col='${c}']`);
                if (cellElement) cellsToAnimateAndClear.add(cellElement);
            }
        }
    }

    // 3. Calcular el número de líneas únicas limpiadas para el puntaje
    linesClearedThisTurn = rowsToClearIndices.length;
    colsToClearIndices.forEach(c_idx => {
        let isNewColLine = false;
        for (let r_idx = 0; r_idx < 10; r_idx++) {
            // Contamos una columna como una nueva línea si no es parte de una fila ya contada
            // y si la celda en esa columna (y cualquier fila) estaba ocupada.
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
        // 4. Aplicar animación de desvanecimiento
        cellsToAnimateAndClear.forEach(cellElement => {
            // La animación de desvanecimiento se aplica directamente a la celda.
            // Ya no buscamos un '.piece-block' dentro, asumimos que el color está en la celda.
            cellElement.classList.add('line-fade-out');
        });

        console.log("Clase 'line-fade-out' añadida. Esperando animación...");
        // 5. Esperar que la animación termine
        await new Promise(resolve => setTimeout(resolve, ANIMATION_DURATION));
        console.log("...Animación terminada (según setTimeout).");

        // 6. Limpieza final después de la animación
        console.log("Iniciando limpieza post-animación.");
        cellsToAnimateAndClear.forEach(cellElement => {
            const row = parseInt(cellElement.dataset.row);
            const col = parseInt(cellElement.dataset.col);
            console.log(`Limpiando celda: R${row}, C${col}`);

            board[row][col] = 0; // Marcar como vacía en la lógica
            cellElement.style.backgroundColor = ''; // Limpiar color de fondo
            delete cellElement.dataset.pieceColor; // Limpiar el color guardado
            cellElement.classList.remove('line-fade-out'); // Quitar clase de animación
            cellElement.classList.remove('piece-block'); // Quitar clase que la marca como bloque de pieza
            // Importante: Asegurar que la opacidad se restaura si la animación la cambió
            cellElement.style.opacity = ''; // Restablecer opacidad a su valor por defecto (o el que dicte CSS)
        });

        if (linesClearedThisTurn > 0) {
            console.log(`${linesClearedThisTurn} línea(s) eliminada(s). Actualizando puntaje...`);
            updateScore(linesClearedThisTurn);
        }
    }
}

function updateScore(clearedLinesCount) {
  if (clearedLinesCount > 0) {
    let pointsEarned = clearedLinesCount * 10;
    if (clearedLinesCount > 1) {
        pointsEarned += (clearedLinesCount -1) * clearedLinesCount * 5; // Bonus por combos
    }
    score += pointsEarned;
    scoreElement.textContent = `Puntos: ${score}`;
    console.log(`${clearedLinesCount} línea(s) eliminada(s). ${pointsEarned} puntos obtenidos. Nuevo puntaje: ${score}`);
  } else {
    console.log("updateScore llamado con 0 líneas.");
  }
}

function handleGameOver() {
  // Detener cualquier posible arrastre en curso
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

  // Mostrar el modal de Game Over
  finalScoreElement.textContent = `Puntaje Final: ${score}`;
  gameOverModal.style.display = 'flex'; // Cambiado para usar el display original del CSS para centrar
  setTimeout(() => { // Pequeño delay para permitir que el display:flex se aplique antes de la transición de opacidad
    gameOverModal.classList.add('visible');
  }, 20); 
}

function checkGameOver() {
  const availablePieceElements = piecesElement.querySelectorAll('.piece');
  if (availablePieceElements.length === 0 && boardIsEmpty()) { // Si no hay piezas y el tablero está vacío (inicio raro)
      // Podría ser un estado inicial donde no se pudieron generar piezas, no es game over estándar.
      return false; // No es game over por falta de movimientos
  }
  if (availablePieceElements.length === 0 && !boardIsEmpty()){ // No hay piezas para colocar y el tablero no está vacío
      handleGameOver();
      return true;
  }

  for (let pieceElement of availablePieceElements) {
    const pieceMatrix = pieceElement.pieceMatrix; // Acceder a la matriz guardada
    if (!pieceMatrix) continue; // Seguridad, por si acaso

    // Intentar colocar esta pieza en cada celda del tablero
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (canPlacePiece(pieceMatrix, r, c)) {
          // console.log("Movimiento posible encontrado. El juego continúa.");
          return false; // Se encontró un movimiento posible, el juego no ha terminado
        }
      }
    }
  }

  // Si se llega aquí, ninguna de las piezas disponibles se pudo colocar en ningún sitio.
  // console.log("No hay movimientos posibles. ¡Juego Terminado!");
  handleGameOver();
  return true; // Juego terminado
}

// Función auxiliar para checkGameOver
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

// Event Listener para el botón de reiniciar (añadir al final del script o dentro de un DOMContentLoaded)
if (restartGameButton) { // Verificar que el botón exista
    restartGameButton.addEventListener('click', () => {
        window.location.reload(); // Recarga la página para reiniciar
    });
}