import EventHandler from '../handlers/EventHandler';
import { Event } from '../structures/Event';
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
		const setKey = `guild:${channel.guild.id}:channel:${channel.id}`;
		const keys = await client.red.smembers(setKey);

		client._cleanup([...keys, setKey]);
		return true;
	}
}
