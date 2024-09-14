const User = require('../../database/models/user');
const Procedure = require('../../database/models/procedure');
const Price = require('../../database/models/price');
const Record = require('../../database/models/record');
const Portfolio = require('../../database/models/portfolio');
const Notification = require('../../database/models/notification');
const moment = require('moment');

class AdminCallback {
    static async handleBlockUser(ctx) {
        const { callbackQuery } = ctx;
        const userId = callbackQuery.data.split('_').slice(2).join('_');
        await User.updateOne({ id: userId }, { isBanned: true });
        const message = await ctx.reply(`Пользователь с ID ${userId} был заблокирован.`);
        setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
    }

    static async handleUnBlockUser(ctx) {
        const { callbackQuery } = ctx;
        const userId = callbackQuery.data.split('_').slice(2).join('_');
        await User.updateOne({ id: userId }, { isBanned: false });
        const message = await ctx.reply(`Пользователь с ID ${userId} был разблокирован.`);
        setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
    }

    static async handleViewNotification(ctx) {
        const notification = await Notification.findOne();

        if (!notification) {
            const message = await ctx.reply('Нет оповещения.');
            setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
            return;
        }

        const mediaGroup = [
            {
                type: 'photo',
                media: { source: notification.photoNotification },
                caption: notification.messageNotification,
            },
        ];

        await ctx.reply('Существующее оповещение:');
        await ctx.telegram.sendMediaGroup(ctx.chat.id, mediaGroup);
    }

    static async handleDeleteNotification(ctx) {
        await Notification.deleteOne({});
        const message = await ctx.reply('Оповещение успешно удалено.');
        setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
    }

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

    static async handleDeletePrice(ctx) {
        const { callbackQuery } = ctx;
        const [, , , priceIndex] = callbackQuery.data.split('_');

        const result = await Price.deleteOne({ key: priceIndex });

        if (result.deletedCount > 0) {
            const message = await ctx.reply(`Фотография ${priceIndex} успешно удалена.`);
            setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
        } else {
            const message = await ctx.reply(`Фотография ${priceIndex} не найдена.`);
            setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
        }
    }

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

    static async handleDeletePortfolio(ctx) {
        const { callbackQuery } = ctx;
        const [, , , portfolioIndex] = callbackQuery.data.split('_');

        const result = await Portfolio.deleteOne({ key: portfolioIndex });

        if (result.deletedCount > 0) {
            const message = await ctx.reply(`Фотография ${portfolioIndex} успешно удалена.`);
            setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
        } else {
            const message = await ctx.reply(`Фотография ${portfolioIndex} не найдена.`);
            setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
        }
    }

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

    static async getRecordsData(ctx) {
        const { id: userId } = ctx.from;
        const records = await Record.find(
            { userId: { $ne: userId } },
            { userId: 1, procedure: 1, date: 1, time: 1 }
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

        const recordsData = [];
        let skipCount = 0;

        for (const record of records) {
            if (skipCount > 0) {
                skipCount--;
                continue;
            }

            const { duration } = procedureMap[record.procedure];
            skipCount = duration - 1;

            recordsData.push({
                name: userMap[record.userId],
                procedure: procedureMap[record.procedure].russianName,
                date: record.date,
                time: record.time,
            });
        }

        ctx.state.recordsData = recordsData;
    }

    static async handleSelectMonth(ctx) {
        const { callbackQuery, session } = ctx;
        const [, , , month, year] = callbackQuery.data.split('_');
        session.selectedMonth = month;
        session.selectedYear = year;
    }

    static async handleDeleteDayOff(ctx) {
        const { callbackQuery } = ctx;
        const [, , , , day, month, year] = callbackQuery.data.split('_');
        const date = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD').toDate();

        await Record.deleteMany({
            date: {
                $gte: date,
                $lt: moment(date).add(1, 'day').toDate(),
            },
            procedure: 'OFF',
        });

        const message = await ctx.reply(`Выходной на ${moment(date).format('DD.MM.YYYY')} был удален.`);
        setTimeout(() => ctx.deleteMessage(message.message_id), 5000);
    }

    static async handleCreateNotification(ctx) {
        await ctx.scene.enter('create_notification');
    }

    static async handleEditProcedure(ctx) {
        await ctx.scene.enter('edit_procedure');
    }

    static async handleConfirmDayOff(ctx) {
        await ctx.scene.enter('update_day_off');
    }

    static async handleCreateProcedure(ctx) {
        await ctx.scene.enter('create_procedure');
    }

    static async handleUpdatePrice(ctx) {
        await ctx.scene.enter('update_price');
    }

    static async handleUpdatePortfolio(ctx) {
        await ctx.scene.enter('update_portfolio');
    }

    static async handleUpdateWorkingHours(ctx) {
        await ctx.scene.enter('update_working_hours');
    }
}

module.exports = AdminCallback;
