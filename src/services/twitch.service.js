const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const TwitchClient = require('twitch').default;
const config = require('../config');
const devwarsService = require('./devwars.service');

class TwitchService {
    twitchConfigPath = path.join(__dirname, '../../twitch.config.json');
    twitchConfig = _.pick(config.twitch, ['accessToken', 'refreshToken']);

    constructor() {
        if (fs.existsSync(this.twitchConfigPath)) {
            this.twitchConfig = JSON.parse(fs.readFileSync(this.twitchConfigPath));
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
        fs.writeFileSync(this.twitchConfigPath, JSON.stringify(this.twitchConfig, null, 2));
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
}

module.exports = new TwitchService();
