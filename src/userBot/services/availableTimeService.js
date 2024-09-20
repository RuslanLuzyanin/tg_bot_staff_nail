const moment = require('moment');

class AvailableTimeService {
    /**
     * Получает список доступных временных интервалов с учетом занятости.
     *
     * @param {Object} params - Параметры для получения доступных временных интервалов.
     * @param {string} params.slotStartTime - Начало слота в формате "HH:mm".
     * @param {string} params.slotEndTime - Конец слота в формате "HH:mm".
     * @param {Record[]} params.records - Список записей на выбранную дату.
     * @param {number} params.procedureDuration - Длительность процедуры в часах.
     * @param {Procedure[]} params.procedures - Список процедур.
     * @returns {string[]} - Список доступных временных интервалов.
     */
    static getAvailableTimes(params) {
        const { slotStartTime, slotEndTime, records, procedureDuration, procedures } = params;
        const availableTimes = [];
        let currentTime = moment(slotStartTime, 'HH:mm');

        while (currentTime.isBefore(moment(slotEndTime, 'HH:mm'))) {
            const currentTimeString = currentTime.format('HH:mm');
            let isAvailable = true;

            isAvailable = AvailableTimeService.checkAvailability(
                currentTime,
                records,
                procedureDuration,
                procedures
            );

            if (currentTime.clone().add(procedureDuration, 'hours').isAfter(moment(slotEndTime, 'HH:mm'))) {
                isAvailable = false;
            }

            if (isAvailable) {
                availableTimes.push(currentTimeString);
            }

            currentTime.add(15, 'minutes');
        }

        return availableTimes;
    }

    /**
     * Проверяет, доступно ли время для новой записи.
     *
     * @param {moment.Moment} currentTime - Текущее время.
     * @param {Record[]} records - Список записей на выбранную дату.
     * @param {number} procedureDuration - Длительность процедуры в часах.
     * @param {Procedure[]} procedures - Список процедур.
     * @returns {boolean} - Флаг, указывающий, доступно ли время для новой записи.
     */
    static checkAvailability(currentTime, records, procedureDuration, procedures) {
        let isAvailable = true;

        for (const record of records) {
            const procedure = procedures.find((proc) => proc.englishName === record.procedure);
            const recordStartTime = moment(record.time, 'HH:mm');
            const recordEndTime = moment(record.time, 'HH:mm').add(procedure.duration, 'hours');

            if (
                currentTime.isBetween(recordStartTime, recordEndTime, 'minute', '[)') ||
                currentTime
                    .clone()
                    .add(procedureDuration, 'hours')
                    .isBetween(recordStartTime, recordEndTime, 'minute', '()')
            ) {
                isAvailable = false;
                break;
            }
        }

        return isAvailable;
    }
}

module.exports = AvailableTimeService;
