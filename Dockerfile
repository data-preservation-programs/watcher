FROM public.ecr.aws/docker/library/node:16
WORKDIR /app
COPY package* ./
RUN npm ci --production
COPY ./dist .
