const getDateMenu = require('./getDateMenu');
const getUserIdFromContext = require('../../utils/getUserIdFromContext');
const { updateSelectedAppointments } = require('./updateAppointments');

function handleManicureSelection(ctx) {
    const userId = getUserIdFromContext(ctx);
    const userName = ctx.from.first_name || ctx.from.username || 'Пользователь';
    updateSelectedAppointments(userId, userName, null, null, 'manicure');
    ctx.editMessageText('Выберите дату:', getDateMenu(0));
}

module.exports = handleManicureSelection;
