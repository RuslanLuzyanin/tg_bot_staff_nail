const getDateMenu = require('./getDateMenu');
const getUserIdFromContext = require('../../utils/getUserIdFromContext');
const { updateSelectedAppointments } = require('./updateAppointments');

function handlePedicureSelection(ctx) {
    const userId = getUserIdFromContext(ctx);
    const userName = ctx.from.first_name || ctx.from.username || 'Пользователь';
    updateSelectedAppointments(userId, userName, null, null, 'pedicure');
    ctx.editMessageText('Выберите дату:', getDateMenu(0));
}

module.exports = handlePedicureSelection;
