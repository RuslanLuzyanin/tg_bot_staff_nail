const { Markup } = require('telegraf');
const { getMainMenu, getBackToMenuButton } = require('../utils/menu');
const {
	getProcedureButtons,
	getTimeButtons,
	availableAppointments,
	workingHours,
} = require('../services/appointmentService');

function setupActions(bot) {
	bot.action('back_to_date', (ctx) => {
		if (ctx.session) {
			ctx.session.procedure = null;
		}
		ctx.editMessageText('Выберите процедуру:', getProcedureButtons());
	});
	bot.action('book_appointment', (ctx) => {
		ctx.editMessageText('Выберите процедуру:', getProcedureButtons());
	});

	Object.keys(availableAppointments).forEach((procedureKey) => {
		bot.action(`book_${procedureKey.toLowerCase()}`, async (ctx) => {
			ctx.session = ctx.session || {};

			await ctx.telegram.answerCbQuery(ctx.callbackQuery.id);

			ctx.session.procedure = procedureKey;

			let tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			const dateStr = tomorrow.toLocaleDateString('ru-RU');
			ctx.editMessageText(
				`Выберите время для ${procedureKey} на ${dateStr}:`,
				getTimeButtons()
			);
		});
	});

	workingHours.forEach((time) => {
		bot.action(`book_time_${time}`, async (ctx) => {
			let tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			const dateStr = tomorrow.toLocaleDateString('ru-RU');
			const procedure = ctx.session.procedure;

			if (!procedure) {
				await ctx.reply(
					'Произошла ошибка: название процедуры не определено.'
				);
				return;
			}

			await ctx.telegram.sendMessage(
				ctx.from.id,
				`Вы зарегистрировались на ${procedure} ${dateStr} в ${time}.`
			);

			await ctx.editMessageText('Выберите опцию:', getMainMenu());
		});
	});

	bot.action('cancel_appointment', (ctx) => {
		ctx.editMessageText(
			'Функция отмены записи',
			Markup.inlineKeyboard([getBackToMenuButton()])
		);
	});

	bot.action('check_appointment', (ctx) => {
		ctx.editMessageText(
			'Функция проверки записи',
			Markup.inlineKeyboard([getBackToMenuButton()])
		);
	});

	bot.action('back_to_menu', (ctx) => {
		ctx.editMessageText('Выберите опцию:', getMainMenu());
	});
}

module.exports = { setupActions };
