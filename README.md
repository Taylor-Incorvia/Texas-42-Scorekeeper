# 42 Scorekeeper

A single-screen scorekeeper for Texas 42, built for a phone sitting on the table.
It tracks the only two things that are hard to hold in your head: **who shakes
next** and **the score**.

## How it works

The app records one thing per round: `{ team, marks }`, where `team` is `null`
if nobody bid. Everything else — the score, the current shaker, whether the game
is over — is derived from that list. This is what makes the two awkward cases
in 42 behave correctly without any special handling:

- **A team wins 2+ marks at once.** That's one entry worth 2 marks. The shaker
  still advances exactly one seat.
- **Nobody bids.** That's one entry worth 0 marks. The shaker still advances.

It also means undo is just "drop the last entry" — the score and the pointer
can't drift out of sync, because neither is stored.

Seats are laid out clockwise from the bottom of the wheel. With everyone facing
the middle of the table, the next seat clockwise on a top-down view is the
player on your left, which is who shakes next. Partners land opposite each
other automatically.

Games go to 7 marks. Names are optional (default: Player 1–4) and the whole
game is saved to `localStorage`, so a locked screen or an accidental refresh
doesn't lose it.

## Running it

```sh
npm install
npm run dev     # --host is on, so you can open it on your phone over wifi
npm run build
```

## Deploying

Pushing to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`. In the repo, set **Settings → Pages → Source**
to **GitHub Actions** once, and every push deploys from there.
