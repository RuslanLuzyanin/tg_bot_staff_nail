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
        // Разбиваем начало и конец работы на часы
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);

        // Формируем список доступных часов
        const availableTimes = [];
        for (let hour = startHour; hour <= endHour; hour++) {
            const timeString = `${hour.toString().padStart(2, '0')}:00`;
            if (!occupiedTimes.includes(timeString)) {
                availableTimes.push(timeString);
            }
        }

        // Разбиваем список доступных часов на отрезки, соответствующие длительности процедуры
        const result = [];
        for (let i = 0; i < availableTimes.length; i++) {
            if (i + procedureDuration - 1 < availableTimes.length) {
                let isConsecutive = true;
                for (let j = 1; j < procedureDuration; j++) {
                    const nextTimeParts = availableTimes[i + j].split(':');
                    const nextHours = parseInt(nextTimeParts[0], 10);
                    if (nextHours !== parseInt(availableTimes[i].split(':')[0], 10) + j) {
                        isConsecutive = false;
                        break;
                    }
                }
                if (isConsecutive) {
                    result.push(availableTimes[i]);
                }
            }
        }

        return result;
    }
}

module.exports = FilterService;
