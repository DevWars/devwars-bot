import config from '../config';
import { ChatUserstate } from 'tmi.js';

export type UserRole = 'admin' | 'mod' | 'subscriber' | 'user';

export default class User {
    id: number;
    username: string;
    displayName: string;
    role: UserRole;
    subscriber: boolean;

    constructor(user: ChatUserstate) {
        this.id = Number(user['user-id']);
        this.username = user.username ?? '';
        this.displayName = user['display-name'] ?? '';
        this.subscriber = Boolean(user.subscriber);

        if (this.username === config.twitch.channel) {
            this.role = 'admin';
        } else if (user.mod) {
            this.role = 'mod';
        } else if (user.subscriber) {
            this.role = 'subscriber';
        } else {
            this.role = 'user';
        }
    }
}
