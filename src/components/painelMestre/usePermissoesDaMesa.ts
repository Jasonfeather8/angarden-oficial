import { useCallback, useEffect, useMemo, useState } from 'react';
import { fichaService } from '@/services/fichaService';
import type { AventureiroMesa } from '../CardAventureiroMesa';
import type { CharacterRow } from './useMesaDoMestre';

export type PermissionField = 'edicaoLiberada' | 'acessoMercadoEpico' | 'acessoMercadoArcano' | 'acessoMercadoLendario' | 'podeComprar';

export type CharacterPermissions = {
  edicaoLiberada: boolean;
  acessoMercadoEpico: boolean;
  acessoMercadoArcano: boolean;
  acessoMercadoLendario: boolean;
  podeComprar: boolean;
};

export type PermissionMap = Record<string, CharacterPermissions>;

/** Números da faixa de resumo da mesa. */
export interface ResumoDaMesa {
  fichas: number;
  edicao: number;
  compra: number;
  tesouro: number;
}

export type AventureiroDoTesouro = { id: string; nome: string; dinheiro: number };

interface UsePermissoesDaMesaOptions {
  characters: CharacterRow[];
  nomesPorJogador: Map<string, string>;
  /** Descarta os caches afetados e recarrega a mesa depois de gravar. */
  onAtualizarMesa: () => void;
  onStatus: (mensagem: string) => void;
}

/**
 * Permissões da mesa e a leitura que depende delas: o rascunho editado no painel
 * lateral, os cartões dos aventureiros, o resumo e a fila de distribuição de
 * tesouro. O rascunho é recomposto sempre que as permissões gravadas mudam.
 */
export function usePermissoesDaMesa({
  characters,
  nomesPorJogador,
  onAtualizarMesa,
  onStatus,
}: UsePermissoesDaMesaOptions) {
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [isOpen, setIsOpen] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [savingPermissionId, setSavingPermissionId] = useState<string | null>(null);

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

  const aventureirosTesouro = useMemo(() => aventureiros.map(({ id, nome, dinheiro }) => ({ id, nome, dinheiro })), [aventureiros]);

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

  /** A ficha aberta no painel sobe para o topo dos cartões e da própria lista. */
  const aventureirosOrdenados = focusId
    ? [...aventureiros].sort((a, b) => (a.id === focusId ? -1 : b.id === focusId ? 1 : 0))
    : aventureiros;

  const updatePermission = (character: CharacterRow, field: PermissionField, value: boolean) => {
    const current = getPermissions(character);
    setPermissions({
      ...permissions,
      [character.id]: { ...current, [field]: value },
    });
  };

  const abrir = (characterId?: string) => {
    onStatus('');
    setFocusId(characterId ?? null);
    setIsOpen(true);
  };

  const fechar = () => setIsOpen(false);

  const salvarPermissoes = async () => {
    setSavingPermissionId('all');
    onStatus('');
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

      onAtualizarMesa();
      onStatus('Permissões salvas com sucesso.');
    } catch {
      onStatus('Não foi possível salvar as permissões.');
    } finally {
      setSavingPermissionId(null);
    }
  };

  return {
    isOpen,
    focusId,
    abrir,
    fechar,
    getPermissions,
    updatePermission,
    savingPermissionId,
    alteracoesPendentes,
    aventureirosOrdenados,
    aventureirosTesouro,
    resumoDaMesa,
    salvarPermissoes,
  };
}
