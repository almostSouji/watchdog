
import { Client, ClientOptions, Guild, GuildChannel, Role, Message, MessageMentions, RoleResolvable, GuildChannelResolvable, BaseManager } from 'discord.js';
import CommandHandler from '../handlers/CommandHandler';
import { logger } from '../utils/logger';
import * as Redis from 'ioredis';
import { Logger } from 'winston';
import EventHandler from '../handlers/EventHandler';
const { CHANNELS_PATTERN, ROLES_PATTERN } = MessageMentions;

interface CerberusConfig {
	owner: string[];
	prefix: string;
}

declare module 'discord.js' {
	export interface Client {
		readonly commands: CommandHandler;
		readonly config: CerberusConfig;
		readonly logger: Logger;
		readonly red: Redis.Redis;
		prefix(message: Message): Promise<string>;
	}
}

type GuildChannelType = 'text' | 'news' | 'voice' | 'category' | 'store';

export class CerberusClient extends Client {
	public readonly commands = new CommandHandler(this);
	public readonly events = new EventHandler(this);
	public readonly config: CerberusConfig;
	public readonly logger = logger;
	public readonly red: Redis.Redis = new Redis(6379, 'redis');
	public constructor(config: CerberusConfig, clientOptions: ClientOptions = {}) {
		super(clientOptions);
		this.config = config;
	}

	public async prefix(message: Message): Promise<string> {
		if (message.guild) {
			const gp = await this.red.hget(message.guild.id, 'prefix');
			return gp ?? await this.red.hget('global', 'prefix') ?? this.config.prefix;
		}
		return await this.red.hget('global', 'prefix') ?? this.config.prefix;
	}

	public async isOwner(user_id: string): Promise<boolean> {
		return Boolean(await this.red.sismember('bot:owners', user_id));
	}

	private resolveFromManager<T extends GuildChannel | Role, S extends GuildChannelResolvable | RoleResolvable>(query: string, reg: RegExp, manager: BaseManager<string, T, S>, predicate?: (p1: T) => boolean): T | undefined {
		const match = reg.exec(query);
		if (match) {
			query = match[1];
			const res = manager.resolve(query as S);
			if (!res) return undefined;
			if (predicate && predicate(res)) {
				return res;
			}
			return res;
		}

		query = query.toLowerCase();
		const results = new Array(3);
		const base = predicate ? manager.cache.filter(predicate) : manager.cache;
		for (const element of base.values()) {
			const name = element.name.toLowerCase();
			if (name === query) results[0] = element;
			if (name.startsWith(query)) results[1] = element;
			if (name.includes(query)) results[2] = element;
		}
		return results.filter(e => e)[0];
	}

	public resolveChannel(query: string, guild: Guild, types: GuildChannelType[]): GuildChannel | undefined {
		return this.resolveFromManager(query, CHANNELS_PATTERN, guild.channels, c => types.includes(c.type));
	}

	public resolveRole(query: string, guild: Guild): Role | undefined {
		return this.resolveFromManager(query, ROLES_PATTERN, guild.roles);
	}
}
