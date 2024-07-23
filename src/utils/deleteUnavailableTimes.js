function deleteUnavailableTimes(availableTimes, procedureDuration) {
    const result = [];

    for (let i = 0; i < availableTimes.length; i++) {
        // Проверяем, есть ли достаточно элементов для отрезка
        if (i + procedureDuration - 1 < availableTimes.length) {
            // Проверяем, являются ли элементы последовательными
            let isConsecutive = true;
            for (let j = 1; j < procedureDuration; j++) {
                const nextTimeParts = availableTimes[i + j].split(':');
                const nextHours = parseInt(nextTimeParts[0], 10);
                if (nextHours !== parseInt(availableTimes[i].split(':')[0], 10) + j) {
                    isConsecutive = false;
                    break;
                }
            }

            // Если элементы последовательные, добавляем первый элемент в результат
            if (isConsecutive) {
                result.push(availableTimes[i]);
            }
        }
    }

    return result;
}

module.exports = deleteUnavailableTimes;
