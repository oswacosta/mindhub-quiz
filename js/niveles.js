// niveles.js
export const SISTEMA_NIVELES = {
  niveles: [
    { nombre: "Novato", puntosRequeridos: 0, color: "#6B7280" },
    { nombre: "Aprendiz", puntosRequeridos: 100, color: "#10B981" },
    { nombre: "Experto", puntosRequeridos: 500, color: "#3B82F6" },
    { nombre: "Maestro", puntosRequeridos: 1000, color: "#8B5CF6" },
    { nombre: "Leyenda", puntosRequeridos: 2500, color: "#F59E0B" }
  ],
  
  insignias: [
    { id: "primer_paso", nombre: "Primer Paso", descripcion: "Completa tu primera partida", icono: "🚶" },
    { id: "perfecto_5", nombre: "Perfeccionista", descripcion: "5 partidas perfectas", icono: "⭐" },
    { id: "categorias_10", nombre: "Sabio Multidisciplinar", descripcion: "Completa 10 categorías diferentes", icono: "🎓" },
    { id: "racha_10", nombre: "Imparable", descripcion: "Racha de 10 aciertos consecutivos", icono: "🔥" },
    { id: "veloz", nombre: "Veloz", descripcion: "Responde todas las preguntas con más de 10s restantes", icono: "⚡" },
    { id: "dificil_3", nombre: "Valiente", descripcion: "Completa 3 categorías en difícil", icono: "🛡️" }
  ]
};

export function calcularNivel(puntosTotales) {
  const niveles = SISTEMA_NIVELES.niveles;
  for (let i = niveles.length - 1; i >= 0; i--) {
    if (puntosTotales >= niveles[i].puntosRequeridos) {
      return niveles[i];
    }
  }
  return niveles[0];
}

export function obtenerProgresoNivel(puntosTotales) {
  const nivelActual = calcularNivel(puntosTotales);
  const nivelIndex = SISTEMA_NIVELES.niveles.findIndex(n => n.nombre === nivelActual.nombre);
  const siguienteNivel = SISTEMA_NIVELES.niveles[nivelIndex + 1];
  
  if (!siguienteNivel) {
    return { progreso: 100, restante: 0 };
  }
  
  const rango = siguienteNivel.puntosRequeridos - nivelActual.puntosRequeridos;
  const progreso = ((puntosTotales - nivelActual.puntosRequeridos) / rango) * 100;
  const restante = siguienteNivel.puntosRequeridos - puntosTotales;
  
  return { progreso: Math.min(100, Math.max(0, progreso)), restante };
}

export function verificarInsignias(estadoJuego) {
  const insigniasDesbloqueadas = JSON.parse(localStorage.getItem('insigniasQuiz') || '{}');
  const usuario = localStorage.getItem('usuarioQuiz') || 'Invitado';
  
  if (!insigniasDesbloqueadas[usuario]) {
    insigniasDesbloqueadas[usuario] = [];
  }
  
  const nuevasInsignias = [];
  const stats = obtenerEstadisticasUsuario();
  
  // Verificar cada insignia
  SISTEMA_NIVELES.insignias.forEach(insignia => {
    if (!insigniasDesbloqueadas[usuario].includes(insignia.id)) {
      let desbloqueada = false;
      
      switch (insignia.id) {
        case "primer_paso":
          desbloqueada = stats.partidasCompletadas >= 1;
          break;
        case "perfecto_5":
          desbloqueada = stats.partidasPerfectas >= 5;
          break;
        case "categorias_10":
          desbloqueada = Object.keys(stats.categoriasCompletadas).length >= 10;
          break;
        case "racha_10":
          desbloqueada = stats.rachaMaxima >= 10;
          break;
        case "veloz":
          desbloqueada = estadoJuego.todasRapidas || false;
          break;
        case "dificil_3":
          desbloqueada = stats.categoriasDificil >= 3;
          break;
      }
      
      if (desbloqueada) {
        insigniasDesbloqueadas[usuario].push(insignia.id);
        nuevasInsignias.push(insignia);
      }
    }
  });
  
  localStorage.setItem('insigniasQuiz', JSON.stringify(insigniasDesbloqueadas));
  return nuevasInsignias;
}

export function obtenerEstadisticasUsuario() {
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

export function actualizarEstadisticas(resultadoPartida) {
  const usuario = localStorage.getItem('usuarioQuiz') || 'Invitado';
  const stats = obtenerEstadisticasUsuario();
  
  // Actualizar estadísticas básicas
  stats.partidasCompletadas = (stats.partidasCompletadas || 0) + 1;
  stats.puntosTotales = (stats.puntosTotales || 0) + resultadoPartida.puntos;
  stats.rachaMaxima = Math.max(stats.rachaMaxima || 0, resultadoPartida.rachaMaxima || 0);
  
  // Partida perfecta (100% de aciertos)
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