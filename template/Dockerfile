FROM node:lts-alpine AS builder

RUN mkdir /app
RUN chown 1000:1000 /app
WORKDIR /app
USER 1000:1000
COPY --chown=1000:1000 . /app
RUN npm install
RUN npm run build
RUN npm ci --omit=dev

FROM node:lts-alpine
RUN mkdir /app
RUN chown 1000:1000 /app
WORKDIR /app
USER 1000:1000
COPY --from=builder --chown=1000:1000 /app /app
CMD ["src/index.js"]
