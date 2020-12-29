const ms = require('ms');
const bot = require('../common/bot');
const devwarsService = require('../services/devwars.service');
const twitchService = require('../services/twitch.service');
const { validNumber, coins } = require('../utils');

function helpCommand() {
    bot.say('To see all commands visit https://www.devwars.tv/docs#watching');
}

async function setCoins(user, amount) {
    await devwarsService.updateCoinsForUser(user, amount);
    bot.say(`@${user.username} ${amount >= 0 ? 'received' : 'lost'} ${coins(amount)}`);
}

bot.addCommand('!help', helpCommand);
bot.addCommand('!commands', helpCommand);

bot.addCommand(
    '!watch',
    () => {
        bot.say('Check out the code and websites! https://live.devwars.tv');
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
    let userCoins = await devwarsService.getUserCoins(ctx.user);
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
