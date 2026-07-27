# Changelog

All notable changes to SCAN (`scan-js`) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] â€” 2026-07-26

### Added

- `@spherescan/model` â€” parse, serialize, validate SCAN 0.1 YAML/JSON
- `@spherescan/rules` â€” connection legality
- `@spherescan/viewer` â€” graph projection and SVG/PNG export
- `@spherescan/modeler` â€” command stack editing API
- `@spherescan/cli` â€” `scan validate` / `scan export svg`
- Reference whiteboard (`apps/whiteboard`)
- Normative spec (`docs/spec/scan-0.1.md`, CC BY 4.0)
- Reference AI skill (`skills/scan-notation/`, Apache 2.0)
- Dual licensing (CC BY 4.0 spec / Apache 2.0 software), NOTICE, TRADEMARKS

### Notes

- `@spherescan/board` remains a **private** workspace package (not published) until 0.2
- Legacy `sphere:` YAML root and `Sphere*` API aliases are supported for compatibility
