import React, { useEffect, useMemo, useState } from 'react';
import { Coins, Minus, Plus } from 'lucide-react';
import { Modal } from './Modal';
import { GothicButton } from './GothicButton';
import { fichaService } from '../services/fichaService';

type Operacao = 'add' | 'remove';
type Modo = 'dividir' | 'igual' | 'individual';
type AventureiroTesouro = { id: string; nome: string; dinheiro: number };
type EntradaTesouro = { characterId: string; delta: number };

export interface DistribuirTesouroModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Fichas da mesa disponíveis para receber o tesouro. */
  aventureiros: AventureiroTesouro[];
  /** Chamado após uma distribuição bem-sucedida, com a mensagem de status. */
  onConcluido: (mensagem: string) => void;
}

const formatarTesouro = (valor: number) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export const DistribuirTesouroModal: React.FC<DistribuirTesouroModalProps> = ({
  isOpen,
  onClose,
  aventureiros,
  onConcluido,
}) => {
  const [operacao, setOperacao] = useState<Operacao>('add');
  const [modo, setModo] = useState<Modo>('dividir');
  const [quantia, setQuantia] = useState('');
  const [selecionados, setSelecionados] = useState<Record<string, boolean>>({});
  const [valoresIndividuais, setValoresIndividuais] = useState<Record<string, string>>({});
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOperacao('add');
      setModo('dividir');
      setQuantia('');
      setErro('');
      setValoresIndividuais({});
      setSelecionados(Object.fromEntries(aventureiros.map((aventureiro) => [aventureiro.id, true])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const selecionadosNaMesa = useMemo(
    () => aventureiros.filter((aventureiro) => selecionados[aventureiro.id]),
    [aventureiros, selecionados]
  );
  const plano = useMemo(() => {
    const entradas: EntradaTesouro[] = [];
    let cada: number | null = null;
    let sobra = 0;

    if (modo === 'dividir' || modo === 'igual') {
      const total = Number(quantia);
      if (Number.isFinite(total) && total > 0 && selecionadosNaMesa.length > 0) {
        if (modo === 'dividir') {
          const parte = Math.floor((total / selecionadosNaMesa.length) * 100) / 100;
          cada = parte;
          sobra = Math.round((total - parte * selecionadosNaMesa.length) * 100) / 100;
          if (parte > 0) {
            selecionadosNaMesa.forEach((aventureiro) => entradas.push({
              characterId: aventureiro.id,
              delta: operacao === 'add' ? parte : -parte,
            }));
          }
        } else {
          cada = total;
          selecionadosNaMesa.forEach((aventureiro) => entradas.push({
            characterId: aventureiro.id,
            delta: operacao === 'add' ? total : -total,
          }));
        }
      }
    } else {
      selecionadosNaMesa.forEach((aventureiro) => {
        const valor = Number(valoresIndividuais[aventureiro.id]);
        if (Number.isFinite(valor) && valor > 0) {
          entradas.push({ characterId: aventureiro.id, delta: operacao === 'add' ? valor : -valor });
        }
      });
    }

    return {
      entradas,
      cada,
      sobra,
      total: entradas.reduce((soma, entrada) => soma + Math.abs(entrada.delta), 0),
    };
  }, [modo, operacao, quantia, selecionadosNaMesa, valoresIndividuais]);

  const toggleSelecionado = (id: string, checked: boolean) => {
    setSelecionados((atual) => ({ ...atual, [id]: checked }));
  };

  const enviar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selecionadosNaMesa.length === 0) {
      setErro('Selecione ao menos um personagem.');
      return;
    }
    if (modo !== 'individual') {
      const total = Number(quantia);
      if (!Number.isFinite(total) || total <= 0) {
        setErro('Informe uma quantia maior que zero.');
        return;
      }
      if (modo === 'dividir' && plano.cada === 0) {
        setErro('O valor é pequeno demais para dividir entre os selecionados.');
        return;
      }
    } else if (plano.entradas.length === 0) {
      setErro('Informe o valor de pelo menos um personagem.');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      await fichaService.distribuirTesouro(plano.entradas);
      const quantidadeAventureiros = plano.entradas.length;
      const mensagem = operacao === 'add'
        ? `Tesouro enviado para ${quantidadeAventureiros} aventureiro${quantidadeAventureiros === 1 ? '' : 's'}.`
        : `Tesouro removido de ${quantidadeAventureiros} aventureiro${quantidadeAventureiros === 1 ? '' : 's'}.`;
      onConcluido(mensagem);
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível distribuir o tesouro.');
    } finally {
      setSalvando(false);
    }
  };

  const acao = operacao === 'add' ? 'recebe' : 'remove';
  const tipoTotal = operacao === 'add' ? 'distribuídos' : 'removidos';
  const fechar = () => { if (!salvando) onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={fechar} title="Distribuir tesouro" subtitle="Envie ou remova dinheiro de várias fichas da mesa." maxWidth="max-w-[560px]">
      <form className="space-y-4" noValidate onSubmit={enviar}>
        <fieldset>
          <legend className="mb-1.5 font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">Operação</legend>
          <div className="grid grid-cols-2 gap-2">
            <label className={`flex cursor-pointer items-center gap-2 rounded-xs border px-3 py-2.5 font-serif text-sm ${operacao === 'add' ? 'border-[#a88d61] bg-[#33250f] text-[#f3dfaa]' : 'border-[#4b3823] text-[#a88d61]'} focus-within:ring-2 focus-within:ring-[#d1a85a]`}>
              <input type="radio" name="distribuir-operacao" value="add" checked={operacao === 'add'} disabled={salvando} onChange={() => setOperacao('add')} className="accent-[#b88936]" />
              <Plus className="h-4 w-4" aria-hidden="true" /> Adicionar
            </label>
            <label className={`flex cursor-pointer items-center gap-2 rounded-xs border px-3 py-2.5 font-serif text-sm ${operacao === 'remove' ? 'border-[#a88d61] bg-[#33250f] text-[#f3dfaa]' : 'border-[#4b3823] text-[#a88d61]'} focus-within:ring-2 focus-within:ring-[#d1a85a]`}>
              <input type="radio" name="distribuir-operacao" value="remove" checked={operacao === 'remove'} disabled={salvando} onChange={() => setOperacao('remove')} className="accent-[#b88936]" />
              <Minus className="h-4 w-4" aria-hidden="true" /> Remover
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">Modo</legend>
          <div className="space-y-2">
            {([
              ['dividir', 'Dividir o total entre os selecionados'],
              ['igual', 'Mesmo valor para cada um'],
              ['individual', 'Valores individuais'],
            ] as const).map(([valor, rotulo]) => (
              <label key={valor} className={`flex cursor-pointer items-center gap-2 rounded-xs border px-3 py-2 font-serif text-sm ${modo === valor ? 'border-[#a88d61] bg-[#33250f] text-[#f3dfaa]' : 'border-[#4b3823] text-[#a88d61]'} focus-within:ring-2 focus-within:ring-[#d1a85a]`}>
                <input type="radio" name="distribuir-modo" value={valor} checked={modo === valor} disabled={salvando} onChange={() => setModo(valor)} className="accent-[#b88936]" />
                {rotulo}
              </label>
            ))}
          </div>
        </fieldset>

        {modo !== 'individual' && (
          <div>
            <label htmlFor="distribuir-quantia" className="mb-1.5 block font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">
              {modo === 'dividir' ? 'Total a distribuir' : 'Valor por personagem'}
            </label>
            <input id="distribuir-quantia" type="number" min="0.01" step="0.01" value={quantia} disabled={salvando} onChange={(event) => setQuantia(event.target.value)} className="w-full rounded-xs border border-[#5a4225] bg-[#130d08] px-3 py-2.5 font-serif text-sm text-[#e6ddc5] outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] disabled:opacity-60" placeholder="Ex.: 50" />
          </div>
        )}

        <section aria-labelledby="distribuir-personagens-label">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <h3 id="distribuir-personagens-label" className="font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">Personagens</h3>
            <div className="flex gap-3 font-serif text-xs">
              <button type="button" disabled={salvando} onClick={() => setSelecionados(Object.fromEntries(aventureiros.map((aventureiro) => [aventureiro.id, true])))} className="text-[#d1a85a] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] disabled:opacity-50">Selecionar todos</button>
              <button type="button" disabled={salvando} onClick={() => setSelecionados({})} className="text-[#a88d61] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] disabled:opacity-50">Limpar</button>
            </div>
          </div>
          {aventureiros.length === 0 ? (
            <p className="border border-[#3a2c1d] bg-[#160f0a] px-3 py-4 text-center font-serif text-sm text-[#8f795e]">Nenhuma ficha na mesa para receber tesouro.</p>
          ) : (
            <ul className="max-h-52 space-y-1 overflow-y-auto border border-[#3a2c1d] bg-[#160f0a] p-2 custom-scrollbar">
              {aventureiros.map((aventureiro) => {
                const selecionado = Boolean(selecionados[aventureiro.id]);
                const entrada = plano.entradas.find((item) => item.characterId === aventureiro.id);
                const saldoResultante = entrada ? aventureiro.dinheiro + entrada.delta : null;
                return (
                  <li key={aventureiro.id} className="flex min-h-10 items-center justify-between gap-3 border-b border-[#2d2116] px-1 py-1 last:border-b-0">
                    <label htmlFor={`distribuir-personagem-${aventureiro.id}`} className="flex min-w-0 cursor-pointer items-center gap-2 font-serif text-sm text-[#e6ddc5]">
                      <input id={`distribuir-personagem-${aventureiro.id}`} type="checkbox" checked={selecionado} disabled={salvando} onChange={(event) => toggleSelecionado(aventureiro.id, event.target.checked)} className="accent-[#b88936]" />
                      <span className="truncate">{aventureiro.nome}</span>
                    </label>
                    {modo === 'individual' && selecionado ? (
                      <input type="number" min="0.01" step="0.01" aria-label={`Valor para ${aventureiro.nome}`} value={valoresIndividuais[aventureiro.id] ?? ''} disabled={salvando} onChange={(event) => setValoresIndividuais((atual) => ({ ...atual, [aventureiro.id]: event.target.value }))} className="w-28 shrink-0 rounded-xs border border-[#5a4225] bg-[#130d08] px-2 py-1.5 text-right font-serif text-xs text-[#e6ddc5] outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] disabled:opacity-60" placeholder="Valor" />
                    ) : (
                      <span className="shrink-0 font-serif text-xs text-[#a88d61]">
                        {saldoResultante !== null
                          ? <>{formatarTesouro(aventureiro.dinheiro)} → {formatarTesouro(saldoResultante)} ◈</>
                          : <>{formatarTesouro(aventureiro.dinheiro)} ◈</>}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p role="status" aria-live="polite" className="border-l-2 border-[#80652e] bg-[#20150c] px-3 py-2 font-serif text-sm text-[#e7c56d]">
          {plano.entradas.length === 0 ? (
            'Selecione personagens e informe valores para visualizar a operação.'
          ) : modo === 'dividir' ? (
            <>Cada um {acao} {formatarTesouro(plano.cada ?? 0)} ◈ · {formatarTesouro(plano.total)} ◈ {tipoTotal}{plano.sobra > 0 ? ` · sobra ${formatarTesouro(plano.sobra)} ◈` : ''}</>
          ) : modo === 'igual' ? (
            <>{formatarTesouro(plano.cada ?? 0)} ◈ para cada um · {formatarTesouro(plano.total)} ◈ {tipoTotal}</>
          ) : (
            <>{formatarTesouro(plano.total)} ◈ {tipoTotal}</>
          )}
        </p>

        {erro && <p role="alert" className="border-l-2 border-[#a85b45] bg-[#28140f] px-3 py-2 font-serif text-sm text-[#e7b29e]">{erro}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" disabled={salvando} onClick={fechar} className="rounded-xs border border-[#4b3823] px-4 py-2 font-cinzel text-[10px] uppercase text-[#a88d61] transition-colors hover:border-[#8c6b41] hover:text-[#e6ddc5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] disabled:opacity-50">Cancelar</button>
          <GothicButton type="submit" size="sm" width={220} height={40} disabled={salvando} icon={<Coins className="h-4 w-4" />} className="focus-visible:ring-2 focus-visible:ring-[#d1a85a]">
            {salvando ? 'Distribuindo...' : operacao === 'add' ? 'Distribuir tesouro' : 'Remover tesouro'}
          </GothicButton>
        </div>
      </form>
    </Modal>
  );
};

export default DistribuirTesouroModal;
