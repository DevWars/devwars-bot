const DevWarsApi = require('devwars-api-client');
import axios from 'axios';
import config from '../config';
import { TwitchUser, UserCoinUpdate } from './twitch.service';

const axiosClient = axios.create({
    baseURL: config.devwars.url,
    headers: { apikey: config.devwars.apiKey },
});
const api = new DevWarsApi(axiosClient);

class DevWarsService {
    async getUserCoins(user: TwitchUser) {
        const res = await api.linkedAccounts.getCoinsByProviderAndId('twitch', user.id);
        return res.coins;
    }

    async updateCoinsForUser(user: TwitchUser, amount: number) {
        await api.linkedAccounts.updateCoinsByProviderAndId('twitch', user.id, user.username, amount);
    }

    async updateCoinsForUsers(updates: UserCoinUpdate[]) {
        const resUpdates = [];
        for (const { user, amount } of updates) {
            resUpdates.push(this.updateCoinsForUser(user, amount));
        }

        await Promise.all(resUpdates);
    }
}

export default new DevWarsService();
