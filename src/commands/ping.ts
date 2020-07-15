import { Command } from '../structures/Command';
import CommandHandler from '../handlers/CommandHandler';
import { Message } from 'discord.js';

export default class extends Command {
	public constructor(handler: CommandHandler) {
		super('ping', handler, {
			aliases: ['pong'],
			description: 'pingpong',
			ownerOnly: true
		});
	}

	public async execute(message: Message): Promise<boolean> {
		message.reply('pong');
		return true;
	}
}
