import EventHandler from '../handlers/EventHandler';
import { Event } from '../structures/Event';
import { Message } from 'discord.js';

const keys = [`verification:role`, 'verification:phrase', 'verification:channel'];

export default class ReadyEvent extends Event {
	public constructor(handler: EventHandler) {
		super(handler, {
			emitter: 'command',
			name: 'noCommand'
		});
	}

	private backoff(n: number): number {
		const days = (2 ** n) / 2;
		const ms = days * 24 * 60 * 60 * 1000;
		return ms;
	}

	public async execute(message: Message): Promise<boolean> {
		const { client } = this.handler;
		if (!message.guild) return false;

		const res = await client.red.hgetall(`guild:${message.guild.id}:settings`);

		if (keys.some(key => !res[key])) {
			console.log(keys);
			console.log(res);
			console.log(0.0);
			return false;
		}
		const channel = client.resolveChannel(res['verification:channel'], message.guild, ['text']);
		const role = client.resolveRole(res['verification:role'], message.guild);
		const phrase = res['verification:phrase'];
		if (!channel || !role || !phrase) {
			const keyBase = `guild:${message.guild.id}:settings`;
			client.red.hdel(keyBase, keys);
			return false;
		}
		if (channel.id !== message.channel.id || !role.editable) {
			return false;
		}

		if (message.deletable) {
			message.delete();
		}

		try {
			const blocked = await client.red.get(`guild:${message.guild.id}:verification:blocked:${message.author.id}`);
			if (blocked) return false;
			message.member?.roles.add(role);
			const level = await client.red.get(`guild:${message.guild.id}:verification:level:${message.author.id}`);
			const wait = this.backoff(level ? parseInt(level, 10) : 0);
			client.red.incr(`guild:${message.guild.id}:verification:level:${message.author.id}`);
			client.red.set(`guild:${message.guild.id}:verification:blocked:${message.author.id}`, 1, 'PX', wait);
		} catch {
			return false;
		}

		return true;
	}
}


// guild:id:verification:blocked:userid
// guild:id:verification:level:userid
