FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /server

COPY package*.json pnpm-lock.yaml ./

RUN pnpm config set registry https://registry.npmjs.org

RUN pnpm install

COPY . .

RUN pnpm run build

EXPOSE ${SERVER_PORT}

CMD ["pnpm", "run", "start:prod"]