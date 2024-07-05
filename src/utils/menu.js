const { Markup } = require('telegraf');

function getMainMenu() {
	return Markup.inlineKeyboard([
		[
			Markup.button.callback('Записаться на приём', 'book_appointment'),
			Markup.button.callback('Отменить запись', 'cancel_appointment'),
		],
		[Markup.button.callback('Проверить запись', 'check_appointment')],
	]);
}

function getBackToMenuButton() {
	return Markup.button.callback('Назад', 'back_to_menu');
}

module.exports = { getMainMenu, getBackToMenuButton };
