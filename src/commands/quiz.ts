import { Command } from '../structures/Command';
import CommandHandler from '../handlers/CommandHandler';
import { Message } from 'discord.js';
import { MESSAGES, BACK_OFF_SEC } from '../util/constants';
import { uid } from '../util/';
import { KEYS } from '../util/keys';
import ms from '@naval-base/ms';
const { COMMANDS: { QUIZ } } = MESSAGES;


export default class extends Command {
	public constructor(handler: CommandHandler) {
		super('quiz', handler, {
			aliases: ['test'],
			description: {
				content: 'Take the quiz to join support channels [DM ONLY COMMAND]',
				usage: '',
				flags: {}
			},
			dmOnly: true
		});
	}

	public async execute(message: Message): Promise<Message|void> {
		const { client } = this.handler;
		const { guild, author } = message;
		if (guild) return;

		try {
			const targetGuild = client.guilds.resolve(process.env.QUIZ_GUILD!);
			if (!targetGuild || !targetGuild.available) return;
			const role = targetGuild.roles.resolve(process.env.QUIZ_ROLE!);
			if (!role) return;
			const member = await targetGuild.members.fetch(author);
			if (!member) return;

			const msg = await message.author.send(QUIZ.GENERATING);
			const key = KEYS.VERIFICATION_BLOCKED(author.id);
			const ttl = await client.red.pttl(key);

			if (member.roles.cache.has(process.env.QUIZ_ROLE!)) {
				return await msg.edit(QUIZ.FAIL.ALREADY);
			}

			if (ttl === -2) {
				const token = uid();
				const url = process.env.QUIZ_URL!;
				client.red.sadd(KEYS.QUIZ_PENDING, token);
				client.red.set(KEYS.QUIZ(token), author.id);

				const blockKey = KEYS.VERIFICATION_BLOCKED(member.id);
				const level = await client.red.incr(KEYS.VERIFICATION_LEVEL(member.id));
				const ttl = BACK_OFF_SEC(level);

				await client.red.setnx(blockKey, 1);
				client.red.expire(blockKey, ttl);

				return await msg.edit(QUIZ.SUCCESS(token, url));
			}

			if (ttl === -1) {
				return await msg.edit(QUIZ.FAIL.PERMANENT);
			}

			const formatted = ms(ttl, true);
			return await msg.edit(QUIZ.FAIL.COOLDOWN(formatted));
		} catch {}
	}
}
