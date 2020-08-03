import { Command } from '../structures/Command';
import CommandHandler from '../handlers/CommandHandler';
import { Message } from 'discord.js';
import * as Lexure from 'lexure';
import ms from '@naval-base/ms';
import { MESSAGES } from '../util/constants';
import { KEYS } from '../util/keys';
const { COMMANDS: { COOLDOWN, COMMON } } = MESSAGES;

export default class extends Command {
	public constructor(handler: CommandHandler) {
		super('cooldown', handler, {
			aliases: ['cd'],
			description: {
				content: 'Display the cooldown for verification roles. Staff can provide a user to check their cooldown as well. Cooldowns and levels can be reset by staff through the `--reset` and `--reset-level` flag respectively (can be used together).',
				usage: '[user] [--reset] [--reset-level]',
				flags: {
					'`-r`, `--reset`': 'reset the cooldown',
					'`-rl`, `--reset-level`': 'reset the level'
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

		const overrideRoles = await this.handler.overrideRoles();
		const override = member?.permissions.has(this.userPermissions) || member?.roles.cache.some(r => overrideRoles.includes(r.id));
		const userarg = Lexure.joinTokens(args.many(), null, true);
		const user = !userarg || !override ? message.author : await client.resolveUser(userarg, guild);

		if (!user) {
			return message.channel.send(COMMON.FAIL.RESOLVE(userarg, 'user'));
		}

		const reset = args.flag('reset', 'r');
		const resetLevel = args.flag('reset-level', 'rl');
		const key = KEYS.VERIFICATION_BLOCKED(user.id);
		const ttl = await client.red.pttl(key);
		const isSelf = user.id === member?.id;

		if (ttl === -2) {
			return message.channel.send(COOLDOWN.SUCCESS.NO_COOLDOWN(user.tag, isSelf));
		}

		if ((reset || resetLevel) && override) {
			const scope = [];
			const levelKey = KEYS.VERIFICATION_LEVEL(user.id);
			const level = await client.red.get(levelKey) ?? 0;
			if (reset) {
				const formatted = ttl === -1 ? 'permanent' : ms(ttl, true);
				scope.push(`cooldown (was ${formatted})`);
				client.red.del(key);
			}
			if (resetLevel) {
				scope.push(`level (was \`${level}\`)`);
				client.red.del(levelKey);
			}

			if (isSelf) {
				if (scope.length === 1) {
					return message.channel.send(COOLDOWN.SUCCESS.RESET_SELF_SINGLE(scope.join(' and ')));
				}
				return message.channel.send(COOLDOWN.SUCCESS.RESET_SELF_MULTI(scope.join(' and ')));
			}
			return message.channel.send(COOLDOWN.SUCCESS.RESET_OTHER(scope.join(' and '), user.tag));
		}

		if (ttl === -1) {
			return message.channel.send(COOLDOWN.SUCCESS.PERMANENT(user.tag, isSelf));
		}

		const formatted = ms(ttl, true);
		return message.channel.send(COOLDOWN.SUCCESS.COOLDOWN(user.tag, formatted, isSelf));
	}
}
