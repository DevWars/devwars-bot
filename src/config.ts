import * as dotenv from 'dotenv';

dotenv.config();

const getEnvStr = (key: string): string => {
    const value = process.env[key];
    if (!value) throw new Error(`Missing environment variable ${key}`);

    return value;
};

const getEnvNum = (key: string): number => {
    return Number(getEnvStr(key));
}

const twitch = {
    userId: getEnvNum('TWITCH_CHANNEL_USER_ID'),
    channel: getEnvStr('TWITCH_CHANNEL_USERNAME'),
    bot: {
        userId: getEnvNum('TWITCH_BOT_USER_ID'),
        username: getEnvStr('TWITCH_BOT_USERNAME'),
        password: getEnvStr('TWITCH_BOT_OAUTH_TOKEN'),
        clientId: getEnvStr('TWITCH_BOT_CLIENT_ID'),
        clientSecret: getEnvStr('TWITCH_BOT_CLIENT_SECRET'),
    },
};

const devwars = {
    url: getEnvStr('DEVWARS_API_URL'),
    apiKey: getEnvStr('DEVWARS_API_KEY'),
};

const devwarsLive = {
    url: getEnvStr('DEVWARS_LIVE_URL'),
    apiKey: getEnvStr('DEVWARS_LIVE_KEY'),
};

const devwarsWidgets = {
    port: getEnvNum('DEVWARS_WIDGETS_PORT'),
};

export default {
    env: process.env.NODE_ENV,
    twitch,
    devwars,
    devwarsLive,
    devwarsWidgets,
};
