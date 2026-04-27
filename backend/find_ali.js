import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Resident from './src/models/residentModel.js';
import Admin from './src/models/adminModel.js';

dotenv.config();

const findAli = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const residentAli = await Resident.findOne({ full_name: /Ali Murtaza/i });
    const adminAli = await Admin.findOne({ full_name: /Ali Murtaza/i });

    if (residentAli) {
      console.log('Found Ali Murtaza in RESIDENTS collection:');
      console.log(residentAli);
    } else {
      console.log('Ali Murtaza NOT found in residents.');
    }

    if (adminAli) {
      console.log('Found Ali Murtaza in ADMINS collection:');
      console.log(adminAli);
    } else {
      console.log('Ali Murtaza NOT found in admins.');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

findAli();
