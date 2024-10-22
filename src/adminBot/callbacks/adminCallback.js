const { User, Procedure, Price, Record, Portfolio, Notification } = require('../../database/models/index');

const moment = require('moment');
const fs = require('fs');
const path = require('path');

class AdminCallback {
    /**
     * Обрабатывает действие блокировки пользователя.
     */

    static async handleBlockUser(ctx) {
        const { callbackQuery } = ctx;
        const userId = callbackQuery.data.split('_').slice(2).join('_');
        await User.updateOne({ id: userId }, { isBanned: true });
        await Record.deleteMany({ userId: userId });
        const message = await ctx.reply(`Пользователь с ID ${userId} был заблокирован.`);
        setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
    }

    /**
     * Обрабатывает действие разблокировки пользователя.
     */

    static async handleUnBlockUser(ctx) {
        const { callbackQuery } = ctx;
        const userId = callbackQuery.data.split('_').slice(2).join('_');
        await User.updateOne({ id: userId }, { isBanned: false });
        const message = await ctx.reply(`Пользователь с ID ${userId} был разблокирован.`);
        setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
    }

    /**
     * Обрабатывает действие отображения оповещения.
     */

    static async handleViewNotification(ctx) {
        const notification = await Notification.findOne();

        if (!notification) {
            const message = await ctx.reply('Нет оповещения.');
            setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
            return;
        }

        const filePath = path.join(process.cwd(), notification.photoNotification);

        await ctx.reply('Существующее оповещение:');
        await ctx.telegram.sendPhoto(
            ctx.chat.id,
            { source: filePath },
            { caption: notification.messageNotification }
        );
    }

    /**
     * Обрабатывает действие удаления оповещения.
     */

    static async handleDeleteNotification(ctx) {
        const filePath = path.join(process.cwd(), 'data', 'photo', 'notification', 'notificationPhoto.jpg');
        fs.unlinkSync(filePath);
        await Notification.deleteOne({});
        const message = await ctx.reply('Оповещение успешно удалено.');
        setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
    }

    /**
     * Обрабатывает действие удаления процедуры.
     */

    static async handleDeleteProcedure(ctx) {
        const { callbackQuery } = ctx;
        const [, , , englishName] = callbackQuery.data.split('_');

        const result = await Procedure.deleteOne({ englishName });

        if (result.deletedCount > 0) {
            const message = await ctx.reply(`Процедура "${englishName}" успешно удалена.`);
            setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
        } else {
            const message = await ctx.reply(`Процедура "${englishName}" не найдена.`);
            setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
        }
    }

    /**
     * Обрабатывает действие удаления прайс-листа.
     */

    static async handleDeletePrice(ctx) {
        const { callbackQuery } = ctx;
        const [, , , priceIndex] = callbackQuery.data.split('_');

        const filePath = path.join(process.cwd(), 'data', 'photo', 'price', `photoPrice_${priceIndex}.jpg`);

        await Price.deleteOne({ key: priceIndex });

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            const message = await ctx.reply(`Фотография ${priceIndex} успешно удалена.`);
            setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
        } else {
            const message = await ctx.reply(`Фотография ${priceIndex} не найдена.`);
            setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
        }
    }

    /**
     * Обрабатывает действие создания прайс-листа.
     */

    static async handleCreatePrice(ctx) {
        const { callbackQuery } = ctx;
        const [, , , priceIndex] = callbackQuery.data.split('_');

        const newPrice = new Price({
            key: parseInt(priceIndex),
            image: null,
        });

        await newPrice.save();

        const message = await ctx.reply(`Новая запись с индексом ${priceIndex} успешно создана.`);
        setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
    }

    /**
     * Обрабатывает действие удаления портфолио.
     */

    static async handleDeletePortfolio(ctx) {
        const { callbackQuery } = ctx;
        const [, , , portfolioIndex] = callbackQuery.data.split('_');

        const filePath = path.join(
            process.cwd(),
            'data',
            'photo',
            'portfolio',
            `photoPortfolio_${portfolioIndex}.jpg`
        );

        await Portfolio.deleteOne({ key: portfolioIndex });
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            const message = await ctx.reply(`Фотография ${portfolioIndex} успешно удалена.`);
            setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
        } else {
            const message = await ctx.reply(`Фотография ${portfolioIndex} не найдена.`);
            setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
        }
    }

    /**
     * Обрабатывает действие создания портфоллио.
     */

    static async handleCreatePortfolio(ctx) {
        const { callbackQuery } = ctx;
        const [, , , portfolioIndex] = callbackQuery.data.split('_');

        const newPortfolio = new Portfolio({
            key: parseInt(portfolioIndex),
            image: null,
        });

        await newPortfolio.save();

        const message = await ctx.reply(`Новая запись с индексом ${portfolioIndex} успешно создана.`);
        setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
    }

    /**
     * Обрабатывает действие получения записей.
     */

    static async getRecordsData(ctx) {
        const records = await Record.find({}, { userId: 1, procedure: 1, date: 1, time: 1 }).sort({
            date: 1,
            time: 1,
        });

        const procedures = await Procedure.find().select('englishName russianName duration');
        const procedureMap = procedures.reduce((map, proc) => {
            map[proc.englishName] = { russianName: proc.russianName, duration: proc.duration };
            return map;
        }, {});

        const users = await User.find(
            { id: { $in: records.map((r) => r.userId) } },
            { id: 1, name: 1 }
        ).exec();
        const userMap = users.reduce((map, user) => {
            map[user.id] = user.name;
            return map;
        }, {});

        const recordsData = records.map((record) => ({
            name: userMap[record.userId],
            procedure: procedureMap[record.procedure].russianName,
            date: record.date,
            time: record.time,
        }));

        ctx.state.recordsData = recordsData;
    }

    /**
     * Обрабатывает действие получения записей на 3 дня.
     */

    static async getRecordsDataThreeDays(ctx) {
        const today = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(today.getDate() + 3);

        const records = await Record.find(
            {
                date: { $lte: threeDaysLater },
            },
            {
                userId: 1,
                procedure: 1,
                date: 1,
                time: 1,
            }
        ).sort({
            date: 1,
            time: 1,
        });

        const procedures = await Procedure.find().select('englishName russianName duration');
        const procedureMap = procedures.reduce((map, proc) => {
            map[proc.englishName] = { russianName: proc.russianName, duration: proc.duration };
            return map;
        }, {});

        const users = await User.find(
            { id: { $in: records.map((r) => r.userId) } },
            { id: 1, name: 1 }
        ).exec();
        const userMap = users.reduce((map, user) => {
            map[user.id] = user.name;
            return map;
        }, {});

        const recordsData = records.map((record) => ({
            name: userMap[record.userId],
            procedure: procedureMap[record.procedure].russianName,
            date: record.date,
            time: record.time,
        }));

        ctx.state.recordsData = recordsData;
    }

    /**
     * Обрабатывает действие выбора месяца.
     */

    static async handleSelectMonth(ctx) {
        const { callbackQuery, session } = ctx;
        const [, , , month, year] = callbackQuery.data.split('_');
        session.selectedMonth = month;
        session.selectedYear = year;
    }

    /**
     * Обрабатывает действие удаления выходного дня.
     */

    static async handleDeleteDayOff(ctx) {
        const { callbackQuery } = ctx;
        const [, , , , day, month, year] = callbackQuery.data.split('_');
        const date = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD').toDate();

        await Record.deleteMany({
            date: {
                $gte: date,
                $lt: moment(date).add(1, 'day').toDate(),
            },
            procedure: 'Off',
        });

        const message = await ctx.reply(`Выходной на ${moment(date).format('DD.MM.YYYY')} был удален.`);
        setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
    }

    /**
     * Обрабатывает действие создания оповещения.
     */

    static async handleCreateNotification(ctx) {
        await ctx.scene.enter('create_notification');
    }

    /**
     * Обрабатывает действие изменения процедуры.
     */

    static async handleEditProcedure(ctx) {
        await ctx.scene.enter('edit_procedure');
    }

    /**
     * Обрабатывает действие подтверждения выходного.
     */

    static async handleConfirmDayOff(ctx) {
        await ctx.scene.enter('update_day_off');
    }

    /**
     * Обрабатывает действие создания процедуры.
     */

    static async handleCreateProcedure(ctx) {
        await ctx.scene.enter('create_procedure');
    }

    /**
     * Обрабатывает действие создания прайс листа.
     */

    static async handleUpdatePrice(ctx) {
        await ctx.scene.enter('update_price');
    }

    /**
     * Обрабатывает действие обновления портфолио.
     */

    static async handleUpdatePortfolio(ctx) {
        await ctx.scene.enter('update_portfolio');
    }

    /**
     * Обрабатывает действие обновления рабочих часов.
     */

    static async handleUpdateWorkingHours(ctx) {
        await ctx.scene.enter('update_working_hours');
    }
}

module.exports = AdminCallback;
