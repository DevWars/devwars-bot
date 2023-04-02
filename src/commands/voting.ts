import bot from '../common/bot';
import devwarsWidgetsService from '../services/devwarsWidgets.service';
import devwarsLiveService from '../services/devwarsLive.service';
import User from '../common/User';

export interface Vote {
    user: User;
    category: string;
    team: string;
}

async function voteOnTeam(user: User, team: string) {
    const isVotingOpen = devwarsLiveService.isVotingOpen();
    if (!isVotingOpen) {
        return bot.say('Voting is currently closed');
    }

    const stage = devwarsLiveService.getStage();
    if (!stage) {
        return bot.say('No stage to vote on');
    }

    const teamId = devwarsLiveService.teamIdFromName(team);
    const category = stage.meta.category;

    const votes = await devwarsLiveService.getVotesForCategory(category);
    const hasVotedOnTeam = votes.some(v => v.twitchId === user.id && v.teamId === teamId);
    if (hasVotedOnTeam) {
        bot.say(`${user.username} changed their vote to ${team}`);
    }

    const vote: Vote = { user, category, team };
    await devwarsWidgetsService.broadcastVote(vote)
    await devwarsLiveService.onVote(vote);
}

bot.addCommand('!blue', async (ctx) => {
    await voteOnTeam(ctx.user, 'blue');
});

bot.addCommand('!red', async (ctx) => {
    await voteOnTeam(ctx.user, 'red');
});
