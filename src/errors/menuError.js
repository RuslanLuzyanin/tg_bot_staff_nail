const CustomError = require('./CustomError');

class MenuError extends CustomError {
    constructor(code, ...params) {
        super(code, MenuError.ERRORS[code], ...params);
    }
}

MenuError.ERRORS = {
    validateMenuDataMassiveError: 'MenuData должен быть массивом объектов',
    validateMenuDataTextError:
        'Каждый элемент MenuData должен иметь свойство text',
    validateMenuDataCallbackError:
        'Каждый элемент MenuData должен иметь свойство callback или url',
};

module.exports = MenuError;
