const path = require('path');
const _ = require('lodash');

const devwarsApi = require('../apis/devwarsApi');

let singletonInstance = null;
class DevWarsService {
    /**
     * Creates a new wrapper around the twitch client for communication to the helix api.
     */
    constructor() {
        if (singletonInstance != null) return singletonInstance;
        singletonInstance = this;
    }

    /**
     * Update the coins for the given user by the given amount (positive or negative)
     * @param {HelixUser} user The user who is having the coins updated.
     * @param {number} amount The positive or negative number to update the coins by.
     */
    async updateCoinsForUser(user, amount) {
        await devwarsApi.updateCoinsForUsers([{ user, amount }]);
    }
}

const devWarsService = new DevWarsService();

module.exports = devWarsService;
