// main.js
import { seleccionarCategoria, repetirPartida, volverMenu } from './partida.js';
import { initUsuario } from './usuario.js';
// Importar funciones de logros (Logros, Puntos)
import { mostrarLogros, cerrarLogros, cargarPuntuaciones } from './logros.js';
import { reproducirClick } from './sonidos.js'; // 🔥 IMPORTACIÓN ÚNICA DE SONIDO

// =====================================================
// 👤 SISTEMA DE PERFIL (Funciones de niveles)
// >>> NOTA: Las funciones de Nivel (calcularNivel, obtenerProgresoNivel) 
// >>> HAN SIDO MOVIDAS A usuario.js para evitar dependencias circulares.
// =====================================================

// =====================================================
// ⚙️ EXPONER FUNCIONES GLOBALES PARA HTML (con try/catch de seguridad)
// =====================================================

// Funciones de usuario que usan import().then()
window.guardarNombre = () => {
    try { reproducirClick(); } catch(e) {} 
    import('./usuario.js').then(m => m.guardarNombre());
};
window.seleccionarDificultad = nivel => {
    try { reproducirClick(); } catch(e) {}
    import('./usuario.js').then(m => m.seleccionarDificultad(nivel));
};

// Funciones de juego (importadas estáticamente de partida.js)
window.seleccionarCategoria = cat => {
    try { reproducirClick(); } catch(e) {}
    seleccionarCategoria(cat);
};
window.repetirPartida = () => {
    try { reproducirClick(); } catch(e) {}
    repetirPartida();
};
window.volverMenu = () => {
    try { reproducirClick(); } catch(e) {}
    volverMenu();
};

// Botones de Logros (Puntos) (importados estáticamente de logros.js)
window.mostrarLogros = () => {
    try { reproducirClick(); } catch(e) {}
    mostrarLogros(); 
};
window.cerrarLogros = () => {
    try { reproducirClick(); } catch(e) {}
    cerrarLogros();
};
// Botones de Fácil/Difícil dentro del modal de Logros
window.cargarPuntuaciones = (dificultad) => {
    try { reproducirClick(); } catch(e) {}
    cargarPuntuaciones(dificultad);
};

// NUEVA FUNCIÓN: Toggle para la explicación de puntos
window.toggleExplicacionPuntos = () => {
    try { reproducirClick(); } catch(e) {}
    const explicacion = document.getElementById('explicacionPuntos');
    if (explicacion) {
        // Alterna la clase 'oculto' para mostrar/ocultar
        explicacion.classList.toggle('oculto');
    }
};


// Botones de Perfil (Avatar y Stats)
window.abrirAvatarModal = () => {
    try { reproducirClick(); } catch(e) {} 
    import('./usuario.js').then(m => m.abrirAvatarModal());
};
window.cerrarAvatarModal = () => {
    try { reproducirClick(); } catch(e) {}
    import('./usuario.js').then(m => m.cerrarAvatarModal());
};

// Abrir el modal de Perfil/Stats (SOLUCIÓN FINAL: llama a la función en usuario.js)
window.abrirPerfilModal = () => {
    try { reproducirClick(); } catch(e) {} 
    import('./usuario.js').then(m => m.abrirPerfilModal()); 
};
// Cerrar el modal de Perfil/Stats (llama a la función en usuario.js)
window.cerrarPerfilModal = () => {
    try { reproducirClick(); } catch(e) {}
    import('./usuario.js').then(m => m.cerrarPerfilModal());
};


// Inicialización al cargar
window.addEventListener('load', () => {
  initUsuario();
  
  const nombreUsuario = localStorage.getItem('usuarioQuiz') || 'Invitado';
  const label = document.getElementById('labelUsuario');
  if (label) label.textContent = nombreUsuario;
  
  import('./usuario.js').then(m => m.actualizarAvatarUI());
});

// Agrega el evento para el botón guardar avatar
window.addEventListener('DOMContentLoaded', () => {
  const btnGuardarAvatar = document.getElementById('guardarAvatar');
  if (btnGuardarAvatar) {
    btnGuardarAvatar.onclick = () => {
        try { reproducirClick(); } catch(e) {} 
        import('./usuario.js').then(m => m.guardarAvatar());
    };
  }
});