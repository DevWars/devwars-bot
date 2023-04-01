 // tslint:disable-line:import-name no-implicit-dependencies no-submodule-imports no-internal-module
import DevWarsApi from 'devwars-api-client'; // tslint:disable-line:import-name no-implicit-dependencies no-submodule-imports no-internal-module
import axios from 'axios';
import config from '../config';

const axiosClient = axios.create({
    baseURL: config.devwars.url,
    headers: { apikey: config.devwars.apiKey },
});
const api = new DevWarsApi(axiosClient);

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

export default new DevWarsService();
