class MenuService {
    /**
     * Проверяет входные данные для меню.
     *
     * @param {Array<{ text: string, callback: string | URL }>} menuData Данные для меню.
     */
    static validateMenuData(menuData) {
        if (!Array.isArray(menuData)) {
            throw new Error('MenuData должен быть массивом объектов');
        }

        for (const buttonData of menuData) {
            if (!buttonData.text) {
                throw new Error(
                    'Каждый элемент MenuData должен иметь свойство text'
                );
            }

            if (!buttonData.callback && !buttonData.url) {
                throw new Error(
                    'Каждый элемент MenuData должен иметь свойство callback или url'
                );
            }
        }
    }

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

        return this.chunk(buttons, buttonsPerRow);
    }

    /**
     * Разбивает массив на чанки заданного размера.
     *
     * @param {Array} array Массив для разбиения.
     * @param {number} size Размер чанка.
     * @returns {Array<Array>} Массив чанков.
     */
    static chunk(array, size) {
        return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
            array.slice(i * size, (i + 1) * size)
        );
    }
}

module.exports = MenuService;
