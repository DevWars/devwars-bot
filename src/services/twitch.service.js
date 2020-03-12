const twitchApi = require('../apis/twitchApi');
const devwarsApi = require('../apis/devwarsApi');

async function giveCoinsToAllViewers(amount) {
    const usernames = await twitchApi.getViewers();
    const twitchUsers = await twitchApi.getUsersByUsernames(usernames);

    const updates = twitchUsers.map(user => ({ user, amount }));
    return devwarsApi.putCoins(updates);
}

module.exports = { giveCoinsToAllViewers };
