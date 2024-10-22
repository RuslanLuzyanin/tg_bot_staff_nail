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
    static getSlotHours(slotName, startTime, endTime, procedureDuration) {
        const slotStartHour = parseInt(startTime.split(':')[0]);
        const slotStartMinute = parseInt(startTime.split(':')[1]);
        const slotEndHour = parseInt(endTime.split(':')[0]);
        const slotEndMinute = parseInt(endTime.split(':')[1]);

        switch (slotName) {
            case 'morning':
                return [
                    moment().set({ hour: slotStartHour, minute: slotStartMinute }),
                    moment()
                        .set({ hour: slotStartHour + 3, minute: slotStartMinute })
                        .add(procedureDuration, 'hours'),
                ];
            case 'day':
                return [
                    moment().set({ hour: slotStartHour + 3, minute: slotStartMinute }),
                    moment()
                        .set({ hour: slotEndHour - 3, minute: slotEndMinute })
                        .add(procedureDuration, 'hours'),
                ];
            case 'evening':
                return [
                    moment().set({ hour: slotEndHour - 3, minute: slotEndMinute }),
                    moment()
                        .set({ hour: slotEndHour, minute: slotEndMinute })
                        .add(procedureDuration, 'hours'),
                ];
            default:
                return [
                    moment().set({ hour: slotStartHour, minute: slotStartMinute }),
                    moment()
                        .set({ hour: slotEndHour, minute: slotEndMinute })
                        .add(procedureDuration, 'hours'),
                ];
        }
    }
}

module.exports = GetSlotHoursService;
