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

      console.log("Database setup completed successfully");
    } else {
      console.log("Tables already exist, no changes needed");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
