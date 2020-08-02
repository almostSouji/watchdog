import { CerberusClient } from '../structures/Client';
import fetch from 'node-fetch';
import { MESSAGES } from '../util/constants';
import { KEYS } from '../util/keys';
import ms from '@naval-base/ms';

const { QUIZ } = MESSAGES;

export default class QuizHandler {
	public readonly client: CerberusClient;
	public interval?: NodeJS.Timer;
	public constructor(client: CerberusClient) {
		this.client = client;
	}

	public async init(): Promise<void> {
		this.doCheck();
		this.interval = this.client.setInterval(this.doCheck.bind(this), 60000);
	}

	public async doCheck(): Promise<void> {
		const tokens = await this.client.red.smembers(KEYS.QUIZ_PENDING);
		const secret = process.env.QUIZ_SECRET;
		const res = await fetch(process.env.QUIZ_POST!, { method: 'POST', body: JSON.stringify({ tokens, secret }) });
		const json = await res.json();
		const { code, passed, failed }: { code: number; passed: string[]; failed: string[] } = json;

		if (code !== 200) return;

		const guild = this.client.guilds.resolve(process.env.QUIZ_GUILD!);
		if (!guild || !guild.available) return;
		const all = passed.concat(failed);
		const handled: string[] = [];

		for (const token of all) {
			const key = KEYS.QUIZ(token);
			const userId = await this.client.red.get(key);
			if (!userId) {
				handled.push(key);
				this.client.red.srem(KEYS.QUIZ_PENDING, token);
				continue;
			}
			try {
				const member = await guild.members.fetch(userId);

				if (!member) {
					handled.push(key);
					this.client.red.srem(KEYS.QUIZ_PENDING, token);
					continue;
				}

				if (passed.includes(token)) {
					handled.push(key);
					this.client.red.srem(KEYS.QUIZ_PENDING, token);
					const role = guild.roles.resolve(process.env.QUIZ_ROLE!);
					if (!role?.editable) {
						continue;
					}
					await member.roles.add(process.env.QUIZ_ROLE!);
					await member.send(QUIZ.SUCCESS(guild.name));
					continue;
				}

				if (failed.includes(token)) {
					handled.push(key);

					const blockKey = KEYS.VERIFICATION_BLOCKED(member.id);
					const ttl = await this.client.red.ttl(blockKey);

					this.client.red.srem(KEYS.QUIZ_PENDING, token);

					if (ttl === -2) {
						await member.send(QUIZ.FAIL.RETRY);
						return;
					}
					if (ttl === -1) {
						await member.send(QUIZ.FAIL.PERMANENT);
						return;
					}

					const formatted = ms(ttl * 1000, true);
					await member.send(QUIZ.FAIL.COOLDOWN(formatted));
					continue;
				}
			} catch {
				continue;
			}
		}

		this.client._pruneKeys(handled);
	}
}
