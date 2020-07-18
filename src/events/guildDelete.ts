import EventHandler from '../handlers/EventHandler';
import { Event } from '../structures/Event';
import { Guild } from 'discord.js';

export default class extends Event {
	public constructor(handler: EventHandler) {
		super(handler, {
			emitter: 'client',
			name: 'guildDelete'
		});
	}

	public async execute(guild: Guild): Promise<boolean> {
		const { client } = this.handler;
		const keys = await client.red.smembers(`guilddata:${guild.id}`);
		for (const key of keys) {
			client.red.del(key);
			client.logger.log('cleanup', `[GUILD_DELETE] (${guild.id}) ▶️ ${key}`);
		}
		client.red.del(`guilddata:${guild.id}`);
		client.logger.log('cleanup', `guilddata:${guild.id}`);
		return true;
	}
}
