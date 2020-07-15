import * as Lexure from 'lexure';
import CommandHandler from '../handlers/CommandHandler';
import { Message } from 'discord.js';

interface CommandOptions {
	aliases?: string[];
	description?: string;
	ownerOnly?: boolean;
}

export abstract class Command {
	public id: string;
	public aliases: string[];
	public ownerOnly: boolean;
	public description: string;
	public handler: CommandHandler;
	public constructor(id: string, handler: CommandHandler, data?: CommandOptions) {
		this.id = id;
		this.aliases = data?.aliases ?? [];
		this.description = data?.description ?? '';
		this.ownerOnly = data?.ownerOnly ?? true;
		this.handler = handler;
	}

	public abstract async execute(message: Message, args: Lexure.Args): Promise<boolean>;
}
