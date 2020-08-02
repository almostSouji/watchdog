import { Command } from '../structures/Command';
import CommandHandler from '../handlers/CommandHandler';
import { Message, TextChannel } from 'discord.js';
import * as Lexure from 'lexure';
import { MESSAGES, CONFIRMATION_TIMEOUT } from '../util/constants';
import { KEYS } from '../util/keys';

const { COMMANDS: { COMMON, PRUNE_CHANNEL } } = MESSAGES;

export default class extends Command {
	public constructor(handler: CommandHandler) {
		super('prunechannel', handler, {
			aliases: ['prune', 'prunesetup', 'autodelete'],
			description: {
				content: 'Toggle automatic pruning of any messages in the provided channel',
				usage: '<channel>',
				flags: {}
			},
			userPermissions: ['MANAGE_MESSAGES'],
			guildOnly: true
		});
	}

	public async execute(message: Message, args: Lexure.Args): Promise<Message|void> {
		const { client } = this.handler;
		const { guild, member, channel, author } = message;
		if (!(channel instanceof TextChannel)) return;
		const overrideRoles = await this.handler.overrideRoles();
		const override = member?.roles.cache.some(r => overrideRoles.includes(r.id));

		if (!channel.permissionsFor(author)?.has(this.userPermissions) && !override) {
			return;
		}

		const channelArgs = args.single();
		if (!channelArgs) {
			message.channel.send(COMMON.FAIL.MISSING_ARGUMENT('channel'));
			return;
		}
		const target = client.resolveChannel(guild!, ['text'], channelArgs);
		if (!target) {
			message.channel.send(COMMON.FAIL.RESOLVE(channelArgs, 'channel'));
			return;
		}
		if (!target.permissionsFor(author)?.has(this.userPermissions) && !override) {
			message.channel.send(PRUNE_CHANNEL.FAIL.MISSING_PERMISSIONS_USER);
			return;
		}
		if (!target.permissionsFor(client.user!)?.has(['MANAGE_MESSAGES'])) {
			message.channel.send(PRUNE_CHANNEL.FAIL.MISSING_PERMISSIONS_BOT);
			return;
		}
		const key = KEYS.PRUNE_CHANNELS;
		const exists = await client.red.sismember(key, target.id);
		const content = exists ? PRUNE_CHANNEL.CONFIRM_REM(target.toString()) : PRUNE_CHANNEL.CONFIRM_ADD(target.toString());
		const reply = await message.channel.send(content);
		const filter = (msg: Message) => msg.author.id === message.author.id;
		try {
			const answer = await message.channel.awaitMessages(filter, { max: 1, time: CONFIRMATION_TIMEOUT, errors: ['time'] }).then(coll => coll.first()?.content ?? 'no');
			if (['yes', 'y'].includes(answer)) {
				if (exists) {
					client.red.srem(key, target.id);
					reply.edit(PRUNE_CHANNEL.SUCCESS_REM(target.toString()));
				} else {
					client.red.sadd(key, target.id);
					reply.edit(PRUNE_CHANNEL.SUCCESS_ADD(target.toString()));
				}
				return;
			}
			throw new Error('negative input');
		} catch {
			reply.edit(PRUNE_CHANNEL.FAIL.ABORTED);
		}
	}
}
