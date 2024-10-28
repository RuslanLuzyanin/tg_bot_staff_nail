const MenuService = require('../../shared/services/menuService');
const GetSlotHoursService = require('../services/getSlotHoursService');
const AvailableTimeService = require('../services/availableTimeService');

const {GroupProcedure, Procedure, WorkingTime, Record} = require('../../database/models/index');

const {Markup} = require('telegraf');
const moment = require('moment');
const {receptionAddress, regId} = require('../../config/config');

class MenuCallback {
    /**
     * Создаёт главное меню.
     *
     */
    static async createMainMenu(ctx) {
        const menuData = [
            {text: 'Запись на приём', callback: 'menu_to_slot_menu'},
            {text: 'Отменить запись', callback: 'menu_to_cancel_appointment'},
            {text: 'Проверить запись', callback: 'menu_to_check_appointment'},
        ];

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData));
        await ctx.editMessageText('Главное меню:', keyboard);
    }

    /**
     * Создаёт меню выбора слотов.
     *
     * Выбор слотов представляется из 4-ёх (утро, день, вечер, любые).
     *
     */
    static async createSlotMenu(ctx) {
        const {selectedSlot} = ctx.session;
        const {startTime, endTime} = await WorkingTime.findOne();

        const slotNames = {
            morning: 'Утро',
            day: 'День',
            evening: 'Вечер',
            any: 'Любые',
        };

        const morningSlot = GetSlotHoursService.getSlotHours('morning', startTime, endTime, 0);
        const daySlot = GetSlotHoursService.getSlotHours('day', startTime, endTime, 0);
        const eveningSlot = GetSlotHoursService.getSlotHours('evening', startTime, endTime, 0);
        const anySlot = GetSlotHoursService.getSlotHours('any', startTime, endTime, 0);

        const formatSlotTime = (slot) => `${slot[0].format('HH:mm')} - ${slot[1].format('HH:mm')}`;

        if (selectedSlot) {
            const slotTime = GetSlotHoursService.getSlotHours(selectedSlot, startTime, endTime, 0);

            const russianSlotName = slotNames[selectedSlot];

            const confirmMessage = [
                `✅ Текущий слот:`,
                `📅 ${russianSlotName} (${formatSlotTime(slotTime)}).\n`,
                `🔍 Этот слот позволит тебе легко находить подходящие даты и время для записи.\n`,
                `❓ Хочешь подтвердить свой выбор или изменить слот?`,
            ].join('\n');

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
                text: `${slotNames.morning} (${formatSlotTime(morningSlot)})`,
                callback: 'app_select_slot_morning',
            },
            {
                text: `${slotNames.day} (${formatSlotTime(daySlot)})`,
                callback: 'app_select_slot_day',
            },
            {
                text: `${slotNames.evening} (${formatSlotTime(eveningSlot)})`,
                callback: 'app_select_slot_evening',
            },
            {
                text: `${slotNames.any} (${formatSlotTime(anySlot)})`,
                callback: 'app_select_slot_any',
            },
        ];
        menuData.push({text: 'Назад', callback: 'menu_to_main_menu'});

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData, 1));

        const confirmMessage = [
            `🔍 Для удобства записи выбери временной промежуток. \n`,
            `📅 Определив конкретное время, ты увидишь доступные процедуры в этот период. \n`,
            `✨ Это поможет тебе быстро сориентироваться в вариантах и записаться на нужную процедуру.`,
        ].join('\n');

        await ctx.editMessageText(confirmMessage, keyboard);
    }

    /**
     * Создаёт меню выбора группы процедур.
     */
    static async createGroupProcedureMenu(ctx) {
        const groupProcedures = await GroupProcedure.find();

        const menuData = groupProcedures.map((groupProcedure) => ({
            text: groupProcedure.russianName,
            callback: `app_select_group_${groupProcedure.englishName}`,
        }));

        menuData.push({text: 'Назад', callback: 'menu_to_slot_menu'});

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData));
        await ctx.editMessageText('Выберите тип процедуры:', keyboard);
    }

    /**
     * Создаёт меню выбора процедуры.
     *
     * Если у пользователя уже есть 3 записи, выводит сообщение и не создает меню.
     *
     */
    static async createProcedureMenu(ctx) {
        const {appointments, selectedGroupProcedure} = ctx.session;
        const {from} = ctx;
        const userId = from.id.toString();

        if (appointments.length >= 3 && userId !== regId) {
            throw new Error('recordLimitError');
        }

        const procedures = await Procedure.find({englishName: {$regex: `^${selectedGroupProcedure}`}});

        let descriptionText = 'Описание процедур:\n\n';
        procedures.forEach(procedure => {
            const hours = Math.floor(procedure.duration);
            const minutes = Math.round((procedure.duration - hours) * 60);

            descriptionText += `${procedure.russianName}\n`;

            if (minutes === 0) {
                descriptionText += `Длительность: ${hours} ч.\n`;
            } else {
                descriptionText += `Длительность: ${hours} ч. ${minutes} мин.\n`;
            }

            descriptionText += `Цена: ${procedure.price} ₽\n\n`;
        });
        descriptionText += 'Подробнее о процедурах написано в прайс-листе😉\n'
        descriptionText += 'Выберите процедуру:\n\n';

        const menuData = procedures.map((procedure) => ({
            text: procedure.russianName,
            callback: `app_select_procedure_${procedure.englishName}`,
        }));

        menuData.push({text: 'Назад', callback: 'menu_to_group_procedure_menu'});

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData, 1));
        await ctx.editMessageText(descriptionText, keyboard);
    }

    /**
     * Создаёт меню выбора месяца.
     *
     * Выбор месяца представляется из 2-ух (текущий и следующий).
     *
     */
    static async createMonthMenu(ctx) {
        const currentDate = moment();
        const isLastDayOfMonth = currentDate.date() === currentDate.daysInMonth();
        let currentMonth, currentYear, nextMonth, nextYear;

        if (isLastDayOfMonth) {
            currentMonth = (currentDate.month() + 2) % 12 || 12;
            currentYear = currentMonth === 1 ? currentDate.year() + 1 : currentDate.year();
            nextMonth = (currentMonth % 12) + 1;
            nextYear = nextMonth === 1 ? currentYear + 1 : currentYear;
        } else {
            currentMonth = currentDate.month() + 1;
            currentYear = currentDate.year();
            nextMonth = (currentMonth % 12) + 1;
            nextYear = nextMonth === 1 ? currentYear + 1 : currentYear;
        }

        function formatMonthYear(month, year) {
            const monthName = moment(`${year}-${month}`, 'YYYY-M').locale('ru').format('MMMM');
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
            {text: 'Назад', callback: 'menu_to_procedure_menu'},
        ];

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData, 2));
        await ctx.editMessageText('Выберите месяц:', keyboard);
    }

    /**
     * Создаёт меню выбора дня.
     *
     * Выбор дня представляется из дней выбранного месяца, начиная с сегодняшнего дня, если
     * месяц текущий, и с 1-го дня, если следующий.
     * Если день не доступен из-за выходного или занятости - не отображается, учитывает
     * выбранный слот.
     *
     */
    static async createDayMenu(ctx) {
        const {selectedMonth, selectedYear, selectedProcedure, selectedSlot} = ctx.session;
        const currentDate = moment();
        let startDate;

        if (selectedMonth !== currentDate.format('M')) {
            startDate = moment(`${selectedYear}-${selectedMonth}-01`, 'YYYY-MM-DD').startOf('month');
        } else {
            startDate = moment().add(1, 'day').startOf('day');
        }

        const endDate = moment(startDate).endOf('month');
        const menuData = [];

        const {startTime, endTime} = await WorkingTime.findOne();
        const procedures = await Procedure.find({}, {englishName: 1, duration: 1});
        const selectedProcedureDuration = procedures.find(
            (proc) => proc.englishName === selectedProcedure
        ).duration;

        const [slotStartMoment, slotEndMoment] = GetSlotHoursService.getSlotHours(
            selectedSlot,
            startTime,
            endTime,
            selectedProcedureDuration
        );

        while (startDate.isSameOrBefore(endDate)) {
            const formattedDate = startDate.format('DD.MM.YYYY');
            let isDateAvailable = false;

            const records = await Record.find({
                date: startDate.toDate(),
                time: {
                    $gte: slotStartMoment.format('HH:mm'),
                    $lt: slotEndMoment.format('HH:mm'),
                },
            });

            const availableTimes = AvailableTimeService.getAvailableTimes({
                slotStartTime: slotStartMoment.format('HH:mm'),
                slotEndTime: slotEndMoment.format('HH:mm'),
                records,
                procedureDuration: selectedProcedureDuration,
                procedures,
            });

            if (availableTimes.length > 0) {
                isDateAvailable = true;
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

        menuData.push({text: 'Назад', callback: `menu_to_month_menu`});

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData, 3));
        await ctx.editMessageText('Выберите день:', keyboard);
    }

    /**
     * Создаёт меню выбора времени.
     *
     * Выбор времени предоставляется исходя из выбранного слота и доступных записей.
     *
     */
    static async createTimeMenu(ctx) {
        const {selectedProcedure, selectedDate, selectedSlot} = ctx.session;
        const {startTime, endTime} = await WorkingTime.findOne();
        const procedures = await Procedure.find({}, {englishName: 1, duration: 1});
        const selectedProcedureDuration = procedures.find(
            (proc) => proc.englishName === selectedProcedure
        ).duration;

        const [slotStartMoment, slotEndMoment] = GetSlotHoursService.getSlotHours(
            selectedSlot,
            startTime,
            endTime,
            selectedProcedureDuration
        );

        const records = await Record.find({
            date: selectedDate,
        });

        const availableTimes = AvailableTimeService.getAvailableTimes({
            slotStartTime: slotStartMoment.format('HH:mm'),
            slotEndTime: slotEndMoment.format('HH:mm'),
            records,
            procedureDuration: selectedProcedureDuration,
            procedures,
        });

        const menuData = availableTimes.map((time) => ({
            text: time,
            callback: `app_select_time_${time}`,
        }));

        menuData.push({text: 'Назад', callback: `menu_to_day_menu`});

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData, 4));
        await ctx.editMessageText('Выберите время:', keyboard);
    }

    /**
     * Создаёт меню подтверждения процедуры.
     *
     * Данные берутся из сессий.
     *
     */
    static async createConfirmationMenu(ctx) {
        const {selectedDate, selectedTime, selectedProcedure: selectedProcedureEnglishName} = ctx.session;
        const selectedDateMoment = moment(selectedDate, 'DD.MM.YYYY');
        const formattedDate = selectedDateMoment.locale('ru').format('D MMM');
        const dayOfWeek = selectedDateMoment.locale('ru').format('dddd');

        const procedures = await Procedure.find({});
        const {
            duration: selectedProcedureDuration,
            russianName: selectedProcedureRussianName,
            price: selectedProcedurePrice
        } =
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

        const hours = Math.floor(selectedProcedureDuration);
        const minutes = Math.round((selectedProcedureDuration - hours) * 60);

        const message = [
            `🗓️ Записываю на`,
            `      ${formattedDate} (${dayOfWeek}) в ${selectedTime}?`,
            `💼 Твоя процедура: ${selectedProcedureRussianName}`,
            `⏳ Длительность: ${minutes === 0 ? `${hours} ч.` : `${hours} ч. ${minutes} мин.`}`,
            `🏷️ Цена: ${selectedProcedurePrice} ₽`,
        ].join('\n');

        const menuData = [
            {text: 'Подтвердить', callback: 'app_confirm'},
            {text: 'Назад', callback: 'menu_to_time_menu'},
        ];

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData));

        await ctx.editMessageText(message, keyboard);
    }

    /**
     * Создаёт меню с записями, на которые записан пользователь.
     *
     */
    static async createCheckAppointmentsMenu(ctx) {
        const {appointments} = ctx.session;

        if (!appointments || appointments.length === 0) {
            const message = await ctx.reply('У Вас нет записей на процедуры.');
            setTimeout(() => ctx.deleteMessage(message.message_id), 3000);
            return;
        }

        const procedures = await Procedure.find({}, {englishName: 1, russianName: 1});
        const procedureMap = new Map(procedures.map((p) => [p.englishName, p.russianName]));

        let message = [
            `Жду тебя к себе в гости💖`,
            `🏠 По адресу: ${receptionAddress}.\n`,
            `Твои записи на процедуры:\n`,
        ].join('\n');

        for (const {procedure, date, time} of appointments) {
            const formattedDate = moment(date).locale('ru').format('D MMM');
            message += `☑️ ${procedureMap.get(procedure)} (${formattedDate} в ${time})\n`;
        }

        const menuData = [{text: 'Назад', callback: 'menu_to_main_menu'}];
        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData));
        await ctx.editMessageText(message, keyboard);
    }

    /**
     * Создаёт меню для отмены записей пользователя.
     *
     */
    static async createCancelAppointmentsMenu(ctx) {
        const {appointments} = ctx.session;

        if (!appointments || appointments.length === 0) {
            const message = await ctx.reply('У Вас нет записей на процедуры.');
            setTimeout(() => ctx.deleteMessage(message.message_id), 3000);
            return;
        }

        const procedures = await Procedure.find({}, {englishName: 1, russianName: 1});
        const procedureMap = new Map(procedures.map((p) => [p.englishName, p.russianName]));

        let message = 'Выберите запись для отмены:\n\n';
        const menuData = [];

        for (const {procedure, date, time} of appointments) {
            const formattedDate = moment(date).locale('ru').format('D MMM');
            const buttonText = `${procedureMap.get(procedure)} (${formattedDate} в ${time})`;
            menuData.push({
                text: buttonText,
                callback: `app_cancel_${procedure}_${moment(date).format('DD.MM.YYYY')}_${time}`,
            });
        }

        menuData.push({text: 'Назад', callback: 'menu_to_main_menu'});
        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData, 1));
        await ctx.editMessageText(message, keyboard);
    }
}

module.exports = MenuCallback;
