const { Markup } = require('telegraf');
const MenuService = require('../services/MenuService');
const FilterService = require('../services/FilterService');
const FormatService = require('../services/FormatService');
const Procedure = require('../../models/Procedure');
const WorkingTime = require('../../models/WorkingTime');
const Record = require('../../models/Record');
const moment = require('moment');

class MenuCallback {
    constructor(ctx) {
        this.ctx = ctx;
        this.menuService = new MenuService();
        this.formatService = new FormatService();
    }

    /**
     * Обрабатывает колбек "Записаться на приём".
     *
     * Запрашивает у пользователя выбор процедуры из базы данных.
     */
    async createProcedureMenu() {
        const procedures = await Procedure.find({});
        const menuData = procedures.map((procedure) => ({
            text: procedure.russianName,
            callback: `app_select_procedure_${procedure.englishName}`,
        }));

        menuData.push({ text: 'Назад', callback: 'menu_to_main_menu' });

        const keyboard = Markup.inlineKeyboard(this.menuService.createMenu(menuData));
        await this.ctx.editMessageText('Выберите процедуру:', keyboard);
    }

    /**
     * Обрабатывает колбек "Назад".
     *
     * Возвращает пользователя в главное меню.
     */
    async createMainMenu() {
        const menuData = [
            { text: 'Записаться на приём', callback: 'menu_book_appointment' },
            { text: 'Отменить запись', callback: 'menu_cancel_appointment' },
            { text: 'Проверить запись', callback: 'menu_check_appointment' },
        ];

        const keyboard = Markup.inlineKeyboard(this.menuService.createMenu(menuData));
        await this.ctx.editMessageText('Главное меню:', keyboard);
    }
    /**
     * Создаёт меню выбора месяца.
     *
     * Выбор месяца представляется из 2-ух (текущий и следующий).
     */
    async createMonthMenu() {
        const currentMonth = this.formatService.capitalizeFirstLetter(moment().locale('ru').format('MMMM'));
        const nextMonth = this.formatService.capitalizeFirstLetter(
            moment().locale('ru').add(1, 'month').format('MMMM')
        );

        const currentMonthEnglish = moment().locale('en').format('MMMM');
        const nextMonthEnglish = moment().locale('en').add(1, 'month').format('MMMM');

        const menuData = [
            { text: currentMonth, callback: `app_select_month_${currentMonthEnglish}` },
            { text: nextMonth, callback: `app_select_month_${nextMonthEnglish}` },
            { text: 'Назад', callback: 'menu_to_procedure_menu' },
        ];

        const keyboard = Markup.inlineKeyboard(this.menuService.createMenu(menuData));
        await this.ctx.editMessageText('Выберите месяц:', keyboard);
    }

    /**
     * Создаёт меню выбора дня.
     *
     * Выбор дня представляется из дней выбранного месяца, начиная с сегодняшнего дня, если
     * месяц текущий, и с 1-го дня, если следующий.
     *
     */
    async createDayMenu() {
        const selectedMonth = this.ctx.session.selectedMonth;
        const currentMonth = moment().locale('en').format('MMMM');

        let startDate = moment().locale('ru');
        if (selectedMonth !== currentMonth) {
            startDate.add(1, 'month');
            startDate.date(1);
        }

        const endDate = moment(startDate).endOf('month');
        const days = [];

        // Получаем рабочие часы и длительность процедуры вне цикла
        const workingTime = await WorkingTime.findOne();
        const startTime = moment(workingTime.startTime, 'HH:mm');
        const endTime = moment(workingTime.endTime, 'HH:mm');
        const totalAvailableSlots = endTime.diff(startTime, 'hours');

        const selectedProcedure = this.ctx.session.selectedProcedure;
        const procedure = await Procedure.findOne({ englishName: selectedProcedure });
        const procedureDuration = procedure.duration;

        while (startDate.isBefore(endDate) || startDate.isSame(endDate)) {
            const day = startDate.date();
            const dayString = this.formatService.capitalizeFirstLetter(startDate.locale('ru').format('dd, D MMM'));

            // Преобразование даты в формат "DD Month" для сравнения с данными в базе
            const formattedDate = startDate.locale('en').format('D MMMM');

            // Проверяйте наличие записей на текущий день
            const occupiedTimes = await Record.find({ date: formattedDate });

            // Проверяем, достаточно ли свободных слотов для процедуры
            if (occupiedTimes.length <= totalAvailableSlots - procedureDuration) {
                // Если доступных слотов больше, чем требуется для процедуры, добавляем день в меню
                days.push({ text: dayString, callback: `app_select_day_${day}` });
            }

            startDate.add(1, 'day');
        }

        days.push({ text: 'Назад', callback: `menu_to_month_menu` });

        this.menuService.setButtonsPerRow(3);
        const keyboard = Markup.inlineKeyboard(this.menuService.createMenu(days));
        await this.ctx.editMessageText('Выберите день:', keyboard);
    }

    /**
     * Создаёт меню выбора времени.
     *
     * Выбор времени представляется кнопками с часами, соответствующими рабочим часам.
     *
     */
    async createTimeMenu() {
        const workingTime = await WorkingTime.findOne(); // получаем рабочие часы
        const selectedProcedure = this.ctx.session.selectedProcedure;
        const procedure = await Procedure.findOne({ englishName: selectedProcedure });
        const procedureDuration = procedure.duration;

        const selectedDate = this.ctx.session.selectedDate;
        //получаем занятые часы для выбранной даты
        const occupiedTimes = await Record.find({
            date: selectedDate,
        }).select('time');

        //  переводим в массив строк
        const occupiedTimeArray = occupiedTimes.map((record) => record.time);

        const params = {
            startTime: workingTime.startTime,
            endTime: workingTime.endTime,
            occupiedTimes: occupiedTimeArray,
            procedureDuration: procedureDuration,
        };
        const filterService = new FilterService();
        const availableTimes = filterService.filterAvailableTimes(params);

        const hours = [];
        for (const time of availableTimes) {
            hours.push({ text: time, callback: `app_select_time_${time}` });
        }

        hours.push({ text: 'Назад', callback: `menu_to_day_menu` });

        this.menuService.setButtonsPerRow(4);
        const keyboard = Markup.inlineKeyboard(this.menuService.createMenu(hours));
        await this.ctx.editMessageText('Выберите время:', keyboard);
    }

    /**
     * Создаёт меню подтверждения процедуры.
     *
     * Данные берутся из сессий.
     *
     */
    async createConfirmationMenu() {
        const selectedDate = this.ctx.session.selectedDate;
        const selectedTime = this.ctx.session.selectedTime;
        const selectedProcedureEnglishName = this.ctx.session.selectedProcedure;

        //Формируем нужный формат даты
        const [day, month] = selectedDate.split(' ');
        const formattedDate = `${day} ${moment(month, 'MMMM').locale('ru').format('MMM')}`;

        //Формируем нужный формат процедуры
        const procedure = await Procedure.findOne({ englishName: selectedProcedureEnglishName });
        const selectedProcedure = procedure.russianName;

        const message = `Вы хотели бы записаться на ${formattedDate} в ${selectedTime}, Ваша процедура - ${selectedProcedure}?`;

        const buttons = [
            { text: 'Подтвердить', callback: 'app_confirm' },
            { text: 'Назад', callback: 'menu_to_time_menu' },
        ];

        const keyboard = Markup.inlineKeyboard(this.menuService.createMenu(buttons));

        await this.ctx.editMessageText(message, keyboard);
    }
}

module.exports = MenuCallback;
