FROM node:20-bookworm-slim

ARG VITE_API_URL=http://localhost:3001/api

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV VITE_API_URL=$VITE_API_URL

RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build

WORKDIR /app/examples/fullstack/web

ENV NODE_ENV=production

EXPOSE 5173

CMD ["pnpm", "preview"]
