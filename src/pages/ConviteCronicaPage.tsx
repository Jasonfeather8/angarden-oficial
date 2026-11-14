import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { GothicButton } from '@/components/GothicButton';
import { formatSessionDate } from '@/components/cronicas/formatters';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/Skeleton';
import { cronicaPath } from '@/routes/paths';
import { cronicaService } from '@/services/cronicaService';
import { fichaService } from '@/services/fichaService';
import type { ConviteDaCronicaPreview } from '@/types';

/**
 * Aceite do convite de uma crônica. O convidado precisa de conta aprovada,
 * escolhe os próprios personagens e aguarda a aprovação do Mestre autor.
 */
export const ConviteCronicaPage: React.FC = () => {
  const { token = '' } = useParams();
  const navigate = useNavigate();

  const [preview, setPreview] = useState<ConviteDaCronicaPreview | null>(null);
  const [personagens, setPersonagens] = useState<Array<{ id: string; nome: string }>>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [convite, lista] = await Promise.all([
        cronicaService.previewConvite(token),
        fichaService.getListaPersonagens(),
      ]);
      setPreview(convite);
      setPersonagens(lista.map((personagem) => ({ id: personagem.id, nome: personagem.nome })));
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Convite inválido, expirado ou conta não aprovada.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const aceitar = async () => {
    if (!preview || selecionados.length === 0) return;
    setEnviando(true);
    setErro(null);
    try {
      const resultado = await cronicaService.aceitarConvite(token, selecionados);
      navigate(cronicaPath(resultado.chronicleId));
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível aceitar o convite.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <PageShell
      id="page-convite-cronica"
      variant="estreito"
      title={<h1 className="font-cinzel">Convite para uma crônica</h1>}
      subtitle="Junte-se à companhia nesta aventura"
    >
      {carregando ? (
        <LoadingState variant="text" label="Carregando convite…" />
      ) : erro && !preview ? (
        <ErrorState description={erro} onRetry={() => void carregar()} />
      ) : preview ? (
        <article className="space-y-5">
          <header className="border border-[#5a4225] bg-gradient-to-r from-[#21170e] via-[#2b1f14] to-[#17100a] p-4">
            <h2 className="font-cinzel text-xl font-bold text-[#f0c265]">{preview.titulo}</h2>
            <p className="mt-2 flex items-center gap-2 font-serif text-sm text-[#c6a66d]">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {formatSessionDate(preview.dataAventura)}
            </p>
            {preview.local && (
              <p className="mt-1 flex items-center gap-2 font-serif text-sm text-[#c6a66d]">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {preview.local}
              </p>
            )}
            <p className="mt-2 font-serif text-xs italic text-[#a88d61]">
              {preview.cliente} · Mestre {preview.mestre}
            </p>
          </header>

          <p className="whitespace-pre-wrap font-garamond text-base leading-relaxed text-[#d6c4ae]">
            {preview.relato}
          </p>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 font-cinzel text-xs font-bold uppercase tracking-[0.16em] text-[#d1a85a]">
              <Users className="h-4 w-4" aria-hidden="true" />
              Escolha seus personagens
            </h3>
            {personagens.length === 0 ? (
              <p className="font-serif text-sm italic text-[#8f795e]">Você não possui personagens disponíveis.</p>
            ) : (
              <ul className="space-y-2">
                {personagens.map((personagem) => (
                  <li key={personagem.id}>
                    <label
                      className={`flex items-center gap-2 border border-[#3a2c1d] bg-[#120d09] p-3 font-serif text-sm text-[#d6c4ae] ${
                        preview.jaParticipa ? 'opacity-60' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={preview.jaParticipa}
                        checked={selecionados.includes(personagem.id)}
                        onChange={(event) =>
                          setSelecionados((atuais) =>
                            event.target.checked
                              ? [...atuais, personagem.id]
                              : atuais.filter((id) => id !== personagem.id),
                          )
                        }
                        className="accent-[#b89558]"
                      />
                      {personagem.nome}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {erro && <p role="alert" className="font-serif text-sm text-red-300">{erro}</p>}

          {preview.jaParticipa ? (
            <div className="space-y-2">
              <p className="font-serif text-sm text-[#c6a66d]">Você já está inscrito nesta crônica.</p>
              <GothicButton size="sm" width={200} height={38} onClick={() => navigate(cronicaPath(preview.chronicleId))}>
                Ir para a crônica
              </GothicButton>
            </div>
          ) : (
            <GothicButton
              size="sm"
              width={280}
              height={38}
              disabled={selecionados.length === 0 || enviando}
              onClick={() => void aceitar()}
            >
              {enviando ? 'Enviando…' : 'Aceitar convite e inscrever personagens'}
            </GothicButton>
          )}
        </article>
      ) : null}
    </PageShell>
  );
};

export default ConviteCronicaPage;
