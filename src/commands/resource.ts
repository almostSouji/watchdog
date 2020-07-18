import { Command } from '../structures/Command';
import CommandHandler from '../handlers/CommandHandler';
import * as Lexure from 'lexure';
import { Message, NewsChannel, TextChannel } from 'discord.js';
import { Embed } from '../util/Embed';
import { MESSAGES } from '../util/constants';

const { COMMANDS: { COMMON, RESOURCE } } = MESSAGES;

export default class extends Command {
	public constructor(handler: CommandHandler) {
		super('resource', handler, {
			aliases: ['res', 'resources'],
			description: {
				content: 'Initiate or edit a shared resource any staff can edit',
				usage: 'resource <add <channel> <content>|edit <message> <content>>',
				flags: {}
			},
			guildOnly: true,
			clientPermissions: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'READ_MESSAGE_HISTORY'],
			userPermissions: ['VIEW_CHANNEL', 'MANAGE_MESSAGES']
		});
	}

	private readonly addAliases = ['add', '+', 'post'];
	private readonly editAliases = ['edit', 'e', 'update'];
	private readonly subCommands = this.addAliases.concat(this.editAliases);

	public async execute(message: Message, args: Lexure.Args): Promise<Message|void> {
		const { client } = this.handler;
		const { guild, author, member } = message;
		if (!guild) return;
		const subCommand = args.single();
		const overrideRoles = await this.handler.overrideRoles(guild);
		const override = member?.roles.cache.some(r => overrideRoles.includes(r.id));

		if (!subCommand || !this.subCommands.includes(subCommand)) {
			return message.channel.send(COMMON.FAIL.NO_SUB_COMMAND(['add', 'edit']));
		}
		if (this.addAliases.includes(subCommand)) {
			const channelArgs = args.single();
			if (!channelArgs) {
				return message.channel.send(COMMON.FAIL.MISSING_ARGUMENT('channel'));
			}
			const channel = client.resolveChannel(channelArgs, guild, ['text', 'news']) as TextChannel | NewsChannel | undefined;
			if (!channel) {
				return message.channel.send(COMMON.FAIL.RESOLVE(channelArgs, 'channel'));
			}
			if (!channel.permissionsFor(author)?.has(this.userPermissions) && !override) {
				return message.channel.send(RESOURCE.FAIL.MISSING_PERMISSIONS_USER);
			}
			const content = args.many().map(a => `${a.raw}${a.trailing}`).join(' ')
				.trim();
			if (!content) {
				return message.channel.send(RESOURCE.FAIL.MISSING_CONTENT);
			}
			const embed = new Embed().setDescription(content).shorten();
			if (!channel.permissionsFor(client.user!)?.has(this.clientPermissions)) {
				return message.channel.send(RESOURCE.FAIL.MISSING_PERMISSIONS_BOT);
			}
			const msg = await channel.send(embed);
			await client.red.set(`resource:${msg.id}`, msg.channel.id);
			const prefix = await this.handler.prefix(message);
			return message.channel.send(RESOURCE.SUCCESS.SENT(prefix, msg.id));
		}
		const messageArgs = args.single();
		if (!messageArgs) {
			return message.channel.send(COMMON.FAIL.MISSING_ARGUMENT('message'));
		}
		const content = args.many().map(a => `${a.raw}${a.trailing}`).join(' ');
		if (!content) {
			return message.channel.send(RESOURCE.FAIL.MISSING_CONTENT);
		}

		const channelID = await client.red.get(`resource:${messageArgs}`);
		if (!channelID) {
			return message.channel.send(RESOURCE.FAIL.NOT_FOUND);
		}

		const channel = await client.resolveChannel(channelID, guild, ['text', 'news']) as TextChannel | NewsChannel | undefined;
		if (!channel) {
			await client.red.del(`resource:${messageArgs}`);
			return message.channel.send(RESOURCE.FAIL.NOT_FOUND);
		}
		if (!channel.permissionsFor(author)?.has(this.userPermissions) && !override) {
			return message.channel.send(RESOURCE.FAIL.MISSING_PERMISSIONS_USER);
		}
		try {
			const msg = await channel.messages.fetch(messageArgs);
			const embed = new Embed().setDescription(content).shorten();
			await msg.edit(embed);
			return message.channel.send(RESOURCE.SUCCESS.EDITED);
		} catch {
			await client.red.del(`resource:${messageArgs}`);
			return message.channel.send(RESOURCE.FAIL.NOT_FOUND);
		}
	}
}
