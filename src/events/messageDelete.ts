import EventHandler from '../handlers/EventHandler';
import { Event } from '../structures/Event';
import { Message } from 'discord.js';

export default class extends Event {
	public constructor(handler: EventHandler) {
		super(handler, {
			emitter: 'client',
			name: 'messageDelete'
		});
	}

	public async execute(message: Message): Promise<boolean> {
		if (!message.guild) {
			return false;
		}
		const { client } = this.handler;
		client.red.del(`resource:${message.id}`);
		client.logger.log('cleanup', `resource:${message.id}`);
		client.red.srem(`guilddata:${message.guild.id}`, `resource:${message.id}`);
		client.logger.log('cleanup', `guilddata:${message.guild.id} ▶️ resource:${message.id}`);
		return true;
	}
}
