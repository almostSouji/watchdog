import { Command } from '../structures/Command';
import { join } from 'path';
import { readdirSync } from 'fs';
import * as Lexure from 'lexure';
import { CerberusClient } from '../structures/Client';
import { Message } from 'discord.js';
import * as chalk from 'chalk';

export default class CommandHandler {
	private readonly commands = new Map<string, Command>();
	public readonly client: CerberusClient;

	public constructor(client: CerberusClient) {
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

	public async handle(message: Message): Promise<boolean> {
		const { content, guild, author: { tag } } = message;
		if (!guild) return false;
		const lexer = new Lexure.Lexer(content)
			.setQuotes([
				['"', '"'],
				['“', '”']
			]);
		const tokens = lexer.lex();
		const prefix = await this.client.prefix(message);

		const commandPart = Lexure.extractCommand(s => s.startsWith(prefix) ? prefix.length : null, tokens);
		if (!commandPart) return false;

		const command = this.resolve(commandPart.value);
		if (!command) return false;
		if (command.ownerOnly && !this.client.isOwner(message.author.id)) return false;

		const parser = new Lexure.Parser(tokens)
			.setUnorderedStrategy(Lexure.longShortStrategy());

		const res = parser.parse();
		const args = new Lexure.Args(res);

		this.client.logger.info(`command ${command.id} executed by ${tag}`);
		return command.execute(message, args);
	}
}
