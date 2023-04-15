import bot from '../common/bot';
import devwarsService from '../services/devwars.service';
import twitchService, { TwitchUser } from '../services/twitch.service';
import { parseValidNumber, coins } from '../utils';

function helpCommand() {
    bot.say('To see all commands visit https://www.devwars.tv/docs#watching');
}

function watchCommand() {
    bot.say('Live Code: https://live.devwars.tv | Blue Site: https://blue.devwars.tv | Red Site: https://red.devwars.tv');
}

async function setCoins(user: TwitchUser, amount: number) {
    await devwarsService.updateCoinsForUser(user, amount);
    bot.say(`@${user.username} ${amount >= 0 ? 'received' : 'lost'} ${coins(amount)}`);
}

bot.addCommand('!help', helpCommand);
bot.addCommand('!commands', helpCommand);

bot.addAutoCommand('!watch', watchCommand, 5);
bot.addCommand('!live', watchCommand);

bot.addAutoCommand('!discord', () => {
    bot.say('Join our growing Discord community for developers by heading over to discord.gg/devwars');
}, 13);

bot.addAutoCommand('!follow', () => {
    bot.say("Enjoying DevWars? Hit the follow button so you don't miss another stream!");
}, 21);

bot.addCommand('!coins', async (ctx) => {
    const userCoins = await devwarsService.getUserCoins(ctx.user);
    if (!userCoins) {
        return bot.say('Something went wrong getting your coins');
    }

    bot.say(`@${ctx.user.username} ${coins(userCoins)}`);
});

bot.addCommand('@coinsall <amount>', async (ctx, args) => {
    const amount = parseValidNumber(args[0]);

    if (!amount) {
        return bot.say('<amount> must be a number');
    }

    await twitchService.giveCoinsToAllViewers(amount);
    bot.say(`Everyone received ${coins(amount)}!`);
});

bot.addCommand('@givecoins <username> <amount>', async (ctx, args) => {
    const username = String(args[0]);
    const amount = parseValidNumber(args[1]);

    if (!amount) {
        return bot.say('<amount> must be a number');
    }

    const twitchUser = await twitchService.getUserByUsername(username);
    if (!twitchUser) {
        return bot.say(`No user with username ${username} found`);
    }

    await setCoins(twitchUser, amount);
});

bot.addCommand('@takecoins <username> <amount>', async (ctx, args) => {
    const username = String(args[0]);
    const amount = parseValidNumber(args[1]);

    if (!amount) {
        return bot.say('<amount> must be a number');
    }

    const twitchUser = await twitchService.getUserByUsername(username);
    if (!twitchUser) {
        return bot.say(`No user with username ${username} found`);
    }

    await setCoins(twitchUser, -amount);
});
