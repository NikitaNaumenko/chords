# Аккорды

Личный песенник с аккордами для iPhone и iPad — PWA, работает офлайн, ставится на экран «Домой».

- Песни — файлы `songs/*.cho` в формате ChordPro (см. [songs/README.md](songs/README.md)). Правите в редакторе, коммитите, GitHub Actions выкладывает на GitHub Pages.
- В приложении можно добавлять и править песни — они хранятся в IndexedDB на устройстве. Экспорт/импорт через «Файлы» (iCloud Drive), резервная копия в JSON.
- Транспонирование, каподастр, три режима показа (классика / караоке / дорожка), аппликатуры по тапу на аккорд, автопрокрутка, сет-листы.

## Разработка

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # vitest
pnpm build        # dist/ (BASE_PATH=/chords/ pnpm build — как на GitHub Pages)
pnpm preview
pnpm icons        # перегенерировать иконки из public/icon.svg
```

## Деплой

1. Создайте репозиторий на GitHub (например, `chords`) и запушьте `main`.
2. Settings → Pages → Source: **GitHub Actions**.
3. После первого запуска workflow приложение доступно по `https://<user>.github.io/<repo>/`.
4. На iPhone: открыть адрес в Safari → «Поделиться» → «На экран Домой».

Стек: Vite 8, React 19, TypeScript, [chordsheetjs](https://github.com/martijnversluis/ChordSheetJS), [chords-db](https://github.com/tombatossals/chords-db), idb, vite-plugin-pwa.
