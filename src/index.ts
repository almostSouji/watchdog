import { config } from 'dotenv';
import { resolve } from 'path';
import { CerberusClient } from './structures/Client';

config({ path: resolve(__dirname, '../.env') });

async function init() {
	const client = new CerberusClient({
		prefix: process.env.PREFIX!
	}, {
		partials: ['MESSAGE']
	});

	await client.commands.read(resolve(__dirname, './commands'));
	await client.events.read(resolve(__dirname, './events'));

	client.login(process.env.TOKEN);
}

init();
