const createMenu = require('../../utils/createMenu');
const { workingHours } = require('../../constants');

function getTimeMenu(availableTimesObj = {}) {
    const menuItems = {};
    let count = 1;

    for (let i = workingHours.startTime; i <= workingHours.endTime; i += 3) {
        for (let j = 0; j < 3; j++) {
            let time = `${i + j}:00`;
            // Добавляем ведущий ноль, если час меньше 10
            if (i + j < 10) {
                time = `0${i + j}:00`;
            }
            const formattedTime = time.replace(':', '');
            // Проверяем, доступно ли это время
            if (availableTimesObj[formattedTime]) {
                // Если доступно, создаем кнопку с уникальным колбеком
                menuItems[`time${count}`] = {
                    text: time,
                    callback: `select_time_${formattedTime}`,
                };
            } else {
                // Если занято, создаем кнопку "Занято" с думми колбеком
                menuItems[`time${count}`] = {
                    text: 'Занято',
                    callback: 'dummy_callback',
                };
            }

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
