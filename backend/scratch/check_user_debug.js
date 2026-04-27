import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import Resident from '../src/models/residentModel.js';
import Admin from '../src/models/adminModel.js';
import Guard from '../src/models/guardModel.js';

const searchAnywhere = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const term = /Ali/i;
        
        const r = await Resident.find({ full_name: term });
        const a = await Admin.find({ full_name: term });
        const g = await Guard.find({ full_name: term });

        console.log('Results for Ali:');
        console.log('Residents:', r.map(u => ({ id: u._id, email: u.email, role: 'resident' })));
        console.log('Admins:', a.map(u => ({ id: u._id, email: u.email, role: 'admin' })));
        console.log('Guards:', g.map(u => ({ id: u._id, email: u.email, role: 'guard' })));

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
};

searchAnywhere();
