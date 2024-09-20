const Record = require('../../database/models/record');
const Procedure = require('../../database/models/procedure');
const AvailableTimeService = require('../services/availableTimeService');
const moment = require('moment');
const { adminId, receptionAddress } = require('../../config/config');

class AppointmentCallback {
    /**
     * Обрабатывает колбек выбора слота.
     * Извлекает имя слота из callbackData и сохраняет его в сессию.
     */
    static async handleSelectSlot(ctx) {
        const { callbackQuery, session } = ctx;
        const slotName = callbackQuery.data.split('_').slice(3).join('_');
        if (slotName !== 'confirm') {
            session.selectedSlot = slotName;
        }
    }

    /**
     * Очищает выбранный слот из сессии.
     */
    static async clearSelectedSlot(ctx) {
        const { session } = ctx;
        session.selectedSlot = null;
    }

    /**
     * Обрабатывает колбек выбора процедуры.
     * Извлекает имя процедуры из callbackData и сохраняет его в сессию.
     */
    static async handleSelectProcedure(ctx) {
        const { callbackQuery, session } = ctx;
        const procedureName = callbackQuery.data.split('_').slice(3).join('_');
        session.selectedProcedure = procedureName;
    }

    /**
     * Обрабатывает колбек выбора месяца.
     * Извлекает месяц и год из callbackData и сохраняет их в сессию.
     */
    static async handleSelectMonth(ctx) {
        const { callbackQuery, session } = ctx;
        const [, , , month, year] = callbackQuery.data.split('_');
        session.selectedMonth = month;
        session.selectedYear = year;
    }

    /**
     * Обрабатывает колбек выбора дня.
     * Извлекает день, месяц и год из callbackData и сохраняет их в сессию.
     */
    static async handleSelectDay(ctx) {
        const { callbackQuery, session } = ctx;
        const [, , , dateString] = callbackQuery.data.split('_');
        const [day, month, year] = dateString.split('.');
        session.selectedDate = new Date(`${month}/${day}/${year}`);
    }

    /**
     * Обрабатывает колбек выбора времени.
     * Извлекает время из callbackData и сохраняет его в сессию.
     */
    static async handleSelectTime(ctx) {
        const { callbackQuery, session } = ctx;
        const [, , , timeString] = callbackQuery.data.split('_');
        session.selectedTime = timeString;
    }

    /**
     * Обрабатывает подтверждение записи на процедуру.
     * Извлекает данные из сессии, сохраняет запись в базу данных.
     */
    static async handleConfirm(ctx, logger, bot) {
        const { from, session } = ctx;
        const userId = from.id.toString();
        const { selectedDate, selectedTime, selectedProcedure: selectedProcedureEnglishName } = session;

        const selectedDateMoment = moment(selectedDate, 'DD.MM.YYYY');
        const formattedDate = selectedDateMoment.locale('ru').format('D MMM');

        const procedures = await Procedure.find({});
        const { duration: selectedProcedureDuration, russianName: selectedProcedureRussianName } =
            procedures.find((proc) => proc.englishName === selectedProcedureEnglishName);

        const records = await Record.find({
            date: selectedDate,
        });
        let isAvailable = true;
        let currentTime = moment(selectedTime, 'HH:mm');

        isAvailable = AvailableTimeService.checkAvailability(
            currentTime,
            records,
            selectedProcedureDuration,
            procedures
        );

        if (!isAvailable) {
            throw new Error('appointmentConflictError');
        }

        const newRecord = new Record({
            userId: userId,
            date: new Date(selectedDate),
            time: selectedTime,
            procedure: selectedProcedureEnglishName,
        });

        await newRecord.save();

        const messageData = [
            `Вы записались на ${formattedDate} в ${selectedTime},`,
            `Ваша процедура - ${selectedProcedureRussianName}.`,
            `Процедура будет проходить по адресу: ${receptionAddress}`,
            `При опоздании более чем 15 минут - запись обнуляется`,
        ].join('\n');

        await ctx.reply(messageData);

        await bot.telegram.sendMessage(
            adminId,
            `Пользователь ${from.first_name} ${from.last_name} (@${from.username}) ${from.id} создал запись на ${formattedDate}, ${selectedTime}`
        );

        logger.info(`Запись на процедуру "${selectedProcedureRussianName}" в ${selectedTime} сохранена`);
    }

    /**
     * Загружает записи пользователя из базы данных в сессию.
     */
    static async handleGetAppointments(ctx) {
        const { from, session } = ctx;
        const userId = from.id.toString();
        const records = await Record.find({ userId }).sort({
            date: 1,
            time: 1,
        });
        const appointments = records.map((record) => ({
            procedure: record.procedure,
            date: record.date,
            time: record.time,
        }));
        session.appointments = appointments;
    }

    /**
     * Обрабатывает отмену записи на процедуру.
     */
    static async handleCancel(ctx, logger, bot) {
        const { callbackQuery, from } = ctx;
        const [, , procedure, dateString, time] = callbackQuery.data.slice(1).split('_');
        const userId = from.id.toString();
        const [day, month, year] = dateString.split('.');
        const formattedDate = new Date(`${month}/${day}/${year}`);

        const recordToDelete = await Record.findOneAndDelete({
            userId,
            date: formattedDate,
            time,
            procedure,
        });

        logger.info(
            `Запись на ${recordToDelete.procedure} в ${recordToDelete.time} ${recordToDelete.date} удалена.`
        );
        await bot.telegram.sendMessage(
            adminId,
            `Пользователь ${from.first_name} ${from.last_name} (@${from.username}) ${from.id} удалил запись на ${dateString}, ${time}`
        );
        const message = await ctx.reply('Ваша запись успешно отменена.');
        setTimeout(() => ctx.deleteMessage(message.message_id), 3000);
    }
}

module.exports = AppointmentCallback;
