-- Habilita extensão para geração de UUIDs (caso ainda não esteja ativa)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Pode ser NULO se o cadastro for via Google OAuth
    provider VARCHAR(50) DEFAULT 'local', -- 'local' ou 'google'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Tokens de Agente (Vínculo Seguro)
CREATE TABLE IF NOT EXISTS agent_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL, -- Armazena apenas o HASH por segurança
    name VARCHAR(100) DEFAULT 'Agente Principal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Computadores / Máquinas Vinculadas
CREATE TABLE IF NOT EXISTS computers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    machine_id VARCHAR(255) NOT NULL, -- UUID fixo gerado pelo agente na máquina
    hostname VARCHAR(255) NOT NULL,   -- ex: DESKTOP-DIOGO-PC
    os_info VARCHAR(255),            -- ex: Windows 11 Pro
    agent_version VARCHAR(50),       -- ex: 1.0.0
    last_ping TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_machine UNIQUE (user_id, machine_id)
);

-- 4. Tabela de Métricas Coletadas
CREATE TABLE IF NOT EXISTS metrics (
    id BIGSERIAL PRIMARY KEY,
    computer_id UUID NOT NULL REFERENCES computers(id) ON DELETE CASCADE,
    cpu_usage_percent NUMERIC(5,2) NOT NULL,        -- % de uso da CPU
    ram_total_bytes BIGINT NOT NULL,                 -- RAM Total em Bytes
    ram_used_bytes BIGINT NOT NULL,                  -- RAM Usada em Bytes
    ram_usage_percent NUMERIC(5,2) NOT NULL,        -- % de uso da RAM
    disks JSONB NOT NULL,                            -- Array de Discos em JSONB
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL,  -- Timestamp gerado no agente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Índices de Performance para o Dashboard
CREATE INDEX IF NOT EXISTS idx_metrics_computer_time ON metrics(computer_id, collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_computers_user ON computers(user_id);