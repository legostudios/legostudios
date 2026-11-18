# LEGO Studios site

React + TypeScript + Vite + Tailwind v4.

## Brand colours

Use these for all design work (defined as Tailwind theme tokens in `src/index.css`):

| Name   | Hex       | Token                 |
| ------ | --------- | --------------------- |
| Pink   | `#f238a7` | `--color-brand-pink`  |
| Sky    | `#79eede` | `--color-brand-sky`   |
| Yellow | `#e5fe02` | `--color-brand-yellow`|
| Black  | `#000000` | `--color-brand-black` |
| White  | `#ffffff` | `--color-brand-white` |

## Design rules

- Every page must work on all devices and aspect ratios (phones portrait/landscape,
  tablets, laptops, ultra-wide). Check with screenshots at several viewports.
- Videos go in `public/` compressed for the web (H.264 MP4, `+faststart`, no audio
  for background video), with a lighter 720p version for phones.
