import { getArgumentProps, getCommandName } from '../utils';
import User, { UserRole } from './User';

export type CommandAction = (ctx: { user: User; message: string }, args: string[]) => void;

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
