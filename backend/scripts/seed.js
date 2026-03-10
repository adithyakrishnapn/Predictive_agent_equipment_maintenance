require('dotenv').config();
const connectDB = require('../config/database');
const seedDatabase = require('../utils/seedDatabase');
const logger = require('../utils/logger');

const runSeeder = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Run seeder
    const result = await seedDatabase();
    
    logger.info('Seeding Summary:', result);
    
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
};

runSeeder();
