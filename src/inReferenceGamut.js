import getColor from "./getColor.js";
import { isString } from "./util.js";
import defaults from "./defaults.js";
import gamuts from "./gamuts/index.js";

/** @import { ColorTypes } from "./types.js" */

/**
 * Check whether a color is within a named reference gamut of real surface colors
 * (as opposed to {@link inGamut}, which checks against a color space's own coordinate range).
 * @param {ColorTypes} color
 * @param {string | ({ gamut?: string | undefined } & Record<string, any>)} [o]
 * Reference gamut to check against, as well as any other options to pass to the gamut's test
 * @returns {boolean}
 * @throws {TypeError} Unknown or unspecified reference gamut
 */
export default function inReferenceGamut (color, o = {}) {
	if (isString(o)) {
		o = { gamut: o };
	}

	let { gamut = defaults.referenceGamut, ...rest } = o;

	color = getColor(color);

	let id = Object.keys(gamuts).find(id => id.toLowerCase() === gamut.toLowerCase());

	if (id) {
		return gamuts[id](color, rest);
	}

	throw new TypeError(
		`Unknown reference gamut: ${gamut}. Available gamuts: ${Object.keys(gamuts).join(", ")}`,
	);
}
