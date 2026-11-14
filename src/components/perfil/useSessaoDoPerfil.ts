import { useNavigate } from 'react-router-dom';
import { ROLE_LABELS } from '@/auth/policies';
import { useAuthorization } from '@/hooks/useAuthorization';
import { ROUTES } from '@/routes/paths';
import { useSessionStore } from '@/store/useSessionStore';
import { iniciaisDoNome } from './formatters';

/**
 * Domínio da sessão na tela de Perfil: a conta autenticada, o rótulo do papel
 * exibido na faixa do topo, as iniciais do retrato e a saída da conta (que
 * encerra a sessão e devolve o usuário ao login).
 */
export function useSessaoDoPerfil() {
  const user = useSessionStore((state) => state.session?.user ?? null);
  const applyUser = useSessionStore((state) => state.applyUser);
  const signOut = useSessionStore((state) => state.signOut);
  const { role, isMestre } = useAuthorization();
  const navigate = useNavigate();

  const sair = async () => {
    await signOut();
    navigate(ROUTES.login, { replace: true });
  };

  return {
    user,
    applyUser,
    isMestre,
    /** Rótulo do papel na faixa de topo. */
    papel: role ? ROLE_LABELS[role] : 'Visitante',
    iniciais: iniciaisDoNome(user?.nome_completo ?? ''),
    sair,
  };
}
