import EventHandler from '../../handlers/EventHandler';
import { Event } from '../../structures/Event';
import { Guild } from 'discord.js';
import { REDIS } from '../../util/constants';

export default class extends Event {
	public constructor(handler: EventHandler) {
		super(handler, {
			emitter: 'client',
			name: 'guildDelete'
		});
	}

	public async execute(guild: Guild): Promise<boolean> {
		const { client } = this.handler;
		client._cleanup([REDIS.GUILD_PATTERN(guild.id)]);
		return true;
	}
}
