import React, { useState } from 'react';
import { Crown, RefreshCw, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { DistribuirTesouroModal } from '@/components/DistribuirTesouroModal';
import { GrimorioBloqueiosModal } from '@/components/GrimorioBloqueiosModal';
import { LimiteFichasModal } from '@/components/LimiteFichasModal';
import { AcessoRestritoPanel } from '@/components/painelMestre/AcessoRestritoPanel';
import { AcoesDoMestrePanel } from '@/components/painelMestre/AcoesDoMestrePanel';
import { AventureirosDaMesaPanel } from '@/components/painelMestre/AventureirosDaMesaPanel';
import { PermissoesDaMesaPanel } from '@/components/painelMestre/PermissoesDaMesaPanel';
import { ResumoDaMesaPanel } from '@/components/painelMestre/ResumoDaMesaPanel';
import { TesouroModal } from '@/components/painelMestre/TesouroModal';
import { XpCondutaModal } from '@/components/painelMestre/XpCondutaModal';
import { useMesaDoMestre } from '@/components/painelMestre/useMesaDoMestre';
import { useModaisDaMesa } from '@/components/painelMestre/useModaisDaMesa';
import { usePermissoesDaMesa } from '@/components/painelMestre/usePermissoesDaMesa';
import { useTesouroForm } from '@/components/painelMestre/useTesouroForm';
import { useXpCondutaForm } from '@/components/painelMestre/useXpCondutaForm';
import { ToolbarButton } from '@/components/ui/ToolbarButton';
import { useAuthorization } from '@/hooks/useAuthorization';
import { fichaPath } from '@/routes/paths';

/**
 * Painel Administrativo do Mestre: as fichas da mesa, o resumo, as permissões e
 * os ajustes de XP e tesouro. Os dados vêm de `useMesaDoMestre`, as permissões
 * de `usePermissoesDaMesa` e os formulários dos modais de `useXpCondutaForm`,
 * `useTesouroForm` e `useModaisDaMesa`; aqui só se compõe a tela.
 */
export const PainelMestrePage: React.FC = () => {
  const { isMestre: isMaster, tenantId } = useAuthorization();
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState('');

  const mesa = useMesaDoMestre({ isMaster, tenantId, onStatus: setStatusMessage });
  const permissoes = usePermissoesDaMesa({
    characters: mesa.characters,
    nomesPorJogador: mesa.nomesPorJogador,
    onAtualizarMesa: mesa.atualizar,
    onStatus: setStatusMessage,
  });
  const xp = useXpCondutaForm({
    characters: mesa.characters,
    onAtualizarMesa: mesa.atualizar,
    onStatus: setStatusMessage,
  });
  const tesouro = useTesouroForm({
    characters: mesa.characters,
    onAtualizarMesa: mesa.atualizar,
    onStatus: setStatusMessage,
  });
  const modais = useModaisDaMesa({ onAtualizarMesa: mesa.atualizar, onStatus: setStatusMessage });

  if (!isMaster) {
    return <AcessoRestritoPanel />;
  }

  return (
    <>
      <PageShell id="page-painel-mestre" variant="padrao"
        title={<h2 className="flex items-center gap-2"><Crown className="h-5 w-5 text-[#a88d61]" /> Painel Administrativo do Mestre</h2>}
        subtitle="Monitoramento consolidado da mesa e permissões da campanha"
        headerRight={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xs border border-[#8c6b41] bg-[#2a1d10] px-2.5 py-0.5 text-xs font-cinzel text-[#d4af37]"><ShieldCheck size={12} /><span>Acesso Restrito</span></div>
            <ToolbarButton
              id="btn-sincronizar-mesa"
              icon={<RefreshCw className={clsx('h-3.5 w-3.5', mesa.carregando && 'animate-spin')} />}
              disabled={mesa.carregando}
              onClick={mesa.refresh}
            >
              Sincronizar
            </ToolbarButton>
          </div>
        }
      >
        <div className="space-y-6">
          <ResumoDaMesaPanel resumo={permissoes.resumoDaMesa} />

          <AcoesDoMestrePanel
            alteracoesPendentes={permissoes.alteracoesPendentes}
            onConcederXp={xp.abrir}
            onDistribuirTesouro={modais.abrirDistribuir}
            onAbrirPermissoes={() => permissoes.abrir()}
            onAbrirGrimorio={modais.abrirGrimorio}
            onAbrirLimites={modais.abrirLimites}
          />

          {statusMessage && (
            <p role="status" aria-live="polite" className="border-l-2 border-[#a88d61] bg-[#20150c] px-3 py-2 font-serif text-sm text-[#d4c6aa]">{statusMessage}</p>
          )}

          <AventureirosDaMesaPanel
            isLoading={mesa.isLoading}
            loadError={mesa.loadError}
            total={mesa.characters.length}
            aventureiros={permissoes.aventureirosOrdenados}
            onAbrirFicha={(characterId) => navigate(fichaPath(characterId))}
            onAjustarTesouro={tesouro.abrir}
            onPermissoes={permissoes.abrir}
            onRetry={mesa.refresh}
          />
        </div>
      </PageShell>

      <PermissoesDaMesaPanel
        isOpen={permissoes.isOpen}
        onClose={permissoes.fechar}
        characters={mesa.characters}
        nomesPorJogador={mesa.nomesPorJogador}
        focusId={permissoes.focusId}
        getPermissions={permissoes.getPermissions}
        onUpdatePermission={permissoes.updatePermission}
        alteracoesPendentes={permissoes.alteracoesPendentes}
        savingPermissionId={permissoes.savingPermissionId}
        onSalvar={permissoes.salvarPermissoes}
        onAbrirFicha={(characterId) => navigate(fichaPath(characterId))}
      />

      <XpCondutaModal
        isOpen={xp.isOpen}
        onClose={xp.fechar}
        onSubmit={xp.submit}
        characters={mesa.characters}
        destinatario={xp.destinatario}
        onDestinatarioChange={xp.setDestinatario}
        quantidade={xp.quantidade}
        onQuantidadeChange={xp.setQuantidade}
        motivo={xp.motivo}
        onMotivoChange={xp.setMotivo}
        erro={xp.erro}
        isSaving={xp.isSaving}
      />

      <TesouroModal
        isOpen={tesouro.isOpen}
        onClose={tesouro.fechar}
        onSubmit={tesouro.submit}
        characters={mesa.characters}
        personagemId={tesouro.personagemId}
        onPersonagemChange={tesouro.setPersonagemId}
        quantia={tesouro.quantia}
        onQuantiaChange={tesouro.setQuantia}
        operacao={tesouro.operacao}
        onOperacaoChange={tesouro.setOperacao}
        erro={tesouro.erro}
        isSaving={tesouro.isSaving}
      />

      <GrimorioBloqueiosModal isOpen={modais.isGrimorioOpen} onClose={modais.fecharGrimorio} />
      <LimiteFichasModal isOpen={modais.isLimitesOpen} onClose={modais.fecharLimites} />
      <DistribuirTesouroModal isOpen={modais.isDistribuirOpen} onClose={modais.fecharDistribuir} aventureiros={permissoes.aventureirosTesouro} onConcluido={modais.concluirDistribuicao} />
    </>
  );
};

export default PainelMestrePage;
