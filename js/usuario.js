// usuario.js

// =====================================================
// 🔧 IMPORTACIONES
// =====================================================
import { mostrarPantalla } from './utils.js';
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Inicializar Firestore usando la app ya inicializada en index.html
const db = getFirestore();

// =====================================================
// 👤 SISTEMA DE PERFIL Y NIVELES (Movido desde main.js)
// =====================================================
function calcularNivel(puntosTotales) {
  const niveles = [
    { nombre: "Novato", puntosRequeridos: 0, color: "#6B7280" },
    { nombre: "Aprendiz", puntosRequeridos: 100, color: "#10B981" },
    { nombre: "Experto", puntosRequeridos: 500, color: "#3B82F6" },
    { nombre: "Maestro", puntosRequeridos: 1000, color: "#8B5CF6" },
    { nombre: "Leyenda", puntosRequeridos: 2500, color: "#F59E0B" }
  ];
  
  for (let i = niveles.length - 1; i >= 0; i--) {
    if (puntosTotales >= niveles[i].puntosRequeridos) {
      return niveles[i];
    }
  }
  return niveles[0];
}

function obtenerProgresoNivel(puntosTotales) {
  const nivelActual = calcularNivel(puntosTotales);
  const niveles = [
    { nombre: "Novato", puntosRequeridos: 0, color: "#6B7280" },
    { nombre: "Aprendiz", puntosRequeridos: 100, color: "#10B981" },
    { nombre: "Experto", puntosRequeridos: 500, color: "#3B82F6" },
    { nombre: "Maestro", puntosRequeridos: 1000, color: "#8B5CF6" },
    { nombre: "Leyenda", puntosRequeridos: 2500, color: "#F59E0B" }
  ];
  
  const nivelIndex = niveles.findIndex(n => n.nombre === nivelActual.nombre);
  const siguienteNivel = niveles[nivelIndex + 1];
  
  if (!siguienteNivel) {
    return { progreso: 100, restante: 0, nivelSiguiente: 'Máximo' };
  }
  
  const rango = siguienteNivel.puntosRequeridos - nivelActual.puntosRequeridos;
  const progreso = ((puntosTotales - nivelActual.puntosRequeridos) / rango) * 100;
  const restante = siguienteNivel.puntosRequeridos - puntosTotales;
  
  return { progreso: Math.min(100, Math.max(0, progreso)), restante, nivelSiguiente: siguienteNivel.nombre };
}

// Helper para obtener estadísticas de localStorage
function obtenerEstadisticasUsuario() {
  const usuario = localStorage.getItem('usuarioQuiz') || 'Invitado';
  const stats = JSON.parse(localStorage.getItem(`stats_${usuario}`) || '{}');
  
  // Asegurar que existan los campos mínimos (necesarios para que no falle el modal)
  return {
    puntosTotales: stats.puntosTotales || 0,
    partidasCompletadas: stats.partidasCompletadas || 0,
    partidasPerfectas: stats.partidasPerfectas || 0,
    rachaMaxima: stats.rachaMaxima || 0,
    categoriasCompletadas: stats.categoriasCompletadas ? Object.keys(stats.categoriasCompletadas).length : 0,
    ...stats
  };
}


// =====================================================
// 🧍 INICIALIZAR USUARIO
// =====================================================
export function initUsuario() {
  const nombre = localStorage.getItem('usuarioQuiz');
  const dificultad = localStorage.getItem('dificultadQuiz');

  // Mostrar pantalla de bienvenida siempre
  mostrarPantalla('pantallaBienvenida');

  // Después de 2.5 segundos, transición a lo siguiente
  setTimeout(() => {
    const bienvenida = document.getElementById('pantallaBienvenida');
    if (bienvenida) bienvenida.classList.add('fadeOut');

    setTimeout(() => {
      if (nombre) {
        // Si ya hay usuario, ir al menú
        console.log("Usuario actual:", nombre);
        mostrarPantalla('pantallaMenu');
      } else {
        // Si no hay usuario, ir a escribir el nombre
        console.log("Usuario invitado");
        mostrarPantalla('pantallaInicio');
      }
    }, 1000);
  }, 2500);

  // Mostrar datos en interfaz si existen
  const nombreSpan = document.getElementById('nombreUsuario');
  if (nombreSpan && nombre) nombreSpan.textContent = nombre;

  const difSpan = document.getElementById('dificultadSeleccionada');
  if (difSpan && dificultad) difSpan.textContent = dificultad;
}

// =====================================================
// 💾 GUARDAR NOMBRE DEL USUARIO
// =====================================================
export function guardarNombre() {
  const input = document.getElementById('nombreUsuario');
  if (!input) return;

  const nombre = input.value.trim();
  if (!nombre) {
    alert('Por favor, escribe tu nombre.');
    return;
  }

  localStorage.setItem('usuarioQuiz', nombre);
  mostrarPantalla('pantallaComenzar');
}

// =====================================================
// 🎯 SELECCIONAR DIFICULTAD
// =====================================================
export function seleccionarDificultad(nivel) {
  localStorage.setItem('dificultadQuiz', nivel);
  mostrarPantalla('pantallaMenu');
}


// Guardar puntuación en Firebase automáticamente
export async function guardarPuntuacionFirebase(categoria, puntos) {
  try {
    const usuario = localStorage.getItem('usuarioQuiz') || "Invitado";
    const dificultad = localStorage.getItem('dificultadQuiz') || 'facil';
    await addDoc(collection(db, "puntuaciones"), {
      usuario,
      categoria,
      puntos,
      dificultad,
      fecha: new Date().toISOString()
    });

    console.log(`✅ Puntuación de ${usuario} en ${categoria} guardada correctamente`);
  } catch (e) {
    console.error("Error al guardar puntuación:", e);
  }
}

// =====================================================
// 🖼️ GESTIÓN DE AVATAR
// =====================================================
const avatares = [
  'avatars/avatar1.png',
  'avatars/avatar2.png',
  'avatars/avatar3.png',
  'avatars/avatar4.png',
  'avatars/avatar5.png', 
  'avatars/avatar6.png',
  'avatars/avatar7.png',
  'avatars/avatar8.png',
  'avatars/avatar9.png',
  'avatars/avatar10.png',
  'avatars/avatar11.png',
  'avatars/avatar12.png'
];

let avatarSeleccionado = null;

export function mostrarGaleriaAvatares() {
  const galeria = document.getElementById('galeriaAvatares');
  galeria.innerHTML = '';
  avatares.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.classList.add('avatar');
    img.onclick = () => seleccionarAvatar(img);
    galeria.appendChild(img);
  });
}

export function seleccionarAvatar(imgEl) {
  document.querySelectorAll('#galeriaAvatares img').forEach(i => i.classList.remove('seleccionado'));
  imgEl.classList.add('seleccionado');
  avatarSeleccionado = imgEl.src;
}

export function guardarAvatar() {
  if (!avatarSeleccionado) return alert("Selecciona un avatar.");
  localStorage.setItem('avatarUsuario', avatarSeleccionado);
  actualizarAvatarUI();
  cerrarAvatarModal();
}

export function actualizarAvatarUI() {
  const imgPerfil = document.getElementById('imgPerfil');
  const avatar = localStorage.getItem('avatarUsuario');
  if (imgPerfil && avatar) imgPerfil.src = avatar;
}

export function abrirAvatarModal() {
  mostrarGaleriaAvatares();
  document.getElementById('avatarModal').classList.remove('oculto');
}

export function cerrarAvatarModal() {
  document.getElementById('avatarModal').classList.add('oculto');
}

// =====================================================
// 👤 GESTIÓN DE MODAL DE PERFIL (SOLUCIÓN AL PROBLEMA)
// =====================================================

export function abrirPerfilModal() {
    const modal = document.getElementById('perfilModal');
    if (!modal) return;

    const usuario = localStorage.getItem('usuarioQuiz') || 'Invitado';
    const stats = obtenerEstadisticasUsuario(); // Usamos el helper local

    // --- CÁLCULOS DE NIVEL ---
    const nivelActual = calcularNivel(stats.puntosTotales);
    const progreso = obtenerProgresoNivel(stats.puntosTotales);
    
    // --- ACTUALIZACIÓN DE DATOS DEL MODAL ---
    
    // Header
    document.getElementById('nombrePerfil').textContent = usuario;
    document.getElementById('avatarPerfil').src = localStorage.getItem('avatarUsuario') || 'avatars/avatar0.png';

    // Nivel
    const nivelBadge = document.getElementById('nivelActual');
    nivelBadge.textContent = nivelActual.nombre;
    nivelBadge.style.backgroundColor = nivelActual.color; // Opcional: aplicar el color
    
    document.getElementById('puntosTotales').textContent = `${stats.puntosTotales} puntos totales`;

    // Stats Grid
    document.getElementById('statPartidas').textContent = stats.partidasCompletadas;
    document.getElementById('statPerfectas').textContent = stats.partidasPerfectas;
    document.getElementById('statRacha').textContent = stats.rachaMaxima;
    document.getElementById('statCategorias').textContent = stats.categoriasCompletadas;
    
    // Progreso
    document.getElementById('infoNivel').textContent = `Nivel: ${nivelActual.nombre}`;
    document.getElementById('barraProgreso').style.width = `${progreso.progreso}%`;

    const infoProximoNivel = document.getElementById('infoProximoNivel');
    if (progreso.nivelSiguiente === 'Máximo') {
        infoProximoNivel.textContent = '¡Nivel máximo alcanzado! 🏆';
    } else {
        infoProximoNivel.textContent = `${progreso.restante} puntos para el siguiente nivel (${progreso.nivelSiguiente})`;
    }

    // Mostrar el modal
    modal.classList.remove('hidden');
}

export function cerrarPerfilModal() {
    const modal = document.getElementById('perfilModal');
    if(modal) modal.classList.add('hidden');
}