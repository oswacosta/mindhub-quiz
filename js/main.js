// main.js
import { seleccionarCategoria, repetirPartida, volverMenu } from './partida.js';
import { initUsuario } from './usuario.js';
import { mostrarLogros, cerrarLogros, cargarPuntuaciones } from './logros.js';

// =====================================================
// 👤 SISTEMA DE PERFIL
// =====================================================

import { calcularNivel, obtenerProgresoNivel } from './niveles.js';

function obtenerEstadisticasUsuario() {
  const usuario = localStorage.getItem('usuarioQuiz') || 'Invitado';
  const stats = JSON.parse(localStorage.getItem(`stats_${usuario}`) || '{}');
  
  return {
    partidasCompletadas: stats.partidasCompletadas || 0,
    partidasPerfectas: stats.partidasPerfectas || 0,
    puntosTotales: stats.puntosTotales || 0,
    rachaMaxima: stats.rachaMaxima || 0,
    categoriasCompletadas: stats.categoriasCompletadas || {},
    categoriasDificil: stats.categoriasDificil || 0,
    ...stats
  };
}

function mostrarPerfil() {
  const modal = document.getElementById('perfilModal');
  const stats = obtenerEstadisticasUsuario();
  const nivel = calcularNivel(stats.puntosTotales);
  const { progreso, restante } = obtenerProgresoNivel(stats.puntosTotales);
  
  // Actualizar información básica
  document.getElementById('nombrePerfil').textContent = localStorage.getItem('usuarioQuiz') || 'Invitado';
  document.getElementById('nivelActual').textContent = nivel.nombre;
  document.getElementById('nivelActual').style.color = nivel.color;
  document.getElementById('puntosTotales').textContent = `${stats.puntosTotales} puntos totales`;
  
  // Actualizar estadísticas
  document.getElementById('statPartidas').textContent = stats.partidasCompletadas;
  document.getElementById('statPerfectas').textContent = stats.partidasPerfectas;
  document.getElementById('statRacha').textContent = stats.rachaMaxima;
  document.getElementById('statCategorias').textContent = Object.keys(stats.categoriasCompletadas || {}).length;
  
  // Actualizar barra de progreso
  document.getElementById('barraProgreso').style.width = `${progreso}%`;
  document.getElementById('infoNivel').textContent = `Nivel: ${nivel.nombre}`;
  document.getElementById('infoProximoNivel').textContent = 
    restante > 0 ? `${restante} puntos para el siguiente nivel` : '¡Nivel máximo alcanzado!';
  
  // Actualizar avatar
  const avatar = localStorage.getItem('avatarUsuario');
  if (avatar) {
    document.getElementById('avatarPerfil').src = avatar;
    document.getElementById('avatarPerfil').style.display = 'block';
  }
  
  // Prevenir scroll del body
  document.body.classList.add('modal-open');
  
  modal.classList.remove('hidden');
  
  // Scroll al inicio del modal
  modal.scrollTop = 0;
}

// =====================================================
// 🎯 INICIALIZACIÓN
// =====================================================

// Botón de logros
window.addEventListener('DOMContentLoaded', () => {
  const btnLogros = document.getElementById('btnLogros');
  if (btnLogros) btnLogros.onclick = mostrarLogros;

  const btnCerrarLogros = document.getElementById('cerrarLogros');
  if (btnCerrarLogros) btnCerrarLogros.onclick = cerrarLogros;

  const btnFacil = document.getElementById('btnFacilLogros');
  const btnDificil = document.getElementById('btnDificilLogros');


if (btnFacil && btnDificil) {
  btnFacil.onclick = () => {
    btnFacil.classList.add('activo');
    btnDificil.classList.remove('activo');
    cargarPuntuaciones('facil', 10); // 🔥 Añade el límite
  };
  btnDificil.onclick = () => {
    btnDificil.classList.add('activo');
    btnFacil.classList.remove('activo');
    cargarPuntuaciones('dificil', 10); // 🔥 Añade el límite
  };
}

  // Botón de perfil
  const btnPerfil = document.getElementById('btnPerfil');
  if (btnPerfil) btnPerfil.onclick = mostrarPerfil;
  
  const btnCerrarPerfil = document.getElementById('cerrarPerfil');
if (btnCerrarPerfil) btnCerrarPerfil.onclick = () => {
  document.getElementById('perfilModal').classList.add('hidden');
  document.body.classList.remove('modal-open');
  };

  // Explicación de puntos
  const btnPuntos = document.getElementById('btnPuntos');
  const explicacionPuntos = document.getElementById('explicacionPuntos');

  if (btnPuntos && explicacionPuntos) {
    btnPuntos.addEventListener('click', () => {
      explicacionPuntos.classList.toggle('oculto');
    });
  }
});

// Exponer funciones globales para HTML
window.guardarNombre = () => import('./usuario.js').then(m => m.guardarNombre());
window.seleccionarDificultad = nivel => import('./usuario.js').then(m => m.seleccionarDificultad(nivel));
window.seleccionarCategoria = cat => seleccionarCategoria(cat);
window.repetirPartida = () => repetirPartida();
window.volverMenu = () => volverMenu();

// Inicialización al cargar
window.addEventListener('load', () => {
  initUsuario();
  
  // Actualizamos el label del menú principal
  const nombreUsuario = localStorage.getItem('usuarioQuiz') || 'Invitado';
  const label = document.getElementById('labelUsuario');
  if (label) label.textContent = nombreUsuario;
  
  // Actualizamos el avatar
  import('./usuario.js').then(m => m.actualizarAvatarUI());
});

// Agrega el evento para el botón guardar avatar
window.addEventListener('DOMContentLoaded', () => {
  const btnGuardarAvatar = document.getElementById('guardarAvatar');
  if (btnGuardarAvatar) {
    btnGuardarAvatar.onclick = () => import('./usuario.js').then(m => m.guardarAvatar());
  }
});

// Exponer funciones de avatar
window.abrirAvatarModal = () => import('./usuario.js').then(m => m.abrirAvatarModal());
window.cerrarAvatarModal = () => import('./usuario.js').then(m => m.cerrarAvatarModal());
window.seleccionarAvatar = (img) => import('./usuario.js').then(m => m.seleccionarAvatar(img));
window.guardarAvatar = () => import('./usuario.js').then(m => m.guardarAvatar());