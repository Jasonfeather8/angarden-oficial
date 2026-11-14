import React, { useEffect, useState } from 'react';
import { CalendarClock, Check, Clock3, ExternalLink, FileText, Link2, Pencil, Users } from 'lucide-react';
import type { UseAsyncDataResult } from '../../hooks/useAsyncData';
import { scheduleService } from '../../services/scheduleService';
import type { PresencaNaSessao, SessaoDaMesa } from '../../types';
import { ErrorState } from '../ui/ErrorState';
import { PainelSecao } from '../ui/PainelSecao';
import { Skeleton } from '../ui/Skeleton';
import { ToolbarButton } from '../ui/ToolbarButton';
import { RetratoDePresenca } from '../ui/RetratoDePresenca';
import { contar, formatCountdown, formatSessionDate } from './formatters';

const CountdownUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="min-w-[62px] rounded-xs border border-[#5a4225] bg-[#100a06] px-2.5 py-2.5 text-center">
    <div className="font-cinzel text-2xl font-bold leading-none text-[#f0c265]">{String(value).padStart(2, '0')}</div>
    <div className="mt-1 font-cinzel text-[9px] uppercase tracking-wider text-[#a88d61]">{label}</div>
  </div>
);

const SessionCountdown = React.memo(({ dataHora }: { dataHora: string }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const alvo = Date.parse(dataHora);
    if (alvo <= Date.now()) return;

    const intervalId = window.setInterval(() => {
      if (alvo <= Date.now()) window.clearInterval(intervalId);
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [dataHora]);

  const countdown = formatCountdown(Date.parse(dataHora) - now);
  const hasSessionStarted = Date.parse(dataHora) <= now;

  return (
    <div
      role="timer"
      aria-label="Contagem regressiva para a próxima sessão"
      className="rounded-xs border border-[#70552f] bg-[#1b120b] p-3 xl:min-w-[320px]"
    >
      <p className="mb-2 flex items-center justify-center gap-1.5 font-cinzel text-[10px] uppercase tracking-[0.16em] text-[#b89558]">
        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
        {hasSessionStarted ? 'Sessão em andamento' : 'A mesa começa em'}
      </p>
      {hasSessionStarted ? (
        <p className="text-center font-serif text-sm italic text-[#e0bd71]">
          Confira os registros da crônica após a aventura.
        </p>
      ) : (
        <div className="flex justify-center gap-2">
          <CountdownUnit value={countdown.days} label="dias" />
          <CountdownUnit value={countdown.hours} label="horas" />
          <CountdownUnit value={countdown.minutes} label="min" />
          <CountdownUnit value={countdown.seconds} label="seg" />
        </div>
      )}
    </div>
  );
});

const SessaoSkeleton: React.FC = () => (
  <div aria-hidden="true" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
    <div>
      <Skeleton className="h-7 w-64 max-w-full" />
      <Skeleton className="mt-2 h-4 w-52 max-w-full" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
      </div>
    </div>
    <div className="rounded-xs border border-[#70552f] bg-[#1b120b] p-3 xl:min-w-[320px]">
      <Skeleton className="mx-auto mb-2 h-3 w-28" />
      <div className="flex justify-center gap-2">
        <Skeleton className="h-14 w-[62px]" />
        <Skeleton className="h-14 w-[62px]" />
        <Skeleton className="h-14 w-[62px]" />
        <Skeleton className="h-14 w-[62px]" />
      </div>
    </div>
  </div>
);

export interface ProximaSessaoPanelProps {
  isMestre: boolean;
  papelMestre: boolean;
  userId: string | null;
  totalJogadores: number;
  temDadosDeJogadores: boolean;
  sessaoQuery: UseAsyncDataResult<SessaoDaMesa | null>;
  presencasQuery: UseAsyncDataResult<PresencaNaSessao[]>;
  onAgendar: () => void;
  onEditar: () => void;
}

/**
 * Próxima sessão da mesa: pauta, contagem regressiva e o quórum de presenças.
 * A confirmação de presença é estado local do painel.
 */
export const ProximaSessaoPanel: React.FC<ProximaSessaoPanelProps> = ({
  isMestre,
  papelMestre,
  userId,
  totalJogadores,
  temDadosDeJogadores,
  sessaoQuery,
  presencasQuery,
  onAgendar,
  onEditar,
}) => {
  const [isSavingPresenca, setIsSavingPresenca] = useState(false);
  const [erroPresenca, setErroPresenca] = useState('');

  const sessao = sessaoQuery.data;

  const alterarPresenca = async (confirmar: boolean) => {
    if (!sessao) return;
    setIsSavingPresenca(true);
    setErroPresenca('');
    try {
      if (confirmar) await scheduleService.confirmarPresenca(sessao.id);
      else await scheduleService.cancelarPresenca(sessao.id);
      presencasQuery.reload();
    } catch (error) {
      setErroPresenca(error instanceof Error ? error.message : 'Não foi possível atualizar sua presença.');
    } finally {
      setIsSavingPresenca(false);
    }
  };

  return (
    <PainelSecao
      id="proxima-sessao-titulo"
      icon={<CalendarClock className="h-4 w-4" />}
      title="Próxima sessão"
      extra={
        isMestre && sessao && !sessaoQuery.isLoading ? (
          <ToolbarButton icon={<Pencil className="h-3.5 w-3.5" />} onClick={onEditar}>
            Editar sessão
          </ToolbarButton>
        ) : undefined
      }
      contentClassName="p-4 sm:p-5"
    >
      {sessaoQuery.isLoading ? (
        <div role="status" aria-live="polite">
          <span className="sr-only">Carregando a sessão agendada…</span>
          <SessaoSkeleton />
        </div>
      ) : sessaoQuery.error ? (
        <ErrorState description={sessaoQuery.error} onRetry={sessaoQuery.reload} />
      ) : sessao ? (
        <>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="min-w-0">
              <h3 className="font-cinzel text-xl font-bold text-[#f0d79b] sm:text-2xl">{sessao.titulo}</h3>
              <p className="mt-1 font-serif text-sm capitalize italic text-[#b39a78]">
                {formatSessionDate(sessao.dataHora)}
              </p>
              <div className="mt-4">
                <p className="mb-1.5 flex items-center gap-1.5 font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#a88d61]">
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" /> Pauta da mesa
                </p>
                <p className="font-serif text-base leading-relaxed text-[#d6c4ae]">{sessao.pauta}</p>
              </div>
              {sessao.linkVtt && (
                <a
                  href={sessao.linkVtt}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 font-cinzel text-[10px] uppercase tracking-wider text-[#d1a85a] underline decoration-[#70552f] underline-offset-4 transition-colors hover:text-[#f0d79b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c265]"
                >
                  <Link2 className="h-3.5 w-3.5" aria-hidden="true" /> Abrir sala virtual
                  <span className="sr-only"> (abre em nova aba)</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
            </div>
            <SessionCountdown dataHora={sessao.dataHora} />
          </div>
          <div role="group" aria-label="Presença na próxima sessão" className="mt-5 border-t border-[#3a2c1d] pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#a88d61]">
                <Users className="h-3.5 w-3.5" aria-hidden="true" /> Presença
              </p>
              <p className="font-serif text-xs text-[#d6c4ae]">
                {papelMestre && temDadosDeJogadores
                  ? `${contar(presencasQuery.data?.length ?? 0, 'confirmado', 'confirmados')} de ${totalJogadores} jogadores`
                  : contar(presencasQuery.data?.length ?? 0, 'confirmado', 'confirmados')}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {presencasQuery.isLoading ? (
                  <div role="status" aria-live="polite">
                    <span className="sr-only">Carregando presenças…</span>
                    <Skeleton className="h-6 w-40" />
                  </div>
                ) : presencasQuery.error ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-serif text-xs text-[#d28a70]">Não foi possível carregar as presenças.</p>
                    <ToolbarButton onClick={presencasQuery.reload}>Tentar de novo</ToolbarButton>
                  </div>
                ) : presencasQuery.data?.length ? (
                  <div className="flex flex-wrap items-start gap-3">
                    {presencasQuery.data.map((presenca) => (
                      <RetratoDePresenca
                        key={presenca.userId}
                        tamanho="sm"
                        nome={presenca.nome}
                        imagemUrl={presenca.imagemUrl}
                        confirmado
                      />
                    ))}
                  </div>
                ) : (
                  <p className="font-serif text-xs italic text-[#8f795e]">Ninguém confirmou presença ainda.</p>
                )}
              </div>
              {!papelMestre && !presencasQuery.isLoading && !presencasQuery.error && presencasQuery.data !== null && (
                presencasQuery.data.some((presenca) => presenca.userId === userId) ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-xs text-[#b39a78]">Sua presença está confirmada.</span>
                    <ToolbarButton
                      disabled={isSavingPresenca}
                      onClick={() => void alterarPresenca(false)}
                    >
                      Cancelar presença
                    </ToolbarButton>
                  </div>
                ) : (
                  <ToolbarButton
                    variant="primary"
                    icon={<Check className="h-3.5 w-3.5" />}
                    disabled={isSavingPresenca}
                    onClick={() => void alterarPresenca(true)}
                  >
                    Confirmar presença
                  </ToolbarButton>
                )
              )}
            </div>
            {erroPresenca && <p className="mt-2 font-serif text-xs text-[#d28a70]">{erroPresenca}</p>}
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 font-serif text-sm text-[#a88d61]">
            {isMestre
              ? 'Nenhuma sessão agendada — a mesa ainda não tem contagem regressiva nem pauta.'
              : 'O Mestre ainda não agendou a próxima sessão. A pauta e a contagem regressiva aparecerão aqui.'}
          </p>
          {isMestre && (
            <ToolbarButton
              id="btn-agendar-nova-sessao"
              variant="primary"
              icon={<CalendarClock className="h-3.5 w-3.5" />}
              onClick={onAgendar}
            >
              Agendar sessão
            </ToolbarButton>
          )}
        </div>
      )}
    </PainelSecao>
  );
};

export default ProximaSessaoPanel;
