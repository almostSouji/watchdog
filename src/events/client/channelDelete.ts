import EventHandler from '../../handlers/EventHandler';
import { Event } from '../../structures/Event';
import { DMChannel, TextChannel } from 'discord.js';
import { KEYS } from '../../util/keys';

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
		const setKey = KEYS.RESOURCES_PER_CHANNEL(channel.id);
		const keys = await client.red.smembers(setKey);
		client.red.srem(KEYS.PRUNE_CHANNELS, channel.id);
		client._cleanup([...keys, setKey, KEYS.CHANNEL_PATTERN(channel.id)]);
		return true;
	}
}
