import React from 'react';
import { UserPlus, Users } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { AcoesDoAcervo } from '../components/personagens/AcoesDoAcervo';
import { AcervoCarregando } from '../components/personagens/AcervoCarregando';
import { CarrosselDePersonagens } from '../components/personagens/CarrosselDePersonagens';
import { DetalhesDoPersonagem } from '../components/personagens/DetalhesDoPersonagem';
import { RetratoDoPersonagem } from '../components/personagens/RetratoDoPersonagem';
import { useAcoesDePersonagem } from '../components/personagens/useAcoesDePersonagem';
import { useAcervoDePersonagens } from '../components/personagens/useAcervoDePersonagens';
import { useBuscaDePersonagens } from '../components/personagens/useBuscaDePersonagens';
import { useCarrosselDePersonagens } from '../components/personagens/useCarrosselDePersonagens';
import { useInteracaoComFicha } from '../components/personagens/useInteracaoComFicha';
import { GothicButton } from '../components/GothicButton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { useAuthorization } from '../hooks/useAuthorization';

export const PersonagensPage: React.FC = () => {
  const { tenantId, userId } = useAuthorization();

  const { acervoQuery, limiteQuery, characters, minhasFichas, limite, limiteAtingido } =
    useAcervoDePersonagens(tenantId, userId);
  const { searchTerm, setSearchTerm, setActiveCharacterId, filteredCharacters, activeCharacter, activeIndex } =
    useBuscaDePersonagens(characters);
  const carrossel = useCarrosselDePersonagens({ filteredCharacters, activeIndex, setActiveCharacterId });
  const { abrirFicha, agendarPrewarmDaFicha } = useInteracaoComFicha();
  const { createError, criarPersonagem, excluirPersonagem } = useAcoesDePersonagem({
    characters,
    searchTerm,
    limiteAtingido,
    reload: acervoQuery.reload,
    setActiveCharacterId,
    abrirFicha,
  });

  const titulo = <h2 className="flex items-center gap-2"><Users className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />Galeria de Personagens</h2>;

  if (acervoQuery.isLoading) {
    return (
      <PageShell id="page-personagens" variant="amplo" fill title={titulo}>
        <AcervoCarregando />
      </PageShell>
    );
  }

  if (acervoQuery.error) {
    return (
      <PageShell id="page-personagens" variant="amplo" fill title={titulo}>
        <ErrorState description={acervoQuery.error} onRetry={acervoQuery.reload} />
      </PageShell>
    );
  }

  if (characters.length === 0) {
    return (
      <PageShell
        id="page-personagens"
        variant="amplo"
        fill
        title={titulo}
        headerRight={limiteAtingido ? <p role="status" className="text-xs text-[#c4b9a3]">Limite de {limite} fichas por jogador atingido. O Mestre pode ampliá-lo.</p> : limiteQuery.data !== null && userId ? <p role="status" className="text-xs text-[#8c6b41]">{minhasFichas} de {limite} fichas suas</p> : undefined}
      >
        {createError && <p role="alert" className="mb-4 border-l-2 border-[#b56a55] bg-[#2a120d] px-3 py-2 text-xs text-[#f0b09b]">{createError}</p>}
        <EmptyState
          variant="plano"
          icon={<Users className="h-8 w-8" aria-hidden="true" />}
          title="Nenhum personagem no seu acervo"
          description={
            tenantId
              ? 'Crie o primeiro personagem do seu reino para começar a preencher a ficha técnica.'
              : 'O administrador da plataforma não possui acervo próprio. Aprove um cliente no painel administrativo para que ele comece a criar personagens.'
          }
          action={
            tenantId ? (
              <GothicButton
                size="sm"
                icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
                onClick={criarPersonagem}
                disabled={limiteAtingido}
              >
                Novo Personagem
              </GothicButton>
            ) : undefined
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      id="page-personagens"
      variant="amplo"
      fill
      title={
        <h2 className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
          Galeria de Personagens
          {activeCharacter && <span className="text-[#f2dfa8]">{activeCharacter.name}</span>}
        </h2>
      }
      headerRight={
        <AcoesDoAcervo
          minhasFichas={minhasFichas}
          limite={limite}
          limiteAtingido={limiteAtingido}
          mostrarContagem={limiteQuery.data !== null && Boolean(userId)}
          searchTerm={searchTerm}
          onBuscar={setSearchTerm}
          onCriarPersonagem={criarPersonagem}
          personagemAtivo={activeCharacter}
          onExcluir={excluirPersonagem}
        />
      }
      className="select-none font-serif text-[#dcd1ba]"
    >
      {createError && <p role="alert" className="mb-4 border-l-2 border-[#b56a55] bg-[#2a120d] px-3 py-2 text-xs text-[#f0b09b]">{createError}</p>}
      <div className="flex h-full min-h-0 flex-col lg:flex-row relative gap-4">
        <CarrosselDePersonagens
          personagens={filteredCharacters}
          personagemAtivo={activeCharacter}
          indiceAtivo={activeIndex}
          termoBusca={searchTerm}
          carrossel={carrossel}
          onSelecionar={setActiveCharacterId}
          onAbrirFicha={abrirFicha}
          onPrewarm={agendarPrewarmDaFicha}
        />
        <RetratoDoPersonagem
          personagemAtivo={activeCharacter}
          onAbrirFicha={abrirFicha}
          onPrewarm={agendarPrewarmDaFicha}
        />
        <DetalhesDoPersonagem personagemAtivo={activeCharacter} />
      </div>
    </PageShell>
  );
};

export default PersonagensPage;
