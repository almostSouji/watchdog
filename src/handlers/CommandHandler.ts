import { Command } from '../structures/Command';
import { join } from 'path';
import { readdirSync } from 'fs';
import * as Lexure from 'lexure';
import { CerberusClient } from '../structures/Client';
import { Message, User, Guild, TextChannel } from 'discord.js';
import * as chalk from 'chalk';
import { EventEmitter } from 'events';

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
			const mod = await import(join(__dirname, '../commands', file));
			const cmdClass = Object.values(mod).find((d: any) => d.prototype instanceof Command) as any;
			const cmd = new cmdClass(this);

			this.commands.set(cmd.id, cmd);
			this.client.logger.info(`command ${cmd.id} loaded [${chalk.green('✓')}]`);
		}
		return this.commands.size;
	}

	public resolve(query: string): Command | undefined {
		for (const [k, v] of this.commands) {
			if (k === query || v.aliases?.includes(query)) {
				return v;
			}
		}
		return undefined;
	}

	public async prefix(message: Message): Promise<string> {
		if (message.guild) {
			const gp = await this.client.red.hget(`guild:${message.guild.id}:settings`, 'prefix');
			return gp ?? await this.client.red.hget('global:settings', 'prefix') ?? this.client.config.prefix;
		}
		return await this.client.red.hget('global:settings', 'prefix') ?? this.client.config.prefix;
	}

	public async isOwner(user: User): Promise<boolean> {
		return Boolean(await this.client.red.sismember('bot:owners', user.id));
	}

	public async overrideRoles(guild: Guild): Promise<string[]> {
		const res = await this.client.red.smembers(`guild:${guild.id}:overrideroles`);
		return res;
	}

	public async handle(message: Message): Promise<Message|void> {
		const { content, guild, author: { tag }, channel } = message;
		const lexer = new Lexure.Lexer(content)
			.setQuotes([
				['"', '"'],
				['“', '”']
			]);
		const tokens = lexer.lex();
		const prefix = await this.prefix(message);

		const commandPart = Lexure.extractCommand(s => s.startsWith(prefix) ? prefix.length : null, tokens);
		if (!commandPart) return;

		const command = this.resolve(commandPart.value);
		if (!command) return;
		if (command.ownerOnly && !(await this.isOwner(message.author))) {
			this.emit('blocked', 'ownerOnly', command, message);
			return;
		}
		if (command.guildOnly && !guild) {
			this.emit('blocked', 'guildOnly', command, message);
			return;
		}
		if (channel instanceof TextChannel && !channel.permissionsFor(this.client.user!)?.has(['VIEW_CHANNEL', 'SEND_MESSAGES'])) {
			this.emit('blocked', 'answerImpossible', command, message);
			return;
		}

		const parser = new Lexure.Parser(tokens)
			.setUnorderedStrategy(Lexure.longShortStrategy());

		const res = parser.parse();
		const args = new Lexure.Args(res);

		this.client.logger.info(`command ${command.id} executed by ${tag}`);
		return command.execute(message, args);
	}
}
