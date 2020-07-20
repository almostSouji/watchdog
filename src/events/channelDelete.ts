import EventHandler from '../handlers/EventHandler';
import { Event } from '../structures/Event';
import { DMChannel, TextChannel } from 'discord.js';
import { REDIS } from '../util/constants';

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
		const setKey = `guild:${channel.guild.id}:channel:${channel.id}`;
		const keys = await client.red.smembers(setKey);
		client.red.srem(`guild:${channel.guild.id}:prunechannels`, channel.id);
		client._cleanup([...keys, setKey, REDIS.CHANNEL_PATTERN(channel.id)]);
		return true;
	}
}
