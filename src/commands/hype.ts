import bot from '../common/bot';
import devwarsService from '../services/devwars.service';
import { validNumber, coins } from '../utils';

const hypeEmote = '🚃 ';

function hasHyped(user) {
    return bot.hype.hypes.find((hype) => hype.user.username === user.username);
}

function getHypeAmount() {
    const amounts = bot.hype.hypes.map((hype) => hype.amount);
    return amounts.reduce((accumulator, amount) => accumulator + amount, 0);
}

function addHype(user) {
    const amount = user.subscriber ? 3 : 1;
    const role = user.subscriber ? '[🔥 Subscriber]' : '';

    const message = getHypeAmount() === 0 ? 'boarded the Hype Train first with' : 'boarded the Hype Train with';

    bot.hype.hypes.push({ user, amount });
    return bot.say(`${role} ${user.username} ${message} ${hypeEmote.repeat(amount)}`);
}

async function awardCoins() {
    const winnings = 10 * getHypeAmount();
    if (winnings <= 0) return;

    const updates = [];
    for (const hype of bot.hype.hypes) {
        updates.push({ user: hype.user, amount: winnings });
    }

    await devwarsService.updateCoinsForUsers(updates);
    return bot.say(`Everyone who boarded the Hype Train received ${coins(winnings)}! PogU PogU PogU`);
}

async function closeHype() {
    clearInterval(bot.hype._timeout);

    const hypeAmt = getHypeAmount();
    bot.hype.open = false;

    if (hypeAmt <= 0) {
        return bot.say('The Hype Train slowly rolled away in tears because it received no !hype BibleThump');
    }

    bot.say(`The Hype Train left with a length of ${hypeAmt}! PogU 🚅 ${hypeEmote.repeat(hypeAmt)}`);

    await awardCoins();

    bot.hype.hypes = [];
}

function openHype(minutes: number) {
    const formatDuration = `${minutes} minute${minutes === 1 ? '' : 's'}}`;
    let duration = 1000 * 60 * minutes;
    bot.hype.open = true;

    bot.hype._timeout = setInterval(() => {
        duration -= 1000;

        if (duration === 1000 * 60) bot.say('The Hype Train is leaving in 1 minute! Type !hype to board');
        if (duration === 1000 * 30) bot.say('The Hype Train is leaving in 30 seconds! Type !hype to board');
        if (duration === 1000 * 10) bot.say('The Hype Train is leaving in 10 seconds! Type !hype to board');
        if (duration === 1000 * 5) bot.say('The Hype Train is leaving in 5 seconds! Type !hype to board');

        if (duration <= 0) {
            closeHype();
        }
    }, 1000);

    return bot.say(`Choo Choo! 🚅 The Hype Train arrived for ${formatDuration}! Type !hype to extend the Hype Train`);
}

bot.addCommand('!hype', (ctx) => {
    if (bot.hype.open === false) {
        return bot.say('The Hype Train is currently not here FeelsBadMan');
    }

    if (hasHyped(ctx.user)) {
        return bot.say(`${ctx.user.username}, you're already on the Hype Train!`);
    }

    addHype(ctx.user);

    const hypeAmt = getHypeAmount();
    return bot.say(`${hypeAmt} PogU 🚅 ${hypeEmote.repeat(hypeAmt)}`);
});

bot.addCommand('#openhype <minutes>', (ctx, args) => {
    const [minutes] = args;

    if (!validNumber(minutes)) {
        return bot.say('<minutes> must be a number');
    }

    openHype(minutes);
});

bot.addCommand('#closehype', async () => {
    await closeHype();
});
