const getUserIdFromContext = require('../../utils/getUserIdFromContext');
const { selectedAppointments } = require('./updateAppointments');
const { MongoClient } = require('mongodb');
const prepareAppointmentData = require('../../utils/prepareAppointmentData');

const uri = 'mongodb://localhost:27017';

async function handleConfirmAppointment(ctx) {
    const userId = getUserIdFromContext(ctx);
    const { userName, date, time, procedure } = selectedAppointments[userId];
    const formattedTime = time.replace(/(\d{2})(\d{2})/, '$1:$2');
    const message = `Ваша запись подтверждена!\n\nИмя пользователя: ${userName}\nДата: ${date}\nВремя: ${formattedTime}\nПроцедура: ${procedure}`;
    ctx.editMessageText(message);

    // Подготовка данных для вставки
    const recordsToInsert = prepareAppointmentData(userName, date, formattedTime, procedure);

    // Создание записей в базе данных
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db('myDatabase');
        const recordsCollection = database.collection('records');

        await new Promise((resolve, reject) => {
            recordsCollection
                .insertMany(recordsToInsert)
                .then((result) => {
                    console.log(`${result.insertedCount} записей было успешно создано.`);
                    delete selectedAppointments[userId];
                    resolve();
                })
                .catch((error) => {
                    console.error('Ошибка при вставке записи:', error);
                    reject(error);
                });
        });
    } catch (error) {
        console.error('Ошибка подключения к MongoDB:', error);
    } finally {
        await client.close();
    }
}

module.exports = handleConfirmAppointment;
