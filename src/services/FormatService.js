class FormatService {
    constructor() {}

    /**
     * Преобразует строку в формат, где каждое слово начинается с заглавной буквы.
     *
     * @param {string} str Строка для форматирования.
     * @returns {string} Строка с заглавными буквами в начале каждого слова.
     */
    capitalizeFirstLetter(str) {
        return str.toLowerCase().replace(/(?:^|\s)\S/g, function (a) {
            return a.toUpperCase();
        });
    }
}

module.exports = FormatService;
