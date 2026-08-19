# Hodowca

Webowy klon klasycznej gry o hodowaniu zwierząt, rzucaniu kostkami, wymianie zwierząt i unikaniu drapieżników. Hostowany statycznie na GitHub Pages, bez backendu.

Gra jest fanowską, niekomercyjną implementacją inspirowaną klasyczną mechaniką gier typu "zbieraj i wymieniaj" — nie jest powiązana z żadnym konkretnym wydawcą ani wydaniem pudełkowym.

## Tryby gry

- **Hot seat** — gracze grają na zmianę na jednym urządzeniu.
- **LAN / Online** — każdy gracz na swoim urządzeniu w tej samej sieci (WebRTC przez [Trystero](https://github.com/dmotz/trystero), bez backendu).
- **Gra z komputerem** — solo lub w grupie, z botami sterowanymi prostą heurystyką.

## Struktura projektu

- `src/engine` — czysta logika gry (reguły, stan, walidacja akcji), niezależna od UI i sieci.
- `src/transport` — moduły trybów rozgrywki (hotseat / webrtc / bot), pod wspólnym interfejsem.
- `src/ui` — komponenty widoku (React), store (Zustand), tłumaczenia (react-i18next: PL/EN).

## Rozwój lokalny

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Testy

```bash
npm test
```

Deploy na GitHub Pages odbywa się automatycznie przez GitHub Actions (`.github/workflows/deploy.yml`) po pushu do `main`.
