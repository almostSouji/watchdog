import { Command } from '../structures/Command';
import { join } from 'path';
import { readdirSync } from 'fs';
import * as Lexure from 'lexure';
import { CerberusClient } from '../structures/Client';
import { Message, User, TextChannel, Permissions } from 'discord.js';
import * as chalk from 'chalk';
import { EventEmitter } from 'events';
import { KEYS } from '../util/keys';

export default class CommandHandler extends EventEmitter {
	private readonly commands = new Map<string, Command>();
	public readonly client: CerberusClient;

	public constructor(client: CerberusClient) {
		super();
		this.client = client;
	}

	public async read(folder: string): Promise<number> {
		const commandFiles = readdirSync(join(folder))
			.filter(file => ['.js', '.ts'].some((ending: string) => file.endsWith(ending)));

		for (const file of commandFiles) {
			const mod = await import(join(folder, file));
			const cmdClass = Object.values(mod).find((d: any) => d.prototype instanceof Command) as any;
			const cmd = new cmdClass(this);

			this.commands.set(cmd.id, cmd);
			this.client.logger.info(`command: ${cmd.id} ${chalk.green('✓')}`);
		}
		return this.commands.size;
	}

	public resolve(query?: string): Command | undefined {
		if (!query) return undefined;
		for (const [k, v] of this.commands) {
			if (k === query || v.aliases?.includes(query)) {
				return v;
			}
		}
		return undefined;
	}

	public async prefix(): Promise<string> {
		return await this.client.red.hget(KEYS.SETTINGS, 'prefix') ?? this.client.config.prefix;
	}

	public async isOwner(user: User): Promise<boolean> {
		return Boolean(await this.client.red.sismember(KEYS.OWNERS, user.id));
	}

	public async overrideRoles(): Promise<string[]> {
		const res = await this.client.red.smembers(KEYS.STAFF_ROLES);
		return res;
	}

	public async handle(message: Message): Promise<Message|void> {
		const { content, guild, author: { tag }, channel } = message;
		const lexer = new Lexure.Lexer(content)
			.setQuotes([
				['"', '"'],
				['“', '”']
			]);

		const prefix = await this.prefix();
		const r = lexer.lexCommand(s => s.startsWith(prefix) ? prefix.length : null);
		if (!r) return;
		const command = this.resolve(r[0].value);

		if (command && command.ownerOnly && !(await this.isOwner(message.author))) {
			this.emit('blocked', 'ownerOnly', command, message);
			return;
		}

		let block = false;

		if (guild) {
			const shouldPrune = await this.client.red.sismember(KEYS.PRUNE_CHANNELS, channel.id);
			if (shouldPrune) {
				block = true;
				if (message.deletable) {
					message.delete();
				}
			}
		}

		if (!command) {
			this.emit('noCommand', message);
			return;
		}

		if (command.dmOnly && guild) {
			this.emit('blocked', 'dmOnly', command, message);
			return;
		}

		if (block || (command.guildOnly && !guild)) {
			this.emit('blocked', 'guildOnly', command, message);
			return;
		}
		const permissions = new Permissions(['VIEW_CHANNEL', 'SEND_MESSAGES']);
		if (command.clientPermissions) {
			permissions.add(command.clientPermissions);
		}
		if (channel instanceof TextChannel && !channel.permissionsFor(this.client.user!)?.has(permissions)) {
			this.emit('blocked', 'clientPermissions', command, message);
			return;
		}

		const parser = new Lexure.Parser(r[1]())
			.setUnorderedStrategy(Lexure.longShortStrategy());

		const res = parser.parse();
		const args = new Lexure.Args(res);

		this.client.logger.info(`command: ${command.id} by ${tag}`);
		return command.execute(message, args);
	}
}
