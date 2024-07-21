function getUserIdFromContext(ctx) {
    if (ctx && ctx.from && ctx.from.id) {
        return ctx.from.id;
    } else {
        throw new Error('Невозможно получить идентификатор пользователя из контекста');
    }
}

module.exports = getUserIdFromContext;
