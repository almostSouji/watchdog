import { Command } from '../structures/Command';
import CommandHandler from '../handlers/CommandHandler';
import { Message } from 'discord.js';
import * as Lexure from 'lexure';
import ms from '@naval-base/ms';
import { MESSAGES } from '../util/constants';
const { COMMANDS: { COOLDOWN, COMMON } } = MESSAGES;

export default class extends Command {
	public constructor(handler: CommandHandler) {
		super('cooldown', handler, {
			aliases: ['cd'],
			description: {
				content: 'Display the cooldown for verification roles. Staff can provide a user to check their cooldown as well. Cooldowns can be reset be staff through the `--reset` flag.',
				usage: '[user] [--reset]',
				flags: {
					'`-r`, `--reset`': 'reset the cooldown'
				}
			},
			userPermissions: ['MANAGE_GUILD'],
			guildOnly: true
		});
	}

	public async execute(message: Message, args: Lexure.Args): Promise<Message|void> {
		const { client } = this.handler;
		const { guild, member } = message;

		if (!guild) return;

		const overrideRoles = await this.handler.overrideRoles(guild);
		const override = member?.hasPermission(this.userPermissions) || member?.roles.cache.some(r => overrideRoles.includes(r.id));
		const userarg = Lexure.joinTokens(args.many(), null, true);
		const user = !userarg || !override ? message.author : await client.resolveUser(userarg, guild);

		if (!user) {
			return message.channel.send(COMMON.FAIL.RESOLVE(userarg, 'user'));
		}

		const reset = args.flag('reset', 'r');
		const key = `guild:${guild.id}:verification:blocked:${user.id}`;
		const ttl = await client.red.pttl(key);
		const isSelf = user.id === member?.id;

		if (ttl === -2) {
			return message.channel.send(COOLDOWN.SUCCESS.NO_COOLDOWN(user.tag, isSelf));
		}

		if (reset && override) {
			client.red.del(key);
			const formatted = ttl === -1 ? 'permanent' : ms(ttl, true);
			return message.channel.send(COOLDOWN.SUCCESS.RESET(user.tag, formatted, isSelf));
		}

		if (ttl === -1) {
			return message.channel.send(COOLDOWN.SUCCESS.PERMANENT(user.tag, isSelf));
		}

		const formatted = ms(ttl, true);
		return message.channel.send(COOLDOWN.SUCCESS.COOLDOWN(user.tag, formatted, isSelf));
	}
}
