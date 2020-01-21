const _ = require('lodash');
const ms = require('ms');
const bot = require('../common/bot');
const { validNumber } = require('../utils');
const firebaseService = require('../services/firebase.service');

function validCategory(category) {
    return _.includes(bot.voting.categories, category);
}

function hasVote(user) {
    return bot.voting.votes.find(vote => vote.username === user.username);
}

async function openReview(category) {
    bot.game.stage = 'voting';
    await firebaseService.setStage('voting');
    await firebaseService.setVotingCategory(`review-${category}`);
}

async function closeVoting() {
    clearTimeout(bot.voting.timer);

    if (bot.game.stage === 'voting') {
        bot.game.stage = 'objective';
        await firebaseService.setStage('objective');
    }

    bot.say(`Voting for [${bot.voting.category.toUpperCase()}] is now over`);

    bot.voting.open = false;
    bot.voting.category = 'ui';
    bot.voting.votes = [];
    bot.voting.duration = -1;

    await firebaseService.setVoting(bot.voting.duration);
    await firebaseService.setVotingCategory(bot.voting.category);
}

function setVotingTimer(category, duration) {
    const formatTime = ms(ms(`${duration}m`), { long: true });
    bot.voting.timer = setTimeout(async () => {
        await closeVoting();
    }, ms(`${duration}m`));

    const message = category === 'tiebreaker'
        ? 'on the best overall team'
        : `on best [${category.toUpperCase()}]`;

    bot.say(`Voting is opened for ${formatTime}! Type !blue or !red to vote ${message}`);
}

async function openVoting(category, duration) {
    bot.game.stage = 'voting';
    await firebaseService.setStage('voting');
    await firebaseService.setVoting(duration);
    await firebaseService.setVotingCategory(category);

    bot.voting.category = category;
    bot.voting.open = true;
    bot.voting.duration = duration;
    return setVotingTimer(category, duration);
}

async function addVote(user, team) {
    bot.voting.votes.push({ username: user.username, team });
    await firebaseService.addVoteOnFrame(team, bot.voting.category);
}

async function voteOnTeam(user, team) {
    if (bot.voting.open === false) {
        return bot.say('Voting is currently closed');
    }

    if (hasVote(user)) {
        return bot.say(`${user.username}, you already placed your vote`);
    }

    await addVote(user, team);
}


bot.addCommand('@review <category>', async (ctx, args) => {
    const [category] = args;

    if (category === 'tiebreaker') {
        return bot.say('<category> cannot be [tie] to review');
    }

    if (!validCategory(category)) {
        return bot.say(`<category> must be one from [${bot.voting.categories}]`);
    }

    await openReview(category);
});

bot.addCommand('@phase <category> <minutes>', async (ctx, args) => {
    const [category, minutes] = args;

    if (bot.voting.open === true) {
        return bot.say('Voting is currently opened');
    }

    if (!validCategory(category)) {
        return bot.say(`<category> must be one from [${bot.voting.categories}]`);
    }

    if (!validNumber(minutes)) {
        return bot.say('<minutes> must be a number');
    }

    await openVoting(category, minutes);
});

bot.addCommand('!blue', async (ctx) => {
    await voteOnTeam(ctx.user, 'blue');
});

bot.addCommand('!red', async (ctx) => {
    await voteOnTeam(ctx.user, 'red');
});

bot.addCommand('@endphase <category>', async (ctx, args) => {
    const [category] = args;

    if (bot.voting.open === false) {
        return bot.say('Voting is currently closed');
    }

    if (!validCategory(category)) {
        return bot.say(`<category> must be one from [${bot.voting.categories}]`);
    }

    if (category !== bot.voting.category) {
        return bot.say(`<category> can't end [${category}] when current category is [${bot.voting.category}]`);
    }

    await closeVoting();
});


/**
 * Developer commands
 */
bot.addCommand('@showvotes', async () => {
    console.log('votes', bot.voting.votes);
});
