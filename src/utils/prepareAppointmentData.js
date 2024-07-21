const { getProcedureDuration } = require('../services/bookAppointmentServices/getProcedureMenu');

function prepareAppointmentData(userName, date, time, procedure) {
    const procedureDuration = getProcedureDuration(procedure);
    const recordsToInsert = [];

    const timeParts = time.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    const dateParts = date.split('.');
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const currentYear = new Date().getFullYear();
    let year = currentYear; // Изначально устанавливаем год как текущий

    // Проверка на переход в следующий год
    if (month < new Date().getMonth() && day < new Date().getDate()) {
        year = currentYear + 1;
    }

    for (let i = 0; i < procedureDuration; i++) {
        const newDate = new Date(year, month, day, hours + i, minutes, 0, 0);
        recordsToInsert.push({
            user: userName,
            date: newDate.toISOString(),
            procedure: procedure,
        });
    }

    return recordsToInsert;
}

module.exports = prepareAppointmentData;
