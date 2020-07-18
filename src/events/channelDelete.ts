import EventHandler from '../handlers/EventHandler';
import { Event } from '../structures/Event';
import { REDIS } from '../util/constants';
import { DMChannel, TextChannel } from 'discord.js';

export default class extends Event {
	public constructor(handler: EventHandler) {
		super(handler, {
			emitter: 'client',
			name: 'channelDelete'
		});
	}

	public async execute(channel: DMChannel|TextChannel): Promise<boolean> {
		if (!(channel instanceof TextChannel)) {
			return false;
		}
		const { client } = this.handler;
		client._cleanup([REDIS.CHANNEL_PATTERN(channel.id)]);
		return true;
	}
}
