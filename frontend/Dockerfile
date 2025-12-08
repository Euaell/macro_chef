# Frontend Development Dockerfile
FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn; \
  elif [ -f package-lock.json ]; then npm install; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install; \
  else npm install; \
  fi

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "dev"]
