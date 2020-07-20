export const EMBED_LIMITS = {
	TITLE: 256,
	DESCRIPTION: 2048,
	FOOTER: 2048,
	AUTHOR: 256,
	FIELDS: 25,
	FIELD_NAME: 256,
	FIELD_VALUE: 1024
};

export const CONFIRMATION_TIMEOUT = 30000;
export const BACK_OFF = (level: number) => (2 ** level) / 4;

export const REDIS = {
	GUILD_PATTERN: (guild: string) => `*guild:${guild}*`,
	RESOURCE_PATTERN: (message: string) => `*resource:${message}*`,
	CHANNEL_PATTERN: (channel: string) => `*channel:${channel}*`
};

export const CHANNELS_PATTERN = /<?#?(\d{17,19})>?/g;
export const ROLES_PATTERN = /<?@?&?(\d{17,19})>?/g;
export const SNOWFLAKE_PATTERN = /\d{17, 19}/g;

export const COLORS = {
	SUCCESS: '#03b581',
	FAIL: '#d04949',
	DEFAULT: 3092790
};

export const PREFIXES = {
	FAIL: '',
	ERROR: '',
	SUCCESS: ''
};

export const MESSAGES = {
	COMMANDS: {
		COMMON: {
			FAIL: {
				NO_SUB_COMMAND: (commands: string[]) => `${PREFIXES.FAIL}Please provide a valid sub command out of: \`${commands.join(', ')}\`.`,
				MISSING_ARGUMENT: (arg: string) => `${PREFIXES.FAIL}Missing argument: \`${arg}\`.`,
				USAGE: (usage: string) => `${PREFIXES.FAIL}Command usage: \`${usage}\`.`,
				RESOLVE: (query: string, type: string) => `${PREFIXES.FAIL}I can not resolve \`${query}\` to a \`${type}\`.`
			}
		},
		RESOURCE: {
			FAIL: {
				MISSING_PERMISSIONS_USER: `${PREFIXES.FAIL}You can not manage resources in channels you do not have permissions to manage messages in unless you have a staff role.`,
				MISSING_PERMISSIONS_BOT: `${PREFIXES.FAIL}I can not send resources to this channel.`,
				MISSING_CONTENT: `${PREFIXES.FAIL}You need to provide content for the resource.`,
				NOT_FOUND: `${PREFIXES.FAIL}I can not find the resource you ask me to edit.`
			},
			SUCCESS: {
				SENT: (prefix: string, messageID: string) => `${PREFIXES.SUCCESS}Resource sent. You can use \`${prefix} resource edit ${messageID} <content>\` to edit it.`,
				EDITED: `${PREFIXES.SUCCESS}Resource edited.`
			}
		},
		STAFF: {
			FAIL: {
				ALREADY_STAFF: (role: string) => `${PREFIXES.FAIL}Role \`${role}\` is already a staff role.`,
				NOT_STAFF: (role: string) => `${PREFIXES.FAIL}Role \`${role}\` is not a staff role.`,
				MISSING_PERMISSIONS: `${PREFIXES.FAIL}You need the permission to manage this guild to use this command.`
			},
			SUCCESS: {
				ADDED: (role: string) => `${PREFIXES.SUCCESS}Added \`${role}\` to staff roles.`,
				REMOVED: (role: string) => `${PREFIXES.SUCCESS}Removed \`${role}\` from staff roles.`
			},
			INFO: {
				LIST: (roles: string[]) => `${PREFIXES.SUCCESS}The current staff roles are: ${roles.map(r => `\`${r}\``).join(', ')}.`,
				NO_STAFF: `${PREFIXES.SUCCESS}There are currently no staff roles.`
			}
		},
		VERIFICATION: {
			TITLE: {
				FINISHED: 'Make sure the settings are to your liking.',
				DONE: `${PREFIXES.SUCCESS}Confirmation role saved.`,
				FAIL: {
					ROLE: 'Please provide a role.',
					CHANNEL: 'Please provide a channel',
					PHRASE: 'Please provide a phrase',
					ABORTED: 'Setup cancelled'
				},
				SUCCESS: {
					ROLE: `Please provide a role`,
					CHANNEL: `Please provide a channel`,
					PHRASE: `Please provide a phrase`,
					ABORTED: `Setup cancelled`
				}
			},
			DESCRIPTION: {
				FINISHED: 'Messages in the provided channel will now be deleted if I have the permission to do so. If the user says the given phrase they will gain the associated role if i am able to assign it and they are not in a back-off period. Is this setup ok? [**Y**es | **N**o]',
				DONE: 'To remove this role setup please run the command with the `--delete` flag. The range of effect depends on the provided options.',
				FAIL: {
					ROLE: `${PREFIXES.FAIL}Invalid role. The role you choose has to be below the bots highest role.`,
					CHANNEL: `${PREFIXES.FAIL}Invalid channel. Remember that i need to read messages too.`,
					PHRASE: `${PREFIXES.FAIL}Please provide a non-empty phrase`,
					ABORTED: `${PREFIXES.FAIL}Failed abort...`
				},
				SUCCESS: {
					ROLE: 'This role will be assigned to users if they say the phrase in the provided channel.',
					CHANNEL: 'The channel to use for this assignable role setup.',
					PHRASE: 'Phrase users need to say in order to gain the role.',
					ABORTED: 'Aborted..'
				}

			},
			FOOTER: {
				CANCEL: (timeoutMS: number) => `You can cancel the process at any time by answering "cancel". Timeout after ${timeoutMS / 1000}s.`,
				BACKOFF: 'To view a users back-off they can use the "cooldown" command.'
			}
		}
	}
};
