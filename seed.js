const mongoose = require('mongoose');
const Procedure = require('./models/Procedure');
const Portfolio = require('./models/Portfolio');
const WorkingTime = require('./models/WorkingTime');
const config = require('./src/Config');

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
        model: Portfolio,
        data: [
            {
                imageUrl:
                    'https://sun9-41.userapi.com/impg/5fFuzZ2zcuwKhfAjWBWD-Agd_G1J8JM-E3uPMQ/zqqgW3aSaew.jpg?size=1619x2160&quality=95&sign=9a51c579969a40682d41b8342e71bbde&type=album',
                procedure: 'manicure',
            },
            {
                imageUrl:
                    'https://sun9-1.userapi.com/impg/ORnB-yxR9jUB2hSNh7l9BG1dxRPzjV2vslpMiw/jLET9R9eMxc.jpg?size=1620x2160&quality=95&sign=8de682080daba447a859007094146170&type=album',
                procedure: 'manicure',
            },
            {
                imageUrl:
                    'https://sun9-18.userapi.com/impg/CO7gDMtxwnwLp8xgjBj-8bPYb_9YDEJ0VKvBiw/K_jzWPvN8NI.jpg?size=1620x2160&quality=95&sign=add388f78a25f2e50e011cb10f4c8154&type=album',
                procedure: 'pedicure',
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
    await Portfolio.deleteMany();
    await WorkingTime.deleteMany();

    for (const { model, data } of seedData) {
        await model.create(data);
    }

    console.log('Database seeded successfully.');
    process.exit(0);
};

mongoose
    .connect(config.uri)
    .then(seed)
    .catch((err) => {
        console.error('Error connecting to database:', err);
        process.exit(1);
    });
