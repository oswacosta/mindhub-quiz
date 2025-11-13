// usuario.js

// =====================================================
// 🔧 IMPORTACIONES
// =====================================================
import { mostrarPantalla } from './utils.js';
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Inicializar Firestore usando la app ya inicializada en index.html
const db = getFirestore();

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

// Avatar
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

