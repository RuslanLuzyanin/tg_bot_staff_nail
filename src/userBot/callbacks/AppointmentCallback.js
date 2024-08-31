const Record = require('../../db/models/record');
const Procedure = require('../../db/models/procedure');
const CheckAppointmentService = require('../services/checkAppointmentService');
const AppointmentError = require('../../errors/appointmentError');
const moment = require('moment');
const config = require('../../config/config');

class AppointmentCallback {
    /**
     * Обрабатывает колбек выбора слота.
     * Извлекает имя слота из callbackData и сохраняет его в сессию.
     */
    static async handleSelectSlot(ctx, logger) {
        const { callbackQuery, session } = ctx;
        const slotName = callbackQuery.data.split('_').slice(3).join('_');
        if (slotName !== 'confirm') {
            session.selectedSlot = slotName;
            logger.debug(`Слот "${slotName}" выбран`);
        } else {
            logger.debug(`Слот подтвержден`);
        }
    }

    /**
     * Очищает выбранный слот из сессии.
     */
    static async clearSelectedSlot(ctx, logger) {
        const { session } = ctx;
        session.selectedSlot = null;
        logger.debug('Выбранный слот очищен из сессии');
    }

    /**
     * Обрабатывает колбек выбора процедуры.
     * Извлекает имя процедуры из callbackData и сохраняет его в сессию.
     */
    static async handleSelectProcedure(ctx, logger) {
        const { callbackQuery, session } = ctx;
        const procedureName = callbackQuery.data.split('_').slice(3).join('_');
        session.selectedProcedure = procedureName;
        logger.debug(`Процедура "${procedureName}" выбрана`);
    }

    /**
     * Обрабатывает колбек выбора месяца.
     * Извлекает месяц и год из callbackData и сохраняет их в сессию.
     */
    static async handleSelectMonth(ctx, logger) {
        const { callbackQuery, session } = ctx;
        const [, , , month, year] = callbackQuery.data.split('_');
        session.selectedMonth = month;
        session.selectedYear = year;
        logger.debug(`Месяц "${month}.${year}" выбран`);
    }

    /**
     * Обрабатывает колбек выбора дня.
     * Извлекает день, месяц и год из callbackData и сохраняет их в сессию.
     */
    static async handleSelectDay(ctx, logger) {
        const { callbackQuery, session } = ctx;
        const [, , , dateString] = callbackQuery.data.split('_');
        const [day, month, year] = dateString.split('.');
        session.selectedDate = new Date(`${month}/${day}/${year}`);
        logger.debug(`Дата "${dateString}" выбрана`);
    }

    /**
     * Обрабатывает колбек выбора времени.
     * Извлекает время из callbackData и сохраняет его в сессию.
     */
    static async handleSelectTime(ctx, logger) {
        const { callbackQuery, session } = ctx;
        const [, , , timeString] = callbackQuery.data.split('_');
        session.selectedTime = timeString;
        logger.debug(`Время "${timeString}" выбрано`);
    }

    /**
     * Обрабатывает подтверждение записи на процедуру.
     * Извлекает данные из сессии, сохраняет запись в базу данных.
     */
    static async handleConfirm(ctx, logger, bot) {
        const { from, session } = ctx;
        const userId = from.id.toString();
        const {
            selectedDate,
            selectedTime,
            selectedProcedure: selectedProcedureEnglishName,
        } = session;

        const selectedDateMoment = moment(selectedDate, 'DD.MM.YYYY');
        const formattedDate = selectedDateMoment.locale('ru').format('D MMM');

        const procedure = await Procedure.findOne({
            englishName: selectedProcedureEnglishName,
        });
        const selectedProcedure = procedure.russianName;
        const duration = procedure.duration;
        const conflictRecords = await CheckAppointmentService.checkAvailability(
            selectedDate,
            selectedTime,
            duration
        );
        if (conflictRecords > 0) {
            throw new AppointmentError('appointmentConflictError');
        }
        const messageData = [
            `Вы записались на ${formattedDate} в ${selectedTime},`,
            `Ваша процедура - ${selectedProcedure}.`,
            `Процедура будет проходить по адресу: ${config.receptionAddress}`,
        ].join('\n');

        await ctx.reply(messageData);

        await bot.telegram.sendMessage(
            config.userId,
            `Пользователь ${from.first_name} ${from.last_name} (@${from.username}) ${from.id} создал запись на ${formattedDate}, ${selectedTime}`
        );

        for (let i = 0; i < duration; i++) {
            const recordTime = moment(selectedTime, 'HH:mm')
                .add(i, 'hours')
                .format('HH:mm');

            const newRecord = new Record({
                userId: userId,
                date: new Date(selectedDate),
                time: recordTime,
                procedure: selectedProcedureEnglishName,
            });

            await newRecord.save();
            logger.info(
                `Запись на процедуру "${selectedProcedure}" в ${recordTime} сохранена`
            );
        }
    }

    /**
     * Загружает записи пользователя из базы данных в сессию.
     */
    static async handleGetAppointments(ctx, logger) {
        const { from, session } = ctx;
        const userId = from.id.toString();
        const records = await Record.find({ userId }).sort({
            date: 1,
            time: 1,
        });

        const procedures = await Procedure.find().select(
            'englishName duration'
        );
        const procedureMap = procedures.reduce((map, proc) => {
            map[proc.englishName] = proc.duration;
            return map;
        }, {});

        const appointments = [];
        let skipCount = 0;

        for (const record of records) {
            if (skipCount > 0) {
                skipCount--;
                continue;
            }

            const procedureDuration = procedureMap[record.procedure];
            skipCount = procedureDuration - 1;

            appointments.push({
                procedure: record.procedure,
                date: record.date,
                time: record.time,
            });
        }
        session.appointments = appointments;
        logger.debug(
            `Получены записи пользователя ${userId}: ${appointments
                .map((a) => `${a.procedure} (${a.date} ${a.time})`)
                .join(', ')}`
        );
    }

    /**
     * Обрабатывает отмену записи на процедуру.
     */
    static async handleCancel(ctx, logger, bot) {
        const { callbackQuery, from } = ctx;
        const [, , procedure, dateString, time] = callbackQuery.data
            .slice(1)
            .split('_');
        const procedureData = await Procedure.findOne({
            englishName: procedure,
        });
        const { duration: procedureDuration } = procedureData;
        const [day, month, year] = dateString.split('.');
        const formattedDate = new Date(`${month}/${day}/${year}`);
        const userId = from.id.toString();

        for (let i = 0; i < procedureDuration; i++) {
            const recordTime = moment(time, 'HH:mm')
                .add(i, 'hours')
                .format('HH:mm');
            const recordToDelete = await Record.findOneAndDelete({
                userId,
                date: formattedDate,
                time: recordTime,
                procedure,
            });
            if (recordToDelete) {
                logger.info(
                    `Запись на ${recordToDelete.procedure} в ${recordToDelete.time} ${recordToDelete.date} удалена.`
                );
            }
        }
        await bot.telegram.sendMessage(
            config.userId,
            `Пользователь ${from.first_name} ${from.last_name} (@${from.username}) ${from.id} удалил запись на ${dateString}, ${time}`
        );

        const message = await ctx.reply('Ваша запись успешно отменена.');
        setTimeout(() => ctx.deleteMessage(message.message_id), 3000);
    }
}

module.exports = AppointmentCallback;
