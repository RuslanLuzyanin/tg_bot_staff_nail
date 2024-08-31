const { Markup } = require('telegraf');
const MenuService = require('../../shared/services/menuService');
const FilterService = require('../services/filterService');
const GetSlotHoursService = require('../services/getSlotHours');
const Procedure = require('../../db/models/procedure');
const WorkingTime = require('../../db/models/workingTime');
const Record = require('../../db/models/record');
const moment = require('moment');
const { receptionAddress } = require('../../config/config');
const DataBaseError = require('../../errors/dataBaseError');

class MenuCallback {
    /**
     * Обрабатывает колбек "Назад".
     *
     * Возвращает пользователя в главное меню.
     */
    static async createMainMenu(ctx, logger) {
        const menuData = [
            { text: 'Запись на приём', callback: 'menu_to_slot_menu' },
            { text: 'Отменить запись', callback: 'menu_to_cancel_appointment' },
            { text: 'Проверить запись', callback: 'menu_to_check_appointment' },
        ];

        const keyboard = Markup.inlineKeyboard(
            MenuService.createMenu(menuData)
        );
        await ctx.editMessageText('Главное меню:', keyboard);
        logger.debug('Главное меню создано');
    }

    /**
     * Создаёт меню выбора слотов.
     *
     * Выбор слотов представляется из 4-ёх (утро, день, вечерь, любые).
     */
    static async createSlotMenu(ctx, logger) {
        const { selectedSlot } = ctx.session;
        const slotNames = {
            morning: 'Утро',
            day: 'День',
            evening: 'Вечер',
            any: 'Любые',
        };
        if (selectedSlot) {
            const russianSlotName = slotNames[selectedSlot];
            const confirmMessage = `Вы выбрали слот ${russianSlotName}. Подтвердить?`;
            const confirmKeyboard = Markup.inlineKeyboard([
                Markup.button.callback('Подвердить', 'app_select_slot_confirm'),
                Markup.button.callback('Изменить', 'change_select_slot'),
                Markup.button.callback('Назад', 'menu_to_main_menu'),
            ]);
            await ctx.editMessageText(confirmMessage, confirmKeyboard);
            return;
        }

        const menuData = [
            {
                text: slotNames.morning,
                callback: 'app_select_slot_morning',
            },
            {
                text: slotNames.day,
                callback: 'app_select_slot_day',
            },
            {
                text: slotNames.evening,
                callback: 'app_select_slot_evening',
            },
            {
                text: slotNames.any,
                callback: 'app_select_slot_any',
            },
        ];
        menuData.push({ text: 'Назад', callback: 'menu_to_main_menu' });

        const keyboard = Markup.inlineKeyboard(
            MenuService.createMenu(menuData)
        );
        await ctx.editMessageText(
            'Выберите удобный для Вас слот для записи:',
            keyboard
        );
        logger.debug('Меню выбора слота создано');
    }

    /**
     * Создаёт меню выбора процедуры.
     *
     * Если у пользователя уже есть 3 записи, выводит сообщение и не создает меню.
     */
    static async createProcedureMenu(ctx, logger) {
        const { appointments } = ctx.session;
        if (appointments.length >= 3) {
            const messageData = [
                `У Вас уже есть 3 записи на процедуры. Вы не можете создать новую запись.`,
                `Чтобы создать новую запись, отменить одну из существующих.`,
            ].join('\n');

            const message = await ctx.reply(messageData);
            setTimeout(() => ctx.deleteMessage(message.message_id), 3000);
            return;
        }

        const procedures = await Procedure.find({}).catch((error) => {
            throw new DataBaseError('findProcedureError', error);
        });
        const menuData = procedures.map((procedure) => ({
            text: procedure.russianName,
            callback: `app_select_procedure_${procedure.englishName}`,
        }));

        menuData.push({ text: 'Назад', callback: 'menu_to_slot_menu' });

        const keyboard = Markup.inlineKeyboard(
            MenuService.createMenu(menuData)
        );
        await ctx.editMessageText('Выберите процедуру:', keyboard);
        logger.debug('Меню выбора процедуры создано');
    }

    /**
     * Создаёт меню выбора месяца.
     *
     * Выбор месяца представляется из 2-ух (текущий и следующий).
     */
    static async createMonthMenu(ctx, logger) {
        const currentDate = moment();
        const isLastDayOfMonth =
            currentDate.date() === currentDate.daysInMonth();
        let currentMonth, currentYear, nextMonth, nextYear;

        if (isLastDayOfMonth) {
            currentMonth = (currentDate.month() + 2) % 12 || 12;
            currentYear =
                currentMonth === 1
                    ? currentDate.year() + 1
                    : currentDate.year();
            nextMonth = (currentMonth % 12) + 1;
            nextYear = nextMonth === 1 ? currentYear + 1 : currentYear;
        } else {
            currentMonth = currentDate.month() + 1;
            currentYear = currentDate.year();
            nextMonth = (currentMonth % 12) + 1;
            nextYear = nextMonth === 1 ? currentYear + 1 : currentYear;
        }

        function formatMonthYear(month, year) {
            const monthName = moment(`${year}-${month}`, 'YYYY-M')
                .locale('ru')
                .format('MMMM');
            return `${monthName[0].toUpperCase() + monthName.slice(1)} ${year}`;
        }

        const menuData = [
            {
                text: formatMonthYear(currentMonth, currentYear),
                callback: `app_select_month_${currentMonth}_${currentYear}`,
            },
            {
                text: formatMonthYear(nextMonth, nextYear),
                callback: `app_select_month_${nextMonth}_${nextYear}`,
            },
            { text: 'Назад', callback: 'menu_to_procedure_menu' },
        ];

        const keyboard = Markup.inlineKeyboard(
            MenuService.createMenu(menuData, 2)
        );
        await ctx.editMessageText('Выберите месяц:', keyboard);
        logger.debug('Меню выбора месяца создано');
    }

    /**
     * Создаёт меню выбора дня.
     *
     * Выбор дня представляется из дней выбранного месяца, начиная с сегодняшнего дня, если
     * месяц текущий, и с 1-го дня, если следующий.
     *
     */
    static async createDayMenu(ctx, logger) {
        const { selectedMonth, selectedYear, selectedProcedure, selectedSlot } =
            ctx.session;
        const currentDate = moment();
        let startDate;

        if (selectedMonth !== currentDate.format('M')) {
            startDate = moment(
                `${selectedYear}-${selectedMonth}-01`,
                'YYYY-MM-DD'
            ).startOf('month');
        } else {
            startDate = moment().add(1, 'day').startOf('day');
        }

        const endDate = moment(startDate).endOf('month');
        const menuData = [];

        const workingTime = await WorkingTime.findOne().catch((error) => {
            throw new DataBaseError('findWorkingTimeError', error);
        });
        const { startTime, endTime } = workingTime;
        const totalAvailableSlots = moment(endTime, 'HH:mm').diff(
            moment(startTime, 'HH:mm'),
            'hours'
        );

        const procedure = await Procedure.findOne({
            englishName: selectedProcedure,
        }).catch((error) => {
            throw new DataBaseError('findProcedureError', error);
        });
        const { duration: procedureDuration } = procedure;

        while (startDate.isSameOrBefore(endDate)) {
            const formattedDate = startDate.format('DD.MM.YYYY');
            let isDateAvailable = false;

            if (selectedSlot === 'any') {
                const occupiedTimes = await Record.find({
                    date: {
                        $gte: startDate.toDate(),
                        $lt: moment(startDate).add(1, 'day').toDate(),
                    },
                }).catch((error) => {
                    throw new DataBaseError('findRecodError', error);
                });

                if (
                    occupiedTimes.length <=
                    totalAvailableSlots - procedureDuration
                ) {
                    isDateAvailable = true;
                }
            } else {
                const [slotStart, slotEnd] = GetSlotHoursService.getSlotHours(
                    selectedSlot,
                    startTime,
                    endTime
                );

                const records = await Record.find({
                    date: startDate.toDate(),
                    time: {
                        $gte: slotStart.format('HH:mm'),
                        $lt: slotEnd.format('HH:mm'),
                    },
                }).catch((error) => {
                    throw new DataBaseError('findRecodError', error);
                });

                if (records.length < 2) {
                    isDateAvailable = true;
                }
            }

            if (isDateAvailable) {
                menuData.push({
                    text: startDate
                        .locale('ru')
                        .format('dd, D MMM')
                        .toLowerCase()
                        .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase()),
                    callback: `app_select_day_${formattedDate}`,
                });
            }

            startDate.add(1, 'day');
        }

        menuData.push({ text: 'Назад', callback: `menu_to_month_menu` });

        const keyboard = Markup.inlineKeyboard(
            MenuService.createMenu(menuData, 3)
        );
        await ctx.editMessageText('Выберите день:', keyboard);
        logger.debug('Меню выбора дня создано');
    }

    /**
     * Создаёт меню выбора времени.
     *
     * Выбор времени представляется кнопками с часами, соответствующими рабочим часам.
     *
     */
    static async createTimeMenu(ctx, logger) {
        const { selectedProcedure, selectedDate } = ctx.session;
        const workingTime = await WorkingTime.findOne();
        const procedure = await Procedure.findOne({
            englishName: selectedProcedure,
        }).catch((error) => {
            throw new DataBaseError('findProcedureError', error);
        });
        const { duration: procedureDuration } = procedure;

        const occupiedTimes = await Record.find({
            date: selectedDate,
        })
            .select('time')
            .catch((error) => {
                throw new DataBaseError('findRecodError', error);
            });

        const occupiedTimeArray = occupiedTimes.map(({ time }) =>
            moment(time, 'HH:mm').format('HH:mm')
        );

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
        await ctx.editMessageText('Выберите время:', keyboard);
        logger.debug('Меню выбора времени создано');
    }

    /**
     * Создаёт меню подтверждения процедуры.
     *
     * Данные берутся из сессий.
     *
     */
    static async createConfirmationMenu(ctx, logger) {
        const {
            selectedDate,
            selectedTime,
            selectedProcedure: selectedProcedureEnglishName,
        } = ctx.session;

        const selectedDateMoment = moment(selectedDate, 'DD.MM.YYYY');
        const formattedDate = selectedDateMoment.locale('ru').format('D MMM');

        const procedure = await Procedure.findOne({
            englishName: selectedProcedureEnglishName,
        }).catch((error) => {
            throw new DataBaseError('findProcedureError', error);
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

        await ctx.editMessageText(message, keyboard);
        logger.debug('Меню подтверждения записи создано');
    }

    /**
     * Создаёт меню с процедурами, на которые записан пользователь.
     */
    static async createCheckAppointmentsMenu(ctx, logger) {
        const { appointments } = ctx.session;

        if (!appointments || appointments.length === 0) {
            const message = await ctx.reply('У Вас нет записей на процедуры.');
            setTimeout(() => ctx.deleteMessage(message.message_id), 3000);
            return;
        }

        const procedures = await Procedure.find(
            {},
            { englishName: 1, russianName: 1 }
        ).catch((error) => {
            throw new DataBaseError('findProcedureError', error);
        });
        const procedureMap = new Map(
            procedures.map((p) => [p.englishName, p.russianName])
        );

        let message = `Ждём Вас по адресу: ${receptionAddress}. Ваши записи на процедуры:\n`;
        for (const { procedure, date, time } of appointments) {
            const formattedDate = moment(date).locale('ru').format('D MMM');
            message += `- ${procedureMap.get(
                procedure
            )} (${formattedDate} в ${time})\n`;
        }

        const menuData = [{ text: 'Назад', callback: 'menu_to_main_menu' }];
        const keyboard = Markup.inlineKeyboard(
            MenuService.createMenu(menuData)
        );
        await ctx.editMessageText(message, keyboard);
        logger.debug(
            'Меню с процедурами, на которые записан пользователь создано'
        );
    }

    /**
     * Создаёт меню для отмены записей пользователя.
     */
    static async createCancelAppointmentsMenu(ctx, logger) {
        const { appointments } = ctx.session;

        if (!appointments || appointments.length === 0) {
            const message = await ctx.reply('У Вас нет записей на процедуры.');
            setTimeout(() => ctx.deleteMessage(message.message_id), 3000);
            return;
        }

        const procedures = await Procedure.find(
            {},
            { englishName: 1, russianName: 1 }
        ).catch((error) => {
            throw new DataBaseError('findProcedureError', error);
        });
        const procedureMap = new Map(
            procedures.map((p) => [p.englishName, p.russianName])
        );

        let message = 'Выберите запись для отмены:\n\n';
        const menuData = [];

        for (const { procedure, date, time } of appointments) {
            const formattedDate = moment(date).locale('ru').format('D MMM');
            const buttonText = `${procedureMap.get(
                procedure
            )} (${formattedDate} в ${time})`;
            menuData.push({
                text: buttonText,
                callback: `app_cancel_${procedure}_${moment(date).format(
                    'DD.MM.YYYY'
                )}_${time}`,
            });
        }

        menuData.push({ text: 'Назад', callback: 'menu_to_main_menu' });
        const keyboard = Markup.inlineKeyboard(
            MenuService.createMenu(menuData, 1)
        );
        await ctx.editMessageText(message, keyboard);
        logger.debug('Меню для отмены записей пользователя создано');
    }
}

module.exports = MenuCallback;
