const _ = require('lodash');
const ms = require('ms');
const bot = require('../common/bot');
const { validNumber, coins } = require('../utils');
const devwarsApi = require('../apis/devwarsApi');
const firebaseService = require('../services/firebase.service');

async function addBet(user, amount, team) {
    bot.betting.bets[user.id] = {
        user,
        amount,
        team,
        createdAt: Date.now(),
    };

    await firebaseService.addBetOnFrame(user, amount, team);
}

function removeBet(user) {
    delete bot.betting.bets[user.id];
}

function hasBet(user) {
    return bot.betting.bets[user.id];
}

function validTeam(team) {
    return _.includes(bot.betting.teams, team);
}

async function awardWinners(winningTeam) {
    const winMultiplier = (1 / 2);

    const betters = [];
    for (const bet of Object.values(bot.betting.bets)) {
        if (bet.team === winningTeam) {
            const winnings = bet.amount + Math.round(bet.amount * winMultiplier);
            betters.push({ user: bet.user, amount: winnings });
            bot.say(`${bet.user.username} won ${coins(winnings)} from their bet!`);
        } else if (winningTeam === 'tie' && bet.team !== 'tie') {
            const halfAmt = Math.round(bet.amount / 2);
            betters.push({ user: bet.user, amount: -halfAmt });
            bot.say(`${bet.user.username} lost only ${coins(halfAmt)} (50% of their bet) since it was a tie`);
        } else {
            betters.push({ user: bet.user, amount: -bet.amount });
            bot.say(`${bet.user.username} lost ${coins(bet.amount)} from their bet BibleThump`);
        }
    }

    await devwarsApi.putCoins(betters);
}

async function resetBets() {
    bot.betting.bets = {};

    await firebaseService.resetBetsOnFrame();
}

async function closeBets() {
    clearTimeout(bot.betting.timer);

    if (bot.betting.open === false) {
        return bot.say('Betting is already closed');
    }

    if (bot.game.stage === 'betting') {
        bot.game.stage = 'objective';
        await firebaseService.setStage('objective');
    }

    bot.betting.open = false;
    bot.betting.duration = -1;

    bot.say('Betting is now closed');
}

async function openBets(minutes) {
    clearTimeout(bot.betting.openTimer);

    if (bot.betting.open === true) {
        return bot.say('Betting is already open');
    }

    if (!validNumber(minutes)) {
        return bot.say('<minutes> must be a number');
    }

    await resetBets();

    bot.betting.open = true;
    bot.betting.duration = minutes;
    bot.game.stage = 'betting';

    await firebaseService.setStage('betting');
    await firebaseService.setBetting(minutes);

    bot.betting.timer = setTimeout(() => {
        if (bot.betting.open === true) {
            return closeBets();
        }
    }, ms(`${bot.betting.duration}m`));

    bot.say(`Betting is now open for ${minutes} ${minutes > 1 ? 'minutes' : 'minute'}!`);
}


bot.addCommand('!bet <amount> <team>', async (ctx, args) => {
    const [amount, team] = args;

    const userCoins = await devwarsApi.getCoins(ctx.user);
    const prevBet = await hasBet(ctx.user);

    if (!bot.betting.open) {
        return bot.say('Betting is closed');
    }

    if (!validNumber(amount)) {
        return bot.whisper(ctx.user, '<amount> must be a number');
    }

    if (!validTeam(team)) {
        return bot.whisper(ctx.user, `<team> must be one from [${bot.betting.teams}]`);
    }

    if (amount <= 0) {
        return bot.whisper(ctx.user, '<amount> you must bet at least more than devwarsCoin 0');
    }

    if (userCoins < amount) {
        return bot.say(`${ctx.user.username} tried to bet ${coins(amount)} but only has ${coins(userCoins)}`);
    }

    if (prevBet) {
        await firebaseService.removeBetOnFrame(ctx.user.username);
    }

    await addBet(ctx.user, amount, team);

    const message = prevBet
        ? `${ctx.user.username} changed their bet to ${coins(amount)} on [${team}]`
        : `${ctx.user.username} bet ${coins(amount)} on [${team}]`;

    bot.say(message);
});

bot.addCommand('!clearbet', async (ctx) => {
    if (!bot.betting.open) {
        return bot.say('Betting is closed');
    }

    const prevBet = await hasBet(ctx.user);
    if (!prevBet) {
        return bot.say(`${ctx.user.username}, you have not placed a bet`);
    }

    await removeBet(ctx.user);
    await firebaseService.removeBetOnFrame(ctx.user.username);
    return bot.say(`${ctx.user.username} retracted their bet of ${coins(prevBet.amount)}`);
});

bot.addCommand('@resetbets', async () => {
    await resetBets();
    return bot.say('All bets have been reset!');
});

bot.addCommand('@betwinner <team>', async (ctx, args) => {
    const [team] = args;

    if (!validTeam(team)) {
        return bot.say(`<team> must be one from [${bot.betting.teams}]`);
    }

    if (bot.betting.open === true) {
        await closeBets();
    }

    await awardWinners(team);
    await firebaseService.emptyFrameBetters();
    return bot.say(`Winners awarded! Everyone who bet [${team}] won coins! devwarsCoin PogChamp`);
});

bot.addCommand('@openbets <minutes>', async (ctx, args) => {
    const [minutes] = args;

    await openBets(minutes);
});

bot.addCommand('@closebets', async () => {
    await closeBets();
});


/**
 * Developer commands
 */
bot.addCommand('@showbets', async () => {
    console.log('bets', bot.betting);
});
