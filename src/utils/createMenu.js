const { Markup } = require('telegraf');

/**
 * Создает меню для Telegram бота.
 * @param {Object} menuItems - Объект с элементами меню.
 * @param {number} columns - Количество столбцов в меню.
 * @returns {Markup} - Меню для отправки в Telegram.
 */
function createMenu(menuItems, columns = 2) {
    const buttons = Object.keys(menuItems).map((key) => {
        const item = menuItems[key];
        return Markup.button.callback(item.text, item.callback);
    });

    return Markup.inlineKeyboard(buttons, { columns });
}

module.exports = createMenu;
