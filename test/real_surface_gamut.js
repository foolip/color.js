import Color from "../src/index.js";

export default {
	name: "Real Surface Color Gamut tests",
	description:
		"These tests check whether a color is within the 2025 Real Surface Color Gamut " +
		"(see https://doi.org/10.1002/col.70004 and https://github.com/color-js/color.js/issues/764)",
	run (...args) {
		let color = args.length > 1 ? new Color(...args) : new Color(args[0]);
		return color.inRealSurfaceGamut();
	},
	check: (a, b) => a === b,
	tests: [
		{
			name: "Achromatic colors are always in gamut",
			tests: [
				{ name: "black", args: "black", expect: true },
				{ name: "white", args: "white", expect: true },
				{ name: "gray", args: "gray", expect: true },
				{ name: "lab-d65 achromatic midtone", args: ["lab-d65", [50, 0, 0]], expect: true },
			],
		},
		{
			name: "Lightness out of [0, 100] is never in gamut",
			tests: [
				{ name: "L slightly above 100", args: ["lab-d65", [100.001, 0, 0]], expect: false },
				{ name: "L well above 100", args: ["lab-d65", [150, 0, 0]], expect: false },
				{ name: "L below 0", args: ["lab-d65", [-10, 0, 0]], expect: false },
			],
		},
		{
			name: "Chroma right at a tabulated hue is compared against that hue's boundary",
			description:
				"At hue 0° (a > 0, b = 0) and L = 50, the tabulated maximum chroma is 80.22",
			tests: [
				{ name: "just inside", args: ["lab-d65", [50, 80.1, 0]], expect: true },
				{ name: "on the boundary", args: ["lab-d65", [50, 80.22, 0]], expect: true },
				{ name: "well inside", args: ["lab-d65", [50, 50, 0]], expect: true },
				{ name: "outside", args: ["lab-d65", [50, 90, 0]], expect: false },
			],
		},
		{
			name: "Chroma between two tabulated hues is bilinearly interpolated",
			description:
				"Halfway between hue 0° (max chroma 80.22 at L = 50) and hue 5° (max chroma 81.64 at L = 50)",
			tests: [
				{
					name: "just inside",
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
					name: "just outside",
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
			],
		},
		{
			name: "Real-world colors",
			tests: [
				{ name: "srgb dark green (a real surface color)", args: "green", expect: true },
				{ name: "srgb red (too saturated for a real surface)", args: "red", expect: false },
				{
					name: "display-p3 lime (too saturated for a real surface)",
					args: "color(display-p3 0 1 0)",
					expect: false,
				},
			],
		},
	],
};
