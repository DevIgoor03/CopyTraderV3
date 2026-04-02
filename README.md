# CopyTrader — Plataforma Profissional de Copy Trading

Sistema escalável de copy trading para a plataforma Bull-ex.

## Início Rápido (Desenvolvimento)

```bash
# 1. Inicie PostgreSQL e Redis via Docker
docker-compose up -d

# 2. Backend
cd backend
cp .env.example .env
npx prisma migrate dev --name init
npm run dev

# 3. Frontend (novo terminal)
cd frontend
npm run dev
```

Acesse: http://localhost:5173

## Fluxo de Uso

1. **Criar conta** no painel (`/login` → "Criar conta")
2. **Conectar conta Bull-ex** master no painel
3. **Iniciar CopyTrader** e adicionar seguidores
4. **Compartilhar link do portal** para seguidores configurarem suas próprias contas
   - URL: `http://localhost:5173/portal/{masterId}`

## Documentação

Veja `/documents/arquitetura-escalavel.md` para detalhes completos de arquitetura.
