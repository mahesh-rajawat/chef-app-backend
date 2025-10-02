const path = require('path');
const fs = require('fs-extra');
const strapiFactory = require('@strapi/strapi');

const seedScript = require('./seed.js');

async function runSeed() {
  // Check if the database file exists for SQLite
  const dbFile = path.join(__dirname, '..', '.tmp', 'data.db');
  if (fs.existsSync(dbFile)) {
    console.log('Existing database found. Seeding will add new content without deleting.');
  }

  // --- THE FIX: Use the new Strapi factory function to create and load an instance ---
  const strapi = await strapiFactory({ 
    appDir: path.resolve(__dirname, '..'),
    // Suppress server startup logs for a cleaner script output
    logLevel: 'silent', 
  }).load();
  // ---------------------------------------------------------------------------------
  
  try {
    // Pass the strapi instance to the seed function
    await seedScript.seed(strapi);
    console.log('Seed script completed successfully.');
  } catch (error) {
    console.error('Seed script failed:', error);
  } finally {
    // Clean up and close the connection
    await strapi.destroy();
    process.exit(0);
  }
}

runSeed();