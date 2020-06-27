const ms = require('ms');

const bot = require('../common/bot');
const devwarsApi = require('../apis/devwarsApi');
const firebaseService = require('../services/firebase.service');

bot.addCommand('@startgame', async () => {
    if (bot.game.active === true) {
        return bot.say('Game is already active');
    }

    const { data: game } = await devwarsApi.getActiveGame();

    if (!game) {
        return bot.say('There is currently no active game');
    }

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

    const { data: game } = await devwarsApi.getActiveGame();
    await devwarsApi.endGame(game.id);

    bot.game.active = false;
    return bot.say('Game has ended!');
});

bot.addCommand('!apply', async (ctx) => {
    const { data: game } = await devwarsApi.getActiveGame();
    if (!game) return bot.say('There is currently no active game');

    const { id, username } = ctx.user;
    const { status, error } = await devwarsApi.signUpForActiveGame(game.schedule, id);

    if (status === 400) {
        const message = `${username}, you need to connect your Twitch account on DevWars.tv to use !apply.`;
        return bot.say(message);
    }

    if (status === 409) {
        return bot.say(`${username}, you have already applied for this game.`);
    }

    if (status !== 200 && error != null) {
        return bot.whisper(ctx.user, error);
    }

    const message = `${username} signed up for the ${game.mode} game! PogChamp devwarsLogo`;
    return bot.say(message);
});

/**
 * Developer commands
 */
bot.addCommand('@showgame', async () => {
    console.log(bot.game);
});

bot.addCommand('@activegame', async () => {
    const { data: game } = await devwarsApi.getActiveGame();
    console.log(game);
});
