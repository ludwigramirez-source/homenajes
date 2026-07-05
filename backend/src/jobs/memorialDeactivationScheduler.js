// Tarea programada: desactiva automaticamente los homenajes cuya fecha y hora
// de destino final (final_destination_datetime) ya se cumplio. Hasta ahora
// `active` solo se apagaba manualmente por el staff (PUT /api/memorials/:id
// con { active: false }); esto agrega el apagado automatico pedido por el
// cliente sin tocar ese flujo manual.
//
// Corre cada 15 minutos comparando timestamps absolutos en la base de datos
// (no depende de la hora de reloj de pared de ningun huso horario, a
// diferencia de bookScheduler.js que si necesita fijar America/Bogota para
// su corrida diaria a las 9am).
const cron = require('node-cron');
const db = require('../config/database');

const CRON_EXPRESSION = '*/15 * * * *'; // cada 15 minutos

// Ejecuta una corrida: desactiva en una sola sentencia set-based todos los
// homenajes activos cuyo destino final ya paso. Exportada aparte de
// startMemorialDeactivationScheduler para poder invocarla manualmente/en
// tests sin registrar el cron.
async function runMemorialDeactivation() {
  try {
    const result = await db.query(`
      UPDATE memorials
      SET active = false
      WHERE active = true
        AND final_destination_datetime IS NOT NULL
        AND final_destination_datetime <= NOW()
      RETURNING id, deceased_name
    `);

    if (result.rows.length > 0) {
      console.log(`[MEMORIAL-DEACTIVATE] ${result.rows.length} homenaje(s) desactivado(s) automaticamente (destino final cumplido)`);
      for (const memorial of result.rows) {
        console.log(`[MEMORIAL-DEACTIVATE] Homenaje desactivado automaticamente (destino final cumplido): ${memorial.deceased_name} (${memorial.id})`);
      }
    }
  } catch (err) {
    console.error('[MEMORIAL-DEACTIVATE] Error:', err.message);
  }
}

// Registra la tarea cron cada 15 minutos y ademas ejecuta una corrida
// inmediata al arrancar, para desactivar sin demora los homenajes cuyo
// destino final ya paso mientras el backend estuvo caido/desplegando.
// Debe llamarse SOLO desde server.js (no desde app.js) para que scripts como
// migrate.js/seed.js no disparen el cron.
function startMemorialDeactivationScheduler() {
  cron.schedule(CRON_EXPRESSION, runMemorialDeactivation);
  console.log(`[MEMORIAL-DEACTIVATE] Tarea programada registrada (${CRON_EXPRESSION})`);

  runMemorialDeactivation();
}

module.exports = { startMemorialDeactivationScheduler, runMemorialDeactivation };
