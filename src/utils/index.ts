const splitargs = require('splitargs');

export function isCommand(message) {
    if (typeof message !== 'string') return false;

    return message.trim().charAt(0) === '!';
}

export function getCommandName(message) {
    const firstWord = message.trim().split(' ')[0];
    const command = firstWord.toLowerCase().substring(1);

    return command;
}

export function parseArguments(message) {
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

export function getArgumentProps(commandTemplate) {
    const argArr = commandTemplate.split(' ').splice(1);
    return argArr.map(arg => arg.replace(/[<>]/g, ''));
}

export function validNumber(number) {
    return (!Number.isNaN(number) && number % 1 === 0 && number >= 0);
}

export function coins(number: number) {
    const formattedCoins = number.toLocaleString();
    return `devwarsCoin ${formattedCoins}`;
}

export function minutesToMs(minutes: number) {
    return minutes * 60 * 1000;
}
