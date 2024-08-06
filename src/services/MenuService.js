class MenuService {
    /**
     * Проверяет входные данные и создает меню.
     *
     * @param {Array<{ text: string, callback: string | URL }>} menuData Данные для меню.
     * @param {number} [buttonsPerRow=2] Количество кнопок в ряду.
     * @param {string} [menuType='callback'] Тип меню: 'callback' или 'url'.
     * @returns {Array<Array<{ text: string, callback_data: string | URL }>>} Массив кнопок, сгруппированных по рядам.
     */
    static createMenu(menuData, buttonsPerRow = 2, menuType = 'callback') {
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

            if (menuType === 'callback') {
                button.callback_data = buttonData.callback;
            } else {
                button.url = buttonData.url;
            }

            currentRow.push(button);

            if ((index + 1) % buttonsPerRow === 0 || index === menuData.length - 1) {
                buttons.push(currentRow);
                currentRow = [];
            }
        });
        return buttons;
    }
}

module.exports = MenuService;
