const _ = require('lodash');
const TwitchClient = require('twitch').default;
const fs = require('fs');
const path = require('path');
const devwarsService = require('./devwars.service');
const config = require('../config');

class TwitchService {
    /**
     * Creates a new wrapper around the twitch client for communication to the helix api.
     * @param {string} configurationPath The path the related configuration exists.
     */
    constructor(configurationPath) {
        this.configurationPath = configurationPath;
        this.twitchConfigFile = JSON.parse(fs.readFileSync(this.configurationPath));

        // throw if any of the configuration is missing.
        ['accessToken', 'refreshToken'].forEach((config) => {
            if (this.twitchConfigFile.accessToken == null) {
                throw new Error(`configFile property ${config} is required`);
            }
        });

        const refreshConfig = {
            clientSecret: config.twitch.clientSecret,
            refreshToken: this.twitchConfigFile.refreshToken,
            onRefresh: this.onRefreshToken.bind(this),
        };

        this.twitchClient = TwitchClient.withCredentials(
            config.twitch.clientId,
            this.twitchConfigFile.accessToken,
            undefined,
            refreshConfig,
        );
    }

    /**
     * Triggered when the refresh token is used to update the access token.
     *
     * @param {string} accessToken The updated access token for twitch.
     * @param {string} refreshToken The updated refresh token for twitch.
     * @param {string} scope The scope the access token is valid for, i.e. what this token enables you to do.
     */
    onRefreshToken({ accessToken, refreshToken, scope }) {
        console.log('Updated tokens');
        this.twitchConfigFile.accessToken = accessToken;
        this.twitchConfigFile.refreshToken = refreshToken;

        // Update the local configuration file with the related data.
        fs.writeFileSync(this.configurationPath, JSON.stringify(this.twitchConfigFile));
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

    /**
     * Gathers all users from twitch based on the usernames in blocks of 100.
     * @param {string[]} usernames The users being gathered.
     */
    async getUsersByUsernames(usernames) {
        const requests = _.chunk(usernames, 100).map((users) => {
            return this.twitchClient.helix.users.getUsersByNames(users);
        });

        const results = _.flatten(await Promise.all(requests));

        return _.map(results, (user) => {
            return { id: user.id, username: user.name };
        });
    }

    async getUserByUsername(username) {
        const [user] = await this.getUsersByUsernames([username]);
        return user;
    }
}

module.exports = new TwitchService(path.join(__dirname, '../../twitch.config.json'));
