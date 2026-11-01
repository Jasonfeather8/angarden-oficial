# AI_RULES.md

## Tech stack

- **React 19** powers the UI, with functional components and hooks as the default composition model.
- **TypeScript 5.8** is used for application code; keep domain models and shared interfaces in `src/types/`.
- **Vite 6** is the development server and production bundler, configured through `vite.config.ts`.
- **Tailwind CSS 4** provides the primary styling system through the Tailwind Vite plugin and `src/index.css`.
- **Zustand 5** manages shared client state, with stores kept in `src/store/`.
- **React Router 7** (`react-router-dom`) owns navigation. Every screen has its own URL; never switch screens through store state.
- **Lucide React** provides the application’s icon set and should be preferred over hand-drawn inline icons.
- **Motion** provides animations and transitions when CSS transitions are not sufficient.
- **clsx** and **tailwind-merge** support conditional and conflict-free Tailwind class composition.
- **Express**, **dotenv**, and **@google/genai** are available for server-side integrations; secrets and privileged API calls must never run in browser code.

## Project structure

- Keep all source code under `src/`.
- Put route-level screens in `src/pages/`, shell components in `src/layouts/`, reusable UI in `src/components/` (generic primitives in `src/components/ui/`), shared hooks in `src/hooks/`, route path constants in `src/routes/`, shared state in `src/store/`, data access in `src/services/`, estrutura fixa do sistema em `src/mocks/` (apenas as escolas/volumes do grimório — não são dados de teste), and shared types in `src/types/`.
- Keep `src/App.tsx` limited to `<Routes>` and the layout wrappers. Never put table, chart or operational modal logic there.
- Shell components (Sidebar, Topbar) live in `src/layouts/` and render children strictly through `<Outlet/>`.
- Declare every new screen in `src/App.tsx` and add its path to `src/routes/paths.ts` so it is reachable by URL. Auth guards live in `src/components/RouteGuards.tsx`; wrap pages with them instead of branching inside pages.
- `vercel.json` must keep the SPA rewrite `/(.*)` → `/index.html` so deep links survive an F5.

## Library and implementation rules

- Use Tailwind utility classes for layout, spacing, typography, colors, borders, and responsive behavior. Put only global resets, font declarations, and genuinely global selectors in `src/index.css`.
- Prefer the existing reusable components in `src/components/` before creating a new component. Keep new components focused and colocate feature-specific UI there.
- Use Zustand for state shared by multiple components or pages. Keep local, short-lived interaction state in React hooks instead of adding it to a global store.
- Use Lucide React icons for interface symbols. Do not add a new icon package or use emoji as a substitute for UI icons.
- Use Motion only for meaningful UI motion such as modal entrance, list transitions, or interaction feedback; prefer Tailwind/CSS transitions for simple hover and focus effects.
- Use `clsx` for conditional class names and `tailwind-merge` when composed class strings may conflict. Do not concatenate long conditional class strings manually.
- Keep data fetching and persistence in `src/services/`; pages and presentational components should call service functions rather than embedding storage or API logic.
- Import shared modules with the `@/` alias (`@` maps to `./src` in both `vite.config.ts` and `tsconfig.json`); keep `resolve.dedupe: ['react', 'react-dom']` in `vite.config.ts`.
- Every data-dependent screen must handle loading, error/timeout and empty states before rendering success. Reuse `src/components/ui/Skeleton.tsx`, `EmptyState.tsx`, `ErrorState.tsx` and `src/hooks/useAsyncData.ts` (which applies `withTimeout`) instead of ad-hoc spinners and `console.error`-only failures.
- Telas com paginação e filtro no servidor usam React Query (`useQuery`): os filtros e a página fazem parte do `queryKey` e `placeholderData: keepPreviousData` evita piscar a tela ao trocar de página. Envolva o `queryFn` em `withTimeout`. As demais telas continuam com `useAsyncData`.
- Persist client data in Supabase, never in the browser. `localStorage` is reserved for UI shell state; validate data at external boundaries before putting it into application state.
- Keep Google GenAI calls, Express handlers, dotenv usage, and any other secret-dependent logic on the server side. Never commit credentials or expose private environment variables through client bundles.
- Avoid adding dependencies when the current stack can solve the problem. If a dependency is necessary, choose a small, maintained library that fits the existing architecture.

## Identidade, papéis e isolamento de dados

- Papéis da plataforma: `admin` (plataforma), `mestre` e `jogador`, definidos em `Usuario.role` pelo administrador ao aprovar a conta. Nunca torne o papel alternável na interface.
- Todos os dados de cliente vivem no Supabase. Toda tabela de cliente carrega `tenant_id` e as políticas RLS decidem pelo JWT; o frontend ainda filtra explicitamente por `tenant_id` como segunda camada. Nunca exponha a `service_role` no código do cliente.
- `src/services/storageKeys.ts` mantém apenas a chave de versão do armazenamento local. Não escreva chaves literais espalhadas pelo código.
- Toda decisão de acesso passa por `src/auth/policies.ts` e, na interface, por `src/hooks/useAuthorization.ts`. Páginas não devem comparar papéis manualmente.
- O catálogo global (`market_items` e `grimorio_spells`) só pode ser criado, editado ou excluído pelo Administrador da plataforma. O Mestre gere a própria organização e tem apenas leitura do catálogo, podendo alternar `oculta` nas magias; o conteúdo das magias é protegido pelo trigger `prevent_spell_escalation`.
- Sessão: `src/store/useSessionStore.ts` sobre `src/services/sessionService.ts`, que usa o Supabase Auth e deriva papel, status e cliente do `app_metadata` do JWT — o boot não consulta `profiles`. `src/store/useAppStore.ts` guarda apenas estado de casca (UI).
- O cadastro cria uma solicitação (`AccountRequest`) que o administrador aprova; a aprovação cria o `Tenant` (cliente) e a conta. A área administrativa fica em `/admin` (`src/layouts/AdminLayout.tsx` + `src/pages/admin/`).
- Rotas: declare em `src/App.tsx`, registre o caminho em `src/routes/paths.ts` e proteja com `ProtectedRoute`/`AdminRoute` de `src/components/RouteGuards.tsx`.
- Campanhas usam convite por link (`/convites/:token`). `CampaignMember.papel` é local à campanha e não altera o papel na plataforma. A RLS é quem decide o acesso (`tenant_id = current_tenant_id()`, `is_campaign_member` ou `is_admin()`), então `campaignService` **não** filtra por `tenant_id` de propósito: um convidado de outro cliente precisa enxergar a campanha para a qual foi convidado. Não acrescente esse filtro.
- `DATA_VERSION` (`src/services/storageKeys.ts`, aplicado por `src/services/dataReset.ts`) serve apenas para descartar chaves locais legadas no boot. Como os dados vivem no Supabase, mudanças de schema são feitas por SQL no banco e não exigem bump de versão.

## Dados no Supabase

- Imagens vivem no bucket público `midia`, em `{tenant_id}/...`, `{user_id}/...`, `mercado/...` ou `grimorio/...` (nesta última só o Administrador da plataforma escreve, o que a política existente já garante porque a pasta não é um uuid); todo envio passa por `src/services/mediaService.ts`. Nunca grave imagem em base64 no banco. **Políticas de `storage.objects` não podem usar `is_admin()`, `is_mestre()` nem `current_tenant_id()`**: o serviço de Storage não entrega os claims do token para `auth.jwt()`, e essas funções dependem dele — a política passa a negar todos, inclusive o administrador. Em políticas de Storage, resolva papel e cliente por `auth.uid()` (é o que `public.pode_escrever_midia(pasta)` faz).
- Tabelas de cliente (`tenant_id` + RLS): `characters`, `fichas` (o `dados` jsonb guarda a ficha inteira), `spell_progress`, `xp_logs`, `campaigns`, `scheduled_sessions` (uma linha por cliente — a próxima sessão da mesa, lida por todos e escrita só pelo Mestre).
- Tabelas globais da plataforma: `tenants`, `profiles` (conta, `role` e `status`), `character_templates`, `grimorio_spells` (catálogo de magias, com flag `oculta`), `market_items` (mercado compartilhado entre clientes), `campaign_members`, `campaign_invites`.
- Acesso aos dados passa pelos serviços de `src/services/` (`fichaService`, `mercadoService`, `inventarioService`, `grimorioService`, `campaignService`, `scheduleService`, `profileService`, `tenantService`, `sessionService`). Páginas, layouts e componentes nunca chamam `supabase` diretamente.
- XP e tesouro mudam por RPC no banco (`grant_xp`, `adjust_treasure`), não por update direto na ficha; as colunas de permissão da ficha (`edicao_liberada`, `acesso_mercado_epico`) são protegidas por trigger contra escalação pelo cliente.
- Catálogos da ficha: armas, escudos, montarias, armaduras e itens vêm do Mercado (`market_items`), não de listas fixas — os seletores da ficha abrem o inventário filtrado pelas categorias `mercado_*`. Não existe catálogo fixo em código: `src/mocks/grimorio.ts` guarda apenas a estrutura das escolas/volumes, enquanto as magias vivem em `grimorio_spells`. Não recrie listas fixas de armas, montarias ou armaduras.
- `market_items` é global (sem `tenant_id`) e a única tabela que cresce sem limite. Liste sempre por `mercadoService.listarItens(...)`, que pagina com `.range()`, filtra no banco e devolve o `count` exato; nunca baixe o catálogo inteiro para filtrar na memória. O enriquecimento do inventário usa o lookup direcionado (`carregarLookupDeItens`/`consultarLookupDeItens`), aquecido em `useFichaStore.loadFicha` apenas com os itens que a ficha referencia, e invalidado a cada criação/edição/exclusão de mercadoria.
- `grimorio_spells` é o catálogo global de magias (sem `tenant_id`; a RLS já esconde as `oculta` dos jogadores). Leia sempre por volume (`listarMagiasDoVolume`, paginado em fólios de 10 com o `count` exato) ou por ids (`listarMagiasPorIds`, usado pela ficha para resolver as magias aprendidas) — nunca baixe o catálogo inteiro. A imagem da magia vive em `dados.image` como **URL** do bucket `midia` (`grimorio/...`), enviada por `enviarImagem(file, 'grimorio')`; a coluna gerada `imagem_bytes` mede o tamanho desse campo. A estrutura fixa das escolas/volumes segue em `src/mocks/grimorio.ts`, e `spell_progress` continua por personagem em `grimorioService`.

## Quality rules

- Preserve the existing medieval visual language, typography, color palette, and responsive behavior unless a request explicitly changes the design.
- Use accessible semantic HTML, visible focus states, descriptive button labels, and meaningful `alt` text for images.
- Keep TypeScript checks passing with `npm run lint` and avoid introducing `any` unless an external boundary makes it unavoidable.
