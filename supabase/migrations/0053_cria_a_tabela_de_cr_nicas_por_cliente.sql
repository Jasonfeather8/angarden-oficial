CREATE TABLE public.chronicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  data_aventura date NOT NULL,
  local text NOT NULL DEFAULT '',
  relato text NOT NULL DEFAULT '',
  progresso smallint NOT NULL DEFAULT 0,
  personagens text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'PUBLICADA',
  agendada_para timestamptz,
  capa_url text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chronicles_progresso_valido CHECK (progresso BETWEEN 0 AND 100),
  CONSTRAINT chronicles_status_valido CHECK (status IN ('PUBLICADA', 'AGENDADA')),
  CONSTRAINT chronicles_agendamento_valido CHECK (status = 'PUBLICADA' OR agendada_para IS NOT NULL)
)