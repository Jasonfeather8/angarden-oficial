import React, { useState, useEffect } from 'react';
import { MercadoItem, FichaCompleta } from '../types';
import { Modal } from './Modal';
import { GothicButton } from './GothicButton';
import { ItemIconVisual } from './ItemIconVisual';
import { GradeRdPecasArmadura, calcularRdPorPeca } from './GradeRdPecasArmadura';
import { determinarSlotsEquipamento } from '../services/inventarioService';
import { Coins, Weight, Shield, Swords, Sparkles, AlertCircle, CheckCircle2, Lock, Edit3, Trash2, Crosshair, Package } from 'lucide-react';

export interface ModalDetalhesCompraProps {
  isOpen: boolean;
  onClose: () => void;
  item: MercadoItem | null;
  saldoAtual?: number;
  cargaAtual?: number;
  nomePersonagemComprador?: string;
  temPermissaoEpica?: boolean;
  onConfirmarCompra?: (item: MercadoItem, quantidade: number) => Promise<void>;
  canManageCatalog?: boolean;
  onEditar?: (item: MercadoItem) => void;
  onExcluir?: (item: MercadoItem) => Promise<void> | void;
  // Modo Inventário
  origem?: 'mercado' | 'inventario';
  ficha?: FichaCompleta | null;
  onEquipar?: (item: MercadoItem, slot?: string) => Promise<void> | void;
  onDescartar?: (item: MercadoItem) => Promise<void> | void;
  onConsumir?: (item: MercadoItem) => Promise<void> | void;
}

const valorDetalhe = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return '-';
  }
  return String(value);
};

/**
 * Tela 3.1 - Detalhes e Compra de Item [Modal]
 * Atributos técnicos: Dano, Material, RD_Base, Tensão, Prec, Efeito, Peso, Preço.
 * Seletor de Quantidade (no Mercado) ou Ações de Equipar / Descartar (no Inventário).
 * Resumo financeiro: Saldo Atual (fichas_recursos.dinheiro) vs. Valor Total da Compra.
 * Botão "Confirmar Compra" (Ativo se Saldo >= Valor Total) ou "Equipar" / "Descartar".
 * Painel do Administrador: opções de editar e excluir exclusivas para o Administrador.
 */
export const ModalDetalhesCompra: React.FC<ModalDetalhesCompraProps> = ({
  isOpen,
  onClose,
  item,
  saldoAtual = 0,
  cargaAtual = 0,
  nomePersonagemComprador,
  temPermissaoEpica = true,
  onConfirmarCompra,
  canManageCatalog = false,
  onEditar,
  onExcluir,
  origem = 'mercado',
  ficha = null,
  onEquipar,
  onDescartar,
  onConsumir,
}) => {
  const [quantidade, setQuantidade] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [excluindo, setExcluindo] = useState<boolean>(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<boolean>(false);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const slotsEquip = ficha && item
    ? determinarSlotsEquipamento(ficha, item)
    : { tipo: 'outro' as const, slotsDisponiveis: [] };

  useEffect(() => {
    setConfirmandoDescarte(false);
    setConfirmandoExclusao(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [item, isOpen]);

  if (!item) return null;

  const custoTotal = item.preco * quantidade;
  const pesoTotalAcrescentado = Number(((item.peso || 0) * quantidade).toFixed(2));
  const saldoSuficiente = saldoAtual >= custoTotal;
  const bloqueadoPorEpico = item.is_epico && !temPermissaoEpica;
  const podeComprar = saldoSuficiente && !bloqueadoPorEpico && quantidade > 0;

  const isArmadura =
    item.categoria === 'mercado_armaduras' ||
    (item.categoria !== 'mercado_ld' &&
      item.categoria !== 'mercado_progeteis' &&
      item.categoria !== 'mercado_arremesso' &&
      item.categoria !== 'mercado_armas' &&
      item.categoria !== 'mercado_acessorios' &&
      item.categoria !== 'mercado_geral' &&
      (item.rd_por_peca !== undefined ||
        (item.rd_base !== undefined && item.rd_base > 0 && !item.dano) ||
        Boolean(item.pecas && (item.pecas.toLowerCase().includes('peça') || /^\d+$/.test(item.pecas.trim())))));

  const isEscudo =
    item.categoria === 'mercado_acessorios' ||
    item.categoria === 'mercado_escudos' ||
    item.icone_tipo === 'shield' ||
    item.icone_tipo === 'shield_tower' ||
    Boolean(
      item.tipo &&
        ['broquel', 'rodado', 'targe', 'micênico', 'micenico', 'greco', 'heather', 'torre', 'gothic', 'pipa', 'pavise', 'golem', 'dragão', 'dragao'].includes(
          item.tipo.toLowerCase()
        )
    );
  const isArcano = item.categoria.startsWith('arcano_');

  const getNumeroPecas = (): number | string => {
    if (item.pecas) {
      const match = String(item.pecas).match(/\d+/);
      if (match) return match[0];
    }
    const cat = `${item.tipo || ''} ${item.subcategoria || ''} ${item.nome || ''}`.toLowerCase();
    if (cat.includes('pesad')) return 8;
    if (cat.includes('méd') || cat.includes('med')) return 6;
    if (cat.includes('leve')) return 4;
    return 8;
  };

  const rdArmadura =
    item.rd_por_peca ||
    calcularRdPorPeca(item.rd_base || 0, item.tipo || item.subcategoria);

  const camposArcanos = isArcano
    ? [
        { label: 'Peso', value: valorDetalhe(item.peso) === '-' ? '-' : `${valorDetalhe(item.peso)} kg` },
        { label: 'Descrição', value: valorDetalhe(item.descricao || item.informacoes) },
        ...(item.categoria === 'arcano_consumiveis'
          ? [
              { label: 'Alcance', value: valorDetalhe(item.alcance) },
              { label: 'Duração', value: valorDetalhe(item.duracao) },
              { label: 'Efeitos', value: valorDetalhe(item.efeito_completo || item.efeito) },
            ]
          : item.categoria === 'arcano_pocoes'
          ? [
              { label: 'Efeitos', value: valorDetalhe(item.efeito_completo || item.efeito) },
              { label: 'Consequência', value: valorDetalhe(item.consequencia) },
            ]
          : item.categoria === 'arcano_chapeus'
          ? [
              { label: 'Material', value: valorDetalhe(item.material) },
              { label: 'Efeitos', value: valorDetalhe(item.efeito_completo || item.efeito) },
            ]
          : item.categoria === 'arcano_aneis'
          ? [
              { label: 'Ativação', value: valorDetalhe(item.ativacao) },
              { label: 'Gasto', value: valorDetalhe(item.gasto) },
              { label: 'Carga', value: valorDetalhe(item.carga) },
              { label: 'LR', value: valorDetalhe(item.lr) },
              { label: 'Efeitos', value: valorDetalhe(item.efeito_completo || item.efeito) },
            ]
          : item.categoria === 'arcano_cajados'
          ? [
              { label: 'Carga', value: valorDetalhe(item.carga) },
              { label: 'Poder', value: valorDetalhe(item.poder) },
              { label: 'Recarga', value: valorDetalhe(item.recarga) },
              { label: 'Efeitos', value: valorDetalhe(item.efeito_completo || item.efeito) },
            ]
          : item.categoria === 'arcano_vestimentas'
          ? [
              { label: 'RM', value: valorDetalhe(item.rm) },
              { label: 'Gasto', value: valorDetalhe(item.gasto) },
              { label: 'Carga', value: valorDetalhe(item.carga) },
              { label: 'LR', value: valorDetalhe(item.lr) },
              { label: 'Efeitos', value: valorDetalhe(item.efeito_completo || item.efeito) },
            ]
          : item.categoria === 'arcano_colares'
          ? [
              { label: 'Dependência', value: valorDetalhe(item.dependencia) },
              { label: 'Efeitos', value: valorDetalhe(item.efeito_completo || item.efeito) },
            ]
          : [
              { label: 'Uso', value: valorDetalhe(item.uso) },
              { label: 'Efeitos', value: valorDetalhe(item.efeito_completo || item.efeito) },
            ]),
        { label: 'Preço', value: valorDetalhe(item.preco) === '-' ? '-' : `${valorDetalhe(item.preco)} Moedas` },
      ]
    : [];

  const handleIncrement = () => {
    setQuantidade((prev) => prev + 1);
    setErrorMsg(null);
  };

  const handleDecrement = () => {
    setQuantidade((prev) => (prev > 1 ? prev - 1 : 1));
    setErrorMsg(null);
  };

  const handleConfirmar = async () => {
    if (!podeComprar || loading || !onConfirmarCompra) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await onConfirmarCompra(item, quantidade);
      setSuccessMsg(`Adquirido: ${quantidade}x ${item.nome}!`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
        setQuantidade(1);
      }, 900);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao processar compra.');
      setLoading(false);
    }
  };

  const handleExecutarEquipar = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!onEquipar || loading) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await onEquipar(item);
      setSuccessMsg(`Equipado com sucesso: ${item.nome}!`);
      setTimeout(() => {
        setSuccessMsg(null);
        setLoading(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao equipar mercadoria.');
      setLoading(false);
    }
  };

  const handleExecutarDescarte = async () => {
    if (!onDescartar || loading) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await onDescartar(item);
      setSuccessMsg(`Mercadoria descartada: ${item.nome}`);
      setTimeout(() => {
        setSuccessMsg(null);
        setConfirmandoDescarte(false);
        setLoading(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao descartar mercadoria.');
      setLoading(false);
    }
  };

  const handleExecutarConsumir = async () => {
    if (!onConsumir || loading) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await onConsumir(item);
      setSuccessMsg(`Item consumido com sucesso!`);
      setTimeout(() => {
        setSuccessMsg(null);
        setLoading(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao consumir item.');
      setLoading(false);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!onExcluir || !item || excluindo) return;
    setExcluindo(true);
    setErrorMsg(null);
    try {
      await onExcluir(item);
      setSuccessMsg(`Mercadoria "${item.nome}" excluída com sucesso!`);
      setTimeout(() => {
        setSuccessMsg(null);
        setConfirmandoExclusao(false);
        setExcluindo(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao excluir mercadoria.');
      setExcluindo(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      zIndex={origem === 'inventario' ? 'z-[60]' : 'z-50'}
      onClose={() => {
        setConfirmandoExclusao(false);
        setConfirmandoDescarte(false);
        onClose();
      }}
      onBack={origem === 'inventario' ? () => {
        setConfirmandoExclusao(false);
        setConfirmandoDescarte(false);
        onClose();
      } : undefined}
      title={
        <div className="flex items-center gap-2 text-[#e6ddc5]">
          {item.is_epico && <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />}
          <span>{item.nome}</span>
        </div>
      }
      subtitle={
        origem === 'inventario'
          ? (item.is_epico ? 'Item Raro do Arsenal do Personagem' : 'Mercadoria do Inventário do Personagem')
          : (item.is_epico ? 'Item Raro do Arsenal Épico de Angarden' : 'Equipamento do Catálogo Comercial')
      }
      width="max-w-2xl"
    >
      <div id="modal-item-detalhes-compra" className="space-y-5 text-[#dcd1ba]">

        {/* BARRA DE CONTROLE EXCLUSIVA DO ADMINISTRADOR - Apenas no Mercado */}
        {canManageCatalog && origem === 'mercado' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-3 py-2.5 rounded bg-[#160f0a] border border-[#5c3719] shadow-inner">
            <div className="flex items-center justify-between sm:justify-start">
              <span className="px-2.5 py-1 text-[9.5px] font-cinzel font-bold uppercase tracking-widest rounded bg-[#3b190a] border border-[#8a3916] text-amber-200 shrink-0 shadow-sm">
                Painel do Administrador
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 shrink-0">
              <GothicButton
                id="btn-mestre-editar-item"
                onClick={() => onEditar && onEditar(item)}
                variant="primary"
                size="sm"
                height={34}
                width="auto"
                className="flex-1 sm:flex-initial sm:w-[105px]"
                icon={<Edit3 size={12} className="stroke-[2.2]" />}
                textClassName="text-[10px] tracking-wider"
                title="Editar todos os campos desta mercadoria"
              >
                Editar
              </GothicButton>

              <GothicButton
                id="btn-mestre-excluir-item"
                onClick={() => setConfirmandoExclusao(true)}
                variant="danger"
                size="sm"
                height={34}
                width="auto"
                className="flex-1 sm:flex-initial sm:w-[105px]"
                icon={<Trash2 size={12} className="stroke-[2.2]" />}
                textClassName="text-[10px] tracking-wider"
                title="Excluir mercadoria permanentemente"
              >
                Excluir
              </GothicButton>
            </div>
          </div>
        )}

        {/* ALERTA DE CONFIRMAÇÃO DE EXCLUSÃO DO ADMINISTRADOR */}
        {confirmandoExclusao && (
          <div className="p-3 sm:p-3.5 rounded bg-red-950/80 border border-red-700 text-red-200 space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold font-cinzel text-red-200">Excluir Mercadoria Definitivamente?</p>
                <p className="text-stone-300 mt-0.5">
                  A mercadoria <strong className="text-white font-cinzel">"{item.nome}"</strong> será removida permanentemente do catálogo do Mercado. Esta ação não poderá ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <GothicButton
                variant="secondary"
                size="xs"
                height={32}
                width="auto"
                className="flex-1 sm:flex-initial sm:w-[95px]"
                onClick={() => setConfirmandoExclusao(false)}
                disabled={excluindo}
              >
                Cancelar
              </GothicButton>
              <GothicButton
                variant="danger"
                size="xs"
                height={32}
                width="auto"
                className="flex-1 sm:flex-initial sm:w-[150px]"
                onClick={handleConfirmarExclusao}
                disabled={excluindo}
                icon={<Trash2 size={12} />}
              >
                {excluindo ? 'Excluindo...' : 'Confirmar Exclusão'}
              </GothicButton>
            </div>
          </div>
        )}

        {/* ALERTA DE CONFIRMAÇÃO DE DESCARTE (JOGAR FORA DO INVENTÁRIO) */}
        {confirmandoDescarte && (
          <div className="p-3 sm:p-3.5 rounded bg-red-950/90 border border-red-700 text-red-200 space-y-2.5 animate-in fade-in">
            <div className="flex items-start gap-2">
              <Trash2 size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold font-cinzel text-red-200">Descartar Mercadoria da Mochila?</p>
                <p className="text-stone-300 mt-0.5">
                  Deseja jogar fora <strong className="text-white font-cinzel">"{item.nome}"</strong>? O item será removido do inventário. Esta ação não poderá ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <GothicButton
                variant="secondary"
                size="xs"
                height={32}
                width="auto"
                className="flex-1 sm:flex-initial sm:w-[95px]"
                onClick={() => setConfirmandoDescarte(false)}
                disabled={loading}
              >
                Cancelar
              </GothicButton>
              <GothicButton
                id="btn-confirmar-descarte-modal"
                variant="danger"
                size="xs"
                height={32}
                width="auto"
                className="flex-1 sm:flex-initial sm:w-[160px]"
                onClick={handleExecutarDescarte}
                disabled={loading}
                icon={<Trash2 size={12} />}
              >
                {loading ? 'Descartando...' : 'Confirmar Descarte'}
              </GothicButton>
            </div>
          </div>
        )}

        {/* Topo do Item: Imagem e Resumo Principal */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 p-3.5 sm:p-4 rounded bg-[#100d0a] border border-[#3d2a1c]">
          {/* Imagem do Item com Moldura Ornamental */}
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-xs flex items-center justify-center relative flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #3a4550 0%, #20272f 50%, #11151a 100%)',
              border: '2px solid #526373',
              boxShadow: '0 4px 12px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.2)',
              padding: '3px',
            }}
          >
            <div
              className="relative w-full h-full rounded-xs overflow-hidden flex items-center justify-center"
              style={{
                border: '1px solid #8c6b41',
                boxShadow: 'inset 0 0 8px rgba(0,0,0,0.9)',
                background: 'radial-gradient(circle at center, #232c35 0%, #0d1115 100%)',
              }}
            >
              <ItemIconVisual type={item.icone_tipo} imageUrl={item.imagem_url} className="w-full h-full object-cover" />
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_6px_rgba(0,0,0,0.7)]" />
              {/* Cantoneiras douradas góticas */}
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#f2dfa8]/80 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#f2dfa8]/80 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#f2dfa8]/80 pointer-events-none" />
            </div>
            {item.is_epico && (
              <span className="absolute -top-2 -right-2 bg-amber-900 border border-amber-500 text-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow z-30">
                Épico
              </span>
            )}
          </div>

          {/* Nome, Preço Unitário e Descrição */}
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2">
              <h3 className="text-lg font-bold font-cinzel text-[#f3ebd3] tracking-wide">
                {item.nome}
              </h3>
              <div className="flex items-center gap-1.5 bg-[#1f1610] px-3 py-1 rounded border border-[#5a3f25] text-[#e6ddc5] font-mono font-bold text-sm">
                <Coins size={15} className="text-[#c5a059]" />
                <span>{item.preco} Moedas</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {!isArcano && (item.tipo || item.subcategoria) && (
                <span className="px-2 py-0.5 rounded bg-[#241a12] border border-[#5a4225] text-[#e6ddc5] font-cinzel text-[11px]">
                  {item.tipo || item.subcategoria}
                </span>
              )}
              {(!isArcano || item.categoria === 'arcano_chapeus') && item.material && (
                <p className="text-xs text-[#a88d61] italic font-serif">
                  Material: <span className="text-[#dcd1ba] font-sans">{item.material}</span>
                </p>
              )}
            </div>

            {(item.citacao || item.informacoes) && (
              <p className="text-xs text-stone-300 font-serif leading-relaxed italic bg-[#0d0a07] border border-[#2d1e13] p-2 rounded">
                "{item.citacao || item.informacoes}"
              </p>
            )}
            {!(item.citacao || item.informacoes) && item.descricao && (
              <p className="text-xs text-stone-400 font-serif leading-relaxed">
                "{item.descricao}"
              </p>
            )}
          </div>
        </div>

        {/* Grade de Atributos Técnicos com Nomes Padronizados e Alinhamento Coeso */}
        <div className="space-y-2.5">
          <h4 className="text-xs uppercase tracking-widest text-[#a88d61] font-cinzel font-semibold flex items-center gap-1.5">
            {isArcano ? (
              <Sparkles size={14} className="text-[#a88d61]" />
            ) : isEscudo || isArmadura || item.categoria === 'mercado_escudos' ? (
              <Shield size={14} className="text-[#a88d61]" />
            ) : item.categoria === 'mercado_ld' || item.tensao !== undefined ? (
              <Crosshair size={14} className="text-[#a88d61]" />
            ) : (
              <Swords size={14} className="text-[#a88d61]" />
            )}
            Atributos Técnicos do Equipamento {isArcano ? '(Mercado Arcano)' : isEscudo ? '(Escudo)' : isArmadura ? '(Armadura)' : ''}
          </h4>

          {isArcano ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {camposArcanos.map((campo) => (
                <div key={campo.label} className="bg-[#120d09]/90 border border-[#3d2a1c] p-2.5 rounded flex flex-col justify-center min-h-[58px]">
                  <span className="text-[#a88d61] block text-[10.5px] uppercase font-cinzel tracking-wider font-semibold">
                    {campo.label}
                  </span>
                  <span className="text-[#e6ddc5] font-serif text-xs whitespace-pre-wrap break-words">
                    {campo.value}
                  </span>
                </div>
              ))}
            </div>
          ) : isEscudo ? (
            /* ATRIBUTOS EXCLUSIVOS DE ESCUDOS: Tipo | Peso | RD | Material | Preço */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {/* 1. Tipo (Subcategoria) */}
              <div className="bg-[#120d09]/90 border border-[#3d2a1c] p-2.5 rounded flex flex-col justify-center min-h-[58px]">
                <span className="text-[#a88d61] block text-[10.5px] uppercase font-cinzel tracking-wider font-semibold">
                  Tipo
                </span>
                <span className="text-[#e6ddc5] font-cinzel font-semibold text-xs truncate block" title={item.tipo || item.subcategoria || 'Escudo'}>
                  {item.tipo || item.subcategoria || 'Escudo'}
                </span>
              </div>

              {/* 2. Peso */}
              <div className="bg-[#120d09]/90 border border-[#3d2a1c] p-2.5 rounded flex flex-col justify-center min-h-[58px]">
                <span className="text-[#a88d61] block text-[10.5px] uppercase font-cinzel tracking-wider font-semibold">
                  Peso
                </span>
                <span className="text-[#e6ddc5] font-mono font-bold text-sm">
                  {item.peso} kg
                </span>
              </div>

              {/* 3. RD (Redução de Dano) */}
              <div className="bg-[#120d09]/90 border border-[#3d2a1c] p-2.5 rounded flex flex-col justify-center min-h-[58px]">
                <span className="text-[#a88d61] block text-[10.5px] uppercase font-cinzel tracking-wider font-semibold">
                  RD
                </span>
                <span className="font-mono font-bold text-sm text-[#e6ddc5]">
                  {item.rd_base !== undefined ? (item.rd_base > 0 ? `+${item.rd_base}` : `${item.rd_base}`) : '—'}
                </span>
              </div>

              {/* 4. Material */}
              <div className="bg-[#120d09]/90 border border-[#3d2a1c] p-2.5 rounded flex flex-col justify-center min-h-[58px]">
                <span className="text-[#a88d61] block text-[10.5px] uppercase font-cinzel tracking-wider font-semibold">
                  Material
                </span>
                <span className="text-[#e6ddc5] font-cinzel font-semibold text-xs truncate block" title={item.material || 'Comum'}>
                  {item.material || 'Comum'}
                </span>
              </div>

              {/* 5. Preço */}
              <div className="bg-[#120d09]/90 border border-[#3d2a1c] p-2.5 rounded flex flex-col justify-center min-h-[58px]">
                <span className="text-[#a88d61] block text-[10.5px] uppercase font-cinzel tracking-wider font-semibold">
                  Preço
                </span>
                <span className="text-[#e6ddc5] font-mono font-bold text-sm">
                  {item.preco} Moedas
                </span>
              </div>
            </div>
          ) : (
            /* Grid Simétrica 3x2 para outras categorias (Armas, Armaduras, Longa Distância) */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {/* 1. Tensão (para Longa Distância) / RD (para armaduras) / Dano (para armas corpo a corpo) */}
              <div className="bg-[#120d09]/90 border border-[#3d2a1c] p-2.5 rounded flex flex-col justify-center min-h-[58px]">
                <span className="text-[#a88d61] block text-[10.5px] uppercase font-cinzel tracking-wider font-semibold">
                  {isArmadura
                    ? 'RD'
                    : item.categoria === 'mercado_ld' || item.tensao !== undefined
                    ? 'Tensão'
                    : 'Dano'}
                </span>
                <span className="font-mono font-bold text-sm text-[#e6ddc5]">
                  {isArmadura
                    ? (item.rd_base !== undefined ? (item.rd_base > 0 ? `+${item.rd_base}` : `${item.rd_base}`) : '—')
                    : item.categoria === 'mercado_ld' || item.tensao !== undefined
                    ? (item.tensao !== undefined && item.tensao !== '' ? `${item.tensao}` : item.dano || '—')
                    : (item.dano !== undefined && item.dano !== ''
                        ? (item.prec !== undefined ? `${item.dano} (Prec ${item.prec})` : item.dano)
                        : '—')}
                </span>
              </div>

              {/* 2. Precisão (para Longa Distância) / Resistência (para armas/armaduras) */}
              <div className="bg-[#120d09]/90 border border-[#3d2a1c] p-2.5 rounded flex flex-col justify-center min-h-[58px]">
                <span className="text-[#a88d61] block text-[10.5px] uppercase font-cinzel tracking-wider font-semibold">
                  {item.categoria === 'mercado_ld' || item.prec !== undefined ? 'Precisão' : 'Resistencia'}
                </span>
                <span className="text-[#e6ddc5] font-mono font-bold text-sm">
                  {item.categoria === 'mercado_ld' || item.prec !== undefined
                    ? (item.prec !== undefined ? `${item.prec}` : '—')
                    : (item.resist !== undefined ? item.resist : '—')}
                </span>
              </div>

              {/* 3. Tipo */}
              <div className="bg-[#120d09]/90 border border-[#3d2a1c] p-2.5 rounded flex flex-col justify-center min-h-[58px]">
                <span className="text-[#a88d61] block text-[10.5px] uppercase font-cinzel tracking-wider font-semibold">
                  Tipo
                </span>
                <span className="text-[#e6ddc5] font-cinzel font-semibold text-xs truncate block" title={item.tipo || item.subcategoria || ''}>
                  {item.tipo || item.subcategoria || (item.categoria === 'mercado_ld' ? 'Longa Distância' : '—')}
                </span>
              </div>

              {/* 4. Peso */}
              <div className="bg-[#120d09]/90 border border-[#3d2a1c] p-2.5 rounded flex flex-col justify-center min-h-[58px]">
                <span className="text-[#a88d61] block text-[10.5px] uppercase font-cinzel tracking-wider font-semibold">
                  Peso
                </span>
                <span className="text-[#e6ddc5] font-mono font-bold text-sm">
                  {item.peso} kg
                </span>
              </div>

              {/* 5. Preço */}
              <div className="bg-[#120d09]/90 border border-[#3d2a1c] p-2.5 rounded flex flex-col justify-center min-h-[58px]">
                <span className="text-[#a88d61] block text-[10.5px] uppercase font-cinzel tracking-wider font-semibold">
                  Preço
                </span>
                <span className="text-[#e6ddc5] font-mono font-bold text-sm">
                  {item.preco} Moedas
                </span>
              </div>

              {/* 6. Material */}
              <div className="bg-[#120d09]/90 border border-[#3d2a1c] p-2.5 rounded flex flex-col justify-center min-h-[58px]">
                <span className="text-[#a88d61] block text-[10.5px] uppercase font-cinzel tracking-wider font-semibold">
                  Material
                </span>
                <span className="text-[#e6ddc5] font-cinzel font-semibold text-xs truncate block" title={item.material || 'Comum'}>
                  {item.material || 'Comum'}
                </span>
              </div>
            </div>
          )}

          {/* Grade de 8 Peças de RD para Armaduras */}
          {!isArcano && isArmadura && (
            <div className="bg-[#100d0a] border border-[#3d2a1c] p-3 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-cinzel tracking-wider text-[#c5a059] font-bold flex items-center gap-1.5">
                  <Shield size={13} className="text-[#c5a059]" />
                  Redução de Dano (RD) por Peça
                </span>
                <span className="text-[9.5px] text-stone-400 font-sans italic">
                  {getNumeroPecas()} peças protegidas
                </span>
              </div>
              <GradeRdPecasArmadura rdPorPeca={rdArmadura} />
            </div>
          )}

          {/* Efeitos */}
          {!isArcano && (item.efeito_completo || item.efeito) && (
            <div className="bg-[#140e0a] border border-[#4a311d] p-3 rounded text-xs space-y-1.5">
              <span className="text-[#c5a059] font-cinzel font-bold uppercase tracking-wider text-[10.5px] flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#c5a059]" />
                Efeitos
              </span>
              <p className="text-[#dcd1ba] font-serif leading-relaxed text-xs">
                {item.efeito_completo || item.efeito}
              </p>
            </div>
          )}
        </div>

        {/* Modo Inventário vs Modo Mercado */}
        {origem === 'inventario' ? (
          <div className="p-3.5 sm:p-4 rounded bg-[#100d0a] border border-[#3d2a1c] space-y-3.5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-[#c5a059]" />
                <span className="text-[#a88d61] font-cinzel uppercase tracking-wider font-semibold">Na Mochila:</span>
                <span className="font-mono font-bold text-[#e6ddc5] text-sm bg-[#1b120c] px-2 py-0.5 rounded border border-[#4a3220]">
                  {(item as any).quantidade !== undefined ? `${(item as any).quantidade} un.` : '1 un.'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-serif text-[#a88d61]">
                <span className="flex items-center gap-1.5">
                  <Weight size={14} className="text-[#c5a059]" />
                  Peso unitário: <strong className="text-[#e6ddc5] font-mono">{item.peso} kg</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Coins size={14} className="text-[#c5a059]" />
                  Cotação: <strong className="text-[#e6ddc5] font-mono">{item.preco} Moedas</strong>
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Seletor de Quantidade e Resumo Financeiro (Mercado) */
          <div className="p-3.5 sm:p-4 rounded bg-[#100d0a] border border-[#3d2a1c] space-y-3.5 sm:space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 sm:gap-4">
              
              {/* Seletor de Quantidade */}
              <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3">
                <span className="text-xs uppercase tracking-wider text-[#a88d61] font-cinzel font-semibold">Quantidade:</span>
                <div className="flex items-center bg-[#0a0705] border border-[#4a3322] rounded overflow-hidden">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={quantidade <= 1}
                    className="px-3.5 py-1.5 sm:px-3 sm:py-1.5 text-[#c5a059] hover:bg-[#21150d] hover:text-[#f3ebd3] disabled:opacity-30 disabled:hover:bg-transparent font-bold text-base transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 font-mono font-bold text-[#e6ddc5] text-sm min-w-[40px] text-center">
                    {quantidade}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    className="px-3.5 py-1.5 sm:px-3 sm:py-1.5 text-[#c5a059] hover:bg-[#21150d] hover:text-[#f3ebd3] font-bold text-base transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Resumo Financeiro: Saldo Atual vs. Custo Total */}
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-6 text-xs pt-2 sm:pt-0 border-t border-[#26170e] sm:border-t-0">
                <div className="text-left sm:text-right">
                  <span className="text-[#a88d61] block text-[10px] uppercase font-cinzel tracking-wider">
                    {nomePersonagemComprador ? `Bolsa (${nomePersonagemComprador})` : 'Saldo Atual'}
                  </span>
                  <span className="text-[#e6ddc5] font-mono font-bold text-sm flex items-center justify-start sm:justify-end gap-1.5">
                    <Coins size={14} className="text-[#c5a059]" />
                    {saldoAtual}
                  </span>
                </div>

                <div className="h-8 w-px bg-[#2d1e13]" />

                <div className="text-right">
                  <span className="text-[#a88d61] block text-[10px] uppercase font-cinzel tracking-wider">Custo Total</span>
                  <span className={`font-mono font-bold text-base flex items-center justify-end gap-1.5 ${
                    saldoSuficiente ? 'text-[#e6ddc5]' : 'text-rose-400'
                  }`}>
                    <Coins size={15} className={saldoSuficiente ? 'text-[#c5a059]' : 'text-rose-400'} />
                    {custoTotal} Moedas
                  </span>
                </div>
              </div>
            </div>

            {/* Informação sobre Destino e Peso */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-xs pt-2.5 border-t border-[#26170e] text-[#a88d61] font-serif">
              <span className="flex items-center gap-1.5">
                <Weight size={14} className="text-[#a88d61] shrink-0" />
                Peso do item: <strong className="text-[#e6ddc5] font-mono">{pesoTotalAcrescentado} kg</strong>
              </span>
              <span className="pl-5 sm:pl-0 text-stone-400 text-[11px]">
                Item vai para o inventário (só afeta a carga se for equipado)
              </span>
            </div>
          </div>
        )}

        {/* Mensagens de Alerta ou Sucesso */}
        {origem === 'mercado' && bloqueadoPorEpico && (
          <div className="flex items-center gap-2 p-3 rounded bg-red-950/40 border border-red-800/80 text-red-300 text-xs">
            <Lock size={16} className="flex-shrink-0 text-red-400" />
            <span>Este item pertence ao Arsenal Épico. Apenas personagens autorizados pelo Mestre podem adquiri-lo.</span>
          </div>
        )}

        {origem === 'mercado' && !saldoSuficiente && !bloqueadoPorEpico && (
          <div className="flex items-center gap-2 p-3 rounded bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs">
            <AlertCircle size={16} className="flex-shrink-0 text-amber-400" />
            <span>Saldo insuficiente na bolsa do personagem para completar a transação.</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded bg-red-950/40 border border-red-800 text-red-300 text-xs">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded bg-emerald-950/40 border border-emerald-700 text-emerald-300 text-xs">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Rodapé de Ações Contextuais: Inventário vs Mercado */}
        {origem === 'inventario' ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-3 border-t border-[#3d2a1c]">
            {/* Botão Descartar (Esquerda / Rubi) */}
            <GothicButton
              id="btn-descartar-item-inventario"
              variant="danger"
              size="sm"
              height={36}
              width="auto"
              className="w-full sm:w-auto"
              onClick={() => setConfirmandoDescarte(true)}
              disabled={loading || confirmandoDescarte}
              icon={<Trash2 size={13} />}
            >
              Descartar
            </GothicButton>

            {/* Ações Direitas: Voltar e Equipar/Consumir */}
            <div className="flex items-center justify-end gap-2.5">
              <GothicButton
                variant="secondary"
                size="sm"
                height={36}
                width="auto"
                className="flex-1 sm:flex-initial"
                onClick={(e?: React.MouseEvent) => {
                  e?.stopPropagation();
                  onClose();
                }}
                disabled={loading}
              >
                Voltar
              </GothicButton>

              {slotsEquip.tipo === 'consumivel' ? (
                <GothicButton
                  id="btn-consumir-item-inventario"
                  variant="primary"
                  size="sm"
                  height={36}
                  width="auto"
                  className="flex-1 sm:flex-initial"
                  onClick={handleExecutarConsumir}
                  disabled={loading}
                  icon={<Sparkles size={13} />}
                >
                  {loading ? 'Consumindo...' : 'Consumir / Usar'}
                </GothicButton>
              ) : slotsEquip.slotsDisponiveis.length > 0 ? (
                <GothicButton
                  id="btn-equipar-item-inventario"
                  variant="primary"
                  size="sm"
                  height={36}
                  width={150}
                  className="flex-1 sm:flex-initial"
                  onClick={handleExecutarEquipar}
                  disabled={loading}
                  icon={<Shield size={13} />}
                >
                  {loading ? 'Equipando...' : 'Equipar'}
                </GothicButton>
              ) : null}
            </div>
          </div>
        ) : (
          /* Rodapé do Mercado */
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-[#3d2a1c]">
            <GothicButton
              variant="secondary"
              size="sm"
              width="auto"
              className="w-full sm:w-auto order-2 sm:order-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </GothicButton>

            <GothicButton
              variant="primary"
              size="md"
              width={245}
              className="w-full sm:w-auto order-1 sm:order-2"
              onClick={handleConfirmar}
              disabled={!podeComprar || loading}
              icon={loading ? <Sparkles className="animate-spin" size={15} /> : <Coins size={15} />}
            >
              {loading ? 'Processando...' : 'Confirmar Compra'}
            </GothicButton>
          </div>
        )}

      </div>
    </Modal>
  );
};
