# BlockTris Deluxe

Bienvenido a BlockTris Deluxe, un juego de puzzle inspirado en Tetris con un giro moderno y mecánicas de combo.

## Estado Actual del Proyecto (Commit: 2ad2089)

El juego actualmente cuenta con un **Modo Combo Infinito** completamente funcional.

### Características Principales:
*   Jugabilidad clásica de colocar bloques para completar líneas.
*   Sistema de Combo:
    *   **Activación:** Limpia 4 líneas en menos de 10 segundos.
    *   **Progresión:** Mantén el combo limpiando al menos 1 línea cada 7 segundos para aumentar el multiplicador (hasta x5).
    *   Feedback visual extenso: mensajes, colores del tablero, efectos de texto y un fondo de estrellas animado que reacciona al combo.
*   Animaciones y Efectos Visuales:
    *   Explosión de partículas al limpiar líneas.
    *   Pulsación de bloques al colocar.
    *   Brillo y aparición de nuevas piezas.
    *   Puntuación flotante.
*   Interfaz de usuario moderna con modal de "Juego Terminado".

## Cómo Continuar Trabajando en Otra PC

1.  **Requisitos Previos:**
    *   Tener Git instalado: [git-scm.com](https://git-scm.com/)
    *   Un editor de código como Cursor o VS Code.
    *   (Opcional pero recomendado) Una extensión para servidor en vivo (ej. "Live Server" para VS Code/Cursor).

2.  **Configuración Inicial de Git (si es la primera vez en la nueva PC):**
    ```bash
    git config --global user.name "TuNombreDeUsuarioEnGitHub"
    git config --global user.email "tu_email_asociado_a_github@example.com"
    ```

3.  **Clonar el Repositorio:**
    Abre una terminal y ejecuta:
    ```bash
    git clone https://github.com/mirobo137/BlockTris.git
    ```
    Esto creará una carpeta `BlockTris` (o el nombre de tu repositorio) con el proyecto.

4.  **Abrir en tu Editor:**
    Abre la carpeta clonada con Cursor o tu editor preferido.

## Comandos de Git Útiles

*   **Ver el estado de tus archivos:**
    ```bash
    git status
    ```
*   **Añadir cambios al área de preparación (staging):**
    *   Para añadir todos los archivos modificados:
        ```bash
        git add .
        ```
    *   Para añadir un archivo específico:
        ```bash
        git add nombre_del_archivo.js
        ```
*   **Confirmar tus cambios (hacer un commit):**
    ```bash
    git commit -m "Un mensaje descriptivo de tus cambios"
    ```
*   **Subir tus commits a GitHub:**
    ```bash
    git push origin main 
    ```
    (Reemplaza `main` si estás trabajando en otra rama).
*   **Descargar los últimos cambios desde GitHub:**
    ```bash
    git pull origin main
    ```
    (Reemplaza `main` si estás trabajando en otra rama).
*   **Resetear cambios locales al último commit (¡CUIDADO: descarta cambios no guardados!):**
    *   Para un archivo específico:
        ```bash
        git checkout -- nombre_del_archivo.js
        ```
    *   Para todos los archivos (como lo hicimos antes):
        ```bash
        git reset --hard HEAD
        ```

## Cómo Iniciar un Servidor de Desarrollo Local

Este proyecto es una aplicación web estática (HTML, CSS, JavaScript). La forma más sencilla de verlo en tu navegador y que se actualice automáticamente con los cambios es usando una extensión de servidor en vivo.

*   **Si usas VS Code o Cursor con la extensión "Live Server":**
    1.  Abre el archivo `index.html`.
    2.  Haz clic derecho dentro del editor y selecciona "Open with Live Server".
    3.  Esto abrirá el juego en tu navegador por defecto en una dirección como `http://127.0.0.1:5500/index.html`.

*   **Si no tienes una extensión:**
    Puedes abrir el archivo `index.html` directamente en tu navegador. Sin embargo, es posible que necesites recargar la página manualmente para ver los cambios que hagas en el código. Para algunas funcionalidades avanzadas de JavaScript o si encuentras problemas con las rutas de los archivos, un servidor local es más robusto.

## Pasos Siguientes Sugeridos

1.  Reimplementar el **Modo Niveles (Campaña)**.
2.  Refinar el Modo Combo Infinito.
3.  Mejoras generales (optimización, responsividad, sonidos).

¡Feliz desarrollo! 