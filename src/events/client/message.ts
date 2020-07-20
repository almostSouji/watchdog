import EventHandler from '../../handlers/EventHandler';
import { Event } from '../../structures/Event';
import { Message } from 'discord.js';

export default class extends Event {
	public constructor(handler: EventHandler) {
		super(handler, {
			emitter: 'client',
			name: 'message'
		});
	}

	public async execute(message: Message): Promise<boolean> {
		const { client } = this.handler;
		const { guild, channel } = message;
		if (guild) {
			const shouldPrune = await client.red.sismember(`guild:${guild.id}:prunechannels`, channel.id);
			if (shouldPrune) {
				if (message.deletable) {
					message.delete();
				}
				return false;
			}
		}

		await client.commands.handle(message);
		return true;
	}
}
