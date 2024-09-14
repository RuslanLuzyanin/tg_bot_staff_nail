const mongoose = require('mongoose');
const Procedure = require('../models/procedure');
const WorkingTime = require('../models/workingTime');
const { uri } = require('../../config/config');

const seedData = [
    {
        model: Procedure,
        data: [
            {
                englishName: 'manicure',
                russianName: 'Маникюр',
                duration: 3,
            },
            {
                englishName: 'pedicure',
                russianName: 'Педикюр',
                duration: 4,
            },
        ],
    },
    {
        model: WorkingTime,
        data: [
            {
                startTime: '10:00',
                endTime: '21:00',
            },
        ],
    },
];

const seed = async () => {
    await Procedure.deleteMany();
    await WorkingTime.deleteMany();

    for (const { model, data } of seedData) {
        await model.create(data);
    }

    console.log('Database seeded successfully.');
    process.exit(0);
};

mongoose
    .connect(uri)
    .then(seed)
    .catch((err) => {
        console.error('Error connecting to database:', err);
        process.exit(1);
    });
