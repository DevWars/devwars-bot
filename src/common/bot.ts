import { minutesToMs } from "../utils";
import * as tmi from 'tmi.js';
import twitchService from '../services/twitch.service';
import config from '../config';
import { parseArguments, checkArgumentLength, isCommand, getCommandName, coins } from '../utils';
import Command, { CommandAction } from './Command';
import User from './User';

type BotBetting = {
    _timeout: NodeJS.Timeout | null;
    open: boolean;
    options: string[];
    bets: Map<string, number>;
    startAt: number | null;
    endAt: number | null;
};

type BotHype = {
    _timeout: NodeJS.Timeout | null;
    open: boolean;
    hypes: string[];
};

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
    commands: Command[] = [];

    constructor() {
        setInterval(this.onGiveOut.bind(this), minutesToMs(15));
        setInterval(this.updateIsLiveStatus.bind(this), minutesToMs(1));
    }

    async onChat(event: Parameters<tmi.Events['chat']>) {
        const [_, apiUser, message, self] = event;
        if (self || !isCommand(message)) return;

        const command = this.commands[getCommandName(message)];
        if (!command) return;

        const user = new User(apiUser);
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

    async addAutoCommand(template: string, action: CommandAction, intervalInMinutes: number) {
        const command = new Command(template, action);
        this.commands[command.name] = command;

        setInterval(() => {
            if (this.isLive) command.action();
        }, minutesToMs(intervalInMinutes));
    }

    async selfCommand(command: Command) {
        const commandName = getCommandName(command);
        const args = parseArguments(command);

        // Can't accept commands with ctx
        this.commands[commandName].action({}, args);
    }

    async updateIsLiveStatus() {
        this.isLive = Boolean(await twitchService.checkStreamStatus());
    }

    action(message: string) {
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

        // TODO: Fix any type casting
        this.twitchClient.on('chat', this.onChat.bind(this) as any);

        await this.twitchClient.connect();
        await this.updateIsLiveStatus();
    }
}

export default new Bot();