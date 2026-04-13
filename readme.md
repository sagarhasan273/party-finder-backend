# Valorant 5th Player Finder (LFG App)

**"Never queue as a cursed 4-stack again."**

A real-time social matchmaking platform built specifically for Valorant players who hate the Competitive queue's 4-player restriction.  
When 4 friends are in a party, they **cannot** start a game — this app instantly connects them with a trusted 5th player (or lets solo/duo players jump into ready-made 4-stacks).

**Live since 2026** — Built with **Node.js + React + MUI + TypeScript** (full-stack TypeScript monorepo).

---

## 🎯 Problem It Solves (The 4-Stack Pain)

- Valorant Competitive only allows 1, 2, 3, or **5** players in a party.
- 4-stacks are forced to either:
  - Kick someone (toxic)
  - Add a random (risky)
  - Play unrated/deathmatch
- Our app turns every 4-stack into a **"Need 1" beacon** and every solo player into a **"Ready to fill"** hero.

---

## ✨ Core Features

### For 4-Stack Hosts

- Create a **"Need 1" Beacon** in < 10 seconds
- Auto-filled: current stack ranks (via Riot API), region, playstyle (Chill / Sweaty / Ranked Grind)
- One-tap copy Riot ID + Discord voice link
- Beacon auto-expires when game starts

### For Solo / Duo Players

- Real-time feed of active 4-stacks filtered by **your rank + region**
- Smart matching algorithm (rank disparity warning + role preference)
- Instant "Join Party" → in-game invite + voice channel

### Shared Social Layer

- **OAuth2 Riot Sign-On** (RSO) — no passwords, fully compliant
- Profile with editable fields + **mandatory Valorant rank sync**
- Users are **active by default** while logged in (green dot + "Online in Valorant")
- Karma / Endorsement system ("Good Comms", "Great Entry", "No Toxicity")
- Push notifications (Web + future PWA) when a perfect 4-stack appears

### Smart Region Detection (Production-Ready)

- Backend IP geolocation (ipinfo.io) → maps to Valorant regions (NA / LATAM / BR / EU / AP / KR)
- Haversine distance fallback for cross-region tolerance
- Users can override in profile

---

## 🏗️ System Architecture (High-Level)

```mermaid
graph TD
    subgraph "Frontend (React + MUI + TypeScript)"
        A[Landing + Auth] --> B[Profile (Rank Sync + Region)]
        B --> C[Dashboard]
        C --> D[Lobby Feed - Real-time 4-Stacks]
        D --> E[Create Beacon / Join Party]
        E --> F[Notifications + WebSocket]
    end

    subgraph "Backend (Node.js + Express + TypeScript)"
        G[API Layer] --> H[WebSocket Server (Socket.io)]
        H --> I[Redis Pub/Sub (Live Beacons)]
        G --> J[MongoDB (Users + Beacons + Sessions)]
        G --> K[Riot Games API (VAL-RANKED-V1 + RSO)]
        K --> L[Rank Verification & Sync]
        G --> M[Geo Service (ipinfo.io + Haversine)]
    end

    subgraph "External Services"
        N[Riot Developer Portal (OAuth2 + API)]
        O[ipinfo.io (Region Detection)]
        P[Firebase / Web Push (Notifications)]
        Q[Redis (Rate limiting + Caching)]
    end

    Frontend --> Backend
    Backend <--> External
```
