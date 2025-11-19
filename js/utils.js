// utils.js (versión robusta)

export function mostrarPantalla(id) {
  document.querySelectorAll('.pantalla').forEach(el => {
    el.classList.remove('activa');
    el.style.display = "none";
  });

  const pantallaActiva = document.getElementById(id);
  if (!pantallaActiva) return;
  pantallaActiva.style.display = "block";
  void pantallaActiva.offsetWidth;
  pantallaActiva.classList.add('activa');
}

export function shuffle(arr) {
  // Fisher-Yates mejor que sort()
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// =====================================================
// 🏆 GUARDAR LOGRO
// =====================================================
export function guardarLogro(usuario, categoria, dificultad, puntos) {
  try {
    const records = JSON.parse(localStorage.getItem('logrosQuiz') || '{}');
    if (!records[usuario]) records[usuario] = {};
    if (!records[usuario][dificultad]) records[usuario][dificultad] = {};
    const prev = records[usuario][dificultad][categoria] || 0;
    if (puntos > prev) records[usuario][dificultad][categoria] = puntos;
    localStorage.setItem('logrosQuiz', JSON.stringify(records));
  } catch (e) {
    console.error("guardarLogro error:", e);
  }
}

// =====================================================
// 📊 MOSTRAR LOGROS
// =====================================================
export function mostrarLogros() {
  try {
    const modal = document.getElementById('logrosModal');
    const nombreSpan = document.getElementById('nombreUsuarioLogros');
    const tabla = document.getElementById('tablaLogros');
    const usuarioActual = localStorage.getItem('usuarioQuiz') || 'Invitado';

    if (nombreSpan) nombreSpan.textContent = usuarioActual;
    if (!modal || !tabla) {
      console.warn("mostrarLogros: faltan elementos DOM (logrosModal/tablaLogros).");
      if (modal) modal.classList.remove('hidden');
      return;
    }

    // Leer todos los logros guardados
    const records = JSON.parse(localStorage.getItem('logrosQuiz') || '{}');
    const usuarioData = records[usuarioActual] || {};

    // Determinar dificultad activa dentro del modal por la clase .activo en los botones
    let dificultadActual = 'facil';
    const btnFacil = document.getElementById('btnFacilLogros');
    const btnDificil = document.getElementById('btnDificilLogros');
    if (btnDificil && btnDificil.classList.contains('activo')) dificultadActual = 'dificil';
    else if (btnFacil && btnFacil.classList.contains('activo')) dificultadActual = 'facil';

    const logros = usuarioData[dificultadActual] || {};

    // Mostrar mensaje si no hay logros
    if (Object.keys(logros).length === 0) {
      tabla.innerHTML = `<p class="muted">Aún no tienes logros en esta dificultad.</p>`;
    } else {
      // Construir tabla de resultados (orden sencillo alfabético de categorías)
      const filas = Object.entries(logros)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([categoria, pts]) => `<tr><td>${categoria}</td><td>${pts}</td></tr>`)
        .join('');

      tabla.innerHTML = `
        <div class="tabla-logros">
          <table>
            <thead><tr><th>Categoría</th><th>Puntuación</th></tr></thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
      `;
    }

    modal.classList.remove('hidden');
  } catch (err) {
    console.error("mostrarLogros error:", err);
  }
}

// =====================================================
// ❌ CERRAR MODAL DE LOGROS
// =====================================================
export function cerrarLogros() {
  const modal = document.getElementById('logrosModal');
  if (modal) modal.classList.add('hidden');
}

// =====================================================
// 🧭 EVENTOS DE BOTONES DEL MODAL (robusto)
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  try {
    const btnCerrar = document.getElementById('cerrarLogros');
    const btnFacil = document.getElementById('btnFacilLogros');
    const btnDificil = document.getElementById('btnDificilLogros');
    const btnLogros = document.getElementById('btnLogros');

    if (btnCerrar) {
      btnCerrar.addEventListener('click', cerrarLogros);
    }

    if (btnFacil && btnDificil) {
      btnFacil.addEventListener('click', () => {
        reproducirClick(); // 🔥 AÑADIDO
        btnFacil.classList.add('activo');
        btnDificil.classList.remove('activo');
        mostrarLogros();
      });
      btnDificil.addEventListener('click', () => {
        reproducirClick(); // 🔥 AÑADIDO
        btnDificil.classList.add('activo');
        btnFacil.classList.remove('activo');
        mostrarLogros();
      });
    }

    // Abrir el modal de logros con el botón principal
    if (btnLogros) {
      btnLogros.addEventListener('click', () => {
        // dejar 'Fácil' por defecto si no hay clase
        if (btnFacil && !btnDificil.classList.contains('activo')) {
          btnFacil.classList.add('activo');
          btnDificil.classList.remove('activo');
        }
        mostrarLogros();
      });
    }
  } catch (err) {
    console.error("utils DOMContentLoaded handler error:", err);
  }
});
