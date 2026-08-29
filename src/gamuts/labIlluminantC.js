import ColorSpace from "../ColorSpace.js";
import xyz_d65 from "../spaces/xyz-d65.js";
import adapt, { WHITES } from "../adapt.js";
import "../CATs.js"; // registers WHITES.C and the named chromatic adaptation transforms (incl. CAT16)

const ε = 216 / 24389; // 6^3/29^3 == (24/116)^3
const ε3 = 24 / 116;
const κ = 24389 / 27; // 29^3/3^3

const white = WHITES.C;

/**
 * CIE Lab relative to CIE Standard Illuminant C, chromatically adapted (CAT16) from D65.
 *
 * This is not a publicly registered color space (there is no "lab-c" id) — it exists only to
 * evaluate gamuts, such as Pointer's Gamut, that were published relative to Illuminant C. CAT16
 * is used because it's the transform Xu et al. (2025) used for the same C ↔ D65 conversion when
 * comparing their own D65 gamut against Pointer's Gamut.
 */
export default new ColorSpace({
	id: "lab-c",
	name: "CIE Lab (Illuminant C)",
	coords: {
		l: { refRange: [0, 100], name: "Lightness" },
		a: { refRange: [-125, 125] },
		b: { refRange: [-125, 125] },
	},
	white,
	base: xyz_d65,
	fromBase (XYZ_D65) {
		let XYZ = adapt(WHITES.D65, white, XYZ_D65, { method: "CAT16" });
		let xyz = XYZ.map((value, i) => value / white[i]);
		let f = xyz.map(value => (value > ε ? Math.cbrt(value) : (κ * value + 16) / 116));

		return [
			116 * f[1] - 16, // L
			500 * (f[0] - f[1]), // a
			200 * (f[1] - f[2]), // b
		];
	},
	toBase (Lab) {
		let f = [];
		f[1] = (Lab[0] + 16) / 116;
		f[0] = Lab[1] / 500 + f[1];
		f[2] = f[1] - Lab[2] / 200;

		let xyz = [
			f[0] > ε3 ? Math.pow(f[0], 3) : (116 * f[0] - 16) / κ,
			Lab[0] > 8 ? Math.pow((Lab[0] + 16) / 116, 3) : Lab[0] / κ,
			f[2] > ε3 ? Math.pow(f[2], 3) : (116 * f[2] - 16) / κ,
		];

		let XYZ = /** @type {[number, number, number]} */ (xyz.map((value, i) => value * white[i]));
		return adapt(white, WHITES.D65, XYZ, { method: "CAT16" });
	},
});
