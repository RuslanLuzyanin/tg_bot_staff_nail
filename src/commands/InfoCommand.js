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
     * Отправляет сообщение с описанием доступных команд.
     */
    async handle() {
        const message = `Доступные команды:\n\n${this.availableCommands
            .map((cmd) => `${cmd.name} - ${cmd.description}`)
            .join('\n')}\n`;

        await this.ctx.reply(message);
    }
}

module.exports = InfoCommand;
