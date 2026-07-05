// Servicio de correo SMTP (envio del "book" de condolencias y correos de prueba).
// Mismo patron singleton que llm.service.js: getSettings() lee la fila mas
// reciente de email_settings; saveSettings() hace upsert conservando
// smtp_password si no se manda uno nuevo (igual que api_key en llm.service).
const nodemailer = require('nodemailer');
const db = require('../config/database');

// Lee la configuracion actual (la fila mas reciente si hubiera varias).
async function getSettings() {
  const result = await db.query(`
    SELECT id, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password,
           from_name, from_email, send_delay_days, updated_by, updated_at
    FROM email_settings
    ORDER BY updated_at DESC NULLS LAST
    LIMIT 1
  `);
  return result.rows[0] || null;
}

// Upsert de UNA sola fila. smtp_password solo se actualiza si viene no-vacia
// (asi la UI puede guardar cambios sin re-escribir la password cada vez).
async function saveSettings({
  smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password,
  from_name, from_email, send_delay_days, updated_by
}) {
  const current = await getSettings();

  if (!current) {
    const result = await db.query(`
      INSERT INTO email_settings (
        smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password,
        from_name, from_email, send_delay_days, updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password,
                from_name, from_email, send_delay_days, updated_by, updated_at
    `, [
      smtp_host || null,
      Number.isFinite(Number(smtp_port)) ? Number(smtp_port) : 587,
      smtp_secure === true,
      smtp_user || null,
      (smtp_password && String(smtp_password).trim()) || null,
      from_name || 'SERCOFUN Los Olivos',
      from_email || null,
      Number.isFinite(Number(send_delay_days)) ? Number(send_delay_days) : 1,
      updated_by || null
    ]);
    return result.rows[0];
  }

  const result = await db.query(`
    UPDATE email_settings
    SET smtp_host = COALESCE($1, smtp_host),
        smtp_port = COALESCE($2, smtp_port),
        smtp_secure = COALESCE($3, smtp_secure),
        smtp_user = COALESCE($4, smtp_user),
        smtp_password = CASE WHEN $5::text IS NOT NULL AND length(trim($5::text)) > 0
                             THEN $5::text ELSE smtp_password END,
        from_name = COALESCE($6, from_name),
        from_email = COALESCE($7, from_email),
        send_delay_days = COALESCE($8, send_delay_days),
        updated_by = COALESCE($9, updated_by)
    WHERE id = $10
    RETURNING id, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password,
              from_name, from_email, send_delay_days, updated_by, updated_at
  `, [
    smtp_host || null,
    smtp_port !== undefined && smtp_port !== null && Number.isFinite(Number(smtp_port)) ? Number(smtp_port) : null,
    typeof smtp_secure === 'boolean' ? smtp_secure : null,
    smtp_user || null,
    smtp_password !== undefined && smtp_password !== null ? String(smtp_password) : null,
    from_name || null,
    from_email || null,
    send_delay_days !== undefined && send_delay_days !== null && Number.isFinite(Number(send_delay_days)) ? Number(send_delay_days) : null,
    updated_by || null,
    current.id
  ]);
  return result.rows[0];
}

// Crea un transporter de nodemailer a partir de una fila de email_settings.
function createTransporter(settings) {
  return nodemailer.createTransport({
    host: settings.smtp_host,
    port: settings.smtp_port || 587,
    secure: settings.smtp_secure === true,
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_password
    }
  });
}

// Envia un correo usando la configuracion guardada. NO silencia errores:
// el llamador (cron o controller) decide como manejarlos.
async function sendMail({ to, subject, html, attachments }) {
  const settings = await getSettings();

  if (!settings || !settings.smtp_host || !settings.smtp_user || !settings.smtp_password) {
    throw new Error('SMTP no configurado');
  }

  const transporter = createTransporter(settings);
  const fromName = settings.from_name || 'SERCOFUN Los Olivos';
  const fromEmail = settings.from_email || settings.smtp_user;

  return transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
    attachments
  });
}

// Arma y envia un correo simple de prueba usando la configuracion guardada.
async function sendTestMail(toEmail) {
  return sendMail({
    to: toEmail,
    subject: 'Correo de prueba — SERCOFUN Los Olivos',
    html: `
      <p>Este es un correo de prueba de la configuracion SMTP de SERCOFUN Los Olivos.</p>
      <p>Si recibiste este mensaje, la configuracion de envio de correos esta funcionando correctamente.</p>
    `
  });
}

module.exports = {
  getSettings,
  saveSettings,
  createTransporter,
  sendMail,
  sendTestMail
};
