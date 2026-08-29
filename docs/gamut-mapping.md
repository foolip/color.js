# Gamut mapping

## What is color gamut?

[Color Gamut](https://en.wikipedia.org/wiki/Gamut) is the range of colors a given color space can produce.
Some color spaces (e.g. Lab, LCH, Ja<sub>z</sub>b<sub>z</sub>, CAM16) are mathematical models that encompass all visible color
and thus, do not have a fixed gamut.
Others however cannot produce all visible color without *values out of range*.
For example. all the RGB spaces (sRGB, P3, Adobe® RGB, ProPhoto, REC.2020) have a gamut that is smaller than all visible color.
Therefore, there are visible colors that cannot be represented by certain color spaces.
For example, the P3 lime (`color(display-p3 0 1 0)`) is outside of the gamut of sRGB.
In addition, colors that are **not visible to humans** can sometimes be represented by some color spaces!
Most notably, two of ProPhoto's three primaries (pure green, pure blue) are **outside the gamut of human vision**!

The process of transforming a color outside of a given gamut to a color that is as close as possible but is *inside gamut* is called *gamut mapping* and is the subject of [entire books](https://www.google.com/books/edition/Color_Gamut_Mapping/Yy0uK3pvfRMC?hl=en&gbpv=1&printsec=frontcover).

## So how does Color.js handle all this?

**Color.js does not do gamut mapping by default**, as this is lossy: If you convert from a larger color space to a smaller one and then back, you need to be able to get your original color (possibly with some roundoff error due to the calculations).

You can call `color.inGamut()` to check if the current color is in gamut of its own color space, or you can pass a different color space to check against:

```js
let lime = new Color("p3", [0, 1, 0]);
lime.inGamut();
lime.inGamut("srgb");
let sRGB_lime = lime.to("srgb");
sRGB_lime.inGamut();
```

Note that while the coordinates remain unchanged, the string representation of a Color object is, by default, _after_ gamut mapping, unless you explicitly turn that off:

```js
let lime = new Color("p3", [0, 1, 0]).to("srgb");
lime.coords;
lime.toString();
lime.toString({inGamut: false});
```


If you want gamut mapped coordinates, you can use `color.toGamut()`, which mutates the coordinates of the color it is called on.
If you want the gamut mapped color to be a different object, you can clone your color first.
You can also pass a different color space whose gamut you are mapping to via the `space` parameter.

```js
let lime = new Color("p3", [0, 1, 0]);
let sRGB_lime = lime.to("srgb");
lime.toGamut({space: "srgb"});
sRGB_lime.clone().toGamut();
sRGB_lime; // still out of gamut
```

Perhaps most important is the `method` parameter, which controls the algorithm used for gamut mapping.

The default method is `"css"`, which uses the binary search algorithm from [CSS Color Module Level 4](https://drafts.csswg.org/css-color/#css-gamut-mapping). The mapping is done in the Oklch space, and works by finding a chroma value where there is minimal difference between the mapped color and a clipped version. This difference is called the just noticeable difference, and is calculated in deltaEOK.

If the Oklch representation of the color has a lightness of less than or equal to 0, black is returned. Similarly, if the color has a lightness of greater than or equal to 1, white is returned.

You can pass `"clip"` to use simple clipping (not recommended), or any coordinate of any imported color space, which will make Color.js reduce that coordinate until the color is in gamut.

The default method before implementing the CSS Color 4 algorithm was `"lch.c"` which means LCH hue and lightness remain constant while chroma is reduced until the color fits in gamut.
Simply reducing chroma tends to produce good results for most colors, but most notably fails on yellows:

![chroma-reduction](images/p3-yellow-lab.svg)

Here is P3 yellow, with LCH Chroma reduced to the neutral axis. The RGB values are linear-light P3. The color wedge shows sRGB values, if in gamut; salmon, if outside sRGB and red if outside P3. Notice the red curve goes up (so, out of gamut) before finally dropping again. The chroma of P3 yellow is 123, while the chroma of the gamut-mapped result is far too low, only 25!

Instead, the `"css"` method reduces chroma (by binary search) and also, at each stage, calculates the deltaE2000 between the current estimate and a channel-clipped version of that color. If the deltaE is less than 2, the clipped color is displayed. Notice the red curve hugs the top edge now because clipping to sRGB also means it is inside P3 gamut. Notice how we get an in-gamut color much earlier. This method produces an in-gamut color with chroma 103.

![chroma-reduction-clip](images/p3-yellow-lab-clip.svg)

## Checking against reference gamuts of real surface colors

Unlike `color.inGamut()`, which checks a color against the gamut of a *color space* (a range of coordinates), a *reference gamut* checks whether a color could plausibly be produced by a real, opaque, non-fluorescent surface (such as a dye, paint, or textile), independent of any device or color space.

Many colors that are in gamut for wide-gamut color spaces like Display P3 or Rec.2020 are actually more saturated than any physical surface could produce; they can only be achieved with light sources, fluorescence, or other special optical effects.

```js
let green = new Color("green");
green.inRealSurfaceGamut(); // true, this is a plausible dark green surface

let p3Lime = new Color("color(display-p3 0 1 0)");
p3Lime.inRealSurfaceGamut(); // false, too saturated for any real surface
```

Color.js currently ships three such gamuts, each a named method as well as usable through the generic `color.inReferenceGamut(name)`:

| Method | `inReferenceGamut` name | Source |
|---|---|---|
| `inRealSurfaceGamut()` (default) | `"real-surface-2025"` | 2025 Real Surface Color Gamut, "Proposed Gamut" |
| `inRealSurfaceGamutFull()` | `"real-surface-2025-full"` | 2025 Real Surface Color Gamut, "Full Gamut" |
| `inPointersGamut()` | `"pointers-1980"` | Pointer's Gamut (1980) |

```js
green.inReferenceGamut(); // same as green.inRealSurfaceGamut() — the default
green.inReferenceGamut("pointers-1980"); // check against a specific gamut by name
```

**Each reference gamut is only meaningful in the color space and illuminant it was published in** — checking a color against one always converts internally, so you never need to convert first, but it's worth knowing what's happening:

- **`inRealSurfaceGamut()`** and **`inRealSurfaceGamutFull()`** are both based on the [2025 Real Surface Color Gamut](https://doi.org/10.1002/col.70004) (Xu, Song, Luo & Li, *Color Research & Application*), derived from 102,801 real-world reflectance measurements under a **D65** illuminant via a modified lattice regression algorithm. The "Proposed Gamut" is a tighter fit; the "Full Gamut" is fit with the added constraint that it must contain every input sample, including outliers. The Full Gamut is larger *overall*, but the two are independent fits, not one nested inside the other — at a small fraction of the tabulated grid the Full Gamut is actually a little smaller. Both are tabulated in CIE Lab (D65) over a grid of hues and lightnesses; since the paper's lattice regression grid values are specifically optimized so that bilinear interpolation between them reproduces the training data, that's what's used to read chroma between the tabulated points.
- **`inPointersGamut()`** is the original [Pointer's Gamut](https://en.wikipedia.org/wiki/Pointer%27s_gamut) (1980), superseded in accuracy by the 2025 gamuts above but still widely cited. It was published in CIE Lab under **Illuminant C**, not D65, so a color is chromatically adapted (CAT16, matching the conversion the 2025 paper itself uses to compare against Pointer's Gamut) before its coordinates are looked up. Pointer's Gamut also isn't closed — there's no defined white or black point, and lightness is only tabulated from 15 to 90 — so `inPointersGamut()` returns `false` for lightness outside that range rather than guessing.

Adding a further reference gamut published the same way (a grid of max chroma over hue and lightness, in some Lab-like space) is a matter of adding its data to `src/gamuts/`; see the comments in `src/gamuts/lchGridGamut.js` and `src/gamuts/index.js`.
