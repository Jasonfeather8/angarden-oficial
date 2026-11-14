import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { buscarMagias } from '@/services/grimorioService';
import { mercadoService } from '@/services/mercadoService';
import type {
  NovaRecompensaCronica,
  ObjetivoDaCronica,
  RecompensaDaCronica,
  TipoRecompensaCronica,
} from '@/types';
import { GothicButton } from '../GothicButton';
import { Modal } from '../Modal';

const TAMANHO_DA_PAGINA = 10;
const inputClassName =
  'mt-1 w-full border border-[#4b3823] bg-[#0d0906] px-3 py-2 text-sm text-[#e6ddc5] outline-none focus:border-[#b89558]';

const ROTULOS: Record<TipoRecompensaCronica, string> = {
  dinheiro: 'Dinheiro',
  xp: 'XP',
  magia: 'Magia',
  item: 'Mercadoria',
};

interface OpcaoDeCatalogo {
  id: string;
  nome: string;
  detalhe?: string;
}

export interface RecompensaDaCronicaModalProps {
  isOpen: boolean;
  /** Recompensa em edição; ausente quando é uma recompensa nova. */
  recompensa?: RecompensaDaCronica;
  objetivos: ObjetivoDaCronica[];
  onClose: () => void;
  onSave: (dados: NovaRecompensaCronica) => Promise<void>;
}

/**
 * Recompensa vinculada a um objetivo (ou à conclusão da crônica). Dinheiro, XP
 * e quantidade usam o campo de valor; magia e mercadoria são escolhidas no
 * catálogo por busca no servidor.
 */
export const RecompensaDaCronicaModal: React.FC<RecompensaDaCronicaModalProps> = ({
  isOpen,
  recompensa,
  objetivos,
  onClose,
  onSave,
}) => {
  const [tipo, setTipo] = useState<TipoRecompensaCronica>('dinheiro');
  const [valor, setValor] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [descricao, setDescricao] = useState('');
  const [objetivoId, setObjetivoId] = useState('');
  const [termo, setTermo] = useState('');
  const [escolhidoId, setEscolhidoId] = useState('');
  const [opcoes, setOpcoes] = useState<OpcaoDeCatalogo[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [buscando, setBuscando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setTipo(recompensa?.tipo ?? 'dinheiro');
    setValor(recompensa ? String(recompensa.valor) : '');
    setQuantidade(recompensa ? String(recompensa.quantidade) : '1');
    setDescricao(recompensa?.descricao ?? '');
    setObjetivoId(recompensa?.objetivoId ?? '');
    setEscolhidoId(recompensa?.itemId ?? recompensa?.spellId ?? '');
    setTermo(recompensa?.itemNome ?? recompensa?.spellNome ?? '');
    setOpcoes([]);
    setPagina(1);
    setErro('');
  }, [recompensa, isOpen]);

  useEffect(() => {
    setOpcoes([]);
    setPagina(1);
  }, [termo, tipo]);

  const buscaNoCatalogo = tipo === 'item' || tipo === 'magia';

  useEffect(() => {
    if (!isOpen || !buscaNoCatalogo || termo.trim().length < 3) {
      setOpcoes([]);
      setTotal(0);
      return;
    }
    let ativo = true;
    setBuscando(true);
    const buscar = async () => {
      try {
        if (tipo === 'item') {
          const resultado = await mercadoService.buscarItens({ busca: termo, page: pagina, pageSize: TAMANHO_DA_PAGINA });
          if (!ativo) return;
          setTotal(resultado.total);
          setOpcoes((atuais) => [
            ...atuais,
            ...resultado.itens.map((item) => ({ id: item.id, nome: item.nome, detalhe: item.categoria })),
          ]);
        } else {
          const resultado = await buscarMagias(termo, { page: pagina, pageSize: TAMANHO_DA_PAGINA });
          if (!ativo) return;
          setTotal(resultado.total);
          setOpcoes((atuais) => [...atuais, ...resultado.magias.map((magia) => ({ id: magia.id, nome: magia.name }))]);
        }
      } catch (cause) {
        if (ativo) setErro(cause instanceof Error ? cause.message : 'Não foi possível buscar no catálogo.');
      } finally {
        if (ativo) setBuscando(false);
      }
    };
    void buscar();
    return () => {
      ativo = false;
    };
  }, [isOpen, buscaNoCatalogo, termo, tipo, pagina]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      await onSave({
        tipo,
        // Mercadoria usa `quantidade`; dinheiro e XP usam `valor`.
        valor: tipo === 'item' ? 0 : Number(valor) || 0,
        quantidade: tipo === 'item' ? Math.max(1, Number(quantidade) || 1) : 1,
        descricao: descricao.trim(),
        objetivoId: objetivoId || undefined,
        itemId: tipo === 'item' ? escolhidoId : undefined,
        spellId: tipo === 'magia' ? escolhidoId : undefined,
      });
      onClose();
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível salvar a recompensa.');
    } finally {
      setSalvando(false);
    }
  };

  const precisaDeValor = tipo === 'dinheiro' || tipo === 'xp' || tipo === 'item';
  const faltaEscolha = buscaNoCatalogo && !escolhidoId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={recompensa ? 'Editar recompensa' : 'Nova recompensa'}
      subtitle="Vincule a recompensa a um objetivo ou à conclusão da crônica"
      maxWidth="max-w-[640px]"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block font-cinzel text-[10px] uppercase tracking-wider text-[#c9aa68]">
            Tipo
            <select
              value={tipo}
              onChange={(event) => {
                setTipo(event.target.value as TipoRecompensaCronica);
                setEscolhidoId('');
                setTermo('');
              }}
              className={inputClassName}
            >
              {(Object.keys(ROTULOS) as TipoRecompensaCronica[]).map((chave) => (
                <option key={chave} value={chave}>{ROTULOS[chave]}</option>
              ))}
            </select>
          </label>
          <label className="block font-cinzel text-[10px] uppercase tracking-wider text-[#c9aa68]">
            Liberada ao concluir
            <select value={objetivoId} onChange={(event) => setObjetivoId(event.target.value)} className={inputClassName}>
              <option value="">Conclusão da crônica</option>
              {objetivos.map((objetivo) => (
                <option key={objetivo.id} value={objetivo.id}>{objetivo.titulo}</option>
              ))}
            </select>
          </label>
        </div>

        {tipo === 'item' ? (
          <label className="block font-cinzel text-[10px] uppercase tracking-wider text-[#c9aa68]">
            Quantidade
            <input
              required
              type="number"
              min="1"
              value={quantidade}
              onChange={(event) => setQuantidade(event.target.value)}
              className={inputClassName}
            />
          </label>
        ) : precisaDeValor ? (
          <label className="block font-cinzel text-[10px] uppercase tracking-wider text-[#c9aa68]">
            {tipo === 'xp' ? 'Pontos de experiência' : 'Moedas'}
            <input
              required
              type="number"
              min="0"
              value={valor}
              onChange={(event) => setValor(event.target.value)}
              className={inputClassName}
            />
          </label>
        ) : null}

        {buscaNoCatalogo && (
          <div className="space-y-2">
            <label className="block font-cinzel text-[10px] uppercase tracking-wider text-[#c9aa68]">
              {tipo === 'item' ? 'Mercadoria' : 'Magia'}
              <span className="mt-1 flex items-center gap-2 border border-[#4b3823] bg-[#0d0906] px-3 py-2">
                <Search aria-hidden="true" className="h-4 w-4 text-[#8c6b41]" />
                <input
                  value={termo}
                  onChange={(event) => setTermo(event.target.value)}
                  placeholder="Buscar por nome (3 letras ou mais)"
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#e6ddc5] outline-none placeholder:text-[#6f5c47]"
                />
              </span>
            </label>
            {termo.trim().length < 3 ? (
              <p className="font-serif text-xs italic text-[#8f795e]">Digite ao menos 3 letras para buscar.</p>
            ) : (
              <>
                <ul className="max-h-40 overflow-y-auto border border-[#3a2c1d]">
                  {opcoes.map((opcao) => (
                    <li key={opcao.id}>
                      <button
                        type="button"
                        aria-pressed={escolhidoId === opcao.id}
                        onClick={() => {
                          setEscolhidoId(opcao.id);
                          setTermo(opcao.nome);
                        }}
                        className={`w-full px-3 py-2 text-left font-serif text-sm transition-colors ${
                          escolhidoId === opcao.id ? 'bg-[#2a1d10] text-[#f0d79b]' : 'text-[#c4b9a3] hover:bg-[#1b120b]'
                        }`}
                      >
                        {opcao.nome}
                        {opcao.detalhe ? <span className="text-[#8f795e]"> — {opcao.detalhe}</span> : null}
                      </button>
                    </li>
                  ))}
                </ul>
                {buscando && <p className="font-serif text-xs text-[#a88d61]">Buscando…</p>}
                {opcoes.length < total && !buscando && (
                  <button
                    type="button"
                    onClick={() => setPagina((atual) => atual + 1)}
                    className="border border-[#4b3823] px-3 py-1 font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d] hover:border-[#a88d61]"
                  >
                    Carregar mais
                  </button>
                )}
              </>
            )}
          </div>
        )}

        <label className="block font-cinzel text-[10px] uppercase tracking-wider text-[#c9aa68]">
          Descrição
          <input
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            placeholder="O que a mesa recebe"
            className={inputClassName}
          />
        </label>

        {erro && <p role="alert" className="font-serif text-sm text-red-300">{erro}</p>}

        <div className="flex justify-end border-t border-[#3a2c1d] pt-4">
          <GothicButton type="submit" size="sm" width={200} height={38} disabled={salvando || faltaEscolha}>
            {salvando ? 'Salvando…' : 'Salvar recompensa'}
          </GothicButton>
        </div>
      </form>
    </Modal>
  );
};

export default RecompensaDaCronicaModal;
