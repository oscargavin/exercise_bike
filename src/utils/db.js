import { createClient } from "@vercel/postgres";

// Create a function to get a client with automatic reconnection
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

export default client;
