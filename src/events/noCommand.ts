import EventHandler from '../handlers/EventHandler';
import { Event } from '../structures/Event';
import { Message } from 'discord.js';
import { b64Encode } from '../util';
import { BACK_OFF } from '../util/constants';

export default class ReadyEvent extends Event {
	public constructor(handler: EventHandler) {
		super(handler, {
			emitter: 'command',
			name: 'noCommand'
		});
	}

	private backoff(n: number): number {
		const days = BACK_OFF(n);
		const s = days * 24 * 60 * 60;
		return s;
	}

	public async execute(message: Message): Promise<boolean> {
		const { guild, client, channel, author } = message;
		if (!guild) return false;

		const shouldPrune = await client.red.sismember(`guild:${guild.id}:prunechannels`, channel.id);
		if (shouldPrune && message.deletable) {
			message.delete();
		}

		const key = `guild:${guild.id}:channel:${channel.id}:phrase:${b64Encode(message.content)}`;
		const roleID = await client.red.get(key);
		if (!roleID) return false;
		const role = client.resolveRole(guild, roleID);
		if (!role || !role.editable) {
			return false;
		}

		try {
			const key = `guild:${guild.id}:verification:blocked:${author.id}`;
			const eligible = await client.red.setnx(key, 1);
			if (!eligible) return false;
			message.member?.roles.add(role);

			const level = await client.red.incr(`guild:${guild.id}:verification:level:${author.id}`);
			client.red.expire(key, this.backoff(level));
			return true;
		} catch {
			return false;
		}
	}
}
