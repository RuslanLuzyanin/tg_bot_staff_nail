class InfoCommand {
    static name = 'info';
    constructor(ctx) {
        this.ctx = ctx;
    }

    async handle() {
        const message = `Доступные команды:
        
/start - Запустить меню для записи на процедуры
/contact - Посмотреть контакты в социальных сетях
/portfolio - Просмотреть портфолио готовых работ
        
        `;

        await this.ctx.reply(message);
    }
}

module.exports = InfoCommand;
