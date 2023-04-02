const splitargs = require('splitargs');
import Command from "../common/Command";

export function isCommand(message: string) {
    if (typeof message !== 'string') return false;

    return message.trim().charAt(0) === '!';
}

export function getCommandName(message: string) {
    const firstWord = message.trim().split(' ')[0];
    const command = firstWord.toLowerCase().substring(1);

    return command;
}

// TODO: Refactor this to be more readable
export function parseArguments(message: string) {
    let args = message.trim().split(' ').slice(1).join(' ');

    if (args.match(/\|/)) {
        let options = args.split('|')[0];
        const optionsSpread = args.split('|').slice(1)
            .map(opt => opt.trim())
            .filter(question => question.length > 1);

        options = splitargs(options);
        args = [...options, ...optionsSpread];
    } else {
        args = splitargs(args.trim());
    }

    return args.map((opt) => {
        if (opt.match(/^-?\d+$/)) {
            return Number.parseInt(opt, 10);
        }

        return opt.toLowerCase();
    });
}

export function checkArgumentLength(inputArgs, commandArgs) {
    const unlimitedArgs = commandArgs.find(arg => arg.includes('...'));

    if (!unlimitedArgs && inputArgs.length > commandArgs.length) {
        return 'Too many arguments provided.';
    }

    if (inputArgs.length < commandArgs.length) {
        return 'Too few arguments provided.';
    }

    return false;
}

export function getArgumentProps(commandTemplate: Command['template']) {
    const argArr = commandTemplate.split(' ').splice(1);
    return argArr.map(arg => arg.replace(/[<>]/g, ''));
}

export function isValidNumber(value: number): boolean {
    return (!Number.isNaN(value) && value % 1 === 0 && value >= 0);
}

export function coins(number: number | string) {
    const formattedCoins = number.toLocaleString();
    return `devwarsCoin ${formattedCoins}`;
}

export function minutesToMs(minutes: number) {
    return minutes * 60 * 1000;
}
