const ms = require('ms');

const bot = require('../common/bot');
const devwarsApi = require('../apis/devwarsApi');
const firebaseService = require('../services/firebase.service');

bot.addCommand('@startgame', async () => {
    if (bot.game.active === true) return bot.say('Game is already active');

    const {
        data: [game],
    } = await devwarsApi.games.gamesWithPaging({
        first: 1,
        status: 'active',
        season: 3,
    });

    if (!game) return bot.say('There is currently no active game');
    const theme = game.mode || 'Classic';

    bot.game.stage = 'objective';
    await firebaseService.setStage('objective');

    switch (theme.toLowerCase()) {
        case 'blitz':
            bot.say('Betting will open in 2 minutes!');
            bot.betting.openTimer = setTimeout(() => bot.selfCommand('!openbets 3'), ms('3m'));
            break;
        case 'zen garden':
            bot.say('Betting will open in 5 minutes!');
            bot.betting.openTimer = setTimeout(() => bot.selfCommand('!openbets 5'), ms('5m'));
            break;
        default:
            bot.say('Betting will open in 5 minutes!');
            bot.betting.openTimer = setTimeout(() => bot.selfCommand('!openbets 5'), ms('5m'));
    }

    bot.game.active = true;
    return bot.say('Game started!');
});

bot.addCommand('@endgame', async () => {
    if (bot.game.active === false) {
        return bot.say('There is currently no active game');
    }

    const { data } = await devwarsApi.games.gamesWithPaging({
        first: 1,
        status: 'active',
        season: 3,
    });

    await devwarsApi.games.endGame(data[0].id);

    bot.game.active = false;
    return bot.say('Game has ended!');
});

bot.addCommand('!apply', async (ctx) => {
    try {
        const {
            data: [game],
        } = await devwarsApi.games.gamesWithPaging({
            first: 1,
            status: 'active',
            season: 3,
        });

        if (game == null) return bot.say('There is currently no active game');

        const [devwarsUser] = await devwarsApi.search.searchForUsersByConnections({
            provider: 'twitch',
            id: ctx.user.id,
            limit: 1,
        });

        if (devwarsUser == null) {
            const message = `Sorry, @${ctx.user.username}, it does not look liked you have connected your account.`;
            bot.say(message);
        }

        try {
            await devwarsApi.games.applyToGameAsPlayer(game.id, devwarsUser.id);
        } catch (error) {
            return bot.say(`Sorry @${ctx.user.username}, ${error.message.toLowerCase()}`);
        }

        return bot.say(`${username} signed up for the ${game.mode} game! PogChamp devwarsLogo`);
    } catch (error) {
        console.log(error);
        return bot.say(`Sorry @${username}, something went wrong.`);
    }
});

/**
 * Developer commands
 */
bot.addCommand('@showgame', async () => {
    console.log(bot.game);
});

bot.addCommand('@activegame', async () => {
    const {
        data: [game],
    } = await devwarsApi.games.gamesWithPaging({
        first: 1,
        status: 'active',
        season: 3,
    });

    console.log(game);
});
