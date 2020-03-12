const _ = require('lodash');
const axios = require('axios');
const config = require('../config');

const twitchUrl = 'https://api.twitch.tv/helix';

async function getViewers() {
    try {
        const req = await axios.get(`http://tmi.twitch.tv/group/user/${config.channel}/chatters`);
        const chatters = _.flatMapDeep(req.data.chatters);
        return _.uniq(chatters);
    } catch (error) {
        console.log('twitch.getViewers', error);
    }
}

async function getUsersByUsernames(usernames) {
    const requests = _.chunk(usernames, 100).map((users) => {
        return axios.get(`${twitchUrl}/users?login=${users.join('&login=')}`, {
            headers: { 'Client-ID': process.env.TWITCH_CLIENT },
        }).catch((error) => {
            console.log('twitch.getUsersByUsernames', error);
        });
    });

    const results = await Promise.all(requests);

    const twitchUsers = _.flatMap(results, result => result.data.data);
    return twitchUsers.map(user => ({ id: user.id, username: user.login }));
}

async function getUserByUsername(username) {
    const [user] = await getUsersByUsernames([username]);
    return user;
}

module.exports = {
    getViewers,
    getUserByUsername,
    getUsersByUsernames,
};
