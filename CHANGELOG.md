# Changelog

All notable changes to SCAN (`scan-js`) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- `@spherescan/board`: AI YAML preview now shows visual line numbers in the preview gutter for reference, while copy-to-clipboard still copies raw YAML only (no numbers).
- `@spherescan/board`: removed the decorative "Preview changes" checkbox from the AI bar; agent replies always open the preview drawer.
- `skills/scan-notation`: prefer **outer-shell** boundaries when recreating from diagrams; do not nest or mirror every inner visual subgroup.

## [0.1.0] - 2026-07-26

### Added

- `@spherescan/model` - parse, serialize, validate SCAN 0.1 YAML/JSON
- `@spherescan/rules` - connection legality
- `@spherescan/viewer` - graph projection and SVG/PNG export
- `@spherescan/modeler` - command stack editing API
- `@spherescan/cli` - `scan validate` / `scan export svg`
- Reference whiteboard (`apps/whiteboard`)
- Normative spec (`docs/spec/scan-0.1.md`, CC BY 4.0)
- Reference AI skill (`skills/scan-notation/`, Apache 2.0)
- Dual licensing (CC BY 4.0 spec / Apache 2.0 software), NOTICE, TRADEMARKS

### Notes

- `@spherescan/board` remains a **private** workspace package (not published) until 0.2
- Legacy `sphere:` YAML root and `Sphere*` API aliases are supported for compatibility
