// Czech is a lazy locale following the French (#371) wiring. This smoke
// pins the cs-specific wiring only: automatic selection
// from a cs-CZ profile, one lazy chunk per page, and the initial graph free
// of Czech. The generic failure machinery (retry, fallback, render gate,
// failure toast) is locale-agnostic and stays proven by smoke_german_locale.
import { readFileSync } from 'node:fs';
import { launchColdView, checkAll, finish } from './serve.mjs';

const manifest = JSON.parse(readFileSync('dist/houseplan-assets.json', 'utf8'));
const csPath = manifest.files.map((f) => f.path).find((p) => /(?:^|\/)cs-[^/]+\.js$/.test(p));
if (!csPath) throw new Error('Czech locale chunk is absent from the bundle manifest');
const csName = csPath.split('/').at(-1);

const { page, browser } = await launchColdView();
const requested = [];
page.on('request', (r) => requested.push(new URL(r.url()).pathname));
const out = await page.evaluate(async (csChunk) => {
  const card = window.__card;
  const out = {};
  const waitFor = async (predicate, timeout = 8000) => {
    const started = Date.now();
    while (!predicate() && Date.now() - started < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    return !!predicate();
  };
  // HA profile cs-CZ → Czech, without an explicit choice
  card.hass = { ...card.hass, locale: { ...card.hass.locale, language: 'cs-CZ' } };
  card.requestUpdate();
  out.czechCommits = await waitFor(() => card._t('btn.save') === 'Uložit');
  out.czechTitleGlossary = card._t('space.header') === 'Prostor';
  out.langAttrIsCs = await waitFor(() => card.getAttribute('lang') === 'cs');
  return out;
}, csName);
out.csChunkRequestedOnce = requested.filter((p) => p.endsWith(`/${csName}`)).length === 1;
out.initialGraphHasNoCzech = !manifest.initialViewFiles.some((p) => /(?:^|\/)cs-[^/]+\.js$/.test(p))
  && manifest.lazyLocaleFiles.some((p) => /(?:^|\/)cs-[^/]+\.js$/.test(p));
checkAll(out);
await finish(browser, out);
