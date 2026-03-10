import 'dotenv/config.js';
import connectDB from '../config/database.js';
import seedDatabase from '../utils/seedDatabase.js';
import logger from '../utils/logger.js';

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
