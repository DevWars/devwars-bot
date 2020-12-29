const DevWarsApi = require('devwars-api-client');
const axios = require('axios');
const config = require('../config');

const axiosClient = axios.create({ baseURL: config.devwars.url });
const api = new DevWarsApi(axiosClient);
api.body = { apiKey: config.devwars.apiKey };

class DevWarsService {
    async getUserCoins(user) {
        const res = await api.linkedAccounts.getCoinsByProviderAndId('twitch', user.id);
        return res.coins;
    }

    async updateCoinsForUser(user, amount) {
        await api.linkedAccounts.updateCoinsByProviderAndId('twitch', user.id, user.username, amount);
    }

    async updateCoinsForUsers(updates) {
        const resUpdates = [];
        for (const { user, amount } of updates) {
            resUpdates.push(this.updateCoinsForUser(user, amount));
        }

        await Promise.all(resUpdates);
    }
}

module.exports = new DevWarsService();
