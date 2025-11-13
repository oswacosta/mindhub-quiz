// logros.js
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const db = getFirestore();

// Función para cargar puntuaciones desde Firestore
// logros.js - VERSIÓN MEJORADA
// logros.js - función corregida
export async function cargarPuntuaciones(dificultad = 'facil') {
  try {
    const tabla = document.getElementById('tablaLogros');
    if (!tabla) return;

    tabla.innerHTML = "<p>Cargando puntuaciones...</p>";

    const querySnapshot = await getDocs(collection(db, "puntuaciones"));
    const puntuaciones = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      // Filtrar por dificultad real
      if (data.dificultad === dificultad) {
        puntuaciones.push(data);
      }
    });

    if (puntuaciones.length === 0) {
      tabla.innerHTML = "<p>No hay puntuaciones registradas para esta dificultad.</p>";
      return;
    }

    // 🔥 CAMBIO AQUÍ: Ordenar por puntos descendente y LIMITAR a 10
    puntuaciones.sort((a, b) => b.puntos - a.puntos);
    const top10 = puntuaciones.slice(0, 10); // Solo las 10 mejores

    // Crear tabla HTML con máximo 10 filas
    let html = `<table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Usuario</th>
                      <th>Categoría</th>
                      <th>Puntos</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>`;
    
    top10.forEach((p, index) => {
      html += `<tr>
                <td>${index + 1}</td>
                <td>${p.usuario}</td>
                <td>${p.categoria}</td>
                <td>${p.puntos}</td>
                <td>${new Date(p.fecha).toLocaleDateString()}</td>
              </tr>`;
    });
    
    html += `</tbody></table>`;

    // 🔥 Añadir contador de resultados
    html += `<p style="text-align: center; margin-top: 10px; color: #666;">
              Mostrando ${top10.length} de ${puntuaciones.length} puntuaciones
            </p>`;

    tabla.innerHTML = html;

  } catch (e) {
    console.error("Error al cargar puntuaciones:", e);
  }
}

// Abrir modal de logros
export function mostrarLogros() {
  const modal = document.getElementById('logrosModal');
  const nombreSpan = document.getElementById('nombreUsuarioLogros');
  if (!modal || !nombreSpan) return;

  nombreSpan.textContent = localStorage.getItem('usuarioQuiz') || 'Invitado';
  modal.classList.remove('hidden');

  // Cargar puntuaciones por defecto en fácil
// Cargar por defecto 'facil'
cargarPuntuaciones('facil');

// Cuando se pulse otro botón 'dificil':
cargarPuntuaciones('dificil');

}

// Cerrar modal
export function cerrarLogros() {
  const modal = document.getElementById('logrosModal');
  if (modal) modal.classList.add('hidden');
}


