const createMenu = require('../../utils/createMenu');
const { procedures } = require('../../constants');

function getProcedureMenu() {
    const menuItems = {};
    Object.keys(procedures).forEach((key) => {
        const procedure = procedures[key];
        menuItems[key] = {
            text: procedure.text,
            callback: `select_${key}`,
        };
    });
    menuItems['back'] = { text: 'Назад', callback: 'back_to_main_menu' };
    return createMenu(menuItems);
}
// Функция для получения длительности процедуры
function getProcedureDuration(procedure) {
    return procedures[procedure]?.duration || 0;
}

module.exports = { getProcedureMenu, getProcedureDuration };
