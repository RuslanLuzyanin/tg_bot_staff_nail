const mongoose = require('mongoose');
const {Procedure, WorkingTime, GroupProcedure} = require('../models/index');
const {uri} = require('../../config/config');

const seedData = [
    {
        model: Procedure,
        data: [
            {
                englishName: 'off',
                russianName: 'Выходной',
                duration: 12,
                price: 0,
            },
            {
                englishName: 'manicure1',
                russianName: 'без покрытия',
                duration: 1,
                price: 1000,
            },
            {
                englishName: 'manicure2',
                russianName: 'Базовый',
                duration: 2.5,
                price: 2000,
            },
            {
                englishName: 'manicure3',
                russianName: 'Стандарт',
                duration: 2.75,
                price: 2200,
            },
            {
                englishName: 'manicure4',
                russianName: 'Премиум',
                duration: 3,
                price: 2400,
            },
            {
                englishName: 'extensions1',
                russianName: 'Классика',
                duration: 3.5,
                price: 2600,
            },
            {
                englishName: 'extensions2',
                russianName: 'Макси',
                duration: 3.75,
                price: 3000,
            },
            {
                englishName: 'pedicure1',
                russianName: 'Комфорт',
                duration: 1.5,
                price: 1400,
            },
            {
                englishName: 'pedicure2',
                russianName: 'Смарт',
                duration: 1.5,
                price: 1800,
            },
            {
                englishName: 'pedicure3',
                russianName: 'Комфорт цвет',
                duration: 2,
                price: 2000,
            },
            {
                englishName: 'pedicure4',
                russianName: 'Смарт цвет',
                duration: 2,
                price: 2400,
            },
        ],
    },
    {
        model: GroupProcedure,
        data: [
            {
                englishName: 'manicure',
                russianName: 'Маникюр',
            },
            {
                englishName: 'extensions',
                russianName: 'Наращивание',
            },
            {
                englishName: 'pedicure',
                russianName: 'Педикюр',
            },
        ],
    },
    {
        model: WorkingTime,
        data: [
            {
                startTime: '10:00',
                endTime: '19:00',
            },
        ],
    },
];

const seed = async () => {
    for (const {model, data} of seedData) {
        await model.deleteMany({});
        console.log(`All data deleted for model: ${model.modelName}`);

        for (const item of data) {
            await model.create(item);
            console.log(`Data added for model: ${model.modelName}, item:`, item);
        }
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
