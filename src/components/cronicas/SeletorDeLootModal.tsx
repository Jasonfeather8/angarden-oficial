import React, { useEffect, useState } from 'react';
import { Check, PackagePlus, Search } from 'lucide-react';
import { cronicaService } from '@/services/cronicaService';
import { mercadoService } from '@/services/mercadoService';
import type { ObjetivoDaCronica } from '@/types';
import { GothicButton } from '../GothicButton';
import { Modal } from '../Modal';

const TAMANHO_DA_PAGINA = 10;
const inputClassName =
  'mt-1 w-full border border-[#4b3823] bg-[#0d0906] px-3 py-2 text-sm text-[#e6ddc5] outline-none focus:border-[#b89558]';

interface ItemEscolhido {
  id: string;
  nome: string;
  quantidade: string;
}

export interface SeletorDeLootModalProps {
  isOpen: boolean;
  onClose: () => void;
  cronicaId: string;
  objetivos: ObjetivoDaCronica[];
  /** Mercadorias já vinculadas à crônica, para não repetir. */
  jaVinculadas: string[];
  onDone: () => void;
}

/**
 * Seletor de loot: busca paginada no Mercado e vincula as mercadorias
 * escolhidas à crônica como recompensas do tipo item.
 */
export const SeletorDeLootModal: React.FC<SeletorDeLootModalProps> = ({
  isOpen,
  onClose,
  cronicaId,
  objetivos,
  jaVinculadas,
  onDone,
}) => {
  const [termo, setTermo] = useState('');
  const [pagina, setPagina] = useState(1);
  const [opcoes, setOpcoes] = useState<Array<{ id: string; nome: string; detalhe?: string }>>([]);
  const [total, setTotal] = useState(0);
  const [buscando, setBuscando] = useState(false);
  const [objetivoId, setObjetivoId] = useState('');
  const [escolhidos, setEscolhidos] = useState<ItemEscolhido[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) return;
    setTermo('');
    setPagina(1);
    setOpcoes([]);
    setTotal(0);
    setObjetivoId('');
    setEscolhidos([]);
    setErro('');
  }, [isOpen]);

  useEffect(() => {
    setOpcoes([]);
    setPagina(1);
  }, [termo]);

  useEffect(() => {
    if (!isOpen || termo.trim().length < 3) {
      setOpcoes([]);
      setTotal(0);
      return;
    }
    let ativo = true;
    setBuscando(true);
    const buscar = async () => {
      try {
        const resultado = await mercadoService.buscarItens({ busca: termo, page: pagina, pageSize: TAMANHO_DA_PAGINA });
        if (!ativo) return;
        setTotal(resultado.total);
        setOpcoes((atuais) => [
          ...atuais,
          ...resultado.itens.map((item) => ({ id: item.id, nome: item.nome, detalhe: item.categoria })),
        ]);
      } catch (cause) {
        if (ativo) setErro(cause instanceof Error ? cause.message : 'Não foi possível buscar no Mercado.');
      } finally {
        if (ativo) setBuscando(false);
      }
    };
    void buscar();
    return () => {
      ativo = false;
    };
  }, [isOpen, termo, pagina]);

  const alternar = (opcao: { id: string; nome: string }) => {
    setEscolhidos((atuais) =>
      atuais.some((item) => item.id === opcao.id)
        ? atuais.filter((item) => item.id !== opcao.id)
        : [...atuais, { id: opcao.id, nome: opcao.nome, quantidade: '1' }],
    );
  };

  const definirQuantidade = (id: string, quantidade: string) => {
    setEscolhidos((atuais) => atuais.map((item) => (item.id === id ? { ...item, quantidade } : item)));
  };

  const vincular = async () => {
    setEnviando(true);
    setErro('');
    try {
      for (const item of escolhidos) {
        await cronicaService.criarRecompensa(cronicaId, {
          tipo: 'item',
          valor: 0,
          quantidade: Math.max(1, Number(item.quantidade) || 1),
          descricao: item.nome,
          objetivoId: objetivoId || undefined,
          itemId: item.id,
        });
      }
      onDone();
      onClose();
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível vincular as mercadorias.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vincular mercadorias"
      subtitle="Escolha o loot do Mercado que pertence a esta crônica"
      maxWidth="max-w-[640px]"
    >
      <label className="block font-cinzel text-[10px] uppercase tracking-wider text-[#c9aa68]">
        Liberada ao concluir
        <select value={objetivoId} onChange={(event) => setObjetivoId(event.target.value)} className={inputClassName}>
          <option value="">Conclusão da crônica</option>
          {objetivos.map((objetivo) => (
            <option key={objetivo.id} value={objetivo.id}>{objetivo.titulo}</option>
          ))}
        </select>
      </label>

      <label className="block font-cinzel text-[10px] uppercase tracking-wider text-[#c9aa68]">
        Buscar no Mercado
        <span className="mt-1 flex items-center gap-2 border border-[#4b3823] bg-[#0d0906] px-3 py-2">
          <Search aria-hidden="true" className="h-4 w-4 text-[#8c6b41]" />
          <input
            value={termo}
            onChange={(event) => setTermo(event.target.value)}
            placeholder="Nome da mercadoria (3 letras ou mais)"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#e6ddc5] outline-none placeholder:text-[#6f5c47]"
          />
        </span>
      </label>

      {termo.trim().length < 3 ? (
        <p className="font-serif text-xs italic text-[#8f795e]">Digite ao menos 3 letras para buscar no Mercado.</p>
      ) : (
        <>
          <ul className="max-h-56 overflow-y-auto border border-[#3a2c1d]">
            {opcoes.map((opcao) => {
              const escolhido = escolhidos.find((item) => item.id === opcao.id);
              const jaVinculada = jaVinculadas.includes(opcao.id);
              return (
                <li key={opcao.id} className="border-b border-[#241a11] last:border-b-0">
                  <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <label className="flex min-w-0 flex-1 items-center gap-2 font-serif text-sm text-[#c4b9a3]">
                      <input
                        type="checkbox"
                        disabled={jaVinculada}
                        checked={Boolean(escolhido)}
                        onChange={() => alternar(opcao)}
                        className="accent-[#b89558]"
                      />
                      <span className="min-w-0">
                        {opcao.nome}
                        {opcao.detalhe ? <span className="text-[#8f795e]"> — {opcao.detalhe}</span> : null}
                        {jaVinculada ? <span className="text-[#8f795e]"> (já vinculada)</span> : null}
                      </span>
                    </label>
                    {escolhido && (
                      <label className="flex items-center gap-1.5 font-serif text-xs text-[#a88d61]">
                        Qtd.
                        <input
                          type="number"
                          min="1"
                          value={escolhido.quantidade}
                          onChange={(event) => definirQuantidade(opcao.id, event.target.value)}
                          aria-label={`Quantidade de ${opcao.nome}`}
                          className="w-16 border border-[#4b3823] bg-[#0d0906] px-2 py-1 text-sm text-[#e6ddc5] outline-none focus:border-[#b89558]"
                        />
                      </label>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {buscando && <p className="font-serif text-xs text-[#a88d61]">Buscando…</p>}
          {!buscando && opcoes.length === 0 && (
            <p className="font-serif text-xs italic text-[#8f795e]">Nenhuma mercadoria encontrada.</p>
          )}
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

      {escolhidos.length > 0 && (
        <p className="flex items-center gap-2 border border-[#5a4225] bg-[#1b120b] px-3 py-2 font-serif text-xs text-[#c6a66d]">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          {escolhidos.length} {escolhidos.length === 1 ? 'mercadoria escolhida' : 'mercadorias escolhidas'}
        </p>
      )}

      {erro && <p role="alert" className="font-serif text-sm text-red-300">{erro}</p>}

      <div className="flex justify-end border-t border-[#3a2c1d] pt-4">
        <GothicButton
          size="sm"
          width={220}
          height={38}
          disabled={escolhidos.length === 0 || enviando}
          onClick={() => void vincular()}
          icon={<PackagePlus className="h-4 w-4" />}
        >
          {enviando ? 'Vinculando…' : 'Vincular mercadorias'}
        </GothicButton>
      </div>
    </Modal>
  );
};

export default SeletorDeLootModal;
