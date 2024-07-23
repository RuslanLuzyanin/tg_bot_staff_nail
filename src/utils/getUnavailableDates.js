const { MongoClient } = require('mongodb');
const { workingHours } = require('../constants');
const { getProcedureDuration } = require('../services/bookAppointmentServices/getProcedureMenu');

// MongoDB connection string
const uri = 'mongodb://localhost:27017';

// Функция для форматирования даты
function formatDate(date) {
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

async function getUnavailableDates(procedure) {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db('myDatabase');
        const recordsCollection = database.collection('records');

        // Определение максимальной продолжительности процедуры
        const maxProcedureDuration = getProcedureDuration(procedure);

        const unavailableDates = [];

        // Получаем все записи из коллекции
        const records = await recordsCollection.find({}).toArray();

        // Подсчет записей на каждый день
        const dateCounts = {};
        records.forEach((record) => {
            const date = formatDate(new Date(record.date));
            if (dateCounts[date]) {
                dateCounts[date]++;
            } else {
                dateCounts[date] = 1;
            }
        });

        // Проверка, достаточно ли свободного времени в каждом дне
        for (const date in dateCounts) {
            // Проверяем, достаточно ли свободного времени в этот день
            const availableHours = workingHours.endTime - workingHours.startTime - maxProcedureDuration;
            if (dateCounts[date] >= availableHours) {
                unavailableDates.push(date);
            }
        }

        await client.close();
        return unavailableDates;
    } catch (error) {
        console.error('Ошибка получения недоступных дат:', error);
        return [];
    } finally {
        await client.close();
    }
}

module.exports = getUnavailableDates;
