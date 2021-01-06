const tmi = require('tmi.js');
const ms = require('ms');
const config = require('../config');
const Command = require('./Command');
const User = require('./User');
const twitchService = require('../services/twitch.service');
const devwarsLiveService = require('../services/devwarsLive.service');
const { parseArguments, checkArgumentLength, isCommand, getCommandName, coins } = require('../utils');

class Bot {
    constructor() {
        this.client = null;
        this.channel = config.twitch.channel;
        this.isLive = false;

        this.symbols = ['!', '$', '#', '@'];

        this.betting = {
            _timeout: null,
            open: false,
            options: ['blue', 'red', 'tie'],
            bets: new Map(),
            startAt: null,
            endAt: null,
        };

        this.hype = {
            _timeout: null,
            open: false,
            hypes: [],
        };

        this.commands = {};

        this.giveOutAmount = 10;
        setInterval(this.onGiveOut.bind(this), ms('15m'));

        setInterval(this.updateIsLiveStatus.bind(this), ms('1m'));
    }

    async onChat(channel, apiUser, message, self) {
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
        if (devwarsLiveService.game) {
            const newBase = this.giveOutAmount * 2;
            let bonus = 0;

            if (Math.random() < 0.1) bonus = Math.floor(Math.random() * 1000);
            await twitchService.giveCoinsToAllViewers(newBase + bonus);

            const bonusMsg = bonus ? `and a bonus of ${coins(bonus)}!` : '';
            return this.say(`Everyone received ${coins(newBase)} ${bonusMsg}`);
        }

        await twitchService.giveCoinsToAllViewers(this.giveOutAmount);
        this.say(`Everyone received ${coins(this.giveOutAmount)}!`);
    }

    async addCommand(template, action) {
        const command = new Command(template, action);
        this.commands[command.name] = command;
    }

    async addAutoCommand(template, action, interval) {
        const command = new Command(template, action);
        this.commands[command.name] = command;


        setInterval(() => {
            if (this.isLive) command.action();
        }, ms(interval));
    }

    async selfCommand(command) {
        const commandName = getCommandName(command);
        const args = parseArguments(command);

        // Can't accept commands with ctx
        this.commands[commandName].action({}, args);
    }

    async updateIsLiveStatus() {
        this.isLive = Boolean(await twitchService.checkStreamStatus());
    }

    action(message) {
        this.client.action(this.channel, message);
    }

    say(message) {
        this.client.say(this.channel, message);
    }

    whisper(user, message) {
        this.client.whisper(user.username, message);
    }

    async connect() {
        // eslint-disable-next-line
        this.client = new tmi.client({
            options: { debug: true },
            connection: { reconnect: true },
            identity: {
                username: config.twitch.username,
                password: config.twitch.password,
            },
            channels: [`#${config.twitch.channel}`],
        });

        this.client.on('chat', this.onChat.bind(this));

        await this.client.connect();
        await this.updateIsLiveStatus();
    }
}

module.exports = new Bot(config);
