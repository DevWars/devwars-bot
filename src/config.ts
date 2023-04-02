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
    channel: getEnvStr('TWITCH_CHANNEL'),
    username: getEnvStr('TWITCH_USERNAME'),
    password: getEnvStr('TWITCH_OAUTH_TOKEN'),
    clientId: getEnvStr('TWITCH_CLIENT_ID'),
    clientSecret: getEnvStr('TWITCH_CLIENT_SECRET'),
    accessToken: getEnvStr('TWITCH_ACCESS_TOKEN'),
    refreshToken: getEnvStr('TWITCH_REFRESH_TOKEN'),
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
