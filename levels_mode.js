// Archivo para la lógica específica del Modo Niveles
console.log("levels_mode.js cargado");

// Estado específico del Modo Niveles
let currentSelectedLevelId = null;
let playerLevelData = {
    // Aquí podríamos guardar el progreso del jugador, como estrellas por nivel
    // Ejemplo: 1: { stars: 2 }, 2: { stars: 0 }
};

// Definición de Niveles (ejemplo)
const levelsConfiguration = {
    1: { id: 1, name: "Nivel 1", objectiveText: "Alcanza 1000 puntos", targetScore: 1000, maxTimeSeconds: null, initialBoard: null, availablePieces: null, starsThresholds: { threeStars: 30, twoStars: 60, oneStar: 120 } }, // Tiempo en segundos para estrellas
    2: { id: 2, name: "Nivel 2", objectiveText: "Próximamente...", targetScore: 2000, locked: true },
    3: { id: 3, name: "Nivel 3", objectiveText: "Próximamente...", targetScore: 3000, locked: true },
    // ... más niveles
};

function showLevelSelectionScreen() {
    console.log("Mostrando pantalla de selección de niveles...");
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
        navigateTo('level-select'); // Volver a la selección de niveles
        return;
    }

    currentGameMode = 'levels'; // Asegurar que el modo de juego global esté correcto
    currentScreen = 'gameplay';
    
    // Resetear el tablero y la puntuación (usando funciones de script.js)
    board.length = 0; 
    for (let i = 0; i < 10; i++) { 
        board.push(Array(10).fill(0));
    }
    score = 0;
    updateScore(0); 

    // Importante: Desactivar/resetear cualquier estado del Modo Combo
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
    updateComboVisuals(); // Esto podría necesitar ser más específico para quitar estilos de combo
    if (backgroundCanvas) backgroundCanvas.style.display = 'none'; // Ocultar fondo de estrellas
    manageStarAnimation(false);
    document.body.style.background = 'linear-gradient(to bottom right, #6D5B97, #A77DBA)'; // Restaurar fondo del body

    if(piecesElement) piecesElement.innerHTML = '';
    // Para el modo niveles, podríamos querer piezas predefinidas o un generador diferente
    // Por ahora, usamos el mismo que el modo combo para simplicidad:
    displayPieces(); 

    createBoardCells(); 
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

    // Mostrar UI específica del nivel (ej. objetivo, movimientos restantes)
    displayLevelObjective(levelConfig);

    updateScreenVisibility(); // Para mostrar el gameArea
    console.log(`Nivel ${levelId} cargado. Objetivo: ${levelConfig.objectiveText}. Puntuación objetivo: ${levelConfig.targetScore}`);
}

function displayLevelObjective(levelConfig) {
    let objectiveDisplay = document.getElementById('level-info-display');
    if (!objectiveDisplay) {
        objectiveDisplay = document.createElement('div');
        objectiveDisplay.id = 'level-info-display';
        // Decidir dónde añadirlo. gameContainer es un buen candidato.
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.insertBefore(objectiveDisplay, gameContainer.firstChild); // Añadir al principio de game-container
        } else {
            document.body.appendChild(objectiveDisplay); // Fallback
        }
    }

    let content = `<p><span class="info-label">Nivel:</span> ${levelConfig.id}</p>`;
    content += `<p><span class="info-label">Objetivo:</span> ${levelConfig.objectiveText}</p>`;
    if (levelConfig.targetScore) {
        content += `<p><span class="info-label">Puntos Meta:</span> ${levelConfig.targetScore}</p>`;
    }
    // Aquí podríamos añadir más info, como movimientos restantes, tiempo, etc.
    
    objectiveDisplay.innerHTML = content;
    objectiveDisplay.classList.remove('hidden');
}

function hideLevelObjective() {
    const objectiveDisplay = document.getElementById('level-info-display');
    if (objectiveDisplay) {
        objectiveDisplay.classList.add('hidden');
    }
}

function handleLevelWin(levelConfig) {
    console.log(`¡Nivel ${levelConfig.id} completado! Puntuación: ${score}`);
    
    // 1. Calcular y guardar estrellas (simplificado por ahora)
    // Para el Nivel 1, si se gana, damos 3 estrellas.
    // Más adelante, esto dependería del tiempo, movimientos, etc.
    let starsEarned = 0;
    if (levelConfig.targetScore && score >= levelConfig.targetScore) {
        // Aquí iría la lógica de tiempo si la tuviéramos.
        // Por ahora, si se alcanza el targetScore, damos 3 estrellas para el Nivel 1.
        if (levelConfig.id === 1) { // Ejemplo específico para Nivel 1
            starsEarned = 3;
        } else {
            // Lógica genérica de estrellas si no es el Nivel 1 (o si no hay umbrales de tiempo)
            starsEarned = 3; // Default a 3 si se cumple el objetivo principal
        }
    }
    
    if (!playerLevelData[levelConfig.id] || playerLevelData[levelConfig.id].stars < starsEarned) {
        playerLevelData[levelConfig.id] = { stars: starsEarned };
        console.log(`Nivel ${levelConfig.id} - Estrellas obtenidas: ${starsEarned}. Datos guardados:`, playerLevelData);
        // Aquí podrías guardar playerLevelData en localStorage si quieres persistencia
        // localStorage.setItem('blockTrisPlayerLevelData', JSON.stringify(playerLevelData));
    }

    // 2. Desbloquear el siguiente nivel si existe
    const nextLevelId = levelConfig.id + 1;
    if (levelsConfiguration[nextLevelId]) {
        levelsConfiguration[nextLevelId].locked = false;
        console.log(`Nivel ${nextLevelId} desbloqueado.`);
    }

    // 3. Mostrar mensaje de victoria y navegar
    // Usar un timeout para que el jugador vea el estado final del tablero/puntuación un instante
    setTimeout(() => {
        alert(`¡Felicidades! Nivel ${levelConfig.id} superado con ${score} puntos y ${starsEarned} estrella(s).`);
        hideLevelObjective();
        showLevelSelectionScreen(); // Esto re-renderizará las tarjetas
    }, 500); // Pequeña demora
}

// Modificar checkGameOver para el modo niveles
// (Esto requerirá que checkGameOver sea accesible globalmente o refactorizarlo)
// Por ahora, solo modificaremos la lógica de Game Over en el modo niveles

// En script.js, la función handleGameOver podría necesitar una bifurcación:
/*
function handleGameOver() {
    // ... (limpieza común)
    if (currentGameMode === 'levels') {
        // Lógica específica de Game Over para niveles (¿falló el nivel?)
        // Mostrar si se alcanzó el objetivo o no
        // Opción de reintentar nivel o volver a selección de niveles
        if (gameOverTitleElement) gameOverTitleElement.textContent = "¡Nivel Fallido!";
        // ... mostrar puntuación vs objetivo ...
    } else {
        // Lógica actual para Modo Combo
        if (gameOverTitleElement) gameOverTitleElement.textContent = "¡Juego Terminado!";
    }
    if (finalScoreElement) finalScoreElement.textContent = `Puntaje Final: ${score}`;
    // ... (mostrar modal)
}
*/

// En script.js, la función checkAndClearLines, después de calcular puntos, podría verificar si se alcanzó el objetivo del nivel:
/*
async function checkAndClearLines() {
    // ... (lógica existente)
    if (linesClearedThisTurnCount > 0) {
        // ... (puntos, combo, partículas)
        if (currentGameMode === 'levels' && currentSelectedLevelId) {
            const levelConfig = levelsConfiguration[currentSelectedLevelId];
            if (score >= levelConfig.targetScore) {
                handleLevelWin(levelConfig);
                return; // Terminar el procesamiento si el nivel se ganó
            }
        }
        if (checkGameOver()) { // Mover checkGameOver aquí si no se ganó el nivel
            handleGameOver();
        } 
        return Promise.resolve(linesClearedThisTurnCount);
    } // ...
}
*/

// function handleLevelWin(levelConfig) {
//     console.log(`¡Nivel ${levelConfig.id} completado!`);
//     // Calcular estrellas basadas en tiempo o movimientos
//     // Guardar progreso
//     // Desbloquear siguiente nivel
//     // Mostrar pantalla de victoria de nivel
//     alert(`¡Felicidades! Nivel ${levelConfig.id} superado.`);
//     navigateTo('level-select');
// }

// (Asegúrate de que las variables globales de script.js como `board`, `score`, `updateScore`, `displayPieces`, `createBoardCells`, etc.
// sean accesibles desde este archivo, o pásalas como parámetros/módulos si usas un sistema de módulos en el futuro)

// function initializeLevelsMode() {
//   console.log("Inicializando Modo Niveles...");
//   // Lógica para cargar el primer nivel, mostrar la UI específica del nivel, etc.
//   // ...
//   // Asegurarse de que la lógica del Modo Combo no interfiera.
//   resetComboState(); // Suponiendo que tenemos una función para resetear el estado del combo
//   hideComboUI();     // Suponiendo que tenemos una función para ocultar la UI del combo
// }

// function loadLevel(levelNumber) {
//   // Cargar la configuración del nivel, actualizar el tablero, mostrar objetivos.
// }

// function checkLevelCompletion() {
//   // Verificar si se cumplieron los objetivos del nivel actual.
// }

// function handleLevelFailed() {
//   // Mostrar mensaje de nivel fallido, opciones para reintentar.
// }

// Y así sucesivamente... 