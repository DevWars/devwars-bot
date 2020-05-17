const TwitchClient = require('twitch').default;
const path = require('path');
const fs = require('fs');
const _ = require('lodash');

const devwarsApi = require('../apis/devwarsApi');

let singletonInstance = null;

class TwitchService {
    /**
     * Creates a new wrapper around the twitch client for communication to the helix api.
     * @param {string} configurationPath The path the related configuration exists.
     */
    constructor(configurationPath) {
        if (singletonInstance != null) return singletonInstance;

        this.configurationPath = configurationPath;
        this.configuration = JSON.parse(fs.readFileSync(this.configurationPath));

        // throw if any of the configuration is missing.
        ['clientSecret', 'refreshToken', 'clientId', 'accessToken', 'channel'].forEach((required) => {
            if (this.configuration[required] == null) throw new Error(`configuration property ${required} is required`);
        });

        const { clientId, accessToken, clientSecret, refreshToken } = this.configuration;

        const refreshConfig = { clientSecret, refreshToken, onRefresh: this.onRefreshToken.bind(this) };
        this.twitchClient = TwitchClient.withCredentials(clientId, accessToken, undefined, refreshConfig);

        singletonInstance = this;
    }

    /**
     * Triggered when the refresh token is used to update the access token.
     *
     * @param {string} accessToken The updated access token for twitch.
     * @param {string} refreshToken The updated refresh token for twitch.
     * @param {string} scope The scope the access token is valid for, i.e. what this token enables you to do.
     */
    onRefreshToken({ accessToken, refreshToken, scope }) {
        console.log('updated tokens');
        this.configuration.accessToken = accessToken;
        this.configuration.refreshToken = refreshToken;

        // Update the local configuration file with the related data.
        fs.writeFileSync(this.configurationPath, JSON.stringify(this.configuration));
    }

    /**
     * Gives coins to all viewers.
     * @param {number} amount The amount of coins for the given users.
     */
    async giveCoinsToAllViewers(amount) {
        const usernames = await this.getViewers();
        const twitchUsers = await this.getUsersByUsernames(usernames);

        const updates = twitchUsers.map((user) => ({ user, amount }));
        return devwarsApi.updateCoinsForUsers(updates);
    }

    /**
     * Get all the current viewers for the given channel in the configuration.
     */
    async getViewers() {
        const viewers = await this.twitchClient.unsupported.getChatters(this.configuration.channel);
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

    /**
     * Get a single user by the given username.
     * @param {string} username The single users username.
     */
    async getUserByUsername(username) {
        const [user] = await this.getUsersByUsernames([username]);
        return user;
    }
}

const twitchService = new TwitchService(path.join(__dirname, '../../twitch.config.json'));

module.exports = twitchService;
