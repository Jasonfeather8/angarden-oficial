import { useEffect, useState } from 'react';
import { useAuthorization } from '../../hooks/useAuthorization';
import { useFichaStore } from '../../store/useFichaStore';
import { fichaService } from '../../services/fichaService';
import { mercadoService } from '../../services/mercadoService';
import { withTimeout } from '../../utils/withTimeout';
import type { FichaCompleta, MercadoItem } from '../../types';
import type { PersonagemResumo } from '../ModalSelecionarComprador';

/**
 * Domínio do comprador: comitiva disponível, ficha carregada, bolsa, carga,
 * permissões de compra e o fluxo de confirmação da compra.
 */
export function useCompradorDoMercado() {
  const { can } = useAuthorization();
  const storeCharacterId = useFichaStore((state) => state.characterId);
  const setStoreCharacterId = useFichaStore((state) => state.setCharacterId);

  const [personagemId, setPersonagemId] = useState<string>(() => storeCharacterId);
  const [listaPersonagens, setListaPersonagens] = useState<PersonagemResumo[]>([]);
  const [ficha, setFicha] = useState<FichaCompleta | null>(null);
  const [fichaCarregadaId, setFichaCarregadaId] = useState<string | null>(null);
  const [loadingFicha, setLoadingFicha] = useState<boolean>(true);
  const [erroFicha, setErroFicha] = useState<string | null>(null);

  const fichaDoComprador = fichaCarregadaId !== null && fichaCarregadaId === personagemId ? ficha : null;

  // Carregar lista de personagens disponíveis
  const carregarListaPersonagens = async () => {
    try {
      const lista = await withTimeout(fichaService.getListaPersonagens());
      setListaPersonagens(lista);
      if (lista.length > 0 && !lista.some((p) => p.id === personagemId)) {
        setPersonagemId(lista[0].id);
      }
    } catch (e) {
      console.error('Erro ao carregar lista de personagens', e);
      setErroFicha('Não foi possível carregar a lista de personagens compradores.');
    }
  };

  // Carregar dados da ficha do personagem selecionado para consultar saldo, peso e inventário
  const carregarFicha = async (idParaCarregar: string) => {
    if (!idParaCarregar) {
      setFicha(null);
      setFichaCarregadaId(null);
      setErroFicha(null);
      setLoadingFicha(false);
      return;
    }
    try {
      setLoadingFicha(true);
      // Troca de personagem: a ficha anterior não pode continuar aparecendo como se fosse do novo comprador.
      // Recarregar o mesmo personagem (ex.: depois de uma compra) mantém os valores atuais na tela.
      if (fichaCarregadaId !== idParaCarregar) setFichaCarregadaId(null);
      setErroFicha(null);
      const data = await withTimeout(fichaService.getFicha(idParaCarregar));
      setFicha(data);
      setFichaCarregadaId(idParaCarregar);
    } catch (e) {
      console.error('Erro ao carregar ficha para o mercado', e);
      setFicha(null);
      setFichaCarregadaId(null);
      setErroFicha(
        e instanceof Error ? e.message : 'Não foi possível carregar a bolsa do personagem.'
      );
    } finally {
      setLoadingFicha(false);
    }
  };

  useEffect(() => {
    carregarListaPersonagens();
  }, []);

  useEffect(() => {
    carregarFicha(personagemId);
  }, [personagemId]);

  // Permissões de acesso e compra no mercado para a ficha selecionada.
  const temPermissaoEpica = can.accessEpicMarket(fichaDoComprador);
  const temPermissaoArcano = can.accessArcanoMarket(fichaDoComprador);
  const temPermissaoCompra = can.buyInMarket(fichaDoComprador);

  const saldoAtual = fichaDoComprador?.recursos?.dinheiro ?? 0;
  const cargaAtual = fichaDoComprador?.recursos?.carga_total_peso ?? 0;

  // Seleção do comprador na comitiva (sincroniza com o store global da ficha)
  const selecionarComprador = (novoId: string) => {
    setPersonagemId(novoId);
    setStoreCharacterId(novoId);
  };

  // Confirmação de compra no modal
  const confirmarCompra = async (item: MercadoItem, quantidade: number) => {
    await mercadoService.efetuarCompra({
      fichaId: personagemId,
      item,
      quantidade,
    });
    // Atualiza o saldo e peso imediatamente na UI para a ficha selecionada
    await carregarFicha(personagemId);
    await carregarListaPersonagens();

    // Sincroniza ativamente com o useFichaStore se for o personagem ativo
    const store = useFichaStore.getState();
    if (store.characterId === personagemId) {
      await store.loadFicha(personagemId);
    }
  };

  return {
    personagemId,
    listaPersonagens,
    loadingFicha,
    erroFicha,
    fichaDoComprador,
    saldoAtual,
    cargaAtual,
    temPermissaoEpica,
    temPermissaoArcano,
    temPermissaoCompra,
    selecionarComprador,
    confirmarCompra,
    carregarListaPersonagens,
    carregarFicha,
  };
}
