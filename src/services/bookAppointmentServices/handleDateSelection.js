const getUserIdFromContext = require('../../utils/getUserIdFromContext');
const { selectedAppointments } = require('./updateAppointments');
const getAvailableTimes = require('../../utils/getAvailableTimes');
const { availableTimesObj } = require('./unvailableWindows');

async function handleDateSelection(ctx) {
    const userId = getUserIdFromContext(ctx);
    const selectedProcedure = selectedAppointments[userId]?.procedure;
    const selectedDate = ctx.callbackQuery.data.split('_')[2];
    console.log(`Записана дата: ${selectedDate} для пользователя ${userId} (процедура: ${selectedProcedure})`);

    if (selectedProcedure) {
        selectedAppointments[userId] = { ...selectedAppointments[userId], date: selectedDate };

        // Получаем список доступных времен для выбранной даты и процедуры
        const availableTimes = await getAvailableTimes(selectedDate, selectedProcedure);
        availableTimes.forEach((time) => {
            const formattedTime = time.replace(':', '');
            availableTimesObj[formattedTime] = true;
        });
    } else {
        console.log('Процедура не выбрана, дата не сохранена');
    }
}

module.exports = handleDateSelection;
