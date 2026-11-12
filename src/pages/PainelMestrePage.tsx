import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  Check,
  Coins,
  Crown,
  Lock,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  UserCog,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { GothicButton } from '../components/GothicButton';
import { PageShell } from '../components/PageShell';
import { Modal } from '../components/Modal';
import { CardAventureiroMesa, type AventureiroMesa } from '../components/CardAventureiroMesa';
import { ToolbarButton } from '../components/ui/ToolbarButton';
import { GrimorioBloqueiosModal } from '../components/GrimorioBloqueiosModal';
import { LimiteFichasModal } from '../components/LimiteFichasModal';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { fichaService } from '../services/fichaService';
import { profileService } from '../services/profileService';
import { cacheKeyPrefixes, cacheKeys } from '../services/cacheKeys';
import { useAuthorization } from '../hooks/useAuthorization';
import { invalidateAsyncDataCache, useAsyncData } from '../hooks/useAsyncData';
import { fichaPath } from '../routes/paths';
import type { FichaCompleta } from '../types';

type PermissionField = 'edicaoLiberada' | 'acessoMercadoEpico' | 'acessoMercadoArcano' | 'acessoMercadoLendario' | 'podeComprar';

type CharacterPermissions = {
  edicaoLiberada: boolean;
  acessoMercadoEpico: boolean;
  acessoMercadoArcano: boolean;
  acessoMercadoLendario: boolean;
  podeComprar: boolean;
};

type PermissionMap = Record<string, CharacterPermissions>;

type CharacterStatus = {
  vidaAtual: number;
  vidaMax: number;
  vigorAtual: number;
  vigorMax: number;
  north: number;
};

type CharacterRow = {
  id: string;
  nome: string;
  ownerId: string | null;
  imagemUrl?: string;
  nivel: number;
  xp: number;
  dinheiro: number;
  edicaoLiberada: boolean;
  acessoMercadoEpico: boolean;
  acessoMercadoArcano: boolean;
  acessoMercadoLendario: boolean;
  podeComprar: boolean;
  /** Vitais do motor; quando ainda não chegaram, vêm do último salvamento. */
  status: CharacterStatus | null;
};

const MetricaMesa: React.FC<{ icon: React.ReactNode; valor: string; rotulo: string }> = ({ icon, valor, rotulo }) => (
  <div className="flex items-center gap-3 rounded-sm border border-[#3a2c1d] bg-[#160f0a] px-3.5 py-3">
    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xs border border-[#4b3823] bg-[#1d140c] text-[#c6a66d]">
      {icon}
    </span>
    <span className="min-w-0">
      <span className="block font-cinzel text-lg font-bold leading-tight text-[#e6ddc5]">{valor}</span>
      <span className="block truncate font-cinzel text-[9px] uppercase tracking-[0.16em] text-[#a88d61]">{rotulo}</span>
    </span>
  </div>
);

const TituloSecao: React.FC<{ children: React.ReactNode; extra?: React.ReactNode }> = ({ children, extra }) => (
  <div className="flex items-center gap-3">
    <h2 className="font-cinzel text-[10px] font-bold uppercase tracking-[0.2em] text-[#d1a85a]">{children}</h2>
    <span aria-hidden="true" className="h-px flex-1 bg-[#3a2c1d]" />
    {extra}
  </div>
);

const InterruptorPermissao: React.FC<{
  rotulo: string;
  icon: React.ReactNode;
  ativo: boolean;
  disabled: boolean;
  onToggle: (valor: boolean) => void;
}> = ({ rotulo, icon, ativo, disabled, onToggle }) => (
  <button
    type="button"
    role="switch"
    aria-checked={ativo}
    disabled={disabled}
    onClick={() => onToggle(!ativo)}
    className={clsx(
      'flex w-full items-center justify-between gap-3 rounded-xs border px-3 py-2.5 text-left font-serif text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] disabled:cursor-not-allowed disabled:opacity-60',
      ativo
        ? 'border-[#3e2d1d] bg-[#181008] text-[#dcd1ba] hover:border-[#80652e]'
        : 'border-[#332619] bg-[#140d08] text-[#9b8370] hover:border-[#5a4225]'
    )}
  >
    <span className="flex min-w-0 items-center gap-2">
      <span aria-hidden="true" className={clsx('shrink-0', ativo ? 'text-[#d1a85a]' : 'text-[#7d6a56]')}>{icon}</span>
      <span className="truncate">{rotulo}</span>
    </span>
    <span
      aria-hidden="true"
      className={clsx(
        'relative h-5 w-9 shrink-0 rounded-full border transition-colors',
        ativo ? 'border-[#a88d61] bg-[#5a3d16]' : 'border-[#3e2d1d] bg-[#1b120b]'
      )}
    >
      <span
        className={clsx(
          'absolute top-[3px] h-3 w-3 rounded-full transition-all',
          ativo ? 'left-[19px] bg-[#f3dfaa]' : 'left-[3px] bg-[#7d6a56]'
        )}
      />
    </span>
  </button>
);

export const PainelMestrePage: React.FC = () => {
  const { isMestre: isMaster, tenantId } = useAuthorization();
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [permissionsFocusId, setPermissionsFocusId] = useState<string | null>(null);
  const [isGrimorioOpen, setIsGrimorioOpen] = useState(false);
  const [isLimitesOpen, setIsLimitesOpen] = useState(false);
  const [isXpModalOpen, setIsXpModalOpen] = useState(false);
  const [isMoneyModalOpen, setIsMoneyModalOpen] = useState(false);
  const [selectedXpTarget, setSelectedXpTarget] = useState('all');
  const [xpAmount, setXpAmount] = useState('');
  const [xpReason, setXpReason] = useState('');
  const [selectedMoneyTarget, setSelectedMoneyTarget] = useState('');
  const [moneyAmount, setMoneyAmount] = useState('');
  const [moneyOperation, setMoneyOperation] = useState<'add' | 'remove'>('add');
  const [formError, setFormError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSavingXp, setIsSavingXp] = useState(false);
  const [isSavingMoney, setIsSavingMoney] = useState(false);
  const [savingPermissionId, setSavingPermissionId] = useState<string | null>(null);

  const resumoQuery = useAsyncData(
    () => (tenantId ? fichaService.getResumoDaMesa() : Promise.resolve([])),
    [tenantId],
    { cacheKey: cacheKeys.mestreResumo(tenantId), enabled: isMaster && Boolean(tenantId) }
  );

  const mesaResumo = resumoQuery.data ?? [];
  const precisaMotor = mesaResumo.some((item) => item.status === null);
  const detalheQuery = useAsyncData(
    () => (tenantId ? fichaService.getMesaCompleta() : Promise.resolve(new Map<string, FichaCompleta>())),
    [tenantId],
    { cacheKey: cacheKeys.mestreFichas(tenantId), enabled: isMaster && Boolean(tenantId) && precisaMotor }
  );

  // Nomes dos jogadores do cliente: uma consulta leve, só para identificar o dono de cada ficha.
  const perfisQuery = useAsyncData(
    () => (tenantId ? profileService.listarDoCliente(tenantId) : Promise.resolve([])),
    [tenantId],
    { cacheKey: cacheKeys.perfisDoCliente(tenantId), enabled: isMaster && Boolean(tenantId) }
  );

  const nomesPorJogador = useMemo(() => {
    const mapa = new Map<string, string>();
    (perfisQuery.data ?? []).forEach((perfil) => {
      const nome = perfil.nome_completo?.trim();
      if (nome) mapa.set(perfil.id, nome);
    });
    return mapa;
  }, [perfisQuery.data]);

  const mesaCompleta = detalheQuery.data;

  const characters = useMemo<CharacterRow[]>(() => mesaResumo.map((item) => {
    const ficha = mesaCompleta?.get(item.id) ?? null;
    return {
      id: item.id,
      nome: ficha?.identidade.nome_personagem?.trim() || item.nome,
      ownerId: item.ownerId,
      imagemUrl: ficha?.identidade.imagem_url || item.imagemUrl,
      nivel: Number(ficha?.identidade.nivel ?? item.nivel) || 1,
      xp: Number(ficha?.identidade.xp ?? item.xp) || 0,
      dinheiro: Math.max(0, Number(ficha?.recursos.dinheiro ?? item.dinheiro) || 0),
      edicaoLiberada: ficha?.identidade.edicao_liberada ?? item.edicaoLiberada,
      acessoMercadoEpico: ficha?.identidade.acesso_mercado_epico ?? item.acessoMercadoEpico,
      acessoMercadoArcano: ficha?.identidade.acesso_mercado_arcano ?? item.acessoMercadoArcano,
      acessoMercadoLendario: ficha?.identidade.acesso_mercado_lendario ?? item.acessoMercadoLendario,
      podeComprar: ficha?.identidade.pode_comprar ?? item.podeComprar,
      status: ficha
        ? {
            vidaAtual: Number(ficha.status.vida_atual) || 0,
            vidaMax: Number(ficha.status.vida_max) || 0,
            vigorAtual: Number(ficha.status.vigor_atual) || 0,
            vigorMax: Number(ficha.status.vigor_max) || 0,
            north: Number(ficha.status.north) || 0,
          }
        : item.status,
    } satisfies CharacterRow;
  }), [mesaResumo, mesaCompleta]);

  // O esqueleto só aparece quando não há nada para mostrar; com fichas em tela, cada cartão
  // mostra o próprio esqueleto enquanto os vitais do motor não chegam.
  const isLoading = characters.length === 0 && (resumoQuery.isLoading || detalheQuery.isLoading);
  const carregando = resumoQuery.isLoading || detalheQuery.isLoading;
  const loadError = resumoQuery.error || detalheQuery.error
    ? 'Não foi possível carregar as fichas da mesa. Verifique sua conexão e tente novamente.'
    : '';

  const refreshCharacters = () => {
    setStatusMessage('');
    resumoQuery.reload();
    detalheQuery.reload();
    perfisQuery.reload();
  };

  const invalidateCharacterCaches = () => {
    invalidateAsyncDataCache(cacheKeyPrefixes.mestreFichas);
    invalidateAsyncDataCache(cacheKeys.personagensResumo(tenantId));
    invalidateAsyncDataCache(cacheKeys.mestreResumo(tenantId));
  };

  const seedPermissoes = characters.map((row) => `${row.id}:${row.edicaoLiberada}:${row.acessoMercadoEpico}:${row.acessoMercadoArcano}:${row.acessoMercadoLendario}:${row.podeComprar}`).join('|');

  useEffect(() => {
    setPermissions(Object.fromEntries(characters.map((row) => [row.id, {
      edicaoLiberada: row.edicaoLiberada,
      acessoMercadoEpico: row.acessoMercadoEpico,
      acessoMercadoArcano: row.acessoMercadoArcano,
      acessoMercadoLendario: row.acessoMercadoLendario,
      podeComprar: row.podeComprar,
    }])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedPermissoes]);

  const getPermissions = useCallback((character: CharacterRow): CharacterPermissions => ({
    edicaoLiberada: permissions[character.id]?.edicaoLiberada ?? character.edicaoLiberada,
    acessoMercadoEpico: permissions[character.id]?.acessoMercadoEpico ?? character.acessoMercadoEpico,
    acessoMercadoArcano: permissions[character.id]?.acessoMercadoArcano ?? character.acessoMercadoArcano,
    acessoMercadoLendario: permissions[character.id]?.acessoMercadoLendario ?? character.acessoMercadoLendario,
    podeComprar: permissions[character.id]?.podeComprar ?? character.podeComprar,
  }), [permissions]);

  const aventureiros = useMemo<AventureiroMesa[]>(() => characters.map((character) => {
    const permissoes = getPermissions(character);
    return {
      id: character.id,
      nome: character.nome,
      jogador: character.ownerId ? nomesPorJogador.get(character.ownerId) ?? null : null,
      imagemUrl: character.imagemUrl,
      nivel: character.nivel,
      xp: character.xp,
      dinheiro: character.dinheiro,
      edicaoLiberada: permissoes.edicaoLiberada,
      podeComprar: permissoes.podeComprar,
      acessoMercadoEpico: permissoes.acessoMercadoEpico,
      acessoMercadoArcano: permissoes.acessoMercadoArcano,
      acessoMercadoLendario: permissoes.acessoMercadoLendario,
      status: character.status,
    } satisfies AventureiroMesa;
  }), [characters, getPermissions, nomesPorJogador]);

  const resumoDaMesa = useMemo(() => ({
    fichas: characters.length,
    edicao: characters.filter((character) => getPermissions(character).edicaoLiberada).length,
    compra: characters.filter((character) => getPermissions(character).podeComprar).length,
    tesouro: characters.reduce((total, character) => total + character.dinheiro, 0),
  }), [characters, getPermissions]);

  const alteracoesPendentes = useMemo(() => characters.filter((character) => {
    const atual = getPermissions(character);
    return atual.edicaoLiberada !== character.edicaoLiberada
      || atual.acessoMercadoEpico !== character.acessoMercadoEpico
      || atual.acessoMercadoArcano !== character.acessoMercadoArcano
      || atual.acessoMercadoLendario !== character.acessoMercadoLendario
      || atual.podeComprar !== character.podeComprar;
  }).length, [characters, getPermissions]);

  const updatePermission = (character: CharacterRow, field: PermissionField, value: boolean) => {
    const current = getPermissions(character);
    setPermissions({
      ...permissions,
      [character.id]: { ...current, [field]: value },
    });
  };

  const savePermissions = async () => {
    setSavingPermissionId('all');
    setStatusMessage('');
    try {
      await Promise.all(characters.map(async (character) => {
        const nextPermission = permissions[character.id] ?? getPermissions(character);
        // As colunas de permissão já vêm no resumo: só buscamos a ficha de quem mudou.
        const currentPermission = {
          edicaoLiberada: character.edicaoLiberada,
          acessoMercadoEpico: character.acessoMercadoEpico,
          acessoMercadoArcano: character.acessoMercadoArcano,
          acessoMercadoLendario: character.acessoMercadoLendario,
          podeComprar: character.podeComprar,
        };
        if (
          currentPermission.edicaoLiberada === nextPermission.edicaoLiberada &&
          currentPermission.acessoMercadoEpico === nextPermission.acessoMercadoEpico &&
          currentPermission.acessoMercadoArcano === nextPermission.acessoMercadoArcano &&
          currentPermission.acessoMercadoLendario === nextPermission.acessoMercadoLendario &&
          currentPermission.podeComprar === nextPermission.podeComprar
        ) return;

        const ficha = await fichaService.getFicha(character.id);
        ficha.identidade.edicao_liberada = nextPermission.edicaoLiberada;
        ficha.identidade.acesso_mercado_epico = nextPermission.acessoMercadoEpico;
        ficha.identidade.acesso_mercado_arcano = nextPermission.acessoMercadoArcano;
        ficha.identidade.acesso_mercado_lendario = nextPermission.acessoMercadoLendario;
        ficha.identidade.pode_comprar = nextPermission.podeComprar;
        const saved = await fichaService.saveFicha(character.id, ficha);
        if (!saved) throw new Error('Falha ao salvar permissões');
      }));

      invalidateCharacterCaches();
      refreshCharacters();
      setStatusMessage('Permissões salvas com sucesso.');
    } catch {
      setStatusMessage('Não foi possível salvar as permissões.');
    } finally {
      setSavingPermissionId(null);
    }
  };

  const openPermissions = (characterId?: string) => {
    setStatusMessage('');
    setPermissionsFocusId(characterId ?? null);
    setIsPermissionsOpen(true);
  };

  const openXpModal = () => {
    setSelectedXpTarget('all');
    setXpAmount('');
    setXpReason('');
    setFormError('');
    setIsXpModalOpen(true);
  };

  const openMoneyModal = (characterId?: string) => {
    setSelectedMoneyTarget(characterId || characters[0]?.id || '');
    setMoneyAmount('');
    setMoneyOperation('add');
    setFormError('');
    setIsMoneyModalOpen(true);
  };

  const submitXp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(xpAmount.replace(',', '.'));
    const reason = xpReason.trim();
    const targetIds = selectedXpTarget === 'all' ? characters.map((character) => character.id) : [selectedXpTarget];

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Informe uma quantidade de XP maior que zero.');
      return;
    }
    if (!reason) {
      setFormError('Informe o motivo da concessão.');
      return;
    }
    if (targetIds.length === 0) {
      setFormError('Não há fichas disponíveis para receber XP.');
      return;
    }

    setIsSavingXp(true);
    setFormError('');
    try {
      await Promise.all(targetIds.map((characterId) => fichaService.ensureFicha(characterId)));
      await Promise.all(targetIds.map((characterId) => fichaService.grantXp(characterId, amount, reason)));

      invalidateCharacterCaches();
      refreshCharacters();
      setIsXpModalOpen(false);
      setStatusMessage(`XP concedido com sucesso. Motivo: ${reason}`);
      setXpAmount('');
      setXpReason('');
    } catch {
      setFormError('Não foi possível salvar a concessão de XP.');
    } finally {
      setIsSavingXp(false);
    }
  };

  const submitMoney = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(moneyAmount.replace(',', '.'));
    const character = characters.find((item) => item.id === selectedMoneyTarget);

    if (!character) {
      setFormError('Selecione um personagem.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Informe uma quantia maior que zero.');
      return;
    }

    setIsSavingMoney(true);
    setFormError('');
    try {
      const ficha = await fichaService.ensureFicha(character.id);
      const currentMoney = Math.max(0, Number(ficha.recursos.dinheiro) || 0);
      if (moneyOperation === 'remove' && amount > currentMoney) {
        setFormError('A remoção não pode deixar o tesouro negativo.');
        return;
      }

      await fichaService.adjustTreasure(character.id, moneyOperation === 'add' ? amount : -amount);

      invalidateCharacterCaches();
      refreshCharacters();
      setIsMoneyModalOpen(false);
      setStatusMessage(`Tesouro de ${character.nome} atualizado.`);
      setMoneyAmount('');
    } catch {
      setFormError('Não foi possível salvar o ajuste de tesouro.');
    } finally {
      setIsSavingMoney(false);
    }
  };

  if (!isMaster) {
    return (
      <PageShell id="page-painel-mestre" variant="padrao"
          title={<h2 className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#a88d61]" /> Painel Administrativo do Mestre</h2>}
          subtitle="Centro de controle restrito ao mestre da campanha"
          headerRight={<div className="flex items-center gap-1.5 rounded-xs border border-[#8c6b41] bg-[#2a1d10] px-2.5 py-0.5 text-xs font-cinzel text-[#d4af37]"><ShieldCheck size={12} /><span>Acesso Restrito</span></div>}
        >
          <div className="py-16 text-center font-serif text-sm text-[#c4b9a3]">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-[#a88d61]" />
            Esta câmara está reservada ao Mestre da campanha.
          </div>
      </PageShell>
    );
  }

  const aventureirosOrdenados = permissionsFocusId
    ? [...aventureiros].sort((a, b) => (a.id === permissionsFocusId ? -1 : b.id === permissionsFocusId ? 1 : 0))
    : aventureiros;

  return (
    <>
      <PageShell id="page-painel-mestre" variant="padrao"
        title={<h2 className="flex items-center gap-2"><Crown className="h-5 w-5 text-[#a88d61]" /> Painel Administrativo do Mestre</h2>}
        subtitle="Monitoramento consolidado da mesa e permissões da campanha"
        headerRight={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xs border border-[#8c6b41] bg-[#2a1d10] px-2.5 py-0.5 text-xs font-cinzel text-[#d4af37]"><ShieldCheck size={12} /><span>Acesso Restrito</span></div>
            <ToolbarButton
              id="btn-sincronizar-mesa"
              icon={<RefreshCw className={clsx('h-3.5 w-3.5', carregando && 'animate-spin')} />}
              disabled={carregando}
              onClick={refreshCharacters}
            >
              Sincronizar
            </ToolbarButton>
          </div>
        }
      >
        <div className="space-y-6">
          <section aria-label="Resumo da mesa" className="space-y-3">
            <TituloSecao
              extra={<span className="font-cinzel text-[9px] uppercase tracking-[0.16em] text-[#8f795e]">Tela 6 · Registro da mesa</span>}
            >
              Resumo da mesa
            </TituloSecao>
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <MetricaMesa icon={<Users className="h-4 w-4" />} valor={String(resumoDaMesa.fichas)} rotulo={resumoDaMesa.fichas === 1 ? 'Ficha na mesa' : 'Fichas na mesa'} />
              <MetricaMesa icon={<Pencil className="h-4 w-4" />} valor={`${resumoDaMesa.edicao}/${resumoDaMesa.fichas}`} rotulo="Edição liberada" />
              <MetricaMesa icon={<ShoppingCart className="h-4 w-4" />} valor={`${resumoDaMesa.compra}/${resumoDaMesa.fichas}`} rotulo="Compra liberada" />
              <MetricaMesa icon={<Coins className="h-4 w-4" />} valor={`${resumoDaMesa.tesouro} ◈`} rotulo="Tesouro da mesa" />
            </div>
          </section>

          <section aria-label="Ações do Mestre" className="space-y-3">
            <TituloSecao>Ações do Mestre</TituloSecao>
            <div className="flex flex-wrap items-center gap-2 rounded-sm border border-[#3a2c1d] bg-[#160f0a] p-2.5">
              <ToolbarButton
                id="btn-conceder-xp-conduta"
                variant="primary"
                icon={<Award className="h-3.5 w-3.5" />}
                onClick={openXpModal}
              >
                Conceder XP
              </ToolbarButton>
              <span aria-hidden="true" className="mx-0.5 hidden h-6 w-px bg-[#3a2c1d] sm:block" />
              <ToolbarButton
                id="btn-gerenciar-jogadores-permissoes"
                icon={<Users className="h-3.5 w-3.5" />}
                onClick={() => openPermissions()}
              >
                Permissões
                {alteracoesPendentes > 0 && (
                  <>
                    <span aria-hidden="true" className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8a4a2f] px-1 text-[9px] text-[#f3dfaa]">
                      {alteracoesPendentes}
                    </span>
                    <span className="sr-only">
                      {alteracoesPendentes === 1 ? '1 alteração não salva' : `${alteracoesPendentes} alterações não salvas`}
                    </span>
                  </>
                )}
              </ToolbarButton>
              <ToolbarButton
                id="btn-bloqueios-grimorio"
                icon={<Lock className="h-3.5 w-3.5" />}
                onClick={() => { setStatusMessage(''); setIsGrimorioOpen(true); }}
              >
                Grimório
              </ToolbarButton>
              <ToolbarButton
                id="btn-limite-fichas"
                icon={<UserCog className="h-3.5 w-3.5" />}
                onClick={() => { setStatusMessage(''); setIsLimitesOpen(true); }}
              >
                Limites
              </ToolbarButton>
            </div>
          </section>

          {statusMessage && (
            <p role="status" aria-live="polite" className="border-l-2 border-[#a88d61] bg-[#20150c] px-3 py-2 font-serif text-sm text-[#d4c6aa]">{statusMessage}</p>
          )}

          <section aria-label="Aventureiros da mesa" className="space-y-3">
            <TituloSecao
              extra={(
                <span className="font-serif text-xs text-[#8f795e]">
                  {isLoading
                    ? 'Consultando a mesa…'
                    : `${characters.length} ${characters.length === 1 ? 'ficha' : 'fichas'} · dados salvos no servidor`}
                </span>
              )}
            >
              Aventureiros
            </TituloSecao>

            {isLoading ? (
              <div role="status" aria-live="polite" className="space-y-3">
                <span className="sr-only">Consultando os pergaminhos das fichas…</span>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <Skeleton key={`skeleton-card-${index}`} className="h-[220px] w-full" />
                  ))}
                </div>
              </div>
            ) : loadError && characters.length === 0 ? (
              <ErrorState title="Não foi possível carregar a mesa" description={loadError} onRetry={refreshCharacters} />
            ) : characters.length === 0 ? (
              <EmptyState
                variant="plano"
                icon={<Users className="h-8 w-8" aria-hidden="true" />}
                title="Nenhuma ficha disponível"
                description="Nenhum personagem foi encontrado para monitoramento nesta campanha."
              />
            ) : (
              <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {aventureirosOrdenados.map((aventureiro) => (
                  <li key={aventureiro.id} className="min-w-0">
                    <CardAventureiroMesa
                      aventureiro={aventureiro}
                      onAbrirFicha={(characterId) => navigate(fichaPath(characterId))}
                      onAjustarTesouro={(characterId) => openMoneyModal(characterId)}
                      onPermissoes={(characterId) => openPermissions(characterId)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </PageShell>

      {isPermissionsOpen && (
        <div className="fixed inset-0 z-40 bg-black/70" onClick={() => setIsPermissionsOpen(false)}>
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="painel-permissoes-title"
            className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l-2 border-[#76552f] bg-[#120d09] shadow-[-12px_0_35px_rgba(0,0,0,0.8)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#4b3823] bg-[#21160d] px-5 py-5">
              <div>
                <h2 id="painel-permissoes-title" className="font-cinzel text-base font-bold uppercase tracking-wider text-[#e6ddc5]">Jogadores &amp; Permissões</h2>
                <p className="mt-1 font-serif text-xs text-[#a88d61]">Permissões salvas no servidor</p>
              </div>
              <button type="button" aria-label="Fechar painel de permissões" className="rounded-xs border border-transparent p-2 text-[#a88d61] hover:border-[#5a4225] hover:text-[#f3dfaa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]" onClick={() => setIsPermissionsOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {characters.length === 0 ? (
                <p className="font-serif text-sm text-[#a88d61]">Nenhum jogador disponível.</p>
              ) : (
                <div className="space-y-4">
                  {[...characters].sort((a, b) => (a.id === permissionsFocusId ? -1 : b.id === permissionsFocusId ? 1 : 0)).map((character) => {
                    const characterPermissions = getPermissions(character);
                    const isSaving = savingPermissionId === 'all' || savingPermissionId === character.id;
                    const nomeJogador = character.ownerId ? nomesPorJogador.get(character.ownerId) ?? null : null;
                    return (
                      <div
                        key={character.id}
                        className={clsx('rounded-sm border bg-[#150f0a] p-4', character.id === permissionsFocusId ? 'border-[#a88d61]' : 'border-[#3a2c1d]')}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-cinzel text-sm uppercase text-[#e6ddc5]">{character.nome}</p>
                            <p className="truncate font-serif text-xs text-[#8f795e]">
                              Nível {character.nivel}{nomeJogador ? ` · ${nomeJogador}` : ''}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <ToolbarButton
                              icon={<ScrollText className="h-3.5 w-3.5" />}
                              onClick={() => navigate(fichaPath(character.id))}
                              aria-label={`Abrir ficha de ${character.nome}`}
                            >
                              Abrir ficha
                            </ToolbarButton>
                            {isSaving && <RefreshCw className="h-4 w-4 animate-spin text-[#c6a66d]" aria-label="Salvando permissão" />}
                          </div>
                        </div>

                        <fieldset>
                          <legend className="mb-2 font-cinzel text-[9px] uppercase tracking-[0.18em] text-[#a88d61]">Ficha</legend>
                          <InterruptorPermissao
                            rotulo="Edição liberada"
                            icon={<Pencil className="h-4 w-4" />}
                            ativo={characterPermissions.edicaoLiberada}
                            disabled={isSaving}
                            onToggle={(valor) => updatePermission(character, 'edicaoLiberada', valor)}
                          />
                        </fieldset>

                        <fieldset className="mt-4">
                          <legend className="mb-2 font-cinzel text-[9px] uppercase tracking-[0.18em] text-[#a88d61]">Mercado</legend>
                          <div className="space-y-2">
                            <InterruptorPermissao
                              rotulo="Comprar no Mercado"
                              icon={<ShoppingCart className="h-4 w-4" />}
                              ativo={characterPermissions.podeComprar}
                              disabled={isSaving}
                              onToggle={(valor) => updatePermission(character, 'podeComprar', valor)}
                            />
                            <InterruptorPermissao
                              rotulo="Mercado Épico"
                              icon={<Store className="h-4 w-4" />}
                              ativo={characterPermissions.acessoMercadoEpico}
                              disabled={isSaving}
                              onToggle={(valor) => updatePermission(character, 'acessoMercadoEpico', valor)}
                            />
                            <InterruptorPermissao
                              rotulo="Mercado Arcano"
                              icon={<Wand2 className="h-4 w-4" />}
                              ativo={characterPermissions.acessoMercadoArcano}
                              disabled={isSaving}
                              onToggle={(valor) => updatePermission(character, 'acessoMercadoArcano', valor)}
                            />
                            <InterruptorPermissao
                              rotulo="Mercado Lendário"
                              icon={<Sparkles className="h-4 w-4" />}
                              ativo={characterPermissions.acessoMercadoLendario}
                              disabled={isSaving}
                              onToggle={(valor) => updatePermission(character, 'acessoMercadoLendario', valor)}
                            />
                          </div>
                        </fieldset>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-t border-[#4b3823] bg-[#21160d] p-5">
              <p
                role="status"
                aria-live="polite"
                className={clsx('mb-3 font-serif text-xs', alteracoesPendentes > 0 ? 'text-[#e7c56d]' : 'text-[#8f795e]')}
              >
                {alteracoesPendentes > 0
                  ? `${alteracoesPendentes} ${alteracoesPendentes === 1 ? 'personagem com alteração não salva' : 'personagens com alterações não salvas'}`
                  : 'Nenhuma alteração pendente.'}
              </p>
              <GothicButton
                id="btn-salvar-permissoes"
                type="button"
                width="100%"
                height={42}
                icon={<Check className="h-4 w-4" />}
                disabled={savingPermissionId !== null}
                onClick={savePermissions}
                className="focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
              >
                {savingPermissionId !== null ? 'Salvando...' : 'Salvar Permissões'}
              </GothicButton>
            </div>
          </aside>
        </div>
      )}

      <Modal isOpen={isXpModalOpen} onClose={() => { if (!isSavingXp) setIsXpModalOpen(false); }} title="Conceder XP de Conduta" subtitle="Reconheça feitos dignos de uma nova crônica" maxWidth="max-w-[560px]">
        <form className="space-y-4" onSubmit={submitXp}>
          <div>
            <label htmlFor="xp-target" className="mb-1.5 block font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">Destinatário</label>
            <select id="xp-target" value={selectedXpTarget} onChange={(event) => setSelectedXpTarget(event.target.value)} className="w-full rounded-xs border border-[#5a4225] bg-[#130d08] px-3 py-2.5 font-serif text-sm text-[#e6ddc5] outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]">
              <option value="all">Toda a Mesa ({characters.length})</option>
              {characters.map((character) => <option key={character.id} value={character.id}>{character.nome}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="xp-amount" className="mb-1.5 block font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">Quantidade de XP</label>
            <input id="xp-amount" type="number" min="1" step="1" required value={xpAmount} onChange={(event) => setXpAmount(event.target.value)} className="w-full rounded-xs border border-[#5a4225] bg-[#130d08] px-3 py-2.5 font-serif text-sm text-[#e6ddc5] outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]" placeholder="Ex.: 250" />
          </div>
          <div>
            <label htmlFor="xp-reason" className="mb-1.5 block font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">Motivo</label>
            <textarea id="xp-reason" required rows={3} value={xpReason} onChange={(event) => setXpReason(event.target.value)} className="w-full resize-y rounded-xs border border-[#5a4225] bg-[#130d08] px-3 py-2.5 font-serif text-sm text-[#e6ddc5] outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]" placeholder="Descreva o feito que merece reconhecimento." />
          </div>
          {formError && <p role="alert" className="border-l-2 border-[#a85b45] bg-[#28140f] px-3 py-2 font-serif text-sm text-[#e7b29e]">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" disabled={isSavingXp} onClick={() => setIsXpModalOpen(false)} className="rounded-xs border border-[#4b3823] px-4 py-2 font-cinzel text-[10px] uppercase text-[#a88d61] transition-colors hover:border-[#8c6b41] hover:text-[#e6ddc5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] disabled:opacity-50">Cancelar</button>
            <GothicButton type="submit" size="sm" width={190} height={40} disabled={isSavingXp} icon={<Award className="h-4 w-4" />} className="focus-visible:ring-2 focus-visible:ring-[#d1a85a]">{isSavingXp ? 'Salvando...' : 'Conceder XP'}</GothicButton>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isMoneyModalOpen} onClose={() => { if (!isSavingMoney) setIsMoneyModalOpen(false); }} title="Ajustar Tesouro" subtitle="Adicionar ou remover dinheiro de uma ficha" maxWidth="max-w-[500px]">
        <form className="space-y-4" onSubmit={submitMoney}>
          <div>
            <label htmlFor="money-target" className="mb-1.5 block font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">Personagem</label>
            <select id="money-target" value={selectedMoneyTarget} onChange={(event) => setSelectedMoneyTarget(event.target.value)} className="w-full rounded-xs border border-[#5a4225] bg-[#130d08] px-3 py-2.5 font-serif text-sm text-[#e6ddc5] outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]">
              {characters.map((character) => <option key={character.id} value={character.id}>{character.nome}</option>)}
            </select>
          </div>
          <fieldset>
            <legend className="mb-1.5 font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">Operação</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex cursor-pointer items-center gap-2 rounded-xs border px-3 py-2.5 font-serif text-sm ${moneyOperation === 'add' ? 'border-[#a88d61] bg-[#33250f] text-[#f3dfaa]' : 'border-[#4b3823] text-[#a88d61]'} focus-within:ring-2 focus-within:ring-[#d1a85a]`}><input type="radio" name="money-operation" value="add" checked={moneyOperation === 'add'} onChange={() => setMoneyOperation('add')} className="accent-[#b88936]" /><Plus className="h-4 w-4" /> Adicionar</label>
              <label className={`flex cursor-pointer items-center gap-2 rounded-xs border px-3 py-2.5 font-serif text-sm ${moneyOperation === 'remove' ? 'border-[#a88d61] bg-[#33250f] text-[#f3dfaa]' : 'border-[#4b3823] text-[#a88d61]'} focus-within:ring-2 focus-within:ring-[#d1a85a]`}><input type="radio" name="money-operation" value="remove" checked={moneyOperation === 'remove'} onChange={() => setMoneyOperation('remove')} className="accent-[#b88936]" /><Minus className="h-4 w-4" /> Remover</label>
            </div>
          </fieldset>
          <div>
            <label htmlFor="money-amount" className="mb-1.5 block font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">Quantia</label>
            <input id="money-amount" type="number" min="0.01" step="0.01" required value={moneyAmount} onChange={(event) => setMoneyAmount(event.target.value)} className="w-full rounded-xs border border-[#5a4225] bg-[#130d08] px-3 py-2.5 font-serif text-sm text-[#e6ddc5] outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]" placeholder="Ex.: 50" />
          </div>
          {formError && <p role="alert" className="border-l-2 border-[#a85b45] bg-[#28140f] px-3 py-2 font-serif text-sm text-[#e7b29e]">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" disabled={isSavingMoney} onClick={() => setIsMoneyModalOpen(false)} className="rounded-xs border border-[#4b3823] px-4 py-2 font-cinzel text-[10px] uppercase text-[#a88d61] transition-colors hover:border-[#8c6b41] hover:text-[#e6ddc5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] disabled:opacity-50">Cancelar</button>
            <GothicButton type="submit" size="sm" width={190} height={40} disabled={isSavingMoney} icon={<Coins className="h-4 w-4" />} className="focus-visible:ring-2 focus-visible:ring-[#d1a85a]">{isSavingMoney ? 'Salvando...' : 'Salvar Tesouro'}</GothicButton>
          </div>
        </form>
      </Modal>
      <GrimorioBloqueiosModal isOpen={isGrimorioOpen} onClose={() => setIsGrimorioOpen(false)} />
      <LimiteFichasModal isOpen={isLimitesOpen} onClose={() => setIsLimitesOpen(false)} />
    </>
  );
};

export default PainelMestrePage;
