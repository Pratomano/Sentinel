# 🛡️ Sentinel — Documentação Geral

> Guia para quem quer **clonar, entender, rodar e evoluir** o projeto.
>
> - Requisitos oficiais do desafio: [`docs/context/README.md`](./context/README.md)
> - Detalhes técnicos internos e dívidas conhecidas: [`docs/context/AI_CONTEXT.md`](./context/AI_CONTEXT.md)

---

## Sumário

1. [O que é o Sentinel](#1-o-que-é-o-sentinel)
2. [Arquitetura](#2-arquitetura)
3. [Regras de Negócio](#3-regras-de-negócio)
4. [Pré-requisitos](#4-pré-requisitos)
5. [Como rodar localmente (passo a passo)](#5-como-rodar-localmente-passo-a-passo)
6. [Variáveis de ambiente](#6-variáveis-de-ambiente)
7. [Referência de comandos](#7-referência-de-comandos)
8. [Referência da API](#8-referência-da-api)
9. [Modelo de dados](#9-modelo-de-dados)
10. [Agente Windows](#10-agente-windows)
11. [Deploy](#11-deploy)
12. [Convenções do projeto](#12-convenções-do-projeto)
13. [Solução de problemas](#13-solução-de-problemas)
14. [Limitações conhecidas](#14-limitações-conhecidas)

---

## 1. O que é o Sentinel

O **Sentinel** é uma plataforma de monitoramento de computadores Windows. A jornada do usuário é:

1. Criar uma conta (e-mail/senha) ou entrar com **Google**.
2. No dashboard, gerar uma **chave de agente** (`stn_...`).
3. Baixar o **agente Windows** (`sentinel-agent.exe`), colar a chave e deixar rodando.
4. O agente envia periodicamente **CPU, RAM e discos** para a API.
5. O dashboard lista cada computador, seu status **online/offline** e a última leitura.

---

## 2. Arquitetura

Monorepo com três componentes independentes:

```
project_james_bond/
├── api/     → Backend   (NestJS 11 + Prisma 6 + PostgreSQL)
├── web/     → Frontend  (React 19 + Vite 8 + Tailwind CSS 4 + TypeScript)
├── agent/   → Agente    (Python 3 + psutil + requests + Tkinter → .exe via PyInstaller)
└── docs/    → Documentação
```

```mermaid
flowchart LR
    U["Usuário (navegador)"] -->|HTTPS| W["web (SPA React)"]
    W -->|"Axios + Bearer JWT"| A["api (NestJS)"]
    U -->|"OAuth"| G["Google"]
    G -->|"callback"| A
    A -->|"redirect ?token=JWT"| W
    AG["agent (.exe Windows)"] -->|"POST /agent/metrics + x-agent-token"| A
    A -->|Prisma| DB[("PostgreSQL")]
```

### Duas credenciais diferentes

| Credencial | Usada por | Formato | Onde trafega | Validade |
|---|---|---|---|---|
| **JWT do usuário** | Frontend | JWT `{ sub, email }` | `Authorization: Bearer <jwt>` | 1 dia |
| **Token do agente** | Agente Windows | `stn_` + 48 caracteres hex | `x-agent-token: <token>` | Sem expiração |

---

## 3. Regras de Negócio

### 3.1 Contas e autenticação

| ID | Regra |
|---|---|
| **RN-01** | O e-mail é **único** no sistema. Cadastro com e-mail existente retorna `409 – E-mail já cadastrado no sistema`. |
| **RN-02** | Cadastro exige **nome**, **e-mail válido** e **senha com no mínimo 6 caracteres** (validado no front com Zod e na API com `class-validator`). O front exige nome com ≥ 3 caracteres. |
| **RN-03** | Senhas nunca são salvas em texto puro: são armazenadas como hash **bcrypt** (10 salt rounds). |
| **RN-04** | Login com credenciais erradas (e-mail inexistente **ou** senha errada) retorna a mesma mensagem genérica `401 – Credenciais inválidas`, para não revelar quais e-mails existem. |
| **RN-05** | Usuários criados via Google não possuem senha (`password_hash = NULL`, `provider = google`) e, portanto, **não conseguem logar por e-mail/senha**. |
| **RN-06** | Se um usuário entrar com Google usando um e-mail que já existe como conta local, a **mesma conta** é reaproveitada (vinculação pelo e-mail). |
| **RN-07** | Após o cadastro por e-mail/senha, o usuário é redirecionado para a tela de **login**. |
| **RN-08** | A sessão do frontend é mantida no `localStorage` (`@sentinel:token` e `@sentinel:user`). O logout apaga ambos. |
| **RN-09** | O JWT expira em **1 dia**. |

### 3.2 Chave (token) do agente

| ID | Regra |
|---|---|
| **RN-10** | Apenas usuários autenticados podem gerar chaves (`POST /agent/tokens`). |
| **RN-11** | A chave tem o formato `stn_` + 24 bytes aleatórios em hexadecimal. |
| **RN-12** | O banco guarda **somente o hash SHA-256** da chave. O valor em texto puro é exibido **uma única vez**, no momento da geração — se o usuário perder, precisa gerar outra. |
| **RN-13** | Um usuário pode gerar **várias chaves**; todas permanecem válidas (não há revogação nem expiração no momento). |
| **RN-14** | A mesma chave pode ser usada em **vários computadores** do mesmo usuário. |

### 3.3 Ingestão de métricas

| ID | Regra |
|---|---|
| **RN-15** | Requisições sem o header `x-agent-token` são recusadas com `401 – Token do agente ausente`. |
| **RN-16** | Chaves que não correspondem a nenhum hash salvo são recusadas com `401 – Token inválido ou revogado`. |
| **RN-17** | **Isolamento entre usuários:** o dono dos dados é sempre deduzido **da chave**, nunca de campos enviados no corpo da requisição. |
| **RN-18** | Um computador é identificado pelo par **(usuário, `machineId`)**. Se o par não existe, o computador é criado; se existe, o `hostname` e o `lastPing` são atualizados (*upsert*). |
| **RN-19** | Cada envio aceito gera **uma nova linha** de métrica (histórico). |
| **RN-20** | O horário da leitura (`collected_at`) é o **horário do servidor** no momento do recebimento. |
| **RN-21** | O payload é validado: campos desconhecidos são rejeitados (`400`), e todos os campos obrigatórios precisam ter o tipo correto. |

### 3.4 Dashboard

| ID | Regra |
|---|---|
| **RN-22** | O usuário vê **apenas os seus** computadores (filtro pelo `id` do JWT). |
| **RN-23** | Os computadores são ordenados pelo **último contato** (mais recente primeiro). Cada um traz somente a **última** leitura. |
| **RN-24** | O dashboard atualiza os dados automaticamente a cada **5 segundos** (polling). |
| **RN-25** | Um computador é considerado **Online** se o último contato ocorreu há **menos de 25 segundos**; caso contrário, **Offline**. |
| **RN-26** | Cores das barras de uso: **≥ 85%** vermelho/rosa · **≥ 65%** âmbar · abaixo disso, verde. |
| **RN-27** | O download do agente é feito pelo link `/sentinel-agent.exe`, servido estaticamente pelo frontend. |

### 3.5 Agente Windows

| ID | Regra |
|---|---|
| **RN-28** | O agente roda **sem privilégios de administrador**. |
| **RN-29** | Intervalo de envio configurável entre **1 e 300 segundos** (padrão: **5s**). |
| **RN-30** | O usuário pode desligar a coleta de **CPU**, **RAM** e/ou **Discos** individualmente (privacidade). Itens desligados são enviados com valor `0` / lista vazia. |
| **RN-31** | Sem chave preenchida, o agente **não envia nada** e mostra um aviso no console. |
| **RN-32** | O monitoramento pode ser **pausado e retomado** sem fechar o programa. |
| **RN-33** | As preferências são salvas em `config.json`, **na mesma pasta do executável**, apenas ao clicar em **"Salvar Preferências"**. |
| **RN-34** | O `machineId` é `<nome do computador>-<sistema>` (ex.: `DESKTOP-ABC-Windows`). Discos inacessíveis (ex.: leitor vazio) são ignorados. |

---

## 4. Pré-requisitos

| Ferramenta | Versão sugerida | Para quê |
|---|---|---|
| **Node.js** | 20 LTS ou superior | API e frontend |
| **npm** | Acompanha o Node | Gerenciar dependências |
| **PostgreSQL** | 14+ (local, Docker ou nuvem como Neon/Supabase/Render) | Banco de dados |
| **Python** | 3.10+ (com Tkinter, que já vem no instalador oficial do Windows) | Agente |
| **Git** | Qualquer recente | Clonar o repositório |
| **Conta Google Cloud** | Opcional | Login com Google (OAuth) |

---

## 5. Como rodar localmente (passo a passo)

### 5.1 Clonar

```bash
git clone https://github.com/Pratomano/Sentinel.git
cd Sentinel
```

### 5.2 Banco de dados (opção rápida com Docker)

```bash
docker run --name sentinel-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sentinel -p 5432:5432 -d postgres:16
```

> Sem Docker? Use qualquer PostgreSQL acessível e ajuste a `DATABASE_URL`.

### 5.3 API (`api/`)

```bash
cd api
npm install
```

Copie `api/.env.example` para `api/.env` e ajuste os valores:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sentinel"
JWT_SECRET="troque-por-um-segredo-forte"
PORT=3000
FRONTEND_URL="http://localhost:5173"

# Opcional — apenas se for usar login com Google
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"
```

Crie as tabelas e suba o servidor:

```bash
npx prisma db push      # cria/atualiza as tabelas a partir do schema.prisma
npm run start:dev       # http://localhost:3000
```

> Alternativa ao `db push`: executar manualmente o script [`api/schema.sql`](../api/schema.sql) no banco.

### 5.4 Frontend (`web/`)

Em outro terminal:

```bash
cd web
npm install
```

Copie `web/.env.example` para `web/.env`:

```env
VITE_API_URL="http://localhost:3000"
```

```bash
npm run dev             # http://localhost:5173
```

### 5.5 Agente (`agent/`)

Em outro terminal (Windows):

```powershell
cd agent
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

> [!IMPORTANT]
> Por padrão o agente envia para a **API de produção**. Para testar contra a sua API local, crie o arquivo `agent/config.json`:

```json
{
  "api_url": "http://localhost:3000/agent/metrics",
  "token": "",
  "interval_seconds": 5,
  "collect_cpu": true,
  "collect_ram": true,
  "collect_disks": true
}
```

```powershell
python agent.py
```

### 5.6 Testando a jornada completa

1. Acesse `http://localhost:5173/register` e crie uma conta.
2. Faça login.
3. No dashboard, clique em **"Gerar Chave de Agente"** e copie a chave.
4. Cole a chave no agente e clique em **"Salvar Preferências"**.
5. Em até ~5 segundos o computador aparece no dashboard como **Online**.

---

## 6. Variáveis de ambiente

| Variável | Componente | Obrigatória | Descrição |
|---|---|---|---|
| `DATABASE_URL` | api | ✅ | String de conexão do PostgreSQL usada pelo Prisma |
| `JWT_SECRET` | api | ✅ (em produção) | Segredo de assinatura do JWT |
| `PORT` | api | — | Porta HTTP (padrão `3000`) |
| `FRONTEND_URL` | api | ✅ (em produção) | Origem liberada no CORS e destino do redirect pós-Google (padrão `http://localhost:5173`) |
| `GOOGLE_CLIENT_ID` | api | Para OAuth | Credencial do Google Cloud |
| `GOOGLE_CLIENT_SECRET` | api | Para OAuth | Credencial do Google Cloud |
| `GOOGLE_CALLBACK_URL` | api | Para OAuth | Ex.: `http://localhost:3000/auth/google/callback` |
| `VITE_API_URL` | web | ✅ | URL base da API (lida em **tempo de build**; padrão `http://localhost:3000`) |

> [!CAUTION]
> Nunca faça commit de arquivos `.env`. O `.gitignore` já os ignora, assim como `agent/config.json` (que contém a chave do agente).

### Configurando o login com Google (opcional)

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) → **APIs e serviços** → **Credenciais**.
2. Crie um **ID do cliente OAuth** do tipo **Aplicativo da Web**.
3. Em **URIs de redirecionamento autorizados**, adicione o valor de `GOOGLE_CALLBACK_URL`.
4. Copie o Client ID e o Client Secret para o `api/.env`.

---

## 7. Referência de comandos

### 7.1 API (`api/`)

| Comando | O que faz |
|---|---|
| `npm install` | Instala dependências |
| `npm run start:dev` | Sobe a API em modo desenvolvimento com *hot reload* |
| `npm run start:debug` | Igual ao anterior, com debugger habilitado |
| `npm run build` | `prisma generate` + compila para `dist/` |
| `npm run start:prod` | Executa a versão compilada (`node dist/main`) |
| `npm run start` | Sobe a API sem *watch* |
| `npm run lint` | ESLint com correção automática |
| `npm run format` | Formata o código com Prettier |
| `npm run test` | Testes unitários (Jest) |
| `npm run test:e2e` | Testes end-to-end |
| `npm run test:cov` | Testes com relatório de cobertura |
| `npm run db:generate` | Gera o Prisma Client |
| `npx prisma db push` | Sincroniza o schema com o banco (cria/altera tabelas) |
| `npx prisma studio` | Abre uma interface web para visualizar o banco |

### 7.2 Frontend (`web/`)

| Comando | O que faz |
|---|---|
| `npm install` | Instala dependências |
| `npm run dev` | Servidor de desenvolvimento Vite (`:5173`) |
| `npm run build` | Checagem de tipos (`tsc -b`) + build de produção em `dist/` |
| `npm run preview` | Serve localmente o build de produção |
| `npm run lint` | ESLint |

### 7.3 Agente (`agent/`)

| Comando | O que faz |
|---|---|
| `python -m venv venv` | Cria ambiente virtual |
| `venv\Scripts\activate` | Ativa o ambiente (PowerShell/CMD) |
| `pip install -r requirements.txt` | Instala `psutil` e `requests` |
| `python agent.py` | Executa o agente com interface gráfica |
| `pip install pyinstaller` | Instala o empacotador (não está no `requirements.txt`) |
| `pyinstaller --onefile --noconsole --name sentinel-agent agent.py` | Gera `dist/sentinel-agent.exe` |

Para publicar uma nova versão do agente, copie o executável gerado para `web/public/sentinel-agent.exe`:

```powershell
Copy-Item .\dist\sentinel-agent.exe ..\web\public\sentinel-agent.exe -Force
```

### 7.4 Git (convenção de commits)

O projeto usa **Conventional Commits** com escopo:

```bash
git commit -m "feat(api): adiciona endpoint de revogação de token"
git commit -m "fix(web): corrige refresh na rota protegida"
git commit -m "docs: atualiza documentação geral"
```

---

## 8. Referência da API

Base URL local: `http://localhost:3000` (não há prefixo como `/api/v1`).

### 8.1 Autenticação

#### `POST /auth/register`
```json
{ "name": "Maria", "email": "maria@email.com", "password": "123456" }
```
- `201` → `{ "user": { "id", "email", "createdAt" }, "accessToken": "<jwt>" }`
- `400` → dados inválidos · `409` → e-mail já cadastrado

#### `POST /auth/login`
```json
{ "email": "maria@email.com", "password": "123456" }
```
- `200` → `{ "user": { "id", "email", "createdAt" }, "accessToken": "<jwt>" }`
- `401` → `Credenciais inválidas`

#### `GET /auth/google`
Redireciona para a tela de consentimento do Google.

#### `GET /auth/google/callback`
Chamado pelo Google. Redireciona para `${FRONTEND_URL}/auth/success?token=<jwt>`.

### 8.2 Agente

#### `POST /agent/tokens` 🔒 *(JWT)*
- `201` → `{ "token": "stn_..." }` — **guarde, ele não será exibido novamente**.

#### `GET /agent/computers` 🔒 *(JWT)*
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "machineId": "DESKTOP-ABC-Windows",
    "hostname": "DESKTOP-ABC",
    "lastPing": "2026-10-15T13:00:00.000Z",
    "createdAt": "2026-10-14T10:00:00.000Z",
    "metrics": [
      {
        "id": 42,
        "cpuUsagePercent": 12.5,
        "ramTotalBytes": 17179869184,
        "ramUsedBytes": 8589934592,
        "ramUsagePercent": 50,
        "disks": [{ "device": "C:\\", "total_bytes": 512000000000, "used_bytes": 256000000000, "percent": 50 }],
        "collectedAt": "2026-10-15T13:00:00.000Z"
      }
    ]
  }
]
```

#### `POST /agent/metrics` 🔑 *(token do agente)*

```http
POST /agent/metrics
x-agent-token: stn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```
```json
{
  "machineId": "DESKTOP-ABC-Windows",
  "hostname": "DESKTOP-ABC",
  "cpu_percent": 12.5,
  "memory_total_bytes": 17179869184,
  "memory_used_bytes": 8589934592,
  "memory_percent": 50.0,
  "disks": [
    { "device": "C:\\", "total_bytes": 512000000000, "used_bytes": 256000000000, "percent": 50.0 }
  ]
}
```
- `200` → `{ "status": "success" }`
- `400` → payload inválido · `401` → token ausente ou inválido

**Teste rápido via PowerShell:**

```powershell
$body = @{
  machineId = "TESTE-Windows"; hostname = "TESTE"
  cpu_percent = 10; memory_total_bytes = 1000; memory_used_bytes = 500; memory_percent = 50
  disks = @()
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/agent/metrics -Method Post `
  -Headers @{ "x-agent-token" = "stn_SUA_CHAVE" } -ContentType "application/json" -Body $body
```

---

## 9. Modelo de dados

```mermaid
erDiagram
    users ||--o{ agent_tokens : possui
    users ||--o{ computers : possui
    computers ||--o{ metrics : gera

    users {
        uuid id PK
        string email UK
        string password_hash "NULL para Google"
        string provider "local | google"
        timestamptz created_at
    }
    agent_tokens {
        uuid id PK
        uuid user_id FK
        string token_hash "SHA-256"
        string name
        timestamptz created_at
    }
    computers {
        uuid id PK
        uuid user_id FK
        string machine_id "único por usuário"
        string hostname
        timestamptz last_ping
        timestamptz created_at
    }
    metrics {
        bigint id PK
        uuid computer_id FK
        decimal cpu_usage_percent
        bigint ram_total_bytes
        bigint ram_used_bytes
        decimal ram_usage_percent
        jsonb disks
        timestamptz collected_at
    }
```

- Todas as chaves estrangeiras usam `ON DELETE CASCADE` (apagar um usuário apaga seus tokens, computadores e métricas).
- Índice `idx_metrics_computer_time (computer_id, collected_at DESC)` acelera a busca da última leitura.
- No código (Prisma) os campos são `camelCase`; no banco, `snake_case`.
- Fonte da verdade: [`api/prisma/schema.prisma`](../api/prisma/schema.prisma).

---

## 10. Agente Windows

### 10.1 Interface

| Área | Função |
|---|---|
| **Chave de Acesso** | Campo para colar a chave `stn_...` gerada no dashboard |
| **Intervalo de Envio** | 1 a 300 segundos |
| **Métricas Coletadas** | Liga/desliga CPU, RAM e Discos |
| **Pausar / Iniciar** | Interrompe ou retoma os envios |
| **Salvar Preferências** | Grava tudo no `config.json` |
| **Console** | Log com horário e resultado de cada envio |

### 10.2 Funcionamento interno

- A interface (Tkinter) roda na *thread* principal; os envios rodam em uma **thread de fundo**.
- A cada ciclo: coleta → `POST` para a API → registra o resultado no console.
- A espera entre envios é feita em fatias de 200 ms, para que **Pausar** e **Fechar** respondam imediatamente.
- O `config.json` fica ao lado do `.exe` (ou do `agent.py`). Campos ausentes recebem os valores padrão.
- A URL da API (`api_url`) **só pode ser alterada editando o `config.json`**.

### 10.3 Mensagens do console

| Mensagem | Significado |
|---|---|
| `✅ Enviado (Status: 200)` | Leitura aceita pela API |
| `❌ Rejeitado pela Base (Status: 401)` | Chave inválida — gere outra no dashboard |
| `❌ Rejeitado pela Base (Status: 400)` | Payload inválido (versão do agente incompatível com a API) |
| `Falha de conexão: Servidor indisponível.` | API fora do ar, URL errada ou sem internet |
| `⚠️ Token de acesso vazio` | Preencha a chave |

---

## 11. Deploy

| Componente | Plataforma usada | Observações |
|---|---|---|
| **web** | Vercel | [`web/vercel.json`](../web/vercel.json) redireciona todas as rotas para `index.html` (necessário para SPA). Configure `VITE_API_URL` nas variáveis do projeto. |
| **api** | Render (`https://sentinel-api-9vud.onrender.com`) | Build: `npm install && npm run build` · Start: `npm run start:prod`. Configure todas as variáveis da seção 6. |
| **db** | PostgreSQL gerenciado | Rode `npx prisma db push` apontando para o banco de produção. |
| **agent** | Arquivo estático no web | `web/public/sentinel-agent.exe` |

> [!WARNING]
> - Em produção, `FRONTEND_URL` deve ser exatamente a URL do frontend (sem barra no final), senão o CORS bloqueia as requisições.
> - Atualize `GOOGLE_CALLBACK_URL` e os URIs autorizados no Google Cloud com o domínio público da API.
> - No plano gratuito do Render, a API "hiberna" após inatividade — a primeira requisição pode demorar ~1 minuto.

---

## 12. Convenções do projeto

- **Idioma:** código em inglês; mensagens de erro, interface, comentários e commits em **português**.
- **Backend:** padrão NestJS (Module → Controller → Service → Prisma). DTOs com `class-validator`.
- **Frontend:** componentes funcionais, formulários com React Hook Form + Zod, chamadas HTTP sempre via `apiClient` ([`web/src/api/clients.ts`](../web/src/api/clients.ts)), chaves de `localStorage` com prefixo `@sentinel:`.
- **Banco:** `camelCase` no Prisma ↔ `snake_case` no Postgres via `@map`/`@@map`.
- **Contrato agente ↔ API:** qualquer mudança no payload exige alterar **três lugares**: [`agent.py`](../agent/agent.py), [`receive-metrics.dto.ts`](../api/src/agent/dto/receive-metrics.dto.ts) e [`agent.service.ts`](../api/src/agent/agent.service.ts).
- **Segurança:** toda consulta deve filtrar por `userId` vindo do JWT ou do token do agente — **nunca** do corpo da requisição.

---

## 13. Solução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| Erro de CORS no navegador | `FRONTEND_URL` diferente da origem do front | Ajuste `FRONTEND_URL` no `api/.env` e reinicie a API |
| `PrismaClientInitializationError` | Banco inacessível ou `DATABASE_URL` errada | Verifique se o Postgres está rodando e a string de conexão |
| Tabela não existe | Schema não aplicado | `npx prisma db push` |
| Front chama `localhost:3000` em produção | `VITE_API_URL` ausente no build | Configure a variável na Vercel e faça novo deploy |
| Ao recarregar `/` volta para o login | Comportamento conhecido do `AuthContext` | Faça login novamente (ver limitações) |
| Agente mostra `401` | Chave errada, incompleta ou de outro ambiente | Gere nova chave no dashboard do **mesmo ambiente** da `api_url` |
| Agente local não aparece no dashboard local | `api_url` apontando para produção | Crie/edite `agent/config.json` com `http://localhost:3000/agent/metrics` |
| Computador aparece **Offline** com agente rodando | Intervalo > 25s | Use intervalo menor que 25 segundos |
| Login com Google falha com `redirect_uri_mismatch` | URI não cadastrado no Google Cloud | Adicione `GOOGLE_CALLBACK_URL` exatamente igual no console |
| Windows SmartScreen bloqueia o `.exe` | Executável não assinado | "Mais informações" → "Executar assim mesmo" |

---

## 14. Limitações conhecidas

Resumo dos pontos ainda em aberto (lista completa em [`AI_CONTEXT.md` §9](./context/AI_CONTEXT.md)):

- Não existe **página pública de apresentação** — a rota `/` é protegida.
- Chaves de agente **não podem ser revogadas** nem listadas.
- O campo **nome** é exigido no cadastro, mas **não é persistido**.
- Recarregar a página protegida pode deslogar visualmente o usuário; JWT expirado não faz logout automático.
- Métricas desativadas no agente são gravadas como `0`.
- O limite de 25s para "Online" não acompanha o intervalo configurado no agente.
- O `machineId` deriva do nome do computador — renomear a máquina cria um novo registro.
- Não há *rate limiting* nem migrations versionadas (usa-se `prisma db push`).
