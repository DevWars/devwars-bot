const ms = require('ms');
const bot = require('../common/bot');
const devwarsApi = require('../apis/devwarsApi');
const firebaseService = require('../services/firebase.service');

bot.addCommand('@startgame', async () => {
    if (bot.game.active === true) {
        return bot.say('Game is already active');
    }

    const game = await devwarsApi.getActiveGame();
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

    const game = await devwarsApi.getActiveGame();
    await devwarsApi.endGame(game.id);

    bot.game.active = false;
    return bot.say('Game has ended!');
});

bot.addCommand('!apply', async (ctx) => {
    const game = await devwarsApi.getActiveGame();
    if (!game) {
        return bot.say('There is currently no active game');
    }

    const appliedUser = await devwarsApi.signUpForActiveGame(game.schedule, ctx.user);
    if (appliedUser.response.status === 400) {
        return bot.say(`${ctx.user.username} connect your twitch account on devwars.tv to use !apply`);
    }
    if (appliedUser.response.status === 409) {
        return bot.whisper('You already applied for this game');
    }

    return bot.say(`${ctx.user.username} signed up for the ${game.mode} game! PogChamp devwarsLogo`);
});


/**
 * Developer commands
 */
bot.addCommand('@showgame', async () => {
    console.log(bot.game);
});

bot.addCommand('@activegame', async () => {
    const game = await devwarsApi.getActiveGame();
    console.log(game);
});
