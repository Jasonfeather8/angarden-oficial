import React, { useEffect, useState } from 'react';
import {
  Award,
  Check,
  Coins,
  Crown,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Store,
  Users,
  X,
} from 'lucide-react';
import { GothicButton } from '../components/GothicButton';
import { PageShell } from '../components/PageShell';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { fichaService } from '../services/fichaService';
import { cacheKeys } from '../services/cacheKeys';
import { useAuthorization } from '../hooks/useAuthorization';
import { invalidateAsyncDataCache, useAsyncData } from '../hooks/useAsyncData';
import type { FichaCompleta } from '../types';

type PermissionField = 'edicaoLiberada' | 'acessoMercadoEpico';

type CharacterPermissions = {
  edicaoLiberada: boolean;
  acessoMercadoEpico: boolean;
};

type PermissionMap = Record<string, CharacterPermissions>;

type CharacterRow = {
  id: string;
  nome: string;
  ficha: FichaCompleta;
};

export const PainelMestrePage: React.FC = () => {
  const { isMestre: isMaster, tenantId } = useAuthorization();
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
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

  const charactersQuery = useAsyncData(async () => {
    if (!tenantId) return [];
    const list = await fichaService.getListaPersonagens();
    const fichasPorPersonagem = await fichaService.getFichasDoAcervo();
    const loadedRows = list.map((character) => {
      try {
        const ficha = fichasPorPersonagem.get(character.id) ?? fichaService.createBlankFicha(character.id, character.nome);
        return {
          id: character.id,
          nome: ficha.identidade.nome_personagem?.trim() || character.nome || 'Aventureiro',
          ficha: fichaService.calcularEngine(ficha),
        } satisfies CharacterRow;
      } catch {
        return null;
      }
    });
    return loadedRows.filter((row): row is CharacterRow => row !== null);
  }, [tenantId], {
    cacheKey: cacheKeys.mestreFichas(tenantId),
    enabled: isMaster && Boolean(tenantId),
  });
  const characters = charactersQuery.data ?? [];
  const isLoading = charactersQuery.isLoading;
  const loadError = charactersQuery.error
    ? 'Não foi possível carregar as fichas da mesa. Verifique sua conexão e tente novamente.'
    : '';

  useEffect(() => {
    if (!charactersQuery.data) return;
    setPermissions(Object.fromEntries(charactersQuery.data.map((row) => [row.id, {
      edicaoLiberada: row.ficha.identidade.edicao_liberada ?? true,
      acessoMercadoEpico: row.ficha.identidade.acesso_mercado_epico ?? false,
    }])));
  }, [charactersQuery.data]);

  const refreshCharacters = () => {
    setStatusMessage('');
    charactersQuery.reload();
  };

  const invalidateCharacterCaches = () => {
    invalidateAsyncDataCache(cacheKeys.mestreFichas(tenantId));
    invalidateAsyncDataCache(cacheKeys.personagensResumo(tenantId));
  };

  const getPermissions = (character: CharacterRow): CharacterPermissions => ({
    edicaoLiberada: permissions[character.id]?.edicaoLiberada ?? character.ficha.identidade.edicao_liberada ?? true,
    acessoMercadoEpico: permissions[character.id]?.acessoMercadoEpico ?? character.ficha.identidade.acesso_mercado_epico ?? false,
  });

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
        const currentPermission = {
          edicaoLiberada: character.ficha.identidade.edicao_liberada ?? true,
          acessoMercadoEpico: character.ficha.identidade.acesso_mercado_epico ?? false,
        };
        if (
          currentPermission.edicaoLiberada === nextPermission.edicaoLiberada &&
          currentPermission.acessoMercadoEpico === nextPermission.acessoMercadoEpico
        ) return;

        const ficha = await fichaService.getFicha(character.id);
        ficha.identidade.edicao_liberada = nextPermission.edicaoLiberada;
        ficha.identidade.acesso_mercado_epico = nextPermission.acessoMercadoEpico;
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
          title={<h2 className="flex items-center gap-2 text-xl font-bold font-cinzel tracking-wider text-[#e6ddc5] uppercase"><ShieldCheck className="h-5 w-5 text-[#a88d61]" /> Painel Administrativo do Mestre</h2>}
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

  return (
    <>
      <PageShell id="page-painel-mestre" variant="padrao"
        title={<h2 className="flex items-center gap-2 text-xl font-bold font-cinzel tracking-wider text-[#e6ddc5] uppercase"><Crown className="h-5 w-5 text-[#a88d61]" /> Painel Administrativo do Mestre</h2>}
        subtitle="Monitoramento consolidado da mesa e permissões da campanha"
        headerRight={<div className="flex items-center gap-1.5 rounded-xs border border-[#8c6b41] bg-[#2a1d10] px-2.5 py-0.5 text-xs font-cinzel text-[#d4af37]"><ShieldCheck size={12} /><span>Acesso Restrito</span></div>}
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-3 border-b border-[#3a2c1d] pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#d4af37]">Tela 6 · Registro da mesa</p>
              <p className="mt-1 font-serif text-sm text-[#c4b9a3]">Acompanhe os recursos vitais e intervenha nas fichas dos jogadores.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <GothicButton
                id="btn-gerenciar-jogadores-permissoes"
                size="sm"
                width={245}
                height={42}
                icon={<Users className="h-4 w-4" />}
                className="focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
                onClick={() => { setStatusMessage(''); setIsPermissionsOpen(true); }}
              >
                Gerenciar Jogadores &amp; Permissões
              </GothicButton>
              <GothicButton
                id="btn-conceder-xp-conduta"
                size="sm"
                width={220}
                height={42}
                icon={<Award className="h-4 w-4" />}
                className="focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
                onClick={openXpModal}
              >
                Conceder XP de Conduta
              </GothicButton>
            </div>
          </div>

          {statusMessage && <p role="status" aria-live="polite" className="border-l-2 border-[#a88d61] bg-[#20150c] px-3 py-2 font-serif text-sm text-[#d4c6aa]">{statusMessage}</p>}

          <div className="overflow-x-auto border border-[#4b3823] bg-black/30">
            <table aria-busy={isLoading} className="w-full min-w-[920px] border-collapse text-left font-serif">
              <caption className="sr-only">Monitoramento consolidado dos personagens disponíveis</caption>
              <thead className="bg-[#21160d] font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">
                <tr>
                  <th scope="col" className="border-b border-[#4b3823] px-4 py-3">Nome / Personagem</th>
                  <th scope="col" className="border-b border-[#4b3823] px-3 py-3">Vida</th>
                  <th scope="col" className="border-b border-[#4b3823] px-3 py-3">Vigor</th>
                  <th scope="col" className="border-b border-[#4b3823] px-3 py-3">North</th>
                  <th scope="col" className="border-b border-[#4b3823] px-3 py-3">Nível</th>
                  <th scope="col" className="border-b border-[#4b3823] px-3 py-3">XP</th>
                  <th scope="col" className="border-b border-[#4b3823] px-3 py-3">Edição Liberada</th>
                  <th scope="col" className="border-b border-[#4b3823] px-3 py-3">Tesouro</th>
                  <th scope="col" className="border-b border-[#4b3823] px-3 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3a2c1d] text-[#dcd1ba]">
                {isLoading ? (
                  <>
                    <tr className="sr-only"><td colSpan={9}>Consultando os pergaminhos das fichas…</td></tr>
                    {Array.from({ length: 4 }).map((_, rowIndex) => (
                      <tr key={`skeleton-row-${rowIndex}`} aria-hidden="true">
                        {Array.from({ length: 9 }).map((__, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))}
                  </>
                ) : characters.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-4">
                      {loadError ? (
                        <ErrorState
                          title="Não foi possível carregar a mesa"
                          description={loadError}
                          onRetry={refreshCharacters}
                        />
                      ) : (
                        <EmptyState
                          title="Nenhuma ficha disponível"
                          description="Nenhum personagem foi encontrado para monitoramento nesta campanha."
                          className="border-none bg-transparent py-6 shadow-none"
                        />
                      )}
                    </td>
                  </tr>
                ) : characters.map((character) => {
                  const { ficha } = character;
                  const characterPermissions = getPermissions(character);
                  return (
                    <tr key={character.id} className="transition-colors hover:bg-[#24180e]">
                      <th scope="row" className="px-4 py-3 font-semibold text-[#e6ddc5]">{character.nome}</th>
                      <td className="whitespace-nowrap px-3 py-3 text-[#d2a85f]">{ficha.status.vida_atual} <span className="text-[#88745a]">/ {ficha.status.vida_max}</span></td>
                      <td className="whitespace-nowrap px-3 py-3 text-[#d2a85f]">{ficha.status.vigor_atual} <span className="text-[#88745a]">/ {ficha.status.vigor_max}</span></td>
                      <td className="px-3 py-3 text-[#e0c98e]">{ficha.status.north}</td>
                      <td className="px-3 py-3 text-[#e0c98e]">{ficha.identidade.nivel}</td>
                      <td className="px-3 py-3 text-[#c4b9a3]">{ficha.identidade.xp}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-xs border px-2 py-1 text-[10px] font-cinzel uppercase ${characterPermissions.edicaoLiberada ? 'border-[#80652e] bg-[#33250f] text-[#e7c56d]' : 'border-[#52382b] bg-[#1a110d] text-[#9b8370]'}`}>
                          {characterPermissions.edicaoLiberada ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          {characterPermissions.edicaoLiberada ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-[#d8b86b]">{Math.max(0, Number(ficha.recursos.dinheiro) || 0)} ◈</td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          aria-label={`Ajustar tesouro de ${character.nome}`}
                          title="Ajustar tesouro"
                          className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-xs border border-[#5a4225] bg-[#1b120b] text-[#c6a66d] transition-colors hover:border-[#a88d61] hover:text-[#f3dfaa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
                          onClick={() => openMoneyModal(character.id)}
                        >
                          <Coins className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#917b60]">
            <span>{characters.length} {characters.length === 1 ? 'ficha disponível' : 'fichas disponíveis'} · dados locais da campanha</span>
            <button type="button" onClick={refreshCharacters} className="inline-flex items-center gap-1.5 rounded-xs border border-transparent px-2 py-1 font-cinzel uppercase tracking-wider transition-colors hover:border-[#5a4225] hover:text-[#e6ddc5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"><RefreshCw className="h-3.5 w-3.5" /> Atualizar tabela</button>
          </div>
        </div>
      </PageShell>

      {isPermissionsOpen && (
        <div className="fixed inset-0 z-40 bg-black/70" onClick={() => setIsPermissionsOpen(false)}>
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="painel-permissoes-title"
            className="absolute right-0 top-0 flex h-full w-full max-w-[430px] flex-col border-l-2 border-[#76552f] bg-[#120d09] shadow-[-12px_0_35px_rgba(0,0,0,0.8)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#4b3823] bg-[#21160d] px-5 py-5">
              <div>
                <h2 id="painel-permissoes-title" className="font-cinzel text-base font-bold uppercase tracking-wider text-[#e6ddc5]">Jogadores &amp; Permissões</h2>
                <p className="mt-1 font-serif text-xs text-[#a88d61]">Alçadas salvas localmente nesta campanha</p>
              </div>
              <button type="button" aria-label="Fechar painel de permissões" className="rounded-xs border border-transparent p-2 text-[#a88d61] hover:border-[#5a4225] hover:text-[#f3dfaa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]" onClick={() => setIsPermissionsOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {characters.length === 0 ? (
                <p className="font-serif text-sm text-[#a88d61]">Nenhum jogador disponível.</p>
              ) : (
                <div className="space-y-4">
                  {characters.map((character) => {
                    const characterPermissions = getPermissions(character);
                    const isSaving = savingPermissionId === 'all' || savingPermissionId === character.id;
                    return (
                      <div key={character.id} className="border border-[#4b3823] bg-[#1b120b] p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-cinzel text-sm uppercase text-[#e6ddc5]">{character.nome}</p>
                            <p className="font-serif text-xs text-[#8f795e]">Nível {character.ficha.identidade.nivel}</p>
                          </div>
                          {isSaving && <RefreshCw className="h-4 w-4 animate-spin text-[#c6a66d]" aria-label="Salvando permissão" />}
                        </div>
                        <div className="space-y-2.5">
                          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xs border border-[#3e2d1d] px-3 py-2.5 text-sm text-[#dcd1ba] transition-colors hover:border-[#80652e] focus-within:ring-2 focus-within:ring-[#d1a85a]">
                            <span className="flex items-center gap-2"><Pencil className="h-4 w-4 text-[#a88d61]" /> Edição Liberada</span>
                            <input type="checkbox" className="h-4 w-4 accent-[#b88936]" checked={characterPermissions.edicaoLiberada} disabled={isSaving} onChange={(event) => updatePermission(character, 'edicaoLiberada', event.target.checked)} />
                          </label>
                          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xs border border-[#3e2d1d] px-3 py-2.5 text-sm text-[#dcd1ba] transition-colors hover:border-[#80652e] focus-within:ring-2 focus-within:ring-[#d1a85a]">
                            <span className="flex items-center gap-2"><Store className="h-4 w-4 text-[#a88d61]" /> Acesso ao Mercado Épico</span>
                            <input type="checkbox" className="h-4 w-4 accent-[#b88936]" checked={characterPermissions.acessoMercadoEpico} disabled={isSaving} onChange={(event) => updatePermission(character, 'acessoMercadoEpico', event.target.checked)} />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-t border-[#4b3823] bg-[#21160d] p-5">
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
    </>
  );
};

export default PainelMestrePage;
