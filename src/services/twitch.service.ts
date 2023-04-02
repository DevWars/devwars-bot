import * as _ from 'lodash';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import devwarsService from './devwars.service';
import config from '../config';
import Twitch, { HelixUser, HelixStream } from 'twitch';

interface TwitchConfig {
    accessToken: string;
    refreshToken: string;
}

export interface TwitchUser {
    id: number;
    username: string;
}

interface CoinUpdate {
    user: TwitchUser;
    amount: number;
}

class TwitchService {
    twitchConfigPath: string = path.join(__dirname, '../../twitch.config.json');
    twitchConfig: TwitchConfig = _.pick(config.twitch, ['accessToken', 'refreshToken']);
    twitchClient: Twitch;

    constructor() {
        if (existsSync(this.twitchConfigPath)) {
            this.twitchConfig = JSON.parse(readFileSync(this.twitchConfigPath, 'utf8'));
        }

        const refreshConfig = {
            clientSecret: config.twitch.clientSecret,
            refreshToken: this.twitchConfig.refreshToken,
            onRefresh: this.updateTwitchConfig.bind(this),
        };

        this.twitchClient = Twitch.withCredentials(
            config.twitch.clientId,
            this.twitchConfig.accessToken,
            undefined,
            refreshConfig,
        );
    }

    updateTwitchConfig(twitchConfig: TwitchConfig): void {
        this.twitchConfig = _.pick(twitchConfig, ['accessToken', 'refreshToken']);
        // Update the local configuration file with the related data.
        writeFileSync(this.twitchConfigPath, JSON.stringify(this.twitchConfig, null, 2));
    }

    async giveCoinsToAllViewers(amount: number): Promise<void> {
        const usernames = await this.getCurrentViewers();
        const twitchUsers = await this.getUsersByUsernames(usernames);

        const updates: CoinUpdate[] = twitchUsers.map((user) => ({ user, amount }));
        return devwarsService.updateCoinsForUsers(updates);
    }

    async getCurrentViewers(): Promise<string[]> {
        const viewers = await this.twitchClient.unsupported.getChatters(config.twitch.channel);
        return _.uniq(viewers.allChatters);
    }

    // Gathers all users from twitch in chunks of 100.
    async getUsersByUsernames(usernames: string[]): Promise<TwitchUser[]> {
        const requests = _.chunk(usernames, 100).map((users) => {
            return this.twitchClient.helix.users.getUsersByNames(users);
        });

        const results: HelixUser[] = _.flatten(await Promise.all(requests));
        return results.map((user) => ({ id: Number(user.id), username: user.name }));
    }

    async getUserByUsername(username: string): Promise<TwitchUser | undefined> {
        const [user] = await this.getUsersByUsernames([username]);
        return user;
    }

    async checkStreamStatus(): Promise<HelixStream | null> {
        return this.twitchClient.helix.streams.getStreamByUserName(config.twitch.channel);
    }
}

export default new TwitchService();
