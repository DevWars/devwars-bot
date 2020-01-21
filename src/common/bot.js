const tmi = require('tmi.js');
const ms = require('ms');

const config = require('../config');
const Command = require('./Command');
const User = require('./User');
const { giveCoinsToAllViewers } = require('../services/twitch.service');
const firebaseService = require('../services/firebase.service');
const { parseArguments, checkArgumentLength, isCommand, getCommandName, coins } = require('../utils');

class Bot {
    constructor() {
        this.client = null;
        this.channel = config.channel;
        this.isFirstChange = true;

        this.symbols = ['!', '$', '#', '@'];

        this.game = {
            canApply: false,
            active: false,
            stage: 'objective',
            stages: ['objective', 'betting', 'voting', 'poll'],
        };

        this.voting = {
            open: false,
            category: 'ui',
            categories: ['ui', 'ux', 'tiebreaker'],
            votes: [],
            duration: -1,
            timer: null,
        };

        this.betting = {
            open: false,
            teams: ['blue', 'red', 'tie'],
            duration: -1,
            bets: {},
            timer: null,
            openTimer: null,
        };

        this.poll = {
            open: false,
            question: '',
            options: [],
            votes: [],
            duration: -1,
            timer: null,
        };

        this.hype = {
            open: false,
            hypes: [],
            timer: null,
        };

        this.commands = {};

        this.giveOutAmount = 10;
        this.giveOutInterval = setInterval(this.onGiveOut.bind(this), ms('15m'));
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

    async onEditorStateChange() {
        await firebaseService.listenForStageChange((state) => {
            // Don't listen for changes on bot boot up
            if (this.isFirstChange) {
                this.isFirstChange = false;
                return;
            }

            if (state === 'running') {
                this.selfCommand('!startgame');
            }

            if (state === 'ended') {
                // When live game ends on editor
            }
        });
    }

    async onGiveOut() {
        if (this.game.active) {
            const newBase = this.giveOutAmount * 2;
            let bonus = 0;

            if (Math.random() < 0.1) bonus = Math.floor(Math.random() * 1000);
            await giveCoinsToAllViewers(newBase + bonus);

            const bonusMsg = bonus ? `and a bonus of ${coins(bonus)}!` : '';
            return this.say(`Everyone received ${coins(newBase)} ${bonusMsg}`);
        }

        await giveCoinsToAllViewers(this.giveOutAmount);
        this.say(`Everyone received ${coins(this.giveOutAmount)}!`);
    }

    async addCommand(template, action, interval) {
        const command = new Command(template, action);
        this.commands[command.name] = command;

        if (interval) {
            setInterval(() => {
                command.action();
            }, interval);
        }
    }

    async selfCommand(command) {
        const commandName = getCommandName(command);
        const args = parseArguments(command);

        // Can't accept commands with ctx
        this.commands[commandName].action({}, args);
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
                username: config.username,
                password: config.password,
            },
            channels: [`#${config.channel}`],
        });

        this.client.on('chat', this.onChat.bind(this));

        await this.client.connect();
        await this.onEditorStateChange();
    }
}

module.exports = new Bot(config);
