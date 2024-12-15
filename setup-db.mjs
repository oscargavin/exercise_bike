import { config } from "dotenv";
import { createClient } from "@vercel/postgres";
config();

const client = createClient({
  connectionString: process.env.PROD_DATABASE_URL_UNPOOLED,
});

async function setupDatabase() {
  try {
    console.log("Starting database setup...");
    await client.connect();

    // Check if tables exist first
    const tablesExist = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);

    if (!tablesExist.rows[0].exists) {
      console.log("Creating users table...");
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          age INTEGER,
          height DECIMAL,
          weight DECIMAL,
          profile_picture TEXT,
          reset_token TEXT,
          reset_token_expiry TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log("Creating exercise sessions table...");
      await client.query(`
        CREATE TABLE exercise_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          start_time TIMESTAMP WITH TIME ZONE NOT NULL,
          end_time TIMESTAMP WITH TIME ZONE NOT NULL,
          metrics_data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(
        `CREATE INDEX idx_exercise_sessions_user_id ON exercise_sessions(user_id)`
      );
      await client.query(
        `CREATE INDEX idx_exercise_sessions_start_time ON exercise_sessions(start_time DESC)`
      );
      await client.query(
        `CREATE INDEX idx_users_reset_token ON users(reset_token)`
      );

      console.log("Initial database setup completed successfully");
    } else {
      console.log("Tables already exist, skipping initial creation");
    }

    // Heart rate updates - these will run regardless of whether tables existed
    console.log("Starting heart rate tracking updates...");

    // Check if heart rate columns exist
    const heartRateColumnsExist = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'exercise_sessions' AND column_name = 'avg_heart_rate'
      );
    `);

    if (!heartRateColumnsExist.rows[0].exists) {
      console.log("Adding heart rate tracking capabilities...");

      // Start transaction for heart rate updates
      await client.query("BEGIN");

      try {
        // Backup existing metrics_data
        await client.query(`
          ALTER TABLE exercise_sessions 
          ADD COLUMN IF NOT EXISTS metrics_data_backup JSONB;
        `);

        await client.query(`
          UPDATE exercise_sessions 
          SET metrics_data_backup = metrics_data 
          WHERE metrics_data_backup IS NULL;
        `);

        // Add heart rate array to existing metrics_data
        await client.query(`
          UPDATE exercise_sessions 
          SET metrics_data = jsonb_set(
            COALESCE(metrics_data, '{}'::jsonb),
            '{heartRate}',
            '[]'::jsonb,
            true
          )
          WHERE metrics_data IS NOT NULL;
        `);

        // Add heart rate statistics columns
        await client.query(`
          ALTER TABLE exercise_sessions
          ADD COLUMN avg_heart_rate DECIMAL,
          ADD COLUMN max_heart_rate INTEGER,
          ADD COLUMN min_heart_rate INTEGER,
          ADD COLUMN heart_rate_zones JSONB;
        `);

        // Create index for heart rate statistics
        await client.query(`
          CREATE INDEX idx_sessions_heart_rate_stats 
          ON exercise_sessions (avg_heart_rate, max_heart_rate);
        `);

        // Commit transaction
        await client.query("COMMIT");
        console.log("Heart rate tracking updates completed successfully");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    } else {
      console.log("Heart rate columns already exist, skipping updates");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error setting up database:", error);
    console.error("Error details:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
