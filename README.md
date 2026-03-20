# NutrIA - Aplicativo de Nutrição

Um aplicativo móvel de rastreamento nutricional que utiliza IA para simplificar o registro de refeições e análise nutricional, com capacidades avançadas de busca de alimentos internacionais.
![Captura de tela](https://i.ibb.co/N2bxP2bn/Captura-de-tela-2025-11-03-001849.png)
## 🚀 Como Rodar o Projeto na Sua Máquina

### Estrutura do Projeto

```
nutria/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas do aplicativo
│   │   ├── hooks/         # React hooks customizados
│   │   └── lib/           # Utilitários e configurações
├── server/                # Backend Express
│   ├── services/          # Serviços (USDA, AI, PDF, etc.)
│   ├── routes.ts          # Rotas da API
│   ├── storage.ts         # Operações do banco de dados
│   └── db.ts              # Configuração do banco
├── shared/                # Código compartilhado
│   └── schema.ts          # Schema do banco (Drizzle)
└── package.json
```

### Funcionalidades Principais

- ✅ **Autenticação de usuários**
- ✅ **Busca de alimentos** (USDA + banco local)
- ✅ **Registro de refeições** por tipo (café, almoço, jantar, etc.)
- ✅ **Cálculo automático de metas nutricionais**
- ✅ **Rastreamento diário** (ciclo nutricional 5h-5h)
- ✅ **Dashboard com progresso** em tempo real
- ✅ **Exportação de relatórios PDF**
- ✅ **Interface responsiva** (mobile-first)



### Desenvolvendo

1. **Frontend** (React + TypeScript):
   - Componentes em `client/src/components/`
   - Páginas em `client/src/pages/`
   - Estilização com Tailwind CSS

2. **Backend** (Express + TypeScript):
   - Rotas da API em `server/routes.ts`
   - Lógica de negócio em `server/services/`
   - Banco de dados com Drizzle ORM

3. **Banco de dados**:
   - Schema definido em `shared/schema.ts`
   - Migrações automáticas com `npm run db:push`


**NutrIA** - Seu assistente inteligente para nutrição e saúde.

