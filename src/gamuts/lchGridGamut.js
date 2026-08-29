import getColor from "../getColor.js";
import { constrain } from "../angles.js";
import { clamp } from "../util.js";

/** @import ColorSpace from "../ColorSpace.js" */
/** @import { ColorTypes } from "../types.js" */

const ε = 0.000075;

/**
 * Create a gamut membership test from a boundary tabulated as maximum chroma
 * over a grid of hues and lightnesses, in some cylindrical Lab-like color space
 * (chroma = hypot(a, b), hue = atan2(b, a)). Chroma between grid points is found
 * via bilinear interpolation, treating hue as circular.
 *
 * This is the shape shared by every currently supported reference gamut
 * (the 2025 Real Surface Color Gamut and its Full variant, and Pointer's Gamut),
 * and by any future gamut published the same way.
 * @param {object} o
 * @param {ColorSpace} o.space Lab-like space the boundary is tabulated in
 * @param {number} o.hueStep Hue is tabulated every `hueStep` degrees, starting at 0
 * @param {number[]} o.lightnesses Lightness values the boundary is tabulated at (need not be evenly spaced)
 * @param {number[][]} o.maxChroma `maxChroma[hueIndex][lightnessIndex]` is the maximum chroma
 * at hue `hueIndex * hueStep` degrees and lightness `lightnesses[lightnessIndex]`
 * @param {number} [o.maxLightness] Lightness above which the gamut is treated as empty (chroma 0),
 * even past the last tabulated value — for a gamut whose real boundary is known to reach a white point
 * beyond what's tabulated. Defaults to the last tabulated lightness, i.e. no such extension.
 * @param {number} [o.epsilon] Default tolerance, can be overridden per call
 * @returns {(color: ColorTypes, options?: { epsilon?: number | undefined }) => boolean}
 */
export default function createLchGridGamut ({
	space,
	hueStep,
	lightnesses,
	maxChroma,
	maxLightness = lightnesses[lightnesses.length - 1],
	epsilon: defaultEpsilon = ε,
}) {
	let minLightness = lightnesses[0];
	let maxTabulatedLightness = lightnesses[lightnesses.length - 1];

	function maxChromaAtLightness (row, l) {
		let i = 1;
		while (lightnesses[i] < l) {
			i++;
		}

		let l0 = lightnesses[i - 1];
		let l1 = lightnesses[i];
		let c0 = row[i - 1];
		let c1 = row[i];

		return l0 === l1 ? c0 : c0 + ((c1 - c0) * (l - l0)) / (l1 - l0);
	}

	function maxChromaAt (l, h) {
		// l is always pre-clamped to maxTabulatedLightness by the caller below. The maxLightness
		// extension (for lightness past the tabulated grid but still physically valid) relies on
		// that clamp landing on the last tabulated row, whose chroma is 0 for every gamut that uses it.
		let hueIndex0 = Math.floor(h / hueStep) % maxChroma.length;
		let hueIndex1 = (hueIndex0 + 1) % maxChroma.length;
		let hueFraction = (h - hueIndex0 * hueStep) / hueStep;

		let c0 = maxChromaAtLightness(maxChroma[hueIndex0], l);
		let c1 = maxChromaAtLightness(maxChroma[hueIndex1], l);

		return c0 + (c1 - c0) * hueFraction;
	}

	return function inGamut (color, { epsilon = defaultEpsilon } = {}) {
		color = getColor(color);
		let [L, a, b] = space.from(color);

		if (L < minLightness - epsilon || L > maxLightness + epsilon) {
			return false;
		}

		let C = Math.sqrt(a ** 2 + b ** 2);

		if (C <= epsilon) {
			// Achromatic colors are always in gamut, for any in-range lightness
			return true;
		}

		let maxC = maxChromaAt(
			clamp(minLightness, L, maxTabulatedLightness),
			constrain((Math.atan2(b, a) * 180) / Math.PI),
		);

		return C <= maxC + epsilon;
	};
}
