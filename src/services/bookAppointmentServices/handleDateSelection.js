const getUserIdFromContext = require('../../utils/getUserIdFromContext');
const { selectedAppointments } = require('./updateAppointments');

function handleDateSelection(ctx) {
    const userId = getUserIdFromContext(ctx);
    const selectedProcedure = selectedAppointments[userId]?.procedure;
    const selectedDate = ctx.callbackQuery.data.split('_')[2];
    console.log(`Записана дата: ${selectedDate} для пользователя ${userId} (процедура: ${selectedProcedure})`);

    if (selectedProcedure) {
        selectedAppointments[userId] = { ...selectedAppointments[userId], date: selectedDate };
    } else {
        console.log('Процедура не выбрана, дата не сохранена');
    }
}

module.exports = handleDateSelection;
