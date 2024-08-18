const _ = require('lodash');

class MenuService {
    /**
     * Создает меню.
     *
     * @param {Array<{ text: string, callback: string | URL }>} menuData Данные для меню.
     * @param {number} [buttonsPerRow=2] Количество кнопок в ряду.
     * @param {string} [menuType='callback'] Тип меню: 'callback' или 'url'.
     * @returns {Array<Array<{ text: string, callback_data: string | URL }>>} Массив кнопок, сгруппированных по рядам.
     */
    static createMenu(menuData, buttonsPerRow = 2, menuType = 'callback') {
        this.validateMenuData(menuData);

        const buttons = menuData.map((buttonData) => {
            const button = {
                text: buttonData.text,
            };

            if (menuType === 'callback') {
                button.callback_data = buttonData.callback;
            } else {
                button.url = buttonData.url;
            }

            return button;
        });

        return _.chunk(buttons, buttonsPerRow);
    }

    /**
     * Проверяет входные данные для меню.
     *
     * @param {Array<{ text: string, callback: string | URL }>} menuData Данные для меню.
     */
    static validateMenuData(menuData) {
        if (!Array.isArray(menuData)) {
            throw { code: 'validateMenuDataMassiveError' };
        }

        for (const buttonData of menuData) {
            if (!buttonData.text) {
                throw { code: 'validateMenuDataTextError' };
            }

            if (!buttonData.callback && !buttonData.url) {
                throw { code: 'validateMenuDataCallbackError' };
            }
        }
    }
}

module.exports = MenuService;
