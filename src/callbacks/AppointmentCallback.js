const Record = require('../../models/Record');
const Procedure = require('../../models/Procedure');
const moment = require('moment');

class AppointmentCallback {
    /**
     * Создает экземпляр класса AppointmentCallback.
     * @param {object} ctx - Контекст телеграф.
     * @param {object} logger - Объект логгера.
     */
    constructor(ctx, logger) {
        this.ctx = ctx;
        this.logger = logger;
    }

    /**
     * Обрабатывает колбек выбора процедуры.
     * Извлекает имя процедуры из callbackData и сохраняет его в сессию.
     */
    handleSelectProcedure = async () => {
        const { callbackQuery, session } = this.ctx;
        const procedureName = callbackQuery.data.split('_').slice(3).join('_');
        session.selectedProcedure = procedureName;
        this.logger.info(`Процедура "${procedureName}" выбрана`);
    };

    /**
     * Обрабатывает колбек выбора месяца.
     * Извлекает имя месяца из callbackData и сохраняет его в сессию.
     */
    handleSelectMonth = async () => {
        const { callbackQuery, session } = this.ctx;
        const month = callbackQuery.data.split('_').slice(3).join('_');
        session.selectedMonth = month;
        this.logger.info(`Месяц "${month}" выбран`);
    };

    /**
     * Обрабатывает колбек выбора дня.
     * Извлекает имя дня из callbackData и сохраняет его в сессию.
     */
    handleSelectDay = async () => {
        const { callbackQuery, session } = this.ctx;
        const day = callbackQuery.data.split('_').slice(3).join('_');
        session.selectedDate = `${day} ${session.selectedMonth}`;
        this.logger.info(`Дата "${session.selectedDate}" выбрана`);
    };

    /**
     * Обрабатывает колбек выбора времени.
     * Извлекает время из callbackData и сохраняет его в сессию.
     */
    handleSelectTime = async () => {
        const { callbackQuery, session } = this.ctx;
        session.selectedTime = callbackQuery.data.split('_').slice(3).join('_');
        this.logger.info(`Время "${session.selectedTime}" выбрано`);
    };

    /**
     * Обрабатывает подтверждение записи на процедуру.
     * Извлекает данные из сессии, сохраняет запись в базу данных.
     */
    handleConfirm = async () => {
        const { from, session } = this.ctx;
        const userId = from.id.toString();
        const {
            selectedDate,
            selectedTime,
            selectedProcedure: selectedProcedureEnglishName,
        } = session;

        const [day, month] = selectedDate.split(' ');
        const formattedDate = `${day} ${moment(month, 'MMMM')
            .locale('ru')
            .format('MMM')}`;

        const procedure = await Procedure.findOne({
            englishName: selectedProcedureEnglishName,
        });
        const selectedProcedure = procedure.russianName;
        const duration = procedure.duration;

        const message = `Вы записались на ${formattedDate} в ${selectedTime}, Ваша процедура - ${selectedProcedure}`;
        await this.ctx.reply(message);

        for (let i = 0; i < duration; i++) {
            const recordTime = moment(selectedTime, 'HH:mm')
                .add(i, 'hours')
                .format('HH:mm');

            const newRecord = new Record({
                userId: userId,
                date: selectedDate,
                time: recordTime,
                procedure: selectedProcedureEnglishName,
            });

            await newRecord.save();
            this.logger.info(
                `Запись на процедуру "${selectedProcedure}" в ${recordTime} сохранена`
            );
        }
    };

    /**
     * Загружает записи пользователя из базы данных в сессию.
     */
    handleGetAppointments = async () => {
        const { from, session } = this.ctx;
        const userId = from.id.toString();
        const records = await Record.find({ userId }).sort({
            date: 1,
            time: 1,
        });
        const appointments = [];
        let skipCount = 0;

        for (const record of records) {
            if (skipCount > 0) {
                skipCount--;
                continue;
            }

            const procedureDuration = (
                await Procedure.findOne({ englishName: record.procedure })
            ).duration;
            skipCount = procedureDuration - 1;

            appointments.push({
                procedure: record.procedure,
                date: record.date,
                time: record.time,
            });
        }
        session.appointments = appointments;
        this.logger.info(
            `Получены записи пользователя ${userId}: ${appointments
                .map((a) => `${a.procedure} (${a.date} ${a.time})`)
                .join(', ')}`
        );
    };

    /**
     * Обрабатывает отмену записи на процедуру.
     */
    handleCancel = async () => {
        const { callbackQuery, from } = this.ctx;
        const [, , procedure, date, time] = callbackQuery.data
            .slice(1)
            .split('_');
        const procedureData = await Procedure.findOne({
            englishName: procedure,
        });
        if (!procedureData) {
            this.logger.error(
                `Процедура с английским названием ${procedure} не найдена в базе данных.`
            );
            return;
        }
        const { duration: procedureDuration } = procedureData;

        const [day, month] = date.split(' ');
        const formattedDate = `${day} ${moment(month, 'MMMM')
            .locale('en')
            .format('MMMM')}`;
        const userId = from.id.toString();

        const recordToDelete = await Record.findOneAndDelete({
            userId,
            date: formattedDate,
            time,
            procedure,
        });

        if (recordToDelete) {
            this.logger.info(
                `Запись на ${recordToDelete.procedure} в ${recordToDelete.time} ${recordToDelete.date} удалена.`
            );
        }

        for (let i = 1; i < procedureDuration; i++) {
            const nextTime = moment(time, 'HH:mm')
                .add(i, 'hours')
                .format('HH:mm');
            const nextRecord = await Record.findOneAndDelete({
                userId,
                date: formattedDate,
                time: nextTime,
                procedure,
            });
            if (nextRecord) {
                this.logger.info(
                    `Запись на ${nextRecord.procedure} в ${nextRecord.time} ${nextRecord.date} удалена.`
                );
            }
        }

        await this.ctx.reply('Ваша запись успешно отменена.');
    };
}

module.exports = AppointmentCallback;
