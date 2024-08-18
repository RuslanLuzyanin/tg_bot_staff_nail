const Record = require('../../../models/Record');
const Procedure = require('../../../models/Procedure');
const moment = require('moment');
const config = require('../config/Config');

class AppointmentCallback {
    /**
     * Создает экземпляр класса AppointmentCallback.
     * @param {object} ctx - Контекст телеграф.
     * @param {object} logger - Объект логгера.
     */
    constructor(ctx, logger, bot) {
        this.ctx = ctx;
        this.logger = logger;
        this.bot = bot;
    }

    /**
     * Обрабатывает колбек выбора процедуры.
     * Извлекает имя процедуры из callbackData и сохраняет его в сессию.
     */
    async handleSelectProcedure() {
        const { callbackQuery, session } = this.ctx;
        const procedureName = callbackQuery.data.split('_').slice(3).join('_');
        session.selectedProcedure = procedureName;
        this.logger.debug(`Процедура "${procedureName}" выбрана`);
    }

    /**
     * Обрабатывает колбек выбора месяца.
     * Извлекает месяц и год из callbackData и сохраняет их в сессию.
     */
    async handleSelectMonth() {
        const { callbackQuery, session } = this.ctx;
        const [, , , month, year] = callbackQuery.data.split('_');
        session.selectedMonth = month;
        session.selectedYear = year;
        this.logger.debug(`Месяц "${month}.${year}" выбран`);
    }

    /**
     * Обрабатывает колбек выбора дня.
     * Извлекает день, месяц и год из callbackData и сохраняет их в сессию.
     */
    async handleSelectDay() {
        const { callbackQuery, session } = this.ctx;
        const [, , , dateString] = callbackQuery.data.split('_');
        const [day, month, year] = dateString.split('.');
        session.selectedDate = new Date(`${month}/${day}/${year}`);
        this.logger.debug(`Дата "${dateString}" выбрана`);
    }

    /**
     * Обрабатывает колбек выбора времени.
     * Извлекает время из callbackData и сохраняет его в сессию.
     */
    async handleSelectTime() {
        const { callbackQuery, session } = this.ctx;
        const [, , , timeString] = callbackQuery.data.split('_');
        session.selectedTime = timeString;
        this.logger.debug(`Время "${timeString}" выбрано`);
    }

    /**
     * Обрабатывает подтверждение записи на процедуру.
     * Извлекает данные из сессии, сохраняет запись в базу данных.
     */
    async handleConfirm() {
        const { from, session } = this.ctx;
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

        const messageData = [
            `Вы записались на ${formattedDate} в ${selectedTime},`,
            `Ваша процедура - ${selectedProcedure}.`,
            `Процедура будет проходить по адресу: ${config.receptionAddress}`,
        ].join('\n');

        const message = await this.ctx.reply(messageData);
        setTimeout(() => this.ctx.deleteMessage(message.message_id), 3000);

        await this.bot.telegram.sendMessage(
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
            this.logger.info(
                `Запись на процедуру "${selectedProcedure}" в ${recordTime} сохранена`
            );
        }
    }

    /**
     * Загружает записи пользователя из базы данных в сессию.
     */
    async handleGetAppointments() {
        const { from, session } = this.ctx;
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
        this.logger.debug(
            `Получены записи пользователя ${userId}: ${appointments
                .map((a) => `${a.procedure} (${a.date} ${a.time})`)
                .join(', ')}`
        );
    }

    /**
     * Обрабатывает отмену записи на процедуру.
     */
    async handleCancel() {
        const { callbackQuery, from } = this.ctx;
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
                this.logger.info(
                    `Запись на ${recordToDelete.procedure} в ${recordToDelete.time} ${recordToDelete.date} удалена.`
                );
            }
        }
        await this.bot.telegram.sendMessage(
            config.userId,
            `Пользователь ${from.first_name} ${from.last_name} (@${from.username}) ${from.id} удалил запись на ${dateString}, ${time}`
        );

        const message = await this.ctx.reply('Ваша запись успешно отменена.');
        setTimeout(() => this.ctx.deleteMessage(message.message_id), 3000);
    }
}

module.exports = AppointmentCallback;
