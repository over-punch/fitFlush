# Product Context

## Why this exists

Designers and editors hit the container-fit problem constantly:
- Editorial headlines that should fill the viewport or a grid cell
- Dashboard tiles where a label should fill its box regardless of length
- Responsive display type that scales precisely with its wrapper (not the viewport)
- Variable-font animations that break any fixed font-size assumption

Existing libraries (textFit, fitText, typit, ...) address parts of this, but none:
1. Use binary search (most iterate linearly, sometimes hundreds of times)
2. Use an analytical fast path for no-wrap single-line width mode
3. Account for variable-font axis travel
4. Ship framework-agnostic + React bindings in one package
5. Clean up after themselves via a fully detached off-screen probe

## Who it's for
- Type designers building foundry sites with editorial headlines
- Developers shipping variable-font animations that need a safe starting size
- Component library authors who want a drop-in "fit text to box" primitive
- The rest of the Liiift Studio type-tools suite, as a shared sizing primitive

## Desired experience
- Import, call once, done
- No configuration needed for the common case — `fitFlush(el)` just works
- Advanced options are all optional and named clearly
- Zero visible layout disruption during measurement (off-screen probe)
- Works identically with or without React
