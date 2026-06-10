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

    // ========== SEDES (LOCATIONS) + SALAS (ROOMS) ==========
    // Datos reales de SERCOFUN Los Olivos. Cada sede tiene salas tipificadas:
    // ejecutiva / presidencial / vip. Sedes marcadas N/A en la tabla original
    // (Cai, Palmira Horno, Calarca) se crean con 1 sala ejecutiva por defecto;
    // se puede ajustar luego desde el modulo de gestion de salas.
    const SEDES = [
      { name: 'Cali Templo',            city: 'Cali',                   address: 'Calle 13 # 50-70',              slug: 'CALITEMPLO',   rooms: { ejecutiva: 7, presidencial: 3, vip: 0 } },
      { name: 'Vásquez Cobo',           city: 'Cali',                   address: 'Av Vásquez Cobo # 24 AN-44',    slug: 'VASQUEZCOBO',  rooms: { ejecutiva: 3, presidencial: 1, vip: 0 } },
      { name: 'San Fernando',           city: 'Cali',                   address: 'Cra 36 # 5B 3-14',              slug: 'SANFERNANDO',  rooms: { ejecutiva: 4, presidencial: 0, vip: 0 } },
      { name: 'Cai',                    city: 'Cali',                   address: 'Cra 36 # 4B-08 B/San Fernando', slug: 'CAI',          rooms: { ejecutiva: 1, presidencial: 0, vip: 0 } },
      { name: 'Aguablanca',             city: 'Cali',                   address: 'Cra 27 # 96-32',                slug: 'AGUABLANCA',   rooms: { ejecutiva: 2, presidencial: 0, vip: 0 } },
      { name: 'Palmira',                city: 'Palmira',                address: 'Calle 23 # 33-122',             slug: 'PALMIRA',      rooms: { ejecutiva: 3, presidencial: 2, vip: 1 } },
      { name: 'Palmira Horno',          city: 'Palmira',                address: 'Calle 20 # 33A-66',             slug: 'PALMIRAHORNO', rooms: { ejecutiva: 1, presidencial: 0, vip: 0 } },
      { name: 'Santander de Quilichao', city: 'Santander de Quilichao', address: 'Calle 2 # 8A-12',               slug: 'SANTANDERQ',   rooms: { ejecutiva: 2, presidencial: 1, vip: 0 } },
      { name: 'Buenaventura',           city: 'Buenaventura',           address: 'Calle 6 # 55-40 B/Laureles',    slug: 'BUENAVENTURA', rooms: { ejecutiva: 2, presidencial: 1, vip: 0 } },
      { name: 'Pasto',                  city: 'Pasto',                  address: 'Cra 36 # 19-44 B/Palermo',      slug: 'PASTO',        rooms: { ejecutiva: 1, presidencial: 1, vip: 0 } },
      { name: 'Pereira Cuba',           city: 'Pereira',                address: 'Calle 72-16 # 26-20 B/Cuba',    slug: 'PEREIRACUBA',  rooms: { ejecutiva: 2, presidencial: 0, vip: 0 } },
      { name: 'Pereira 30 de Agosto',   city: 'Pereira',                address: 'Av 30 de Agosto # 39-16',       slug: 'PEREIRA30',    rooms: { ejecutiva: 3, presidencial: 1, vip: 0 } },
      { name: 'Calarcá',                city: 'Calarcá',                address: 'Calle 38 # 25-25',              slug: 'CALARCA',      rooms: { ejecutiva: 1, presidencial: 0, vip: 0 } },
      { name: 'Dosquebradas',           city: 'Dosquebradas',           address: 'Cra 16 # 36-83',                slug: 'DOSQUEBRADAS', rooms: { ejecutiva: 2, presidencial: 0, vip: 0 } },
      { name: 'Cartago',                city: 'Cartago',                address: 'Cra 2 # 12-37',                 slug: 'CARTAGO',      rooms: { ejecutiva: 2, presidencial: 0, vip: 0 } },
      { name: 'Armenia Centro',         city: 'Armenia',                address: 'Cra 13 # 24-27',                slug: 'ARMENIACENTRO',rooms: { ejecutiva: 4, presidencial: 0, vip: 0 } },
      { name: 'Armenia Fundadores',     city: 'Armenia',                address: 'Cra 13A # 2 Norte-29',          slug: 'ARMENIAFUND',  rooms: { ejecutiva: 2, presidencial: 1, vip: 0 } }
    ];

    const TYPE_META = {
      ejecutiva:    { label: 'Ejecutiva',    abbr: 'EJE' },
      presidencial: { label: 'Presidencial', abbr: 'PRE' },
      vip:          { label: 'VIP',          abbr: 'VIP' }
    };

    let totalSedes = 0;
    let totalRooms = 0;

    for (const sede of SEDES) {
      // Sede idempotente: buscar por nombre, crear si no existe.
      let locationId;
      const existing = await client.query('SELECT id FROM locations WHERE name = $1', [sede.name]);
      if (existing.rows.length > 0) {
        locationId = existing.rows[0].id;
      } else {
        const ins = await client.query(`
          INSERT INTO locations (name, city, address, phone, active)
          VALUES ($1, $2, $3, NULL, true)
          RETURNING id
        `, [sede.name, sede.city, sede.address]);
        locationId = ins.rows[0].id;
        totalSedes++;
      }

      // Salas por tipo. Codigo unico: <SLUG>-<ABBR>-<NN>.
      for (const type of ['ejecutiva', 'presidencial', 'vip']) {
        const count = sede.rooms[type] || 0;
        const meta = TYPE_META[type];
        for (let n = 1; n <= count; n++) {
          const code = `${sede.slug}-${meta.abbr}-${String(n).padStart(2, '0')}`;
          const name = `Sala ${meta.label} ${n}`;
          const r = await client.query(`
            INSERT INTO rooms (location_id, name, code, room_type, active)
            VALUES ($1, $2, $3, $4, true)
            ON CONFLICT (code) DO NOTHING
            RETURNING id
          `, [locationId, name, code, type]);
          if (r.rows.length > 0) totalRooms++;
        }
      }
    }
    console.log(`[SEED] ${totalSedes} sedes nuevas, ${totalRooms} salas nuevas creadas`);

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

    // Nota: ya no se crea un homenaje demo (Pedro Rojas). Los homenajes reales
    // se crean desde el modulo de creacion de tributos. Las salas quedan
    // "disponibles" hasta que se les asigne un homenaje activo.

    console.log('[SEED] Datos base cargados exitosamente');
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
