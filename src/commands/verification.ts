import { Command } from '../structures/Command';
import CommandHandler from '../handlers/CommandHandler';
import { Message, TextChannel, Role, ColorResolvable } from 'discord.js';
import { MESSAGES, COLORS } from '../util/constants';
import { Embed } from '../util/Embed';
import * as Lexure from 'lexure';

const { COMMANDS: { VERIFICATION } } = MESSAGES;

interface SetupState {
	role?: Role;
	channel?: TextChannel;
	phrase?: string;
}


export default class extends Command {
	public constructor(handler: CommandHandler) {
		super('verification', handler, {
			aliases: ['verify'],
			description: {
				content: 'Prompt the verification setup',
				usage: '',
				flags: {
					'`-d`, `--disable`': 'disable role state'
				}
			},
			userPermissions: ['MANAGE_GUILD'],
			clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
			guildOnly: true,
			ownerOnly: true
		});
	}

	private buildStateEmbed(state: SetupState, description: string, title: string, color?: ColorResolvable, final = false): Embed {
		const embed = new Embed()
			.setDescription(description)
			.setTitle(title);
		if (!final) {
			embed.setFooter('You can cancel the process at any time by answering cancel',
				this.handler.client.user!.displayAvatarURL({ size: 128 }));
		}
		if (color) {
			embed.setColor(color);
		}
		const states = [];
		if (state.role) {
			states.push(`•Role: ${state.role}`);
		}
		if (state.channel) {
			states.push(`•Channel: ${state.channel}`);
		}
		if (state.phrase) {
			states.push(`•Phrase: ${state.phrase}`);
		}
		if (states.length) {
			embed.spliceFields(0, 1, {
				name: `Selected ${states.length}/3`,
				value: states.join('\n')
			});
		}
		return embed;
	}

	public async execute(message: Message, args: Lexure.Args): Promise<Message|void> {
		const { client } = this.handler;
		const { guild, member } = message;
		const state: SetupState = {};

		if (!guild) return;
		const filter = (m: Message) => m.author.id === member?.id;
		const embed = this.buildStateEmbed(state, VERIFICATION.INIT, 'Provide a role');

		const reset = args.flag('disable') || args.flag('d');
		if (reset) {
			const embed = this.buildStateEmbed(state, VERIFICATION.CONFIRM_DELETE, 'Disable Verification');
			const msg = await message.channel.send(embed);

			const confirmation = await message.channel.awaitMessages(filter, {
				max: 1
			}).then(collected => collected.first()?.content);
			if (!confirmation) {
				return;
			}
			if (['n', 'no', 'c', 'cancel'].includes(confirmation)) {
				const embed = this.buildStateEmbed(state, VERIFICATION.FAIL.CANCEL_DELETE, 'Disabling process canceled', COLORS.FAIL, true);
				return msg.edit(embed);
			}
			if (['y', 'yes'].includes(confirmation)) {
				const embed = this.buildStateEmbed(state, VERIFICATION.SUCCESS.OK_DELETE, 'Verification process disabled', COLORS.SUCCESS, true);
				const keyBase = `guild:${guild.id}:settings`;
				const keys = [`verification:role`, 'verification:phrase', 'verification:channel'];
				client.red.hdel(keyBase, keys);
				return msg.edit(embed);
			}
		}

		const msg = await message.channel.send(embed);

		while (!state.role) {
			const roleArgs = await message.channel.awaitMessages(filter, {
				max: 1
			}).then(collected => collected.first()?.content);
			if (!roleArgs) {
				const embed = this.buildStateEmbed(state, VERIFICATION.FAIL.NO_ROLE, 'Provide a role', COLORS.FAIL);
				msg.edit(embed);
				continue;
			}
			if (roleArgs.toLowerCase() === 'cancel') {
				const embed = this.buildStateEmbed(state, VERIFICATION.FAIL.INTERRUPT, 'Provide a role', COLORS.FAIL, true);
				return msg.edit(embed);
			}
			const role = client.resolveRole(roleArgs, guild);
			if (!role) {
				const embed = this.buildStateEmbed(state, VERIFICATION.FAIL.ROLE_RESOLVE, 'Provide a role', COLORS.FAIL);
				msg.edit(embed);
				continue;
			}
			state.role = role;
			const embed = this.buildStateEmbed(state, VERIFICATION.SUCCESS.ROLE, 'Provide a channel', COLORS.SUCCESS);
			msg.edit(embed);
		}

		while (!state.channel) {
			const channelArgs = await message.channel.awaitMessages(filter, {
				max: 1
			}).then(collected => collected.first()?.content);
			if (!channelArgs) {
				const embed = this.buildStateEmbed(state, VERIFICATION.FAIL.NO_CHANNEL, 'Provide a channel', COLORS.FAIL);
				msg.edit(embed);
				continue;
			}
			if (channelArgs.toLowerCase() === 'cancel') {
				const embed = this.buildStateEmbed(state, VERIFICATION.FAIL.INTERRUPT, 'Setup process canceled', COLORS.FAIL, true);
				return msg.edit(embed);
			}
			const channel = client.resolveChannel(channelArgs, guild, ['text']);
			if (!channel) {
				const embed = this.buildStateEmbed(state, VERIFICATION.FAIL.CHANNEL_RESOLVE, 'Provide a channel', COLORS.FAIL);
				msg.edit(embed);
				continue;
			}
			state.channel = channel as TextChannel;
			const embed = this.buildStateEmbed(state, VERIFICATION.SUCCESS.CHANNEL, 'Provide a phrase', COLORS.SUCCESS);
			msg.edit(embed);
		}

		while (!state.phrase) {
			const phrase = await message.channel.awaitMessages(filter, {
				max: 1
			}).then(collected => collected.first()?.content);
			if (!phrase) {
				const embed = this.buildStateEmbed(state, VERIFICATION.FAIL.NO_PHRASE, 'Provide a phrase', COLORS.FAIL);
				msg.edit(embed);
				continue;
			}
			if (phrase.toLowerCase() === 'cancel') {
				const embed = this.buildStateEmbed(state, VERIFICATION.FAIL.INTERRUPT, 'Setup process canceled', COLORS.FAIL, true);
				return msg.edit(embed);
			}
			state.phrase = phrase;
			const embed = this.buildStateEmbed(state, VERIFICATION.SUCCESS.PHRASE, 'Confirm setup', COLORS.SUCCESS);
			msg.edit(embed);
		}

		const confirmation = await message.channel.awaitMessages(filter, {
			max: 1
		}).then(collected => collected.first()?.content.toLowerCase());
		if (!confirmation) {
			return;
		}
		if (['n', 'no'].includes(confirmation)) {
			const embed = this.buildStateEmbed(state, VERIFICATION.FAIL.INTERRUPT, 'Setup process canceled', COLORS.FAIL, true);
			return msg.edit(embed);
		}
		if (['y', 'yes', 'c', 'cancel'].includes(confirmation)) {
			const embed = this.buildStateEmbed(state, VERIFICATION.SUCCESS.OK, 'Setup successful', COLORS.SUCCESS, true);
			client.red.hmset(`guild:${guild.id}:settings`, {
				'verification:role': state.role.id,
				'verification:channel': state.channel.id,
				'verification:phrase': state.phrase
			});
			return msg.edit(embed);
		}
	}
}
