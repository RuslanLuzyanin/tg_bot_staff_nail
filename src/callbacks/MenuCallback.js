const { Markup } = require('telegraf');
const MenuService = require('../services/MenuService');
const FilterService = require('../services/FilterService');
const Procedure = require('../../models/Procedure');
const WorkingTime = require('../../models/WorkingTime');
const Record = require('../../models/Record');
const moment = require('moment');

class MenuCallback {
    /**
     * Создает экземпляр класса MenuCallback.
     * @param {object} ctx - Контекст телеграф.
     * @param {object} logger - Объект логгера.
     */
    constructor(ctx, logger) {
        this.ctx = ctx;
        this.logger = logger;
    }

    /**
     * Обрабатывает колбек "Назад".
     *
     * Возвращает пользователя в главное меню.
     */
    async createMainMenu() {
        const menuData = [
            { text: 'Запись на приём', callback: 'menu_to_procedure_menu' },
            { text: 'Отменить запись', callback: 'menu_to_cancel_appointment' },
            { text: 'Проверить запись', callback: 'menu_to_check_appointment' },
        ];

        const keyboard = Markup.inlineKeyboard(
            MenuService.createMenu(menuData)
        );
        await this.ctx.editMessageText('Главное меню:', keyboard);
        this.logger.debug('Главное меню создано');
    }

    /**
     * Обрабатывает колбек "Записаться на приём".
     *
     * Запрашивает у пользователя выбор процедуры из базы данных.
     * Если у пользователя уже есть 3 записи, выводит сообщение и не создает меню.
     */
    async createProcedureMenu() {
        const { appointments } = this.ctx.session;
        if (appointments.length >= 3) {
            await this.ctx.reply(
                'У Вас уже есть 3 записи на процедуры. Вы не можете создать новую запись.'
            );
            await this.ctx.reply(
                'Чтобы создать новую запись, отменить одну из существующих.'
            );
            return;
        }

        const procedures = await Procedure.find({});
        const menuData = procedures.map((procedure) => ({
            text: procedure.russianName,
            callback: `app_select_procedure_${procedure.englishName}`,
        }));

        menuData.push({ text: 'Назад', callback: 'menu_to_main_menu' });

        const keyboard = Markup.inlineKeyboard(
            MenuService.createMenu(menuData)
        );
        await this.ctx.editMessageText('Выберите процедуру:', keyboard);
        this.logger.debug('Меню выбора процедуры создано');
    }

    /**
     * Создаёт меню выбора месяца.
     *
     * Выбор месяца представляется из 2-ух (текущий и следующий).
     */
    async createMonthMenu() {
        const currentMonth = moment()
            .locale('ru')
            .format('MMMM')
            .toLowerCase()
            .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
        const nextMonth = moment()
            .locale('ru')
            .add(1, 'month')
            .format('MMMM')
            .toLowerCase()
            .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());

        const currentMonthEnglish = moment().locale('en').format('MMMM');
        const nextMonthEnglish = moment()
            .locale('en')
            .add(1, 'month')
            .format('MMMM');

        const menuData = [
            {
                text: currentMonth,
                callback: `app_select_month_${currentMonthEnglish}`,
            },
            {
                text: nextMonth,
                callback: `app_select_month_${nextMonthEnglish}`,
            },
            { text: 'Назад', callback: 'menu_to_procedure_menu' },
        ];

        const keyboard = Markup.inlineKeyboard(
            MenuService.createMenu(menuData, 2)
        );
        await this.ctx.editMessageText('Выберите месяц:', keyboard);
        this.logger.debug('Меню выбора месяца создано');
    }

    /**
     * Создаёт меню выбора дня.
     *
     * Выбор дня представляется из дней выбранного месяца, начиная с сегодняшнего дня, если
     * месяц текущий, и с 1-го дня, если следующий.
     *
     */
    async createDayMenu() {
        const { selectedMonth } = this.ctx.session;
        const currentMonth = moment().locale('en').format('MMMM');

        let startDate = moment().add(1, 'day').locale('ru');
        if (selectedMonth !== currentMonth) {
            startDate.add(1, 'month');
            startDate.date(1);
        }

        const endDate = moment(startDate).endOf('month');
        const menuData = [];

        const workingTime = await WorkingTime.findOne();
        const { startTime, endTime } = workingTime;
        const totalAvailableSlots = moment(endTime, 'HH:mm').diff(
            moment(startTime, 'HH:mm'),
            'hours'
        );

        const { selectedProcedure } = this.ctx.session;
        const procedure = await Procedure.findOne({
            englishName: selectedProcedure,
        });
        const { duration: procedureDuration } = procedure;

        while (startDate.isBefore(endDate) || startDate.isSame(endDate)) {
            const day = startDate.date();
            const dayString = startDate
                .locale('ru')
                .format('dd, D MMM')
                .toLowerCase()
                .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());

            const formattedDate = startDate.locale('en').format('D MMMM');
            const occupiedTimes = await Record.find({ date: formattedDate });

            if (
                occupiedTimes.length <=
                totalAvailableSlots - procedureDuration
            ) {
                menuData.push({
                    text: dayString,
                    callback: `app_select_day_${day}`,
                });
            }

            startDate.add(1, 'day');
        }

        menuData.push({ text: 'Назад', callback: `menu_to_month_menu` });

        const keyboard = Markup.inlineKeyboard(
            MenuService.createMenu(menuData, 3)
        );
        await this.ctx.editMessageText('Выберите день:', keyboard);
        this.logger.debug('Меню выбора дня создано');
    }

    /**
     * Создаёт меню выбора времени.
     *
     * Выбор времени представляется кнопками с часами, соответствующими рабочим часам.
     *
     */
    async createTimeMenu() {
        const { selectedProcedure, selectedDate } = this.ctx.session;
        const workingTime = await WorkingTime.findOne();
        const procedure = await Procedure.findOne({
            englishName: selectedProcedure,
        });
        const { duration: procedureDuration } = procedure;

        const occupiedTimes = await Record.find({ date: selectedDate }).select(
            'time'
        );
        const occupiedTimeArray = occupiedTimes.map(({ time }) => time);

        const params = {
            startTime: workingTime.startTime,
            endTime: workingTime.endTime,
            occupiedTimes: occupiedTimeArray,
            procedureDuration,
        };
        const availableTimes = FilterService.filterAvailableTimes(params);

        const menuData = availableTimes.map((time) => ({
            text: time,
            callback: `app_select_time_${time}`,
        }));

        menuData.push({ text: 'Назад', callback: `menu_to_day_menu` });

        const keyboard = Markup.inlineKeyboard(
            MenuService.createMenu(menuData, 4)
        );
        await this.ctx.editMessageText('Выберите время:', keyboard);
        this.logger.debug('Меню выбора времени создано');
    }

    /**
     * Создаёт меню подтверждения процедуры.
     *
     * Данные берутся из сессий.
     *
     */
    async createConfirmationMenu() {
        const {
            selectedDate,
            selectedTime,
            selectedProcedure: selectedProcedureEnglishName,
        } = this.ctx.session;

        const [day, month] = selectedDate.split(' ');
        const formattedDate = `${day} ${moment(month, 'MMMM')
            .locale('ru')
            .format('MMM')}`;

        const procedure = await Procedure.findOne({
            englishName: selectedProcedureEnglishName,
        });
        const selectedProcedure = procedure.russianName;

        const message = `Вы хотели бы записаться на ${formattedDate} в ${selectedTime}, Ваша процедура - ${selectedProcedure}?`;

        const menuData = [
            { text: 'Подтвердить', callback: 'app_confirm' },
            { text: 'Назад', callback: 'menu_to_time_menu' },
        ];

        const keyboard = Markup.inlineKeyboard(
            MenuService.createMenu(menuData)
        );

        await this.ctx.editMessageText(message, keyboard);
        this.logger.debug('Меню подтверждения записи создано');
    }

    /**
     * Создаёт меню с процедурами, на которые записан пользователь.
     */
    async createCheckAppointmentsMenu() {
        const { appointments } = this.ctx.session;

        if (!appointments || appointments.length === 0) {
            await this.ctx.reply('У Вас нет записей на процедуры.');
            return;
        }

        const procedures = await Procedure.find(
            {},
            { englishName: 1, russianName: 1 }
        );
        const procedureMap = new Map(
            procedures.map((p) => [p.englishName, p.russianName])
        );

        let message = 'Ваши записи на процедуры:\n\n';
        for (const { procedure, date, time } of appointments) {
            const [day, month] = date.split(' ');
            const formattedDate = `${day} ${moment(month, 'MMMM')
                .locale('ru')
                .format('MMM')}`;

            message += `- ${procedureMap.get(
                procedure
            )} (${formattedDate} в ${time})\n`;
        }

        const menuData = [{ text: 'Назад', callback: 'menu_to_main_menu' }];
        const keyboard = Markup.inlineKeyboard(
            MenuService.createMenu(menuData)
        );
        await this.ctx.editMessageText(message, keyboard);
        this.logger.debug(
            'Меню с процедурами, на которые записан пользователь создано'
        );
    }

    /**
     * Создаёт меню для отмены записей пользователя.
     */
    async createCancelAppointmentsMenu() {
        const { appointments } = this.ctx.session;

        if (!appointments || appointments.length === 0) {
            await this.ctx.reply('У Вас нет записей на процедуры.');
            return;
        }
        const procedures = await Procedure.find(
            {},
            { englishName: 1, russianName: 1 }
        );
        const procedureMap = new Map(
            procedures.map((p) => [p.englishName, p.russianName])
        );

        let message = 'Выберите запись для отмены:\n\n';
        const menuData = [];

        for (const { procedure, date, time } of appointments) {
            const [day, month] = date.split(' ');
            const formattedDate = `${day} ${moment(month, 'MMMM')
                .locale('ru')
                .format('MMM')}`;

            const buttonText = `${procedureMap.get(
                procedure
            )} (${formattedDate} в ${time})`;
            menuData.push({
                text: buttonText,
                callback: `app_cancel_${procedure}_${date}_${time}`,
            });
        }
        menuData.push({ text: 'Назад', callback: 'menu_to_main_menu' });
        const keyboard = Markup.inlineKeyboard(
            MenuService.createMenu(menuData, 1)
        );
        await this.ctx.editMessageText(message, keyboard);
        this.logger.debug('Меню для отмены записей пользователя создано');
    }
}

module.exports = MenuCallback;
