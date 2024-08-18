const moment = require('moment');

class FilterService {
    /**
     * Фильтрует список доступных временных интервалов, удаляя занятые слоты и разбивая доступные на отрезки.
     *
     * @param {string} startTime - Начальное время работы (например, "10:00").
     * @param {string} endTime - Конечное время работы (например, "21:00").
     * @param {string[]} occupiedTimes - Список занятых временных интервалов (например, ["12:00", "13:00"]).
     * @param {number} procedureDuration - Длительность процедуры в часах.
     * @returns {string[]} - Список доступных временных интервалов, разбитых на отрезки, соответствующие длительности процедуры.
     */
    static filterAvailableTimes(params) {
        const { startTime, endTime, occupiedTimes, procedureDuration } = params;
        const occupiedTimesMap = new Map(
            occupiedTimes.map((time) => [time, true])
        );
        const availableTimes = this.generateAvailableTimes(
            startTime,
            endTime,
            occupiedTimesMap
        );
        return this.chunkAvailableTimes(availableTimes, procedureDuration);
    }

    static *generateAvailableTimes(startTime, endTime, occupiedTimesMap) {
        const start = moment(startTime, 'HH:mm');
        const end = moment(endTime, 'HH:mm');

        while (start.isBefore(end)) {
            const timeString = start.format('HH:mm');
            if (!occupiedTimesMap.get(timeString)) {
                yield timeString;
            }
            start.add(1, 'hour');
        }
    }

    static chunkAvailableTimes(availableTimes, procedureDuration) {
        const sortedTimes = [...availableTimes].sort();
        const result = [];

        for (let i = 0; i < sortedTimes.length; i++) {
            if (i + procedureDuration - 1 < sortedTimes.length) {
                let isConsecutive = true;
                for (let j = 1; j < procedureDuration; j++) {
                    const nextTimeParts = sortedTimes[i + j].split(':');
                    const nextHours = parseInt(nextTimeParts[0], 10);
                    if (
                        nextHours !==
                        parseInt(sortedTimes[i].split(':')[0], 10) + j
                    ) {
                        isConsecutive = false;
                        break;
                    }
                }
                if (isConsecutive) {
                    result.push(sortedTimes[i]);
                }
            }
        }

        return result;
    }
}

module.exports = FilterService;
