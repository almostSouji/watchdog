import { Command } from '../structures/Command';
import CommandHandler from '../handlers/CommandHandler';
import { Message } from 'discord.js';

export default class extends Command {
	public constructor(handler: CommandHandler) {
		super('ping', handler, {
			aliases: ['pong'],
			description: {
				content: 'Just a test command, really',
				usage: '',
				flags: {}
			},
			ownerOnly: true
		});
	}

	public async execute(message: Message): Promise<Message|void> {
		return message.reply('pong');
	}
}
