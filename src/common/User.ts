import camelize from 'camelize-ts';
import config from '../config';

export type UserRole = 'admin' | 'mod' | 'subscriber' | 'user';

export default class User {
    id: number;
    username: string;
    displayName: string;
    role: UserRole;
    subscriber: boolean;

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
