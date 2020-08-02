import { Command } from '../structures/Command';
import CommandHandler from '../handlers/CommandHandler';
import { Message, TextChannel, Role } from 'discord.js';
import { MESSAGES, COLORS, CONFIRMATION_TIMEOUT, SETUP_ROLE_PATTERN } from '../util/constants';
import { KEYS } from '../util/keys';
import { Embed } from '../util/Embed';
import { Predicate, b64Encode, b64Decode } from '../util';
import * as Lexure from 'lexure';
import { CerberusClient } from '../structures/Client';
import { SetupState } from '../structures/SetupState';

const { COMMANDS: { SETUP_ROLE } } = MESSAGES;

interface SetupData {
	role?: Role;
	channel?: TextChannel;
	phrase?: string;
}

class StateBuilder {
	public readonly client: CerberusClient;
	public readonly data: SetupData = {};
	public autoPrune = false;
	public state = new SetupState();
	public identityFilter = (id: string) => (message: Message) => message.author.id === id;

	public reply: Message|null = null;

	public constructor(client: CerberusClient) {
		this.client = client;
	}

	public getPattern(): string {
		let pattern = '';
		pattern += this.data.channel ? KEYS.ROLE_PHRASE_PATTERN_CHANNEL(this.data.channel.id) : KEYS.ROLE_PHRASE_PATTERN_CHANNEL_ALL;
		pattern += this.data.phrase ? KEYS.ROLE_PHRASE_PATTERN_PHRASE(b64Encode(this.data.phrase)) : KEYS.ROLE_PHRASE_PATTERN_PHRASE_ALL;
		return pattern;
	}

	public save() {
		if (!this.reply || !this.reply.guild) return;
		const { role, channel, phrase } = this.data;
		if (!role || !channel || !phrase) return;
		const key = KEYS.ROLE_PHRASE(channel.id, b64Encode(phrase));
		if (this.autoPrune) {
			this.client.red.sadd(KEYS.PRUNE_CHANNELS, channel.id);
		}
		this.client.red.set(key, role.id);
	}

	public async instruction(message: Message, fail = false): Promise<void> {
		const branch = fail ? 'FAIL' : 'SUCCESS';
		const embed = this.getEmbed();

		if (this.state.isAborted) {
			embed.setColor(COLORS.FAIL)
				.setTitle(SETUP_ROLE.TITLE.SUCCESS.ABORTED);
		} else if (this.state.isFinished) {
			embed.setColor(COLORS.DEFAULT)
				.setTitle(SETUP_ROLE.TITLE.FINISHED)
				.setDescription(this.autoPrune ? SETUP_ROLE.DESCRIPTION.FINISHED_PRUNE : SETUP_ROLE.DESCRIPTION.FINISHED_NO_PRUNE)
				.setFooter(SETUP_ROLE.FOOTER.BACKOFF, this.client.user?.displayAvatarURL());
		} else {
			const missing = this.state.missing(SetupState.COMPLETE);
			const title = SETUP_ROLE.TITLE[branch][missing[0]];
			const desc = SETUP_ROLE.DESCRIPTION[branch][missing[0]];
			embed.setTitle(title)
				.setDescription(desc);
			if (fail) {
				embed.setColor(COLORS.FAIL);
			}
		}

		if (this.reply) {
			await this.reply.edit(embed);
		} else {
			this.reply = await message.channel.send(embed);
		}

		await this.handleAnswer(message);
	}

	public async handleAnswer(message: Message): Promise<void> {
		if (this.state.isAborted) return;

		const missing = this.state.missing(SetupState.COMPLETE);
		const answer = await this.awaitAnswer(message, this.identityFilter(message.author.id));

		if (answer?.toLowerCase() === 'cancel' || this.state.isAborted) {
			this.state.add('ABORTED');
			await this.instruction(message, true);
			return;
		}

		if (missing.includes('ROLE')) {
			const role = this.client.resolveRole(message.guild!, answer);
			if (role && role.editable && role.position < (message.member?.roles.highest.position ?? 0)) {
				this.data.role = role;
				this.state.add('ROLE');
				await this.instruction(message);
				return;
			}
			await this.instruction(message, true);
			return;
		}

		if (missing.includes('CHANNEL')) {
			const channel = this.client.resolveChannel(message.guild!, ['text'], answer);
			if (channel && channel.permissionsFor(this.client.user!)?.has('VIEW_CHANNEL')) {
				this.data.channel = channel as TextChannel;
				this.state.add('CHANNEL');
				await this.instruction(message);
				return;
			}
			await this.instruction(message, true);
			return;
		}

		if (missing.includes('PHRASE')) {
			if (answer) {
				this.data.phrase = answer;
				this.state.add('PHRASE');
				await this.instruction(message);
				return;
			}
			await this.instruction(message, true);
			return;
		}

		if (this.state.isFinished) {
			if (['y', 'yes'].includes(answer.toLowerCase())) {
				this.save();
				const embed = this.getEmbed()
					.setTitle(SETUP_ROLE.TITLE.DONE)
					.setDescription(SETUP_ROLE.DESCRIPTION.DONE)
					.setColor(COLORS.SUCCESS);
				await this.reply?.edit(embed);
				return;
			}
			this.state.add('ABORTED');
		}

		await this.instruction(message);
	}

	public async awaitAnswer(message: Message, filter: Predicate<Message>): Promise<string> {
		return message.channel.awaitMessages(filter, { max: 1, time: CONFIRMATION_TIMEOUT, errors: ['time'] }).then(coll => coll.first()?.content ?? 'no');
	}

	public applyFlags(message: Message, args: Lexure.Args): StateBuilder {
		const role = message.client.resolveRole(message.guild!, args.option('role', 'r') ?? undefined);
		const channel = message.client.resolveChannel(message.guild!, ['text'], args.option('channel', 'c') ?? undefined);
		const phrase = args.option('phrase', 'p') ?? undefined;
		const autoPrune = args.flag('autoprune', 'a');

		if (autoPrune) {
			this.autoPrune = true;
		}

		if (role) {
			this.data.role = role;
			this.state.add('ROLE');
		}
		if (channel) {
			this.data.channel = channel as TextChannel;
			this.state.add('CHANNEL');
		}
		if (phrase) {
			this.data.phrase = phrase;
			this.state.add('PHRASE');
		}
		return this;
	}

	public applyDeleteFlags(message: Message, args: Lexure.Args): StateBuilder {
		const channel = message.client.resolveChannel(message.guild!, ['text'], args.option('channel', 'c') ?? undefined);
		const phrase = args.option('phrase', 'p') ?? undefined;

		if (channel) {
			this.data.channel = channel as TextChannel;
			this.state.add('CHANNEL');
		}
		if (phrase) {
			this.data.phrase = phrase;
			this.state.add('PHRASE');
		}
		return this;
	}

	public getEmbed() {
		const embed = new Embed();

		if (!this.state.isAborted && !this.state.isFinished) {
			embed.setFooter(SETUP_ROLE.FOOTER.CANCEL(CONFIRMATION_TIMEOUT),
				this.client.user!.displayAvatarURL());
		}

		const states = [];
		if (this.state.has('ROLE')) {
			states.push(`• Role: ${this.data.role}`);
		}
		if (this.state.has('CHANNEL')) {
			states.push(`• Channel: ${this.data.channel}`);
		}
		if (this.state.has('PHRASE')) {
			states.push(`• Phrase: ${this.data.phrase}`);
		}
		if (states.length) {
			embed.spliceFields(0, 1, {
				name: `Selected ${states.length}/3`,
				value: states.join('\n')
			});
		}

		return embed;
	}

	public getDeleteEmbed() {
		const embed = new Embed()
			.setDescription(SETUP_ROLE.DELETE.ASK_CONFIRMATION)
			.setFooter(SETUP_ROLE.DELETE.FOOTER, this.client.user?.displayAvatarURL());

		const states = [];
		if (this.state.has('CHANNEL')) {
			states.push(`• Channel: ${this.data.channel}`);
		}
		if (this.state.has('PHRASE')) {
			states.push(`• Phrase: ${this.data.phrase}`);
		}
		if (states.length) {
			embed.spliceFields(0, 1, {
				name: `Accepted settings:`,
				value: states.join('\n')
			});
		}

		return embed;
	}
}

export default class extends Command {
	public constructor(handler: CommandHandler) {
		super('setuprole', handler, {
			aliases: ['rolesetup', 'roleassign'],
			description: {
				content: 'Prompt the verification setup. Skips steps depending on flag usage. If you wish to delete one or multiple role setups use the `--delete` flag along with other flags to determine effect range.',
				usage: '[--role=<role>] [--autoprune] [--delete] [--channel=<channel>] [--phrase=<phrase>]',
				flags: {
					'`-r`, `--role`': 'directly provide a role (not available with `--delete`)',
					'`-a`, `--autoprune`': 'set up auto prune for the target channel  (not available with `--delete`)',
					'`-c`, `--channel`': 'directly provide a channel',
					'`-p`, `--phrase`': 'directly provide a phrase',
					'`-d`, `--delete`': 'delete based on the given other flags'
				}
			},
			userPermissions: ['MANAGE_GUILD'],
			clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
			guildOnly: true
		});
	}

	public async execute(message: Message, args: Lexure.Args): Promise<Message|void> {
		const { client } = this.handler;
		const { guild, member } = message;
		if (!guild) return;
		const overrideRoles = await this.handler.overrideRoles();
		const override = member?.roles.cache.some(r => overrideRoles.includes(r.id));

		if (!override && !member!.permissions.has(this.userPermissions)) {
			return;
		}

		if (args.flag('delete', 'd')) {
			const builder = new StateBuilder(client).applyDeleteFlags(message, args);
			const pattern = builder.getPattern();
			const keys = await client._scan(pattern);
			const keytexts = [];

			for (const key of keys) {
				const reg = new RegExp(SETUP_ROLE_PATTERN);
				const res = reg.exec(key)!;
				const role = await client.red.get(key);
				keytexts.push(`• Channel: <#${res[1]}> Role: <@&${role}> Phrase: ${b64Decode(res[2])}`);
			}
			const embed = builder.getDeleteEmbed();
			try {
				if (!keys.length) throw new Error('no keys');
				embed.addField('Affected Setups:', keytexts.join('\n'))
					.shorten();

				builder.reply = await message.channel.send(embed);

				const answer = await builder.awaitAnswer(message, builder.identityFilter(message.author.id));
				if (['y', 'yes'].includes(answer.toLowerCase())) {
					embed.setColor(COLORS.SUCCESS)
						.setTitle(SETUP_ROLE.DELETE.DONE)
						.setDescription('');
					client._pruneKeys(keys);
					builder.reply.edit(embed);
				} else {
					throw new Error('negative input');
				}
			} catch (err) {
				embed.setColor(COLORS.FAIL)
					.setTitle(err.message === 'no keys' ? SETUP_ROLE.DELETE.NO_KEYS : SETUP_ROLE.DELETE.CANCEL)
					.setDescription('');
				if (builder.reply) {
					builder.reply.edit(embed);
				} else {
					message.channel.send(embed);
				}
			}
		} else {
			const builder = new StateBuilder(client).applyFlags(message, args);
			try {
				await builder
					.instruction(message);
			} catch {
				builder.state.add('ABORTED');
				builder.instruction(message);
			}
		}
	}
}
