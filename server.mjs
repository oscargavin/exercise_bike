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
const requiredEnvVars = ["PROD_DATABASE_URL_UNPOOLED", "PROD_JWT_SECRET"]; // Changed from POSTGRES_URL

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

console.log("Environment check:", {
  DATABASE_URL: !!process.env.PROD_DATABASE_URL_UNPOOLED, // Updated to match our env var
  JWT_SECRET: !!process.env.PROD_JWT_SECRET,
});

// And update the client creation accordingly
const client = createClient({
  connectionString: process.env.PROD_DATABASE_URL_UNPOOLED,
});

console.log("Environment check:", {
  POSTGRES_URL: !!process.env.POSTGRES_URL,
  JWT_SECRET: !!process.env.PROD_JWT_SECRET,
});

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

// Database test route
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await client.query("SELECT NOW()");
    res.json({ status: "Database connected", timestamp: result.rows[0] });
  } catch (error) {
    console.error("Database test error:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Register endpoint
app.post("/api/auth/register", async (req, res) => {
  try {
    console.log("Registration attempt started");
    const { email, password, name, age, height, weight } = req.body;

    console.log("Database connection check in register:", {
      hasUrl: !!process.env.POSTGRES_URL,
      email: email,
    });

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
    const existingUser = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await client.query(
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
    );

    res.status(201).json({
      message: "User created successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Registration error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({
      message: "Error creating user",
      details: error.message,
    });
  }
});

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await client.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

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

// Token verification middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Auth Header:", authHeader);

  if (!authHeader) {
    console.log("No authorization header");
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log("No token in auth header");
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.PROD_JWT_SECRET);
    console.log("Token decoded successfully:", decoded);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Get user profile
app.get("/api/user/profile", verifyToken, async (req, res) => {
  try {
    const result = await client.query(
      "SELECT id, email, name, age, height, weight, profile_picture FROM users WHERE id = $1",
      [req.userId]
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

// Update user profile
app.put("/api/user/profile", verifyToken, async (req, res) => {
  try {
    const { name, age, height, weight, profilePicture } = req.body;

    const result = await client.query(
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

// Session routes
app.post("/api/sessions", verifyToken, async (req, res) => {
  try {
    console.log("Received session save request. Body:", req.body);
    console.log("User ID from token:", req.userId);

    const { startTime, endTime, metricsData } = req.body;

    if (!startTime || !endTime || !metricsData) {
      console.log("Missing required fields:", {
        startTime,
        endTime,
        hasMetrics: !!metricsData,
      });
      return res.status(400).json({
        message: "Missing required fields",
        received: { startTime, endTime, hasMetrics: !!metricsData },
      });
    }

    const result = await client.query(
      `INSERT INTO exercise_sessions (user_id, start_time, end_time, metrics_data)
       VALUES ($1, $2, $3, $4)
       RETURNING id, start_time, end_time, metrics_data`,
      [
        req.userId,
        new Date(startTime),
        new Date(endTime),
        JSON.stringify(metricsData),
      ]
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

// Get sessions
app.get("/api/sessions", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await client.query(
      `SELECT id, start_time, end_time, metrics_data
       FROM exercise_sessions
       WHERE user_id = $1
       ORDER BY start_time DESC
       LIMIT $2 OFFSET $3`,
      [req.userId, limit, offset]
    );

    const formattedSessions = result.rows.map((session) => ({
      id: session.id,
      startTime: session.start_time,
      endTime: session.end_time,
      data: session.metrics_data,
    }));

    res.json({
      sessions: formattedSessions,
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

// Password reset routes
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await client.query(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.json({
        message:
          "If an account exists with this email, you will receive a reset link.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await client.query(
      `UPDATE users 
       SET reset_token = $1,
           reset_token_expiry = $2
       WHERE email = $3`,
      [resetToken, resetTokenExpiry, email]
    );

    console.log(`Reset token for ${email}:`, resetToken);

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

    const user = await client.query(
      `SELECT id 
       FROM users 
       WHERE reset_token = $1
         AND reset_token_expiry > NOW()`,
      [token]
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

    await client.query(
      `UPDATE users 
       SET password_hash = $1,
           reset_token = NULL,
           reset_token_expiry = NULL
       WHERE id = $2`,
      [passwordHash, user.rows[0].id]
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
    await client.connect(); // Important: connect before using
    const result = await client.query("SELECT NOW()");
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
