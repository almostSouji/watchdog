export const KEYS = {
	VERIFICATION_BLOCKED: (userID: string) => `verification:blocked:${userID}`,
	VERIFICATION_LEVEL: (userID: string) => `verification:level:${userID}`,
	SETTINGS: 'settings',
	OWNERS: 'bot:owners',
	PRUNE_CHANNELS: 'prunechannels',
	RESOURCE: (messageID: string) => `resource:${messageID}`,
	RESOURCES_PER_CHANNEL: (channelID: string) => `channel:${channelID}:resources`,

	ROLE_PHRASE: (channelID: string, phrase: string) => `channel:${channelID}:phrase:${phrase}`,
	ROLE_PHRASE_PATTERN_CHANNEL: (channelID: string) => `channel:${channelID}`,
	ROLE_PHRASE_PATTERN_CHANNEL_ALL: 'channel:*',
	ROLE_PHRASE_PATTERN_PHRASE: (phrase: string) => `:phrase:${phrase}`,
	ROLE_PHRASE_PATTERN_PHRASE_ALL: ':phrase:*',
	STAFF_ROLES: 'staffroles',
	QUIZ: (token: string) => `quiz:token:${token}`,
	QUIZ_PENDING: 'quiz:pending',

	RESOURCE_PATTERN: (messageID: string) => `*resource:${messageID}*`,
	CHANNEL_PATTERN: (channelID: string) => `*channel:${channelID}*`
};
