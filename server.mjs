import express from "express";
import { config } from "dotenv";
import { sql } from "@vercel/postgres";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import { validatePassword } from "./src/utils/validation.js";
import crypto from "crypto";

// Load environment variables
config();

// Validate required environment variables
const requiredEnvVars = ["POSTGRES_URL", "JWT_SECRET"];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

console.log("Environment check:", {
  POSTGRES_URL: !!process.env.POSTGRES_URL,
  JWT_SECRET: !!process.env.JWT_SECRET,
});

const app = express();

// Update these lines at the top of server.mjs
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
    const result = await sql`SELECT NOW();`;
    res.json({ status: "Database connected", timestamp: result.rows[0] });
  } catch (error) {
    console.error("Database test error:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Update the register endpoint in server.mjs
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, age, height, weight } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        message: "Email, password, and name are required",
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: "Password requirements not met",
        errors: passwordValidation.errors,
      });
    }

    // Check if user exists
    const existingUser = await sql`
        SELECT id FROM users WHERE email = ${email}
      `;

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await sql`
        INSERT INTO users (
          email, 
          password_hash, 
          name, 
          age, 
          height, 
          weight
        )
        VALUES (
          ${email}, 
          ${passwordHash}, 
          ${name}, 
          ${parseInt(age)}, 
          ${parseFloat(height)}, 
          ${parseFloat(weight)}
        )
        RETURNING id, email, name, age, height, weight, created_at
      `;

    res.status(201).json({
      message: "User created successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Error creating user" });
  }
});

// Update your login endpoint in server.mjs
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await sql`
        SELECT * FROM users WHERE email = ${email}
      `;

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    // Return user data without password_hash
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

// Update your verifyToken middleware in server.mjs
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Auth Header:", authHeader); // Debug line

  if (!authHeader) {
    console.log("No authorization header"); // Debug line
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log("No token in auth header"); // Debug line
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded successfully:", decoded); // Debug line
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("Token verification failed:", error); // Debug line
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Get user profile
app.get("/api/user/profile", verifyToken, async (req, res) => {
  try {
    const result = await sql`
        SELECT id, email, name, age, height, weight, profile_picture
        FROM users
        WHERE id = ${req.userId}
      `;

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

    // Update user data
    const result = await sql`
        UPDATE users
        SET 
          name = COALESCE(${name}, name),
          age = COALESCE(${age}, age),
          height = COALESCE(${height}, height),
          weight = COALESCE(${weight}, weight),
          profile_picture = COALESCE(${profilePicture}, profile_picture),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${req.userId}
        RETURNING id, email, name, age, height, weight, profile_picture
      `;

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
});

// Add these routes to your server.mjs

// Update your session route in server.mjs
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

    console.log("Attempting to save session to database with data:", {
      userId: req.userId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      metricsDataType: typeof metricsData,
    });

    const result = await sql`
        INSERT INTO exercise_sessions (
          user_id, 
          start_time, 
          end_time, 
          metrics_data
        )
        VALUES (
          ${req.userId}, 
          ${new Date(startTime)}, 
          ${new Date(endTime)}, 
          ${JSON.stringify(metricsData)}
        )
        RETURNING id, start_time, end_time, metrics_data
      `;

    console.log("Session saved successfully:", result.rows[0]);

    res.status(201).json({
      message: "Session saved successfully",
      session: result.rows[0],
    });
  } catch (error) {
    console.error("Error saving session. Full error:", error);
    res.status(500).json({
      message: "Error saving session",
      error: error.message,
      details: error.toString(),
    });
  }
});

// Get user's exercise sessions with pagination
// Update this route in your server.mjs
app.get("/api/sessions", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get paginated sessions
    const result = await sql`
        SELECT id, start_time, end_time, metrics_data
        FROM exercise_sessions
        WHERE user_id = ${req.userId}
        ORDER BY start_time DESC
        LIMIT ${limit} 
        OFFSET ${offset}
      `;

    // Transform the data to match the expected format
    const formattedSessions = result.rows.map((session) => ({
      id: session.id,
      startTime: session.start_time,
      endTime: session.end_time,
      data: session.metrics_data, // This contains speed, cadence, power, calories
    }));

    console.log("Formatted sessions:", formattedSessions);

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

// Test route that doesn't require auth
app.get("/api/healthcheck", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test route that requires auth
app.get("/api/protected-test", verifyToken, (req, res) => {
  res.json({
    status: "ok",
    userId: req.userId,
    timestamp: new Date().toISOString(),
  });
});

// Add this debug route to check user data
app.get("/api/debug/user-check", verifyToken, async (req, res) => {
  try {
    console.log("Checking user:", req.userId);
    const userResult = await sql`
        SELECT id, email, name 
        FROM users 
        WHERE id = ${req.userId}
      `;

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "User not found in database",
        checkedId: req.userId,
      });
    }

    res.json({
      message: "User found",
      user: userResult.rows[0],
    });
  } catch (error) {
    console.error("Error checking user:", error);
    res.status(500).json({ message: "Error checking user" });
  }
});

// Add these endpoints to server.mjs

// Generate and store reset token
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await sql`
        SELECT id, email FROM users WHERE email = ${email}
      `;

    if (user.rows.length === 0) {
      // For security, don't reveal if email exists or not
      return res.json({
        message:
          "If an account exists with this email, you will receive a reset link.",
      });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await sql`
        UPDATE users 
        SET reset_token = ${resetToken},
            reset_token_expiry = ${resetTokenExpiry}
        WHERE email = ${email}
      `;

    // In a real app, you'd send an email here
    console.log(`Reset token for ${email}:`, resetToken);

    res.json({
      message:
        "If an account exists with this email, you will receive a reset link.",
      // Remove this in production:
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

// Reset password with token
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find user with valid reset token
    const user = await sql`
        SELECT id 
        FROM users 
        WHERE reset_token = ${token}
          AND reset_token_expiry > NOW()
      `;

    if (user.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: "Password requirements not met",
        errors: passwordValidation.errors,
      });
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await sql`
        UPDATE users 
        SET password_hash = ${passwordHash},
            reset_token = NULL,
            reset_token_expiry = NULL
        WHERE id = ${user.rows[0].id}
      `;

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
});

// Add this at the end of server.mjs
const PORT = process.env.PORT || 3001;

// Test database connection before starting server
async function testDbConnection() {
  try {
    const result = await sql`SELECT NOW()`;
    console.log("Database connection successful:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

// Start server only after testing database
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
