const camelize = require('camelize');
const config = require('../config');

class User {
    constructor(apiUser) {
        const { userId, username, mod, subscriber } = camelize(apiUser);

        this.id = userId;
        this.username = username;
        this.subscriber = subscriber;

        if (this.username === config.channel) {
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
