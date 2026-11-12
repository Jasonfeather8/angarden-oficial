/**
 * Modelo de domínio do SaaS Angarden.
 *
 * IMPORTANTE (migração futura para Supabase):
 * Cada tipo abaixo corresponde a uma tabela do schema `public`, e cada função de
 * `src/auth/policies.ts` corresponde a uma policy RLS. Ver o mapa em `policies.ts`.
 */

/** Nível de acesso do usuário na plataforma. */
export type UserRole = 'admin' | 'mestre' | 'jogador';

/** Situação da conta do usuário. */
export type UserStatus = 'pendente' | 'ativo' | 'recusado';

/** Tipo de cliente definido pelo administrador. */
export type TenantType = 'individual' | 'organizacao';

/** Papel do usuário dentro de uma campanha (independente do nível na plataforma). */
export type CampaignMemberRole = 'mestre' | 'jogador';

export type CampaignMemberStatus = 'convidado' | 'ativo';

/** Sessão da mesa: a próxima agendada ou uma já realizada. */
export interface SessaoDaMesa {
  id: string;
  /** Instante da sessão em ISO 8601 (UTC). */
  dataHora: string;
  titulo: string;
  pauta: string;
  linkVtt?: string;
}

/** Dados de uma sessão nova (ou da edição de uma existente). */
export type DadosDaSessao = Omit<SessaoDaMesa, 'id'>;

/** Fronteira de isolamento de dados. `individual` = tenant de uma pessoa. */
export interface Tenant {
  id: string;
  nome: string;
  tipo: TenantType;
  created_at: string;
}

export interface Usuario {
  id: string;
  nome_completo: string;
  whatsapp: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  /** `null` somente para o administrador da plataforma. */
  tenant_id: string | null;
  data_cadastro: string;
}

/** Perfil com a data da última avaliação exibida no painel administrativo. */
export interface PerfilConta extends Usuario {
  updated_at: string;
  motivo_recusa?: string;
  limite_fichas: number;
}

/** Sessão ativa. Substituível por `supabase.auth.getSession()`. */
export interface Session {
  user: Usuario;
  tenant: Tenant | null;
  issued_at: string;
}

export interface Campaign {
  id: string;
  tenant_id: string;
  nome: string;
  descricao?: string;
  mestre_user_id: string;
  created_at: string;
}

export interface CampaignMember {
  campaign_id: string;
  user_id: string;
  papel: CampaignMemberRole;
  status: CampaignMemberStatus;
  invited_by?: string;
  joined_at?: string;
}

export interface CampaignInvite {
  token: string;
  campaign_id: string;
  created_by: string;
  created_at: string;
}

/**
 * Pré-visualização de um convite, resolvida pelo token.
 * Expõe apenas o necessário para a tela de convite antes do aceite.
 */
export interface CampaignInvitePreview {
  campaign_id: string;
  nome: string;
  descricao?: string;
  ja_membro: boolean;
}

export interface CadastroInput {
  nome_completo: string;
  email: string;
  whatsapp: string;
  senha: string;
}

export interface AtualizacaoPerfil {
  nome_completo: string;
  whatsapp: string;
  avatar_url?: string;
  nova_senha?: string;
}

/** Dados de aprovação de uma solicitação, definidos pelo administrador. */
export interface AprovacaoSolicitacaoInput {
  tipo: TenantType;
  role: UserRole;
  /** Nome do novo tenant quando `tenant_id` não é informado. */
  nome_tenant?: string;
  /** Vincula o usuário a um tenant existente em vez de criar um novo. */
  tenant_id?: string;
}
