const { MongoClient } = require('mongodb');
const { workingHours } = require('../constants');
const { getProcedureDuration } = require('../services/bookAppointmentServices/getProcedureMenu');
const deleteUnavailableTimes = require('./deleteUnavailableTimes');

// MongoDB connection string
const uri = 'mongodb://localhost:27017';

async function getAvailableTimes(date, procedure) {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db('myDatabase');
        const recordsCollection = database.collection('records');

        // Определение максимальной продолжительности процедуры
        const procedureDuration = getProcedureDuration(procedure);

        // Получение всех записей
        const allRecords = await recordsCollection.find({}).toArray();

        // Разделение записей на дату и время
        const recordsWithDateAndTime = allRecords.map((record) => {
            const date = new Date(record.date);
            const formattedDate = date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
            });
            const formattedTime = date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
            });
            return {
                date: formattedDate,
                time: formattedTime,
            };
        });

        // Фильтрация по выбранной дате
        const unavailableTimes = recordsWithDateAndTime
            .filter((record) => record.date === date)
            .map((record) => record.time);

        // Создание списка доступных времён
        let availableTimes = [];

        for (let i = workingHours.startTime; i <= workingHours.endTime; i++) {
            availableTimes.push(`${i}:00`);
        }

        // Удаление времён, недоступных из-за уже сделанных записей
        availableTimes = availableTimes.filter((time) => !unavailableTimes.includes(time));

        // Удаление времён, недоступных из-за продолжительности процедуры
        availableTimes = deleteUnavailableTimes(availableTimes, procedureDuration);

        await client.close();
        return availableTimes;
    } catch (error) {
        console.error('Ошибка получения доступных времен:', error);
        return [];
    } finally {
        await client.close();
    }
}

module.exports = getAvailableTimes;
