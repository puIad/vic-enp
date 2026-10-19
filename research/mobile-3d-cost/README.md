# Cost of cinematic 3D on a mid-range phone in Instagram's browser

Resolves issue #5. Checked 2026-10-19 against [quality.md](../../docs/quality.md) (budgets) and
[architecture.md](../../docs/architecture.md) (tiers 0 to 2).

## Read this first: what is measured and what is not

Almost nobody publishes frame times for mid-range Android. This note separates three kinds of claim:

- **Sourced**: stated in a library doc, vendor guide, bug tracker or engineering write-up, linked inline.
- **Estimate**: arithmetic or judgement by the author of this note. Marked `(est.)`. These are starting points for
  the owner's phone test, not measurements.
- **Not found**: no source exists. Listed at the end.

Headless Chrome renders WebGL in software, so it cannot confirm any of these numbers (quality.md says the same).
The owner's two real phones are the only measurement that counts.

## Why cost scales with pixels, not with how fancy the scene looks

A phone page is fill-rate and bandwidth bound. Mobile GPUs are tile-based and pay to read and write full-screen
images, so every full-screen pass costs in proportion to pixel count. Arm says memory bandwidth is at a premium and
that console-style post chains suit tile-based GPUs badly
([Arm, post-processing on mobile](https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/post-processing-effects-on-mobile-optimization-and-alternatives)).
Their measured case (a native game, not WebGL): a standard bloom cost 3 ms of a 16 ms frame, and a baked or masked
bloom cost under 1 ms. The same article measured a terrain pass dropping from 9.3 ms to about 5 ms by rendering at
720p instead of 1080p.

Pixel arithmetic for a 390 x 844 CSS-pixel phone (est., simple multiplication):

| Canvas DPR | Pixels rendered | Relative to DPR 1 |
|---|---|---|
| 1.0 | 0.33 MP | 1x |
| 1.5 (tier 1 cap) | 0.74 MP | 2.25x |
| 2.0 (tier 2 cap) | 1.32 MP | 4x |
| 3.0 (native on many phones) | 2.96 MP | 9x |

So the DPR cap is the biggest single lever, bigger than any effect toggle. Google's Hobbit site found canvas size
the most effective tweak: a half-size canvas scaled by CSS took a Nexus 10 from 16 to 33 fps
([web.dev, Hobbit case study](https://web.dev/case-studies/hobbit)). MDN lists the same trick first under fill-rate
([MDN, WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)).

## Technique table

"Cost" is on a mid-range Android phone (Moto G Power class). Verdicts use the tiers in architecture.md. Tier 0 has
no canvas, so it is "drop" for everything and is left out of the table.

| Technique | Cost on a mid-range phone | Tier 1 (most phones) | Tier 2 (recent phones, desktops) |
|---|---|---|---|
| Bloom, standard (EffectComposer) | Sourced: about 3 ms in Arm's case, a fifth of a 60 fps frame, plus an extra render target and full-screen read, which tile GPUs dislike. Est.: 2 to 5 ms at 0.74 MP, more at higher DPR | **Drop.** Fake it: additive glow sprites, glow in the points' texture | **Keep**, one pass, `mipmapBlur`, high threshold so only highlights bloom. Lower the composer DPR if frames dip |
| Other postprocessing (vignette, tone map) | Cheap alone. pmndrs `postprocessing` merges effects into one `EffectPass`, so many effects cost one full-screen pass ([postprocessing README](https://github.com/pmndrs/postprocessing)) | **Drop.** Vignette in CSS (radial gradient over the canvas); tone mapping is free in the material shader | **Keep**, inside the same merged pass as bloom |
| MSAA on the composer | Not benchmarked in the docs. MDN notes multisampled attachments are costly to store on tiled GPUs. Est.: significant at DPR 1.5+ | **Drop.** Points need no AA | **Drop** (`multisampling={0}`), rely on DPR; add SMAA only if edges look bad |
| GPU particles (Points) | Fill-rate bound: point size and overdraw matter more than count. Large overlapping transparent particles are the main mobile cost ([Unity forum thread](https://discussions.unity.com/t/why-is-overdraw-fill-rate-such-an-issue-on-mobile-dev/459136), anecdotal). A WebKit bug report mentions a gl_PointSize demo at steady 60 fps on a Pixel 3 in Chrome ([WebKit 230749](https://bugs.webkit.org/show_bug.cgi?id=230749)). See the particle section below | **Keep**, 10k to 15k points, under about 4 px, additive, no per-point lighting | **Keep**, 30k to 40k, same rules; step down at runtime |
| Transmission and glass (`MeshPhysicalMaterial.transmission`, drei `MeshTransmissionMaterial`) | Sourced: an extra scene render per frame. three.js: lowering `transmissionResolutionScale` "can result in significant performance improvements" ([WebGLRenderer docs](https://threejs.org/docs/pages/WebGLRenderer.html)). drei: "can still be expensive as it causes an additional render pass"; low samples and low resolution help, 32 x 32 is fine with roughness ([drei docs](https://github.com/pmndrs/drei/blob/master/docs/shaders/mesh-transmission-material.mdx)) | **Drop.** Fake glass: env-mapped dark material with a fresnel rim, or plain transparency | **Reduce.** One hero object only, `transmissionResolutionScale` 0.25 to 0.5 (est.), `samples` 2 to 4 (drei default is 6), never on several objects |
| Volumetric light, god rays, volumetric fog | Raymarching in the fragment shader: cost is pixels times steps. No mobile figure found. Est.: a 16-step full-screen march at 0.74 MP likely uses most of a 33 ms budget on a low-end Mali or Adreno | **Drop.** Fake: a few additive cone or plane meshes with a gradient texture, CSS glows behind the canvas | **Drop** (or half-resolution march if the owner insists). Prefer the fake |
| Plain scene fog | Linear or exponential fog is a per-fragment mix in the stock shaders, effectively free. Not the same as volumetric | **Keep** (`scene.fog`), it gives the dark depth | **Keep** |
| Depth of field | Needs depth plus a convolution pass; react-postprocessing allows one convolution effect per merged pass, so DOF and bloom do not share a pass ([docs](https://github.com/pmndrs/react-postprocessing/blob/master/docs/effect-composer.mdx)). Est.: costly on top of bloom | **Drop.** Fake: point size and alpha falloff by distance in the vertex shader | **Drop** for scroll scenes. Optional on one still moment, off during motion |
| Film grain | A full-screen pass unless merged | **Keep via CSS**: a small tiled noise PNG overlay at low opacity, no WebGL cost | **Keep**: the same CSS overlay, or `Noise` inside the merged pass |
| Video textures | Per-frame upload plus decoder. Inline playback and autoplay depend on the host app's WebView config (`allowsInlineMediaPlayback` on iOS, [Google AdMob guide](https://developers.google.com/admob/ios/browser/webview)); Instagram's config is not public. A three.js report shows a video not ready at first render can lose the context ([three.js #29909](https://github.com/mrdoob/three.js/issues/29909)) | **Drop.** Poster image, or a DOM `<video>` loop, not a texture | **Drop** unless a section needs it; one 480p muted `playsinline` clip, started only when visible |
| HDR environment map | One-time PMREM build at load, then cheap sampling. drei says presets rely on CDNs and are not for production, and gainmap files "have the smallest footprint" ([drei Environment](https://github.com/pmndrs/drei/blob/master/docs/staging/environment.mdx)). Est.: a 256-per-face half-float cube with mips is about 4 MB | **Reduce.** 256 to 512 px env, or 2 to 3 punctual lights. The CSP blocks CDNs, so self-host | **Keep.** Self-hosted, 512 to 1k wide, loaded after first paint |
| Shadows | Extra depth pass per light | **Drop.** Fake contact darkening | **Drop** |
| Compressed textures (KTX2) | `KTX2Loader` keeps textures compressed on the GPU, "reduced memory cost" ([three.js KTX2 example](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_loader_texture_ktx2.html)); MDN recommends compressed formats | **Use** for anything over 512 px | **Use** |

## GPU particles: how many points hold 60 fps

No published benchmark gives a number for a Moto G class phone, and that is itself a finding. What the sources say:

- A three.js forum thread cites a 500k-point example that "works well", and a developer measured about 20 million
  spheres on desktop. Neither transfers to Android
  ([thread](https://discourse.threejs.org/t/to-create-larger-amounts-of-particles-more-than-like-100-000-which-method-is-the-best-to-do-so-three-points-or-three-instancedmesh-or-three-mesh/73109), as summarised by search).
- R3F's guide: each mesh is a draw call, instancing renders 100,000 objects in one call
  ([R3F, scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)). A `Points` object is one draw
  call at any count, so draw calls are not the limit.
- The phone limits are vertex work per point (the formation blend) and fragment overdraw from point size. Both grow
  with count and size.

Recommendation (est.): the 10k to 15k tier 1 range in architecture.md is conservative and likely holds 60 fps on a
Moto G Power class phone if points stay under about 4 px at DPR 1.5, the fragment shader is one `smoothstep` circle,
blending is additive and depth write is off. Tier 2 at 30k to 40k is plausible. The real ceiling needs one device
test: ramp the count 10k, 20k, 40k, 80k on the actual phone with the real shader and read the fps.

## In-app browser specifics (Instagram, Facebook)

| Topic | Finding | Confidence |
|---|---|---|
| Android engine | Android in-app browsers of this kind are generally Chromium WebView, updated separately from Android, with WebGL ([Chrome WebView docs](https://developer.chrome.com/docs/webview)). An Instagram Android user agent example carries the `wv` WebView token ([51Degrees](https://51degrees.com/blog/webview-detection)). Chromium says hardware acceleration is on by default in WebView, and software draw lacks WebGL ([Chromium docs](https://chromium.googlesource.com/chromium/src/+/83.0.4103.106/android_webview/docs/software_draw_deprecated.md)) | Medium. No Meta statement found |
| WebGL2 in those WebViews | Not documented for Instagram or Facebook by any primary source. Current Chromium WebView is expected to expose it. Feature-detect and degrade anyway | Not verified |
| Speed vs Chrome | A Babylon.js forum thread reports WebGL slower in an embedded Android WebView than in Chrome, with advice to confirm the current Chromium WebView ([thread](https://forum.babylonjs.com/t/webgl2-perfomance-issue-on-android-embeded-webview-vs-chrome/1319)). Plan for lower frame rate in-app than in Chrome on the same phone | Anecdotal |
| iOS engine | A commenter in the model-viewer discussion says Facebook, Instagram and LinkedIn use WKWebView and Twitter uses SFSafariViewController ([thread](https://github.com/google/model-viewer/discussions/1915)). Facebook's own engineering post says it moved to WKWebView and that most web view memory then sits outside the app process ([Facebook engineering](https://engineering.fb.com/ios/reducing-fooms-in-the-facebook-ios-app/)) | Medium |
| iOS memory | An Apple forum answer says the WKWebView memory limit cannot be raised and depends on device RAM and load ([Apple forum](https://developer.apple.com/forums/thread/133449)). WebKit bug 300782 (open, last edited 2026-03-11): texture-heavy WebGL pages are killed and reloaded under memory pressure with no `webglcontextlost` event and no JS error, more often on lower-memory devices; the only mitigation named is fewer and smaller textures ([WebKit 300782](https://bugs.webkit.org/show_bug.cgi?id=300782)). A search also surfaced a WebKit console warning "Total canvas memory use exceeds the maximum limit (384 MB)"; I did not open that bug, so treat the figure as unverified | Strong for the failure mode, no hard number |
| Context loss | A context-loss report says a page that does not call `event.preventDefault()` in its `webglcontextlost` handler cannot restore that canvas ([community report](https://github.com/RunbotRobot/higglehaven/issues/1318)). MDN says to treat `CONTEXT_LOST` as an expected event ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)) | Medium |
| Eviction and reload | Link-tool vendors claim Instagram's WebView is evicted under memory pressure. No primary source | Unverified, marketing |
| Other gaps | AR Quick Look does not launch from Instagram or Facebook on iOS as of April 2024 ([model-viewer thread](https://github.com/google/model-viewer/discussions/1915)). Irrelevant here, but it shows these WebViews lack some Safari features | Sourced |

### Consequences for this page

1. WebGL cannot be assumed. Feature-detect by creating a context in try/catch, not by user agent. A failure means tier 0.
2. Handle `webglcontextlost` (`preventDefault`, show the static composition) and `webglcontextrestored` (rebuild or
   stay static). Test it with `WEBGL_lose_context`.
3. Keep GPU memory low. iOS can kill the tab silently, and Instagram on iOS is a WKWebView. Treat the 128 MB in
   quality.md as the hard cap and aim for about 64 MB on tier 1 (est., no source gives a number).
4. A reload loop is the worst case on iOS. The world loads after first paint (architecture.md), so a killed world still
   leaves a readable page. Keep that rule.
5. Do not rely on an "open in browser" prompt. Users in the app will not leave.

## What award-winning 3D sites do on phones

No studio engineering write-up with mobile frame numbers was found. Searches for Active Theory and Lusion returned
design-philosophy pieces and one third-party analysis, so those studios are not cited as sources. What is documented:

- **Cut canvas pixels first.** Hobbit rendered at half canvas size and let CSS scale it ([web.dev](https://web.dev/case-studies/hobbit)). R3F's docs step DPR 2, 1.5, 1 with `PerformanceMonitor` ([R3F](https://r3f.docs.pmnd.rs/advanced/scaling-performance)).
- **Remove post effects and antialiasing on weak devices.** Hobbit dropped both, used per-vertex lighting (`MeshLambertMaterial`), halved texture sizes on mobile, merged geometry to cut draw calls and ran some animation every other frame ([web.dev](https://web.dev/case-studies/hobbit)).
- **Keep a non-WebGL path.** Hobbit kept most of the experience for no-WebGL browsers with CSS and compositing ([web.dev](https://web.dev/case-studies/hobbit)). That is tier 0 in architecture.md.
- **Tier by measured performance.** `detect-gpu` returns tiers 0 to 3 from a benchmark table (under 15 fps is 0, then 15, 30, 60) with separate `mobileTiers`. Caveats: its data source stopped updating in December 2025, so new phones get a conservative `FALLBACK` tier, and its data loads from a CDN that the CSP would block unless self-hosted ([detect-gpu](https://github.com/pmndrs/detect-gpu)). architecture.md's plan to try plain heuristics first fits.
- **Adapt at runtime.** drei `PerformanceMonitor` averages fps over 250 ms windows (10 iterations, 75 percent threshold), moves a 0 to 1 `factor`, and calls `onFallback` after `flipflops` swings, then shuts down ([drei](https://github.com/pmndrs/drei/blob/master/docs/performances/performance-monitor.mdx)). `AdaptiveDpr` lowers DPR while the canvas regresses; `regress()` lowers quality during movement and restores after a 200 ms debounce ([R3F](https://r3f.docs.pmnd.rs/advanced/scaling-performance)).
- **Render only when needed.** `frameloop="demand"` with `invalidate()` stops rendering when nothing moves ([R3F](https://r3f.docs.pmnd.rs/advanced/scaling-performance)). On a scroll page this pauses the world while the visitor reads, which saves battery and heat.
- **Precompile shaders.** drei `Preload` runs `gl.compile` so a material does not hitch when it first enters view ([drei](https://github.com/pmndrs/drei/blob/master/docs/performances/preload.mdx)). MDN advises compiling all shaders before linking and using `KHR_parallel_shader_compile`.
- **Dispose and reuse.** Share geometries and materials, call `dispose()` on what leaves ([three.js manual](https://github.com/mrdoob/three.js/blob/dev/manual/pages/cleanup.html)). A three.js maintainer, in a context-loss thread, points at leaks and oversized textures ([forum thread](https://discourse.threejs.org/t/how-to-fix-context-lost-android-iphone-ios/56829), as summarised by search).
- **Fake the expensive look.** Arm baked bloom into textures and used camera-facing planes for glow, getting under 1 ms ([Arm](https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/post-processing-effects-on-mobile-optimization-and-alternatives)). The same idea fits a dark page: glow sprites, CSS gradients, fog, additive points.
- **Pitfall.** Postprocessing passes do not inherit the renderer's pixel ratio, so a DPR cap has to reach the composer too ([three.js forum](https://discourse.threejs.org/t/postprocessing-adds-a-lot-of-pixelation/55813?page=2), community report).

## What the chosen look needs

Dark, cinematic, premium is mostly low light and contrast, which is cheap. What reads as cinematic on a dark page is
depth (fog), light falling off (vignette, glow around highlights), controlled motion (Lenis easing) and few bright
things. None of that needs bloom, DOF, transmission or volumetrics. On tier 1 use fog, additive points that fade with
distance, CSS glow and grain, and a CSS vignette. Tier 2 adds one bloom pass.

## Budget we'd recommend (dark cinematic page)

Numbers marked (est.) are starting points to verify on the owner's two phones.

**Renderer and frame**

- Tier 1: DPR cap 1.5 (matches architecture.md). Start at 1.25, let `PerformanceMonitor` move between 1 and 1.5. Target 30
  fps sustained (the quality.md floor), 60 where it comes free.
- Tier 2: DPR cap 2. Start at 1.5, step to 2 only while fps stays above 55.
- `antialias: false`, `powerPreference: "high-performance"`, `stencil: false` (the postprocessing README recommends
  `antialias`, `stencil` and `depth` off on the renderer when using its composer).
- `frameloop="demand"` outside scroll motion. Pause when the tab is hidden or the section is offscreen.

**Effects by tier**

| Effect | Tier 0 | Tier 1 | Tier 2 |
|---|---|---|---|
| Canvas | none | yes, DPR 1 to 1.5 | yes, DPR 1.5 to 2 |
| Points | none (static art) | 10k to 15k, under 4 px | 30k to 40k |
| Bloom | none | none (fake glow) | one pass, `mipmapBlur`, merged |
| Transmission or glass | none | none | one object, scale 0.25 to 0.5 |
| Volumetric light | none | none | none (fake cones) |
| Depth of field | none | none | none |
| Film grain | CSS | CSS | CSS or merged `Noise` |
| Vignette | CSS | CSS | CSS |
| Fog | none | scene fog | scene fog |
| Video texture | none | none | none (DOM video if needed) |
| Env map | none | 256 px or 2 to 3 lights | 512 to 1k, self-hosted |
| Shadows | none | none | none |

**Memory (est.)**

- Tier 1 GPU target 64 MB, hard cap 128 MB (quality.md). The canvas at 0.74 MP with color and depth is about 6 MB; the rest
  is textures. KTX2, 1024 px max on tier 1, 2048 px on tier 2, nothing larger anywhere.
- One WebGL context. Dispose a section's textures when it leaves. One composer render target set.

**Fallback and safety**

- Context creation in try/catch. Failure means tier 0.
- `webglcontextlost` calls `preventDefault()` and swaps in the static composition; `webglcontextrestored` rebuilds.
- On any phone, start in tier 1 and let `PerformanceMonitor` move up. Do not start high and fall.
- Tier 0 when Save-Data is on, `deviceMemory` is 2 or less, or reduced motion is set (matches architecture.md).
- `Preload` shaders after the world mounts, before the first reveal.
- Pass criteria for the owner's phones, one Android and one iPhone inside Instagram: the world starts, survives 3
  minutes of scrolling, survives backgrounding the app for 30 seconds, and the page still reads if the world dies.

**Verification additions**

1. Ramp the point count on a real phone (10k, 20k, 40k, 80k) and record where fps holds 30 and 60.
2. In Instagram on Android, log `!!canvas.getContext('webgl2')` and `MAX_TEXTURE_SIZE` to a visible debug line.
3. Force a context loss on both phones and watch recovery.

## Could not verify

- No measured fps or ms for any technique on a Moto G Power class phone inside Instagram or Facebook. Apart from Arm's
  native bloom case and docs statements, every cost in the table is an estimate.
- Whether Instagram's and Facebook's Android in-app browsers expose WebGL2, their exact engine (WebView or Custom Tabs)
  and any memory cap. No Meta statement found.
- A hard iOS WKWebView memory number. Apple and WebKit say it varies and cannot be raised. The 384 MB canvas warning was
  seen only in a search snippet.
- Award-studio engineering numbers (Active Theory, Lusion and similar). None found.
- Chrome and ANGLE maximum point size, and large-point additive blend cost on Mali and Adreno.
- Several forum and bug pages were read only as web-search summaries (marked "as summarised" or "community report").
  Read in full: Arm, web.dev Hobbit, three.js WebGLRenderer, MDN best practices, detect-gpu, WebKit 300782, the
  model-viewer discussion, and the pmndrs docs through Context7.
