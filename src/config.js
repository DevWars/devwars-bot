require('dotenv').config();

const username = process.env.TWITCH_USERNAME;
const password = process.env.TWITCH_OAUTH_TOKEN;
const channel = process.env.TWITCH_CHANNEL_NAME;

const config = {
    channel,
    username,
    password,
};

module.exports = config;
