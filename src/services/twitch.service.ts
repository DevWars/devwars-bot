import * as _ from 'lodash';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import devwarsService from './devwars.service';
const TwitchClient = require('twitch').default;

class TwitchService {
    twitchConfigPath = path.join(__dirname, '../../twitch.config.json');
    twitchConfig = _.pick(config.twitch, ['accessToken', 'refreshToken']);

    constructor() {
        if (existsSync(this.twitchConfigPath)) {
            this.twitchConfig = JSON.parse(readFileSync(this.twitchConfigPath, 'utf8'));
        }

        const refreshConfig = {
            clientSecret: config.twitch.clientSecret,
            refreshToken: this.twitchConfig.refreshToken,
            onRefresh: this.updateTwitchConfig.bind(this),
        };

        this.twitchClient = TwitchClient.withCredentials(
            config.twitch.clientId,
            this.twitchConfig.accessToken,
            undefined,
            refreshConfig,
        );
    }

    updateTwitchConfig(twitchConfig) {
        this.twitchConfig = _.pick(twitchConfig, ['accessToken', 'refreshToken']);
        // Update the local configuration file with the related data.
        writeFileSync(this.twitchConfigPath, JSON.stringify(this.twitchConfig, null, 2));
    }

    async giveCoinsToAllViewers(amount) {
        const usernames = await this.getCurrentViewers();
        const twitchUsers = await this.getUsersByUsernames(usernames);

        const updates = twitchUsers.map((user) => ({ user, amount }));
        return devwarsService.updateCoinsForUsers(updates);
    }

    async getCurrentViewers() {
        const viewers = await this.twitchClient.unsupported.getChatters(config.twitch.channel);
        return _.uniq(viewers.allChatters);
    }

    // Gathers all users from twitch in chunks of 100.
    async getUsersByUsernames(usernames) {
        const requests = _.chunk(usernames, 100).map((users) => {
            return this.twitchClient.helix.users.getUsersByNames(users);
        });

        const results = _.flatten(await Promise.all(requests));
        return results.map((user) => ({ id: user.id, username: user.name }));
    }

    async getUserByUsername(username) {
        const [user] = await this.getUsersByUsernames([username]);
        return user;
    }

    async checkStreamStatus() {
        return this.twitchClient.helix.streams.getStreamByUserName(config.twitch.channel);
    }
}

export default new TwitchService();
