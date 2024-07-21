const createMenu = require('../../utils/createMenu');

function getConfirmMenu() {
    const menuItems = {
        confirm: {
            text: 'Подтвердить',
            callback: 'confirm_appointment',
        },
        back: {
            text: 'Назад',
            callback: 'back_to_time_menu',
        },
    };
    return createMenu(menuItems);
}

module.exports = getConfirmMenu;
