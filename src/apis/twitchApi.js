const _ = require('lodash');
const axios = require('axios');
const config = require('../config');

const twitchUrl = 'https://api.twitch.tv/helix';

async function getViewers() {
    try {
        const req = await axios.get(`http://tmi.twitch.tv/group/user/${config.channel}/chatters`);
        const chatters = req.data.chatters;

        return _.uniq([
            ...chatters.broadcaster,
            ...chatters.vips,
            ...chatters.moderators,
            ...chatters.staff,
            ...chatters.admins,
            ...chatters.global_mods,
            ...chatters.viewers,
        ]);
    } catch (error) {
        console.log('twitch.getViewers', error);
    }
}

async function getUserByUsername(username) {
    const req = await axios.get(`${twitchUrl}/users?login=${username}`, {
        headers: { 'Client-ID': process.env.TWITCH_CLIENT },
    });
    const data = req.data.data;

    if (data.length === 0) {
        return undefined;
    }

    const twitchUser = data[0];
    return {
        id: twitchUser.id,
        username,
    };
}

module.exports = {
    getViewers,
    getUserByUsername,
};
