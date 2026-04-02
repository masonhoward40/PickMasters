# PickMaster's Backend - Complete Extraction & Architecture

**Generated:** March 31, 2026  
**Purpose:** Complete backend logic extraction for external deployment

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Business Logic](#business-logic)
6. [Code Samples](#code-samples)
7. [Deployment Guide](#deployment-guide)

---

## Overview

This document contains a complete extraction of ALL backend logic from PickMaster's. The backend handles:
- User authentication and authorization
- Contest group (pool) management
- Sports betting logic with line adjustments
- Game settlement and grading
- Payout calculation with tie handling
- Credit/balance management
- Golf draft functionality
- Background job scheduling

### Technology Stack
- **Runtime**: Node.js 18+
- **Database**: PostgreSQL 17
- **Query**: @neondatabase/serverless (neon SQL)
- **Authentication**: NextAuth.js → Passport.js/JWT
- **Password Hashing**: argon2
- **External APIs**: Odds API, Golf API

---

## Architecture

### Current Structure (Next.js API Routes)
```
/apps/web/src/app/api/
├── account/              # User account stats & transactions
├── admin/                # Admin operations
│   ├── groups/          # Group management
│   ├── users/           # User management
│   ├── templates/       # Group templates
│   ├── schedules/       # Job schedules
│   └── jobs/            # Job triggers
├── auth/                 # Authentication
├── bets/                 # Bet creation & submission
├── games/                # Game management & settlement
├── golf/                 # Golf draft features
│   ├── draft/           # Draft board, picks, queue
│   ├── scoring/         # Leaderboard calculation
│   └── tournaments/     # Tournament management
├── groups/               # Group CRUD, join, search
├── jobs/                 # Background jobs (sync, settle)
├── profile/              # User profile
└── utils/                # Shared utilities
    ├── sql.js           # Database connection
    ├── payoutCalculator.js
    ├── oddsApi.js
    ├── golfOddsApi.js
    └── adminAuth.js
```

### Proposed Modular Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── auth.js
│   │   └── constants.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── adminAuth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── Game.js
│   │   ├── Bet.js
│   │   └── Golf.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── groupController.js
│   │   ├── betController.js
│   │   ├── gameController.js
│   │   ├── golfController.js
│   │   ├── adminController.js
│   │   └── accountController.js
│   ├── services/
│   │   ├── betGrading.js
│   │   ├── payoutCalculator.js
│   │   ├── oddsSync.js
│   │   ├── scoreSync.js
│   │   ├── creditManager.js
│   │   └── draftEngine.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── groups.js
│   │   ├── bets.js
│   │   ├── games.js
│   │   ├── golf.js
│   │   ├── admin.js
│   │   └── account.js
│   ├── jobs/
│   │   ├── syncOdds.js
│   │   ├── syncScores.js
│   │   ├── settleGames.js
│   │   ├── createPublicGroups.js
│   │   └── scheduler.js
│   ├── utils/
│   │   ├── validation.js
│   │   ├── helpers.js
│   │   └── constants.js
│   └── index.js
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_groups.sql
│   ├── 003_create_games.sql
│   └── ...
├── .env.example
├── package.json
└── README.md
```

---

## Database Schema

### Authentication Tables

#### **auth_users**
```sql
CREATE TABLE auth_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(255) UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    name VARCHAR(255),
    image TEXT,
    role VARCHAR(50) DEFAULT 'user',      -- 'user' or 'admin'
    credit_balance NUMERIC(10,2) DEFAULT 0,
    email_verified TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON auth_users(email);
CREATE INDEX idx_users_username ON auth_users(username);
CREATE INDEX idx_users_role ON auth_users(role);
```

#### **auth_accounts**
```sql
CREATE TABLE auth_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,           -- 'credentials', 'oauth'
    provider VARCHAR(255) NOT NULL,        -- 'credentials', 'google', etc.
    provider_account_id VARCHAR(255) NOT NULL,
    password TEXT,                         -- Hashed (argon2) for email/password
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_accounts_user_id ON auth_accounts(user_id);
```

#### **auth_sessions**
```sql
CREATE TABLE auth_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX idx_sessions_token ON auth_sessions(session_token);
```

### Core Application Tables

#### **groups**
Contest groups (pools)
```sql
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    
    -- Sport configuration
    sport_key VARCHAR(50),                 -- Primary sport (legacy)
    sport_keys JSONB DEFAULT '[]',         -- Multiple sports support
    
    -- Group settings
    max_participants INTEGER NOT NULL,
    buy_in NUMERIC(10,2) NOT NULL,
    required_picks INTEGER NOT NULL,
    
    -- Payout configuration
    payout_structure JSONB NOT NULL DEFAULT '{"label": "Custom Payout"}',
    payout_type VARCHAR(20) DEFAULT 'legacy',
    payout_rules JSONB,
    
    -- Access control
    visibility VARCHAR(20) DEFAULT 'public',  -- 'public' or 'private'
    invite_code VARCHAR(20) UNIQUE,
    password_hash TEXT,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'open',        -- 'open', 'in_progress', 'completed'
    is_deleted BOOLEAN DEFAULT false,
    is_user_created BOOLEAN DEFAULT false,    -- User-created vs system-created
    is_discoverable BOOLEAN DEFAULT true,     -- Show in public browse
    
    -- Financials
    pot_amount NUMERIC(10,2) DEFAULT 0,
    payout_status VARCHAR(20) DEFAULT 'pending',
    payout_processed_at TIMESTAMP,
    
    -- Game mode
    game_mode VARCHAR(50) DEFAULT 'PICKS',    -- 'PICKS' or 'GOLF_DRAFT'
    
    -- Timestamps
    entries_locked_at TIMESTAMP,
    window_start TIMESTAMP,
    window_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    description TEXT,
    created_by_user_id INTEGER REFERENCES auth_users(id) ON DELETE SET NULL,
    template_id INTEGER REFERENCES group_templates(id) ON DELETE SET NULL,
    auto_created BOOLEAN DEFAULT false
);

CREATE INDEX idx_groups_status ON groups(status);
CREATE INDEX idx_groups_visibility ON groups(visibility);
CREATE INDEX idx_groups_sport_key ON groups(sport_key);
CREATE INDEX idx_groups_created_by ON groups(created_by_user_id);
CREATE INDEX idx_groups_invite_code ON groups(invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX idx_groups_discoverable ON groups(is_user_created, is_discoverable, status);
```

#### **games**
Sporting events
```sql
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    
    -- Teams
    home_team VARCHAR(255) NOT NULL,
    away_team VARCHAR(255) NOT NULL,
    
    -- Sport
    sport VARCHAR(50) DEFAULT 'basketball',
    sport_key VARCHAR(50),                     -- e.g., 'basketball_nba'
    
    -- Lines
    spread NUMERIC(4,1) NOT NULL,              -- e.g., -7.5
    over_under NUMERIC(4,1) NOT NULL,          -- e.g., 215.5
    
    -- Scores
    home_score INTEGER,
    away_score INTEGER,
    
    -- Status
    game_date TIMESTAMP,
    start_time_utc TIMESTAMP,
    settled BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'upcoming',     -- 'upcoming', 'live', 'completed'
    finalized_at TIMESTAMP,
    
    -- External API tracking
    odds_api_event_id VARCHAR(255) UNIQUE,
    last_odds_sync_at TIMESTAMP,
    last_score_sync_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_games_sport_key ON games(sport_key);
CREATE INDEX idx_games_start_time ON games(start_time_utc);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_settled ON games(settled) WHERE NOT settled;
CREATE INDEX idx_games_odds_api_id ON games(odds_api_event_id);
```

#### **bets**
User picks/bets
```sql
CREATE TABLE bets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    
    -- Bet details
    bet_type VARCHAR(50) NOT NULL,             -- 'spread' or 'over_under'
    selected_team VARCHAR(255),                -- Team name (for spread)
    direction VARCHAR(10),                     -- 'over' or 'under' (for O/U)
    
    -- Line adjustment
    base_line NUMERIC(4,1),                    -- Original line
    adjustment NUMERIC(4,1),                   -- Adjustment amount
    adjusted_line NUMERIC(4,1) NOT NULL,       -- Final line used
    points_if_win NUMERIC(4,1) NOT NULL,       -- Points if bet wins
    
    -- Results
    points_earned NUMERIC(4,1),                -- Actual points earned
    result VARCHAR(10),                        -- 'WIN', 'LOSS', 'PUSH', NULL
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft',        -- 'draft' or 'submitted'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: One bet per game+type per user per group
    UNIQUE(user_id, group_id, game_id, bet_type)
);

CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_group_id ON bets(group_id);
CREATE INDEX idx_bets_game_id ON bets(game_id);
CREATE INDEX idx_bets_status ON bets(status);
```

#### **user_groups**
Group membership
```sql
CREATE TABLE user_groups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    picks_finalized BOOLEAN DEFAULT false,
    picks_submitted_at TIMESTAMP,
    total_points NUMERIC(10,2) DEFAULT 0,
    UNIQUE(user_id, group_id)
);

CREATE INDEX idx_user_groups_user_id ON user_groups(user_id);
CREATE INDEX idx_user_groups_group_id ON user_groups(group_id);
```

#### **group_games**
Games linked to groups
```sql
CREATE TABLE group_games (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, game_id)
);

CREATE INDEX idx_group_games_group_id ON group_games(group_id);
CREATE INDEX idx_group_games_game_id ON group_games(game_id);
```

#### **group_results**
Final results for completed groups
```sql
CREATE TABLE group_results (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    total_points NUMERIC(10,2) DEFAULT 0 NOT NULL,
    final_rank INTEGER NOT NULL,
    winnings NUMERIC(10,2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_results_group_id ON group_results(group_id);
CREATE INDEX idx_group_results_user_id ON group_results(user_id);
```

### Financial Tables

#### **ledger**
Complete transaction history
```sql
CREATE TABLE ledger (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,     -- 'buy_in', 'payout', 'credit_add', 'credit_remove'
    amount_cents INTEGER NOT NULL,             -- Amount in cents (negative for debits)
    balance_after_cents INTEGER NOT NULL,      -- Snapshot of balance after transaction
    group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledger_user_id ON ledger(user_id);
CREATE INDEX idx_ledger_group_id ON ledger(group_id);
CREATE INDEX idx_ledger_created_at ON ledger(created_at);
```

#### **payout_runs**
Payout processing log
```sql
CREATE TABLE payout_runs (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'running' NOT NULL,  -- 'running', 'completed', 'partial', 'failed'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    started_by_user_id INTEGER REFERENCES auth_users(id) ON DELETE SET NULL,
    total_participants INTEGER DEFAULT 0,
    winners_count INTEGER DEFAULT 0,
    total_amount NUMERIC(10,2) DEFAULT 0,
    paid_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB
);

CREATE INDEX idx_payout_runs_group_id ON payout_runs(group_id);
CREATE INDEX idx_payout_runs_status ON payout_runs(status);
CREATE UNIQUE INDEX idx_payout_runs_active_group ON payout_runs(group_id) WHERE status = 'running';
```

### Golf Tables

#### **golf_tournaments**
```sql
CREATE TABLE golf_tournaments (
    tournament_id SERIAL PRIMARY KEY,
    tournament_name VARCHAR(255) NOT NULL,
    tour_type VARCHAR(50) NOT NULL,            -- 'PGA', 'MAJOR'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'UPCOMING',     -- 'UPCOMING', 'DRAFTING', 'LIVE', 'COMPLETED'
    odds_tournament_key VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_golf_tournaments_status ON golf_tournaments(status);
CREATE INDEX idx_golf_tournaments_tour_type ON golf_tournaments(tour_type);
```

#### **golf_golfers**
```sql
CREATE TABLE golf_golfers (
    golfer_id SERIAL PRIMARY KEY,
    golfer_name VARCHAR(255) NOT NULL,
    odds_api_golfer_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_golf_golfers_name ON golf_golfers(golfer_name);
```

#### **golf_draft_configs**
```sql
CREATE TABLE golf_draft_configs (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL UNIQUE REFERENCES groups(id) ON DELETE CASCADE,
    tournament_id INTEGER NOT NULL REFERENCES golf_tournaments(tournament_id),
    draft_start_time TIMESTAMP NOT NULL,
    draft_order_mode VARCHAR(50) DEFAULT 'AUTO_RANDOM',  -- 'AUTO_RANDOM', 'MANUAL'
    draft_type VARCHAR(50) DEFAULT 'SNAKE',              -- 'SNAKE', 'LINEAR'
    time_per_pick_seconds INTEGER DEFAULT 60,
    roster_size INTEGER DEFAULT 5,
    daily_top_x_counted INTEGER DEFAULT 4,
    auto_pick_on_timeout BOOLEAN DEFAULT true,
    draft_status VARCHAR(50) DEFAULT 'PENDING',          -- 'PENDING', 'LIVE', 'COMPLETED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_golf_draft_configs_tournament ON golf_draft_configs(tournament_id);
CREATE INDEX idx_golf_draft_configs_status ON golf_draft_configs(draft_status);
```

#### **golf_draft_picks**
```sql
CREATE TABLE golf_draft_picks (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    golfer_id INTEGER NOT NULL REFERENCES golf_golfers(golfer_id),
    pick_number INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    picked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, golfer_id),
    UNIQUE(group_id, pick_number)
);

CREATE INDEX idx_golf_draft_picks_group ON golf_draft_picks(group_id);
CREATE INDEX idx_golf_draft_picks_user ON golf_draft_picks(user_id);
```

#### **golf_draft_queue**
```sql
CREATE TABLE golf_draft_queue (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    golfer_id INTEGER NOT NULL REFERENCES golf_golfers(golfer_id),
    queue_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id, golfer_id)
);
```

### System Tables

#### **group_templates**
```sql
CREATE TABLE group_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sport_key VARCHAR(50) NOT NULL,
    buy_in_amount NUMERIC(10,2) NOT NULL,
    max_players INTEGER NOT NULL,
    required_picks INTEGER NOT NULL,
    payout_structure_json JSONB NOT NULL,
    cadence VARCHAR(20) DEFAULT 'daily' NOT NULL,     -- 'daily', 'weekly'
    game_window_hours INTEGER DEFAULT 24 NOT NULL,
    is_active BOOLEAN DEFAULT true,
    selection_mode VARCHAR(20) DEFAULT 'auto',        -- 'auto', 'manual'
    game_ids INTEGER[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_group_templates_active ON group_templates(is_active, sport_key);
```

#### **job_schedules**
```sql
CREATE TABLE job_schedules (
    id SERIAL PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL,
    sport_key VARCHAR(50),
    sport_scope VARCHAR(20) DEFAULT 'all',            -- 'all', 'single'
    schedule_type VARCHAR(20) DEFAULT 'interval' NOT NULL,
    interval_seconds INTEGER,
    cron_expression TEXT,
    timezone VARCHAR(50) DEFAULT 'America/Chicago',
    window_start_time TIME,
    window_end_time TIME,
    days_of_week JSONB,
    enabled BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    claimed_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_schedules_enabled ON job_schedules(enabled, next_run_at);
CREATE INDEX idx_job_schedules_job_type ON job_schedules(job_type);
```

#### **job_runs**
```sql
CREATE TABLE job_runs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    sport_key VARCHAR(50),
    schedule_id INTEGER REFERENCES job_schedules(id) ON DELETE SET NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'running',
    events_processed INTEGER DEFAULT 0,
    errors TEXT,
    metadata JSONB
);

CREATE INDEX idx_job_runs_job_name ON job_runs(job_name);
CREATE INDEX idx_job_runs_started_at ON job_runs(started_at);
```

---

## API Endpoints

[**CONTINUED IN NEXT MESSAGE DUE TO LENGTH**]
