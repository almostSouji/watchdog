import EventHandler from '../../handlers/EventHandler';
import { Event } from '../../structures/Event';
import { Role } from 'discord.js';

export default class extends Event {
	public constructor(handler: EventHandler) {
		super(handler, {
			emitter: 'client',
			name: 'roleDelete'
		});
	}

	public async execute(role: Role): Promise<boolean> {
		const { client } = this.handler;
		client.red.srem(`guild:${role.guild.id}:overrideroles`, role.id);
		client.logger.log('cleanup', `guild:${role.guild.id}:overrideroles ▶️ ${role.id}`);
		return true;
	}
}
