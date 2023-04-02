import { minutesToMs } from "../utils";
import * as tmi from 'tmi.js';
import twitchService, { TwitchUser } from '../services/twitch.service';
import config from '../config';
import { parseArguments, checkArgumentLength, isCommand, getCommandName, coins } from '../utils';
import { Bet } from "../commands/betting";
import { Hype } from "../commands/hype";
import Command, { AutoCommand, AutoCommandAction, CommandAction } from './Command';
import User from './User';

export type Timestamp = number; // Unix timestamp

interface BotBetting {
    _timeout: NodeJS.Timeout | null;
    open: boolean;
    options: string[];
    bets: Map<TwitchUser['id'], Bet>;
    startAt: Timestamp | null;
    endAt: Timestamp | null;
};

interface BotHype {
    _timeout: NodeJS.Timeout | null;
    open: boolean;
    hypes: Hype[];
};

type ChatEventHandler = (
    channel: string,
    userstate: tmi.ChatUserstate,
    message: string,
    self: boolean
  ) => void | Promise<void>;

class Bot {
    twitchClient: tmi.Client;
    channel = config.twitch.channel;
    isLive = false;
    symbols: string[] = ['!', '$', '#', '@'];
    betting: BotBetting = {
        _timeout: null,
        open: false,
        options: ['blue', 'red', 'tie'],
        bets: new Map(),
        startAt: null,
        endAt: null,
    };
    hype: BotHype = {
        _timeout: null,
        open: false,
        hypes: [],
    };
    commands: Record<Command['name'], Command> = {};

    constructor() {
        setInterval(this.onGiveOut.bind(this), minutesToMs(15));
        setInterval(this.updateIsLiveStatus.bind(this), minutesToMs(1));
    }

    onChat: ChatEventHandler = async (_, userstate, message, self) => {
        if (self || !isCommand(message)) return;

        const command = this.commands[getCommandName(message)];
        if (!command) return;

        const user = new User(userstate);
        if (!command.userHasPermission(user)) return;

        const args = parseArguments(message);
        const argsLength = checkArgumentLength(args, command.args);
        if (argsLength) {
            return this.say(`${argsLength} ${command.template}`);
        }

        const ctx = { user, message };

        try {
            command.action(ctx, args);
        } catch (error) {
            console.log('Command Error:', error);
        }
    }

    async onGiveOut() {
        if (!this.isLive) return;
        const giveOutAmount = 25;

        let bonus = 0;
        if (Math.random() < 0.1) bonus = Math.floor(Math.random() * 1000);

        await twitchService.giveCoinsToAllViewers(giveOutAmount + bonus);

        const bonusMsg = bonus ? `and a bonus of ${coins(bonus)}!` : '';
        return this.say(`Everyone received ${coins(giveOutAmount)} ${bonusMsg}`);
    }

    async addCommand(template: string, action: CommandAction) {
        const command = new Command(template, action);
        this.commands[command.name] = command;
    }

    async addAutoCommand(template: string, action: AutoCommandAction, intervalInMinutes: number) {
        const command = new AutoCommand(template, action, intervalInMinutes);
        this.commands[command.name] = command;
    }

    async updateIsLiveStatus() {
        this.isLive = Boolean(await twitchService.checkStreamStatus());
    }

    action(message: string): void {
        this.twitchClient.action(this.channel, message);
    }

    say(message: string) {
        this.twitchClient.say(this.channel, message);
    }

    whisper(user: User, message: string) {
        this.twitchClient.whisper(user.username, message);
    }

    async connect() {
        this.twitchClient = new tmi.client({
            options: { debug: true },
            connection: { reconnect: true },
            identity: {
                username: config.twitch.username,
                password: config.twitch.password,
            },
            channels: [`#${config.twitch.channel}`],
        });

        this.twitchClient.on('chat', this.onChat);

        await this.twitchClient.connect();
        await this.updateIsLiveStatus();
    }
}

export default new Bot();
