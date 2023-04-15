import * as _ from 'lodash';
import bot from '../common/bot';
import devwarsService from '../services/devwars.service';
import devwarsWidgetsService from '../services/devwarsWidgets.service';
import { minutesToMs, parseValidNumber, coins } from '../utils';
import User from '../common/User';
import { TwitchUser } from '../services/twitch.service';

export interface Bet {
    user: TwitchUser;
    amount: number;
    option: string;
}

export interface OptionSummary {
    name: string;
    total: number;
    ratio: number;
}

async function addBet(user: User, amount: number, option: string) {
    const twitchUser = { id: user.id, username: user.displayName };
    const bet = { user: twitchUser, amount, option };

    bot.betting.bets.set(user.id, bet);
    devwarsWidgetsService.broadcastBet(bet);
    devwarsWidgetsService.updateBettingState();
}

export function createOptionSummaries(): OptionSummary[] {
    const bets = Array.from(bot.betting.bets.values());
    const total = bets.reduce((sum, bet) => sum + Number(bet.amount), 0);

    return bot.betting.options.map((option) => {
        const optionTotal = bets
            .filter((bet) => bet.option === option)
            .reduce((sum, bet) => sum + Number(bet.amount), 0);
        const percentage = optionTotal / total;
        const ratio = 4 * (1 - percentage);

        return {
            name: option,
            total: optionTotal,
            ratio,
        };
    });
}

function getOptionSummary(option: string): OptionSummary | undefined {
    return createOptionSummaries().find((r) => r.name === option);
}

async function finalizeBets(winner: string) {
    const optionSummary = getOptionSummary(winner);
    if (!optionSummary) {
        return bot.say(`No one betted on ${winner}`);
    }

    const bets = Array.from(bot.betting.bets.values());

    const betResults = bets.map(({ user, option, amount }) => ({
        user,
        amount: option === winner
            ? Math.round(amount * optionSummary.ratio ?? 1) + amount
            : -amount,
    }));

    bot.say(`Everyone who betted on ${winner} won x${optionSummary.ratio.toFixed(2)} coins! 🎉`);
    await devwarsService.updateCoinsForUsers(betResults);
}

async function closeBets() {
    if (bot.betting._timeout) {
        clearTimeout(bot.betting._timeout);
    }

    if (!bot.betting.open) {
        return bot.say('Betting is already closed');
    }

    bot.betting.open = false;

    devwarsWidgetsService.updateBettingState();

    bot.say('Betting is now closed');
}

async function openBets(minutes: number) {
    bot.betting.bets = new Map();

    if (bot.betting.open) {
        return bot.say('Betting is already open');
    }

    const duration = minutesToMs(minutes);
    bot.betting._timeout = setTimeout(closeBets, duration);
    bot.betting.open = true;
    bot.betting.startAt = Date.now();
    bot.betting.endAt = Date.now() + duration;

    devwarsWidgetsService.updateBettingState();

    bot.say(`Betting is now open for ${minutes} ${minutes > 1 ? 'minutes' : 'minute'}!`);
}

bot.addCommand('!bet <amount> <option>', async (ctx, args) => {
    const amount = parseValidNumber(args[0]);
    const option = String(args[1]);

    const userCoins = await devwarsService.getUserCoins(ctx.user);
    if (!userCoins) {
        return bot.say('Something went wrong getting your coins');
    }

    if (!bot.betting.open) {
        return bot.say('Betting is closed');
    }

    if (!amount) {
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

bot.addCommand('#betwinner <option>', async (ctx, args) => {
    const option = String(args[0]);

    const validOption = _.includes(bot.betting.options, option);
    if (!validOption) {
        return bot.say(`<option> must be one from [${bot.betting.options}]`);
    }

    if (bot.betting.open === true) {
        await closeBets();
    }

    await finalizeBets(option);
});

bot.addCommand('#openbets <minutes>', async (ctx, args) => {
    const minutes = parseValidNumber(args[0]);

    if (!minutes) {
        return bot.say('<minutes> must be a number');
    }

    await openBets(minutes);
});

bot.addCommand('#closebets', async () => {
    await closeBets();
});
