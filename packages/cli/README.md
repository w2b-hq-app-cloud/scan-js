# @spherescan/cli

Command-line tools for SCAN documents.

```bash
npm install -g @spherescan/cli
# or: npx scan ...
scan validate architecture.scan.yaml
scan export svg architecture.scan.yaml -o out.svg
```

From a local build:

```bash
node packages/cli/dist/cli.js validate packages/model/fixtures/order-platform.yaml
```

License: Apache-2.0.
