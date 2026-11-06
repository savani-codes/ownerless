# Website

The Ownerless showcase site: <https://savani-codes.github.io/ownerless/>. Vite, React 19 and
strict TypeScript, with no other runtime dependencies. It explains the project; it never talks to
the data platform or the agents.

```bash
npm ci
npm run dev       # http://localhost:5173/ownerless/
npm test          # the Companion's matcher and knowledge base
npm run build     # type-checks, then builds to dist/
```

Pushing to `main` deploys it through `.github/workflows/pages.yml`. The repository's Pages
source must be set to **GitHub Actions** once (Settings > Pages).

## Where things are

```text
src/content.ts            every piece of copy on the page, plus links and the demo video id
src/sections/             one component per page section; Hero and Thread have their own CSS
src/components/           Nav, BackToTop, Logo, Reveal (scroll-in animation), RichText
src/companion/            the "Ask Ownerless" guide: knowledge base, matcher, tests and UI
src/hooks/                useInView, useScroll, useMotionAllowed
src/styles/global.css     design tokens and shared primitives (buttons, tags, eyebrows, sections)
public/                   favicon, touch icon and the social preview image
```

## Common changes

| To | Edit |
| --- | --- |
| Change any text | `src/content.ts` |
| Embed the demo video | set `demoVideoId` in `src/content.ts` to the YouTube id |
| Teach the Companion a new answer | add an entry to `src/companion/knowledge.ts`, then `npm test` |
| Change colours or fonts | the tokens at the top of `src/styles/global.css` |
| Host somewhere other than GitHub Pages | build with `BASE=/ npm run build` |

## The Companion

It runs entirely in the browser: no AI model, no API key, nothing sent anywhere. It scores the
question against each entry's keywords and canonical question (`src/companion/match.ts`) and
answers from the best match, or says it doesn't know. The tests check that every canonical
question finds its own entry, that suggestions point to real entries, and that the team is only
ever named JARS and SAV.

## Motion

Sections fade in as they scroll into view, the incident thread plays back message by message,
the stats count down, the logo's brackets lock on to the owner, and the architecture links flow.
All of it switches off when the visitor's system asks for reduced motion.
