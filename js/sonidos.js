// sonidos.js
// Rutas relativas a la raíz del proyecto (donde está index.html)
const RUTAS_SONIDOS = {
  click: 'sonidos/click.mp3',
  acierto: 'sonidos/acierto.mp3',
  error: 'sonidos/error.mp3',
};

// Objeto para almacenar las instancias de Audio precargadas
const INSTANCIAS_SONIDO = {};

/**
 * Carga todos los sonidos de forma asíncrona.
 */
export function cargarSonidos() {
  console.log("Cargando sonidos...");
  
  for (const nombre in RUTAS_SONIDOS) {
    const audio = new Audio(RUTAS_SONIDOS[nombre]);
    audio.preload = 'auto'; // Asegura que se cargue
    
    // Una vez cargado, lo almacenamos
    INSTANCIAS_SONIDO[nombre] = audio;
  }
}

/**
 * Reproduce un sonido específico.
 * Usa .cloneNode() para permitir que el mismo sonido se dispare varias veces.
 * @param {string} nombre - El nombre clave del sonido (ej: 'click', 'acierto').
 */
export function reproducirSonido(nombre) {
  const originalAudio = INSTANCIAS_SONIDO[nombre];
  
  if (originalAudio) {
    // Clonamos el nodo para que la reproducción no se interrumpa
    const clone = originalAudio.cloneNode();
    clone.volume = 0.5; // Ajustamos el volumen para que sea sutil
    clone.play().catch(e => {
        // console.error("Error al reproducir sonido:", e.message); 
        // A veces los navegadores bloquean el sonido si no hay interacción previa.
    });
  }
}

// Función de conveniencia para clicks (lo usaremos mucho)
export function reproducirClick() {
    reproducirSonido('click');
}

// Aseguramos que los sonidos se carguen al iniciar la aplicación
document.addEventListener('DOMContentLoaded', cargarSonidos);