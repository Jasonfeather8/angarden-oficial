import { MercadoItem, CategoriaMercado, FichaCompleta } from '../types';
import { fichaService } from './fichaService';
import { consultarLookupDeItens } from '@/services/mercadoService';

/**
 * Converte um item simples do array suporte.inventario em um objeto MercadoItem completo e detalhado.
 * Tenta encontrar no catálogo do mercado para resgatar todos os atributos visuais e técnicos;
 * se não encontrar, infere e normaliza os dados mantendo integridade.
 */
export function converterInventarioParaMercadoItem(invItem: any): MercadoItem {
  if (!invItem) {
    return {
      id: `inv-${Date.now()}`,
      nome: 'Mercadoria',
      categoria: 'mercado_geral',
      preco: 0,
      peso: 0,
      icone_tipo: 'backpack',
    };
  }

  const nomeItem = String(invItem.item || invItem.nome || '').trim();
  const itemId = String(invItem.id || '');
  const nomeLower = nomeItem.toLowerCase();

  // 1. Tenta buscar correspondência no catálogo do mercado
  const correspondente = consultarLookupDeItens(itemId, nomeItem);

  if (correspondente) {
    return {
      ...correspondente,
      id: invItem.id || correspondente.id,
      nome: invItem.item || invItem.nome || correspondente.nome,
      peso: typeof invItem.peso === 'number' && invItem.peso > 0 ? invItem.peso : (correspondente.peso || 0),
      preco: (invItem.preco && invItem.preco > 0) ? invItem.preco : correspondente.preco,
      dano: correspondente.dano !== undefined ? String(correspondente.dano) : (invItem.dano !== undefined ? String(invItem.dano) : undefined),
      resist: correspondente.resist !== undefined ? correspondente.resist : invItem.resist,
      tipo: correspondente.tipo || invItem.tipo,
      subcategoria: correspondente.subcategoria || invItem.subcategoria,
      material: correspondente.material || invItem.material || invItem.requisitos,
      efeito: correspondente.efeito || invItem.efeito,
      efeito_resumo: correspondente.efeito_resumo || correspondente.efeito || invItem.efeito_resumo || invItem.efeito,
      efeito_completo: correspondente.efeito_completo || correspondente.efeito || invItem.efeito_completo || invItem.efeito,
      descricao: correspondente.citacao || correspondente.descricao || invItem.citacao || invItem.descricao_completa || invItem.descricao,
      citacao: correspondente.citacao || invItem.citacao,
      informacoes: correspondente.informacoes || correspondente.citacao || invItem.informacoes || invItem.citacao || correspondente.descricao,
      imagem_url: invItem.imagem_url || correspondente.imagem_url,
      icone_tipo: correspondente.icone_tipo || invItem.icone_tipo,
      is_epico: Boolean(correspondente.is_epico || invItem.is_epico || invItem.is_raro),
      rd_base: correspondente.rd_base !== undefined ? correspondente.rd_base : invItem.rd_base,
      rd_por_peca: correspondente.rd_por_peca || invItem.rd_por_peca,
      tensao: correspondente.tensao !== undefined ? correspondente.tensao : invItem.tensao,
      prec: correspondente.prec !== undefined ? correspondente.prec : invItem.prec,
    };
  }

  // 2. Classificação heurística para itens gerados ou personalizados
  const cat = String(invItem.categoria || '').toLowerCase();
  let categoriaFinal: CategoriaMercado = 'mercado_geral';
  let iconeTipo = invItem.icone_tipo || 'backpack';

  const isEscudo = cat.includes('escudo') ||
    nomeLower.includes('escudo') ||
    ['broquel', 'rodado', 'targe', 'heather', 'torre', 'pipa', 'pavise'].some(s => nomeLower.includes(s));

  const isArmadura = !isEscudo && (
    cat.includes('armadura') ||
    nomeLower.includes('armadura') ||
    nomeLower.includes('couraça') ||
    nomeLower.includes('cota de') ||
    nomeLower.includes('placas') ||
    Boolean(invItem.rd_por_peca)
  );

  const isLd = cat.includes('ld') ||
    cat.includes('longa') ||
    nomeLower.includes('arco') ||
    nomeLower.includes('besta') ||
    invItem.tensao !== undefined;

  const isProjetil = cat.includes('proget') ||
    nomeLower.includes('flecha') ||
    nomeLower.includes('virote');

  const isArma = cat.includes('arma') ||
    nomeLower.includes('espada') ||
    nomeLower.includes('adaga') ||
    nomeLower.includes('machado') ||
    nomeLower.includes('lança') ||
    nomeLower.includes('maça') ||
    invItem.dano !== undefined;

  const isConsumivel = cat.includes('consum') ||
    nomeLower.includes('poção') ||
    nomeLower.includes('pocao') ||
    nomeLower.includes('elixir') ||
    nomeLower.includes('unguento') ||
    nomeLower.includes('bálsamo') ||
    nomeLower.includes('cura') ||
    nomeLower.includes('vigor');

  if (isArmadura) {
    categoriaFinal = 'mercado_armaduras';
    if (nomeLower.includes('placa')) iconeTipo = 'armor_plate';
    else if (nomeLower.includes('cota') || nomeLower.includes('malha')) iconeTipo = 'armor_mail';
    else if (nomeLower.includes('couro')) iconeTipo = 'armor_leather';
    else iconeTipo = 'armor_plate';
  } else if (isEscudo) {
    categoriaFinal = (invItem.is_raro || invItem.is_epico) ? 'epico_escudos' : 'mercado_acessorios';
    if (nomeLower.includes('torre') || nomeLower.includes('pavise')) iconeTipo = 'shield_tower';
    else iconeTipo = 'shield';
  } else if (isLd) {
    categoriaFinal = 'mercado_ld';
    if (nomeLower.includes('besta')) iconeTipo = 'crossbow';
    else iconeTipo = 'bow';
  } else if (isProjetil) {
    categoriaFinal = 'mercado_progeteis';
    if (nomeLower.includes('virote')) iconeTipo = 'bolts';
    else iconeTipo = 'arrows';
  } else if (isArma) {
    categoriaFinal = 'mercado_armas';
    if (nomeLower.includes('adaga') || nomeLower.includes('faca')) iconeTipo = 'dagger';
    else if (nomeLower.includes('machado')) iconeTipo = 'axe';
    else if (nomeLower.includes('lança') || nomeLower.includes('lanca')) iconeTipo = 'spear';
    else if (nomeLower.includes('maça') || nomeLower.includes('maca') || nomeLower.includes('clube')) iconeTipo = 'mace';
    else iconeTipo = 'sword';
  } else if (isConsumivel) {
    categoriaFinal = 'arcano_pocoes';
    if (nomeLower.includes('mana') || nomeLower.includes('arcana') || nomeLower.includes('vigor')) iconeTipo = 'arcane_potion';
    else iconeTipo = 'potion';
  } else if (nomeLower.includes('anel')) {
    categoriaFinal = 'mercado_acessorios';
    iconeTipo = 'ring';
  } else if (nomeLower.includes('colar') || nomeLower.includes('amuleto')) {
    categoriaFinal = 'mercado_acessorios';
    iconeTipo = 'necklace';
  } else if (nomeLower.includes('manto') || nomeLower.includes('capa')) {
    categoriaFinal = 'mercado_geral';
    iconeTipo = 'cloak';
  } else if (nomeLower.includes('tocha')) {
    categoriaFinal = 'mercado_geral';
    iconeTipo = 'torch';
  } else if (nomeLower.includes('mochila') || nomeLower.includes('bolsa')) {
    categoriaFinal = 'mercado_geral';
    iconeTipo = 'backpack';
  }

  // Sanitização de imagens fora de contexto (evita fotos não medievais / Baby Yoda)
  const isOutOfContextUrl = (url?: string): boolean => {
    if (!url) return false;
    return (
      url.includes('photo-1618336753974-aae8e04506aa') || // Grogu / Baby Yoda
      url.includes('photo-1593811167562') ||
      url.includes('photo-1589256469067') ||
      url.includes('photo-1615672929037') ||
      url.includes('photo-1595590424283') ||
      url.includes('photo-1509198397868') ||
      url.includes('photo-1511367461989') ||
      url.includes('photo-1514733670139') ||
      url.includes('photo-1517411032315') ||
      url.includes('photo-1533158307587')
    );
  };

  let imagemFinal = invItem.imagem_url;
  if (isOutOfContextUrl(imagemFinal)) {
    imagemFinal = undefined;
  }
  if (!imagemFinal && correspondente?.imagem_url && !isOutOfContextUrl(correspondente.imagem_url)) {
    imagemFinal = correspondente.imagem_url;
  }

  const pesoNum = typeof invItem.peso === 'number' ? invItem.peso : parseFloat(String(invItem.peso || 0)) || 0;

  return {
    id: invItem.id || `inv-${Date.now()}`,
    nome: nomeItem || 'Mercadoria Desconhecida',
    categoria: categoriaFinal,
    preco: invItem.preco !== undefined ? invItem.preco : 0,
    peso: pesoNum,
    material: invItem.material || invItem.requisitos || 'Liga Metálica & Tecido',
    dano: invItem.dano !== undefined ? String(invItem.dano) : (isArma ? '25' : undefined),
    rd_base: invItem.rd_base !== undefined ? invItem.rd_base : (isArmadura ? 8 : undefined),
    resist: invItem.resist !== undefined ? invItem.resist : (isEscudo ? 20 : isArma ? 15 : undefined),
    tensao: invItem.tensao !== undefined ? invItem.tensao : (isLd ? '12' : undefined),
    prec: invItem.prec !== undefined ? invItem.prec : (isLd ? '+1' : undefined),
    efeito: invItem.efeito || (isEscudo ? '+2 Bloqueio' : ''),
    efeito_resumo: invItem.efeito_resumo || invItem.efeito,
    efeito_completo: invItem.efeito_completo || invItem.efeito,
    descricao: invItem.citacao || invItem.descricao_completa || invItem.descricao || 'Item pertencente ao inventário do aventureiro.',
    informacoes: invItem.informacoes || invItem.citacao || invItem.descricao,
    citacao: invItem.citacao || invItem.informacoes,
    icone_tipo: iconeTipo,
    is_epico: Boolean(invItem.is_raro || invItem.is_epico),
    tipo: invItem.tipo || (isArma ? 'Corpo a Corpo' : undefined),
    subcategoria: invItem.subcategoria,
    imagem_url: imagemFinal,
    rd_por_peca: invItem.rd_por_peca,
  };
}

/**
 * Identifica se um item é arma (corpo a corpo ou longa distância), escudo ou armadura.
 * Usado para filtrar a tabela rápida de consumíveis e itens gerais da folha.
 */
export function isItemArmaOuArmadura(item: any): boolean {
  if (!item) return false;
  const merc = converterInventarioParaMercadoItem(item);
  const cat = String(merc.categoria || item.categoria || '').toLowerCase();
  const nome = String(merc.nome || item.item || item.nome || '').toLowerCase();
  const tipoStr = String(item.tipo || merc.tipo || item.subcategoria || '').toLowerCase();
  const icone = String(merc.icone_tipo || item.icone_tipo || '').toLowerCase();

  // Categorias que representam armamento, armadura ou escudo
  if (
    cat === 'mercado_armas' ||
    cat === 'mercado_ld' ||
    cat === 'mercado_armaduras' ||
    cat === 'epico_armas' ||
    cat === 'epico_armas_distancia' ||
    cat === 'epico_armaduras' ||
    cat === 'epico_escudos' ||
    cat === 'mercado_escudos'
  ) {
    return true;
  }

  // Ícones característicos de combate
  if (
    icone === 'sword' ||
    icone === 'dagger' ||
    icone === 'axe' ||
    icone === 'spear' ||
    icone === 'mace' ||
    icone === 'bow' ||
    icone === 'crossbow' ||
    icone === 'shield' ||
    icone === 'shield_tower' ||
    icone === 'armor_plate' ||
    icone === 'armor_mail' ||
    icone === 'armor_leather'
  ) {
    return true;
  }

  // Atributos característicos de combate
  if (
    merc.dano !== undefined ||
    item.dano !== undefined ||
    item.dano_arma !== undefined ||
    item.tensao !== undefined ||
    merc.tensao !== undefined ||
    merc.rd_base !== undefined ||
    Boolean(merc.rd_por_peca) ||
    Boolean(item.rd_por_peca)
  ) {
    return true;
  }

  // Nomes característicos de armas
  const nomesArmas = [
    'espada', 'adaga', 'machado', 'lança', 'lanca', 'maça', 'maca', 'florete', 
    'cimitarra', 'rapieira', 'foice', 'martelo de guerra', 'alabarda', 'clube', 
    'bastão', 'katana', 'gládio', 'adagão', 'punhal', 'mangual', 'tridente',
    'arco', 'besta', 'arbalete', 'zarabatana', 'funda'
  ];
  if (nomesArmas.some((w) => nome.includes(w))) {
    return true;
  }

  // Nomes característicos de escudos
  const nomesEscudos = ['escudo', 'broquel', 'rodado', 'targe', 'heather', 'torre', 'pipa', 'pavise'];
  if (nomesEscudos.some((s) => nome.includes(s) || tipoStr.includes(s))) {
    return true;
  }

  // Nomes característicos de armaduras
  const nomesArmaduras = ['armadura', 'couraça', 'cota de', 'placas', 'elmo', 'gorjal', 'grevas', 'manoplas', 'coxote', 'bracal', 'braçal'];
  if (nomesArmaduras.some((a) => nome.includes(a))) {
    return true;
  }

  return false;
}

/**
 * Determina os slots de destino e informações de swap para um item específico
 */
export function determinarSlotsEquipamento(
  ficha: FichaCompleta,
  itemMercadoria: MercadoItem | any
): {
  tipo: 'arma' | 'armadura' | 'escudo' | 'arco_ld' | 'consumivel' | 'outro';
  slotsDisponiveis: { slot: string; label: string; itemAtualNome?: string }[];
} {
  const cat = String(itemMercadoria.categoria || '').toLowerCase();
  const tipoStr = String(itemMercadoria.tipo || itemMercadoria.subcategoria || '').toLowerCase();
  const icone = String(itemMercadoria.icone_tipo || '').toLowerCase();
  const nomeLower = String(itemMercadoria.nome || itemMercadoria.item || '').toLowerCase();

  const isEscudo =
    cat === 'mercado_escudos' ||
    cat === 'epico_escudos' ||
    (cat === 'mercado_acessorios' && (nomeLower.includes('escudo') || tipoStr.includes('escudo'))) ||
    icone === 'shield' ||
    icone === 'shield_tower' ||
    tipoStr.includes('escudo') ||
    nomeLower.includes('escudo') ||
    ['broquel', 'rodado', 'targe', 'micênico', 'micenico', 'greco', 'heather', 'torre', 'gothic', 'pipa', 'pavise', 'golem', 'dragão', 'dragao'].some(s => tipoStr.includes(s) || nomeLower.includes(s));

  if (isEscudo) {
    const atualSuporte = ficha.suporte?.armamento?.arma_suporte?.nome;
    const atualSegunda = ficha.suporte?.armamento?.segunda_arma?.nome;
    return {
      tipo: 'escudo',
      slotsDisponiveis: [
        { slot: 'arma_suporte', label: 'Escudo', itemAtualNome: atualSuporte && atualSuporte !== 'Nenhuma' ? atualSuporte : undefined },
        { slot: 'segunda_arma', label: 'Segunda Arma', itemAtualNome: atualSegunda && atualSegunda !== 'Nenhuma' ? atualSegunda : undefined },
      ]
    };
  }

  const isArmadura = !isEscudo && (
    cat === 'mercado_armaduras' ||
    cat === 'epico_armaduras' ||
    icone === 'armor' ||
    icone === 'armor_plate' ||
    icone === 'armor_mail' ||
    icone === 'armor_leather' ||
    Boolean(itemMercadoria.rd_por_peca) ||
    (itemMercadoria.rd_base && itemMercadoria.rd_base > 0 && !itemMercadoria.dano) ||
    nomeLower.includes('armadura') ||
    nomeLower.includes('couraça')
  );

  if (isArmadura) {
    const atual = ficha.suporte?.armadura?.nome;
    return {
      tipo: 'armadura',
      slotsDisponiveis: [
        { slot: 'armadura', label: 'Armadura Equipada', itemAtualNome: atual && atual !== 'Nenhuma' ? atual : undefined }
      ]
    };
  }

  const isLd = cat === 'mercado_ld' ||
    icone === 'bow' ||
    itemMercadoria.tensao !== undefined ||
    tipoStr.includes('arco') ||
    tipoStr.includes('besta') ||
    nomeLower.includes('arco') ||
    nomeLower.includes('besta');

  if (isLd) {
    const atual = ficha.suporte?.armamento?.arco_ld?.nome;
    return {
      tipo: 'arco_ld',
      slotsDisponiveis: [
        { slot: 'arco_ld', label: 'Arco / Longa Distância', itemAtualNome: atual && atual !== 'Nenhuma' ? atual : undefined }
      ]
    };
  }

  const isArma = cat === 'mercado_armas' ||
    itemMercadoria.dano !== undefined ||
    ['sword', 'dagger', 'axe', 'spear', 'mace'].includes(icone) ||
    /\barmas?\b/.test(tipoStr) ||
    nomeLower.includes('espada') ||
    nomeLower.includes('adaga') ||
    nomeLower.includes('machado') ||
    nomeLower.includes('lança');

  if (isArma) {
    const arm = ficha.suporte?.armamento || {};
    const pNome = arm.arma_primaria?.nome;
    const sNome = arm.segunda_arma?.nome;
    const supNome = arm.arma_suporte?.nome;

    return {
      tipo: 'arma',
      slotsDisponiveis: [
        { slot: 'arma_primaria', label: 'Arma Primária', itemAtualNome: pNome && pNome !== 'Nenhuma' ? pNome : undefined },
        { slot: 'segunda_arma', label: 'Segunda Arma', itemAtualNome: sNome && sNome !== 'Nenhuma' ? sNome : undefined },
      ]
    };
  }

  const isConsumivel = cat.includes('consum') ||
    nomeLower.includes('poção') ||
    nomeLower.includes('pocao') ||
    nomeLower.includes('elixir') ||
    nomeLower.includes('unguento') ||
    nomeLower.includes('cura') ||
    nomeLower.includes('vigor');

  if (isConsumivel) {
    return {
      tipo: 'consumivel',
      slotsDisponiveis: [
        { slot: 'consumir', label: 'Consumir / Usar Item' }
      ]
    };
  }

  return {
    tipo: 'outro',
    slotsDisponiveis: []
  };
}

/**
 * Equipa um item no slot correspondente da ficha com swap inteligente e recálculo da engine
 */
export function equiparItemNaFicha(
  ficha: FichaCompleta,
  itemMercadoria: MercadoItem | any,
  slotDesejado?: string
): { fichaAtualizada: FichaCompleta; mensagem: string } {
  const novaFicha: FichaCompleta = JSON.parse(JSON.stringify(ficha));
  if (!novaFicha.suporte) novaFicha.suporte = {} as any;
  if (!novaFicha.suporte.armamento) novaFicha.suporte.armamento = {} as any;
  if (!novaFicha.suporte.inventario) novaFicha.suporte.inventario = [];

  const inventario = novaFicha.suporte.inventario;
  const nomeItem = String(itemMercadoria.nome || itemMercadoria.item || '').trim();
  const cat = String(itemMercadoria.categoria || '').toLowerCase();
  const tipoStr = String(itemMercadoria.tipo || itemMercadoria.subcategoria || '').toLowerCase();
  const icone = String(itemMercadoria.icone_tipo || '').toLowerCase();
  const nomeLower = nomeItem.toLowerCase();

  // Helper para devolver item anterior ao inventário (swap inteligente)
  const devolverAoInventario = (antigo: any, categoriaFallback: string) => {
    if (!antigo || !antigo.nome || antigo.nome.trim() === '' || antigo.nome === 'Nenhuma' || antigo.nome === '-') return;
    
    // Evita duplicar se o item já estiver lá
    inventario.push({
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      item: antigo.nome,
      nome: antigo.nome,
      peso: typeof antigo.peso === 'number' ? antigo.peso : parseFloat(String(antigo.peso || 0)) || 0,
      quantidade: 1,
      descricao: antigo.citacao || antigo.descricao || antigo.efeito || 'Item desequipado da ficha',
      descricao_completa: antigo.descricao_completa || antigo.descricao || antigo.citacao || antigo.efeito,
      citacao: antigo.citacao || antigo.informacoes,
      informacoes: antigo.informacoes || antigo.citacao,
      categoria: antigo.categoria || categoriaFallback,
      subcategoria: antigo.subcategoria,
      tipo: antigo.tipo,
      material: antigo.material,
      preco: antigo.preco !== undefined ? antigo.preco : 0,
      dano: antigo.dano_arma !== undefined ? antigo.dano_arma : antigo.dano,
      dano_arma: antigo.dano_arma !== undefined ? antigo.dano_arma : antigo.dano,
      resist: antigo.resist,
      tensao: antigo.tensao,
      prec: antigo.prec,
      rd_base: antigo.rd_base,
      rd_por_peca: antigo.rd_por_peca,
      efeito: antigo.efeito,
      efeito_resumo: antigo.efeito_resumo || antigo.efeito,
      efeito_completo: antigo.efeito_completo || antigo.efeito,
      requisitos: antigo.requisitos,
      is_raro: Boolean(antigo.is_epico || antigo.is_raro),
      is_epico: Boolean(antigo.is_epico),
      imagem_url: antigo.imagem_url,
      icone_tipo: antigo.icone_tipo,
    });
  };

  // 0. Se o item já está equipado no espaço de destino, não faz nada (evita duplicação no swap)
  if (slotDesejado && nomeLower) {
    const slotAtual = slotDesejado === 'armadura'
      ? (novaFicha.suporte.armadura as any)
      : (novaFicha.suporte.armamento as any)[slotDesejado];
    if (slotAtual?.nome && String(slotAtual.nome).trim().toLowerCase() === nomeLower) {
      return { fichaAtualizada: fichaService.calcularEngine(novaFicha), mensagem: `${nomeItem} já está equipado neste espaço.` };
    }
  }

  // 1. Remove ou decrementa o item equipado do inventário
  const itemIndex = inventario.findIndex((it) =>
    (itemMercadoria.id && it.id === itemMercadoria.id) ||
    it.item?.toLowerCase() === nomeLower
  );

  if (itemIndex >= 0) {
    const it = inventario[itemIndex];
    if (it.quantidade && it.quantidade > 1) {
      it.quantidade -= 1;
    } else {
      inventario.splice(itemIndex, 1);
    }
  }

  let mensagem = `Equipado: ${nomeItem}`;

  const isEscudo =
    cat === 'mercado_escudos' ||
    cat === 'epico_escudos' ||
    (cat === 'mercado_acessorios' && (nomeLower.includes('escudo') || tipoStr.includes('escudo'))) ||
    icone === 'shield' ||
    icone === 'shield_tower' ||
    tipoStr.includes('escudo') ||
    nomeLower.includes('escudo') ||
    ['broquel', 'rodado', 'targe', 'micênico', 'micenico', 'greco', 'heather', 'torre', 'gothic', 'pipa', 'pavise', 'golem', 'dragão', 'dragao'].some(s => tipoStr.includes(s) || nomeLower.includes(s));

  const isLd = (cat === 'mercado_ld' ||
    cat === 'epico_ld' ||
    icone === 'bow' ||
    icone === 'crossbow' ||
    itemMercadoria.tensao !== undefined ||
    tipoStr.includes('arco') ||
    tipoStr.includes('besta') ||
    nomeLower.includes('arco') ||
    nomeLower.includes('besta')) && !isEscudo;

  const isArma = (cat === 'mercado_armas' ||
    cat === 'epico_armas' ||
    itemMercadoria.dano !== undefined ||
    ['sword', 'dagger', 'axe', 'spear', 'mace'].includes(icone) ||
    /\barmas?\b/.test(tipoStr) ||
    nomeLower.includes('espada') ||
    nomeLower.includes('adaga') ||
    nomeLower.includes('machado') ||
    nomeLower.includes('lança') ||
    nomeLower.includes('lanca') ||
    nomeLower.includes('maça') ||
    nomeLower.includes('maca')) && !isEscudo;

  const isArmadura = !isEscudo && !isLd && !isArma && (
    cat === 'mercado_armaduras' ||
    cat === 'epico_armaduras' ||
    icone === 'armor' ||
    icone === 'armor_plate' ||
    icone === 'armor_mail' ||
    icone === 'armor_leather' ||
    Boolean(itemMercadoria.rd_por_peca) ||
    (itemMercadoria.rd_base && itemMercadoria.rd_base > 0 && !itemMercadoria.dano) ||
    nomeLower.includes('armadura') ||
    nomeLower.includes('couraça')
  );

  const isCorpoACorpo = isArma && !isLd && !isEscudo;

  // Valida se o tipo do item é compatível com o espaço de destino escolhido na ficha
  if (slotDesejado) {
    if (slotDesejado === 'armadura' && !isArmadura) {
      throw new Error('Apenas armaduras podem ser equipadas no espaço de Armadura.');
    }
    if (slotDesejado === 'arco_ld' && !isLd) {
      throw new Error('Apenas armas de Longa Distância (arcos e bestas) podem ser equipadas no espaço de Arco (LD).');
    }
    if (slotDesejado === 'arma_suporte' && !isEscudo) {
      throw new Error('Apenas escudos podem ser equipados no espaço de Escudo.');
    }
    if (slotDesejado === 'arma_primaria' && !isCorpoACorpo) {
      throw new Error('Apenas armas corpo a corpo podem ser equipadas na Arma Primária.');
    }
    if (slotDesejado === 'segunda_arma' && !(isCorpoACorpo || isEscudo)) {
      throw new Error('Apenas armas corpo a corpo ou escudos podem ser equipados na Segunda Arma.');
    }
  }

  const isSlotArmamento = slotDesejado === 'arma_primaria' || slotDesejado === 'segunda_arma' || slotDesejado === 'arma_suporte';

  if (isSlotArmamento) {
    const slotFinal: 'arma_primaria' | 'segunda_arma' | 'arma_suporte' = slotDesejado as any;
    // Swap inteligente: devolve o item que estava nesse slot
    devolverAoInventario(novaFicha.suporte.armamento[slotFinal], isEscudo ? 'mercado_acessorios' : 'mercado_armas');

    const danoRaw = itemMercadoria.dano !== undefined ? String(itemMercadoria.dano) : (isEscudo ? '0' : '25');
    const danoNum = parseInt(danoRaw.replace(/[^0-9-]/g, ''), 10) || 0;
    const danoNat = Number(novaFicha.suporte.dano_natural) || 0;

    if (isEscudo) {
      novaFicha.suporte.armamento[slotFinal] = {
        nome: nomeItem,
        dano: String(danoNum),
        dano_arma: String(danoNum),
        dano_total: danoNum > 0 ? String(danoNum + danoNat) : '0',
        resist: itemMercadoria.resist !== undefined ? itemMercadoria.resist : (itemMercadoria.rd_base || 20),
        peso: typeof itemMercadoria.peso === 'number' ? itemMercadoria.peso : parseFloat(String(itemMercadoria.peso || 0)) || 0,
        preco: itemMercadoria.preco !== undefined ? itemMercadoria.preco : 0,
        efeito: itemMercadoria.efeito || '+2 Bloqueio',
        efeito_resumo: itemMercadoria.efeito_resumo || itemMercadoria.efeito || '+2 Bloqueio',
        efeito_completo: itemMercadoria.efeito_completo || itemMercadoria.efeito || '+2 Bloqueio',
        categoria: 'Escudo',
        tipo: itemMercadoria.tipo || itemMercadoria.subcategoria || 'Escudo',
        subcategoria: itemMercadoria.subcategoria,
        material: itemMercadoria.material,
        citacao: itemMercadoria.citacao || itemMercadoria.informacoes,
        informacoes: itemMercadoria.informacoes || itemMercadoria.citacao,
        descricao: itemMercadoria.descricao || itemMercadoria.informacoes,
        is_epico: Boolean(itemMercadoria.is_epico),
        imagem_url: itemMercadoria.imagem_url,
        icone_tipo: itemMercadoria.icone_tipo || 'shield',
      };
      const slotLabel = slotFinal === 'arma_primaria' ? 'Arma Primária' : slotFinal === 'segunda_arma' ? 'Segunda Arma' : 'Arma de Suporte (Escudo)';
      mensagem = `${nomeItem} equipado em ${slotLabel}!`;
    } else {
      novaFicha.suporte.armamento[slotFinal] = {
        nome: nomeItem,
        dano: danoRaw,
        dano_arma: danoRaw,
        dano_total: String(danoNum + danoNat),
        resist: itemMercadoria.resist !== undefined ? itemMercadoria.resist : 15,
        peso: typeof itemMercadoria.peso === 'number' ? itemMercadoria.peso : parseFloat(String(itemMercadoria.peso || 0)) || 0,
        preco: itemMercadoria.preco !== undefined ? itemMercadoria.preco : 0,
        efeito: itemMercadoria.efeito_resumo || (itemMercadoria.efeito ? (itemMercadoria.efeito.length > 26 ? `${itemMercadoria.efeito.slice(0, 23)}...` : itemMercadoria.efeito) : ''),
        efeito_resumo: itemMercadoria.efeito_resumo || itemMercadoria.efeito || '',
        efeito_completo: itemMercadoria.efeito_completo || itemMercadoria.efeito || '',
        categoria: itemMercadoria.categoria || 'mercado_armas',
        tipo: itemMercadoria.tipo || itemMercadoria.subcategoria || 'Corpo a Corpo',
        subcategoria: itemMercadoria.subcategoria,
        material: itemMercadoria.material,
        citacao: itemMercadoria.citacao || itemMercadoria.informacoes,
        informacoes: itemMercadoria.informacoes || itemMercadoria.citacao,
        descricao: itemMercadoria.descricao || itemMercadoria.informacoes,
        is_epico: Boolean(itemMercadoria.is_epico),
        imagem_url: itemMercadoria.imagem_url,
        icone_tipo: itemMercadoria.icone_tipo || 'sword',
      };
      const slotLabel = slotFinal === 'arma_primaria' ? 'Arma Primária' : slotFinal === 'segunda_arma' ? 'Segunda Arma' : 'Arma de Suporte';
      mensagem = `${nomeItem} equipada em ${slotLabel}!`;
    }

  } else if (slotDesejado === 'armadura' || (!slotDesejado && isArmadura)) {
    // Swap de armadura
    devolverAoInventario(novaFicha.suporte.armadura, 'mercado_armaduras');

    const rdBase = itemMercadoria.rd_base || itemMercadoria.rd_por_peca?.couraca || 8;
    const isLeve = tipoStr.includes('leve') || (itemMercadoria.categoria as string) === 'mercado_armaduras_leves';
    const isMedia = tipoStr.includes('méd') || tipoStr.includes('med');
    const categoriaNormalizada: 'Leve' | 'Média' | 'Pesada' = isLeve ? 'Leve' : isMedia ? 'Média' : 'Pesada';

    let elmo = 0, gorjal = 0, couraca = 0, bracal = 0, manoplas = 0, coxote = 0, calca = 0, grevas = 0;

    if (itemMercadoria.rd_por_peca) {
      elmo = itemMercadoria.rd_por_peca.elmo || 0;
      gorjal = itemMercadoria.rd_por_peca.gorjal || 0;
      couraca = itemMercadoria.rd_por_peca.couraca || rdBase;
      bracal = itemMercadoria.rd_por_peca.bracal || 0;
      manoplas = itemMercadoria.rd_por_peca.manoplas || 0;
      coxote = itemMercadoria.rd_por_peca.coxote || 0;
      calca = itemMercadoria.rd_por_peca.calca || 0;
      grevas = itemMercadoria.rd_por_peca.grevas || 0;
    } else if (categoriaNormalizada === 'Leve') {
      couraca = rdBase;
      manoplas = Math.max(1, Math.floor(rdBase / 3));
      calca = Math.max(1, Math.floor(rdBase / 2));
      grevas = Math.max(1, Math.floor(rdBase / 3));
    } else if (categoriaNormalizada === 'Média') {
      couraca = rdBase;
      bracal = Math.max(1, Math.floor(rdBase / 2));
      manoplas = Math.max(1, Math.floor(rdBase / 3));
      coxote = Math.max(1, Math.floor(rdBase / 3));
      calca = Math.max(1, Math.floor(rdBase / 2));
      grevas = Math.max(1, Math.floor(rdBase / 3));
    } else {
      elmo = Math.max(1, Math.floor(rdBase / 4));
      gorjal = Math.max(1, Math.floor(rdBase / 2));
      couraca = rdBase;
      bracal = Math.max(1, Math.floor(rdBase / 2));
      manoplas = Math.max(1, Math.floor(rdBase / 3));
      coxote = Math.max(1, Math.floor(rdBase / 3));
      calca = Math.max(1, Math.floor(rdBase / 2));
      grevas = Math.max(1, Math.floor(rdBase / 3));
    }

    novaFicha.suporte.armadura = {
      nome: nomeItem,
      peso: typeof itemMercadoria.peso === 'number' ? itemMercadoria.peso : parseFloat(String(itemMercadoria.peso || 0)) || 0,
      tipo: categoriaNormalizada,
      material: itemMercadoria.material || '',
      efeito: itemMercadoria.efeito || '',
      requisitos: itemMercadoria.requisitos || '',
      descricao: itemMercadoria.descricao || itemMercadoria.informacoes || '',
      elmo,
      gorjal,
      couraca,
      bracal,
      manoplas,
      coxote,
      calca,
      grevas,
    };
    mensagem = `Armadura ${nomeItem} equipada com sucesso!`;

  } else if (slotDesejado === 'arco_ld' || (!slotDesejado && isLd)) {
    // Swap de arma longa distância
    devolverAoInventario(novaFicha.suporte.armamento.arco_ld, 'mercado_ld');

    const tensaoVal = typeof itemMercadoria.tensao === 'number' 
      ? itemMercadoria.tensao 
      : parseInt(String(itemMercadoria.tensao || '12').replace(/[^0-9-]/g, ''), 10) || 12;
    const precVal = typeof itemMercadoria.prec === 'number' 
      ? itemMercadoria.prec 
      : parseInt(String(itemMercadoria.prec || '1').replace(/[^0-9-]/g, ''), 10) || 1;
    const danoFlechaVal = String(itemMercadoria.dano || tensaoVal);

    novaFicha.suporte.armamento.arco_ld = {
      nome: nomeItem,
      dano: String(tensaoVal),
      dano_flecha: danoFlechaVal,
      dano_total: String(tensaoVal),
      tensao: tensaoVal,
      prec: precVal,
      peso: typeof itemMercadoria.peso === 'number' ? itemMercadoria.peso : parseFloat(String(itemMercadoria.peso || 0)) || 0,
      preco: itemMercadoria.preco !== undefined ? itemMercadoria.preco : 0,
      efeito: itemMercadoria.efeito_resumo || itemMercadoria.efeito || '',
      efeito_resumo: itemMercadoria.efeito_resumo || itemMercadoria.efeito || '',
      efeito_completo: itemMercadoria.efeito_completo || itemMercadoria.efeito || '',
      categoria: 'Arma de Disparo',
      tipo: itemMercadoria.tipo || itemMercadoria.subcategoria || 'Longa Distância',
      subcategoria: itemMercadoria.subcategoria,
      material: itemMercadoria.material,
      citacao: itemMercadoria.citacao || itemMercadoria.informacoes,
      informacoes: itemMercadoria.informacoes || itemMercadoria.citacao,
      descricao: itemMercadoria.descricao || itemMercadoria.informacoes,
      is_epico: Boolean(itemMercadoria.is_epico),
      imagem_url: itemMercadoria.imagem_url,
      icone_tipo: itemMercadoria.icone_tipo || 'bow',
    };
    mensagem = `${nomeItem} equipado no Armamento (Longa Distância)!`;

  } else if (!slotDesejado && isEscudo) {
    // Swap de escudo: padrão arma_suporte ou segunda_arma se arma_suporte estiver ocupada
    const slotEscudo = (novaFicha.suporte.armamento.arma_suporte?.nome && novaFicha.suporte.armamento.arma_suporte.nome !== 'Nenhuma' && (!novaFicha.suporte.armamento.segunda_arma?.nome || novaFicha.suporte.armamento.segunda_arma.nome === 'Nenhuma')) ? 'segunda_arma' : 'arma_suporte';
    devolverAoInventario(novaFicha.suporte.armamento[slotEscudo], 'mercado_acessorios');

    const danoRaw = itemMercadoria.dano !== undefined ? String(itemMercadoria.dano) : '0';
    const danoNum = parseInt(danoRaw.replace(/[^0-9-]/g, ''), 10) || 0;
    const danoNat = Number(novaFicha.suporte.dano_natural) || 0;

    novaFicha.suporte.armamento[slotEscudo] = {
      nome: nomeItem,
      dano: String(danoNum),
      dano_arma: String(danoNum),
      dano_total: danoNum > 0 ? String(danoNum + danoNat) : '0',
      resist: itemMercadoria.resist !== undefined ? itemMercadoria.resist : (itemMercadoria.rd_base || 20),
      peso: typeof itemMercadoria.peso === 'number' ? itemMercadoria.peso : parseFloat(String(itemMercadoria.peso || 0)) || 0,
      preco: itemMercadoria.preco !== undefined ? itemMercadoria.preco : 0,
      efeito: itemMercadoria.efeito || '+2 Bloqueio',
      efeito_resumo: itemMercadoria.efeito_resumo || itemMercadoria.efeito || '+2 Bloqueio',
      efeito_completo: itemMercadoria.efeito_completo || itemMercadoria.efeito || '+2 Bloqueio',
      categoria: 'Escudo',
      tipo: itemMercadoria.tipo || itemMercadoria.subcategoria || 'Escudo',
      subcategoria: itemMercadoria.subcategoria,
      material: itemMercadoria.material,
      citacao: itemMercadoria.citacao || itemMercadoria.informacoes,
      informacoes: itemMercadoria.informacoes || itemMercadoria.citacao,
      descricao: itemMercadoria.descricao || itemMercadoria.informacoes,
      is_epico: Boolean(itemMercadoria.is_epico),
      imagem_url: itemMercadoria.imagem_url,
      icone_tipo: itemMercadoria.icone_tipo || 'shield',
    };
    const slotLabel = slotEscudo === 'segunda_arma' ? 'Segunda Arma' : 'Escudo';
    mensagem = `${nomeItem} equipado em ${slotLabel}!`;

  } else if (!slotDesejado && isArma) {
    // Escolha do slot de arma padrão (arma_primaria ou segunda_arma; arma_suporte é exclusivo para Escudo)
    let slotFinal: 'arma_primaria' | 'segunda_arma' = 'arma_primaria';
    const arm = novaFicha.suporte.armamento;
    if (!arm.arma_primaria || !arm.arma_primaria.nome || arm.arma_primaria.nome === 'Nenhuma') {
      slotFinal = 'arma_primaria';
    } else if (!arm.segunda_arma || !arm.segunda_arma.nome || arm.segunda_arma.nome === 'Nenhuma') {
      slotFinal = 'segunda_arma';
    } else {
      slotFinal = 'arma_primaria';
    }

    // Devolve arma antiga no slot especificado
    devolverAoInventario(novaFicha.suporte.armamento[slotFinal], 'mercado_armas');

    const danoRaw = itemMercadoria.dano !== undefined ? String(itemMercadoria.dano) : '25';
    const danoNum = parseInt(danoRaw.replace(/[^0-9-]/g, ''), 10) || 25;
    const danoNat = Number(novaFicha.suporte.dano_natural) || 0;

    novaFicha.suporte.armamento[slotFinal] = {
      nome: nomeItem,
      dano: danoRaw,
      dano_arma: danoRaw,
      dano_total: String(danoNum + danoNat),
      resist: itemMercadoria.resist !== undefined ? itemMercadoria.resist : 15,
      peso: typeof itemMercadoria.peso === 'number' ? itemMercadoria.peso : parseFloat(String(itemMercadoria.peso || 0)) || 0,
      preco: itemMercadoria.preco !== undefined ? itemMercadoria.preco : 0,
      efeito: itemMercadoria.efeito_resumo || (itemMercadoria.efeito ? (itemMercadoria.efeito.length > 26 ? `${itemMercadoria.efeito.slice(0, 23)}...` : itemMercadoria.efeito) : ''),
      efeito_resumo: itemMercadoria.efeito_resumo || itemMercadoria.efeito || '',
      efeito_completo: itemMercadoria.efeito_completo || itemMercadoria.efeito || '',
      categoria: itemMercadoria.categoria || 'mercado_armas',
      tipo: itemMercadoria.tipo || itemMercadoria.subcategoria || 'Corpo a Corpo',
      subcategoria: itemMercadoria.subcategoria,
      material: itemMercadoria.material,
      citacao: itemMercadoria.citacao || itemMercadoria.informacoes,
      informacoes: itemMercadoria.informacoes || itemMercadoria.citacao,
      descricao: itemMercadoria.descricao || itemMercadoria.informacoes,
      is_epico: Boolean(itemMercadoria.is_epico),
      imagem_url: itemMercadoria.imagem_url,
      icone_tipo: itemMercadoria.icone_tipo || 'sword',
    };

    const slotLabel = slotFinal === 'arma_primaria' ? 'Arma Primária' : slotFinal === 'segunda_arma' ? 'Segunda Arma' : 'Arma de Suporte';
    mensagem = `${nomeItem} equipada em ${slotLabel}!`;

  } else {
    mensagem = `${nomeItem} ativado no inventário.`;
  }

  const fichaCalculada = fichaService.calcularEngine(novaFicha);
  return { fichaAtualizada: fichaCalculada, mensagem };
}

/**
 * Descarta (joga fora) uma mercadoria do inventário e recalcula a carga
 */
export function descartarItemDoInventario(
  ficha: FichaCompleta,
  itemMercadoria: any
): { fichaAtualizada: FichaCompleta; mensagem: string } {
  const novaFicha: FichaCompleta = JSON.parse(JSON.stringify(ficha));
  if (!novaFicha.suporte) return { fichaAtualizada: novaFicha, mensagem: 'Ficha sem suporte' };
  if (!novaFicha.suporte.inventario) {
    novaFicha.suporte.inventario = [];
  }

  const inventario = novaFicha.suporte.inventario;

  // Extrai identificadores de busca flexíveis
  const targetId = typeof itemMercadoria === 'string'
    ? itemMercadoria.trim()
    : String(itemMercadoria?.id || '').trim();

  const targetNome = typeof itemMercadoria === 'string'
    ? itemMercadoria.trim()
    : String(itemMercadoria?.nome || itemMercadoria?.item || '').trim();

  const targetNomeLower = targetNome.toLowerCase();
  const targetIdLower = targetId.toLowerCase();

  let descartado = false;
  let nomeItemFinal = targetNome || targetId || 'Mercadoria';

  // 1. Tenta encontrar e remover do inventário (por ID ou por Nome, insensível a maiúsculas/minúsculas)
  const itemIndex = inventario.findIndex((it) => {
    if (!it) return false;
    const itId = String(it.id || '').trim();
    const itIdLower = itId.toLowerCase();
    const itNome = String(it.item || it.nome || '').trim();
    const itNomeLower = itNome.toLowerCase();

    // Match direto por ID
    if (targetId && itId && (targetId === itId || targetIdLower === itIdLower)) {
      return true;
    }

    // Match exato por Nome (case-insensitive)
    if (targetNomeLower && itNomeLower && targetNomeLower === itNomeLower) {
      return true;
    }

    // Match caso targetId seja o slug do catálogo (ex: 'espada_longa_lyriana')
    if (targetIdLower && itNomeLower && targetIdLower.replace(/_/g, ' ') === itNomeLower) {
      return true;
    }

    // Match caso it.id ou targetId contenham um ao outro
    if (targetId && itId && (targetId.includes(itId) || itId.includes(targetId))) {
      return true;
    }

    // Comparação de substring se ambos os nomes forem descritivos
    if (targetNomeLower.length >= 4 && itNomeLower.length >= 4) {
      if (targetNomeLower.includes(itNomeLower) || itNomeLower.includes(targetNomeLower)) {
        return true;
      }
    }

    return false;
  });

  if (itemIndex >= 0) {
    const it = inventario[itemIndex];
    nomeItemFinal = it.item || it.nome || nomeItemFinal;
    if (it.quantidade && it.quantidade > 1) {
      it.quantidade -= 1;
    } else {
      inventario.splice(itemIndex, 1);
    }
    descartado = true;
  }

  // 2. Se for uma arma alocada em suporte.armamento, remove do slot também
  if (novaFicha.suporte.armamento) {
    const arm = novaFicha.suporte.armamento as any;
    (['arma_primaria', 'segunda_arma', 'arma_suporte', 'arco_ld'] as const).forEach((slotKey) => {
      const w = arm[slotKey];
      if (w && w.nome && w.nome !== 'Nenhuma') {
        const wNome = String(w.nome).trim().toLowerCase();
        const matchesSlot = targetId === `arma-${slotKey}`;
        const matchesName = targetNomeLower && (
          wNome === targetNomeLower ||
          wNome.includes(targetNomeLower) ||
          targetNomeLower.includes(wNome)
        );
        const matchesId = targetId && (w.id === targetId || String(w.id || '').toLowerCase() === targetIdLower);

        if (matchesSlot || matchesName || matchesId) {
          nomeItemFinal = w.nome || nomeItemFinal;
          arm[slotKey] = {
            nome: 'Nenhuma',
            dano: '0',
            dano_arma: '0',
            dano_total: '0',
            resist: 0,
            peso: 0,
            obs: '',
          };
          descartado = true;
        }
      }
    });
  }

  // 3. Se for uma armadura alocada em suporte.armadura, remove do slot
  if (novaFicha.suporte.armadura) {
    const armadura = novaFicha.suporte.armadura as any;
    if (armadura.nome && armadura.nome !== 'Nenhuma') {
      const aNome = String(armadura.nome).trim().toLowerCase();
      if (targetNomeLower && (aNome === targetNomeLower || targetIdLower === 'armadura')) {
        nomeItemFinal = armadura.nome || nomeItemFinal;
        armadura.nome = 'Nenhuma';
        armadura.peso = 0;
        armadura.tipo = 'Nenhuma';
        armadura.elmo = 0;
        armadura.gorjal = 0;
        armadura.couraca = 0;
        armadura.bracal = 0;
        armadura.manoplas = 0;
        armadura.coxote = 0;
        armadura.calca = 0;
        armadura.grevas = 0;
        descartado = true;
      }
    }
  }

  const fichaCalculada = fichaService.calcularEngine(novaFicha);
  return { fichaAtualizada: fichaCalculada, mensagem: `Mercadoria "${nomeItemFinal}" descartada com sucesso!` };
}

/**
 * Consome um item do inventário (poção de cura, vigor, etc.)
 */
export function consumirItemDoInventario(
  ficha: FichaCompleta,
  itemMercadoria: any
): { fichaAtualizada: FichaCompleta; mensagem: string } {
  const novaFicha: FichaCompleta = JSON.parse(JSON.stringify(ficha));
  if (!novaFicha.suporte?.inventario) return { fichaAtualizada: novaFicha, mensagem: 'Inventário vazio' };

  const inventario = novaFicha.suporte.inventario;
  const targetId = typeof itemMercadoria === 'string'
    ? itemMercadoria.trim()
    : String(itemMercadoria?.id || '').trim();

  const nomeItem = typeof itemMercadoria === 'string'
    ? itemMercadoria.trim()
    : String(itemMercadoria?.nome || itemMercadoria?.item || '').trim();
  const nomeLower = nomeItem.toLowerCase();
  const targetIdLower = targetId.toLowerCase();

  let efeitoTxt = `Item ${nomeItem} consumido!`;

  if (nomeLower.includes('cura') || nomeLower.includes('vida')) {
    const maxV = novaFicha.status.vida_max || 34;
    const curV = novaFicha.status.vida_atual || 0;
    const novaVida = Math.min(maxV, curV + 10);
    novaFicha.status.vida_atual = novaVida;
    efeitoTxt = `Poção ingerida! +10 PV restaurados (${novaVida}/${maxV})`;
  } else if (nomeLower.includes('vigor')) {
    const maxV = novaFicha.status.vigor_max || 16;
    const curV = novaFicha.status.vigor_atual || 0;
    const novoVigor = Math.min(maxV, curV + 10);
    novaFicha.status.vigor_atual = novoVigor;
    efeitoTxt = `Elixir ingerido! +10 Vigor restaurado (${novoVigor}/${maxV})`;
  } else if (nomeLower.includes('energia') || nomeLower.includes('mana') || nomeLower.includes('norfh')) {
    const maxE = novaFicha.status.energia_max || 20;
    const curE = novaFicha.status.energia_atual || 0;
    const novaEnergia = Math.min(maxE, curE + 10);
    novaFicha.status.energia_atual = novaEnergia;
    efeitoTxt = `Essência consumida! +10 Energia restaurada (${novaEnergia}/${maxE})`;
  }

  const itemIndex = inventario.findIndex((it) => {
    if (!it) return false;
    const itId = String(it.id || '').trim();
    const itNome = String(it.item || it.nome || '').trim().toLowerCase();
    if (targetId && itId && (targetId === itId || targetIdLower === itId.toLowerCase())) return true;
    if (nomeLower && itNome && (nomeLower === itNome || itNome.includes(nomeLower) || nomeLower.includes(itNome))) return true;
    return false;
  });

  if (itemIndex >= 0) {
    const it = inventario[itemIndex];
    if (it.quantidade && it.quantidade > 1) {
      it.quantidade -= 1;
    } else {
      inventario.splice(itemIndex, 1);
    }
  }

  const fichaCalculada = fichaService.calcularEngine(novaFicha);
  return { fichaAtualizada: fichaCalculada, mensagem: efeitoTxt };
}
