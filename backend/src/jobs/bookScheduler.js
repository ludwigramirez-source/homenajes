// Tarea programada diaria: envia automaticamente el "book" (PDF de mensajes
// de condolencia aprobados) al titular de cada homenaje ya finalizado,
// send_delay_days (configurable, default 1) despues de schedule_end.
//
// Se ejecuta UNA sola vez por homenaje via trigger_type='auto': si ya existe
// una fila book_sends con trigger_type='auto' para ese memorial (sin importar
// su status), no se vuelve a intentar automaticamente; los reintentos
// posteriores son manuales desde la seccion Books del panel.
const cron = require('node-cron');
const db = require('../config/database');
const emailService = require('../services/email.service');
const bookService = require('../services/book.service');

const CRON_EXPRESSION = '0 9 * * *'; // 9:00 am todos los dias
const CRON_TIMEZONE = 'America/Bogota';

// Busca memoriales elegibles para el envio automatico del book.
async function findEligibleMemorials(sendDelayDays) {
  const result = await db.query(`
    SELECT m.*, r.location_id
    FROM memorials m
    JOIN rooms r ON m.room_id = r.id
    WHERE m.schedule_end + (COALESCE($1, 1) || ' days')::interval <= NOW()
      AND NOT EXISTS (
        SELECT 1 FROM book_sends bs
        WHERE bs.memorial_id = m.id AND bs.trigger_type = 'auto'
      )
  `, [sendDelayDays]);
  return result.rows;
}

// Ejecuta una corrida del scheduler. Exportada aparte de startBookScheduler
// para poder invocarla manualmente/en tests sin registrar el cron.
async function runBookScheduler() {
  let settings;
  try {
    settings = await emailService.getSettings();
  } catch (err) {
    console.error('[BOOK-SCHEDULER] Error leyendo email_settings:', err.message);
    return;
  }

  if (!settings || !settings.smtp_host || !settings.smtp_user || !settings.smtp_password) {
    console.log('[BOOK-SCHEDULER] SMTP no configurado, se omite esta corrida');
    return;
  }

  let memorials;
  try {
    memorials = await findEligibleMemorials(settings.send_delay_days);
  } catch (err) {
    console.error('[BOOK-SCHEDULER] Error buscando homenajes elegibles:', err.message);
    return;
  }

  let processed = 0;
  let failed = 0;

  for (const memorial of memorials) {
    try {
      if (!memorial.family_contact_email) {
        await db.query(`
          INSERT INTO book_sends (
            memorial_id, status, recipient_email, message_count,
            error_message, trigger_type
          )
          VALUES ($1, 'failed', NULL, 0, $2, 'auto')
        `, [memorial.id, 'El homenaje no tiene correo de titular configurado']);
        processed += 1;
        failed += 1;
        continue;
      }

      const condolencesResult = await db.query(
        `SELECT * FROM condolences WHERE memorial_id = $1 AND moderation_status = 'approved' ORDER BY created_at DESC`,
        [memorial.id]
      );

      const bookSend = await bookService.processAndSendBook(memorial, condolencesResult.rows, {
        triggerType: 'auto'
      });

      processed += 1;
      if (bookSend.status === 'failed') failed += 1;
    } catch (err) {
      processed += 1;
      failed += 1;
      console.error(`[BOOK-SCHEDULER] Error procesando memorial ${memorial.id}:`, err.message);
    }
  }

  console.log(`[BOOK-SCHEDULER] Corrida completada: ${processed} homenaje(s) procesado(s), ${failed} fallido(s)`);
}

// Registra la tarea cron diaria. Debe llamarse SOLO desde server.js (no desde
// app.js) para que scripts como migrate.js/seed.js no disparen el cron.
function startBookScheduler() {
  cron.schedule(CRON_EXPRESSION, runBookScheduler, { timezone: CRON_TIMEZONE });
  console.log(`[BOOK-SCHEDULER] Tarea programada registrada (${CRON_EXPRESSION}, ${CRON_TIMEZONE})`);
}

module.exports = { startBookScheduler, runBookScheduler };
