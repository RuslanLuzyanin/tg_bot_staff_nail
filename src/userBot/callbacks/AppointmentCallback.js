const {Record, Procedure} = require('../../database/models/index');

const AvailableTimeService = require('../services/availableTimeService');

const moment = require('moment');
const {adminId, receptionAddress} = require('../../config/config');

class AppointmentCallback {
    /**
     * Обрабатывает колбек выбора слота.
     * Извлекает имя слота из callbackData и сохраняет его в сессию.
     */
    static async handleSelectSlot(ctx) {
        const {callbackQuery, session} = ctx;
        const slotName = callbackQuery.data.split('_').slice(3).join('_');
        if (slotName !== 'confirm') {
            session.selectedSlot = slotName;
        }
    }

    /**
     * Очищает выбранный слот из сессии.
     */
    static async clearSelectedSlot(ctx) {
        const {session} = ctx;
        session.selectedSlot = null;
    }

    /**
     * Обрабатывает колбек выбора группы процедуры.
     * Извлекает имя группы процедуры из callbackData и сохраняет его в сессию.
     */
    static async handleSelectGroupProcedure(ctx) {
        const {callbackQuery, session} = ctx;
        const groupProcedureName = callbackQuery.data.split('_').slice(3).join('_');
        session.selectedGroupProcedure = groupProcedureName;
    }

    /**
     * Обрабатывает колбек выбора процедуры.
     * Извлекает имя процедуры из callbackData и сохраняет его в сессию.
     */
    static async handleSelectProcedure(ctx) {
        const {callbackQuery, session} = ctx;
        const procedureName = callbackQuery.data.split('_').slice(3).join('_');
        session.selectedProcedure = procedureName;
    }

    /**
     * Обрабатывает колбек выбора месяца.
     * Извлекает месяц и год из callbackData и сохраняет их в сессию.
     */
    static async handleSelectMonth(ctx) {
        const {callbackQuery, session} = ctx;
        const [, , , month, year] = callbackQuery.data.split('_');
        session.selectedMonth = month;
        session.selectedYear = year;
    }

    /**
     * Обрабатывает колбек выбора дня.
     * Извлекает день, месяц и год из callbackData и сохраняет их в сессию.
     */
    static async handleSelectDay(ctx) {
        const {callbackQuery, session} = ctx;
        const [, , , dateString] = callbackQuery.data.split('_');
        const [day, month, year] = dateString.split('.');
        session.selectedDate = new Date(`${month}/${day}/${year}`);
    }

    /**
     * Обрабатывает колбек выбора времени.
     * Извлекает время из callbackData и сохраняет его в сессию.
     */
    static async handleSelectTime(ctx) {
        const {callbackQuery, session} = ctx;
        const [, , , timeString] = callbackQuery.data.split('_');
        session.selectedTime = timeString;
    }

    /**
     * Обрабатывает подтверждение записи на процедуру.
     * Извлекает данные из сессии, сохраняет запись в базу данных.
     */
    static async handleConfirm(ctx, logger, bot) {
        const {from, session} = ctx;
        const userId = from.id.toString();
        const {selectedDate, selectedTime, selectedProcedure: selectedProcedureEnglishName} = session;

        const selectedDateMoment = moment(selectedDate, 'DD.MM.YYYY');
        const formattedDate = selectedDateMoment.locale('ru').format('D MMM');

        const procedures = await Procedure.find({});
        const {duration: selectedProcedureDuration,
            russianName: selectedProcedureRussianName,
            price: selectedProcedurePrice} =
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

        const hours = Math.floor(selectedProcedureDuration);
        const minutes = Math.round((selectedProcedureDuration - hours) * 60);

        const messageData = [
            `✨ Твоя запись: ${formattedDate} в ${selectedTime}`,
            `💼 Процедура: ${selectedProcedureRussianName}`,
            `⏳ Длительность: ${minutes === 0 ? `${hours} ч.` : `${hours} ч. ${minutes} мин.`}`,
            `🏷️ Цена: ${selectedProcedurePrice} ₽`,
            `📍 Адрес: ${receptionAddress}\n`,
            `⏰ Пожалуйста не опаздывай ❤️`,
            `🕒 При опоздании больше чем на 15 минут мне прийдется отменить твою запись 💔\n`,
            `🔔 Я пришлю тебе напоминалку за сутки и за час до записи`,
        ].join('\n');

        await ctx.reply(messageData);

        const message = [
            `${from.first_name} ${from.last_name} (@${from.username})`,
            `Записался на ${formattedDate}, ${selectedTime}`,
        ].join('\n');

        await bot.telegram.sendMessage(adminId, message);

        logger.info(message);
    }

    /**
     * Загружает записи пользователя из базы данных в сессию.
     */
    static async handleGetAppointments(ctx) {
        const {from, session} = ctx;
        const userId = from.id.toString();
        const records = await Record.find({userId}).sort({
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
        const {callbackQuery, from} = ctx;
        const [, , procedure, dateString, time] = callbackQuery.data.slice(1).split('_');
        const userId = from.id.toString();
        const [day, month, year] = dateString.split('.');
        const formattedDate = new Date(`${month}/${day}/${year}`);

        await Record.findOneAndDelete({
            userId,
            date: formattedDate,
            time,
            procedure,
        });

        const messageData = [
            `${from.first_name} ${from.last_name} (@${from.username})`,
            `Удалил запись на ${dateString}, ${time}`,
        ].join('\n');

        logger.info(messageData);
        await bot.telegram.sendMessage(adminId, messageData);
        const message = await ctx.reply('Запись успешно отменена.');
        setTimeout(() => ctx.deleteMessage(message.message_id), 3000);
    }
}

module.exports = AppointmentCallback;
