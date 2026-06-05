FROM node:20-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build

WORKDIR /app/examples/fullstack/api

ENV NODE_ENV=production

EXPOSE 3001

CMD ["sh", "-c", "pnpm db:migrate:deploy && pnpm db:seed && pnpm start"]
