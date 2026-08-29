import Color from "../src/index.js";
import labC from "../src/gamuts/labIlluminantC.js";

export default {
	name: "Reference gamut tests",
	description:
		"Gamuts of real surface colors (as opposed to a color space's own coordinate gamut) — " +
		"see https://doi.org/10.1002/col.70004, https://doi.org/10.1002/col.5080050308 " +
		"and https://github.com/color-js/color.js/issues/764",
	run (...ctorArgs) {
		let color = new Color(...ctorArgs);
		let { method, arg } = this.data;
		return arg === undefined ? color[method]() : color[method](arg);
	},
	check: (a, b) => a === b,
	tests: [
		{
			name: "2025 Real Surface Color Gamut, Proposed (inRealSurfaceGamut)",
			data: { method: "inRealSurfaceGamut" },
			tests: [
				{ name: "achromatic", args: ["lab-d65", [50, 0, 0]], expect: true },
				{ name: "lightness above 100", args: ["lab-d65", [150, 0, 0]], expect: false },
				{ name: "lightness below 0", args: ["lab-d65", [-10, 0, 0]], expect: false },
				{
					name: "just inside the boundary at hue 0°, L 50° (tabulated max chroma 80.22)",
					args: ["lab-d65", [50, 80.1, 0]],
					expect: true,
				},
				{
					name: "just outside the boundary at hue 0°, L 50°",
					args: ["lab-d65", [50, 90, 0]],
					expect: false,
				},
				{
					name: "just inside the boundary halfway between hue 0° and 5°, L 50°",
					description:
						"Tabulated max chroma is 80.22 at hue 0° and 81.64 at hue 5°, so bilinear " +
						"interpolation should put the boundary at 2.5° close to their average, 80.9",
					args: [
						"lab-d65",
						[
							50,
							80.9 * Math.cos((2.5 * Math.PI) / 180),
							80.9 * Math.sin((2.5 * Math.PI) / 180),
						],
					],
					expect: true,
				},
				{
					name: "just outside the boundary halfway between hue 0° and 5°, L 50°",
					args: [
						"lab-d65",
						[
							50,
							81.0 * Math.cos((2.5 * Math.PI) / 180),
							81.0 * Math.sin((2.5 * Math.PI) / 180),
						],
					],
					expect: false,
				},
				{ name: "srgb dark green (a real surface color)", args: "green", expect: true },
				{ name: "srgb red (too saturated for a real surface)", args: "red", expect: false },
				{
					name: "display-p3 lime (too saturated for a real surface)",
					args: "color(display-p3 0 1 0)",
					expect: false,
				},
			],
		},
		{
			name: "2025 Real Surface Color Gamut, Full (inRealSurfaceGamutFull)",
			data: { method: "inRealSurfaceGamutFull" },
			tests: [
				{ name: "achromatic", args: ["lab-d65", [50, 0, 0]], expect: true },
				{
					name: "outside the Proposed gamut but inside the Full gamut",
					description:
						"The two are independent lattice regression fits, not one strictly " +
						"nested inside the other, but the Full gamut is larger almost everywhere",
					args: ["lab-d65", [40, 85, 30]],
					expect: true,
				},
			],
		},
		{
			name: "Pointer's Gamut, 1980 (inPointersGamut)",
			description: "Tabulated in CIE Lab under Illuminant C, not D65",
			data: { method: "inPointersGamut" },
			tests: [
				{
					name: "achromatic within the tabulated lightness range",
					args: [labC, [50, 0, 0]],
					expect: true,
				},
				{
					name: "lightness below the tabulated range (gamut isn't closed, not claimed outside)",
					args: [labC, [10, 0, 0]],
					expect: false,
				},
				{
					name: "lightness above the tabulated range",
					args: [labC, [95, 0, 0]],
					expect: false,
				},
				{
					name: "lightness at the tabulated minimum (15)",
					args: [labC, [15, 0, 0]],
					expect: true,
				},
				{
					name: "lightness at the tabulated maximum (90)",
					args: [labC, [90, 0, 0]],
					expect: true,
				},
				{
					name: "just inside the boundary at hue 60°, L 45° (tabulated max chroma 70)",
					args: [
						labC,
						[
							45,
							70 * Math.cos((60 * Math.PI) / 180),
							70 * Math.sin((60 * Math.PI) / 180),
						],
					],
					expect: true,
				},
				{
					name: "just outside the boundary at hue 60°, L 45°",
					args: [
						labC,
						[
							45,
							71 * Math.cos((60 * Math.PI) / 180),
							71 * Math.sin((60 * Math.PI) / 180),
						],
					],
					expect: false,
				},
			],
		},
		{
			name: "inReferenceGamut() generic dispatcher",
			data: { method: "inReferenceGamut" },
			tests: [
				{
					name: "defaults to the Proposed 2025 gamut",
					args: ["lab-d65", [50, 90, 0]],
					expect: false,
				},
				{
					name: "explicit gamut name reaches the Full 2025 gamut",
					args: ["lab-d65", [40, 85, 30]],
					data: { arg: "real-surface-2025-full" },
					expect: true,
				},
				{
					name: "explicit gamut name reaches Pointer's Gamut",
					args: [labC, [15, 0, 0]],
					data: { arg: "pointers-1980" },
					expect: true,
				},
				{
					name: "unknown gamut name throws",
					args: "red",
					data: { arg: "not-a-real-gamut" },
					throws: true,
				},
			],
		},
	],
};
