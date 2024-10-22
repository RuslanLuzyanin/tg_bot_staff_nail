const mongoose = require('mongoose');
const Procedure = require('../models/procedure');
const WorkingTime = require('../models/workingTime');
const { uri } = require('../../config/config');

const seedData = [
    {
        model: Procedure,
        data: [
            {
                englishName: 'manicure1',
                russianName: 'Без покрытия',
                duration: 1,
            },
            {
                englishName: 'manicure2',
                russianName: 'Маникюр S',
                duration: 2.5,
            },
            {
                englishName: 'manicure3',
                russianName: 'Маникюр M',
                duration: 2.75,
            },
            {
                englishName: 'manicure4',
                russianName: 'Маникюр L',
                duration: 3,
            },
            {
                englishName: 'extensions1',
                russianName: 'Наращивание M',
                duration: 3.5,
            },
            {
                englishName: 'extensions2',
                russianName: 'Наращивание L',
                duration: 3.75,
            },
            {
                englishName: 'pedicure1',
                russianName: 'Без покрытия пальчики',
                duration: 1.5,
            },
            {
                englishName: 'pedicure2',
                russianName: 'Без покрытия пальчики + пяточки',
                duration: 1.5,
            },
            {
                englishName: 'pedicure3',
                russianName: 'С покрытием пальчики',
                duration: 2,
            },
            {
                englishName: 'pedicure4',
                russianName: 'С покрытием пальчики + пяточки',
                duration: 2,
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
