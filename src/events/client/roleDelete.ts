import EventHandler from '../../handlers/EventHandler';
import { Event } from '../../structures/Event';
import { Role } from 'discord.js';
import { KEYS } from '../../util/keys';

export default class extends Event {
	public constructor(handler: EventHandler) {
		super(handler, {
			emitter: 'client',
			name: 'roleDelete'
		});
	}

	public async execute(role: Role): Promise<boolean> {
		const { client } = this.handler;
		client.red.srem(KEYS.STAFF_ROLES, role.id);
		client.logger.log('cleanup', `${KEYS.STAFF_ROLES} ▶️ ${role.id}`);
		return true;
	}
}
