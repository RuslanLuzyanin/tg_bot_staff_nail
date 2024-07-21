const createMenu = require('../../utils/createMenu');

const startTime = 10;
const endTime = 20;

function getTimeMenu() {
    const menuItems = {};
    let count = 1;

    for (let i = startTime; i <= endTime; i += 3) {
        for (let j = 0; j < 3; j++) {
            let time = `${i + j}:00`;
            // Добавляем ведущий ноль, если час меньше 10
            if (i + j < 10) {
                time = `0${i + j}:00`;
            }
            const formattedTime = time.replace(':', '');
            menuItems[`time${count}`] = {
                text: time,
                callback: `select_time_${formattedTime}`,
            };
            count++;
        }
    }

    menuItems['back'] = {
        text: 'Назад',
        callback: 'back_to_date_menu',
    };

    return createMenu(menuItems, 3);
}

module.exports = getTimeMenu;
