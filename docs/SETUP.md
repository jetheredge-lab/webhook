# Setup Guide

## Prerequisites
- Docker & Docker-compose
- Node.js 20 LTS wrapper minimum (for local TS testing)

## Steps
1. Setup the network natively:
`cp .env.example .env`

2. Boot database instance
`docker-compose up -d postgres`

3. Migrate schema
`cd backend && npx prisma migrate dev --name init`

4. Validate Backend / Setup Dev
`npm run dev` in `/backend` and `npm run dev` in `/frontend`.
