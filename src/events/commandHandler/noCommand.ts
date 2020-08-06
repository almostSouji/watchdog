import EventHandler from '../../handlers/EventHandler';
import { Event } from '../../structures/Event';
import { Message } from 'discord.js';
import { b64Encode } from '../../util';
import { BACK_OFF_SEC } from '../../util/constants';
import { KEYS } from '../../util/keys';

export default class ReadyEvent extends Event {
	public constructor(handler: EventHandler) {
		super(handler, {
			emitter: 'command',
			name: 'noCommand'
		});
	}

	public async execute(message: Message): Promise<boolean> {
		const { guild, client, channel, author } = message;
		if (!guild) return false;

		const key = KEYS.ROLE_PHRASE(channel.id, b64Encode(message.content));
		const roleID = await client.red.get(key);
		if (!roleID) return false;
		const role = client.resolveRole(guild, roleID);
		if (!role || !role.editable) {
			return false;
		}

		try {
			if (message.member?.roles.resolve(roleID)) {
				return false;
			}
			const key = KEYS.VERIFICATION_BLOCKED(author.id);
			const eligible = await client.red.setnx(key, 1);
			if (!eligible) return false;
			message.member?.roles.add(role);

			const level = await client.red.incr(KEYS.VERIFICATION_LEVEL(author.id));
			client.red.expire(key, BACK_OFF_SEC(level));
			return true;
		} catch {
			return false;
		}
	}
}
