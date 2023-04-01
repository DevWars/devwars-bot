import * as dotenv from 'dotenv';

dotenv.config();

const twitch = {
    channel: process.env.TWITCH_CHANNEL,
    username: process.env.TWITCH_USERNAME,
    password: process.env.TWITCH_OAUTH_TOKEN,
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    accessToken: process.env.TWITCH_ACCESS_TOKEN,
    refreshToken: process.env.TWITCH_REFRESH_TOKEN,
};

const devwars = {
    url: process.env.DEVWARS_API_URL,
    apiKey: process.env.DEVWARS_API_KEY,
};

const devwarsLive = {
    url: process.env.DEVWARS_LIVE_URL,
    apiKey: process.env.DEVWARS_LIVE_KEY,
};

const devwarsWidgets = {
    port: process.env.DEVWARS_WIDGETS_PORT,
};

export default {
    env: process.env.NODE_ENV,
    twitch,
    devwars,
    devwarsLive,
    devwarsWidgets,
};
