// partida.js
import { CONFIG } from './config.js';
import { mostrarPantalla, shuffle, guardarLogro } from './utils.js';
import { guardarPuntuacionFirebase } from './usuario.js';
// IMPORTANTE: Usamos la misma URL que en index.html para evitar conflictos
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Enganchamos con la base de datos que ya inició el index.html
const db = getFirestore();

// =====================================================
// ⚙️ ESTADO DE PARTIDA
// =====================================================
let categoria = "";
let preguntasPartida = [];
let preguntaIndex = 0;
let puntos = 0;
let racha = 0;
let temporizadorId = null;
let tiempoRestante = 0;
let rachaMaxima = 0;

// 📦 CACHÉ: Para no descargar las mismas preguntas dos veces en la misma sesión
let cachePreguntas = {};

// =====================================================
// 🔍 HELPERS
// =====================================================
function getUsuario() {
  return localStorage.getItem('usuarioQuiz') || 'Invitado';
}

function getDificultad() {
  return localStorage.getItem('dificultadQuiz') || 'facil';
}

// =====================================================
// 📊 ESTADÍSTICAS Y NIVELES (Lógica interna)
// =====================================================
function actualizarEstadisticasUsuario(resultadoPartida) {
  const usuario = getUsuario();
  const stats = JSON.parse(localStorage.getItem(`stats_${usuario}`) || '{}');
  
  // Estadísticas básicas
  stats.partidasCompletadas = (stats.partidasCompletadas || 0) + 1;
  stats.puntosTotales = (stats.puntosTotales || 0) + resultadoPartida.puntos;
  stats.rachaMaxima = Math.max(stats.rachaMaxima || 0, resultadoPartida.rachaMaxima || 0);
  
  // Partidas perfectas
  const totalPreguntas = resultadoPartida.totalPreguntas || 10;
  const aciertos = Math.round(resultadoPartida.puntos / (resultadoPartida.dificultad === 'facil' ? 10 : 30));
  if (aciertos === totalPreguntas) {
    stats.partidasPerfectas = (stats.partidasPerfectas || 0) + 1;
  }
  
  // Categorías completadas
  if (!stats.categoriasCompletadas) stats.categoriasCompletadas = {};
  if (!stats.categoriasCompletadas[resultadoPartida.categoria]) {
    stats.categoriasCompletadas[resultadoPartida.categoria] = 0;
  }
  stats.categoriasCompletadas[resultadoPartida.categoria]++;
  
  // Categorías en difícil
  if (resultadoPartida.dificultad === 'dificil') {
    stats.categoriasDificil = (stats.categoriasDificil || 0) + 1;
  }
  
  localStorage.setItem(`stats_${usuario}`, JSON.stringify(stats));
  return stats;
}

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
    return { progreso: 100, restante: 0 };
  }
  
  const rango = siguienteNivel.puntosRequeridos - nivelActual.puntosRequeridos;
  const progreso = ((puntosTotales - nivelActual.puntosRequeridos) / rango) * 100;
  const restante = siguienteNivel.puntosRequeridos - puntosTotales;
  
  return { progreso: Math.min(100, Math.max(0, progreso)), restante };
}

/* =====================================================
🎯 SELECCIONAR CATEGORÍA
===================================================== */
export function seleccionarCategoria(cat) {
  categoria = cat;

  const modal = document.getElementById('modalDificultad');
  const titulo = document.getElementById('tituloCategoriaModal');
  const btnFacil = document.getElementById('btnFacil');
  const btnDificil = document.getElementById('btnDificil');
  const cerrarModal = document.getElementById('cerrarModal');

  if (!modal || !titulo || !btnFacil || !btnDificil || !cerrarModal) {
    console.warn("Modal no encontrado, iniciando directo.");
    iniciarPartida();
    return;
  }

  titulo.textContent = `Categoría: ${cat}`;
  modal.classList.remove('oculto');

  const desbloqueado = localStorage.getItem(`dificultad_${cat}`) === 'dificil';
  btnDificil.disabled = !desbloqueado;
  btnDificil.innerHTML = desbloqueado ? 'Difícil' : 'Difícil 🔒';

  btnFacil.onclick = () => {
    localStorage.setItem('dificultadQuiz', 'facil');
    modal.classList.add('oculto');
    iniciarPartida();
  };

  btnDificil.onclick = () => {
    if (!btnDificil.disabled) {
      localStorage.setItem('dificultadQuiz', 'dificil');
      modal.classList.add('oculto');
      iniciarPartida();
    }
  };

  cerrarModal.onclick = () => modal.classList.add('oculto');
}

/* =====================================================
☁️ DESCARGAR PREGUNTAS
===================================================== */
async function cargarPreguntas(categoria, dificultad) {
  const clave = `${dificultad}_${categoria}`;
  
  // 1. Mirar en caché primero
  if (cachePreguntas[clave]) {
    console.log("📦 Usando caché local para", clave);
    return cachePreguntas[clave];
  }

  // 2. Descargar de Firebase
  console.log(`☁️ Descargando preguntas de ${categoria} (${dificultad})...`);
  
  try {
    const q = query(
      collection(db, "preguntas"),
      where("categoria", "==", categoria),
      where("dificultad", "==", dificultad)
    );

    const snapshot = await getDocs(q);
    const lista = [];
    
    snapshot.forEach(doc => {
      lista.push(doc.data());
    });

    // 3. Guardar en caché si encontramos algo
    if (lista.length > 0) {
      cachePreguntas[clave] = lista;
      return lista;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error descargando preguntas:", error);
    return null; // Retornamos null para indicar error de conexión
  }
}

/* =====================================================
🎮 INICIAR PARTIDA 
===================================================== */
export async function iniciarPartida() {
  const dificultad = getDificultad();
  
  // 1. Mostrar pantalla de carga
  mostrarPantalla('pantallaCarga'); 

  // 2. Esperar descarga de preguntas
  const todas = await cargarPreguntas(categoria, dificultad);

  // 3. Validaciones
  if (todas === null) {
    alert("Error de conexión. Revisa tu internet.");
    mostrarPantalla('pantallaMenu');
    return;
  }

  if (todas.length === 0) {
    alert(`No hay preguntas disponibles en la nube para ${categoria}.`);
    mostrarPantalla('pantallaMenu');
    return;
  }

  // 4. Configuración del juego (igual que antes)
  const cfg = CONFIG[dificultad] || CONFIG.facil;
  
  preguntasPartida = shuffle(todas).slice(0, cfg.perGame).map(q => ({
    ...q,
    opciones: shuffle(Array.isArray(q.opciones) ? q.opciones.slice() : [])
  }));

  preguntaIndex = 0;
  puntos = 0;
  racha = 0;
  rachaMaxima = 0;

  const catEl = document.getElementById('categoriaActual');
  if (catEl)
    catEl.textContent = `${categoria} — ${dificultad === 'facil' ? 'Fácil' : 'Difícil'}`;

  mostrarPantalla('pantallaPreguntas');
  mostrarPregunta();
}

/* =====================================================
❓ MOSTRAR PREGUNTA
===================================================== */
function mostrarPregunta() {
  clearInterval(temporizadorId);

  const msg = document.getElementById('mensaje');
  if (msg) msg.textContent = "";

  if (preguntaIndex >= preguntasPartida.length) {
    finalizarPartida();
    return;
  }

  const q = preguntasPartida[preguntaIndex];
  const texto = document.getElementById('preguntaTexto');
  if (texto)
    texto.textContent = `Pregunta ${preguntaIndex + 1} / ${preguntasPartida.length}: ${q.pregunta}`;

  const opcionesDiv = document.getElementById('opciones');
  if (!opcionesDiv) return;

  opcionesDiv.innerHTML = '';
  (q.opciones || []).forEach(op => {
    const btn = document.createElement('button');
    btn.className = 'opcion';
    btn.textContent = op;
    btn.onclick = () => seleccionarRespuesta(op, btn);
    opcionesDiv.appendChild(btn);
  });

  const dificultad = getDificultad();
  iniciarTemporizador(CONFIG[dificultad].timePerQuestion);
}

/* =====================================================
⏰ TEMPORIZADOR
===================================================== */
function iniciarTemporizador(segundos) {
  tiempoRestante = segundos;
  const timerEl = document.getElementById('timer');
  if (timerEl) timerEl.textContent = `⏰ ${tiempoRestante}s`;

  clearInterval(temporizadorId);
  temporizadorId = setInterval(() => {
    tiempoRestante--;
    if (timerEl) timerEl.textContent = `⏰ ${tiempoRestante}s`;
    if (tiempoRestante <= 0) {
      clearInterval(temporizadorId);
      manejarTiempoAgotado();
    }
  }, 1000);
}

function manejarTiempoAgotado() {
  document.querySelectorAll('.opcion').forEach(b => b.disabled = true);
  const msg = document.getElementById('mensaje');
  if (msg) msg.textContent = "¡Tiempo agotado!";
  
  const correcta = preguntasPartida[preguntaIndex]?.correcta;
  document.querySelectorAll('.opcion').forEach(b => {
    if (b.textContent === correcta) b.classList.add('correcta');
  });
  
  racha = 0;
  setTimeout(() => {
    preguntaIndex++;
    mostrarPregunta();
  }, 1400);
}

/* =====================================================
✅ RESPONDER
===================================================== */
function seleccionarRespuesta(opcion, boton) {
  clearInterval(temporizadorId);
  const q = preguntasPartida[preguntaIndex];
  if (!q) return;

  document.querySelectorAll('.opcion').forEach(b => b.disabled = true);

  const dificultad = getDificultad();

  if (opcion === q.correcta) {
    boton.classList.add('correcta');
    puntos += (dificultad === 'facil') ? 10 : 30;
    racha++;
    rachaMaxima = Math.max(rachaMaxima, racha);
    
    if (racha === 2) puntos += 5;
    else if (racha === 3) puntos += 10;
    else if (racha >= 4) puntos += 15;
  } else {
    boton.classList.add('incorrecta');
    document.querySelectorAll('.opcion').forEach(b => {
      if (b.textContent === q.correcta) b.classList.add('correcta');
    });
    racha = 0;
  }

  setTimeout(() => {
    preguntaIndex++;
    if (preguntaIndex >= preguntasPartida.length) finalizarPartida();
    else mostrarPregunta();
  }, 1200);
}

/* =====================================================
🏁 FINALIZAR PARTIDA
===================================================== */
function finalizarPartida() {
  console.log("Finalizando partida...");
  clearInterval(temporizadorId);

  const usuario = getUsuario();
  const dificultad = getDificultad();
  
  // Guardar logro local
  guardarLogro(usuario, categoria, dificultad, puntos);

  // Actualizar estadísticas
  const resultadoPartida = {
    categoria,
    dificultad,
    puntos,
    totalPreguntas: preguntasPartida.length,
    rachaMaxima: rachaMaxima
  };
  
  const stats = actualizarEstadisticasUsuario(resultadoPartida);
  const nivel = calcularNivel(stats.puntosTotales);
  const { progreso, restante } = obtenerProgresoNivel(stats.puntosTotales);

  // Mostrar resultado en pantalla final
  const resultadoDiv = document.getElementById("resultado");
  if (resultadoDiv) {
    resultadoDiv.innerHTML = `
      <div class="resultado-box animate-fadeIn">
        <h2>🎯 ¡Partida terminada!</h2>
        <p><strong>${usuario}</strong>, completaste <strong>${categoria}</strong>
        en <strong>${dificultad}</strong> con <strong>${puntos}</strong> puntos.</p>
        
        <div class="nivel-info">
          <h3>Nivel: <span style="color: ${nivel.color}">${nivel.nombre}</span></h3>
          <div class="barra-progreso">
            <div class="progreso" style="width: ${progreso}%"></div>
          </div>
          <p class="muted">${restante > 0 ? `${restante} puntos para el siguiente nivel` : '¡Nivel máximo alcanzado!'}</p>
        </div>
      </div>
    `;
  }

  // Guardar puntuación en Firebase
  guardarPuntuacionFirebase(categoria, puntos);

  // Verificar desbloqueo de dificultad difícil
  verificarDesbloqueo();

  setTimeout(() => {
    mostrarPantalla('pantallaFinal');
  }, 500);
}

/* =====================================================
🔓 VERIFICAR DESBLOQUEO
===================================================== */
function verificarDesbloqueo() {
  const dificultad = getDificultad();
  if (dificultad !== 'facil') return;

  const totalPreguntas = preguntasPartida.length;
  const aciertos = Math.round(puntos / 10); // Aprox, asumiendo sin bonos de racha para simplificar
  
  // Si queremos ser más precisos con los aciertos, podríamos contarlos en seleccionarRespuesta
  // Pero para desbloquear, >50% de los puntos máximos posibles suele valer.
  // Usemos un cálculo simple: si tienes más de la mitad de puntos base (10 * preguntas / 2)
  
  const puntosBase = totalPreguntas * 10;
  if (puntos >= (puntosBase / 2)) {
    localStorage.setItem(`dificultad_${categoria}`, 'dificil');

    const modal = document.getElementById('modalDesbloqueo');
    const usuarioSpan = document.getElementById('usuarioDesbloqueo');
    if (modal && usuarioSpan) {
      usuarioSpan.textContent = getUsuario();
      modal.classList.remove('hidden');
      crearConfeti(modal);
    }
  }
}

/* =====================================================
🔁 REPETIR Y VOLVER AL MENÚ
===================================================== */
export function repetirPartida() {
  if (!categoria) {
    mostrarPantalla('pantallaMenu');
    return;
  }
  iniciarPartida();
}

export function volverMenu() {
  clearInterval(temporizadorId);
  categoria = "";
  preguntasPartida = [];
  preguntaIndex = 0;
  puntos = 0;
  racha = 0;
  rachaMaxima = 0;
  mostrarPantalla('pantallaMenu');
}

/* =====================================================
🎊 CONFETI
===================================================== */
function crearConfeti(container) {
  const cantidad = 25;
  for (let i = 0; i < cantidad; i++) {
    const confeti = document.createElement('div');
    confeti.classList.add('confeti');
    confeti.style.left = Math.random() * 100 + '%';
    confeti.style.animationDelay = Math.random() * 2 + 's';
    confeti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 60%)`;
    container.appendChild(confeti);
    setTimeout(() => confeti.remove(), 4000);
  }
}

// Listener para cerrar modal de desbloqueo
document.addEventListener('DOMContentLoaded', () => {
  const btnCerrarDesbloqueo = document.getElementById('btnCerrarDesbloqueo');
  if (btnCerrarDesbloqueo) {
    btnCerrarDesbloqueo.addEventListener('click', () => {
      const modal = document.getElementById('modalDesbloqueo');
      if (modal) modal.classList.add('hidden');
      mostrarPantalla('pantallaMenu');
    });
  }
});