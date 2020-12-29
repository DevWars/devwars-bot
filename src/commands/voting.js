const bot = require('../common/bot');
const devwarsWidgetsService = require('../services/devwarsWidgets.service');
const devwarsLiveService = require('../services/devwarsLive.service');

async function voteOnTeam(user, team) {
    const stage = devwarsLiveService.getStage();
    if (!devwarsLiveService.isVotingOpen()) {
        return bot.say('Voting is currently closed');
    }

    const teamId = devwarsLiveService.teamIdFromName(team);
    const category = stage.meta.category;

    const votes = await devwarsLiveService.getVotesForCategory(category);
    const hasVotedOnTeam = votes.some(vote => (vote.twitchId === user.id && vote.teamId === teamId));
    if (hasVotedOnTeam) {
        return bot.say(`${user.username}, you already voted for ${team}`);
    }

    const vote = { user, category, team };
    await devwarsWidgetsService.broadcastVote(vote)
    await devwarsLiveService.onVote(vote);
}

bot.addCommand('!blue', async (ctx) => {
    await voteOnTeam(ctx.user, 'blue');
});

bot.addCommand('!red', async (ctx) => {
    await voteOnTeam(ctx.user, 'red');
});
