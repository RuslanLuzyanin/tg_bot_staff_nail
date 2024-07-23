const getDateMenu = require('./getDateMenu');
const getUserIdFromContext = require('../../utils/getUserIdFromContext');
const { updateSelectedAppointments } = require('./updateAppointments');
const getUnavailableDates = require('../../utils/getUnavailableDates');
const { unavailableDatesObj } = require('./unvailableWindows');

async function handleManicureSelection(ctx) {
    const userId = getUserIdFromContext(ctx);
    const userName = ctx.from.first_name || ctx.from.username || 'Пользователь';
    updateSelectedAppointments(userId, userName, null, null, 'manicure');

    // Получаем список недоступных дат
    const newUnavailableDates = await getUnavailableDates('manicure');
    // Добавляем полученные даты в объект unavailableDates
    for (const date of newUnavailableDates) {
        unavailableDatesObj[date] = true;
    }
    // Вызываем getDateMenu с учетом недоступных дат
    const menu = getDateMenu(0, true, false, unavailableDatesObj); // Передаем unavailableDates в getDateMenu

    ctx.editMessageText('Выберите дату:', menu);
}

module.exports = handleManicureSelection;
