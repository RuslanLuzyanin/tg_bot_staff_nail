const moment = require('moment');

class GetSlotHoursService {
    /**
     * Получить начальное и конечное время выбранного слота.
     *
     * @param {string} slotType - Тип слота, может быть 'morning', 'day', 'evening'.
     * @param {string} startTime - Время начала рабочих часов в формате 'HH:mm'.
     * @param {string} endTime - Время окончания рабочих часов в формате 'HH:mm'.
     * @returns {[moment, moment]} - Массив, содержащий начальное и конечное время выбранного слота.
     */
    static getSlotHours(slotType, startTime, endTime) {
        const start = moment(startTime, 'HH:mm');
        const end = moment(endTime, 'HH:mm');

        switch (slotType) {
            case 'morning':
                return [start, start.clone().add(3, 'hours')];
            case 'day':
                return [
                    start.clone().add(3, 'hours'),
                    start.clone().add(6, 'hours'),
                ];
            case 'evening':
                return [start.clone().add(6, 'hours'), end];
            default:
                return [start, end];
        }
    }
}

module.exports = GetSlotHoursService;
