/**
 * @packageDocumentation
 * Reference gamuts of real (non-fluorescent, non-luminous) surface colors, as opposed to the
 * gamut of a color space's own coordinate range (see inGamut.js).
 *
 * Each entry is a `(color, options?) => boolean` gamut membership test. Every currently supported
 * gamut is tabulated as maximum chroma over a grid of hues and lightnesses in some Lab-like space
 * (see lchGridGamut.js) — a future gamut published the same way is a new data module plus one line
 * here; one published a different way just needs its own `(color, options?) => boolean` function.
 */
import inRealSurfaceGamut from "./realSurfaceGamut2025.js";
import inRealSurfaceGamutFull from "./realSurfaceGamut2025Full.js";
import inPointersGamut from "./pointersGamut.js";

const gamuts = {
	"real-surface-2025": inRealSurfaceGamut,
	"real-surface-2025-full": inRealSurfaceGamutFull,
	"pointers-1980": inPointersGamut,
};

export default gamuts;
export { inRealSurfaceGamut, inRealSurfaceGamutFull, inPointersGamut };
