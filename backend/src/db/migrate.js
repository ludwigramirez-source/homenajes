const { pool } = require('../config/database');

const createTables = async () => {
  const client = await pool.connect();

  try {
    console.log('[MIGRATE] Iniciando migraciones...');

    // Habilitar extension UUID
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // ========== TABLA: users (Usuarios admin) ==========
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'supervisor', 'operator')),
        active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATE] Tabla "users" creada');

    // ========== TABLA: locations (Sedes) ==========
    await client.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(150) NOT NULL,
        city VARCHAR(100) NOT NULL,
        address TEXT,
        phone VARCHAR(50),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATE] Tabla "locations" creada');

    // ========== TABLA: rooms (Salas/Capillas) ==========
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        capacity INTEGER,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATE] Tabla "rooms" creada');

    // ========== TABLA: memorials (Homenajes) ==========
    await client.query(`
      CREATE TABLE IF NOT EXISTS memorials (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        deceased_name VARCHAR(200) NOT NULL,
        birth_year INTEGER,
        death_year INTEGER,
        photo_url VARCHAR(500),
        emotional_message TEXT NOT NULL,
        qr_message TEXT DEFAULT 'Hazte presente dejando un mensaje que proviene desde todo el amor que hay al recordar con el corazon',
        template_id VARCHAR(50) DEFAULT 'default',
        schedule_start TIMESTAMP NOT NULL,
        schedule_end TIMESTAMP NOT NULL,
        active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATE] Tabla "memorials" creada');

    // ========== TABLA: ceremony_venues (Catálogo de lugares de exequias / destino final) ==========
    // kind: 'exequias' (capillas, iglesias), 'destino_final' (crematorios, cementerios), 'both'
    // location_id: NULL = global (disponible para todas las sedes); si es UUID, solo aplica a esa sede
    await client.query(`
      CREATE TABLE IF NOT EXISTS ceremony_venues (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(200) NOT NULL,
        kind VARCHAR(20) NOT NULL CHECK (kind IN ('exequias', 'destino_final', 'both')),
        location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATE] Tabla "ceremony_venues" creada');

    // ========== ALTER: memorials: campos adicionales (exequias, destino final) ==========
    // Migracion incremental: usar ADD COLUMN IF NOT EXISTS para no romper instalaciones existentes.
    await client.query(`
      ALTER TABLE memorials
        ADD COLUMN IF NOT EXISTS exequias_venue_id UUID REFERENCES ceremony_venues(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS exequias_datetime TIMESTAMP,
        ADD COLUMN IF NOT EXISTS final_destination_venue_id UUID REFERENCES ceremony_venues(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS final_destination_datetime TIMESTAMP
    `);
    console.log('[MIGRATE] Columnas exequias/destino final agregadas a "memorials"');

    // ========== ALTER: memorials: horario diario de la sala + datos del titular ==========
    // - daily_hours_start/end: horario que la sala esta habilitada cada dia (footer del display).
    //   Distinto de schedule_start/end (ingreso/salida del cuerpo, fechas+horas).
    // - family_contact_*: datos del titular de la cuenta / contacto familiar.
    await client.query(`
      ALTER TABLE memorials
        ADD COLUMN IF NOT EXISTS daily_hours_start TIME DEFAULT '08:00',
        ADD COLUMN IF NOT EXISTS daily_hours_end TIME DEFAULT '23:00',
        ADD COLUMN IF NOT EXISTS family_contact_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS family_contact_phone VARCHAR(50),
        ADD COLUMN IF NOT EXISTS family_contact_email VARCHAR(150),
        ADD COLUMN IF NOT EXISTS billing_address TEXT
    `);
    console.log('[MIGRATE] Columnas horario diario + titular agregadas a "memorials"');

    // ========== TABLA: condolences (Condolencias) ==========
    await client.query(`
      CREATE TABLE IF NOT EXISTS condolences (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        memorial_id UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
        sender_name VARCHAR(150) NOT NULL,
        sender_email VARCHAR(150) NOT NULL,
        sender_phone VARCHAR(50),
        message TEXT NOT NULL,
        file1_url VARCHAR(500),
        file2_url VARCHAR(500),
        marketing_consent BOOLEAN DEFAULT false,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATE] Tabla "condolences" creada');

    // ========== TABLA: memorial_views (Analytics) ==========
    await client.query(`
      CREATE TABLE IF NOT EXISTS memorial_views (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        memorial_id UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
        view_type VARCHAR(20) NOT NULL CHECK (view_type IN ('display', 'qr_scan', 'form_open')),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATE] Tabla "memorial_views" creada');

    // ========== INDICES para performance ==========
    await client.query(`CREATE INDEX IF NOT EXISTS idx_rooms_location ON rooms(location_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_memorials_room ON memorials(room_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_memorials_active ON memorials(active, schedule_start, schedule_end)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_condolences_memorial ON condolences(memorial_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_condolences_created ON condolences(created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_memorial_views_memorial ON memorial_views(memorial_id, created_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ceremony_venues_kind ON ceremony_venues(kind, active)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ceremony_venues_location ON ceremony_venues(location_id)`);
    console.log('[MIGRATE] Indices creados');

    // ========== FUNCIONES Y TRIGGERS para updated_at ==========
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    const tablesWithUpdatedAt = ['users', 'locations', 'rooms', 'memorials', 'ceremony_venues'];
    for (const table of tablesWithUpdatedAt) {
      await client.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `);
    }
    console.log('[MIGRATE] Triggers para updated_at creados');

    console.log('[MIGRATE] Migraciones completadas exitosamente');
  } catch (error) {
    console.error('[MIGRATE] Error en migraciones:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Si se ejecuta directamente
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('[MIGRATE] Proceso terminado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[MIGRATE] Fallo el proceso:', error);
      process.exit(1);
    });
}

module.exports = { createTables };
