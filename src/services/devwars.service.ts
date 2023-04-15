import fetch, { RequestInit } from 'node-fetch';
import config from '../config';
import { TwitchUser, UserCoinUpdate } from './twitch.service';

interface LinkedAccountCoinsResponse {
    coins: number;
}

class DevWarsService {
    async apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
        const res = await fetch(`${config.devwars.url}/${url}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                apikey: config.devwars.apiKey,
            },
            ...options,
        });

        const responseContentType = res.headers.get('Content-Type');
        const isJsonResponse = responseContentType && responseContentType.includes('application/json');

        if (!res.ok) {
            const body = isJsonResponse ? await res.json() : await res.text();
            throw new Error((body as { error: string }).error);
        }

        return isJsonResponse ? res.json() as Promise<T> : res.text() as Promise<T>;
    }


    async getUserCoins(user: TwitchUser): Promise<number | null> {
        try {
            const res = await this.apiFetch<LinkedAccountCoinsResponse>(`oauth/twitch/${user.id}/coins`);
            return res.coins;
        } catch (error) {
            console.log(error)
            return null;
        }
    }

    async updateCoinsForUser(user: TwitchUser, amount: number) {
        try {
            await this.apiFetch(`oauth/twitch/${user.id}/coins`, {
                method: 'PATCH',
                body: JSON.stringify({
                    username: user.username,
                    amount,
                }),
            });
        } catch (error) {
            console.log(error);
        }
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
