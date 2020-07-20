import { Command } from '../structures/Command';
import CommandHandler from '../handlers/CommandHandler';
import { Message, TextChannel, Role } from 'discord.js';
import { MESSAGES, COLORS, CONFIRMATION_TIMEOUT } from '../util/constants';
import { Embed } from '../util/Embed';
import { Predicate, b64Encode } from '../util';
import * as Lexure from 'lexure';
import { CerberusClient } from '../structures/Client';
import { SetupState } from '../structures/SetupState';

const { COMMANDS: { VERIFICATION } } = MESSAGES;

interface SetupData {
	role?: Role;
	channel?: TextChannel;
	phrase?: string;
}

class StateBuilder {
	public readonly client: CerberusClient;
	public readonly data: SetupData = {};
	public state = new SetupState();
	public identityFilter = (id: string) => (message: Message) => message.author.id === id;

	public reply: Message|null = null;

	public constructor(client: CerberusClient) {
		this.client = client;
	}

	public save() {
		if (!this.reply || !this.reply.guild) return;
		const { guild } = this.reply;
		const { role, channel, phrase } = this.data;
		if (!role || !channel || !phrase) return;
		const key = `guild:${guild.id}:channel:${channel.id}:phrase:${b64Encode(phrase)}`;
		this.client.red.sadd(`guild:${guild.id}:prunechannels`, channel.id);
		this.client.red.set(key, role.id);
	}

	public async instruction(message: Message, fail = false): Promise<void> {
		const branch = fail ? 'FAIL' : 'SUCCESS';
		const embed = this.getEmbed();

		if (this.state.isAborted) {
			embed.setColor(COLORS.FAIL)
				.setTitle(VERIFICATION.TITLE.SUCCESS.ABORTED);
		} else if (this.state.isFinished) {
			embed.setColor(COLORS.DEFAULT)
				.setTitle(VERIFICATION.TITLE.FINISHED)
				.setDescription(VERIFICATION.DESCRIPTION.FINISHED)
				.setFooter(VERIFICATION.FOOTER.BACKOFF, this.client.user?.displayAvatarURL());
		} else {
			const missing = this.state.missing(SetupState.COMPLETE);
			const title = VERIFICATION.TITLE[branch][missing[0]];
			const desc = VERIFICATION.DESCRIPTION[branch][missing[0]];
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
			if (role && role.editable) {
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
					.setTitle(VERIFICATION.TITLE.DONE)
					.setDescription(VERIFICATION.DESCRIPTION.DONE)
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

	public getEmbed() {
		const embed = new Embed();

		if (!this.state.isAborted && !this.state.isFinished) {
			embed.setFooter(VERIFICATION.FOOTER.CANCEL(CONFIRMATION_TIMEOUT),
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
}

export default class extends Command {
	public constructor(handler: CommandHandler) {
		super('setuprole', handler, {
			aliases: ['rolesetup', 'roleassign'],
			description: {
				content: 'Prompt the verification setup. Skips steps depending on flag usage. If you wish to delete one or multiple role setups use the `--delete` flag along with other flags to determine effect range.',
				usage: '[--role=<role>] [--channel=<channel>] [--phrase=<phrase>]',
				flags: {
					'`-r`, `--role`': 'directly provide a role ',
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
		const overrideRoles = await this.handler.overrideRoles(guild);
		const override = member?.roles.cache.some(r => overrideRoles.includes(r.id));

		if (!override && !member!.hasPermission(this.userPermissions)) {
			return;
		}
		const builder = new StateBuilder(client);
		try {
			await builder
				.applyFlags(message, args)
				.instruction(message);
		} catch (e) {
			builder.state.add('ABORTED');
			builder.instruction(message);
		}
	}
}
