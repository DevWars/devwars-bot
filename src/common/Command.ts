import { ParsedArgument, getArgumentProps, getCommandName, minutesToMs } from '../utils';
import User, { UserRole } from './User';
import bot from './bot';

export type CommandAction = (ctx: { user: User; message: string }, args: ParsedArgument[]) => void;
export type AutoCommandAction = () => void | Promise<void>;

const ROLE_PERMISSIONS: { [role in UserRole]: string[] } = {
    admin: ['@', '#', '$', '!'],
    mod: ['#', '$', '!'],
    subscriber: ['$', '!'],
    user: ['!'],
};

export default class Command {
    name: string;
    template: string;
    symbol: string;
    args: string[];
    action: CommandAction;

    constructor(template: string, action: CommandAction) {
        this.name = getCommandName(template);
        this.template = template;
        this.symbol = template.charAt(0);
        this.args = getArgumentProps(template);
        this.action = action;
    }

    userHasPermission(user: User) {
        const userPermissions = ROLE_PERMISSIONS[user.role];
        if (!userPermissions) return false;

        return userPermissions.includes(this.symbol);
    }
}

export class AutoCommand extends Command {
    constructor(template: string, action: AutoCommandAction, intervalInMinutes: number) {
      super(template, action);

      setInterval(() => {
        if (bot.isLive) {
            action();
        }
      }, minutesToMs(intervalInMinutes));
    }
  }
