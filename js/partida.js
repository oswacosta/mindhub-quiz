// partida.js
import { CONFIG } from './config.js';
import { bancoPreguntas } from './bancoPreguntas.js';
import { mostrarPantalla, shuffle, guardarLogro } from './utils.js';
import { guardarPuntuacionFirebase } from './usuario.js';

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
// 🎯 SISTEMA DE ESTADÍSTICAS Y NIVELES
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

// En main.js y partida.js
import { calcularNivel, obtenerProgresoNivel } from './niveles.js';

/* =====================================================
🎯 SELECCIONAR CATEGORÍA E INICIAR PARTIDA
===================================================== */
export function seleccionarCategoria(cat) {
  categoria = cat;

  const modal = document.getElementById('modalDificultad');
  const titulo = document.getElementById('tituloCategoriaModal');
  const btnFacil = document.getElementById('btnFacil');
  const btnDificil = document.getElementById('btnDificil');
  const cerrarModal = document.getElementById('cerrarModal');

  if (!modal || !titulo || !btnFacil || !btnDificil || !cerrarModal) {
    console.warn("Modal de dificultad no encontrado. Se inicia partida directa.");
    iniciarPartida();
    return;
  }

  // Actualizar título
  titulo.textContent = `Categoría: ${cat}`;
  modal.classList.remove('oculto');

  // Verificar si la dificultad difícil está desbloqueada
  const desbloqueado = localStorage.getItem(`dificultad_${cat}`) === 'dificil';
  btnDificil.disabled = !desbloqueado;
  btnDificil.innerHTML = desbloqueado ? 'Difícil' : 'Difícil 🔒';

  // Listeners de selección
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
🎮 INICIAR PARTIDA
===================================================== */
export function iniciarPartida() {
  const dificultad = getDificultad();
  const todas = (bancoPreguntas[dificultad] && bancoPreguntas[dificultad][categoria])
    ? bancoPreguntas[dificultad][categoria]
    : [];

  if (!Array.isArray(todas) || todas.length === 0) {
    alert("No hay preguntas disponibles para esta categoría/dificultad. Añade preguntas al banco.");
    return;
  }

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
  if (!opcionesDiv) {
    console.error("mostrarPregunta: no existe #opciones en el DOM");
    return;
  }

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
  if (!q) return console.warn("seleccionarRespuesta: pregunta no encontrada", preguntaIndex);

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
🏁 FINALIZAR PARTIDA (CORREGIDA)
===================================================== */
function finalizarPartida() {
  console.log("Finalizando partida...");
  clearInterval(temporizadorId);

  const usuario = getUsuario();
  const dificultad = getDificultad();
  
  // Guardar logro
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

  // Verificar y desbloquear dificultad difícil
  verificarDesbloqueo();

  // Mostrar pantalla final
  setTimeout(() => {
    mostrarPantalla('pantallaFinal');
    console.log("Pantalla final mostrada");
  }, 500);
}

/* =====================================================
🔓 VERIFICAR DESBLOQUEO
===================================================== */
function verificarDesbloqueo() {
  const dificultad = getDificultad();
  if (dificultad !== 'facil') return;

  const totalPreguntas = preguntasPartida.length;
  const aciertos = Math.round(puntos / 10);
  const porcentaje = (aciertos / totalPreguntas) * 100;

  if (porcentaje >= 50) {
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
    console.warn("No hay categoría seleccionada. Volviendo al menú principal.");
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

/* =====================================================
🎯 CERRAR MODAL DE DESBLOQUEO
===================================================== */
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