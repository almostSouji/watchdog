import { Command } from '../structures/Command';
import CommandHandler from '../handlers/CommandHandler';
import { Message, Collection, Role } from 'discord.js';
import * as Lexure from 'lexure';
import { MESSAGES } from '../util/constants';
import { KEYS } from '../util/keys';

const { COMMANDS: { COMMON, STAFF } } = MESSAGES;


export default class extends Command {
	public constructor(handler: CommandHandler) {
		super('staff', handler, {
			aliases: ['staff'],
			description: {
				content: 'Add or remove staff roles',
				usage: '<add|remove> <role>',
				flags: {}
			},
			userPermissions: ['MANAGE_GUILD'],
			guildOnly: true
		});
	}

	private readonly addAliases = ['add', '+'];
	private readonly removeAliases = ['remove', '-'];
	private readonly listAliases = ['list', 'ls', 'l'];
	private readonly subCommands = this.addAliases.concat(this.removeAliases, this.listAliases);

	public async execute(message: Message, args: Lexure.Args): Promise<Message|void> {
		const { client } = this.handler;
		const { guild, member } = message;
		if (!guild) return;
		const subCommand = args.single();
		if (!member?.permissions.has(this.userPermissions)) {
			return message.channel.send(STAFF.FAIL.MISSING_PERMISSIONS);
		}
		if (!subCommand || !this.subCommands.includes(subCommand)) {
			return message.channel.send(COMMON.FAIL.NO_SUB_COMMAND(['add', 'remove', 'list']));
		}
		if (this.listAliases.includes(subCommand)) {
			const overrideRoles = await this.handler.overrideRoles();
			const roles = new Collection<string, Role>();
			for (const id of overrideRoles) {
				const res = client.resolveRole(guild, id);
				if (res) roles.set(res.id, res);
			}
			if (!roles.size) {
				return message.channel.send(STAFF.INFO.NO_STAFF);
			}
			return message.channel.send(STAFF.INFO.LIST(roles.map(r => r.name)));
		}
		const roleArgs = args.single();
		if (!roleArgs) {
			return message.channel.send(COMMON.FAIL.MISSING_ARGUMENT('role'));
		}
		const role = client.resolveRole(guild, roleArgs);
		if (!role) {
			return message.channel.send(COMMON.FAIL.RESOLVE(roleArgs, 'role'));
		}
		if (this.addAliases.includes(subCommand)) {
			const res = await client.red.sadd(KEYS.STAFF_ROLES, role.id);
			if (!res) {
				return message.channel.send(STAFF.FAIL.ALREADY_STAFF(role.name));
			}
			return message.channel.send(STAFF.SUCCESS.ADDED(role.name));
		}
		if (this.removeAliases.includes(subCommand)) {
			const res = await client.red.srem(KEYS.STAFF_ROLES, role.id);
			if (!res) {
				return message.channel.send(STAFF.FAIL.NOT_STAFF(role.name));
			}
			return message.channel.send(STAFF.SUCCESS.REMOVED(role.name));
		}
	}
}
