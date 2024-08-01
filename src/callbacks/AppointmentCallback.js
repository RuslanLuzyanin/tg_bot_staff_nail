const Record = require('../../models/Record');
const Procedure = require('../../models/Procedure');
const moment = require('moment');

class AppointmentCallback {
    constructor(ctx) {
        this.ctx = ctx;
    }

    /**
     * Обрабатывает колбек выбора процедуры.
     *
     * Извлекает имя процедуры из callbackData и сохраняет его в сессию.
     *
     * @param {object} ctx - Контекст телеграф.
     */
    async handleSelectProcedure(ctx) {
        const procedureName = ctx.callbackQuery.data.split('_').slice(3).join('_');
        ctx.session.selectedProcedure = procedureName;
    }

    /**
     * Очищает значение процедуры в сессии.
     *
     * @param {object} ctx - Контекст телеграф.
     */
    async clearProcedure(ctx) {
        ctx.session.selectedProcedure = null;
    }

    /**
     * Обрабатывает колбек выбора месяца.
     *
     * Извлекает имя месяца из callbackData и сохраняет его в сессию.
     *
     * @param {object} ctx - Контекст телеграф.
     */
    async handleSelectMonth(ctx) {
        const month = ctx.callbackQuery.data.split('_').slice(3).join('_');
        ctx.session.selectedMonth = month;
    }

    /**
     * Очищает значение месяца в сессии.
     *
     * @param {object} ctx - Контекст телеграф.
     */
    async clearMonth(ctx) {
        ctx.session.selectedMonth = null;
    }

    /**
     * Обрабатывает колбек выбора дня.
     *
     * Извлекает имя дня из callbackData и сохраняет его в сессию.
     *
     * @param {object} ctx - Контекст телеграф.
     */
    async handleSelectDay(ctx) {
        const day = ctx.callbackQuery.data.split('_').slice(3).join('_');
        const month = ctx.session.selectedMonth;

        ctx.session.selectedDate = `${day} ${month}`;
    }

    /**
     * Очищает значение дня в сессии.
     *
     * @param {object} ctx - Контекст телеграф.
     */
    async clearDay(ctx) {
        ctx.session.selectedDate = null;
    }

    /**
     * Обрабатывает колбек выбора времени.
     *
     * Извлекает время из callbackData и сохраняет его в сессию.
     *
     * @param {object} ctx - Контекст телеграф.
     */
    async handleSelectTime(ctx) {
        const timeString = ctx.callbackQuery.data.split('_').slice(3).join('_');
        ctx.session.selectedTime = timeString;
    }

    /**
     * Очищает значение времени в сессии.
     *
     * @param {object} ctx - Контекст телеграф.
     */
    async clearTime(ctx) {
        ctx.session.selectedTime = null;
    }

    /**
     * Обрабатывает подтверждение записи на процедуру.
     *
     * Извлекает данные из сессии, сохраняет запись в базу данных и очищает сессию.
     *
     * @param {object} ctx - Контекст телеграф.
     */
    async handleConfirm(ctx) {
        const userId = ctx.session.userId;
        const selectedDate = ctx.session.selectedDate;
        const selectedTime = ctx.session.selectedTime;
        const selectedProcedureEnglishName = ctx.session.selectedProcedure;

        //Формируем нужный формат даты
        const [day, month] = selectedDate.split(' ');
        const formattedDate = `${day} ${moment(month, 'MMMM').locale('ru').format('MMM')}`;

        // Находим процедуру и получаем ее русское название и длительность
        const procedure = await Procedure.findOne({ englishName: selectedProcedureEnglishName });
        const selectedProcedure = procedure.russianName;
        const duration = procedure.duration;

        const message = `Вы записались на ${formattedDate} в ${selectedTime}, Ваша процедура - ${selectedProcedure}`;
        await ctx.reply(message);

        // Сохраняем записи в базу данных
        for (let i = 0; i < duration; i++) {
            const recordTime = moment(selectedTime, 'HH:mm').add(i, 'hours').format('HH:mm');

            const newRecord = new Record({
                userId: userId,
                date: selectedDate,
                time: recordTime,
                procedure: selectedProcedureEnglishName,
            });

            await newRecord.save();
        }

        // Очищаем сессию
        ctx.session.selectedDate = null;
        ctx.session.selectedTime = null;
        ctx.session.selectedProcedure = null;
        ctx.session.selectedMonth = null;
    }
}

module.exports = AppointmentCallback;
