import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Announcement from './src/models/announcementModel.js';

dotenv.config();

const seedAnnouncements = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const sampleAnnouncements = [
            {
                title: 'Summer Festival 2026',
                content: 'Join us for the annual society summer festival this weekend at the main park!',
                priority: 'high',
                createdBy: '69dbe91ef143bc04781665a3' // Using existing admin ID from previous runs
            },
            {
                title: 'New Gym Equipment',
                content: 'We have upgraded the community center gym with state-of-the-art weights and treadmills.',
                priority: 'medium',
                createdBy: '69dbe91ef143bc04781665a3'
            },
            {
                title: 'Water Tank Cleaning',
                content: 'Maintenance will be cleaning the main water tanks on Tuesday. Water supply will be interrupted between 10 AM and 2 PM.',
                priority: 'high',
                createdBy: '69dbe91ef143bc04781665a3'
            }
        ];

        await Announcement.deleteMany({});
        await Announcement.insertMany(sampleAnnouncements);
        console.log('Announcements seeded successfully');
        process.exit();
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedAnnouncements();
