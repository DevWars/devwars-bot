const camelize = require('camelize');
const config = require('../config');

class User {
    constructor(apiUser) {
        const { userId, username, displayName, mod, subscriber } = camelize(apiUser);

        this.id = Number(userId);
        this.username = username;
        this.displayName = displayName;
        this.subscriber = subscriber;

        if (this.username === config.twitch.channel) {
            this.role = 'admin';
        } else if (mod) {
            this.role = 'mod';
        } else if (subscriber) {
            this.role = 'subscriber';
        } else {
            this.role = 'user';
        }
    }
}

module.exports = User;
