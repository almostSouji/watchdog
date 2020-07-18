
import { Client, ClientOptions, Guild, GuildChannel, Role, RoleResolvable, GuildChannelResolvable, BaseManager } from 'discord.js';
import CommandHandler from '../handlers/CommandHandler';
import { logger } from '../util/logger';
import * as Redis from 'ioredis';
import { Logger } from 'winston';
import EventHandler from '../handlers/EventHandler';
import { CHANNELS_PATTERN, ROLES_PATTERN } from '../util/constants';

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

	private resolveFromManager<T extends GuildChannel | Role, S extends GuildChannelResolvable | RoleResolvable>(query: string, reg: RegExp, manager: BaseManager<string, T, S>, predicate?: (p1: T) => boolean): T | undefined {
		reg = new RegExp(reg);
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

	public _scan(pattern: string): Promise<string[]> {
		return new Promise((resolve, reject) => {
			const keys: string[] = [];
			const stream = this.red.scanStream({
				match: pattern
			});
			stream.on('data', resultKeys => {
				for (const key of resultKeys) {
					keys.push(key);
				}
			});
			stream.once('end', () => {
				resolve(keys);
			});
			stream.once('error', reject);
		});
	}

	public async _cleanup(patterns: string[]): Promise<void> {
		const keys = [];
		for (const pattern of patterns) {
			keys.push(...(await this._scan(pattern)));
		}
		this._pruneKeys(keys, `patterns: ${patterns.join(', ')}`);
	}

	public async _pruneKeys(keys: string[], scope?: string) {
		if (keys.length) {
			this.red.del(keys);
			this.logger.log('cleanup', `${scope} ▶️ ${keys.join(', ')}`);
		}
	}
}
