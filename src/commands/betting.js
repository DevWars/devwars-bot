const _ = require('lodash');
const ms = require('ms');
const bot = require('../common/bot');
const { validNumber, coins } = require('../utils');
const devwarsService = require('../services/devwars.service');
const devwarsWidgetsService = require('../services/devwarsWidgets.service');

async function addBet(twitchUser, amount, option) {
    const user = { id: twitchUser.id, username: twitchUser.displayName };
    const bet = { user, amount, option };
    bot.betting.bets.set(user.id, bet);
    devwarsWidgetsService.broadcastBet(bet);
    devwarsWidgetsService.updateBettingState();
}

async function awardWinners(winningOption) {
    const winMultiplier = 1 / 2;

    const betters = [];
    for (const bet of bot.betting.bets.values()) {
        if (bet.option === winningOption) {
            const winnings = bet.amount + Math.round(bet.amount * winMultiplier);
            betters.push({ user: bet.user, amount: winnings });
            bot.say(`${bet.user.username} won ${coins(winnings)} from their bet!`);
        } else if (winningOption === 'tie' && bet.option !== 'tie') {
            const halfAmt = Math.round(bet.amount / 2);
            betters.push({ user: bet.user, amount: -halfAmt });
            bot.say(`${bet.user.username} lost only ${coins(halfAmt)} (50% of their bet) since it was a tie`);
        } else {
            betters.push({ user: bet.user, amount: -bet.amount });
            bot.say(`${bet.user.username} lost ${coins(bet.amount)} from their bet BibleThump`);
        }
    }

    await devwarsService.updateCoinsForUsers(betters);
}

async function closeBets() {
    clearTimeout(bot.betting._timeout);

    if (!bot.betting.open) {
        return bot.say('Betting is already closed');
    }

    bot.betting.open = false;

    devwarsWidgetsService.updateBettingState();

    bot.say('Betting is now closed');
}

async function openBets(minutes) {
    bot.betting.bets = new Map();

    if (bot.betting.open) {
        return bot.say('Betting is already open');
    }

    if (!validNumber(minutes)) {
        return bot.say('<minutes> must be a number');
    }

    const duration = ms(minutes + 'm');
    bot.betting._timeout = setTimeout(closeBets, duration);
    bot.betting.open = true;
    bot.betting.startAt = Date.now();
    bot.betting.endAt = Date.now() + duration;

    devwarsWidgetsService.updateBettingState();

    bot.say(`Betting is now open for ${minutes} ${minutes > 1 ? 'minutes' : 'minute'}!`);
}

bot.addCommand('!bet <amount> <option>', async (ctx, args) => {
    const [amount, option] = args;

    const userCoins = await devwarsService.getUserCoins(ctx.user);

    if (!bot.betting.open) {
        return bot.say('Betting is closed');
    }

    if (!validNumber(amount)) {
        return bot.whisper(ctx.user, '<amount> must be a number');
    }

    const validOption = _.includes(bot.betting.options, option);
    if (!validOption) {
        return bot.whisper(ctx.user, `<option> must be one from [${bot.betting.options}]`);
    }

    if (amount <= 0) {
        return bot.whisper(ctx.user, '<amount> you must bet at least more than devwarsCoin 0');
    }

    if (userCoins < amount) {
        return bot.say(`${ctx.user.username} tried to bet ${coins(amount)} but only has ${coins(userCoins)}`);
    }

    const message = bot.betting.bets.has(ctx.user.id)
        ? `You changed your bet to ${coins(amount)} on ${option}`
        : `You bet ${coins(amount)} on ${option}`;

    await addBet(ctx.user, amount, option);

    bot.whisper(ctx.user, message);
});

bot.addCommand('!clearbet', async (ctx) => {
    if (!bot.betting.open) {
        return bot.say('Betting is closed');
    }

    const prevBet = bot.betting.bets.get(ctx.user.id);
    if (!prevBet) {
        return bot.say(`${ctx.user.username}, you have not placed a bet`);
    }

    bot.betting.bets.delete(ctx.user.id);

    devwarsWidgetsService.updateBettingState();

    return bot.say(`${ctx.user.username} retracted their bet of ${coins(prevBet.amount)}`);
});

bot.addCommand('@betwinner <option>', async (ctx, args) => {
    const [option] = args;

    if (!validOption(option)) {
        return bot.say(`<option> must be one from [${bot.betting.options}]`);
    }

    if (bot.betting.open === true) {
        await closeBets();
    }

    await awardWinners(option);

    return bot.say(`Winners awarded! Everyone who bet [${option}] won coins! devwarsCoin PogChamp`);
});

bot.addCommand('@openbets <minutes>', async (ctx, args) => {
    const [minutes] = args;

    await openBets(minutes);
});

bot.addCommand('@closebets', async () => {
    await closeBets();
});
