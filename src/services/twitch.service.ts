import * as _ from 'lodash';
import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import devwarsService from './devwars.service';
import config from '../config';
import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';

export interface TwitchUser {
    id: number;
    username: string;
}

export interface UserCoinUpdate {
    user: TwitchUser;
    amount: number;
}

type TokenData = Parameters<RefreshingAuthProvider['addUser']>[1];

class TwitchService {
    twitchConfigPath: string = path.join(__dirname, '../../twitch.config.json');
    tokenData: TokenData;
    client: ApiClient;

    constructor() {
        this.tokenData = JSON.parse(readFileSync(this.twitchConfigPath, 'utf8'));

        const authProvider = new RefreshingAuthProvider({
            clientId: config.twitch.bot.clientId,
            clientSecret: config.twitch.bot.clientSecret,
            onRefresh: this.onRefresh.bind(this),
        });

        // Add user with initial tokens
        authProvider.addUser(config.twitch.bot.userId, this.tokenData);

        this.client = new ApiClient({ authProvider });
    }

    onRefresh(newTokenData: TokenData) {
        // Update the local configuration file with the related data.
        writeFileSync(this.twitchConfigPath, JSON.stringify(newTokenData, null, 4), 'utf8');
    }

    async giveCoinsToAllViewers(amount: number): Promise<void> {
        const users = await this.getCurrentViewers();
        const updates: UserCoinUpdate[] = users.map(user => ({ user, amount }));
        return devwarsService.updateCoinsForUsers(updates);
    }

    async getCurrentViewers(): Promise<TwitchUser[]> {
        const chatters = await this.client.chat.getChatters(config.twitch.userId, config.twitch.bot.userId);
        return chatters.data.map(chatter => ({
            id: Number(chatter.userId),
            username: chatter.userName
        }));
    }

    async isStreamLive(): Promise<boolean> {
        const stream = await this.client.streams.getStreamByUserName(config.twitch.channel);
        return Boolean(stream);
    }
}

export default new TwitchService();
