# Hodowca

Webowy klon klasycznej gry o hodowaniu zwierząt, rzucaniu kostkami, wymianie zwierząt i unikaniu drapieżników. Hostowany statycznie na GitHub Pages, bez backendu.

Gra jest fanowską, niekomercyjną implementacją inspirowaną klasyczną mechaniką gier typu "zbieraj i wymieniaj" — nie jest powiązana z żadnym konkretnym wydawcą ani wydaniem pudełkowym.

## Tryby gry

- **Hot seat** — 2–6 graczy na zmianę na jednym urządzeniu (można dorzucić boty do składu).
- **LAN / Online** — każdy gracz na swoim urządzeniu, w tej samej lub różnych sieciach (WebRTC przez [Trystero](https://github.com/dmotz/trystero), bez backendu i bez centralnego serwera gry). Host może dorzucić boty do lobby — boty nigdy nie są osobnymi uczestnikami sieci, ich tury rozgrywa lokalnie host.
- **Gra z komputerem** — solo kontra 1–5 botów sterowanych prostą heurystyką (poziom agresywności do wyboru).

Jeśli host rozłączy się w trakcie gry online/LAN, pozostali gracze automatycznie wybierają nowego hosta (najniższe ID w składzie) i gra toczy się dalej bez przerywania.

## Zasady w skrócie

- **Rzut kośćmi:** raz na turę, dwie kostki tematyczne — mała (króliki/owce + lis) i duża (świnie/krowy/konie + wilk). Zwierzę z puli głównej trafia do Twojej hodowli; jeśli puli zabraknie, nic się nie dzieje.
- **Drapieżniki:** lis zjada cały mały zagon (króliki+owce), wilk cały duży zagon (świnie+krowy+konie) — chyba że masz odpowiedniego psa (mały pies na lisa, duży na wilka). **Pies zużywa się broniąc stada** i wraca do wspólnej puli — trzeba go zdobyć ponownie.
- **Wymiana:** do 3 wymian na turę między Twoją hodowlą a pulą główną (6 królików→1 owca→...→krowa→koń→pies), tylko w górę drabinki, tylko jeśli pula ma zapas docelowego zwierzęcia.
- **Zwycięstwo:** posiadanie jednocześnie co najmniej 1 sztuki każdego zwierzęcia (królik, owca, świnia, krowa, koń) oraz obu psów.

Pełne przeliczniki i zasady dostępne w grze pod przyciskiem **?** na planszy.

## Struktura projektu

- `src/engine` — czysta logika gry (kości, drapieżniki, wymiana, tury, warunek zwycięstwa, AI botów), niezależna od UI i sieci; w pełni pokryta testami jednostkowymi (Vitest).
- `src/net` — cienka warstwa transportowa nad Trystero (WebRTC), używana w trybie online/LAN.
- `src/ui` — komponenty widoku (React), globalny store (Zustand, `src/ui/store.ts`), hooki (timer tury, automatyczne tury botów), tłumaczenia (react-i18next: PL/EN w `src/locales`).

## Rozwój lokalny

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Testy i lint

```bash
npm test
npm run lint
```

Deploy na GitHub Pages odbywa się automatycznie przez GitHub Actions (`.github/workflows/deploy.yml`) po pushu do `main`.
