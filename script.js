const board = [];
const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
let score = 0;

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

const ANIMATION_DURATION = 2000; // ms, DEBE COINCIDIR CON CSS (2s)

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

  // El clon se mueve para que su centro (definido por el nuevo offsetX/Y) esté en clientX, clientY
  draggedPieceElement.style.left = `${clientX - offsetX}px`;
  draggedPieceElement.style.top = `${clientY - offsetY}px`;

  updatePieceShadow(clientX, clientY); // clientX, clientY ahora representan el centro de la pieza
}

function updatePieceShadow(centerX, centerY) {
  currentShadowCells.forEach(cell => {
    cell.classList.remove('shadow');
    cell.style.backgroundColor = cell.dataset.pieceColor || '';
  });
  currentShadowCells = [];

  if (!selectedPiece || !selectedPiece.color) return;
  const boardRect = boardElement.getBoundingClientRect();
  const pieceWidth = draggedPieceElement ? draggedPieceElement.offsetWidth : (selectedPiece.matrix[0].length * 15 * 1.25);
  const pieceHeight = draggedPieceElement ? draggedPieceElement.offsetHeight : (selectedPiece.matrix.length * 15 * 1.25);
  const pieceTopLeftX = centerX - (pieceWidth / 2);
  const pieceTopLeftY = centerY - (pieceHeight / 2);
  const targetCol = Math.floor((pieceTopLeftX - boardRect.left) / (CELL_SIZE + GAP_SIZE));
  const targetRow = Math.floor((pieceTopLeftY - boardRect.top) / (CELL_SIZE + GAP_SIZE));

  if (canPlacePiece(selectedPiece.matrix, targetRow, targetCol)) {
    const shadowColorRgba = hexToRgba(selectedPiece.color, 0.45);
    for (let r = 0; r < selectedPiece.matrix.length; r++) {
      for (let c = 0; c < selectedPiece.matrix[r].length; c++) {
        if (selectedPiece.matrix[r][c] === 1) {
          const boardR = targetRow + r;
          const boardC = targetCol + c;
          const cellElement = boardElement.querySelector(`[data-row='${boardR}'][data-col='${boardC}']`);
          if (cellElement) {
            if (!board[boardR][boardC]) {
                 cellElement.style.backgroundColor = shadowColorRgba;
                 cellElement.classList.add('shadow');
                 currentShadowCells.push(cellElement);
            } else {
                // Si la celda está ocupada, podríamos no añadirla a currentShadowCells
                // o poner una sombra diferente, o nada. Por ahora, no se sombrea.
            }
          }
        }
      }
    }
  }
}

async function dragEnd(event) {
  if (!draggedPieceElement) return;

  // Limpiar sombra final antes de cualquier otra acción
  currentShadowCells.forEach(cell => {
    cell.classList.remove('shadow');
    cell.style.backgroundColor = cell.dataset.pieceColor || '';
  });
  currentShadowCells = [];

  document.removeEventListener('mousemove', dragMove);
  document.removeEventListener('touchmove', dragMove, { passive: false });
  document.removeEventListener('mouseup', dragEnd);
  document.removeEventListener('touchend', dragEnd);

  const clientX = event.clientX || (event.changedTouches && event.changedTouches[0].clientX);
  const clientY = event.clientY || (event.changedTouches && event.changedTouches[0].clientY);

  let placed = false;
  if (selectedPiece && selectedPiece.color) { 
    const boardRect = boardElement.getBoundingClientRect();
    const pieceWidth = draggedPieceElement ? draggedPieceElement.offsetWidth : (selectedPiece.matrix[0].length * 15 * 1.25); 
    const pieceHeight = draggedPieceElement ? draggedPieceElement.offsetHeight : (selectedPiece.matrix.length * 15 * 1.25);

    const pieceTopLeftX = clientX - (pieceWidth / 2);
    const pieceTopLeftY = clientY - (pieceHeight / 2);

    // AJUSTE: Eliminamos el + (CELL_SIZE / 2) para probar
    const targetCol = Math.floor((pieceTopLeftX - boardRect.left) / (CELL_SIZE + GAP_SIZE));
    const targetRow = Math.floor((pieceTopLeftY - boardRect.top) / (CELL_SIZE + GAP_SIZE));
    
    // console.log(`Drop At: R${targetRow}, C${targetCol}`);

    if (canPlacePiece(selectedPiece.matrix, targetRow, targetCol)) {
      placePiece(selectedPiece.matrix, targetRow, targetCol, selectedPiece.color);
      if (activePieceElement) activePieceElement.remove();
      placed = true;
      
      const linesWereCleared = await checkAndClearLines();
      // Si se limpiaron líneas, updateScore ya fue llamado dentro de checkAndClearLines
      // También podríamos querer mostrar los puntos flotantes aquí después del await
      // if (linesWereCleared) {
      //   showFloatingScore(linesClearedThisTurn * PUNTOS_POR_LINEA, targetRow, targetCol); // Ejemplo
      // }

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

  // offsetX/Y ahora es la distancia desde la esquina sup-izq del *clon* a su *centro*.
  offsetX = draggedRect.width / 2;
  offsetY = draggedRect.height / 2;

  // Posicionar el clon de forma que el punto del evento (clientX, clientY) coincida con su centro.
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
    const cellsToProcess = new Set();

    // 1. Identificar filas completas
    for (let r = 0; r < 10; r++) {
        if (board[r].every(cellState => cellState === 1)) {
            rowsToClearIndices.push(r);
            for (let c = 0; c < 10; c++) {
                const cellElement = boardElement.querySelector(`[data-row='${r}'][data-col='${c}']`);
                if (cellElement) cellsToProcess.add(cellElement);
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
                if (cellElement) cellsToProcess.add(cellElement);
            }
        }
    }

    // 3. Calcular el número de líneas únicas limpiadas para el puntaje
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
    console.log(`Celdas a procesar (animar/limpiar): ${cellsToProcess.size}`);

    if (cellsToProcess.size > 0) {
        // 4. Aplicar animación
        cellsToProcess.forEach(cellElement => {
            const pieceBlock = cellElement.querySelector('.piece-block');
            if (pieceBlock) {
                console.log("Aplicando animación a piece-block en celda:", cellElement.dataset.row, cellElement.dataset.col);
                pieceBlock.style.backgroundColor = ''; // Crucial para que la animación tome el control
            } else {
                console.warn("No se encontró piece-block en celda:", cellElement.dataset.row, cellElement.dataset.col);
            }
            cellElement.classList.add('line-clearing');
        });

        console.log("Clase 'line-clearing' añadida. Esperando animación...");
        // 5. Esperar que la animación termine
        await new Promise(resolve => setTimeout(resolve, ANIMATION_DURATION));
        console.log("...Animación terminada (según setTimeout).");

        // 6. Limpieza final después de la animación
        console.log("Iniciando limpieza post-animación.");
        cellsToProcess.forEach(cellElement => {
            const row = parseInt(cellElement.dataset.row);
            const col = parseInt(cellElement.dataset.col);
            console.log(`Limpiando celda: R${row}, C${col}`);

            board[row][col] = 0;
            cellElement.style.backgroundColor = '';
            delete cellElement.dataset.pieceColor;
            cellElement.classList.remove('line-clearing');

            const pieceBlock = cellElement.querySelector('.piece-block');
            if (pieceBlock) {
                console.log("Eliminando piece-block de celda:", cellElement.dataset.row, cellElement.dataset.col);
                pieceBlock.remove();
            } else {
                 console.warn("No se encontró piece-block para eliminar en celda:", cellElement.dataset.row, cellElement.dataset.col, "(ya podría haber sido removido o la estructura cambió)");
            }
        });

        if (linesClearedThisTurn > 0) {
            console.log(`Actualizando puntaje con ${linesClearedThisTurn} líneas.`);
            updateScore(linesClearedThisTurn);
        } else {
            console.log("No hay líneas para puntuar este turno, aunque hubo celdas procesadas.");
        }
        console.log("--- checkAndClearLines FIN (con limpieza) ---");
        return linesClearedThisTurn > 0;
    } else {
        console.log("No hay celdas para procesar.");
        console.log("--- checkAndClearLines FIN (sin limpieza) ---");
        return false; // No se limpiaron líneas
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
  // Detener cualquier posible arrastre en curso (aunque no debería haberlo si no hay movimientos válidos)
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

  // Deshabilitar la creación de nuevas piezas o interacciones futuras (más robusto sería con flags)
  // Por ahora, el alert bloqueará la ejecución.
  setTimeout(() => { // Usar setTimeout para asegurar que cualquier actualización de UI pendiente se complete
    alert(`¡Juego Terminado!\nPuntaje Final: ${score}`);
    // Aquí podrías añadir un botón de "Reiniciar Juego" o similar
    // Por ejemplo, podríamos recargar la página para un reinicio simple:
    // if (confirm("¿Jugar de nuevo?")) {
    //   window.location.reload();
    // }
  }, 100); // Pequeño delay
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