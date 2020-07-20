import { BitField } from 'discord.js';

export type SetupStateString =
	| 'ROLE'
	| 'CHANNEL'
	| 'PHRASE'
	| 'ABORTED';

export class SetupState extends BitField<SetupStateString> {
	public static FLAGS = {
		ROLE: 1 << 0,
		CHANNEL: 1 << 1,
		PHRASE: 1 << 2,
		ABORTED: 1 << 3
	};

	public static COMPLETE =
	SetupState.FLAGS.ROLE |
	SetupState.FLAGS.CHANNEL |
	SetupState.FLAGS.PHRASE;

	public get isFinished() {
		return !Boolean(this.missing(SetupState.COMPLETE).length);
	}

	public get isAborted() {
		return this.has('ABORTED');
	}
}
