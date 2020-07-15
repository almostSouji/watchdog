
import { Client, ClientOptions, Guild, GuildChannel, Role, Message } from 'discord.js';
import CommandHandler from '../handlers/CommandHandler';
import { logger } from '../utils/logger';
import * as Redis from 'ioredis';

interface CerberusConfig {
	owner: string[];
	prefix: string;
}

type GuildChannelType = 'text' | 'news' | 'voice' | 'category' | 'store';

export class CerberusClient extends Client {
	public readonly commands: CommandHandler;
	public readonly config: CerberusConfig;
	public readonly channelPattern= /<?#?(\d{17,19})>?/;
	public readonly logger = logger;
	public readonly red: Redis.Redis = new Redis(6379, 'redis');
	public constructor(config: CerberusConfig, clientOptions: ClientOptions = {}) {
		super(clientOptions);
		this.commands = new CommandHandler(this);
		this.config = config;
	}

	public async prefix(message: Message): Promise<string> {
		if (message.guild) {
			const gp = await this.red.get(`${message.guild.id}:prefix`);
			return gp ?? await this.red.get(`global:prefix`) ?? this.config.prefix;
		}
		return await this.red.get(`global:prefix`) ?? this.config.prefix;
	}

	public isOwner(user_id: string): boolean {
		return this.config.owner.includes(user_id);
	}

	private checkChannel(channel: GuildChannel, types: GuildChannelType[]): boolean {
		return types.includes(channel.type);
	}

	public resolveChannel(query: string, guild: Guild, types: GuildChannelType[]): GuildChannel | undefined {
		const regMatch = this.channelPattern.exec(query);
		if (regMatch) {
			query = regMatch[1];
			const channel = guild.channels.resolve(query);
			if (channel && this.checkChannel(channel, types)) {
				return channel;
			}
		}

		query = query.toLowerCase();
		const base = guild.channels.cache.filter(c => this.checkChannel(c, types));
		for (const channel of base.values()) {
			const name = channel.name.toLowerCase();
			if (name === query) return channel;
			if (name.startsWith(query)) return channel;
			if (name.includes(query)) return channel;
		}
		return undefined;
	}

	public resolveRole(query: string, guild: Guild): Role | undefined {
		for (const role of guild.roles.cache.values()) {
			const name = role.name.toLowerCase();
			if (name === query) return role;
			if (name.startsWith(query)) return role;
			if (name.includes(query)) return role;
		}
		return undefined;
	}
}
