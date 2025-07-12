// server.js
const app = require("./src/app");
const config = require("./src/config");
const logger = require("./src/utils/logger");

const PORT = config.port || 3001;

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

module.exports = server;
