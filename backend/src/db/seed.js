const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

// Copia un asset desde backend/src/assets al directorio uploads (volumen Docker).
// Devuelve la URL relativa "/uploads/<name>" si tuvo exito, o null si no existe.
function copyAssetToUploads(filename) {
  try {
    const src = path.join(__dirname, '..', 'assets', filename);
    if (!fs.existsSync(src)) return null;
    const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const dst = path.join(uploadsDir, filename);
    if (!fs.existsSync(dst)) fs.copyFileSync(src, dst);
    return '/uploads/' + filename;
  } catch (e) {
    console.warn('[SEED] No se pudo copiar asset', filename, e.message);
    return null;
  }
}

const seedDatabase = async () => {
  const client = await pool.connect();

  try {
    console.log('[SEED] Iniciando carga de datos demo...');

    // ========== USUARIOS ==========
    const adminPassword = await bcrypt.hash('admin123', 10);
    const supervisorPassword = await bcrypt.hash('super123', 10);
    const operatorPassword = await bcrypt.hash('operator123', 10);

    await client.query(`
      INSERT INTO users (username, email, password_hash, full_name, role)
      VALUES
        ('admin', 'admin@sercofun.co', $1, 'Administrador Sistema', 'admin'),
        ('supervisor', 'supervisor@sercofun.co', $2, 'Supervisor Operaciones', 'supervisor'),
        ('operator', 'operator@sercofun.co', $3, 'Operador General', 'operator')
      ON CONFLICT (username) DO NOTHING
    `, [adminPassword, supervisorPassword, operatorPassword]);
    console.log('[SEED] Usuarios creados (admin/admin123, supervisor/super123, operator/operator123)');

    // ========== SEDES (LOCATIONS) ==========
    const locations = [
      { name: 'Funerario Los Olivos - Sede Principal', city: 'Cali', address: 'Avenida Roosevelt #38-20', phone: '+57 602 5530000' },
      { name: 'Funerario Los Olivos - Norte', city: 'Cali', address: 'Carrera 100 #16-15', phone: '+57 602 5530001' },
      { name: 'Funerario Los Olivos - Palmira', city: 'Palmira', address: 'Calle 30 #28-10', phone: '+57 602 2720000' },
      { name: 'Funerario Los Olivos - Buga', city: 'Buga', address: 'Carrera 14 #4-12', phone: '+57 602 2370000' },
      { name: 'Funerario Los Olivos - Tulua', city: 'Tulua', address: 'Calle 26 #25-30', phone: '+57 602 2330000' }
    ];

    const locationIds = [];
    for (const loc of locations) {
      const result = await client.query(`
        INSERT INTO locations (name, city, address, phone, active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [loc.name, loc.city, loc.address, loc.phone]);
      
      if (result.rows.length > 0) {
        locationIds.push(result.rows[0].id);
      } else {
        const existing = await client.query('SELECT id FROM locations WHERE name = $1', [loc.name]);
        if (existing.rows.length > 0) locationIds.push(existing.rows[0].id);
      }
    }
    console.log(`[SEED] ${locationIds.length} sedes creadas`);

    // ========== SALAS (ROOMS) ==========
    // 11 salas por sede = 55 salas en total
    const roomsPerLocation = [
      { name: 'Capilla 1', code: 'CAP-01' },
      { name: 'Capilla 2', code: 'CAP-02' },
      { name: 'Capilla 3', code: 'CAP-03' },
      { name: 'Capilla 4', code: 'CAP-04' },
      { name: 'Capilla 5', code: 'CAP-05' },
      { name: 'Sala Principal', code: 'SP-01' },
      { name: 'Sala VIP', code: 'VIP-01' },
      { name: 'Sala A', code: 'SA-A' },
      { name: 'Sala B', code: 'SA-B' },
      { name: 'Sala C', code: 'SA-C' },
      { name: 'Sala Familiar', code: 'SF-01' }
    ];

    let totalRooms = 0;
    let firstRoomId = null;
    
    for (let i = 0; i < locationIds.length; i++) {
      const locationId = locationIds[i];
      for (const room of roomsPerLocation) {
        const uniqueCode = `${room.code}-${i + 1}`;
        const result = await client.query(`
          INSERT INTO rooms (location_id, name, code, capacity, active)
          VALUES ($1, $2, $3, $4, true)
          ON CONFLICT (code) DO NOTHING
          RETURNING id
        `, [locationId, room.name, uniqueCode, 50]);
        
        if (result.rows.length > 0) {
          totalRooms++;
          if (!firstRoomId) firstRoomId = result.rows[0].id;
        }
      }
    }
    console.log(`[SEED] ${totalRooms} salas creadas (11 por sede)`);

    // ========== CATALOGO: CEREMONY VENUES (exequias y destino final) ==========
    // Venues globales (sin location_id) que aplican para todas las sedes.
    const venues = [
      { name: 'Capilla de Los Olivos', kind: 'exequias' },
      { name: 'Capilla Sercofun Norte', kind: 'exequias' },
      { name: 'Iglesia San Francisco', kind: 'exequias' },
      { name: 'Iglesia La Ermita', kind: 'exequias' },
      { name: 'Crematorio Los Olivos', kind: 'destino_final' },
      { name: 'Cementerio Central', kind: 'destino_final' },
      { name: 'Cementerio Metropolitano del Sur', kind: 'destino_final' },
      { name: 'Cementerio Jardines del Recuerdo', kind: 'destino_final' }
    ];

    const venueIds = {};
    for (const v of venues) {
      const existing = await client.query(
        'SELECT id FROM ceremony_venues WHERE name = $1 AND location_id IS NULL',
        [v.name]
      );
      if (existing.rows.length > 0) {
        venueIds[v.name] = existing.rows[0].id;
        continue;
      }
      const insert = await client.query(`
        INSERT INTO ceremony_venues (name, kind, location_id, active)
        VALUES ($1, $2, NULL, true)
        RETURNING id
      `, [v.name, v.kind]);
      venueIds[v.name] = insert.rows[0].id;
    }
    console.log(`[SEED] ${venues.length} venues de ceremonia creados`);

    // ========== HOMENAJE DEMO: PEDRO ROJAS ==========
    if (firstRoomId) {
      const adminUser = await client.query("SELECT id FROM users WHERE username = 'admin'");
      const adminId = adminUser.rows[0]?.id;

      // Ventana amplia para que el homenaje demo siempre este activo,
      // independiente de la zona horaria del servidor o el momento de acceso.
      const scheduleStart = new Date(Date.now() - 60 * 60 * 1000);          // hace 1 hora
      const scheduleEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);  // en 30 dias

      // Datos de ceremonia para el demo: exequias 1 dia despues del ingreso,
      // destino final 2 horas despues de las exequias.
      const exequiasDatetime = new Date(scheduleStart.getTime() + 24 * 60 * 60 * 1000);
      const finalDestDatetime = new Date(exequiasDatetime.getTime() + 2 * 60 * 60 * 1000);

      // Foto del difunto: si esta el asset local optimizado, lo copiamos al
      // volumen uploads. Si no, fallback a una imagen demo en CDN externo.
      const pedroPhotoUrl = copyAssetToUploads('pedrorojas.jpg')
        || 'https://cdn.prod.website-files.com/63d16ac1f3b67004193c8ff9/63d2e9a8a700ac724c0b51f2_adulto-mayor-h.jpg';

      const memorialResult = await client.query(`
        INSERT INTO memorials (
          room_id, deceased_name, birth_year, death_year, photo_url,
          emotional_message, schedule_start, schedule_end, active, created_by,
          exequias_venue_id, exequias_datetime,
          final_destination_venue_id, final_destination_datetime
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, $11, $12, $13)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
        firstRoomId,
        'Pedro Rojas',
        1995,
        2026,
        pedroPhotoUrl,
        'Hay seres que no se van, solo se transforman en luz para guiarnos. Con el corazon roto, pero agradecidos por cada segundo compartido, despedimos a nuestro/a querido/a. Su amor sera nuestro refugio eterno.',
        scheduleStart,
        scheduleEnd,
        adminId,
        venueIds['Capilla de Los Olivos'] || null,
        exequiasDatetime,
        venueIds['Crematorio Los Olivos'] || null,
        finalDestDatetime
      ]);

      if (memorialResult.rows.length > 0) {
        const memorialId = memorialResult.rows[0].id;
        console.log(`[SEED] Homenaje demo creado: Pedro Rojas (ID: ${memorialId})`);

        // Algunas condolencias de ejemplo
        const sampleCondolences = [
          {
            name: 'Maria Gonzalez',
            email: 'maria.gonzalez@email.com',
            phone: '+57 300 1234567',
            message: 'Mi mas sentido pesame a la familia. Pedro fue una persona maravillosa que dejo huella en todos los que lo conocimos. Que descanse en paz.',
            consent: true
          },
          {
            name: 'Carlos Ramirez',
            email: 'carlos.r@email.com',
            phone: '+57 301 9876543',
            message: 'Compartimos tantos momentos juntos en el trabajo. Su sonrisa y bondad siempre nos acompanaran. Un fuerte abrazo a toda la familia.',
            consent: true
          },
          {
            name: 'Ana Martinez',
            email: 'ana.martinez@email.com',
            phone: null,
            message: 'Aunque no nos conocimos personalmente, supe de Pedro a traves de mi esposo. Solo escuche cosas buenas de el. Mis oraciones para su familia.',
            consent: false
          }
        ];

        for (const cond of sampleCondolences) {
          await client.query(`
            INSERT INTO condolences (memorial_id, sender_name, sender_email, sender_phone, message, marketing_consent)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [memorialId, cond.name, cond.email, cond.phone, cond.message, cond.consent]);
        }
        console.log(`[SEED] ${sampleCondolences.length} condolencias de muestra creadas`);
      }
    }

    console.log('[SEED] Datos demo cargados exitosamente');
    console.log('\n=========================================');
    console.log('CREDENCIALES DE ACCESO:');
    console.log('=========================================');
    console.log('Admin:      admin / admin123');
    console.log('Supervisor: supervisor / super123');
    console.log('Operator:   operator / operator123');
    console.log('=========================================\n');

  } catch (error) {
    console.error('[SEED] Error en seed:', error);
    throw error;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('[SEED] Proceso terminado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[SEED] Fallo el proceso:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
