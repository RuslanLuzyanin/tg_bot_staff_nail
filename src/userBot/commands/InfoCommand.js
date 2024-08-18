const ADMIN_MESSAGE =
    'Вы также можете отправить сообщение администратору, просто написав в чат.';

/**
 * Класс, обрабатывающий команду /info.
 */
class InfoCommand {
    static name = 'info';

    /**
     * Создает экземпляр класса InfoCommand.
     * @param {object} ctx - Контекст телеграф.
     */
    constructor(ctx) {
        this.ctx = ctx;
    }

    /**
     * Список доступных команд бота.
     * Каждый элемент содержит название команды и ее описание.
     */
    availableCommands = [
        {
            name: '/start',
            description: 'Запустить меню для записи на процедуры',
        },
        {
            name: '/contact',
            description: 'Посмотреть контакты в социальных сетях',
        },
        {
            name: '/portfolio',
            description: 'Просмотреть портфолио готовых работ',
        },
    ];

    /**
     * Обрабатывает команду /info.
     * Отправляет сообщение с описанием доступных команд и информацией о том, как связаться с администратором.
     */
    async handle() {
        const message = `Доступные команды:\n\n${this.availableCommands
            .map((cmd) => `${cmd.name} - ${cmd.description}`)
            .join('\n')}\n\n${ADMIN_MESSAGE}`;

        await this.ctx.reply(message);
    }
}

module.exports = InfoCommand;
