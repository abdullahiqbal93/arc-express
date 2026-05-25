/**
 * Database seeder.
 * Usage: node src/db/seed.js
 *
 * Add your seed logic below.
 */

import sequelize from "../lib/db/connect.js";
import { mainLogger } from "../lib/logger/winston.js";

async function seed() {
  try {
    mainLogger.info("Seeding database...");
    // Add seed logic here
    mainLogger.info("Seeding complete.");
  } catch (error) {
    mainLogger.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
