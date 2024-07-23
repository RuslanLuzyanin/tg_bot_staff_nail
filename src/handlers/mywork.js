async function setupMyWorkCommand(bot) {
    const photoUrls = [
        'https://sun9-41.userapi.com/impg/5fFuzZ2zcuwKhfAjWBWD-Agd_G1J8JM-E3uPMQ/zqqgW3aSaew.jpg?size=1619x2160&quality=95&sign=9a51c579969a40682d41b8342e71bbde&type=album',
        'https://sun9-1.userapi.com/impg/ORnB-yxR9jUB2hSNh7l9BG1dxRPzjV2vslpMiw/jLET9R9eMxc.jpg?size=1620x2160&quality=95&sign=8de682080daba447a859007094146170&type=album',
        'https://sun9-18.userapi.com/impg/CO7gDMtxwnwLp8xgjBj-8bPYb_9YDEJ0VKvBiw/K_jzWPvN8NI.jpg?size=1620x2160&quality=95&sign=add388f78a25f2e50e011cb10f4c8154&type=album',
    ];

    bot.command('mywork', async (ctx) => {
        const chatId = ctx.chat.id;

        if (ctx.from.id === ctx.message.from.id) {
            await ctx.reply('Мои работы:');
            await bot.telegram.sendMediaGroup(
                chatId,
                photoUrls.map((url) => ({ type: 'photo', media: url }))
            );
        } else {
            ctx.reply('Эта команда доступна только тому, кто ее вызвал.');
        }
    });
}

module.exports = { setupMyWorkCommand };
