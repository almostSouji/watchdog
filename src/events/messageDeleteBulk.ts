import EventHandler from '../handlers/EventHandler';
import { Event } from '../structures/Event';
import { Message, Collection } from 'discord.js';

export default class extends Event {
	public constructor(handler: EventHandler) {
		super(handler, {
			emitter: 'client',
			name: 'messageDeleteBulk'
		});
	}

	public async execute(messages: Collection<string, Message>): Promise<boolean> {
		const { client } = this.handler;
		const guild = messages.first()?.guild;
		if (!guild) {
			return false;
		}
		for (const id of messages.keys()) {
			client.red.del(`resource:${id}`);
			client.logger.log('cleanup', `resource:${id}`);
			client.red.srem(`guilddata:${guild.id}`, `resource:${id}`);
			client.logger.log('cleanup', `guilddata:${guild.id} ▶️ resource:${id}`);
		}
		return true;
	}
}
