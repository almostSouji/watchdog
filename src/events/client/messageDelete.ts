import EventHandler from '../../handlers/EventHandler';
import { Event } from '../../structures/Event';
import { Message } from 'discord.js';
import { KEYS } from '../../util/keys';

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
		client._cleanup([KEYS.RESOURCE_PATTERN(message.id)]);
		return true;
	}
}
