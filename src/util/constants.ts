export const EMBED_LIMITS = {
	TITLE: 256,
	DESCRIPTION: 2048,
	FOOTER: 2048,
	AUTHOR: 256,
	FIELDS: 25,
	FIELD_NAME: 256,
	FIELD_VALUE: 1024
};

export const REDIS = {
	GUILD_PATTERN: (guild: string) => `*guild:${guild}*`,
	RESOURCE_PATTERN: (message: string) => `*resource:${message}*`
};

export const CHANNELS_PATTERN = /<?#?(\d{17,19})>?/g;
export const ROLES_PATTERN = /<?@?&?(\d{17,19})>?/g;
export const SNOWFLAKE_PATTERN = /\d{17, 19}/g;

export const EMBED_DEFAULT_COLOR = 3092790;

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
		}
	}
};
