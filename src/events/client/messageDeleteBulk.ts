import EventHandler from '../../handlers/EventHandler';
import { Event } from '../../structures/Event';
import { Message, Collection } from 'discord.js';
import { REDIS } from '../../util/constants';

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
		const channel = messages.first()?.channel;
		if (!guild || !channel) {
			return false;
		}
		const patterns = messages.map(msg => REDIS.RESOURCE_PATTERN(msg.id));
		client._cleanup(patterns);
		return true;
	}
}
