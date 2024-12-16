import express from "express";
import { config } from "dotenv";
import { createClient } from "@vercel/postgres";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import { validatePassword } from "./src/utils/validation.js";
import crypto from "crypto";

// Load environment variables
config();

// Update the required env vars check
const requiredEnvVars = ["PROD_DATABASE_URL_UNPOOLED", "PROD_JWT_SECRET"];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Create a database client with improved connection handling
const getClient = () => {
  const client = createClient({
    connectionString: process.env.PROD_DATABASE_URL_UNPOOLED,
    keepAlive: true,
    idleTimeoutMillis: 30000, // 30 seconds
    max: 20, // max number of clients in the pool
  });

  // Add connection error handler
  client.on("error", async (err) => {
    console.error("Database connection error:", err);
    try {
      await client.end();
      await client.connect();
    } catch (reconnectError) {
      console.error("Failed to reconnect:", reconnectError);
    }
  });

  return client;
};

const client = getClient();

// Helper function to execute database queries with retries
const executeQuery = async (queryFn) => {
  const maxRetries = 3;
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await queryFn();
      return result;
    } catch (error) {
      console.error(`Query attempt ${i + 1} failed:`, error);
      lastError = error;

      // If it's a connection error, wait before retrying
      if (
        error.code === "57P01" ||
        error.code === "57P02" ||
        error.code === "57P03"
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        try {
          await client.connect();
        } catch (connectError) {
          console.error("Reconnection attempt failed:", connectError);
        }
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  throw lastError;
};

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

// Database test route with improved error handling
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await executeQuery(() => client.query("SELECT NOW()"));
    res.json({ status: "Database connected", timestamp: result.rows[0] });
  } catch (error) {
    console.error("Database test error:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Register endpoint with improved error handling
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, age, height, weight } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        message: "Email, password, and name are required",
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: "Password requirements not met",
        errors: passwordValidation.errors,
      });
    }

    // Check if user exists
    const existingUser = await executeQuery(() =>
      client.query("SELECT id FROM users WHERE email = $1", [email])
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await executeQuery(() =>
      client.query(
        `INSERT INTO users (
          email, password_hash, name, age, height, weight
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, name, age, height, weight, created_at`,
        [
          email,
          passwordHash,
          name,
          parseInt(age),
          parseFloat(height),
          parseFloat(weight),
        ]
      )
    );

    res.status(201).json({
      message: "User created successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Registration error details:", error);
    res.status(500).json({
      message: "Error creating user",
      details: error.message,
    });
  }
});

// Login endpoint with improved error handling
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await executeQuery(() =>
      client.query("SELECT * FROM users WHERE email = $1", [email])
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.PROD_JWT_SECRET, {
      expiresIn: "24h",
    });

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      age: user.age,
      height: user.height,
      weight: user.weight,
      profile_picture: user.profile_picture,
    };

    res.json({
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in" });
  }
});

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .json({ code: "token_missing", message: "Authentication required" }); // Specific error code
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ code: "token_missing", message: "Authentication required" }); // Specific error code
  }

  try {
    const decoded = jwt.verify(token, process.env.PROD_JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ code: "token_expired", message: "Session expired" }); // Specific error code
    }
    return res
      .status(401)
      .json({ code: "token_invalid", message: "Invalid authentication" }); // Specific error code
  }
};

// Get user profile with improved error handling
app.get("/api/user/profile", verifyToken, async (req, res) => {
  try {
    const result = await executeQuery(() =>
      client.query(
        "SELECT id, email, name, age, height, weight, profile_picture FROM users WHERE id = $1",
        [req.userId]
      )
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// Update user profile with improved error handling
app.put("/api/user/profile", verifyToken, async (req, res) => {
  try {
    const { name, age, height, weight, profilePicture } = req.body;

    const result = await executeQuery(() =>
      client.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             age = COALESCE($2, age),
             height = COALESCE($3, height),
             weight = COALESCE($4, weight),
             profile_picture = COALESCE($5, profile_picture),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING id, email, name, age, height, weight, profile_picture`,
        [name, age, height, weight, profilePicture, req.userId]
      )
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
});

// Update user preferences endpoint
app.put("/api/user/preferences", verifyToken, async (req, res) => {
  try {
    const { show_insights } = req.body;

    const result = await executeQuery(() =>
      client.query(
        `UPDATE users 
         SET show_insights = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, email, name, age, height, weight, profile_picture, show_insights`,
        [show_insights, req.userId]
      )
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ message: "Error updating preferences" });
  }
});

// Session routes
app.post("/api/sessions", verifyToken, async (req, res) => {
  try {
    const { startTime, endTime, metricsData } = req.body;

    if (!startTime || !endTime || !metricsData) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const insertQuery = `
      INSERT INTO exercise_sessions (
        user_id,
        start_time,
        end_time,
        metrics_data
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, start_time, end_time, metrics_data
    `;

    const result = await executeQuery(() =>
      client.query(insertQuery, [
        req.userId,
        new Date(startTime),
        new Date(endTime),
        metricsData,
      ])
    );

    res.status(201).json({
      message: "Session saved successfully",
      session: result.rows[0],
    });
  } catch (error) {
    console.error("Error saving session:", error);
    res.status(500).json({
      message: "Error saving session",
      error: error.message,
    });
  }
});

app.get("/api/sessions", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await executeQuery(() =>
      client.query(
        `SELECT id, start_time, end_time, metrics_data
         FROM exercise_sessions
         WHERE user_id = $1
         ORDER BY start_time DESC
         LIMIT $2 OFFSET $3`,
        [req.userId, limit, offset]
      )
    );

    const sessions = result.rows.map((session) => ({
      id: session.id,
      startTime: session.start_time,
      endTime: session.end_time,
      data: session.metrics_data,
    }));

    res.json({
      sessions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(result.rows.length / limit),
        hasMore: result.rows.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ message: "Error fetching sessions" });
  }
});

// Password reset routes with improved error handling
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await executeQuery(() =>
      client.query("SELECT id, email FROM users WHERE email = $1", [email])
    );

    if (user.rows.length === 0) {
      return res.json({
        message:
          "If an account exists with this email, you will receive a reset link.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await executeQuery(() =>
      client.query(
        `UPDATE users 
         SET reset_token = $1,
             reset_token_expiry = $2
         WHERE email = $3`,
        [resetToken, resetTokenExpiry, email]
      )
    );

    res.json({
      message:
        "If an account exists with this email, you will receive a reset link.",
      debug: {
        resetToken,
        resetLink: `/reset-password?token=${resetToken}`,
      },
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Error processing request" });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await executeQuery(() =>
      client.query(
        `SELECT id 
         FROM users 
         WHERE reset_token = $1
           AND reset_token_expiry > NOW()`,
        [token]
      )
    );

    if (user.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: "Password requirements not met",
        errors: passwordValidation.errors,
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await executeQuery(() =>
      client.query(
        `UPDATE users 
         SET password_hash = $1,
             reset_token = NULL,
             reset_token_expiry = NULL
         WHERE id = $2`,
        [passwordHash, user.rows[0].id]
      )
    );

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
});

// Test routes
app.get("/api/healthcheck", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/protected-test", verifyToken, (req, res) => {
  res.json({
    status: "ok",
    userId: req.userId,
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3001;

async function testDbConnection() {
  try {
    await client.connect();
    const result = await executeQuery(() => client.query("SELECT NOW()"));
    console.log("Database connection successful:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

async function startServer() {
  const dbConnected = await testDbConnection();

  if (!dbConnected) {
    console.error("Cannot start server without database connection");
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("\nAvailable routes:");
    console.log("- GET  /api/healthcheck");
    console.log("- GET  /api/protected-test");
    console.log("- POST /api/sessions");
    console.log("- GET  /api/sessions");
    console.log("- POST /api/auth/login");
    console.log("- POST /api/auth/register");
  });
}

startServer();
