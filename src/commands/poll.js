const _ = require('lodash');
const ms = require('ms');
const bot = require('../common/bot');
const firebaseService = require('../services/firebase.service');
const { validNumber } = require('../utils');

function validLetter(letters, letter) {
    if (letter.length > 1) return false;

    return _.includes(letters, letter);
}

function hasVote(user) {
    return bot.poll.votes.find(vote => vote.username === user.username);
}

async function addPollVote(user, letter) {
    const voter = { username: user.username, letter, timestamp: Date.now() };

    bot.poll.votes.push(voter);
    await firebaseService.updatePollScore(letter);
}

function indexToLetter(index) {
    return String.fromCharCode(index + 65).toLowerCase();
}

function lettersFromOptions() {
    return bot.poll.options.map((value, index) => indexToLetter(index));
}

async function closePoll() {
    clearTimeout(bot.poll.timer);

    if (bot.game.stage === 'poll') {
        await firebaseService.setStage('objective');
        bot.game.stage = 'objective';
    }

    bot.poll.open = false;
    bot.poll.question = '';
    bot.poll.options = [];
    bot.poll.votes = [];
    bot.poll.duration = -1;

    bot.say('Poll is now closed');
}

bot.addCommand('#poll <minutes> <"question"> <...options>', async (ctx, args) => {
    const [minutes, question, ...options] = args;

    if (bot.poll.open === true) {
        return bot.say('Poll is already open');
    }

    if (!validNumber(minutes)) {
        return bot.say('<minutes> must be a number');
    }

    if (options.length < 2) {
        return bot.say('<...options> must provide at least 2 options');
    }
    if (options.length > 4) {
        return bot.say('<...options> too many options provided (max 4)');
    }

    bot.poll.open = true;
    bot.poll.question = question;
    bot.poll.options = options;
    bot.poll.duration = minutes;

    bot.poll.timer = setTimeout(() => {
        if (bot.poll.open === true) {
            return closePoll();
        }
    }, ms(`${bot.poll.duration}m`));

    bot.game.stage = 'poll';
    await firebaseService.setStage('poll');
    await firebaseService.setPoll(question, options, minutes);
});

bot.addCommand('!vote <letter>', async (ctx, args) => {
    const [letter] = args;

    if (bot.poll.open === false) {
        return bot.say('Poll is currently closed');
    }

    if (hasVote(ctx.user)) {
        return bot.say(`${ctx.user.username}, you already voted for ${hasVote(ctx.user).letter}`);
    }

    const letters = lettersFromOptions();
    if (!validLetter(letters, letter)) {
        return bot.say(`<letter> must be one from [${letters}]`);
    }

    await addPollVote(ctx.user, letter);
});

bot.addCommand('#closepoll', async () => {
    await closePoll();
});


/**
 * Developer commands
 */
bot.addCommand('@showpoll', async () => {
    console.log('poll', bot.poll);
});
