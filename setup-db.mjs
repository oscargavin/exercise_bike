import { config } from "dotenv";
import { sql } from "@vercel/postgres";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.resolve(__dirname, ".env") });

console.log("Starting database setup...");
console.log("Environment check:", {
  POSTGRES_URL: !!process.env.POSTGRES_URL,
  DATABASE_URL: !!process.env.DATABASE_URL,
});

async function setupDatabase() {
  try {
    console.log("Creating users table...");
    // Drop tables
    await sql`DROP TABLE IF EXISTS exercise_sessions CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    // Create users table
    await sql`
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
    `;

    console.log("Creating exercise sessions table...");
    // Create exercise sessions table
    await sql`
      CREATE TABLE exercise_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        metrics_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indices separately
    await sql`CREATE INDEX idx_exercise_sessions_user_id ON exercise_sessions(user_id)`;
    await sql`CREATE INDEX idx_exercise_sessions_start_time ON exercise_sessions(start_time DESC)`;

    // Create index for reset token lookups
    await sql`CREATE INDEX idx_users_reset_token ON users(reset_token)`;

    console.log("Database setup completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error setting up database:", error);
    console.error("Error details:", error.message);
    process.exit(1);
  }
}

setupDatabase();
