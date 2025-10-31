import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'mindscribe',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function ensureDatabaseExists() {
  // Create a pool connection to the default 'postgres' database
  const defaultPool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    database: 'postgres', // Connect to default postgres database
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await defaultPool.connect();
    const dbName = process.env.PGDATABASE || 'mindscribe';

    // Check if database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`Creating database '${dbName}'...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created successfully`);
    } else {
      console.log(`✅ Database '${dbName}' already exists`);
    }

    client.release();
    await defaultPool.end();
    return true;
  } catch (err) {
    console.error('❌ Error ensuring database exists:', err);
    await defaultPool.end();
    return false;
  }
}

export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err);
    return false;
  }
}

export async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'clinician',
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create patients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        client_id VARCHAR(50) UNIQUE NOT NULL,
        date_of_birth DATE NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration INTEGER,
        status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
        transcription_status VARCHAR(50),
        transcription_error TEXT,
        recording_url TEXT,
        recording_path TEXT,
        transcript_url TEXT,
        notes_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create transcript_segments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transcript_segments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        speaker VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        start_time DECIMAL(10, 3) NOT NULL,
        end_time DECIMAL(10, 3) NOT NULL,
        confidence DECIMAL(3, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create clinical_notes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        subjective TEXT,
        objective TEXT,
        assessment TEXT,
        plan TEXT,
        description TEXT,
        action TEXT,
        response TEXT,
        evaluation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        signed_at TIMESTAMP
      );
    `);

    // Create appointments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create audit_logs table for HIPAA compliance
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action VARCHAR(255) NOT NULL,
        resource_type VARCHAR(100),
        resource_id UUID,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Database tables initialized successfully');

    // Run migrations
    await runMigrations(client);
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function runMigrations(client: any) {
  try {
    console.log('Running database migrations...');

    // Migration 1: Add transcription_error column to sessions table
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'sessions' AND column_name = 'transcription_error'
        ) THEN
          ALTER TABLE sessions ADD COLUMN transcription_error TEXT;
          RAISE NOTICE 'Added transcription_error column to sessions table';
        END IF;
      END $$;
    `);

    // Migration 2: Change start_time and end_time in transcript_segments to DECIMAL
    await client.query(`
      DO $$
      BEGIN
        -- Check if start_time is INTEGER type
        IF EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'transcript_segments'
          AND column_name = 'start_time'
          AND data_type = 'integer'
        ) THEN
          ALTER TABLE transcript_segments
            ALTER COLUMN start_time TYPE DECIMAL(10, 3);
          RAISE NOTICE 'Changed start_time to DECIMAL(10, 3)';
        END IF;

        -- Check if end_time is INTEGER type
        IF EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'transcript_segments'
          AND column_name = 'end_time'
          AND data_type = 'integer'
        ) THEN
          ALTER TABLE transcript_segments
            ALTER COLUMN end_time TYPE DECIMAL(10, 3);
          RAISE NOTICE 'Changed end_time to DECIMAL(10, 3)';
        END IF;
      END $$;
    `);

    console.log('✅ Database migrations completed successfully');
  } catch (err) {
    console.error('❌ Database migration error:', err);
    // Don't throw - migrations might fail if already applied
  }
}
