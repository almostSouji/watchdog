import { config } from 'dotenv';
import { resolve } from 'path';
import { CerberusClient } from './structures/Client';

config({ path: resolve(__dirname, '../.env') });

async function init() {
	const client = new CerberusClient({
		owner: process.env.OWNER!.split(','),
		prefix: process.env.PREFIX!
	});
	await client.commands.read(resolve(__dirname, './commands'));

	client.on('message', async message => {
		console.log(`${message.author.username}#${message.author.discriminator} | ${message.content}`);
		await client.commands.handle(message);
	});

	client.on('ready', () => {
		client.logger.info(`Client ready on ${client.user!.tag} (${client.user!.id})`);
	});

	client.login(process.env.TOKEN);
}

init();
