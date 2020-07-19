import { CerberusClient } from '../structures/Client';
import { readdirSync } from 'fs';
import { join } from 'path';
import * as chalk from 'chalk';
import { EventEmitter } from 'events';
import { Event } from '../structures/Event';

export default class EventHandler {
	private readonly events = new Map<string, Event>();
	public readonly client: CerberusClient;
	public readonly emitters = new Map<string, EventEmitter>();

	public constructor(client: CerberusClient) {
		this.client = client;
		this.emitters.set('client', client);
		this.emitters.set('command', client.commands);
	}

	public async read(folder: string): Promise<number> {
		const eventFiles = readdirSync(join(folder))
			.filter(file => ['.js', '.ts'].some((ending: string) => file.endsWith(ending)));

		for (const file of eventFiles) {
			const mod = await import(join(__dirname, '../events', file));
			const eventClass = Object.values(mod).find((d: any) => d.prototype instanceof Event) as any;
			const event = new eventClass(this);
			const emitter = this.emitters.get(event.emitter);

			if (!emitter) {
				this.client.logger.error(`Missing emitter for ${event.emitter}`);
				return this.events.size;
			}

			this.events.set(event.name, event.execute.bind(event));
			emitter.on(event.name, event.execute.bind(event));
			this.client.logger.info(`event ${event.name} attached to emitter ${emitter.constructor.name} [${chalk.green('✓')}]`);
		}
		return this.events.size;
	}
}
