# Aegis · NivaPay — Open Source Fintech Security Ops Desk

**Aegis** is an open-source **security operations desk** for a payments app (NivaPay demo). Incidents, tickets, sources, evals, and a human queue — so a payments SOC can see crash spikes and SCA findings in one place.

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](LICENSE)

## Features

- Incident queue with severity (P0+)
- Tickets, inbox, audit, and evals
- Source connectors (demo)
- Role-based desk
- Agent assist with human accept / reject

> Demo data only. Not a production SOC and not affiliated with a live payments brand.

## Who it is for

- Fintech / payments security teams prototyping a **SOC UI**
- AppSec folks teaching **incident → ticket** flow
- Developers pairing this with Conduit / MCP

## Quick start

```bash
git clone https://github.com/Akshit1018/S.Aegis.git
cd S.Aegis
npm install
VITE_AUTH_ENABLED=false npm run dev
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080).

## Tech stack

React 19 · TanStack Start · Vite · Tailwind · Zustand · Recharts

## License

[MIT](LICENSE)

## Keywords

security operations desk, fintech SOC, payments incident queue, SCA findings UI, open source SecOps dashboard, appsec evals
