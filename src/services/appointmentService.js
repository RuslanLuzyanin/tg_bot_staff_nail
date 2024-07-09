const { Markup } = require('telegraf');

const AVAILABLE_APPOINTMENTS = {
    Маникюр: 3,
    Педикюр: 4,
};

const workingHours = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

function getProcedureButtons() {
    let buttons = [];
    for (const procedure in AVAILABLE_APPOINTMENTS) {
        buttons.push(
            Markup.button.callback(
                `${procedure} - ${AVAILABLE_APPOINTMENTS[procedure]} часа`,
                `book_${procedure.toLowerCase()}`
            )
        );
    }
    buttons.push(Markup.button.callback('Назад', 'back_to_menu'));
    return Markup.inlineKeyboard(buttons);
}

function getTimeButtons() {
    let timeButtons = [];
    for (let i = 0; i < workingHours.length; i += 4) {
        let timeRow = workingHours.slice(i, i + 4).map((time) => Markup.button.callback(time, `book_time_${time}`));
        timeButtons.push(timeRow);
    }
    timeButtons.push([Markup.button.callback('Назад', 'back_to_date')]);
    return Markup.inlineKeyboard(timeButtons);
}

module.exports = {
    getProcedureButtons,
    getTimeButtons,
    workingHours,
    AVAILABLE_APPOINTMENTS,
};
