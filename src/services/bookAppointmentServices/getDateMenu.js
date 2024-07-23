const createMenu = require('../../utils/createMenu');
const moment = require('moment');

function getDateMenu(start, showNextDates = true, showPrevDates = false, unavailableDates = {}) {
    const menuItems = {};
    const today = moment();
    const startDate = today.clone().add(start + 1, 'days');

    for (let i = 0; i < 24; i++) {
        const date = startDate.clone().add(i, 'days').format('DD.MM');
        const callback = `select_date_${date}`;

        if (!unavailableDates[date]) {
            // Проверяем, есть ли дата в объекте unavailableDates
            menuItems[`date${i + 1}`] = {
                text: date,
                callback: callback,
            };
        } else {
            menuItems[`date${i + 1}`] = {
                text: 'Занято',
                callback: 'dummy_callback',
            };
        }
    }

    menuItems['back'] = {
        text: 'Назад',
        callback: 'back_to_procedure_menu',
    };

    if (showNextDates) {
        menuItems['next_dates'] = {
            text: 'Следующие 24 даты',
            callback: 'show_next_dates',
        };
    }

    if (showPrevDates) {
        menuItems['prev_dates'] = {
            text: 'Прошлые 24 даты',
            callback: 'show_prev_dates',
        };
    }

    return createMenu(menuItems, 4);
}

module.exports = getDateMenu;
