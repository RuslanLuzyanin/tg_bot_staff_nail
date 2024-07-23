const getUserIdFromContext = require('../../utils/getUserIdFromContext');
const { selectedAppointments } = require('./updateAppointments');
const { procedures } = require('../../constants');

function handleTimeSelection(ctx) {
    const userId = getUserIdFromContext(ctx);
    const selectedProcedure = selectedAppointments[userId]?.procedure;
    const date = selectedAppointments[userId]?.date;
    const selectedTime = ctx.callbackQuery.data.split('_')[2];
    const formattedTime = selectedTime.replace(/(\d{2})(\d{2})/, '$1:$2');
    console.log(
        `Записано время: ${formattedTime} для пользователя ${userId} (процедура: ${selectedProcedure}, дата: ${date})`
    );

    if (selectedProcedure && date) {
        selectedAppointments[userId] = { ...selectedAppointments[userId], time: selectedTime };
        const { userName } = selectedAppointments[userId];
        const procedureName = procedures[selectedProcedure]?.text || selectedProcedure;
        const confirmationMessage = `Подтвердите запись:\n\nИмя пользователя: ${userName}\nДата: ${date}\nВремя: ${formattedTime}\nПроцедура: ${procedureName}`;
        return confirmationMessage;
    } else {
        console.log('Процедура или дата не выбраны, время не сохранено');
        return null;
    }
}

module.exports = handleTimeSelection;
