import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { BrandMark } from '../components/BrandMark';
import {
  ArrowLeft,
  Save, 
  Sparkles, 
  FileDown, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Camera,
  Upload,
  Sparkle,
  Palette,
  Check,
  Eye,
  Shield,
  Footprints,
  Sword,
  Package,
  Crosshair,
  Lock,
  ScrollText,
  Users,
  UserPlus
} from 'lucide-react';
import { useFichaStore } from '../store/useFichaStore';
import { useAuthorization } from '../hooks/useAuthorization';
import { Modal } from '../components/Modal';
import { GothicButton } from '../components/GothicButton';
import { GradeRdPecasArmadura } from '../components/GradeRdPecasArmadura';
import { getFichaTheme, FICHA_THEMES } from '../config/fichaThemes';
import { RPGInventoryModal } from '../components/RPGInventoryModal';
import { ModalDetalhesCompra } from '../components/ModalDetalhesCompra';
import { MercadoItem, ArmaduraCatalogItem, ArmamentoCatalogItem, MontariaCatalogItem } from '../types';
import {
  converterInventarioParaMercadoItem,
  equiparItemNaFicha,
  descartarItemDoInventario,
  isItemArmaOuArmadura
} from '../services/inventarioService';
import { enviarImagem } from '../services/mediaService';
import { getLearnedSpellIds, setLearnedSpell, listarMagiasPorIds } from '../services/grimorioService';
import { withTimeout } from '../utils/withTimeout';
import { SpellCard, SpellDetailsModal } from '../components/GrimorioSpellComponents';
import { ROUTES } from '../routes/paths';
import { mercadoService } from '@/services/mercadoService';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

export const FichaTecnicaPage: React.FC = () => {
  const navigate = useNavigate();
  const { characterId: routeCharacterId } = useParams<{ characterId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isArmorDetailsOpen, setIsArmorDetailsOpen] = useState(false);
  const [isMountDetailsOpen, setIsMountDetailsOpen] = useState(false);
  const [isWeaponDetailsOpen, setIsWeaponDetailsOpen] = useState(false);
  const [selectedWeaponSlot, setSelectedWeaponSlot] = useState<'arma_primaria' | 'segunda_arma' | 'arma_suporte' | 'arco_ld'>('arma_primaria');
  const [selectedWeaponSlotLabel, setSelectedWeaponSlotLabel] = useState<string>('ARMA PRIMÁRIA');
  const [isItemDetailsOpen, setIsItemDetailsOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any>(null);
  const [itemParaDetalhesFicha, setItemParaDetalhesFicha] = useState<MercadoItem | null>(null);
  const [inventoryModalCategory, setInventoryModalCategory] = useState<string>('all');
  const [equipTargetSlot, setEquipTargetSlot] = useState<'arma_primaria' | 'segunda_arma' | 'arma_suporte' | 'arco_ld' | 'armadura' | null>(null);
  const characterId = useFichaStore((state) => state.characterId);
  const ficha = useFichaStore((state) => state.ficha);
  const isLoading = useFichaStore((state) => state.isLoading);
  const loadError = useFichaStore((state) => state.loadError);
  const isSaving = useFichaStore((state) => state.isSaving);
  const hasUnsavedChanges = useFichaStore((state) => state.hasUnsavedChanges);
  const saveSuccessMessage = useFichaStore((state) => state.saveSuccessMessage);
  const loadFicha = useFichaStore((state) => state.loadFicha);
  const reloadFicha = useFichaStore((state) => state.reloadFicha);
  const updateFicha = useFichaStore((state) => state.updateFicha);
  const saveCurrentFicha = useFichaStore((state) => state.saveCurrentFicha);
  const isAuraModalOpen = useFichaStore((state) => state.isAuraModalOpen);
  const setAuraModalOpen = useFichaStore((state) => state.setAuraModalOpen);
  const isInventoryModalOpen = useFichaStore((state) => state.isInventoryModalOpen);
  const setInventoryModalOpen = useFichaStore((state) => state.setInventoryModalOpen);
  const isPdfModalOpen = useFichaStore((state) => state.isPdfModalOpen);
  const setPdfModalOpen = useFichaStore((state) => state.setPdfModalOpen);
  const { can } = useAuthorization();
  const [learnedSpellIds, setFichaLearnedSpellIds] = useState<string[]>([]);
  const [selectedSpell, setSelectedSpell] = useState<import('../mocks/grimorio').GrimorioSpell | null>(null);
  // A URL (/ficha/:characterId) é a fonte de verdade sobre qual ficha abrir.
  const targetCharacterId = routeCharacterId || characterId;
  const requestedCharacterRef = useRef<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    setFichaLearnedSpellIds([]);
    setSelectedSpell(null);
    const loadLearnedSpells = async () => {
      try {
        const ids = await withTimeout(getLearnedSpellIds(targetCharacterId));
        if (isCurrent) setFichaLearnedSpellIds(ids);
      } catch (error) {
        console.error('Erro ao carregar magias aprendidas da ficha', error);
      }
    };
    void loadLearnedSpells();
    return () => {
      isCurrent = false;
    };
  }, [targetCharacterId]);

  const learnedSpellsQuery = useQuery({
    queryKey: ['grimorio-magias', [...learnedSpellIds].sort()],
    queryFn: () => withTimeout(listarMagiasPorIds(learnedSpellIds)),
    enabled: learnedSpellIds.length > 0,
  });
  const isLoadingGrimorio = learnedSpellIds.length > 0 && learnedSpellsQuery.isLoading;
  const erroGrimorio = learnedSpellsQuery.error
    ? `Não foi possível carregar o grimório: ${learnedSpellsQuery.error instanceof Error ? learnedSpellsQuery.error.message : String(learnedSpellsQuery.error)}`
    : null;
  const hasLoadedGrimorio = learnedSpellIds.length === 0 || learnedSpellsQuery.isSuccess;

  useEffect(() => {
    if (!targetCharacterId) return;
    if (requestedCharacterRef.current === targetCharacterId) return;
    requestedCharacterRef.current = targetCharacterId;
    loadFicha(targetCharacterId);
  }, [targetCharacterId, loadFicha]);

  const [catalogoArmadurasExibicao, setCatalogoArmadurasExibicao] = useState<ArmaduraCatalogItem[]>([]);

  useEffect(() => {
    void mercadoService.getItensPorCategoria('mercado_armaduras').then((marketArmors) => {
      const customArmors: ArmaduraCatalogItem[] = marketArmors
        .map((item) => {
          const tipoStr = (item.tipo || '').toLowerCase();
          const isLeve = tipoStr.includes('leve');
          const isMedia = tipoStr.includes('méd') || tipoStr.includes('med');
          const tipoNorm: 'Leve' | 'Média' | 'Pesada' = isLeve ? 'Leve' : isMedia ? 'Média' : 'Pesada';
          const rdBase = Number(item.rd_base) || 0;
          return {
            id: item.id,
            nome: item.nome,
            tipo: tipoNorm,
            peso: Number(item.peso) || 0,
            rd_base: rdBase,
            material: item.material || '',
            pecas: item.pecas || (tipoNorm === 'Leve' ? 'Couraça, Manoplas, Calça, Grevas (4 peças)' : tipoNorm === 'Média' ? 'Couraça, Manoplas, Braçal, Calça, Coxote, Grevas (6 peças)' : 'Elmo, Gorjal, Couraça, Manoplas, Braçal, Calça, Coxote, Grevas (8 peças)'),
            efeito: item.efeito || '',
            preco: Number(item.preco) || 0,
            is_epico: Boolean(item.is_epico),
            descricao: item.descricao || '',
            rd_por_peca: {
              elmo: tipoNorm === 'Pesada' ? Math.max(1, Math.floor(rdBase / 4)) : 0,
              gorjal: tipoNorm === 'Pesada' ? Math.max(1, Math.floor(rdBase / 2)) : 0,
              couraca: rdBase,
              bracal: (tipoNorm === 'Pesada' || tipoNorm === 'Média') ? Math.max(1, Math.floor(rdBase / 2)) : 0,
              manoplas: Math.max(1, Math.floor(rdBase / 3)),
              coxote: (tipoNorm === 'Pesada' || tipoNorm === 'Média') ? Math.max(1, Math.floor(rdBase / 3)) : 0,
              calca: Math.max(1, Math.floor(rdBase / 2)),
              grevas: Math.max(1, Math.floor(rdBase / 3)),
            },
          };
        });
      setCatalogoArmadurasExibicao(customArmors);
    }).catch(() => {
      setCatalogoArmadurasExibicao([]);
    });
  }, []);

  useEffect(() => () => {
    void useFichaStore.getState().salvarPendente();
  }, []);

  // Itens consumíveis e gerais exibidos na tabela rápida da folha (Hook incondicional chamado no topo)
  const itensConsumiveisEOutros = useMemo(() => {
    return (ficha?.suporte?.inventario || []).filter((it) => {
      if (isItemArmaOuArmadura(it)) return false;
      const nome = (it.item || it.nome || '').trim().toLowerCase();
      return nome !== 'novo item';
    });
  }, [ficha?.suporte?.inventario]);

  const currentThemeKey = ficha?.identidade?.estilo_tema || 'sistema';
  const theme = getFichaTheme(currentThemeKey);
  const learnedSpells = useMemo(() => {
    const magias = learnedSpellsQuery.data?.magias ?? [];
    const ocultas = learnedSpellsQuery.data?.ocultas ?? [];
    return magias.filter((spell) => !ocultas.includes(spell.id));
  }, [learnedSpellsQuery.data]);
  const toggleFichaSpell = (spellId: string) => {
    const character = targetCharacterId;
    const learned = !learnedSpellIds.includes(spellId);
    setFichaLearnedSpellIds((current) => learned ? [...current, spellId] : current.filter((id) => id !== spellId));
    void setLearnedSpell(character, spellId, learned).catch(async (error) => {
      console.error('Erro ao atualizar magia aprendida na ficha', error);
      try {
        setFichaLearnedSpellIds(await withTimeout(getLearnedSpellIds(character)));
      } catch (reloadError) {
        console.error('Erro ao recarregar magias aprendidas da ficha', reloadError);
      }
    });
  };

  if (loadError) {
    return (
      <PageShell
        variant="amplo"
        fill
        title={<h2 className="flex items-center gap-2"><ScrollText className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />Ficha Técnica{ficha?.identidade?.nome_personagem && <span className="text-[#f2dfa8]">{ficha.identidade.nome_personagem}</span>}</h2>}
      >
        <ErrorState
          title="Não foi possível abrir a ficha"
          description={loadError}
          onRetry={() => { void reloadFicha(); }}
        />
      </PageShell>
    );
  }

  if (!targetCharacterId) {
    return (
      <PageShell
        variant="amplo"
        fill
        title={<h2 className="flex items-center gap-2"><ScrollText className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />Ficha Técnica</h2>}
      >
        <EmptyState
          variant="plano"
          icon={<Users className="h-8 w-8" aria-hidden="true" />}
          title="Nenhum personagem selecionado"
          description="Crie um personagem no seu acervo para abrir a ficha técnica."
          action={
            <GothicButton size="sm" icon={<UserPlus className="h-4 w-4" aria-hidden="true" />} onClick={() => navigate(ROUTES.personagens)}>
              Ir para Personagens
            </GothicButton>
          }
        />
      </PageShell>
    );
  }

  if (isLoading || !ficha) {
    return (
      <PageShell
        variant="amplo"
        fill
        title={<h2 className="flex items-center gap-2"><ScrollText className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />Ficha Técnica{ficha?.identidade?.nome_personagem && <span className="text-[#f2dfa8]">{ficha.identidade.nome_personagem}</span>}</h2>}
      >
        <div role="status" aria-live="polite" className="space-y-6">
          <span className="sr-only">Invocando os pergaminhos da ficha técnica…</span>
          <Skeleton className="h-14 w-full" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </PageShell>
    );
  }

  // Somente leitura: o dono da ficha pode ter a edição congelada pelo Mestre da mesa.
  const readOnly = !can.editFicha(ficha);

  const processImageFile = async (file: File) => {
    setImageUploadError(null);
    if (!file.type.startsWith('image/')) {
      setImageUploadError('Por favor selecione um arquivo de imagem válido (JPG, PNG, WebP, etc.).');
      return;
    }
    setIsUploadingImage(true);
    try {
      const imageUrl = await enviarImagem(file, 'fichas', { maxWidth: 600, maxHeight: 600, quality: 0.82 });
      if (imageUrl) handleIdentidadeChange('imagem_url', imageUrl);
    } catch (err) {
      setImageUploadError(err instanceof Error ? err.message : 'Não foi possível enviar a imagem. Tente novamente.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Helpers para atualização reativa
  const handleIdentidadeChange = (field: keyof typeof ficha.identidade, val: any) => {
    updateFicha((prev) => ({
      ...prev,
      identidade: {
        ...prev.identidade,
        [field]: val,
      },
    }));
  };

  const handleSuporteChange = (field: keyof typeof ficha.suporte, val: any) => {
    updateFicha((prev) => ({
      ...prev,
      suporte: {
        ...prev.suporte,
        [field]: val,
      },
    }));
  };

  const handleArmaduraNomeChange = (val: string) => {
    updateFicha((prev) => ({
      ...prev,
      suporte: {
        ...prev.suporte,
        armadura: {
          ...prev.suporte.armadura,
          nome: val,
        },
      },
    }));
  };

  const handleSelectArmorFromCatalog = (armor: ArmaduraCatalogItem) => {
    const tipoStr = (armor.tipo || '').toLowerCase();
    const isLeve = tipoStr.includes('leve');
    const isMedia = tipoStr.includes('méd') || tipoStr.includes('med');
    const categoriaNormalizada: 'Leve' | 'Média' | 'Pesada' = isLeve ? 'Leve' : isMedia ? 'Média' : 'Pesada';

    const rdBase = armor.rd_base || armor.rd_por_peca?.couraca || 0;

    let elmo = 0;
    let gorjal = 0;
    let couraca = 0;
    let bracal = 0;
    let manoplas = 0;
    let coxote = 0;
    let calca = 0;
    let grevas = 0;

    // Regras de Proteção por Categoria:
    // - Leve Protege: Couraça, Manoplas, Calça, Grevas (4 peças)
    // - Média Protege: Couraça, Manoplas, Braçal, Calça, Coxote, Grevas (6 peças)
    // - Pesada Protege: Elmo, Gorjal, Couraça, Manoplas, Braçal, Calça, Coxote, Grevas (8 peças)
    if (categoriaNormalizada === 'Leve') {
      couraca = armor.rd_por_peca?.couraca || rdBase;
      manoplas = armor.rd_por_peca?.manoplas || Math.max(1, Math.floor(rdBase / 3));
      calca = armor.rd_por_peca?.calca || Math.max(1, Math.floor(rdBase / 2));
      grevas = armor.rd_por_peca?.grevas || Math.max(1, Math.floor(rdBase / 3));
      elmo = 0;
      gorjal = 0;
      bracal = 0;
      coxote = 0;
    } else if (categoriaNormalizada === 'Média') {
      couraca = armor.rd_por_peca?.couraca || rdBase;
      manoplas = armor.rd_por_peca?.manoplas || Math.max(1, Math.floor(rdBase / 3));
      bracal = armor.rd_por_peca?.bracal || Math.max(1, Math.floor(rdBase / 2));
      calca = armor.rd_por_peca?.calca || Math.max(1, Math.floor(rdBase / 2));
      coxote = armor.rd_por_peca?.coxote || Math.max(1, Math.floor(rdBase / 3));
      grevas = armor.rd_por_peca?.grevas || Math.max(1, Math.floor(rdBase / 3));
      elmo = 0;
      gorjal = 0;
    } else {
      elmo = armor.rd_por_peca?.elmo || Math.max(1, Math.floor(rdBase / 4));
      gorjal = armor.rd_por_peca?.gorjal || Math.max(1, Math.floor(rdBase / 2));
      couraca = armor.rd_por_peca?.couraca || rdBase;
      bracal = armor.rd_por_peca?.bracal || Math.max(1, Math.floor(rdBase / 2));
      manoplas = armor.rd_por_peca?.manoplas || Math.max(1, Math.floor(rdBase / 3));
      coxote = armor.rd_por_peca?.coxote || Math.max(1, Math.floor(rdBase / 3));
      calca = armor.rd_por_peca?.calca || Math.max(1, Math.floor(rdBase / 2));
      grevas = armor.rd_por_peca?.grevas || Math.max(1, Math.floor(rdBase / 3));
    }

    updateFicha((prev) => ({
      ...prev,
      suporte: {
        ...prev.suporte,
        armadura: {
          ...prev.suporte.armadura,
          nome: armor.nome,
          peso: armor.peso,
          efeito: armor.efeito || '',
          tipo: categoriaNormalizada,
          material: armor.material,
          requisitos: armor.requisitos || '',
          descricao: armor.descricao || '',
          elmo,
          gorjal,
          couraca,
          bracal,
          manoplas,
          coxote,
          calca,
          grevas,
        },
      },
    }));
  };

  const handleMontariaNomeChange = (val: string) => {
    updateFicha((prev) => ({
      ...prev,
      suporte: {
        ...prev.suporte,
        montaria: {
          ...(prev.suporte.montaria || { cabeca: 0, tronco: 0, superiores: 0, inferiores: 0 }),
          nome: val,
        },
      },
    }));
  };

  const handleSelectMountFromCatalog = (mount: MontariaCatalogItem) => {
    updateFicha((prev) => ({
      ...prev,
      suporte: {
        ...prev.suporte,
        montaria: {
          ...(prev.suporte.montaria || {}),
          nome: mount.nome,
          raca: mount.raca,
          tipo: mount.tipo,
          peso: mount.peso,
          velocidade: mount.velocidade,
          habilidades: mount.habilidades,
          requisitos: mount.requisitos || '',
          descricao: mount.descricao || '',
          cabeca: mount.rd_por_peca.cabeca,
          tronco: mount.rd_por_peca.tronco,
          superiores: mount.rd_por_peca.superiores,
          inferiores: mount.rd_por_peca.inferiores,
        },
      },
    }));
  };

  const handleMontariaRdChange = (part: 'cabeca' | 'tronco' | 'superiores' | 'inferiores', val: number) => {
    updateFicha((prev) => {
      const currentMontaria = {
        ...(prev.suporte.montaria || { cabeca: 0, tronco: 0, superiores: 0, inferiores: 0 }),
        [part]: val,
      };

      if (part === 'tronco') {
        const rdBase = val;
        currentMontaria.cabeca = Math.floor(rdBase / 2);
        currentMontaria.superiores = Math.floor(rdBase / 2);
        currentMontaria.inferiores = Math.floor(rdBase / 2);
      }

      return {
        ...prev,
        suporte: {
          ...prev.suporte,
          montaria: currentMontaria,
        },
      };
    });
  };

  const handleArmaduraChange = (part: keyof typeof ficha.suporte.armadura, val: number) => {
    updateFicha((prev) => {
      const currentArmadura = { ...prev.suporte.armadura, [part]: val };
      
      // Se a Couraça (RD Base) for alterada, recalcula a distribuição automática de RD de acordo com a categoria:
      // - Leve Protege: Couraça, Manoplas, Calça, Grevas (4 peças)
      // - Média Protege: Couraça, Manoplas, Braçal, Calça, Coxote, Grevas (6 peças)
      // - Pesada Protege: Elmo, Gorjal, Couraça, Manoplas, Braçal, Calça, Coxote, Grevas (8 peças)
      if (part === 'couraca') {
        const rdBase = val;
        const tipoStr = (currentArmadura.tipo || 'Pesada').toLowerCase();
        const isLeve = tipoStr.includes('leve');
        const isMedia = tipoStr.includes('méd') || tipoStr.includes('med');

        if (isLeve) {
          currentArmadura.elmo = 0;
          currentArmadura.gorjal = 0;
          currentArmadura.bracal = 0;
          currentArmadura.coxote = 0;
          currentArmadura.calca = Math.floor(rdBase / 2);
          currentArmadura.manoplas = Math.floor(rdBase / 3);
          currentArmadura.grevas = Math.floor(rdBase / 3);
        } else if (isMedia) {
          currentArmadura.elmo = 0;
          currentArmadura.gorjal = 0;
          currentArmadura.bracal = Math.floor(rdBase / 2);
          currentArmadura.calca = Math.floor(rdBase / 2);
          currentArmadura.manoplas = Math.floor(rdBase / 3);
          currentArmadura.coxote = Math.floor(rdBase / 3);
          currentArmadura.grevas = Math.floor(rdBase / 3);
        } else {
          currentArmadura.elmo = Math.floor(rdBase / 4);
          currentArmadura.gorjal = Math.floor(rdBase / 2);
          currentArmadura.bracal = Math.floor(rdBase / 2);
          currentArmadura.calca = Math.floor(rdBase / 2);
          currentArmadura.manoplas = Math.floor(rdBase / 3);
          currentArmadura.coxote = Math.floor(rdBase / 3);
          currentArmadura.grevas = Math.floor(rdBase / 3);
        }
      }

      return {
        ...prev,
        suporte: {
          ...prev.suporte,
          armadura: currentArmadura,
        },
      };
    });
  };

  const handleArmamentoFieldChange = (
    weapon: 'arma_primaria' | 'segunda_arma' | 'arma_suporte' | 'arco_ld',
    field: string,
    val: any
  ) => {
    updateFicha((prev) => {
      const currentArmamento = prev.suporte.armamento || ({} as any);
      const currentWeapon = currentArmamento[weapon] || {};
      const updatedWeapon = {
        ...currentWeapon,
        [field]: val,
      };

      // Automação: Se alterar o dano da arma corpo a corpo, calcula automaticamente o dano_total com o Dano Natural
      if (weapon !== 'arco_ld' && (field === 'dano_arma' || field === 'dano')) {
        const danoArmaNum = parseInt(String(val).replace(/[^0-9-]/g, ''), 10);
        const danoNatural = Number(prev.suporte.dano_natural) || 0;
        if (!isNaN(danoArmaNum) && String(val).trim() !== '') {
          updatedWeapon.dano_total = String(danoArmaNum + danoNatural);
        } else if (String(val).trim() === '') {
          updatedWeapon.dano_total = '';
        }
      }

      // Automação ARCO (LD): Tensão + Flecha (Dano da Flecha) = Total
      if (weapon === 'arco_ld') {
        const flechaVal = field === 'dano_flecha' || field === 'dano' ? val : (currentWeapon.dano_flecha ?? currentWeapon.dano ?? '');
        const tensaoVal = field === 'tensao' ? val : (currentWeapon.tensao ?? 0);

        if (field === 'dano_flecha' || field === 'dano' || field === 'tensao') {
          const flechaNum = parseInt(String(flechaVal).replace(/[^0-9-]/g, ''), 10);
          const tensaoNum = Number(tensaoVal) || 0;

          if (!isNaN(flechaNum) && String(flechaVal).trim() !== '') {
            updatedWeapon.dano_total = String(tensaoNum + flechaNum);
          } else if (String(flechaVal).trim() === '') {
            updatedWeapon.dano_total = '';
          }
        }
      }

      return {
        ...prev,
        suporte: {
          ...prev.suporte,
          armamento: {
            ...currentArmamento,
            [weapon]: updatedWeapon,
          },
        },
      };
    });
  };

  const handleOpenWeaponDetails = (slot: 'arma_primaria' | 'segunda_arma' | 'arma_suporte' | 'arco_ld', label: string) => {
    setSelectedWeaponSlot(slot);
    setSelectedWeaponSlotLabel(label);
    setEquipTargetSlot(slot);

    const currentArmamento = ficha.suporte.armamento || ({} as any);
    const weapon = currentArmamento[slot] || {};
    const isRanged = slot === 'arco_ld';

    const mercItem = converterInventarioParaMercadoItem({
      id: `arma-${slot}`,
      item: weapon.nome || label,
      nome: weapon.nome || label,
      dano: isRanged ? weapon.dano_flecha || weapon.dano : weapon.dano_arma || weapon.dano,
      dano_total: weapon.dano_total,
      resist: weapon.resist,
      peso: weapon.peso || 1,
      preco: weapon.preco,
      material: weapon.material,
      tensao: weapon.tensao,
      prec: weapon.prec,
      efeito: weapon.efeito,
      efeito_resumo: weapon.efeito_resumo || weapon.efeito,
      efeito_completo: weapon.efeito_completo || weapon.efeito,
      requisitos: weapon.requisitos,
      descricao: weapon.citacao || weapon.descricao || weapon.efeito || `Equipamento de combate alocado no espaço de ${label}.`,
      citacao: weapon.citacao,
      informacoes: weapon.informacoes || weapon.citacao,
      categoria: weapon.categoria || (isRanged ? 'mercado_ld' : (slot === 'arma_suporte' || slot === 'segunda_arma' && String(weapon.categoria || '').includes('Escudo')) ? 'epico_escudos' : 'mercado_armas'),
      tipo: weapon.tipo || (slot === 'arma_suporte' ? 'Escudo' : isRanged ? 'Longa Distância' : 'Corpo a Corpo'),
      subcategoria: weapon.subcategoria,
      is_epico: Boolean(weapon.is_epico),
      imagem_url: weapon.imagem_url,
    });

    setItemParaDetalhesFicha(mercItem);
  };

  const handleOpenWeaponCatalog = (slot: 'arma_primaria' | 'segunda_arma' | 'arma_suporte' | 'arco_ld', _label: string) => {
    setSelectedWeaponSlot(slot);
    setEquipTargetSlot(slot);
    if (slot === 'arma_suporte') {
      setInventoryModalCategory('escudos');
    } else if (slot === 'arco_ld') {
      setInventoryModalCategory('mercado_ld');
    } else {
      setInventoryModalCategory('mercado_armas');
    }
    setInventoryModalOpen(true);
  };

  const handleSelectWeaponFromCatalog = (weapon: ArmamentoCatalogItem) => {
    const slot = selectedWeaponSlot;

    // Apenas escudos podem ser equipados no slot de Escudo (arma_suporte)
    if (slot === 'arma_suporte') {
      const cat = String(weapon.categoria || '').toLowerCase();
      const nomeLower = String(weapon.nome || '').toLowerCase();
      const tipoLower = String((weapon as any).tipo || '').toLowerCase();
      const isEscudo =
        cat === 'mercado_escudos' ||
        cat === 'epico_escudos' ||
        (weapon as any).rd_base !== undefined ||
        (weapon as any).icone_tipo === 'shield' ||
        (weapon as any).icone_tipo === 'shield_tower' ||
        nomeLower.includes('escudo') ||
        tipoLower.includes('escudo') ||
        ['broquel', 'rodado', 'targe', 'micênico', 'micenico', 'greco', 'heather', 'torre', 'gothic', 'pipa', 'pavise', 'golem', 'dragão', 'dragao'].some(s => tipoLower.includes(s) || nomeLower.includes(s));

      if (!isEscudo) {
        alert('Apenas escudos podem ser equipados no slot de Escudo.');
        return;
      }
    }

    updateFicha((prev) => {
      const currentArmamento = prev.suporte.armamento || ({} as any);

      let danoTotal = '';
      if (slot === 'arma_suporte') {
        danoTotal = '0';
      } else if (slot !== 'arco_ld') {
        const danoArmaNum = parseInt(String(weapon.dano).replace(/[^0-9-]/g, ''), 10);
        const danoNatural = Number(prev.suporte.dano_natural) || 0;
        danoTotal = !isNaN(danoArmaNum) ? String(danoArmaNum + danoNatural) : String(weapon.dano);
      } else {
        const flechaNum = parseInt(String(weapon.dano).replace(/[^0-9-]/g, ''), 10);
        const tensaoNum = Number(weapon.tensao) || 0;
        danoTotal = !isNaN(flechaNum) ? String(tensaoNum + flechaNum) : String(weapon.dano);
      }

      const updatedSlotData = {
        nome: weapon.nome,
        dano: slot === 'arma_suporte' ? '0' : String(weapon.dano),
        dano_arma: slot === 'arma_suporte' ? '0' : (slot !== 'arco_ld' ? String(weapon.dano) : undefined),
        dano_flecha: slot === 'arco_ld' ? String(weapon.dano) : undefined,
        dano_total: danoTotal,
        resist: (weapon as any).rd_base ?? weapon.resist ?? 20,
        rd_base: (weapon as any).rd_base ?? weapon.resist ?? 20,
        peso: weapon.peso,
        efeito: weapon.efeito_resumo,
        efeito_completo: weapon.efeito_completo,
        categoria: slot === 'arma_suporte' ? 'Escudo' : weapon.categoria,
        material: weapon.material,
        requisitos: weapon.requisitos,
        descricao: weapon.descricao,
        citacao: (weapon as any).citacao,
        tipo: (weapon as any).tipo || (slot === 'arma_suporte' ? 'Escudo' : undefined),
        preco: (weapon as any).preco,
        imagem_url: (weapon as any).imagem_url,
        icone_tipo: (weapon as any).icone_tipo || (slot === 'arma_suporte' ? 'shield' : undefined),
        is_epico: weapon.is_epico,
        prec: weapon.prec ?? (slot === 'arco_ld' ? 0 : undefined),
        tensao: weapon.tensao ?? (slot === 'arco_ld' ? 0 : undefined),
      };

      return {
        ...prev,
        suporte: {
          ...prev.suporte,
          armamento: {
            ...currentArmamento,
            [slot]: updatedSlotData,
          },
        },
      };
    });
  };

  const handleArmamentoPrimarioChange = (field: string, val: any) => {
    handleArmamentoFieldChange('arma_primaria', field, val);
  };

  const handleArcoChange = (field: string, val: any) => {
    handleArmamentoFieldChange('arco_ld', field, val);
  };

  const handleStatusExtPerChange = (field: keyof typeof ficha.suporte.ext_per, val: number) => {
    updateFicha((prev) => ({
      ...prev,
      suporte: {
        ...prev.suporte,
        ext_per: {
          ...prev.suporte.ext_per,
          [field]: val,
        },
      },
    }));
  };

  const getTreinamentoBaseAttr = (categoria: string, tipo: string, atributos: typeof ficha.atributos) => {
    const getVal = (d?: { valor_base?: number; extra?: number; perda?: number }) =>
      (d?.valor_base || 0) + (d?.extra || 0) - (d?.perda || 0);

    if (categoria === 'Maestria') {
      if (tipo === 'COMB') return getVal(atributos.comb);
      if (tipo === 'PONT') return getVal(atributos.pont);
      if (tipo === 'MAGIA') return getVal(atributos.int);
      if (tipo === 'ESCUDO_MAGICO' || tipo === 'ESC_MAG') return getVal(atributos.int);
      if (tipo === 'ESCUDO' || tipo === 'ESC') return getVal(atributos.comb);
      return getVal(atributos.comb);
    } else if (categoria === 'Habilidade') {
      if (tipo === 'AGI') return getVal(atributos.agi);
      if (tipo === 'INT') return getVal(atributos.int);
      if (tipo === 'CAR') return getVal(atributos.car);
      if (tipo === 'ART') return getVal(atributos.art);
      return 10;
    }
    return 10;
  };

  const handleAtributoChange = (key: string, subfield: 'valor_base' | 'extra' | 'perda', val: number) => {
    updateFicha((prev) => {
      const updatedAtributos = {
        ...prev.atributos,
        [key]: {
          ...(prev.atributos as any)[key],
          [subfield]: val,
        },
      };

      // Recalcula o NH de todos os treinamentos/maestrias com base nos novos atributos
      const updatedTreinamentos = (prev.treinamentos || []).map((t) => {
        const grad = Number(t.graduacao) || 0;
        const baseAttr = getTreinamentoBaseAttr(t.categoria, t.tipo, updatedAtributos);
        return {
          ...t,
          nh_calculado: baseAttr + grad,
        };
      });

      return {
        ...prev,
        atributos: updatedAtributos,
        treinamentos: updatedTreinamentos,
      };
    });
  };

  const handleTreinamentoChange = (id: string, field: string, val: any) => {
    updateFicha((prev) => {
      const updatedTreinamentos = prev.treinamentos.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, [field]: val };
        // Se a graduação for alterada, recalcula o NH imediatamente: NH = Atributo + GRAD
        if (field === 'graduacao') {
          const grad = Number(val) || 0;
          const baseAttr = getTreinamentoBaseAttr(t.categoria, t.tipo, prev.atributos);
          updated.nh_calculado = baseAttr + grad;
        }
        return updated;
      });
      return {
        ...prev,
        treinamentos: updatedTreinamentos,
      };
    });
  };

  const handleAddTreinamento = (categoria: 'Maestria' | 'Habilidade', tipo: string) => {
    const newId = `t-${Date.now()}`;
    const baseAttr = getTreinamentoBaseAttr(categoria, tipo, ficha.atributos);
    const initialGrad = 0;
    updateFicha((prev) => ({
      ...prev,
      treinamentos: [
        ...prev.treinamentos,
        {
          id: newId,
          ficha_id: prev.identidade.id,
          categoria,
          tipo,
          nome: 'Nova Entrada',
          graduacao: initialGrad,
          nh_calculado: baseAttr + initialGrad,
        },
      ],
    }));
  };

  const handleRemoveTreinamento = (id: string) => {
    updateFicha((prev) => ({
      ...prev,
      treinamentos: prev.treinamentos.filter((t) => t.id !== id),
    }));
  };

  const handleAddInventario = () => {
    const newId = `inv-${Date.now()}`;
    updateFicha((prev) => ({
      ...prev,
      suporte: {
        ...prev.suporte,
        inventario: [
          ...(prev.suporte.inventario || []),
          { id: newId, item: '', peso: 0, quantidade: 1, descricao: '' },
        ],
      },
    }));
  };

  const handleOpenItemDetails = (item: any) => {
    setSelectedInventoryItem(item);
    setEquipTargetSlot(null);
    const mercItem = converterInventarioParaMercadoItem(item);
    setItemParaDetalhesFicha(mercItem);
  };

  const handleOpenArmorDetails = () => {
    setEquipTargetSlot('armadura');
    const arm = ficha.suporte.armadura || ({} as any);
    const mercItem = converterInventarioParaMercadoItem({
      id: 'armadura-equipada',
      item: arm.nome || 'Armadura de Placas Reais',
      nome: arm.nome || 'Armadura de Placas Reais',
      peso: arm.peso || 14,
      tipo: arm.tipo || 'Pesada',
      material: arm.material || 'Aço Forjado & Placas Batidas',
      rd_base: arm.couraca || arm.rd_base || 8,
      resist: 25,
      efeito: arm.efeito || 'Proteção Completa',
      descricao: arm.descricao || 'Armadura completa de placas nobres com peças articuladas e forja reforçada.',
      categoria: 'mercado_armaduras',
      imagem_url: arm.imagem_url,
      rd_por_peca: {
        elmo: arm.elmo || 0,
        gorjal: arm.gorjal || 0,
        couraca: arm.couraca || 0,
        bracal: arm.bracal || 0,
        manoplas: arm.manoplas || 0,
        coxote: arm.coxote || 0,
        calca: arm.calca || 0,
        grevas: arm.grevas || 0,
      },
    });
    setItemParaDetalhesFicha(mercItem);
  };

  const handleOpenMountDetails = () => {
    setEquipTargetSlot(null);
    const m = ficha.suporte.montaria || ({} as any);
    const mercItem = converterInventarioParaMercadoItem({
      id: 'montaria-equipada',
      item: m.nome || 'Montaria',
      nome: m.nome || 'Montaria',
      peso: m.peso || 450,
      material: m.raca || 'Montaria Nobre',
      efeito: m.habilidades || m.efeito,
      descricao: m.descricao || `Montaria treinada com velocidade de ${m.velocidade || '14 m/turno'}.`,
      categoria: 'mercado_geral',
      icone_tipo: 'general',
      imagem_url: m.imagem_url,
    });
    setItemParaDetalhesFicha(mercItem);
  };

  const handleEquiparFicha = async (mercItem: MercadoItem, slot?: string) => {
    const slotFinal = slot ?? equipTargetSlot ?? undefined;
    updateFicha((prev) => equiparItemNaFicha(prev, mercItem, slotFinal).fichaAtualizada);
  };

  const handleDescartarFicha = async (mercItem: MercadoItem) => {
    updateFicha((prev) => descartarItemDoInventario(prev, mercItem).fichaAtualizada);
    setItemParaDetalhesFicha(null);
  };

  const handleConsumirFicha = async (mercItem: MercadoItem) => {
    updateFicha((prev) => {
      const inv = [...(prev.suporte.inventario || [])];
      const idx = inv.findIndex((i) => i.id === mercItem.id || i.item === mercItem.nome);
      if (idx !== -1) {
        const q = (inv[idx].quantidade || 1) - 1;
        if (q <= 0) {
          inv.splice(idx, 1);
        } else {
          inv[idx] = { ...inv[idx], quantidade: q };
        }
      }
      return {
        ...prev,
        suporte: {
          ...prev.suporte,
          inventario: inv,
        },
      };
    });
    setItemParaDetalhesFicha(null);
  };

  const handleOpenItemCatalog = (_itemTargetId?: string) => {
    setInventoryModalCategory('all');
    setEquipTargetSlot(null);
    setInventoryModalOpen(true);
  };

  const handleInventarioItemChange = (id: string, field: string, val: any) => {
    updateFicha((prev) => ({
      ...prev,
      suporte: {
        ...prev.suporte,
        inventario: (prev.suporte.inventario || []).map((it) => (it.id === id ? { ...it, [field]: val } : it)),
      },
    }));
  };

  const handleRemoveInventarioItem = (id: string) => {
    const itemAlvo = (ficha?.suporte?.inventario || []).find((it) => it.id === id);
    if (!itemAlvo) return;

    // Se for uma linha de rascunho manual criada via "+ ADICIONAR" (sem preço e sem vínculo de mercadoria)
    const isRascunhoManual = String(id).startsWith('inv-') && !itemAlvo.preco && !itemAlvo.categoria;

    if (isRascunhoManual) {
      updateFicha((prev) => ({
        ...prev,
        suporte: {
          ...prev.suporte,
          inventario: (prev.suporte.inventario || []).filter((it) => it.id !== id),
        },
      }));
      return;
    }

    // Regra estrita: "A única forma de descartar alguma coisa do inventário deve ser entrando nele e ir lá no botão de descartar."
    // Mercadorias e itens do inventário não são descartados silenciosamente pela lixeira rápida da folha.
    // Em vez disso, abre os detalhes com o botão e confirmação de Descarte oficial do inventário.
    const mercItem = converterInventarioParaMercadoItem(itemAlvo);
    setItemParaDetalhesFicha(mercItem);
  };

  // Categorias de Treinamentos
  const maestriasCombate = (ficha.treinamentos || []).filter((t) => t.categoria === 'Maestria' && t.tipo === 'COMB');
  const maestriasPontaria = (ficha.treinamentos || []).filter((t) => t.categoria === 'Maestria' && t.tipo === 'PONT');
  const maestriasMagicas = (ficha.treinamentos || []).filter((t) => t.categoria === 'Maestria' && t.tipo === 'MAGIA');
  const maestriaEscudo = (ficha.treinamentos || []).find((t) => t.categoria === 'Maestria' && (t.tipo === 'ESCUDO' || t.tipo === 'ESC')) || {
    id: 'escudo-fixo',
    ficha_id: ficha.identidade.id,
    categoria: 'Maestria' as const,
    tipo: 'ESCUDO',
    nome: 'Escudo',
    graduacao: 0,
    nh_calculado: getTreinamentoBaseAttr('Maestria', 'ESCUDO', ficha.atributos),
  };

  const maestriaEscudoMagico = (ficha.treinamentos || []).find((t) => t.categoria === 'Maestria' && (t.tipo === 'ESCUDO_MAGICO' || t.tipo === 'ESC_MAG')) || {
    id: 'escudo-magico-fixo',
    ficha_id: ficha.identidade.id,
    categoria: 'Maestria' as const,
    tipo: 'ESCUDO_MAGICO',
    nome: 'Escudo Mágico',
    graduacao: 0,
    nh_calculado: getTreinamentoBaseAttr('Maestria', 'ESCUDO_MAGICO', ficha.atributos),
  };

  const handleEscudoChange = (field: 'nome' | 'graduacao' | 'nh_calculado', val: any) => {
    updateFicha((prev) => {
      const exists = (prev.treinamentos || []).some((t) => t.categoria === 'Maestria' && (t.tipo === 'ESCUDO' || t.tipo === 'ESC'));
      let updatedTreinamentos: typeof prev.treinamentos;
      if (exists) {
        updatedTreinamentos = (prev.treinamentos || []).map((t) => {
          if (t.categoria === 'Maestria' && (t.tipo === 'ESCUDO' || t.tipo === 'ESC')) {
            const updated = { ...t, [field]: val };
            if (field === 'graduacao') {
              const grad = Number(val) || 0;
              const baseAttr = getTreinamentoBaseAttr('Maestria', 'ESCUDO', prev.atributos);
              updated.nh_calculado = baseAttr + grad;
            }
            return updated;
          }
          return t;
        });
      } else {
        const baseAttr = getTreinamentoBaseAttr('Maestria', 'ESCUDO', prev.atributos);
        const grad = field === 'graduacao' ? (Number(val) || 0) : 0;
        const initialItem = {
          id: `t-escudo-${Date.now()}`,
          ficha_id: prev.identidade.id,
          categoria: 'Maestria' as const,
          tipo: 'ESCUDO',
          nome: field === 'nome' ? val : 'Escudo',
          graduacao: grad,
          nh_calculado: field === 'nh_calculado' ? (Number(val) || 0) : baseAttr + grad,
        };
        updatedTreinamentos = [...(prev.treinamentos || []), initialItem];
      }
      return {
        ...prev,
        treinamentos: updatedTreinamentos,
      };
    });
  };

  const handleEscudoMagicoChange = (field: 'nome' | 'graduacao' | 'nh_calculado', val: any) => {
    updateFicha((prev) => {
      const exists = (prev.treinamentos || []).some((t) => t.categoria === 'Maestria' && (t.tipo === 'ESCUDO_MAGICO' || t.tipo === 'ESC_MAG'));
      let updatedTreinamentos: typeof prev.treinamentos;
      if (exists) {
        updatedTreinamentos = (prev.treinamentos || []).map((t) => {
          if (t.categoria === 'Maestria' && (t.tipo === 'ESCUDO_MAGICO' || t.tipo === 'ESC_MAG')) {
            const updated = { ...t, [field]: val };
            if (field === 'graduacao') {
              const grad = Number(val) || 0;
              const baseAttr = getTreinamentoBaseAttr('Maestria', 'ESCUDO_MAGICO', prev.atributos);
              updated.nh_calculado = baseAttr + grad;
            }
            return updated;
          }
          return t;
        });
      } else {
        const baseAttr = getTreinamentoBaseAttr('Maestria', 'ESCUDO_MAGICO', prev.atributos);
        const grad = field === 'graduacao' ? (Number(val) || 0) : 0;
        const initialItem = {
          id: `t-escudo-magico-${Date.now()}`,
          ficha_id: prev.identidade.id,
          categoria: 'Maestria' as const,
          tipo: 'ESCUDO_MAGICO',
          nome: field === 'nome' ? val : 'Escudo Mágico',
          graduacao: grad,
          nh_calculado: field === 'nh_calculado' ? (Number(val) || 0) : baseAttr + grad,
        };
        updatedTreinamentos = [...(prev.treinamentos || []), initialItem];
      }
      return {
        ...prev,
        treinamentos: updatedTreinamentos,
      };
    });
  };

  const habAgi = (ficha.treinamentos || []).filter((t) => t.categoria === 'Habilidade' && t.tipo === 'AGI');
  const habInt = (ficha.treinamentos || []).filter((t) => t.categoria === 'Habilidade' && t.tipo === 'INT');
  const habCar = (ficha.treinamentos || []).filter((t) => t.categoria === 'Habilidade' && t.tipo === 'CAR');
  const habArt = (ficha.treinamentos || []).filter((t) => t.categoria === 'Habilidade' && t.tipo === 'ART');

  // Valores dos atributos
  const getAttrTotal = (key: string) => {
    const d = (ficha.atributos as any)[key] || { valor_base: 10, extra: 0, perda: 0 };
    return (d.valor_base || 0) + (d.extra || 0) - (d.perda || 0);
  };

  return (
    <PageShell
      variant="amplo"
      fill
      title={
        <h2 className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
          Ficha Técnica
          {ficha.identidade.nome_personagem && <span className="text-[#f2dfa8]">{ficha.identidade.nome_personagem}</span>}
        </h2>
      }
    >
      <div className="space-y-6">
      {/* ========================================================================= */}
      {/* BARRA SUPERIOR DE CONTROLE E AÇÕES                                        */}
      {/* ========================================================================= */}
      <div className={`border ${theme.headerBorder} ${theme.headerBarBg}/95 backdrop-blur-md px-3 sm:px-5 py-2.5 sm:py-3 rounded-xs shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 transition-colors`}>
        {/* Linha 1: Voltar e Status de Salvamento */}
        <div className="flex items-center justify-between sm:justify-start space-x-3 w-full sm:w-auto">
          <button
            id="btn-voltar-galeria"
            onClick={() => navigate(ROUTES.personagens)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs ${theme.btnSecondary} hover:brightness-110 active:scale-95 transition-all rounded-xs font-cinzel uppercase tracking-wider shadow-sm shrink-0`}
          >
            <ArrowLeft size={13} />
            <span>Voltar</span>
          </button>

          {/* Indicadores de Estado da Ficha */}
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <span className={`text-[10px] ${theme.badgeBg} ${theme.textSubtitle} px-2.5 py-1 rounded-xs border ${theme.badgeBorder} font-serif italic shadow-xs`}>
                Alterações não salvas
              </span>
            )}
            {saveSuccessMessage && (
              <span className="flex items-center space-x-1 text-[10px] bg-emerald-950/80 text-emerald-300 px-2.5 py-1 rounded-xs border border-emerald-500/60 font-serif shadow-xs">
                <CheckCircle2 size={11} />
                <span>Salvo com sucesso</span>
              </span>
            )}
          </div>
        </div>

        {/* Linha 2 (Mobile) / Lado Direito (Desktop): Ações da Ficha */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2.5 w-full sm:w-auto sm:ml-auto">
          <GothicButton
            id="btn-abrir-inventario-topo"
            onClick={() => {
              setInventoryModalCategory('all');
              setEquipTargetSlot(null);
              setInventoryModalOpen(true);
            }}
            size="sm"
            variant="secondary"
            width="100%"
            height={34}
            className="sm:!w-[110px]"
            icon={<Package size={12} />}
            title="Abrir Inventário"
          >
            Inventário
          </GothicButton>

          <GothicButton
            id="btn-personalizar-estilo"
            onClick={() => setAuraModalOpen(true)}
            size="sm"
            variant="secondary"
            width="100%"
            height={34}
            className="sm:!w-[95px]"
            icon={<Palette size={12} />}
            title="Personalizar Estilo Visual"
          >
            Estilo
          </GothicButton>

          <GothicButton
            id="btn-exportar-pdf"
            onClick={() => setPdfModalOpen(true)}
            size="sm"
            variant="secondary"
            width="100%"
            height={34}
            className="sm:!w-[110px]"
            icon={<FileDown size={12} />}
            title="Exportar Ficha"
          >
            Exportar
          </GothicButton>

          <GothicButton
            id="btn-salvar-ficha"
            onClick={() => saveCurrentFicha()}
            disabled={isSaving || readOnly}
            size="sm"
            variant="primary"
            width="100%"
            height={34}
            className="sm:!w-[110px]"
            icon={<Save size={12} />}
            title={readOnly ? 'Ficha em somente leitura' : 'Salvar alterações'}
          >
            {isSaving ? 'Salvando' : 'Salvar'}
          </GothicButton>
        </div>
      </div>

      {readOnly && (
        <div
          role="status"
          className="flex items-start gap-2.5 border border-[#8c6b41] bg-[#241a11]/95 px-4 py-3 text-[#e6ddc5] rounded-xs shadow-[0_0_12px_rgba(0,0,0,0.6)]"
        >
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#d4af37]" aria-hidden="true" />
          <p className="font-serif text-xs leading-relaxed">
            <span className="font-cinzel font-bold uppercase tracking-wider">Somente leitura.</span>{' '}
            A edição desta ficha não está liberada. Peça ao Mestre da mesa para liberar a edição no
            Painel do Mestre.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PÁGINA 1: FICHA TÉCNICA - COMBATE, STATUS E ATRIBUTOS                     */}
      {/* ========================================================================= */}
      <div className={theme.pageWrapper}>
        {/* Fundo textura */}
        <div className={theme.paperOverlay}></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ----------------- COLUNA ESQUERDA (38%) ----------------- */}
          <div className="lg:col-span-5 space-y-4">
            {/* Bloco Logo Angarden Oficial */}
            <h2 className="flex justify-center py-1">
              <BrandMark variant="completa" largura={200} escura={!theme.isDark} />
            </h2>

            {/* HISTÓRIA */}
            <div className="space-y-1">
              <div className={`${theme.bannerBg} text-center py-1 font-cinzel font-bold text-xs uppercase tracking-widest rounded-t-xl shadow-xs`}>
                História
              </div>
              <div className={`${theme.boxBg} p-2.5 rounded-b-xl h-60 flex flex-col shadow-inner`}>
                <textarea
                  value={ficha.identidade.historia || ''}
                  onChange={(e) => handleIdentidadeChange('historia', e.target.value)}
                  placeholder="Escreva as origens, feitos heróicos e memórias do personagem..."
                  className={`w-full h-full ${theme.inputBg} ${theme.textBody} font-serif text-xs leading-relaxed outline-none resize-none custom-scrollbar`}
                />
              </div>
            </div>

            {/* STATUS QUARTETO: VIDA, VIGOR, ENERGIA, NÖRFH */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 items-end">
              {/* VIDA */}
              <div className="flex flex-col items-center">
                <div className={`w-full h-16 ${theme.boxBg} rounded-2xl p-1.5 flex flex-col items-center justify-between shadow-xs`}>
                  <span className={`text-[8.5px] sm:text-[9px] font-bold ${theme.textMuted} uppercase tracking-wider font-sans`}>
                    VIDA
                  </span>
                  <div className={`text-lg sm:text-xl font-black ${theme.textTitle} font-sans pb-0.5`}>
                    {ficha.status.vida_max + (ficha.suporte.ext_per?.vida_ext || 0) - (ficha.suporte.ext_per?.vida_per || 0)}
                  </div>
                </div>

                {/* Extra / Perda */}
                <div className="grid grid-cols-2 gap-1 w-full mt-1.5">
                  <div className="flex flex-col items-center">
                    <div className={`w-full h-6 sm:h-7 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                      <input
                        type="number"
                        value={ficha.suporte.ext_per?.vida_ext || ''}
                        placeholder="0"
                        onChange={(e) => handleStatusExtPerChange('vida_ext', parseInt(e.target.value) || 0)}
                        className={`w-full text-center bg-transparent text-[10px] sm:text-[11px] font-bold ${theme.textTitle} outline-none font-sans`}
                        title="Vida Extra"
                      />
                    </div>
                    <span className={`text-[6.5px] sm:text-[7px] font-bold ${theme.textMuted} uppercase font-sans mt-0.5 tracking-tighter`}>
                      EXTRA
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className={`w-full h-6 sm:h-7 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                      <input
                        type="number"
                        value={ficha.suporte.ext_per?.vida_per || ''}
                        placeholder="0"
                        onChange={(e) => handleStatusExtPerChange('vida_per', parseInt(e.target.value) || 0)}
                        className={`w-full text-center bg-transparent text-[10px] sm:text-[11px] font-bold ${theme.textTitle} outline-none font-sans`}
                        title="Vida Perda"
                      />
                    </div>
                    <span className={`text-[6.5px] sm:text-[7px] font-bold ${theme.textMuted} uppercase font-sans mt-0.5 tracking-tighter`}>
                      PERDA
                    </span>
                  </div>
                </div>
              </div>

              {/* VIGOR */}
              <div className="flex flex-col items-center">
                <div className={`w-full h-16 ${theme.boxBg} rounded-2xl p-1.5 flex flex-col items-center justify-between shadow-xs`}>
                  <span className={`text-[8.5px] sm:text-[9px] font-bold ${theme.textMuted} uppercase tracking-wider font-sans`}>
                    VIGOR
                  </span>
                  <div className={`text-lg sm:text-xl font-black ${theme.textTitle} font-sans pb-0.5`}>
                    {ficha.status.vigor_max + (ficha.suporte.ext_per?.vigor_ext || 0) - (ficha.suporte.ext_per?.vigor_per || 0)}
                  </div>
                </div>

                {/* Extra / Perda */}
                <div className="grid grid-cols-2 gap-1 w-full mt-1.5">
                  <div className="flex flex-col items-center">
                    <div className={`w-full h-6 sm:h-7 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                      <input
                        type="number"
                        value={ficha.suporte.ext_per?.vigor_ext || ''}
                        placeholder="0"
                        onChange={(e) => handleStatusExtPerChange('vigor_ext', parseInt(e.target.value) || 0)}
                        className={`w-full text-center bg-transparent text-[10px] sm:text-[11px] font-bold ${theme.textTitle} outline-none font-sans`}
                        title="Vigor Extra"
                      />
                    </div>
                    <span className={`text-[6.5px] sm:text-[7px] font-bold ${theme.textMuted} uppercase font-sans mt-0.5 tracking-tighter`}>
                      EXTRA
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className={`w-full h-6 sm:h-7 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                      <input
                        type="number"
                        value={ficha.suporte.ext_per?.vigor_per || ''}
                        placeholder="0"
                        onChange={(e) => handleStatusExtPerChange('vigor_per', parseInt(e.target.value) || 0)}
                        className={`w-full text-center bg-transparent text-[10px] sm:text-[11px] font-bold ${theme.textTitle} outline-none font-sans`}
                        title="Vigor Perda"
                      />
                    </div>
                    <span className={`text-[6.5px] sm:text-[7px] font-bold ${theme.textMuted} uppercase font-sans mt-0.5 tracking-tighter`}>
                      PERDA
                    </span>
                  </div>
                </div>
              </div>

              {/* ENERGIA */}
              <div className="flex flex-col items-center">
                <div className={`w-full h-16 ${theme.boxBg} rounded-2xl p-1.5 flex flex-col items-center justify-between shadow-xs`}>
                  <span className={`text-[8.5px] sm:text-[9px] font-bold ${theme.textMuted} uppercase tracking-wider font-sans`}>
                    ENERGIA
                  </span>
                  <div className={`text-lg sm:text-xl font-black ${theme.textTitle} font-sans pb-0.5`}>
                    {(ficha.status.vigor_max + (ficha.suporte.ext_per?.vigor_ext || 0) - (ficha.suporte.ext_per?.vigor_per || 0)) + ((ficha.suporte.ext_per as any)?.energia_ext || 0) - ((ficha.suporte.ext_per as any)?.energia_per || 0)}
                  </div>
                </div>

                {/* Extra / Perda */}
                <div className="grid grid-cols-2 gap-1 w-full mt-1.5">
                  <div className="flex flex-col items-center">
                    <div className={`w-full h-6 sm:h-7 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                      <input
                        type="number"
                        value={(ficha.suporte.ext_per as any)?.energia_ext || ''}
                        placeholder="0"
                        onChange={(e) => handleStatusExtPerChange('energia_ext' as any, parseInt(e.target.value) || 0)}
                        className={`w-full text-center bg-transparent text-[10px] sm:text-[11px] font-bold ${theme.textTitle} outline-none font-sans`}
                        title="Energia Extra"
                      />
                    </div>
                    <span className={`text-[6.5px] sm:text-[7px] font-bold ${theme.textMuted} uppercase font-sans mt-0.5 tracking-tighter`}>
                      EXTRA
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className={`w-full h-6 sm:h-7 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                      <input
                        type="number"
                        value={(ficha.suporte.ext_per as any)?.energia_per || ''}
                        placeholder="0"
                        onChange={(e) => handleStatusExtPerChange('energia_per' as any, parseInt(e.target.value) || 0)}
                        className={`w-full text-center bg-transparent text-[10px] sm:text-[11px] font-bold ${theme.textTitle} outline-none font-sans`}
                        title="Energia Perda"
                      />
                    </div>
                    <span className={`text-[6.5px] sm:text-[7px] font-bold ${theme.textMuted} uppercase font-sans mt-0.5 tracking-tighter`}>
                      PERDA
                    </span>
                  </div>
                </div>
              </div>

              {/* NÖRFH */}
              <div className="flex flex-col items-center">
                <div className={`w-full h-16 ${theme.boxBg} rounded-2xl p-1.5 flex flex-col items-center justify-between shadow-xs`}>
                  <span className={`text-[8.5px] sm:text-[9px] font-bold ${theme.textMuted} uppercase tracking-wider font-sans`}>
                    NÖRFH
                  </span>
                  <div className={`text-lg sm:text-xl font-black ${theme.textTitle} font-sans pb-0.5`}>
                    {ficha.status.north + (ficha.suporte.ext_per?.north_ext || 0) - (ficha.suporte.ext_per?.north_per || 0)}
                  </div>
                </div>

                {/* Extra / Perda */}
                <div className="grid grid-cols-2 gap-1 w-full mt-1.5">
                  <div className="flex flex-col items-center">
                    <div className={`w-full h-6 sm:h-7 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                      <input
                        type="number"
                        value={ficha.suporte.ext_per?.north_ext || ''}
                        placeholder="0"
                        onChange={(e) => handleStatusExtPerChange('north_ext', parseInt(e.target.value) || 0)}
                        className={`w-full text-center bg-transparent text-[10px] sm:text-[11px] font-bold ${theme.textTitle} outline-none font-sans`}
                        title="Nörfh Extra"
                      />
                    </div>
                    <span className={`text-[6.5px] sm:text-[7px] font-bold ${theme.textMuted} uppercase font-sans mt-0.5 tracking-tighter`}>
                      EXTRA
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className={`w-full h-6 sm:h-7 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                      <input
                        type="number"
                        value={ficha.suporte.ext_per?.north_per || ''}
                        placeholder="0"
                        onChange={(e) => handleStatusExtPerChange('north_per', parseInt(e.target.value) || 0)}
                        className={`w-full text-center bg-transparent text-[10px] sm:text-[11px] font-bold ${theme.textTitle} outline-none font-sans`}
                        title="Nörfh Perda"
                      />
                    </div>
                    <span className={`text-[6.5px] sm:text-[7px] font-bold ${theme.textMuted} uppercase font-sans mt-0.5 tracking-tighter`}>
                      PERDA
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* DEFESA ATIVA */}
            <div className="space-y-1.5 pt-1">
              <div className={`${theme.bannerBg} text-center py-1 font-bold text-xs uppercase tracking-widest rounded-xl shadow-xs font-sans`}>
                DEFESA ATIVA
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3.5">
                {[
                  { label: 'ESQUIVA', key: 'esquiva', val: ficha.defesas.esquiva, extKey: 'esquiva_ext' },
                  { label: 'APARAR', key: 'aparar', val: ficha.defesas.aparar, extKey: 'aparar_ext' },
                  { label: 'BLOQUEIO', key: 'bloquear', val: ficha.defesas.bloquear, extKey: 'bloquear_ext' },
                  { label: 'B. MÁGICO', key: 'bloquear_magico', val: ficha.defesas.bloquear_magico, extKey: 'bloquear_magico_ext' },
                ].map((item) => (
                  <div key={item.label} className="relative flex flex-col items-center">
                    {/* Card Principal */}
                    <div className={`w-full h-16 ${theme.boxBg} rounded-2xl p-1.5 pt-1 pb-4 flex flex-col items-center justify-between shadow-xs`}>
                      <span className={`text-[8px] sm:text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans text-center leading-tight truncate w-full`}>
                        {item.label}
                      </span>
                      <div className={`w-full h-7 rounded-lg ${theme.boxBgLight} flex items-center justify-center text-sm sm:text-base font-black ${theme.textTitle} font-sans shadow-2xs`}>
                        {item.val ?? 0}
                      </div>
                    </div>

                    {/* Box Inferior Sobreposto Centralizado */}
                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-7 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                      <input
                        type="number"
                        value={(ficha.suporte.ext_per as any)?.[item.extKey] || ''}
                        placeholder=""
                        onChange={(e) => handleStatusExtPerChange(item.extKey as any, parseInt(e.target.value) || 0)}
                        className={`w-full text-center bg-transparent text-[11px] font-bold ${theme.textTitle} outline-none font-sans`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MAESTRIAS */}
            <div className="space-y-2.5 pt-1">
              <div className={`${theme.bannerBg} text-center py-1 font-bold text-xs uppercase tracking-widest rounded-xl shadow-xs font-sans`}>
                MAESTRIAS
              </div>

              {/* Maestria de Combate */}
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-1.5 px-0.5 items-center">
                  <div className="col-span-2 text-center">
                    <span className={`text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans`}>NH</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans`}>GRAD.</span>
                  </div>
                  <div className="col-span-8 flex items-center justify-between pl-1">
                    <span className={`text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans`}>MAESTRIA DE COMBATE</span>
                    <button
                      onClick={() => handleAddTreinamento('Maestria', 'COMB')}
                      className="hover:opacity-80 transition-opacity p-0.5"
                      title="Adicionar Maestria de Combate"
                    >
                      <Plus size={12} className={theme.textTitle} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  {maestriasCombate.map((t) => (
                    <div key={t.id} className="grid grid-cols-12 gap-1.5 items-center">
                      <div className={`col-span-2 h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                        <input
                          type="number"
                          value={t.nh_calculado}
                          onChange={(e) => handleTreinamentoChange(t.id, 'nh_calculado', parseInt(e.target.value) || 0)}
                          className={`w-full text-center bg-transparent font-black text-xs ${theme.textTitle} outline-none font-sans`}
                        />
                      </div>
                      <div className={`col-span-2 h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                        <input
                          type="number"
                          value={t.graduacao}
                          onChange={(e) => handleTreinamentoChange(t.id, 'graduacao', parseInt(e.target.value) || 0)}
                          className={`w-full text-center bg-transparent font-black text-xs ${theme.textTitle} outline-none font-sans`}
                        />
                      </div>
                      <div className={`col-span-8 h-8 rounded-xl ${theme.boxBg} flex items-center px-2.5 justify-between shadow-xs`}>
                        <input
                          type="text"
                          value={t.nome}
                          onChange={(e) => handleTreinamentoChange(t.id, 'nome', e.target.value)}
                          placeholder="Nome da Maestria..."
                          className={`w-full bg-transparent text-xs ${theme.textTitle} font-medium outline-none font-sans`}
                        />
                        <button
                          onClick={() => handleRemoveTreinamento(t.id)}
                          className="text-gray-400 hover:text-red-500 opacity-40 hover:opacity-100 transition-opacity ml-1"
                          title="Remover"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maestria de Pontaria */}
              <div className="space-y-1 pt-1">
                <div className="grid grid-cols-12 gap-1.5 px-0.5 items-center">
                  <div className="col-span-2 text-center">
                    <span className={`text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans`}>NH</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans`}>GRAD.</span>
                  </div>
                  <div className="col-span-8 flex items-center justify-between pl-1">
                    <span className={`text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans`}>MAESTRIA DE PONTARIA</span>
                    <button
                      onClick={() => handleAddTreinamento('Maestria', 'PONT')}
                      className="hover:opacity-80 transition-opacity p-0.5"
                      title="Adicionar Maestria de Pontaria"
                    >
                      <Plus size={12} className={theme.textTitle} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  {maestriasPontaria.map((t) => (
                    <div key={t.id} className="grid grid-cols-12 gap-1.5 items-center">
                      <div className={`col-span-2 h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                        <input
                          type="number"
                          value={t.nh_calculado}
                          onChange={(e) => handleTreinamentoChange(t.id, 'nh_calculado', parseInt(e.target.value) || 0)}
                          className={`w-full text-center bg-transparent font-black text-xs ${theme.textTitle} outline-none font-sans`}
                        />
                      </div>
                      <div className={`col-span-2 h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                        <input
                          type="number"
                          value={t.graduacao}
                          onChange={(e) => handleTreinamentoChange(t.id, 'graduacao', parseInt(e.target.value) || 0)}
                          className={`w-full text-center bg-transparent font-black text-xs ${theme.textTitle} outline-none font-sans`}
                        />
                      </div>
                      <div className={`col-span-8 h-8 rounded-xl ${theme.boxBg} flex items-center px-2.5 justify-between shadow-xs`}>
                        <input
                          type="text"
                          value={t.nome}
                          onChange={(e) => handleTreinamentoChange(t.id, 'nome', e.target.value)}
                          placeholder="Nome da Maestria de Pontaria..."
                          className={`w-full bg-transparent text-xs ${theme.textTitle} font-medium outline-none font-sans`}
                        />
                        <button
                          onClick={() => handleRemoveTreinamento(t.id)}
                          className="text-gray-400 hover:text-red-500 opacity-40 hover:opacity-100 transition-opacity ml-1"
                          title="Remover"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maestria de Escudo (Exclusivo e Fixo) */}
              <div className="space-y-1 pt-1">
                <div className="grid grid-cols-12 gap-1.5 px-0.5 items-center">
                  <div className="col-span-2 text-center">
                    <span className={`text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans`}>NH</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans`}>GRAD.</span>
                  </div>
                  <div className="col-span-8 flex items-center justify-between pl-1">
                    <span className={`text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans`}>MAESTRIA DE ESCUDO</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-1.5 items-center">
                  <div className={`col-span-2 h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                    <input
                      type="number"
                      value={maestriaEscudo.nh_calculado}
                      onChange={(e) => handleEscudoChange('nh_calculado', parseInt(e.target.value) || 0)}
                      className={`w-full text-center bg-transparent font-black text-xs ${theme.textTitle} outline-none font-sans`}
                    />
                  </div>
                  <div className={`col-span-2 h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                    <input
                      type="number"
                      value={maestriaEscudo.graduacao}
                      onChange={(e) => handleEscudoChange('graduacao', parseInt(e.target.value) || 0)}
                      className={`w-full text-center bg-transparent font-black text-xs ${theme.textTitle} outline-none font-sans`}
                    />
                  </div>
                  <div className={`col-span-8 h-8 rounded-xl ${theme.boxBg} flex items-center px-2.5 justify-between shadow-xs`}>
                    <input
                      type="text"
                      value={maestriaEscudo.nome}
                      onChange={(e) => handleEscudoChange('nome', e.target.value)}
                      placeholder="Nome do Escudo..."
                      className={`w-full bg-transparent text-xs ${theme.textTitle} font-medium outline-none font-sans`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Banner Inferior FICHA TÉCNICA */}
            <div className={`${theme.bannerBg} text-center py-1.5 font-cinzel font-bold text-sm uppercase tracking-widest rounded-xs shadow-sm mt-4`}>
              Ficha Técnica
            </div>
          </div>

          {/* ----------------- COLUNA DIREITA (62%) ----------------- */}
          <div className="lg:col-span-7 space-y-3">
            {/* TOPO: CABEÇALHO ESCURO COM NÍVEL, NOME COMPLETO, LOGO ANGARDEN E PTS/EXP */}
            <div className={`${theme.headerBarBg} rounded-t-xs p-3 sm:p-4 border ${theme.headerBorder} relative overflow-hidden shadow-md`}>
              {/* Brilho de fundo / textura sutil */}
              <div 
                className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-2xl pointer-events-none opacity-20"
                style={{ backgroundColor: theme.previewColor }}
              ></div>

              <div className="flex items-start justify-between gap-3 relative z-10">
                {/* Lado Esquerdo: Shield Nível & Nome Completo */}
                <div className="flex flex-col gap-2 flex-1 max-w-sm">
                  {/* Shield Nível */}
                  <div className="relative w-14 h-16 sm:w-16 sm:h-18 flex flex-col items-center justify-center filter drop-shadow-xs">
                    <svg viewBox="0 0 100 120" className="absolute inset-0 w-full h-full" fill="none">
                      <path 
                        d="M 6 12 C 30 22, 70 22, 94 12 L 94 58 C 94 88, 50 112, 50 112 C 50 112, 6 88, 6 58 Z" 
                        fill={theme.isDark ? '#1f1710' : '#f0f5f8'} 
                        stroke={theme.previewColor} 
                        strokeWidth="5" 
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="relative z-10 flex flex-col items-center pt-2">
                      <span className={`text-[9px] font-black ${theme.textTitle} tracking-wider uppercase font-sans`}>NÍVEL</span>
                      <input
                        type="number"
                        value={ficha.identidade.nivel}
                        onChange={(e) => handleIdentidadeChange('nivel', parseInt(e.target.value) || 1)}
                        className={`w-10 text-center bg-transparent font-black text-xl ${theme.textTitle} outline-none -mt-0.5`}
                      />
                    </div>
                  </div>

                  {/* Nome Completo */}
                  <div className="w-full">
                    <div className={`${theme.boxBgLight} rounded-xs px-3 py-1.5 backdrop-blur-xs shadow-inner`}>
                      <input
                        type="text"
                        value={ficha.identidade.nome_personagem}
                        onChange={(e) => handleIdentidadeChange('nome_personagem', e.target.value)}
                        placeholder="NOME COMPLETO"
                        className={`w-full bg-transparent ${theme.textTitle} font-black text-sm tracking-wider uppercase outline-none font-sans`}
                      />
                    </div>
                    <span className={`text-xs sm:text-sm font-black tracking-wider ${theme.textTitle} uppercase block mt-1 font-sans`}>
                      NOME COMPLETO
                    </span>
                  </div>
                </div>

                {/* Lado Direito: Árvore Angarden e Pílulas PTS / EXP */}
                <div className="flex flex-col items-end gap-2.5">
                  {/* Árvore Angarden (símbolo sozinho) */}
                  <div className="flex flex-col items-center">
                    <BrandMark variant="arvore" altura={62} escura={!theme.isDark} />
                  </div>

                  {/* Pílulas PTS e EXP */}
                  <div className="flex items-center gap-2">
                    {/* PTS */}
                    <div className={`flex items-center justify-between border-2 ${theme.badgeBorder} ${theme.badgeBg} rounded-full px-2.5 py-0.5 w-20 sm:w-22 h-7 shadow-xs`}>
                      <input
                        type="number"
                        value={ficha.identidade.pts}
                        onChange={(e) => handleIdentidadeChange('pts', parseInt(e.target.value) || 0)}
                        className={`w-10 text-center bg-transparent font-black text-xs ${theme.textTitle} outline-none`}
                      />
                      <span className={`text-[10px] font-black ${theme.textTitle} uppercase font-sans`}>PTS</span>
                    </div>

                    {/* EXP */}
                    <div className={`flex items-center justify-between border-2 ${theme.badgeBorder} ${theme.badgeBg} rounded-full px-2.5 py-0.5 w-24 sm:w-28 h-7 shadow-xs`}>
                      <input
                        type="number"
                        value={ficha.identidade.xp}
                        onChange={(e) => handleIdentidadeChange('xp', parseInt(e.target.value) || 0)}
                        className={`w-14 text-center bg-transparent font-black text-xs ${theme.textTitle} outline-none`}
                      />
                      <span className={`text-[10px] font-black ${theme.textTitle} uppercase font-sans`}>EXP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6 DEFESAS OFICIAIS (REFLEXO, SANIDADE, IMUNIDADE, PERCEPÇÃO, CORAGEM, CONST.) */}
            <div className={`border-2 ${theme.badgeBorder} ${theme.badgeBg} p-2 sm:p-3 rounded-none shadow-sm -mt-1`}>
              <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                {[
                  { label: 'REFLEXO', val: ficha.defesas.reflexo, extKey: 'reflexo_ext' },
                  { label: 'SANIDADE', val: ficha.defesas.sanidade, extKey: 'sanidade_ext' },
                  { label: 'IMUNIDADE', val: ficha.defesas.imunidade, extKey: 'imunidade_ext' },
                  { label: 'PERCEPÇÃO', val: ficha.defesas.percepcao, extKey: 'percepcao_ext' },
                  { label: 'CORAGEM', val: ficha.defesas.coragem, extKey: 'coragem_ext' },
                  { label: 'CONST.', val: ficha.defesas.constituicao, extKey: 'constituicao_ext' },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center">
                    {/* Rótulo Superior em Negrito */}
                    <span className={`text-[8.5px] sm:text-[9.5px] font-black ${theme.textTitle} uppercase tracking-tight text-center block mb-1 font-sans`}>
                      {item.label}
                    </span>
                    {/* Card Arredondado com Borda do Tema */}
                    <div className={`w-11 sm:w-13 h-11 sm:h-12 rounded-xl ${theme.boxBg} flex items-center justify-center relative shadow-xs`}>
                      <span className={`font-bold text-sm sm:text-base ${theme.textTitle}`}>
                        {item.val}
                      </span>
                      {/* Pílula Inferior Sobreposta Editável para Bônus/Redutor */}
                      <div className={`w-6 sm:w-7 h-3.5 sm:h-4 rounded-full ${theme.attrBottomPill} absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center shadow-xs z-10`}>
                        <input
                          type="number"
                          value={(ficha.suporte.ext_per as any)?.[item.extKey] !== 0 && (ficha.suporte.ext_per as any)?.[item.extKey] !== undefined ? (ficha.suporte.ext_per as any)[item.extKey] : ''}
                          placeholder="0"
                          onChange={(e) => handleStatusExtPerChange(item.extKey as any, parseInt(e.target.value) || 0)}
                          className={`w-full text-center bg-transparent text-[8px] font-bold ${theme.textTitle} outline-none font-sans`}
                          title={`Modificador de ${item.label} (+ / -)`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AVATAR + PAINEL DE SUPORTE (RAÇA / ARMADURA / MONTARIA) */}
            <div className={`border-2 ${theme.badgeBorder} ${theme.badgeBg} p-2.5 sm:p-3 rounded-none shadow-sm -mt-1`}>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
                {/* Foto / Avatar Box com Upload de Imagem */}
                <div className="sm:col-span-5 flex flex-col">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <div 
                    className={`w-full h-full min-h-[300px] ${theme.boxBg} rounded-none overflow-hidden relative flex items-center justify-center cursor-pointer group shadow-xs border-2 transition-all ${
                      isDragging ? 'border-[#f2dfa8] ring-2 ring-[#f2dfa8]/60 bg-black/40' : 'border-transparent'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    title="Clique ou arraste uma foto para fazer upload"
                  >
                    {ficha.identidade.imagem_url ? (
                      <>
                        <img 
                          src={ficha.identidade.imagem_url} 
                          alt={ficha.identidade.nome_personagem} 
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        {/* Hover Overlay com Botão de Trocar Imagem */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-3 text-center pointer-events-none">
                          <Upload size={28} className="mb-1.5 text-[#f2dfa8] animate-bounce" />
                          <span className="text-xs font-cinzel font-bold uppercase tracking-wider text-[#f2dfa8]">
                            Trocar Foto
                          </span>
                          <span className="text-[10px] font-sans text-gray-300 mt-1">
                            Clique ou arraste uma imagem aqui
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className={`flex flex-col items-center p-4 text-center opacity-75 group-hover:opacity-100 transition-opacity ${theme.textMuted}`}>
                        <div className="w-14 h-14 rounded-full border-2 border-dashed border-current flex items-center justify-center mb-2">
                          <Camera size={26} />
                        </div>
                        <span className="text-xs font-cinzel font-bold uppercase tracking-wider block">
                          Upload da Imagem
                        </span>
                        <span className="text-[10px] font-sans opacity-75 mt-1 max-w-[140px] leading-tight">
                          Clique aqui ou arraste a foto do personagem
                        </span>
                      </div>
                    )}
                  </div>
                  {isUploadingImage && <p role="status" className="mt-2 text-center text-xs text-[#d4af37]">Enviando imagem...</p>}
                  {imageUploadError && <p role="alert" className="mt-2 text-center text-xs text-red-300">{imageUploadError}</p>}
                </div>

                {/* Dados da Direita da Foto */}
                <div className="sm:col-span-7 flex flex-col justify-between space-y-2">
                  {/* Linha: RAÇA Ribbon + 4 Indicadores (MULT., DANO NAT., VEL. BÁSICA, DESL.) */}
                  <div className="flex items-center gap-1.5">
                    {/* Ribbon RAÇA */}
                    <div className="relative flex-1 h-9 flex items-center justify-center">
                      <svg viewBox="0 0 200 40" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        {/* Pontas em fita notched */}
                        <path d="M 0 10 L 12 20 L 0 30 L 12 30 L 12 10 Z" fill={theme.isDark ? '#1f1710' : '#edf2f7'} stroke={theme.previewColor} strokeWidth="2" strokeLinejoin="round" />
                        <path d="M 200 10 L 188 20 L 200 30 L 188 30 L 188 10 Z" fill={theme.isDark ? '#1f1710' : '#edf2f7'} stroke={theme.previewColor} strokeWidth="2" strokeLinejoin="round" />
                        <rect x="12" y="5" width="176" height="30" rx="3" fill={theme.isDark ? '#1f1710' : '#edf2f7'} stroke={theme.previewColor} strokeWidth="2" />
                      </svg>
                      {/* Badge RAÇA no topo */}
                      <div className={`absolute -top-2 left-1/2 -translate-x-1/2 ${theme.bannerBg} text-[8px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider z-10 shadow-xs`}>
                        RAÇA
                      </div>
                      <input
                        type="text"
                        value={ficha.identidade.raca}
                        onChange={(e) => handleIdentidadeChange('raca', e.target.value)}
                        placeholder="Raça..."
                        className={`relative z-10 w-4/5 text-center bg-transparent font-serif text-xs font-bold ${theme.textTitle} outline-none pt-1`}
                      />
                    </div>

                    {/* 4 Indicadores */}
                    <div className="flex items-center gap-1">
                      {/* MULT. */}
                      <div className="flex flex-col items-center">
                        <span className={`text-[7.5px] font-black ${theme.textTitle} uppercase block text-center leading-tight mb-0.5 font-sans`}>
                          MULT.
                        </span>
                        <div className={`w-8 sm:w-9 h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                          <input
                            type="number"
                            value={ficha.suporte.mult_vida}
                            onChange={(e) => handleSuporteChange('mult_vida', parseInt(e.target.value) || 1)}
                            className={`w-full text-center bg-transparent font-bold text-xs ${theme.textTitle} outline-none`}
                          />
                        </div>
                      </div>

                      {/* DANO NATURAL */}
                      <div className="flex flex-col items-center">
                        <span className={`text-[6.5px] font-black ${theme.textTitle} uppercase block text-center leading-none mb-0.5 font-sans`}>
                          DANO<br/>NATURAL
                        </span>
                        <div className={`w-8 sm:w-9 h-8 rounded-xl ${theme.boxBg} flex items-center justify-center relative shadow-xs`}>
                          <input
                            type="number"
                            value={ficha.suporte.dano_natural || 0}
                            onChange={(e) => handleSuporteChange('dano_natural', parseInt(e.target.value) || 0)}
                            className={`w-full text-center bg-transparent font-bold text-xs ${theme.textTitle} outline-none font-sans`}
                            title="Dano Natural"
                          />
                          <div className={`w-5 sm:w-5.5 h-3 sm:h-3.5 rounded-full ${theme.attrBottomPill} absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center shadow-xs z-10`}>
                            <input
                              type="number"
                              value={(ficha.suporte.ext_per as any)?.dano_natural_ext !== 0 && (ficha.suporte.ext_per as any)?.dano_natural_ext !== undefined ? (ficha.suporte.ext_per as any).dano_natural_ext : ''}
                              placeholder="0"
                              onChange={(e) => handleStatusExtPerChange('dano_natural_ext' as any, parseInt(e.target.value) || 0)}
                              className={`w-full text-center bg-transparent text-[7px] font-bold ${theme.textTitle} outline-none font-sans`}
                              title="Modificador de Dano Natural"
                            />
                          </div>
                        </div>
                      </div>

                      {/* VEL. BÁSICA */}
                      <div className="flex flex-col items-center">
                        <span className={`text-[6.5px] font-black ${theme.textTitle} uppercase block text-center leading-none mb-0.5 font-sans`}>
                          VEL.<br/>BÁSICA
                        </span>
                        <div className={`w-8 sm:w-9 h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                          <input
                            type="number"
                            value={ficha.suporte.vel_basica || 0}
                            onChange={(e) => handleSuporteChange('vel_basica', parseInt(e.target.value) || 0)}
                            className={`w-full text-center bg-transparent font-bold text-xs ${theme.textTitle} outline-none font-sans`}
                            title="Velocidade Básica"
                          />
                        </div>
                      </div>

                      {/* DESL. */}
                      <div className="flex flex-col items-center">
                        <span className={`text-[7.5px] font-black ${theme.textTitle} uppercase block text-center leading-tight mb-0.5 font-sans`}>
                          DESL.
                        </span>
                        <div className={`w-8 sm:w-9 h-8 rounded-xl ${theme.boxBg} flex items-center justify-center relative shadow-xs`}>
                          <input
                            type="number"
                            value={ficha.suporte.deslocamento || 0}
                            onChange={(e) => handleSuporteChange('deslocamento', parseInt(e.target.value) || 0)}
                            className={`w-full text-center bg-transparent font-bold text-xs ${theme.textTitle} outline-none font-sans`}
                            title="Deslocamento"
                          />
                          <div className={`w-5 sm:w-5.5 h-3 sm:h-3.5 rounded-full ${theme.attrBottomPill} absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center shadow-xs z-10`}>
                            <input
                              type="number"
                              value={(ficha.suporte.ext_per as any)?.deslocamento_ext !== 0 && (ficha.suporte.ext_per as any)?.deslocamento_ext !== undefined ? (ficha.suporte.ext_per as any).deslocamento_ext : ''}
                              placeholder="0"
                              onChange={(e) => handleStatusExtPerChange('deslocamento_ext' as any, parseInt(e.target.value) || 0)}
                              className={`w-full text-center bg-transparent text-[7px] font-bold ${theme.textTitle} outline-none font-sans`}
                              title="Modificador de Deslocamento"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO: ARMADURA */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm sm:text-base font-black tracking-wider ${theme.textTitle} uppercase font-sans`}>
                        ARMADURA
                      </h3>
                    </div>
                    
                    {/* Linha de Equipamento com Botões de Ação (Visualizar e Catálogo de Armaduras) */}
                    <div className={`flex items-center gap-1.5 text-[8px] font-bold ${theme.textMuted} font-sans`}>
                      <span className="shrink-0 uppercase">EQUIPAMENTO</span>
                      <div className="flex-1 flex items-center gap-1">
                        <input 
                          type="text" 
                          value={ficha.suporte.armadura.nome || ''} 
                          onChange={(e) => handleArmaduraNomeChange(e.target.value)}
                          placeholder="Nome da Armadura Equipada..." 
                          className={`flex-1 ${theme.boxBgLight} h-6 px-2 rounded-xs outline-none text-[10px] sm:text-xs ${theme.textTitle} font-bold font-serif`} 
                        />
                        {/* Botão 1: Visualizar Detalhes Completos */}
                        <button
                          type="button"
                          id="btn-visualizar-armadura"
                          onClick={handleOpenArmorDetails}
                          title="Visualizar Informações Completas da Armadura"
                          className="w-6 h-6 rounded-xs bg-[#1a140e] hover:bg-[#2e1f14] border border-[#8c6b41] text-[#e6ddc5] hover:text-[#fde68a] flex items-center justify-center transition-all duration-150 shadow-xs cursor-pointer active:scale-95 shrink-0"
                        >
                          <Eye size={12} />
                        </button>
                        {/* Botão 2: Abrir Catálogo do Mercado de Armaduras */}
                        <button
                          type="button"
                          id="btn-catalogo-armaduras"
                          onClick={() => {
                            setInventoryModalCategory('mercado_armaduras');
                            setEquipTargetSlot('armadura');
                            setInventoryModalOpen(true);
                          }}
                          title="Abrir Catálogo de Armaduras no Inventário"
                          className="w-6 h-6 rounded-xs bg-[#1a140e] hover:bg-[#2e1f14] border border-[#8c6b41] text-[#e6ddc5] hover:text-[#fde68a] flex items-center justify-center transition-all duration-150 shadow-xs cursor-pointer active:scale-95 shrink-0"
                        >
                          <Shield size={12} />
                        </button>
                      </div>
                    </div>

                    {/* 8 Peças da Armadura (Elmo, Gorjal, Couraça, Braçal | Manoplas, Coxote, Calça, Grevas) */}
                    <div className="space-y-1.5 pt-0.5">
                      {/* Linha 1: Elmo, Gorjal, Couraça, Braçal */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { key: 'elmo', label: 'ELMO' },
                          { key: 'gorjal', label: 'GORJAL' },
                          { key: 'couraca', label: 'COURAÇA (BASE)' },
                          { key: 'bracal', label: 'BRAÇAL' },
                        ].map((p) => (
                          <div key={p.key} className="flex flex-col items-center">
                            <span className={`text-[7.5px] font-bold ${theme.textMuted} uppercase block mb-0.5 font-sans text-center leading-tight truncate w-full`}>
                              {p.label}
                            </span>
                            <div className={`w-full h-8 sm:h-9 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                              <input
                                type="number"
                                value={(ficha.suporte.armadura as any)[p.key] || 0}
                                onChange={(e) => handleArmaduraChange(p.key as any, parseInt(e.target.value) || 0)}
                                className={`w-full text-center bg-transparent font-black text-xs ${theme.textTitle} outline-none font-sans`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Linha 2: Manoplas, Coxote, Calça, Grevas */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { key: 'manoplas', label: 'MANOPLAS' },
                          { key: 'coxote', label: 'COXOTE' },
                          { key: 'calca', label: 'CALÇA' },
                          { key: 'grevas', label: 'GREVAS' },
                        ].map((p) => (
                          <div key={p.key} className="flex flex-col items-center">
                            <span className={`text-[7.5px] font-bold ${theme.textMuted} uppercase block mb-0.5 font-sans text-center leading-tight truncate w-full`}>
                              {p.label}
                            </span>
                            <div className={`w-full h-8 sm:h-9 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                              <input
                                type="number"
                                value={(ficha.suporte.armadura as any)[p.key] || 0}
                                onChange={(e) => handleArmaduraChange(p.key as any, parseInt(e.target.value) || 0)}
                                className={`w-full text-center bg-transparent font-black text-xs ${theme.textTitle} outline-none font-sans`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO: MONTARIA */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm sm:text-base font-black tracking-wider ${theme.textTitle} uppercase font-sans`}>
                        MONTARIA
                      </h3>
                    </div>

                    {/* Linha de Nome com Botões de Ação (Visualizar e Catálogo de Montarias) */}
                    <div className={`flex items-center gap-1.5 text-[8px] font-bold ${theme.textMuted} font-sans`}>
                      <span className="shrink-0 uppercase">NOME</span>
                      <div className="flex-1 flex items-center gap-1">
                        <input 
                          type="text" 
                          value={ficha.suporte.montaria?.nome || ''} 
                          onChange={(e) => handleMontariaNomeChange(e.target.value)}
                          placeholder="Nome da Montaria..." 
                          className={`flex-1 ${theme.boxBgLight} h-6 px-2 rounded-xs outline-none text-[10px] sm:text-xs ${theme.textTitle} font-bold font-serif`} 
                        />
                        {/* Botão 1: Visualizar Detalhes Completos */}
                        <button
                          type="button"
                          id="btn-visualizar-montaria"
                          onClick={handleOpenMountDetails}
                          title="Visualizar Informações Completas da Montaria"
                          className="w-6 h-6 rounded-xs bg-[#1a140e] hover:bg-[#2e1f14] border border-[#8c6b41] text-[#e6ddc5] hover:text-[#fde68a] flex items-center justify-center transition-all duration-150 shadow-xs cursor-pointer active:scale-95 shrink-0"
                        >
                          <Eye size={12} />
                        </button>
                        {/* Botão 2: Abrir Catálogo do Mercado de Montarias */}
                        <button
                          type="button"
                          id="btn-catalogo-montarias"
                          onClick={() => {
                            setInventoryModalCategory('mercado_geral');
                            setEquipTargetSlot(null);
                            setInventoryModalOpen(true);
                          }}
                          title="Abrir Catálogo no Inventário"
                          className="w-6 h-6 rounded-xs bg-[#1a140e] hover:bg-[#2e1f14] border border-[#8c6b41] text-[#e6ddc5] hover:text-[#fde68a] flex items-center justify-center transition-all duration-150 shadow-xs cursor-pointer active:scale-95 shrink-0"
                        >
                          <Footprints size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Grade de RD da Montaria (Cabeça | Tronco | Superiores | Inferiores) */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { key: 'cabeca', label: 'CABEÇA' },
                          { key: 'tronco', label: 'TRONCO (BASE)' },
                          { key: 'superiores', label: 'SUPERIORES' },
                          { key: 'inferiores', label: 'INFERIORES' },
                        ].map((p) => (
                          <div key={p.key} className="flex flex-col items-center">
                            <span className={`text-[7.5px] font-bold ${theme.textMuted} uppercase block mb-0.5 font-sans text-center leading-tight truncate w-full`}>
                              {p.label}
                            </span>
                            <div className={`w-full h-8 sm:h-9 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                              <input
                                type="number"
                                value={(ficha.suporte.montaria as any)?.[p.key] ?? 0}
                                onChange={(e) => handleMontariaRdChange(p.key as any, parseInt(e.target.value) || 0)}
                                className={`w-full text-center bg-transparent font-black text-xs ${theme.textTitle} outline-none font-sans`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ATRIBUTOS (10 ATRIBUTOS OFICIAIS EM 2 LINHAS X 5 COLUNAS) */}
            <div className="space-y-3">
              <div className={`${theme.bannerBg} text-center py-1.5 font-cinzel font-bold text-xs uppercase tracking-widest rounded-md shadow-sm`}>
                Atributos
              </div>

              {/* Linha 1: FOR, AGI, COMB, PONT, INT */}
              <div className="grid grid-cols-5 gap-2 pb-2">
                {[
                  { key: 'for', label: 'FOR' },
                  { key: 'agi', label: 'AGI' },
                  { key: 'comb', label: 'COMB' },
                  { key: 'pont', label: 'PONT' },
                  { key: 'int', label: 'INT' },
                ].map((attr) => {
                  const total = getAttrTotal(attr.key);
                  const attrData = (ficha.atributos as any)[attr.key] || { valor_base: 10, extra: 0, perda: 0 };
                  return (
                    <div 
                      key={attr.key} 
                      className={`${theme.attrCardBg} rounded-xl pt-1 px-1 pb-4 flex flex-col items-center relative shadow-sm`}
                    >
                      {/* Rótulo do Atributo */}
                      <span className="text-[10px] sm:text-[11px] font-cinzel font-bold uppercase tracking-wider text-inherit mb-0.5">
                        {attr.label}
                      </span>

                      {/* Caixa Retangular Translúcida de Valor Base */}
                      <div className={`w-11/12 h-7 ${theme.attrInnerBox} rounded-xs flex items-center justify-center mb-1`}>
                        <input
                          type="number"
                          value={attrData.valor_base ?? 0}
                          onChange={(e) => handleAtributoChange(attr.key, 'valor_base', parseInt(e.target.value) || 0)}
                          className="w-full text-center bg-transparent font-cinzel font-bold text-sm sm:text-base outline-none"
                          title={`Base: ${attrData.valor_base} | Total: ${total}`}
                        />
                      </div>

                      {/* Célula Arredondada Inferior para Adição/Subtração (+/-) no Cálculo */}
                      <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 sm:w-11 h-7 ${theme.attrBottomPill} rounded-xl flex items-center justify-center shadow-sm z-10`}>
                        <input
                          type="number"
                          value={attrData.extra !== 0 ? attrData.extra : ''}
                          placeholder="0"
                          onChange={(e) => handleAtributoChange(attr.key, 'extra', parseInt(e.target.value) || 0)}
                          className="w-full text-center bg-transparent font-cinzel font-bold text-xs outline-none"
                          title="Valor adicional ou subtraído (+ / -) do atributo"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Linha 2: SAB, VIT, CAR, ART, ALM */}
              <div className="grid grid-cols-5 gap-2 pb-2">
                {[
                  { key: 'sab', label: 'SAB' },
                  { key: 'vit', label: 'VIT' },
                  { key: 'car', label: 'CAR' },
                  { key: 'art', label: 'ART' },
                  { key: 'alm', label: 'ALM' },
                ].map((attr) => {
                  const total = getAttrTotal(attr.key);
                  const attrData = (ficha.atributos as any)[attr.key] || { valor_base: 10, extra: 0, perda: 0 };
                  return (
                    <div 
                      key={attr.key} 
                      className={`${theme.attrCardBg} rounded-xl pt-1 px-1 pb-4 flex flex-col items-center relative shadow-sm`}
                    >
                      {/* Rótulo do Atributo */}
                      <span className="text-[10px] sm:text-[11px] font-cinzel font-bold uppercase tracking-wider text-inherit mb-0.5">
                        {attr.label}
                      </span>

                      {/* Caixa Retangular Translúcida de Valor Base */}
                      <div className={`w-11/12 h-7 ${theme.attrInnerBox} rounded-xs flex items-center justify-center mb-1`}>
                        <input
                          type="number"
                          value={attrData.valor_base ?? 0}
                          onChange={(e) => handleAtributoChange(attr.key, 'valor_base', parseInt(e.target.value) || 0)}
                          className="w-full text-center bg-transparent font-cinzel font-bold text-sm sm:text-base outline-none"
                          title={`Base: ${attrData.valor_base} | Total: ${total}`}
                        />
                      </div>

                      {/* Célula Arredondada Inferior para Adição/Subtração (+/-) no Cálculo */}
                      <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 sm:w-11 h-7 ${theme.attrBottomPill} rounded-xl flex items-center justify-center shadow-sm z-10`}>
                        <input
                          type="number"
                          value={attrData.extra !== 0 ? attrData.extra : ''}
                          placeholder="0"
                          onChange={(e) => handleAtributoChange(attr.key, 'extra', parseInt(e.target.value) || 0)}
                          className="w-full text-center bg-transparent font-cinzel font-bold text-xs outline-none"
                          title="Valor adicional ou subtraído (+ / -) do atributo"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ARMAMENTO */}
            <div className="space-y-1">
              <div className={`${theme.bannerBg} text-center py-1 font-cinzel font-bold text-xs uppercase tracking-widest rounded-xs`}>
                Armamento
              </div>

              {(() => {
                const armamento = ficha.suporte.armamento || ({} as any);
                const armaPrimaria = armamento.arma_primaria || { nome: '', dano: '', dano_arma: '', dano_total: '', resist: 0, peso: 0, efeito: '' };
                const segundaArma = armamento.segunda_arma || { nome: '', dano: '', dano_arma: '', dano_total: '', resist: 0, peso: 0, efeito: '' };
                const armaSuporte = armamento.arma_suporte || { nome: '', dano: '', dano_arma: '', dano_total: '', resist: 0, peso: 0, efeito: '' };
                const arcoLd = armamento.arco_ld || { nome: '', dano: '', dano_flecha: '', dano_total: '', prec: 0, tensao: 0, peso: 0, efeito: '' };

                const meleeList = [
                  { key: 'arma_primaria' as const, label: 'ARMA PRIMÁRIA', data: armaPrimaria },
                  { key: 'segunda_arma' as const, label: 'SEGUNDA ARMA', data: segundaArma },
                ];

                return (
                  <div className="space-y-2 pt-0.5">
                    {/* Linhas 1 e 2: Armas Corpo a Corpo (Primária, Segunda) */}
                    {meleeList.map((w) => (
                      <div key={w.key} className="space-y-0.5">
                        <div className="grid grid-cols-12 gap-1.5 items-end">
                          {/* Nome da Arma */}
                          <div className="col-span-3 flex flex-col">
                            <span className={`text-[8px] sm:text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans mb-0.5 truncate`}>
                              {w.label}
                            </span>
                            <div className={`h-8 rounded-xl ${theme.boxBg} flex items-center px-2 shadow-xs mb-[14px]`}>
                              <input
                                type="text"
                                value={w.data.nome || ''}
                                onChange={(e) => handleArmamentoFieldChange(w.key, 'nome', e.target.value)}
                                placeholder="Nome da Arma"
                                className={`w-full bg-transparent text-xs ${theme.textTitle} font-medium outline-none font-sans`}
                              />
                            </div>
                          </div>

                          {/* Dano (Arma + Total) */}
                          <div className="col-span-3 flex flex-col items-center">
                            <span className={`text-[8px] sm:text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans mb-0.5 text-center`}>
                              DANO
                            </span>
                            <div className="grid grid-cols-2 gap-1 w-full">
                              <div className="flex flex-col items-center">
                                <div className={`w-full h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                                  <input
                                    type="text"
                                    value={w.data.dano_arma ?? w.data.dano ?? ''}
                                    onChange={(e) => {
                                      handleArmamentoFieldChange(w.key, 'dano_arma', e.target.value);
                                      handleArmamentoFieldChange(w.key, 'dano', e.target.value);
                                    }}
                                    placeholder="Dano"
                                    className={`w-full text-center bg-transparent text-xs ${theme.textTitle} font-bold outline-none font-sans`}
                                  />
                                </div>
                                <span className={`text-[7px] sm:text-[7.5px] font-bold ${theme.textMuted} uppercase font-sans mt-0.5`}>
                                  ARMA
                                </span>
                              </div>

                              <div className="flex flex-col items-center">
                                <div className={`w-full h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                                  <input
                                    type="text"
                                    value={w.data.dano_total ?? ''}
                                    onChange={(e) => handleArmamentoFieldChange(w.key, 'dano_total', e.target.value)}
                                    placeholder="Total"
                                    className={`w-full text-center bg-transparent text-xs ${theme.textTitle} font-black outline-none font-sans`}
                                  />
                                </div>
                                <span className={`text-[7px] sm:text-[7.5px] font-bold ${theme.textMuted} uppercase font-sans mt-0.5`}>
                                  TOTAL
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Resistência */}
                          <div className="col-span-1 flex flex-col items-center">
                            <span className={`text-[8px] sm:text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans mb-0.5 text-center truncate w-full`}>
                              RESIST.
                            </span>
                            <div className={`w-full h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs mb-[14px]`}>
                              <input
                                type="number"
                                value={w.data.resist ?? 0}
                                onChange={(e) => handleArmamentoFieldChange(w.key, 'resist', parseInt(e.target.value) || 0)}
                                className={`w-full text-center bg-transparent text-xs ${theme.textTitle} font-bold outline-none font-sans`}
                              />
                            </div>
                          </div>

                          {/* Peso */}
                          <div className="col-span-1 flex flex-col items-center">
                            <span className={`text-[8px] sm:text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans mb-0.5 text-center truncate w-full`}>
                              PESO
                            </span>
                            <div className={`w-full h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs mb-[14px]`}>
                              <input
                                type="number"
                                step="0.1"
                                value={w.data.peso ?? 0}
                                onChange={(e) => handleArmamentoFieldChange(w.key, 'peso', parseFloat(e.target.value) || 0)}
                                className={`w-full text-center bg-transparent text-xs ${theme.textTitle} font-bold outline-none font-sans`}
                              />
                            </div>
                          </div>

                          {/* Efeito (Resumo + Botões de Ação) */}
                          <div className="col-span-4 flex flex-col">
                            <span className={`text-[8px] sm:text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans mb-0.5`}>
                              EFEITO
                            </span>
                            <div className={`h-8 rounded-xl ${theme.boxBg} flex items-center pl-2.5 pr-1 gap-1 shadow-xs mb-[14px] overflow-hidden`}>
                              <input
                                type="text"
                                value={w.data.efeito || ''}
                                onChange={(e) => handleArmamentoFieldChange(w.key, 'efeito', e.target.value)}
                                placeholder="Efeito"
                                title={w.data.efeito_completo || w.data.efeito || ''}
                                className={`flex-1 bg-transparent text-xs ${theme.textTitle} outline-none font-serif italic min-w-0 pr-1 truncate`}
                              />
                              <div className="flex items-center gap-0.5 shrink-0 bg-[#14100c]/60 p-0.5 rounded-sm border border-[#5a4225]/40">
                                <button
                                  type="button"
                                  id={`btn-ver-${w.key}`}
                                  onClick={() => handleOpenWeaponDetails(w.key, w.label)}
                                  title="Visualizar Detalhes Completos da Arma"
                                  className="w-[18px] h-[18px] rounded-xs bg-[#1a140e] hover:bg-[#2e1f14] border border-[#8c6b41]/70 hover:border-[#fde68a] text-[#dcd1ba] hover:text-[#fde68a] flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90"
                                >
                                  <Eye size={10} strokeWidth={2} />
                                </button>
                                <button
                                  type="button"
                                  id={`btn-cat-${w.key}`}
                                  onClick={() => handleOpenWeaponCatalog(w.key, w.label)}
                                  title="Abrir Catálogo de Armamentos do Mercado"
                                  className="w-[18px] h-[18px] rounded-xs bg-[#1a140e] hover:bg-[#2e1f14] border border-[#8c6b41]/70 hover:border-[#fde68a] text-[#dcd1ba] hover:text-[#fde68a] flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90"
                                >
                                  <Sword size={10} strokeWidth={2} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Linha 3: ESCUDO (Nome | RD | Peso | Efeito) */}
                    <div className="space-y-0.5">
                      <div className="grid grid-cols-12 gap-1.5 items-end">
                        {/* Nome do Escudo */}
                        <div className="col-span-4 flex flex-col">
                          <span className={`text-[8px] sm:text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans mb-0.5 truncate`}>
                            ESCUDO
                          </span>
                          <div className={`h-8 rounded-xl ${theme.boxBg} flex items-center px-2 shadow-xs mb-[14px]`}>
                            <input
                              type="text"
                              value={armaSuporte.nome || ''}
                              onChange={(e) => handleArmamentoFieldChange('arma_suporte', 'nome', e.target.value)}
                              placeholder="Nome do Escudo"
                              className={`w-full bg-transparent text-xs ${theme.textTitle} font-medium outline-none font-sans`}
                            />
                          </div>
                        </div>

                        {/* RD do Escudo */}
                        <div className="col-span-2 flex flex-col items-center">
                          <span className={`text-[8px] sm:text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans mb-0.5 text-center truncate w-full`}>
                            RD
                          </span>
                          <div className={`w-full h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs mb-[14px]`}>
                            <input
                              type="number"
                              value={(armaSuporte as any).rd_base ?? armaSuporte.resist ?? 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                handleArmamentoFieldChange('arma_suporte', 'rd_base', val);
                                handleArmamentoFieldChange('arma_suporte', 'resist', val);
                              }}
                              className={`w-full text-center bg-transparent text-xs ${theme.textTitle} font-bold outline-none font-sans`}
                            />
                          </div>
                        </div>

                        {/* Peso do Escudo */}
                        <div className="col-span-2 flex flex-col items-center">
                          <span className={`text-[8px] sm:text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans mb-0.5 text-center truncate w-full`}>
                            PESO
                          </span>
                          <div className={`w-full h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs mb-[14px]`}>
                            <input
                              type="number"
                              step="0.1"
                              value={armaSuporte.peso ?? 0}
                              onChange={(e) => handleArmamentoFieldChange('arma_suporte', 'peso', parseFloat(e.target.value) || 0)}
                              className={`w-full text-center bg-transparent text-xs ${theme.textTitle} font-bold outline-none font-sans`}
                            />
                          </div>
                        </div>

                        {/* Efeito (Resumo + Botões de Ação) */}
                        <div className="col-span-4 flex flex-col">
                          <span className={`text-[8px] sm:text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans mb-0.5`}>
                            EFEITO
                          </span>
                          <div className={`h-8 rounded-xl ${theme.boxBg} flex items-center pl-2.5 pr-1 gap-1 shadow-xs mb-[14px] overflow-hidden`}>
                            <input
                              type="text"
                              value={armaSuporte.efeito || ''}
                              onChange={(e) => handleArmamentoFieldChange('arma_suporte', 'efeito', e.target.value)}
                              placeholder="Efeito"
                              title={armaSuporte.efeito_completo || armaSuporte.efeito || ''}
                              className={`flex-1 bg-transparent text-xs ${theme.textTitle} outline-none font-serif italic min-w-0 pr-1 truncate`}
                            />
                            <div className="flex items-center gap-0.5 shrink-0 bg-[#14100c]/60 p-0.5 rounded-sm border border-[#5a4225]/40">
                              <button
                                type="button"
                                id="btn-ver-arma_suporte"
                                onClick={() => handleOpenWeaponDetails('arma_suporte', 'ESCUDO')}
                                title="Visualizar Detalhes Completos do Escudo"
                                className="w-[18px] h-[18px] rounded-xs bg-[#1a140e] hover:bg-[#2e1f14] border border-[#8c6b41]/70 hover:border-[#fde68a] text-[#dcd1ba] hover:text-[#fde68a] flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90"
                              >
                                <Eye size={10} strokeWidth={2} />
                              </button>
                              <button
                                type="button"
                                id="btn-cat-arma_suporte"
                                onClick={() => handleOpenWeaponCatalog('arma_suporte', 'ESCUDO')}
                                title="Abrir Catálogo de Escudos do Mercado"
                                className="w-[18px] h-[18px] rounded-xs bg-[#1a140e] hover:bg-[#2e1f14] border border-[#8c6b41]/70 hover:border-[#fde68a] text-[#dcd1ba] hover:text-[#fde68a] flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90"
                              >
                                <Shield size={10} strokeWidth={2} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Linha 4: ARCO (LD) */}
                    <div className="space-y-0.5 pt-0.5">
                      <div className="grid grid-cols-12 gap-1.5 items-start">
                        {/* Arco Nome */}
                        <div className="col-span-3 flex flex-col">
                          <span className={`text-[8px] sm:text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans mb-0.5`}>
                            ARCO (LD)
                          </span>
                          <div className={`h-[82px] rounded-xl ${theme.boxBg} p-2 shadow-xs`}>
                            <textarea
                              value={arcoLd.nome || ''}
                              onChange={(e) => handleArmamentoFieldChange('arco_ld', 'nome', e.target.value)}
                              placeholder="Nome do Arco..."
                              className={`w-full h-full bg-transparent text-xs ${theme.textTitle} font-medium outline-none font-sans resize-none custom-scrollbar`}
                            />
                          </div>
                        </div>

                        {/* Dano (Flecha + Total) */}
                        <div className="col-span-3 flex flex-col items-center">
                          <span className={`text-[8px] sm:text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans mb-0.5 text-center`}>
                            DANO
                          </span>
                          <div className="grid grid-cols-2 gap-1 w-full">
                            <div className="flex flex-col items-center">
                              <div className={`w-full h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                                <input
                                  type="text"
                                  value={arcoLd.dano_flecha ?? arcoLd.dano ?? ''}
                                  onChange={(e) => {
                                    handleArmamentoFieldChange('arco_ld', 'dano_flecha', e.target.value);
                                    handleArmamentoFieldChange('arco_ld', 'dano', e.target.value);
                                  }}
                                  placeholder="Flecha"
                                  className={`w-full text-center bg-transparent text-xs ${theme.textTitle} font-bold outline-none font-sans`}
                                />
                              </div>
                              <span className={`text-[7px] sm:text-[7.5px] font-bold ${theme.textMuted} uppercase font-sans mt-0.5`}>
                                FLECHA
                              </span>
                            </div>

                            <div className="flex flex-col items-center">
                              <div className={`w-full h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                                <input
                                  type="text"
                                  value={arcoLd.dano_total ?? ''}
                                  onChange={(e) => handleArmamentoFieldChange('arco_ld', 'dano_total', e.target.value)}
                                  placeholder="Total"
                                  className={`w-full text-center bg-transparent text-xs ${theme.textTitle} font-black outline-none font-sans`}
                                />
                              </div>
                              <span className={`text-[7px] sm:text-[7.5px] font-bold ${theme.textMuted} uppercase font-sans mt-0.5`}>
                                TOTAL
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Prec. e Tensão (Empilhados Verticalmente) */}
                        <div className="col-span-1 flex flex-col items-center space-y-1">
                          {/* Prec */}
                          <div className="w-full flex flex-col items-center">
                            <span className={`text-[8px] sm:text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans mb-0.5 text-center truncate w-full`}>
                              PREC.
                            </span>
                            <div className={`w-full h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                              <input
                                type="number"
                                value={arcoLd.prec ?? 0}
                                onChange={(e) => handleArmamentoFieldChange('arco_ld', 'prec', parseInt(e.target.value) || 0)}
                                className={`w-full text-center bg-transparent text-xs ${theme.textTitle} font-bold outline-none font-sans`}
                              />
                            </div>
                          </div>

                          {/* Tensão */}
                          <div className="w-full flex flex-col items-center">
                            <span className={`text-[8px] sm:text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans mb-0.5 text-center truncate w-full`}>
                              TENSÃO
                            </span>
                            <div className={`w-full h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                              <input
                                type="number"
                                value={arcoLd.tensao ?? 0}
                                onChange={(e) => handleArmamentoFieldChange('arco_ld', 'tensao', parseInt(e.target.value) || 0)}
                                className={`w-full text-center bg-transparent text-xs ${theme.textTitle} font-bold outline-none font-sans`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Peso */}
                        <div className="col-span-1 flex flex-col items-center">
                          <span className={`text-[8px] sm:text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans mb-0.5 text-center truncate w-full`}>
                            PESO
                          </span>
                          <div className={`w-full h-8 rounded-xl ${theme.boxBg} flex items-center justify-center shadow-xs`}>
                            <input
                              type="number"
                              step="0.1"
                              value={arcoLd.peso ?? 0}
                              onChange={(e) => handleArmamentoFieldChange('arco_ld', 'peso', parseFloat(e.target.value) || 0)}
                              className={`w-full text-center bg-transparent text-xs ${theme.textTitle} font-bold outline-none font-sans`}
                            />
                          </div>
                        </div>

                        {/* Efeito (Resumo + Botões de Ação) */}
                        <div className="col-span-4 flex flex-col">
                          <span className={`text-[8px] sm:text-[8.5px] font-bold ${theme.textMuted} uppercase font-sans mb-0.5`}>
                            EFEITO
                          </span>
                          <div className={`h-[82px] rounded-xl ${theme.boxBg} p-2 shadow-xs flex flex-col justify-between overflow-hidden`}>
                            <textarea
                              value={arcoLd.efeito || ''}
                              onChange={(e) => handleArmamentoFieldChange('arco_ld', 'efeito', e.target.value)}
                              placeholder="Efeito e propriedades especiais..."
                              title={arcoLd.efeito_completo || arcoLd.efeito || ''}
                              className={`w-full flex-1 bg-transparent text-xs ${theme.textTitle} font-serif italic outline-none resize-none custom-scrollbar pb-1`}
                            />
                            <div className="flex items-center justify-end gap-1 pt-1 border-t border-[#3a2818]/30">
                              <div className="flex items-center gap-0.5 bg-[#14100c]/60 p-0.5 rounded-sm border border-[#5a4225]/40">
                                <button
                                  type="button"
                                  id="btn-ver-arco_ld"
                                  onClick={() => handleOpenWeaponDetails('arco_ld', 'ARCO (LD)')}
                                  title="Visualizar Detalhes Completos do Arco"
                                  className="w-[18px] h-[18px] rounded-xs bg-[#1a140e] hover:bg-[#2e1f14] border border-[#8c6b41]/70 hover:border-[#fde68a] text-[#dcd1ba] hover:text-[#fde68a] flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90"
                                >
                                  <Eye size={10} strokeWidth={2} />
                                </button>
                                <button
                                  type="button"
                                  id="btn-cat-arco_ld"
                                  onClick={() => handleOpenWeaponCatalog('arco_ld', 'ARCO (LD)')}
                                  title="Abrir Catálogo de Armas de Longa Distância"
                                  className="w-[18px] h-[18px] rounded-xs bg-[#1a140e] hover:bg-[#2e1f14] border border-[#8c6b41]/70 hover:border-[#fde68a] text-[#dcd1ba] hover:text-[#fde68a] flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90"
                                >
                                  <Crosshair size={10} strokeWidth={2} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* TALENTOS & DESVANTAGENS */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className={`${theme.bannerBg} text-center py-1 font-cinzel font-bold text-[11px] uppercase tracking-wider rounded-t-xl shadow-xs`}>
                  Talentos
                </div>
                <div className={`${theme.boxBg} p-2.5 rounded-b-xl shadow-xs`}>
                  <textarea
                    value={ficha.suporte.talentos || ''}
                    onChange={(e) => handleSuporteChange('talentos', e.target.value)}
                    placeholder="Vantagens e talentos do herói..."
                    className={`w-full h-24 bg-transparent ${theme.textBody} text-xs font-serif outline-none resize-none custom-scrollbar`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className={`${theme.bannerBg} text-center py-1 font-cinzel font-bold text-[11px] uppercase tracking-wider rounded-t-xl shadow-xs`}>
                  Desvantagens
                </div>
                <div className={`${theme.boxBg} p-2.5 rounded-b-xl shadow-xs`}>
                  <textarea
                    value={ficha.suporte.desvantagens || ''}
                    onChange={(e) => handleSuporteChange('desvantagens', e.target.value)}
                    placeholder="Fraquezas e penalidades narrativas..."
                    className={`w-full h-24 bg-transparent ${theme.textBody} text-xs font-serif outline-none resize-none custom-scrollbar`}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* PÁGINA 2: INVENTÁRIO, ESPECIALIZAÇÃO E HABILIDADES                        */}
      {/* ========================================================================= */}
      <div className={theme.pageWrapper}>
        {/* Fundo textura */}
        <div className={theme.paperOverlay}></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LADO ESQUERDO: INVENTÁRIO & ESPECIALIZAÇÃO */}
          <div className="lg:col-span-5 space-y-4">
            {/* BANNER ITENS */}
            <div className="space-y-1">
              <div className={`${theme.bannerBg} text-center py-1 font-cinzel font-bold text-xs uppercase tracking-widest rounded-t-xl flex items-center justify-between px-3 shadow-xs`}>
                <span>Itens</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddInventario}
                    className="hover:opacity-80 flex items-center space-x-1 text-[10px] text-[#f2dfa8] cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>

              <div className={`${theme.boxBg} p-2.5 rounded-b-xl space-y-1 shadow-xs`}>
                <div className={`grid grid-cols-12 gap-1.5 text-[9px] font-cinzel font-bold ${theme.textTitle} uppercase border-b ${theme.tableBorder} pb-1.5 px-0.5`}>
                  <span className="col-span-3">Item</span>
                  <span className="col-span-1 text-center">Peso</span>
                  <span className="col-span-1 text-center">Qtd</span>
                  <span className="col-span-6">Descrição</span>
                  <span className="col-span-1 text-center"></span>
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                  {itensConsumiveisEOutros.map((it) => (
                    <div key={it.id} className="grid grid-cols-12 gap-1.5 items-center">
                      <input
                        type="text"
                        value={it.item}
                        onChange={(e) => handleInventarioItemChange(it.id, 'item', e.target.value)}
                        placeholder="Nome do item"
                        className={`col-span-3 ${theme.boxBgLight} text-xs font-serif px-2 py-1 rounded-lg ${theme.textTitle} outline-none`}
                      />
                      <input
                        type="number"
                        step="0.05"
                        value={it.peso}
                        onChange={(e) => handleInventarioItemChange(it.id, 'peso', parseFloat(e.target.value) || 0)}
                        className={`col-span-1 ${theme.boxBgLight} text-xs text-center py-1 rounded-lg ${theme.textTitle} outline-none font-bold`}
                      />
                      <input
                        type="number"
                        min="1"
                        value={it.quantidade !== undefined ? it.quantidade : 1}
                        onChange={(e) => handleInventarioItemChange(it.id, 'quantidade', parseInt(e.target.value, 10) || 1)}
                        placeholder="1"
                        className={`col-span-1 ${theme.boxBgLight} text-xs text-center py-1 rounded-lg ${theme.textTitle} outline-none font-bold`}
                      />
                      <div className={`col-span-6 ${theme.boxBgLight} flex items-center pl-2.5 pr-1 gap-1.5 rounded-lg overflow-hidden`}>
                        <input
                          type="text"
                          value={it.descricao}
                          onChange={(e) => handleInventarioItemChange(it.id, 'descricao', e.target.value)}
                          placeholder="Descrição..."
                          title={it.descricao_completa || it.descricao || ''}
                          className={`flex-1 bg-transparent text-xs font-serif italic ${theme.textTitle} outline-none min-w-0 pr-1 truncate`}
                        />
                        <div className="flex items-center gap-0.5 shrink-0 bg-[#14100c]/60 p-0.5 rounded-sm border border-[#5a4225]/40">
                          <button
                            type="button"
                            onClick={() => handleOpenItemDetails(it)}
                            title="Visualizar Detalhes Completos do Item"
                            className="w-[18px] h-[18px] rounded-xs bg-[#1a140e] hover:bg-[#2e1f14] border border-[#8c6b41]/70 hover:border-[#fde68a] text-[#dcd1ba] hover:text-[#fde68a] flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90"
                          >
                            <Eye size={10} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenItemCatalog(it.id)}
                            title="Puxar do Catálogo do Mercado"
                            className="w-[18px] h-[18px] rounded-xs bg-[#1a140e] hover:bg-[#2e1f14] border border-[#8c6b41]/70 hover:border-[#fde68a] text-[#dcd1ba] hover:text-[#fde68a] flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90"
                          >
                            <Package size={10} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveInventarioItem(it.id)}
                        className="col-span-1 text-gray-400 hover:text-red-500 opacity-60 hover:opacity-100 flex justify-center transition-opacity"
                        title="Remover Item"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ESPECIALIZAÇÃO */}
            <div className="space-y-1">
              <div className={`${theme.bannerBg} text-center py-1 font-cinzel font-bold text-xs uppercase tracking-widest rounded-t-xl shadow-xs`}>
                Especialização
              </div>
              <div className={`${theme.boxBg} p-3 rounded-b-xl h-72 shadow-xs`}>
                <textarea
                  value={ficha.suporte.especializacao || ''}
                  onChange={(e) => handleSuporteChange('especializacao', e.target.value)}
                  placeholder="Detalhes técnicos de profissões, títulos e especialidades..."
                  className={`w-full h-full bg-transparent ${theme.textBody} font-serif text-xs leading-relaxed outline-none resize-none custom-scrollbar`}
                />
              </div>
            </div>
          </div>

          {/* LADO DIREITO: CARGA / DINHEIRO / OUTROS, HABILIDADES E ANOTAÇÕES */}
          <div className="lg:col-span-7 space-y-4">
            {/* TOPO: CARGA, DINHEIRO, OUTROS */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-cinzel font-bold ${theme.textMuted} uppercase mb-1`}>Carga</span>
                <div className={`w-full h-14 ${theme.boxBg} rounded-xl flex flex-col items-center justify-center font-cinzel font-bold`}>
                  <span className="text-base">{ficha.recursos.carga_total_peso} kg</span>
                  <span className="text-[8px] opacity-75 font-sans">Status: {ficha.recursos.carga_status}</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-cinzel font-bold ${theme.textMuted} uppercase mb-1`}>Dinheiro</span>
                <div className={`w-full h-14 ${theme.boxBg} rounded-xl flex items-center justify-center px-2`}>
                  <input
                    type="number"
                    value={ficha.recursos.dinheiro}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      updateFicha((prev) => ({ ...prev, recursos: { ...prev.recursos, dinheiro: val } }));
                    }}
                    className="w-full text-center bg-transparent font-cinzel font-bold text-base outline-none"
                  />
                  <span className="text-xs font-cinzel font-bold opacity-75 ml-1">GP</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-cinzel font-bold ${theme.textMuted} uppercase mb-1`}>Outros</span>
                <div className={`w-full h-14 ${theme.boxBg} rounded-xl p-1.5 overflow-hidden`}>
                  <textarea
                    value={ficha.recursos.outros || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateFicha((prev) => ({ ...prev, recursos: { ...prev.recursos, outros: val } }));
                    }}
                    placeholder="Outros bens..."
                    className="w-full h-full bg-transparent text-[10px] font-serif outline-none resize-none leading-tight"
                  />
                </div>
              </div>
            </div>

            {/* BANNER HABILIDADES */}
            <div className="space-y-3">
              <div className={`${theme.bannerBg} text-center py-1 font-cinzel font-bold text-xs uppercase tracking-widest rounded-xl shadow-xs`}>
                Habilidades
              </div>

              {/* Habilidades de Agilidade */}
              <div className="space-y-1">
                <div className={`flex items-center justify-between text-[9px] font-cinzel font-bold ${theme.textMuted} uppercase px-0.5`}>
                  <div className="flex space-x-3 text-center">
                    <span className="w-8">NH</span>
                    <span className="w-8">Grad.</span>
                  </div>
                  <span>Habilidades de Agilidade</span>
                  <button onClick={() => handleAddTreinamento('Habilidade', 'AGI')} className="hover:opacity-80 p-0.5">
                    <Plus size={12} className={theme.textTitle} />
                  </button>
                </div>
                {habAgi.map((t) => (
                  <div key={t.id} className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      value={t.nh_calculado}
                      onChange={(e) => handleTreinamentoChange(t.id, 'nh_calculado', parseInt(e.target.value) || 0)}
                      className={`w-8 text-center ${theme.boxBgLight} text-xs font-bold py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                    />
                    <input
                      type="number"
                      value={t.graduacao}
                      onChange={(e) => handleTreinamentoChange(t.id, 'graduacao', parseInt(e.target.value) || 0)}
                      className={`w-8 text-center ${theme.boxBgLight} text-xs font-bold py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                    />
                    <input
                      type="text"
                      value={t.nome}
                      onChange={(e) => handleTreinamentoChange(t.id, 'nome', e.target.value)}
                      className={`flex-1 ${theme.boxBgLight} text-xs font-serif px-2.5 py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                    />
                    <button onClick={() => handleRemoveTreinamento(t.id)} className="text-gray-400 hover:text-red-500 opacity-60 hover:opacity-100 p-0.5 transition-opacity">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Habilidades de Inteligência */}
              <div className="space-y-1">
                <div className={`flex items-center justify-between text-[9px] font-cinzel font-bold ${theme.textMuted} uppercase px-0.5`}>
                  <div className="flex space-x-3 text-center">
                    <span className="w-8">NH</span>
                    <span className="w-8">Grad.</span>
                  </div>
                  <span>Habilidades de Inteligência</span>
                  <button onClick={() => handleAddTreinamento('Habilidade', 'INT')} className="hover:opacity-80 p-0.5">
                    <Plus size={12} className={theme.textTitle} />
                  </button>
                </div>
                {habInt.map((t) => (
                  <div key={t.id} className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      value={t.nh_calculado}
                      onChange={(e) => handleTreinamentoChange(t.id, 'nh_calculado', parseInt(e.target.value) || 0)}
                      className={`w-8 text-center ${theme.boxBgLight} text-xs font-bold py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                    />
                    <input
                      type="number"
                      value={t.graduacao}
                      onChange={(e) => handleTreinamentoChange(t.id, 'graduacao', parseInt(e.target.value) || 0)}
                      className={`w-8 text-center ${theme.boxBgLight} text-xs font-bold py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                    />
                    <input
                      type="text"
                      value={t.nome}
                      onChange={(e) => handleTreinamentoChange(t.id, 'nome', e.target.value)}
                      className={`flex-1 ${theme.boxBgLight} text-xs font-serif px-2.5 py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                    />
                    <button onClick={() => handleRemoveTreinamento(t.id)} className="text-gray-400 hover:text-red-500 opacity-60 hover:opacity-100 p-0.5 transition-opacity">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Habilidades de Carisma */}
              <div className="space-y-1">
                <div className={`flex items-center justify-between text-[9px] font-cinzel font-bold ${theme.textMuted} uppercase px-0.5`}>
                  <div className="flex space-x-3 text-center">
                    <span className="w-8">NH</span>
                    <span className="w-8">Grad.</span>
                  </div>
                  <span>Habilidades de Carisma</span>
                  <button onClick={() => handleAddTreinamento('Habilidade', 'CAR')} className="hover:opacity-80 p-0.5">
                    <Plus size={12} className={theme.textTitle} />
                  </button>
                </div>
                {habCar.map((t) => (
                  <div key={t.id} className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      value={t.nh_calculado}
                      onChange={(e) => handleTreinamentoChange(t.id, 'nh_calculado', parseInt(e.target.value) || 0)}
                      className={`w-8 text-center ${theme.boxBgLight} text-xs font-bold py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                    />
                    <input
                      type="number"
                      value={t.graduacao}
                      onChange={(e) => handleTreinamentoChange(t.id, 'graduacao', parseInt(e.target.value) || 0)}
                      className={`w-8 text-center ${theme.boxBgLight} text-xs font-bold py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                    />
                    <input
                      type="text"
                      value={t.nome}
                      onChange={(e) => handleTreinamentoChange(t.id, 'nome', e.target.value)}
                      className={`flex-1 ${theme.boxBgLight} text-xs font-serif px-2.5 py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                    />
                    <button onClick={() => handleRemoveTreinamento(t.id)} className="text-gray-400 hover:text-red-500 opacity-60 hover:opacity-100 p-0.5 transition-opacity">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Habilidades de Artes */}
              <div className="space-y-1">
                <div className={`flex items-center justify-between text-[9px] font-cinzel font-bold ${theme.textMuted} uppercase px-0.5`}>
                  <div className="flex space-x-3 text-center">
                    <span className="w-8">NH</span>
                    <span className="w-8">Grad.</span>
                  </div>
                  <span>Habilidades de Artes</span>
                  <button onClick={() => handleAddTreinamento('Habilidade', 'ART')} className="hover:opacity-80 p-0.5">
                    <Plus size={12} className={theme.textTitle} />
                  </button>
                </div>
                {habArt.map((t) => (
                  <div key={t.id} className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      value={t.nh_calculado}
                      onChange={(e) => handleTreinamentoChange(t.id, 'nh_calculado', parseInt(e.target.value) || 0)}
                      className={`w-8 text-center ${theme.boxBgLight} text-xs font-bold py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                    />
                    <input
                      type="number"
                      value={t.graduacao}
                      onChange={(e) => handleTreinamentoChange(t.id, 'graduacao', parseInt(e.target.value) || 0)}
                      className={`w-8 text-center ${theme.boxBgLight} text-xs font-bold py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                    />
                    <input
                      type="text"
                      value={t.nome}
                      onChange={(e) => handleTreinamentoChange(t.id, 'nome', e.target.value)}
                      className={`flex-1 ${theme.boxBgLight} text-xs font-serif px-2.5 py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                    />
                    <button onClick={() => handleRemoveTreinamento(t.id)} className="text-gray-400 hover:text-red-500 opacity-60 hover:opacity-100 p-0.5 transition-opacity">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* BANNER ANOTAÇÕES */}
            <div className="space-y-1">
              <div className={`${theme.bannerBg} text-center py-1 font-cinzel font-bold text-xs uppercase tracking-widest rounded-t-xl shadow-xs`}>
                Anotações
              </div>
              <div className={`${theme.boxBg} p-3 rounded-b-xl h-28 shadow-xs`}>
                <textarea
                  value={ficha.suporte.anotacoes || ''}
                  onChange={(e) => handleSuporteChange('anotacoes', e.target.value)}
                  placeholder="Anotações gerais e eventos da campanha..."
                  className={`w-full h-full bg-transparent ${theme.textBody} font-serif text-xs leading-relaxed outline-none resize-none custom-scrollbar`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PÁGINA 3: MAESTRIAS MÁGICAS E LIVRO DE MAGIA / GRIMÓRIO                   */}
      {/* ========================================================================= */}
      <div className={theme.pageWrapper}>
        {/* Fundo textura */}
        <div className={theme.paperOverlay}></div>

        <div className="relative z-10 space-y-6">
          {/* PARTE SUPERIOR DA PÁGINA 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* ESQUERDA: MAESTRIAS MÁGICAS */}
            <div className="lg:col-span-6 space-y-2">
              <div className={`${theme.bannerBg} text-center py-1 font-cinzel font-bold text-xs uppercase tracking-widest rounded-t-xl flex items-center justify-between px-3 shadow-xs`}>
                <span>Maestrias Mágicas</span>
                <button
                  onClick={() => handleAddTreinamento('Maestria', 'MAGIA')}
                  className="hover:opacity-80 flex items-center space-x-1 text-[10px]"
                >
                  <Plus size={12} />
                  <span>Adicionar</span>
                </button>
              </div>

              <div className={`${theme.boxBg} p-2.5 rounded-b-xl space-y-1 shadow-xs`}>
                <div className={`grid grid-cols-12 gap-1.5 text-[9px] font-cinzel font-bold ${theme.textTitle} uppercase border-b ${theme.tableBorder} pb-1.5 px-0.5`}>
                  <span className="col-span-2 text-center">NH</span>
                  <span className="col-span-2 text-center">Grad.</span>
                  <span className="col-span-7">Maestria Mágica</span>
                  <span className="col-span-1"></span>
                </div>

                <div className="space-y-1.5">
                  {/* Campo Fixo e Exclusivo de Escudo Mágico */}
                  <div className="grid grid-cols-12 gap-1.5 items-center pb-1 border-b border-[#3a2818]/40">
                    <input
                      type="number"
                      value={maestriaEscudoMagico.nh_calculado}
                      onChange={(e) => handleEscudoMagicoChange('nh_calculado', parseInt(e.target.value) || 0)}
                      className={`col-span-2 text-center ${theme.boxBgLight} text-xs font-black py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                      title="NH do Escudo Mágico (Usado no Bloqueio Mágico)"
                    />
                    <input
                      type="number"
                      value={maestriaEscudoMagico.graduacao}
                      onChange={(e) => handleEscudoMagicoChange('graduacao', parseInt(e.target.value) || 0)}
                      className={`col-span-2 text-center ${theme.boxBgLight} text-xs font-bold py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                      title="Graduação do Escudo Mágico"
                    />
                    <input
                      type="text"
                      value={maestriaEscudoMagico.nome}
                      onChange={(e) => handleEscudoMagicoChange('nome', e.target.value)}
                      placeholder="Escudo Mágico..."
                      className={`col-span-8 ${theme.boxBgLight} text-xs font-serif font-bold px-2.5 py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                      title="Nome do Escudo Mágico"
                    />
                  </div>

                  {maestriasMagicas.map((t) => (
                    <div key={t.id} className="grid grid-cols-12 gap-1.5 items-center">
                      <input
                        type="number"
                        value={t.nh_calculado}
                        onChange={(e) => handleTreinamentoChange(t.id, 'nh_calculado', parseInt(e.target.value) || 0)}
                        className={`col-span-2 text-center ${theme.boxBgLight} text-xs font-bold py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                      />
                      <input
                        type="number"
                        value={t.graduacao}
                        onChange={(e) => handleTreinamentoChange(t.id, 'graduacao', parseInt(e.target.value) || 0)}
                        className={`col-span-2 text-center ${theme.boxBgLight} text-xs font-bold py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                      />
                      <input
                        type="text"
                        value={t.nome}
                        onChange={(e) => handleTreinamentoChange(t.id, 'nome', e.target.value)}
                        className={`col-span-7 ${theme.boxBgLight} text-xs font-serif px-2.5 py-1 rounded-lg ${theme.textTitle} outline-none shadow-2xs`}
                      />
                      <button
                        onClick={() => handleRemoveTreinamento(t.id)}
                        className="col-span-1 text-gray-400 hover:text-red-500 opacity-60 hover:opacity-100 flex justify-center p-0.5 transition-opacity"
                        title="Remover Maestria"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DIREITA: QUADRANTES DE STATUS MÁGICOS */}
            <div className="lg:col-span-6 flex justify-around items-center pt-2">
              {/* NORTH */}
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-cinzel font-bold ${theme.textMuted} uppercase tracking-wider mb-1`}>North</span>
                <div className={`w-18 h-14 ${theme.boxBg} rounded-t-xl flex items-center justify-center text-xl font-cinzel font-bold shadow-sm`}>
                  {ficha.status.north + (ficha.suporte.ext_per?.north_ext || 0) - (ficha.suporte.ext_per?.north_per || 0)}
                </div>
                <div className="grid grid-cols-2 gap-1 w-full mt-1">
                  <span className={`text-[8px] font-cinzel text-center ${theme.textMuted}`}>EXTRA</span>
                  <span className={`text-[8px] font-cinzel text-center ${theme.textMuted}`}>PERDA</span>
                </div>
              </div>

              {/* VIDA */}
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-cinzel font-bold ${theme.textMuted} uppercase tracking-wider mb-1`}>Vida</span>
                <div className={`w-18 h-14 ${theme.boxBg} rounded-t-xl flex items-center justify-center text-xl font-cinzel font-bold shadow-sm`}>
                  {ficha.status.vida_max + (ficha.suporte.ext_per?.vida_ext || 0) - (ficha.suporte.ext_per?.vida_per || 0)}
                </div>
                <div className="grid grid-cols-2 gap-1 w-full mt-1">
                  <span className={`text-[8px] font-cinzel text-center ${theme.textMuted}`}>EXTRA</span>
                  <span className={`text-[8px] font-cinzel text-center ${theme.textMuted}`}>PERDA</span>
                </div>
              </div>

              {/* VIGOR */}
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-cinzel font-bold ${theme.textMuted} uppercase tracking-wider mb-1`}>Vigor</span>
                <div className={`w-18 h-14 ${theme.boxBg} rounded-t-xl flex items-center justify-center text-xl font-cinzel font-bold shadow-sm`}>
                  {ficha.status.vigor_max + (ficha.suporte.ext_per?.vigor_ext || 0) - (ficha.suporte.ext_per?.vigor_per || 0)}
                </div>
                <div className="grid grid-cols-2 gap-1 w-full mt-1">
                  <span className={`text-[8px] font-cinzel text-center ${theme.textMuted}`}>EXTRA</span>
                  <span className={`text-[8px] font-cinzel text-center ${theme.textMuted}`}>PERDA</span>
                </div>
              </div>
            </div>
          </div>

          {/* LIVRO DE MAGIA / GRIMÓRIO (MOLDURA ABERTA) */}
          <div className="space-y-2">
            <div className={`${theme.bannerBg} text-center py-1 font-cinzel font-bold text-sm uppercase tracking-widest rounded-xs shadow-sm`}>
              Livro de Magia / Grimório
            </div>

            {/* Moldura Gráfica do Grimório Aberto com 2 Páginas */}
            <div className={`${theme.boxBg} border-4 rounded-2xl p-4 sm:p-6 shadow-md grid grid-cols-1 md:grid-cols-2 gap-6 relative min-h-[460px]`}>
              {/* Linha Central do Livro */}
              <div className={`hidden md:block absolute top-4 bottom-4 left-1/2 w-0.5 ${theme.tableBorder} -translate-x-1/2 opacity-60`}></div>

              {/* Página Esquerda do Grimório */}
              <div className="flex min-w-0 flex-col space-y-2">
                <div className={`flex items-center space-x-2 border-b ${theme.tableBorder} pb-1`}>
                  <Sparkle size={14} className={theme.brandAccent} />
                  <span className={`font-cinzel text-xs font-bold ${theme.textTitle} uppercase`}>Página Esquerda do Grimório</span>
                </div>
                <div className="flex flex-col gap-2">
                  {learnedSpells.slice(0, Math.ceil(learnedSpells.length / 2)).map((spell) => (
                    <SpellCard key={spell.id} spell={spell} learned onOpen={() => setSelectedSpell(spell)} onToggleLearned={() => toggleFichaSpell(spell.id)} />
                  ))}
                  {!learnedSpells.length && <p className={`border border-dashed ${theme.tableBorder} px-3 py-6 text-center font-serif text-xs italic ${theme.textMuted}`}>{erroGrimorio ? 'Não foi possível carregar o grimório.' : isLoadingGrimorio || !hasLoadedGrimorio ? 'Invocando as fórmulas do grimório…' : 'Nenhuma magia aprendida para este personagem.'}</p>}
                </div>
              </div>

              {/* Página Direita do Grimório */}
              <div className="flex min-w-0 flex-col space-y-2">
                <div className={`flex items-center space-x-2 border-b ${theme.tableBorder} pb-1`}>
                  <Sparkle size={14} className={theme.brandAccent} />
                  <span className={`font-cinzel text-xs font-bold ${theme.textTitle} uppercase`}>Página Direita do Grimório</span>
                </div>
                <div className="flex flex-col gap-2">
                  {learnedSpells.slice(Math.ceil(learnedSpells.length / 2)).map((spell) => (
                    <SpellCard key={spell.id} spell={spell} learned onOpen={() => setSelectedSpell(spell)} onToggleLearned={() => toggleFichaSpell(spell.id)} />
                  ))}
                  {!learnedSpells.length && <p className={`border border-dashed ${theme.tableBorder} px-3 py-6 text-center font-serif text-xs italic ${theme.textMuted}`}>{erroGrimorio ? 'Não foi possível carregar o grimório.' : isLoadingGrimorio || !hasLoadedGrimorio ? 'Invocando as fórmulas do grimório…' : 'Nenhuma magia aprendida para este personagem.'}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedSpell && (
        <SpellDetailsModal
          spell={selectedSpell}
          learned={learnedSpellIds.includes(selectedSpell.id)}
          onClose={() => setSelectedSpell(null)}
          onToggleLearned={() => toggleFichaSpell(selectedSpell.id)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: PERSONALIZAR ESTILO VISUAL                                          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAuraModalOpen}
        onClose={() => setAuraModalOpen(false)}
        title="Personalizar Estilo Visual"
      >
        <div className="space-y-5 font-serif text-sm">
          {/* SELETOR DE ESTILO VISUAL */}
          <div>
            <label className="block text-xs font-cinzel uppercase text-[#f2dfa8] mb-2 flex items-center gap-1.5">
              <Palette size={14} className="text-[#a88d61]" />
              <span>Estilo / Tema da Ficha</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.values(FICHA_THEMES).map((th) => {
                const isSelected = (ficha.identidade.estilo_tema || 'sistema') === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => handleIdentidadeChange('estilo_tema', th.id)}
                    className={`p-2.5 rounded-xs border text-left flex items-start space-x-2.5 transition-all ${
                      isSelected 
                        ? 'border-[#f2dfa8] bg-[#2a1d10] shadow-[0_0_12px_rgba(242,223,168,0.2)]' 
                        : 'border-[#4a3420] bg-[#16100a] hover:border-[#8c6b41] hover:bg-[#1f160e]'
                    }`}
                  >
                    <div 
                      className="w-5 h-5 rounded-full mt-0.5 shrink-0 border border-white/40 flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: th.previewColor }}
                    >
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-cinzel text-xs font-bold truncate ${isSelected ? 'text-[#f2dfa8]' : 'text-[#dcd1ba]'}`}>
                          {th.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#a88d61] font-sans leading-tight mt-0.5 line-clamp-2">
                        {th.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <GothicButton
              onClick={() => {
                setAuraModalOpen(false);
                saveCurrentFicha();
              }}
              size="sm"
              variant="primary"
              width={170}
              height={44}
              disabled={readOnly}
            >
              Aplicar & Salvar
            </GothicButton>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: INVENTÁRIO DO PERSONAGEM (CATÁLOGO & MOCHILA ESTILO RPG)           */}
      {/* ========================================================================= */}
      <RPGInventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => setInventoryModalOpen(false)}
        ficha={ficha}
        initialCategory={inventoryModalCategory}
        targetSlot={equipTargetSlot ?? undefined}
        onUpdateFicha={updateFicha}
        onUpdateInventario={(novoInventario) => {
          updateFicha((prev) => ({
            ...prev,
            suporte: {
              ...prev.suporte,
              inventario: novoInventario,
            },
          }));
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL: EXPORTAR PDF IMPRESSO                                              */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isPdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        title="Exportar Ficha Oficial (PDF 1:1)"
      >
        <div className="space-y-3 font-serif text-sm text-[#dcd1ba]">
          <p>
            A ficha técnica oficial de 3 páginas de <strong className="text-[#f2dfa8]">{ficha.identidade.nome_personagem}</strong> está configurada no formato 1:1 com o modelo oficial Angarden.
          </p>
          <p className="text-xs text-[#a88d61]">
            Você pode imprimir ou salvar em PDF diretamente utilizando o comando de impressão do navegador (Ctrl + P / Cmd + P).
          </p>

          <div className="flex justify-end space-x-2 pt-3">
            <GothicButton
              onClick={() => window.print()}
              size="sm"
              variant="primary"
              width={180}
              height={44}
            >
              Imprimir / PDF
            </GothicButton>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DETALHES DA ARMADURA EQUIPADA                                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isArmorDetailsOpen}
        onClose={() => setIsArmorDetailsOpen(false)}
        title="Detalhes da Armadura Equipada"
      >
        <div className="space-y-4 font-serif text-sm">
          {/* Cabeçalho com Nome e Tipo */}
          <div className="bg-[#14100c] border border-[#5a4225] p-3 rounded-xs space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-cinzel font-bold text-base text-[#f2dfa8]">
                {ficha.suporte.armadura.nome || 'Armadura Sem Nome'}
              </h4>
              <span className="text-[10px] font-cinzel uppercase px-2 py-0.5 rounded-xs bg-[#2a1d10] border border-[#8c6b41] text-[#e6ddc5]">
                {ficha.suporte.armadura.tipo || 'Armadura Personalizada'}
              </span>
            </div>
            {ficha.suporte.armadura.material && (
              <p className="text-xs text-[#a88d61] font-sans">
                <strong>Material:</strong> {ficha.suporte.armadura.material}
              </p>
            )}
          </div>

          {/* Grade de Redução de Dano (RD) por Peça */}
          <div className="space-y-2">
            <span className="text-xs font-cinzel font-bold text-[#e6ddc5] uppercase tracking-wider block">
              Distribuição de Redução de Dano (RD):
            </span>
            <GradeRdPecasArmadura
              rdPorPeca={{
                elmo: ficha.suporte.armadura.elmo || 0,
                gorjal: ficha.suporte.armadura.gorjal || 0,
                couraca: ficha.suporte.armadura.couraca || 0,
                bracal: ficha.suporte.armadura.bracal || 0,
                manoplas: ficha.suporte.armadura.manoplas || 0,
                coxote: ficha.suporte.armadura.coxote || 0,
                calca: ficha.suporte.armadura.calca || 0,
                grevas: ficha.suporte.armadura.grevas || 0,
              }}
            />
          </div>

          {/* Peso, Requisitos e Efeitos */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#120f0d] p-2 border border-[#3a2818] rounded-xs">
              <span className="text-[#a88d61] font-sans font-bold block mb-0.5">PESO</span>
              <span className="text-[#e6ddc5]">{ficha.suporte.armadura.peso ? `${ficha.suporte.armadura.peso} kg` : 'Não especificado'}</span>
            </div>
            <div className="bg-[#120f0d] p-2 border border-[#3a2818] rounded-xs">
              <span className="text-[#a88d61] font-sans font-bold block mb-0.5">REQUISITOS</span>
              <span className="text-[#e6ddc5]">{ficha.suporte.armadura.requisitos || 'Sem requisitos'}</span>
            </div>
          </div>

          {/* Efeitos Especiais */}
          <div className="bg-[#120f0d] p-2.5 border border-[#3a2818] rounded-xs space-y-1">
            <span className="text-xs font-cinzel font-bold text-[#f2dfa8] block">EFEITO & PROPRIEDADES ESPECIAIS</span>
            <p className="text-xs text-[#dcd1ba] italic">
              {ficha.suporte.armadura.efeito || 'Nenhum efeito especial registrado para esta armadura.'}
            </p>
          </div>

          {/* Descrição Lore */}
          {ficha.suporte.armadura.descricao && (
            <div className="bg-[#120f0d] p-2.5 border border-[#3a2818] rounded-xs space-y-1">
              <span className="text-xs font-cinzel font-bold text-[#a88d61] block">LORE & DESCRIÇÃO</span>
              <p className="text-xs text-[#dcd1ba] leading-relaxed">
                {ficha.suporte.armadura.descricao}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <GothicButton
              onClick={() => setIsArmorDetailsOpen(false)}
              size="sm"
              variant="secondary"
              width={120}
              height={38}
            >
              Fechar
            </GothicButton>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DETALHES DA MONTARIA EQUIPADA                                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isMountDetailsOpen}
        onClose={() => setIsMountDetailsOpen(false)}
        title="Detalhes da Montaria Equipada"
      >
        <div className="space-y-4 font-serif text-sm">
          {/* Cabeçalho com Nome e Raça/Tipo */}
          <div className="bg-[#14100c] border border-[#5a4225] p-3 rounded-xs space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-cinzel font-bold text-base text-[#f2dfa8]">
                {ficha.suporte.montaria?.nome || 'Montaria Sem Nome'}
              </h4>
              <span className="text-[10px] font-cinzel uppercase px-2 py-0.5 rounded-xs bg-[#2a1d10] border border-[#8c6b41] text-[#e6ddc5]">
                {ficha.suporte.montaria?.tipo || 'Montaria Terrestre'}
              </span>
            </div>
            {ficha.suporte.montaria?.raca && (
              <p className="text-xs text-[#a88d61] font-sans">
                <strong>Raça / Espécie:</strong> {ficha.suporte.montaria.raca}
              </p>
            )}
          </div>

          {/* Grade de Redução de Dano (RD) por Parte (Cabeça, Tronco, Superiores, Inferiores) */}
          <div className="space-y-1.5">
            <span className="text-xs font-cinzel font-bold text-[#e6ddc5] uppercase tracking-wider block">
              Distribuição de Redução de Dano (RD):
            </span>
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className="bg-[#1a140e] border border-[#3a2818] p-1.5 rounded-xs">
                <span className="text-[9px] text-[#a88d61] font-sans uppercase block">Cabeça</span>
                <span className="text-sm font-bold text-[#f2dfa8] font-cinzel">{ficha.suporte.montaria?.cabeca || 0}</span>
              </div>
              <div className="bg-[#241a12] border border-[#8c6b41] p-1.5 rounded-xs">
                <span className="text-[9px] text-[#f2dfa8] font-sans uppercase font-bold block">Tronco</span>
                <span className="text-sm font-black text-[#fde68a] font-cinzel">{ficha.suporte.montaria?.tronco || 0}</span>
              </div>
              <div className="bg-[#1a140e] border border-[#3a2818] p-1.5 rounded-xs">
                <span className="text-[9px] text-[#a88d61] font-sans uppercase block">Superiores</span>
                <span className="text-sm font-bold text-[#f2dfa8] font-cinzel">{ficha.suporte.montaria?.superiores || 0}</span>
              </div>
              <div className="bg-[#1a140e] border border-[#3a2818] p-1.5 rounded-xs">
                <span className="text-[9px] text-[#a88d61] font-sans uppercase block">Inferiores</span>
                <span className="text-sm font-bold text-[#f2dfa8] font-cinzel">{ficha.suporte.montaria?.inferiores || 0}</span>
              </div>
            </div>
          </div>

          {/* Peso / Carga e Velocidade */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#120f0d] p-2 border border-[#3a2818] rounded-xs">
              <span className="text-[#a88d61] font-sans font-bold block mb-0.5">VELOCIDADE</span>
              <span className="text-[#e6ddc5]">{ficha.suporte.montaria?.velocidade ? `${ficha.suporte.montaria.velocidade}` : 'Não especificada'}</span>
            </div>
            <div className="bg-[#120f0d] p-2 border border-[#3a2818] rounded-xs">
              <span className="text-[#a88d61] font-sans font-bold block mb-0.5">PESO / PORTE</span>
              <span className="text-[#e6ddc5]">{ficha.suporte.montaria?.peso ? `${ficha.suporte.montaria.peso} kg` : 'Não especificado'}</span>
            </div>
          </div>

          {/* Habilidades & Traços Especiais */}
          <div className="bg-[#120f0d] p-2.5 border border-[#3a2818] rounded-xs space-y-1">
            <span className="text-xs font-cinzel font-bold text-[#f2dfa8] block">HABILIDADES & TRAÇOS</span>
            <p className="text-xs text-[#dcd1ba] italic">
              {ficha.suporte.montaria?.habilidades || 'Nenhuma habilidade especial registrada.'}
            </p>
          </div>

          {/* Requisitos */}
          {ficha.suporte.montaria?.requisitos && (
            <div className="bg-[#120f0d] p-2 border border-[#3a2818] rounded-xs">
              <span className="text-[#a88d61] font-sans font-bold block mb-0.5">REQUISITOS DE CONDUÇÃO</span>
              <span className="text-[#e6ddc5]">{ficha.suporte.montaria.requisitos}</span>
            </div>
          )}

          {/* Descrição Lore */}
          {ficha.suporte.montaria?.descricao && (
            <div className="bg-[#120f0d] p-2.5 border border-[#3a2818] rounded-xs space-y-1">
              <span className="text-xs font-cinzel font-bold text-[#a88d61] block">LORE & DESCRIÇÃO</span>
              <p className="text-xs text-[#dcd1ba] leading-relaxed">
                {ficha.suporte.montaria.descricao}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <GothicButton
              onClick={() => setIsMountDetailsOpen(false)}
              size="sm"
              variant="secondary"
              width={120}
              height={38}
            >
              Fechar
            </GothicButton>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DETALHES DO ARMAMENTO EQUIPADO                                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isWeaponDetailsOpen}
        onClose={() => setIsWeaponDetailsOpen(false)}
        title={`Detalhes do Armamento: ${selectedWeaponSlotLabel}`}
      >
        {(() => {
          const currentArmamento = ficha.suporte.armamento || ({} as any);
          const weapon = currentArmamento[selectedWeaponSlot] || {};
          const isRanged = selectedWeaponSlot === 'arco_ld';

          return (
            <div className="space-y-4 font-serif text-sm">
              {/* Cabeçalho com Nome e Categoria */}
              <div className="bg-[#14100c] border border-[#5a4225] p-3 rounded-xs space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-cinzel font-bold text-base text-[#f2dfa8]">
                    {weapon.nome || 'Armamento Sem Nome'}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    {weapon.is_epico && (
                      <span className="text-[10px] font-cinzel font-bold uppercase px-2 py-0.5 rounded-xs bg-[#451a03] border border-[#f59e0b] text-[#fde68a]">
                        Épico
                      </span>
                    )}
                    <span className="text-[10px] font-cinzel uppercase px-2 py-0.5 rounded-xs bg-[#2a1d10] border border-[#8c6b41] text-[#e6ddc5]">
                      {weapon.categoria || (isRanged ? 'Arma de Disparo' : 'Arma Branca')}
                    </span>
                  </div>
                </div>
                {weapon.material && (
                  <p className="text-xs text-[#a88d61] font-sans">
                    <strong>Material / Forja:</strong> {weapon.material}
                  </p>
                )}
              </div>

              {/* Grade de Estatísticas da Arma */}
              <div className="space-y-1.5">
                <span className="text-xs font-cinzel font-bold text-[#e6ddc5] uppercase tracking-wider block">
                  Estatísticas & Combate:
                </span>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="bg-[#1a140e] border border-[#3a2818] p-1.5 rounded-xs">
                    <span className="text-[9px] text-[#a88d61] font-sans uppercase block">
                      {isRanged ? 'Dano Flecha' : 'Dano Arma'}
                    </span>
                    <span className="text-sm font-bold text-[#f2dfa8] font-cinzel">
                      {isRanged ? (weapon.dano_flecha ?? weapon.dano ?? 0) : (weapon.dano_arma ?? weapon.dano ?? 0)}
                    </span>
                  </div>
                  <div className="bg-[#241a12] border border-[#8c6b41] p-1.5 rounded-xs">
                    <span className="text-[9px] text-[#f2dfa8] font-sans uppercase font-bold block">Dano Total</span>
                    <span className="text-sm font-black text-[#fde68a] font-cinzel">{weapon.dano_total || 0}</span>
                  </div>
                  <div className="bg-[#1a140e] border border-[#3a2818] p-1.5 rounded-xs">
                    <span className="text-[9px] text-[#a88d61] font-sans uppercase block">Resistência</span>
                    <span className="text-sm font-bold text-[#f2dfa8] font-cinzel">{weapon.resist || 0}</span>
                  </div>
                  <div className="bg-[#1a140e] border border-[#3a2818] p-1.5 rounded-xs">
                    <span className="text-[9px] text-[#a88d61] font-sans uppercase block">Peso</span>
                    <span className="text-sm font-bold text-[#f2dfa8] font-cinzel">{weapon.peso || 0} kg</span>
                  </div>
                </div>

                {isRanged && (
                  <div className="grid grid-cols-2 gap-1.5 text-center pt-1">
                    <div className="bg-[#1a140e] border border-[#3a2818] p-1.5 rounded-xs">
                      <span className="text-[9px] text-[#a88d61] font-sans uppercase block">Precisão (Prec.)</span>
                      <span className="text-sm font-bold text-[#f2dfa8] font-cinzel">{weapon.prec || 0}</span>
                    </div>
                    <div className="bg-[#1a140e] border border-[#3a2818] p-1.5 rounded-xs">
                      <span className="text-[9px] text-[#a88d61] font-sans uppercase block">Tensão</span>
                      <span className="text-sm font-bold text-[#f2dfa8] font-cinzel">{weapon.tensao || 0}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Efeito Completo e Resumo */}
              <div className="bg-[#120f0d] p-2.5 border border-[#3a2818] rounded-xs space-y-1">
                <span className="text-xs font-cinzel font-bold text-[#f2dfa8] block">EFEITO & PROPRIEDADES ESPECIAIS</span>
                {weapon.efeito_completo ? (
                  <p className="text-xs text-[#dcd1ba] italic leading-relaxed">
                    {weapon.efeito_completo}
                  </p>
                ) : (
                  <p className="text-xs text-[#dcd1ba] italic">
                    {weapon.efeito || 'Nenhum efeito registrado.'}
                  </p>
                )}
              </div>

              {/* Requisitos */}
              {weapon.requisitos && (
                <div className="bg-[#120f0d] p-2 border border-[#3a2818] rounded-xs">
                  <span className="text-[#a88d61] font-sans font-bold block mb-0.5">REQUISITOS DE EMPUNHADURA</span>
                  <span className="text-[#e6ddc5]">{weapon.requisitos}</span>
                </div>
              )}

              {/* Descrição Lore */}
              {weapon.descricao && (
                <div className="bg-[#120f0d] p-2.5 border border-[#3a2818] rounded-xs space-y-1">
                  <span className="text-xs font-cinzel font-bold text-[#a88d61] block">LORE & DESCRIÇÃO</span>
                  <p className="text-xs text-[#dcd1ba] leading-relaxed">
                    {weapon.descricao}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <GothicButton
                  onClick={() => setIsWeaponDetailsOpen(false)}
                  size="sm"
                  variant="secondary"
                  width={120}
                  height={38}
                >
                  Fechar
                </GothicButton>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DETALHES DO ITEM DO INVENTÁRIO                                     */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isItemDetailsOpen}
        onClose={() => setIsItemDetailsOpen(false)}
        title={`Detalhes do Item: ${selectedInventoryItem?.item || 'Item'}`}
      >
        {selectedInventoryItem && (
          <div className="space-y-4 font-serif text-sm">
            {/* Cabeçalho com Nome e Categoria */}
            <div className="bg-[#14100c] border border-[#5a4225] p-3 rounded-xs space-y-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-cinzel font-bold text-base text-[#f2dfa8]">
                  {selectedInventoryItem.item || 'Item Sem Nome'}
                </h4>
                <div className="flex items-center gap-1.5">
                  {selectedInventoryItem.is_raro && (
                    <span className="text-[10px] font-cinzel font-bold uppercase px-2 py-0.5 rounded-xs bg-[#451a03] border border-[#f59e0b] text-[#fde68a]">
                      Raro / Nobre
                    </span>
                  )}
                  <span className="text-[10px] font-cinzel uppercase px-2 py-0.5 rounded-xs bg-[#2a1d10] border border-[#8c6b41] text-[#e6ddc5]">
                    {selectedInventoryItem.categoria || 'Geral'}
                  </span>
                </div>
              </div>
            </div>

            {/* Estatísticas Básicas: Peso, Quantidade, Preço */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#1a140e] border border-[#3a2818] p-2 rounded-xs">
                <span className="text-[9px] text-[#a88d61] font-sans uppercase block">Peso</span>
                <span className="text-sm font-bold text-[#f2dfa8] font-cinzel">
                  {selectedInventoryItem.peso || 0} kg
                </span>
              </div>
              <div className="bg-[#241a12] border border-[#8c6b41] p-2 rounded-xs">
                <span className="text-[9px] text-[#f2dfa8] font-sans uppercase font-bold block">Quantidade</span>
                <span className="text-sm font-black text-[#fde68a] font-cinzel">
                  {selectedInventoryItem.quantidade !== undefined ? selectedInventoryItem.quantidade : 1} un
                </span>
              </div>
              <div className="bg-[#1a140e] border border-[#3a2818] p-2 rounded-xs">
                <span className="text-[9px] text-[#a88d61] font-sans uppercase block">Valor Estimado</span>
                <span className="text-sm font-bold text-[#86e2d5] font-cinzel">
                  {selectedInventoryItem.preco ? `${selectedInventoryItem.preco} GP` : '—'}
                </span>
              </div>
            </div>

            {/* Efeito ou Propriedades Especiais */}
            {selectedInventoryItem.efeito && (
              <div className="bg-[#120f0d] p-2.5 border border-[#3a2818] rounded-xs space-y-1">
                <span className="text-xs font-cinzel font-bold text-[#f2dfa8] block">EFEITO / PROPRIEDADES</span>
                <p className="text-xs text-[#dcd1ba] italic leading-relaxed">
                  {selectedInventoryItem.efeito}
                </p>
              </div>
            )}

            {/* Descrição Completa e Lore */}
            <div className="bg-[#120f0d] p-2.5 border border-[#3a2818] rounded-xs space-y-1">
              <span className="text-xs font-cinzel font-bold text-[#a88d61] block">DESCRIÇÃO DETALHADA</span>
              <p className="text-xs text-[#dcd1ba] leading-relaxed">
                {selectedInventoryItem.descricao_completa || selectedInventoryItem.descricao || 'Nenhuma descrição detalhada disponível.'}
              </p>
            </div>

            {/* Requisitos */}
            {selectedInventoryItem.requisitos && (
              <div className="bg-[#120f0d] p-2 border border-[#3a2818] rounded-xs">
                <span className="text-[#a88d61] font-sans font-bold block mb-0.5 text-xs">REQUISITOS DE USO</span>
                <span className="text-xs text-[#e6ddc5]">{selectedInventoryItem.requisitos}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <GothicButton
                onClick={() => setIsItemDetailsOpen(false)}
                size="sm"
                variant="secondary"
                width={120}
                height={38}
              >
                Fechar
              </GothicButton>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL COMPLETO DE DETALHES DA MERCADORIA (COM IMAGEM, LORE, STATUS E AÇÕES) */}
      {/* ========================================================================= */}
      <ModalDetalhesCompra
        isOpen={!!itemParaDetalhesFicha}
        onClose={() => setItemParaDetalhesFicha(null)}
        item={itemParaDetalhesFicha}
        origem="inventario"
        ficha={ficha}
        onEquipar={handleEquiparFicha}
        onDescartar={handleDescartarFicha}
        onConsumir={handleConsumirFicha}
      />
      </div>
    </PageShell>
  );
};
