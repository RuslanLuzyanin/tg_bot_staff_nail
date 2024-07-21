const createMenu = require('../../utils/createMenu');
const procedures = {
    manicure: { text: 'Маникюр', callback: 'select_manicure', duration: 3 },
    pedicure: { text: 'Педикюр', callback: 'select_pedicure', duration: 4 },
};

function getProcedureMenu() {
    const menuItems = {};
    Object.keys(procedures).forEach((key) => {
        menuItems[key] = { text: procedures[key].text, callback: procedures[key].callback };
    });
    menuItems['back'] = { text: 'Назад', callback: 'back_to_main_menu' };
    return createMenu(menuItems);
}
// Функция для получения длительности процедуры
function getProcedureDuration(procedure) {
    return procedures[procedure]?.duration || 0;
}

module.exports = { getProcedureMenu, getProcedureDuration };
