# Self-host the reference whiteboard

The SCAN whiteboard is a static Vite app under `apps/whiteboard`.

## Dev server

```bash
npm install --legacy-peer-deps
npm run build
npm run dev
```

## Production static build

```bash
npm install --legacy-peer-deps
npm run build
# whiteboard dist is produced by the @spherescan/whiteboard build workspace
```

Serve `apps/whiteboard/dist` with any static file server (nginx, GitHub Pages, Cloudflare Pages, etc.).

## Docker (optional)

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps && npm run build

FROM nginx:alpine
COPY --from=build /app/apps/whiteboard/dist /usr/share/nginx/html
```

This ships the **reference modeler only** - not Sphere product hosting, collab, or AI services.
