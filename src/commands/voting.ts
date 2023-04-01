import bot from '../common/bot';
import devwarsWidgetsService from '../services/devwarsWidgets.service';
import devwarsLiveService from '../services/devwarsLive.service';

async function voteOnTeam(user, team) {
    const stage = devwarsLiveService.getStage();
    if (!devwarsLiveService.isVotingOpen()) {
        return bot.say('Voting is currently closed');
    }

    const teamId = devwarsLiveService.teamIdFromName(team);
    const category = stage.meta.category;

    const votes = await devwarsLiveService.getVotesForCategory(category);
    const hasVotedOnTeam = votes.some(v => v.twitchId === user.id && v.teamId === teamId);
    if (hasVotedOnTeam) {
        bot.say(`${user.username} changed their vote to ${team}`);
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
