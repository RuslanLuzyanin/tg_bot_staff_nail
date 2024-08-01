class MenuService {
    constructor() {
        this.buttonsPerRow = 2;
        this.menuType = 'callback';
    }
    /**
     * Проверяет входные данные и создает меню.
     *
     * @param {Array<{ text: string, callback: string | URL }>} menuData Данные для меню.
     * @returns {Array<Array<{ text: string, callback_data: string | URL }>>} Массив кнопок, сгруппированных по рядам.
     */
    createMenu(menuData) {
        if (!Array.isArray(menuData)) {
            throw new Error('MenuData должен быть массивом объектов');
        }

        const buttons = [];
        let currentRow = [];

        menuData.forEach((buttonData, index) => {
            if (!buttonData.text) {
                throw new Error('Каждый элемент MenuData должен иметь свойство text');
            }

            if (!buttonData.callback && !buttonData.url) {
                throw new Error('Каждый элемент MenuData должен иметь свойство callback или url');
            }

            let button = {
                text: buttonData.text,
            };

            if (this.menuType === 'callback') {
                button.callback_data = buttonData.callback;
            } else {
                button.url = buttonData.url;
            }

            currentRow.push(button);

            if ((index + 1) % this.buttonsPerRow === 0 || index === menuData.length - 1) {
                buttons.push(currentRow);
                currentRow = [];
            }
        });
        return buttons;
    }

    /**
     * Устанавливает количество кнопок в ряду.
     *
     * @param {number} count Количество кнопок в ряду.
     */
    setButtonsPerRow(count) {
        if (count < 1) {
            throw new Error('Количество кнопок в ряду должно быть больше 0');
        }
        this.buttonsPerRow = count;
    }

    /**
     * Устанавливает тип меню: callback или url.
     *
     * @param {string} type Тип меню: callback или url.
     */
    setMenuType(type) {
        if (type !== 'callback' && type !== 'url') {
            throw new Error('Неверный тип меню. Допустимые типы: callback или url');
        }
        this.menuType = type;
    }
}

module.exports = MenuService;
