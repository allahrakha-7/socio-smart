import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Resident from './src/models/residentModel.js';

dotenv.config();

const checkRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const total = await Resident.countDocuments({});
    const residents = await Resident.countDocuments({ role: 'resident' });
    const admins = await Resident.countDocuments({ role: 'admin' });
    const guards = await Resident.countDocuments({ role: 'guard' });

    console.log('Database Stats:');
    console.log(`Total Users: ${total}`);
    console.log(`Residents: ${residents}`);
    console.log(`Admins: ${admins}`);
    console.log(`Guards: ${guards}`);

    const sample = await Resident.find({ role: 'resident' }).select('full_name role').limit(10);
    console.log('\nSample Residents:');
    console.log(sample);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkRoles();
