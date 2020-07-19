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
			INIT: `This command will lead you through setting up verification roles in this server. You will need to apply the needed overwrites yourself. If verification is already set up this will overwrite the old settings. Which role should I use as verification role?`,
			CONFIRM_DELETE: `Are you sure you want to disable and delete the verification setup on this guild? [**Y**es/**N**o]`,
			FAIL: {
				NO_ROLE: `Please provide a role to use as verification role!`,
				ROLE_RESOLVE: `I could not resolve the given arguments to a role, Please provide a role to use as verification role!`,
				NO_CHANNEL: `Please provide a text channel to use for the verification process!`,
				CHANNEL_RESOLVE: `I could not resolve the given arguments to a channel, Please provide a text channel to use for the verification process!`,
				NO_PHRASE: `Please provide a phrase to use for the verification process!`,
				INTERRUPT: `${PREFIXES.FAIL}Setup canceled.`,
				CANCEL_DELETE: `${PREFIXES.FAIL}Deletion canceled.`
			},
			SUCCESS: {
				ROLE: `${PREFIXES.SUCCESS}Role accepted. Please provide a channel to use for the verification process. Any messages in this channel will be deleted, if a specific phrase is said the member will gain the provided role.`,
				CHANNEL: `${PREFIXES.SUCCESS}Channel accepted. Please provide a phrase to use for the verification process. If this phrase is said in the specified channel the member will gain the provided role.`,
				PHRASE: `${PREFIXES.SUCCESS}Prefix accepted. Make sure everything is set up to your liking. [**Y**es/**N**o]`,
				OK: `${PREFIXES.SUCCESS}Verification process successfully set up! If you want to remove it please use this command again with the \`--disable\` flag.`,
				OK_DELETE: `${PREFIXES.SUCCESS}The verification process is disabled and the saved data deleted.`
			}
		}
	}
};
