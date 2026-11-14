import { useEffect, useState } from 'react';
import { getLearnedSpellIds, setLearnedSpell } from '../../services/grimorioService';
import { withTimeout } from '../../utils/withTimeout';

/**
 * Magias aprendidas pelo personagem selecionado, com atualização otimista e
 * recarga de segurança quando a gravação falha.
 */
export function useMagiasAprendidas(personagemId: string) {
  const [learnedIds, setLearnedIds] = useState<string[]>([]);

  useEffect(() => {
    let isCurrent = true;
    setLearnedIds([]);
    const loadLearnedSpells = async () => {
      try {
        const ids = await withTimeout(getLearnedSpellIds(personagemId));
        if (isCurrent) setLearnedIds(ids);
      } catch (error) {
        console.error('Erro ao carregar magias aprendidas do Grimório', error);
      }
    };
    void loadLearnedSpells();
    return () => {
      isCurrent = false;
    };
  }, [personagemId]);

  const toggleLearned = (spellId: string) => {
    const learned = !learnedIds.includes(spellId);
    setLearnedIds((current) => learned ? [...current, spellId] : current.filter((id) => id !== spellId));
    void setLearnedSpell(personagemId, spellId, learned).catch(async (error) => {
      console.error('Erro ao atualizar magia aprendida no Grimório', error);
      try {
        setLearnedIds(await withTimeout(getLearnedSpellIds(personagemId)));
      } catch (reloadError) {
        console.error('Erro ao recarregar magias aprendidas do Grimório', reloadError);
      }
    });
  };

  return { learnedIds, toggleLearned };
}
