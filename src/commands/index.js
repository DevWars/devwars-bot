const _ = require('lodash');
const ms = require('ms');
const bot = require('../common/bot');
const devwarsApi = require('../apis/devwarsApi');

const twitchService = require('../services/twitch.service');
const devWarsService = require('../services/devwars.service');

const firebaseService = require('../services/firebase.service');
const { validNumber, coins } = require('../utils');

function helpCommand() {
    bot.say('To see all commands visit https://www.devwars.tv/docs#watching');
}

async function setCoins(user, amount) {
    await devWarsService.updateCoinsForUser(user, amount);
    bot.say(`@${user.username} ${amount >= 0 ? 'received' : 'lost'} ${coins(amount)}`);
}

bot.addCommand('!help', helpCommand);
bot.addCommand('!commands', helpCommand);

bot.addCommand(
    '!watch',
    () => {
        bot.say(
            'Check out the code and websites! https://watch.devwars.tv - View Code | https://red.devwars.tv - Red Website | https://blue.devwars.tv - Blue Website'
        );
    },
    ms('5m')
);

bot.addCommand(
    '!discord',
    () => {
        bot.say('Join our growing Discord community for developers by heading over to discord.gg/devwars');
    },
    ms('13m')
);

bot.addCommand(
    '!follow',
    () => {
        bot.say("Enjoying DevWars? Hit the follow button so you don't miss another stream!");
    },
    ms('21m')
);

bot.addCommand('!coins', async (ctx) => {
    let userCoins = await devwarsApi.getCoins(ctx.user);
    if (!userCoins) {
        userCoins = 0;
    }

    bot.say(`@${ctx.user.username} ${coins(userCoins)}`);
});

bot.addCommand('@coinsall <amount>', async (ctx, args) => {
    const [amount] = args;

    if (!validNumber(amount)) {
        return bot.say('<amount> must be a number');
    }

    await twitchService.giveCoinsToAllViewers(amount);
    bot.say(`Everyone received ${coins(amount)}!`);
});

bot.addCommand('@givecoins <username> <amount>', async (ctx, args) => {
    const [username, amount] = args;

    if (!validNumber(amount)) {
        return bot.say('<amount> must be a number');
    }

    const twitchUser = await twitchService.getUserByUsername(username);
    if (!twitchUser) {
        return bot.say(`No user with username ${username} found`);
    }

    await setCoins(twitchUser, amount);
});

bot.addCommand('@takecoins <username> <amount>', async (ctx, args) => {
    const [username, amount] = args;

    if (!validNumber(amount)) {
        return bot.say('<amount> must be a number');
    }

    const twitchUser = await twitchService.getUserByUsername(username);
    if (!twitchUser) {
        return bot.say(`No user with username ${username} found`);
    }

    await setCoins(twitchUser, -amount);
});

bot.addCommand('@stage <stage>', async (ctx, args) => {
    const [stage] = args;

    if (!_.includes(bot.game.stages, stage)) {
        return bot.say(`<stage> must be one from [${bot.game.stages}]`);
    }

    bot.game.stage = stage;
    await firebaseService.setStage(stage);
});

bot.addCommand('@resetframe', () => {
    firebaseService.resetFrame();
    return bot.say('Frame reset!');
});

/**
 * Developer commands
 */
bot.addCommand('@ping', bot.action.bind(bot, 'pong!'));
