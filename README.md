# CRM

Customer support CRM with a .NET backend API and an Angular frontend, covering ticketing, customer records, knowledge base, SLA/assignment automation, and reporting.

## Structure

- `backend/CrmApi` — ASP.NET Core Web API (.NET 10, EF Core, SQL Server)
- `frontend` — Angular 18 app (standalone components)
- `specs` / `stories` — Spec-Kit feature specs and user stories

## Features

- **Tickets** — create/update tickets, sub-resources (notes, events, messages, reminders), SLA rules, and automated assignment rules
- **Customers** — customer records with notes and history
- **Knowledge base** — articles for agent/customer self-service
- **Agents, roles & users** — role-based access, agent management
- **Channels** — inbound message ingestion across configured channels
- **Portal** — customer-facing ticket portal with webhook dispatch
- **AI assistance** — AI-powered ticket/reply suggestions
- **Notifications & audit logs** — system notifications and an audit trail
- **Reports & dashboard** — operational reporting and a dashboard view
- **Settings & integrations** — system settings, API keys, ERP sync, branding config

## Backend

Tech stack: ASP.NET Core (.NET 10), EF Core with SQL Server.

```
cd backend/CrmApi
dotnet restore
dotnet ef database update
dotnet run
```

Update the `CrmDb` connection string in `appsettings.json` if needed.

Key folders: `Controllers/`, `Services/` (including a hosted `SlaMonitorService`), `Models/`, `Dtos/`, `Data/CrmDbContext.cs`, `Migrations/`.

## Frontend

Tech stack: Angular 18, TypeScript, RxJS.

```
cd frontend
npm install
npm start
```

Pages: Dashboard, Tickets, Ticket Detail, Customers, Customer Detail, Knowledge Base. Shared API access lives in `src/app/api.service.ts`, shared types in `src/app/models.ts`.
