/**
 * Shorten text with ellipsis (returns input if short enough)
 * @param {string} text Text to shorten
 * @param {number} length Length to shorten to (without ellipsis)
 * @returns {string} Shortened text
 */
function ellipsis(text: string, length: number): string {
	if (text.length > length) {
		return `${text.slice(0, length - 3)}...`;
	}
	return text;
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa
 * @param {string} str String to base64 encode
 * @returns {string}
 */
function b64Encode(str: string): string { return Buffer.from(str, 'binary').toString('base64'); }

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/atob
 * @param {string} b64Str String to base64 decode
 * @returns {string}
 */
function b64Decode(b64Str: string): string { return Buffer.from(b64Str, `base64`).toString(`binary`); }


export type Predicate<T> = (p1: T) => boolean;

/**
 * Combine multiple predicates into one
 * @param {...Predicate|Array<Predicate>} predicates Predicates to combine
 * @returns {Predicate}
 */
function andP <T>(...predicates: Predicate<T>[]): Predicate<T> {
	return element => {
		for (const predicate of predicates) {
			const check = predicate(element);
			if (!check) return false;
		}
		return true;
	};
}

export { ellipsis, b64Encode, b64Decode, andP };
