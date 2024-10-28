const MenuService = require('../../shared/services/menuService');

const { User, Record, Price, Portfolio, Procedure } = require('../../database/models/index');

const { Markup } = require('telegraf');
const moment = require('moment');
const path = require('path');
const {GroupProcedure} = require("../../database/models");

class MenuCallback {
    /**
     * Создаёт главное меню.
     */

    static async createMainMenu(ctx) {
        const menuData = [
            { text: 'Заблокировать пользователя', callback: 'menu_block_user' },
            { text: 'Разблокировать пользователя', callback: 'menu_unblock_user' },
            { text: 'Создать оповещение', callback: 'admin_create_notification' },
            { text: 'Отобразить оповещение', callback: 'admin_view_notification' },
            { text: 'Удалить оповещение', callback: 'admin_delete_notification' },
            { text: 'Проверить записи', callback: 'menu_check_records' },
            { text: 'Проверить записи 3 дня', callback: 'menu_check_three_days_records' },
            { text: 'Изменить процедуры', callback: 'menu_procedures' },
            { text: 'Изменить рабочие часы', callback: 'admin_update_hours' },
            { text: 'Изменить прайс-листы', callback: 'menu_price' },
            { text: 'Изменить портфолио', callback: 'menu_portfolio' },
            { text: 'Выбрать выходной', callback: 'menu_select_day_off' },
            { text: 'Убрать выходной', callback: 'menu_delete_day_off' },
        ];

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData, 1));
        await ctx.editMessageText('Главное меню:', keyboard);
    }

    /**
     * Создаёт меню блокировки пользователей.
     */

    static async createBlocUserMenu(ctx) {
        const users = await User.find(
            { isBanned: false },
            { id: 1, name: 1, first_name: 1, last_name: 1 }
        ).exec();

        const menuData = users.map((user) => ({
            text: `${user.first_name} ${user.last_name} (@${user.name})`,
            callback: `admin_block_${user.id}`,
        }));

        menuData.push({
            text: 'Назад',
            callback: 'menu_main',
        });

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData, 1));
        await ctx.editMessageText('Выберите пользователя для блокировки:', keyboard);
    }

    /**
     * Создаёт меню разблокировки пользователей.
     */

    static async createUnBlocUserMenu(ctx) {
        const users = await User.find(
            { isBanned: true },
            { id: 1, name: 1, first_name: 1, last_name: 1 }
        ).exec();

        const menuData = users.map((user) => ({
            text: `${user.first_name} ${user.last_name} (@${user.name})`,
            callback: `admin_unblock_${user.id}`,
        }));

        menuData.push({
            text: 'Назад',
            callback: 'menu_main',
        });

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData, 1));
        await ctx.editMessageText('Выберите пользователя для разблокировки:', keyboard);
    }

    /**
     * Создаёт меню изменения процедур.
     */

    static async createProcedureMenu(ctx) {
        const message = 'Можете обновить или удалить существующие процедуры, а также добавить новую';
        const menuData = [];

        const procedures = await Procedure.find(
            { englishName: { $ne: 'Off' } },
            { englishName: 1, russianName: 1, duration: 1 }
        ).sort({
            russianName: 1,
        });

        for (const procedure of procedures) {
            const { englishName, russianName, duration } = procedure;
            menuData.push({
                text: `${russianName} - ${duration} часа`,
                callback: `admin_update_procedure_${englishName}`,
            });
            menuData.push({
                text: `Удалить ${russianName}`,
                callback: `admin_delete_procedure_${englishName}`,
            });
        }

        menuData.push({
            text: 'Создать новую процедуру',
            callback: 'admin_select_group',
        });
        menuData.push({
            text: 'Назад',
            callback: 'menu_main',
        });

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData));
        await ctx.editMessageText(message, keyboard);
    }

    /**
     * Создаёт меню выбора группы для создания процедуры.
     */
    static async createGroupProcedureMenu(ctx) {
        const groupProcedures = await GroupProcedure.find()

        const menuData = groupProcedures.map((groupProcedure) => ({
            text: groupProcedure.russianName,
            callback: `admin_create_procedure_${groupProcedure.englishName}`,
        }));

        menuData.push({ text: 'Назад', callback: 'menu_procedures' });

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData));
        await ctx.editMessageText('Выберите группу процедур:', keyboard);
    }

    /**
     * Создаёт меню изменения прайс-листов.
     */

    static async createPriceMenu(ctx) {
        const message = 'Можете обновить или удалить фотографии, а также добавить ещё одну фотографию';
        const menuData = [];

        const prices = await Price.find({}, { key: 1, image: 1 }).sort({ key: 1 });
        const existingKeys = prices.map((price) => price.key);

        for (const price of prices) {
            const { key, image } = price;
            const hasImage = !!image;
            const buttonText = hasImage ? `Фото ${key}-ой` : `Добавить ${key}-ую`;
            menuData.push({ text: buttonText, callback: `admin_update_price_${key}` });
            menuData.push({ text: `Удалить ${key}-ую`, callback: `admin_delete_price_${key}` });
        }

        let nextKey = 1;
        while (existingKeys.includes(nextKey)) {
            nextKey++;
        }

        menuData.push({ text: `Создать ${nextKey}-ую`, callback: `admin_create_price_${nextKey}` });
        menuData.push({ text: 'Назад', callback: 'menu_main' });

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData));
        await ctx.editMessageText(message, keyboard);

        const { telegram, chat } = ctx;

        const mediaGroup = prices
            .filter((price) => price.image)
            .map((price) => {
                const filePath = path.join(process.cwd(), price.image);
                return { type: 'photo', media: { source: filePath } };
            });

        if (mediaGroup.length > 0) {
            const messages = await telegram.sendMediaGroup(chat.id, mediaGroup);
            setTimeout(() => {
                for (const message of messages) {
                    telegram.deleteMessage(chat.id, message.message_id);
                }
            }, 7000);
        }
    }

    /**
     * Создаёт меню изменения портфолио.
     */

    static async createPortfolioMenu(ctx) {
        const message = 'Можете обновить или удалить фотографии, а также добавить ещё одну фотографию';
        const menuData = [];

        const portfolios = await Portfolio.find({}, { key: 1, image: 1 }).sort({ key: 1 });
        const existingKeys = portfolios.map((portfolio) => portfolio.key);

        for (const portfolio of portfolios) {
            const { key, image } = portfolio;
            const hasImage = !!image;
            const buttonText = hasImage ? `Фото ${key}-ой` : `Добавить ${key}-ую`;
            menuData.push({ text: buttonText, callback: `admin_update_portfolio_${key}` });
            menuData.push({ text: `Удалить ${key}-ую`, callback: `admin_delete_portfolio_${key}` });
        }

        let nextKey = 1;
        while (existingKeys.includes(nextKey)) {
            nextKey++;
        }

        menuData.push({ text: `Создать ${nextKey}-ую`, callback: `admin_create_portfolio_${nextKey}` });
        menuData.push({ text: 'Назад', callback: 'menu_main' });

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData));
        await ctx.editMessageText(message, keyboard);

        const { telegram, chat } = ctx;

        const mediaGroup = portfolios
            .filter((portfolio) => portfolio.image)
            .map((portfolio) => {
                const filePath = path.join(process.cwd(), portfolio.image);
                return { type: 'photo', media: { source: filePath } };
            });

        if (mediaGroup.length > 0) {
            const messages = await telegram.sendMediaGroup(chat.id, mediaGroup);
            setTimeout(() => {
                for (const message of messages) {
                    telegram.deleteMessage(chat.id, message.message_id);
                }
            }, 7000);
        }
    }

    /**
     * Создаёт меню записей пользователей.
     */

    static async createCheckRecordsMenu(ctx) {
        const recordsData = ctx.state.recordsData;
        if (recordsData.length === 0) {
            const message = await ctx.reply('Нет записей на процедуры.');
            setTimeout(() => ctx.deleteMessage(message.message_id), 3000);
            return;
        }

        let message = 'Записи на процедуры:\n\n';
        for (const { name, procedure, date, time } of recordsData) {
            const formattedDate = moment(date).locale('ru').format('D MMM');
            message += `${procedure}: ${formattedDate} ${time} - @${name} \n\n`;
        }

        const menuData = [{ text: 'Назад', callback: 'menu_main' }];
        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData));
        await ctx.editMessageText(message, keyboard);
    }

    /**
     * Создаёт меню выбора месяца для выбора выходного.
     */

    static async createSelectMonthMenu(ctx) {
        const currentDate = moment();
        const currentMonth = currentDate.month() + 1;
        const currentYear = currentDate.year();
        const nextMonth = (currentMonth % 12) + 1;
        const nextYear = nextMonth === 1 ? currentYear + 1 : currentYear;
        const nextNextMonth = (nextMonth % 12) + 1;
        const nextNextYear = nextNextMonth === 1 ? nextYear + 1 : nextYear;

        function formatMonthYear(month, year) {
            const monthName = moment(`${year}-${month}`, 'YYYY-M').locale('ru').format('MMMM');
            return `${monthName[0].toUpperCase() + monthName.slice(1)} ${year}`;
        }

        const menuData = [
            {
                text: formatMonthYear(currentMonth, currentYear),
                callback: `menu_select_month_${currentMonth}_${currentYear}`,
            },
            {
                text: formatMonthYear(nextMonth, nextYear),
                callback: `menu_select_month_${nextMonth}_${nextYear}`,
            },
            {
                text: formatMonthYear(nextNextMonth, nextNextYear),
                callback: `menu_select_month_${nextNextMonth}_${nextNextYear}`,
            },
            { text: 'Назад', callback: 'menu_main' },
        ];

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData, 2));
        await ctx.editMessageText('Выберите месяц:', keyboard);
    }

    /**
     * Создаёт меню выбора месяца для удаления выходного.
     */

    static async createDeleteMonthMenu(ctx) {
        const currentDate = moment();
        const currentMonth = currentDate.month() + 1;
        const currentYear = currentDate.year();
        const nextMonth = (currentMonth % 12) + 1;
        const nextYear = nextMonth === 1 ? currentYear + 1 : currentYear;
        const nextNextMonth = (nextMonth % 12) + 1;
        const nextNextYear = nextNextMonth === 1 ? nextYear + 1 : nextYear;

        function formatMonthYear(month, year) {
            const monthName = moment(`${year}-${month}`, 'YYYY-M').locale('ru').format('MMMM');
            return `${monthName[0].toUpperCase() + monthName.slice(1)} ${year}`;
        }

        const menuData = [
            {
                text: formatMonthYear(currentMonth, currentYear),
                callback: `menu_delete_month_${currentMonth}_${currentYear}`,
            },
            {
                text: formatMonthYear(nextMonth, nextYear),
                callback: `menu_delete_month_${nextMonth}_${nextYear}`,
            },
            {
                text: formatMonthYear(nextNextMonth, nextNextYear),
                callback: `menu_delete_month_${nextNextMonth}_${nextNextYear}`,
            },
            { text: 'Назад', callback: 'menu_main' },
        ];

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData, 2));
        await ctx.editMessageText('Выберите месяц:', keyboard);
    }

    /**
     * Создаёт меню выбора дня для удаления выходного.
     */

    static async createDeleteDayOffMenu(ctx) {
        const { selectedMonth, selectedYear } = ctx.session;
        const startDate = new Date(selectedYear, Number(selectedMonth) - 1, 1);
        const endDate = new Date(selectedYear, Number(selectedMonth), 0);

        const records = await Record.find(
            {
                date: { $gte: startDate, $lte: endDate },
                procedure: 'Off',
            },
            { date: 1 }
        );

        const menuData = records.map((record) => ({
            text: moment(record.date).format('DD.MM.YYYY'),
            callback: `admin_delete_day_off_${moment(record.date).format('DD_MM_YYYY')}`,
        }));

        menuData.push({
            text: 'Назад',
            callback: 'menu_main',
        });

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData, 3));
        await ctx.editMessageText('Выберите день, чтобы удалить выходной:', keyboard);
    }
}

module.exports = MenuCallback;
