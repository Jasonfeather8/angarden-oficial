import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { GothicButton } from './GothicButton';
import { MercadoItem, CategoriaMercado } from '../types';
import { ItemIconVisual } from './ItemIconVisual';
import { GradeRdPecasArmadura, calcularRdPorPeca } from './GradeRdPecasArmadura';
import { enviarImagem } from '@/services/mediaService';
import {
  Swords,
  Shield,
  Crosshair,
  Sparkles,
  FlaskConical,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Coins,
  Weight,
  Hammer,
  ScrollText,
  Edit3
} from 'lucide-react';

export interface ModalCriarMercadoriaProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCriado: (novoItem: MercadoItem) => void;
  itemParaEdicao?: MercadoItem | null;
  onVoltar?: () => void;
}

// Subcategorias oficiais de Armas solicitadas pelo usuário
export const SUBCATEGORIAS_ARMAS = [
  { id: 'Armas Combate Curto (Cc)', label: 'Combate Curto (Cc)', desc: 'Adagas, facas e armas leves corpo a corpo' },
  { id: 'Armas Curtas', label: 'Armas Curtas', desc: 'Espadas curtas, machadinhas e maças leves' },
  { id: 'Armas Longas', label: 'Armas Longas', desc: 'Espadas bastardas, sabres e alfanges' },
  { id: 'Viper (V)', label: 'Viper (V)', desc: 'Lâminas ágeis, floretes e armas de estocada' },
  { id: 'Arma de Haste (AH)', label: 'Arma de Haste (AH)', desc: 'Lanças, alabardas, piques e tridentes' },
  { id: 'Destroyer (D)', label: 'Destroyer (D)', desc: 'Montantes, martelos de guerra e maças de duas mãos' },
  { id: 'Armas Kobudo (K)', label: 'Armas Kobudo (K)', desc: 'Armas exóticas marciais de treino e combate' },
] as const;

// Subcategorias oficiais de Longa Distância (LD)
export const SUBCATEGORIAS_LD = [
  { id: 'Arcos', label: 'Arcos', desc: 'Arcos curtos, longos, recurvos e compostos', icone: 'bow' },
  { id: 'Bestas', label: 'Bestas', desc: 'Bestas mecânicas, leves, pesadas e de repetição', icone: 'crossbow' },
  { id: 'Funda', label: 'Funda', desc: 'Tiras de couro para lançamento de pedras e chumbo', icone: 'bow' },
  { id: 'Bumerangue', label: 'Bumerangue', desc: 'Armas de arremesso recurvadas com retorno', icone: 'bow' },
  { id: 'Zarabatana', label: 'Zarabatana', desc: 'Tubos de sopro para dardos de precisão e veneno', icone: 'bow' },
  { id: 'Estilingue', label: 'Estilingue', desc: 'Atiradeiras com elástico para projéteis', icone: 'bow' },
] as const;

// Subcategorias oficiais de Armaduras
export const SUBCATEGORIAS_ARMADURAS = [
  { id: 'Armaduras Leves', label: 'Armaduras Leves', desc: '4 peças: Couraça, Manoplas, Calça, Grevas', icone: 'armor_leather', pecas: '4' },
  { id: 'Armaduras Médias', label: 'Armaduras Médias', desc: '6 peças: Couraça, Manoplas, Braçal, Calça, Coxote, Grevas', icone: 'armor_mail', pecas: '6' },
  { id: 'Armaduras Pesadas', label: 'Armaduras Pesadas', desc: '8 peças: Elmo, Gorjal, Couraça, Manoplas, Braçal, Calça, Coxote, Grevas', icone: 'armor_plate', pecas: '8' },
] as const;

// Subcategorias oficiais de Escudos
export const SUBCATEGORIAS_ESCUDOS = [
  { id: 'Broquel', label: 'Broquel', desc: 'Escudo leve de punho para deflexão rápida' },
  { id: 'Rodado', label: 'Rodado', desc: 'Escudo circular com umbo central' },
  { id: 'Targe', label: 'Targe', desc: 'Escudo redondo escocês tradicional reforçado' },
  { id: 'Micênico', label: 'Micênico', desc: 'Escudo em formato de oito de couro cru' },
  { id: 'Greco', label: 'Greco', desc: 'Hoplon clássico côncavo para formações falange' },
  { id: 'Heather', label: 'Heather', desc: 'Escudo aquecedor medieval triangular compacto' },
  { id: 'Torre', label: 'Torre', desc: 'Escudo pesado retangular de proteção maciça' },
  { id: 'Gothic', label: 'Gothic', desc: 'Escudo gótico ornamental com bordo pontiagudo' },
  { id: 'Pipa', label: 'Pipa', desc: 'Escudo amendoado com proteção de pernas para cavalaria' },
  { id: 'Pavise', label: 'Pavise', desc: 'Escudo grande fincado ao solo com suporte' },
  { id: 'Golem', label: 'Golem', desc: 'Escudo maciço esculpido em pedra rúnica' },
  { id: 'Dragão', label: 'Dragão', desc: 'Escudo forjado em escamas e ligas draconianas' },
] as const;

export const PECAS_POR_CATEGORIA_ARMADURA: Record<string, string> = {
  'Armaduras Leves': '4',
  'Armaduras Médias': '6',
  'Armaduras Pesadas': '8',
  'Leve': '4',
  'Média': '6',
  'Pesada': '8',
};

// Categorias gerais do Mercado
export const CATEGORIAS_MERCADO: { id: CategoriaMercado; label: string; icon: React.ReactNode }[] = [
  { id: 'mercado_armas', label: 'Armas', icon: <Swords size={16} /> },
  { id: 'mercado_armaduras', label: 'Armaduras', icon: <Shield size={16} /> },
  { id: 'mercado_ld', label: 'Longa Distância', icon: <Crosshair size={16} /> },
  { id: 'mercado_progeteis', label: 'Projéteis', icon: <Crosshair size={16} /> },
  { id: 'mercado_acessorios', label: 'Escudos', icon: <Shield size={16} /> },
  { id: 'mercado_geral', label: 'Poções', icon: <FlaskConical size={16} /> },
  { id: 'arsenal_epico', label: 'Arsenal Épico', icon: <Sparkles size={16} /> },
  { id: 'arcano_consumiveis', label: 'Variados/Consumíveis', icon: <FlaskConical size={16} /> },
  { id: 'arcano_pocoes', label: 'Poções', icon: <FlaskConical size={16} /> },
  { id: 'arcano_chapeus', label: 'Chapéus Mágicos', icon: <Sparkles size={16} /> },
  { id: 'arcano_aneis', label: 'Anéis', icon: <Sparkles size={16} /> },
  { id: 'arcano_cajados', label: 'Cajados', icon: <Sparkles size={16} /> },
  { id: 'arcano_vestimentas', label: 'Vestimentas', icon: <Sparkles size={16} /> },
  { id: 'arcano_colares', label: 'Colares', icon: <Sparkles size={16} /> },
  { id: 'arcano_talismas', label: 'Talismãs', icon: <Sparkles size={16} /> },
];

export const ModalCriarMercadoria: React.FC<ModalCriarMercadoriaProps> = ({
  isOpen,
  onClose,
  onItemCriado,
  itemParaEdicao,
  onVoltar,
}) => {
  // Categoria ativa
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaMercado>('mercado_armas');
  
  // Subcategoria de armas
  const [subcategoriaArma, setSubcategoriaArma] = useState<string>(SUBCATEGORIAS_ARMAS[0].id);

  // Subcategoria de longa distância (LD)
  const [subcategoriaLD, setSubcategoriaLD] = useState<string>(SUBCATEGORIAS_LD[0].id);

  // Subcategoria de armaduras
  const [subcategoriaArmadura, setSubcategoriaArmadura] = useState<string>(SUBCATEGORIAS_ARMADURAS[0].id);

  // Subcategoria de escudos
  const [subcategoriaEscudo, setSubcategoriaEscudo] = useState<string>(SUBCATEGORIAS_ESCUDOS[0].id);

  // Campos específicos de Armas: Nome | Tipo | Peso | Dano | Material | Resistência | Efeito | Preço
  const [nome, setNome] = useState('');
  const [peso, setPeso] = useState('2.5');
  const [dano, setDano] = useState('40');
  const [material, setMaterial] = useState('Aço Forjado & Empunhadura de Couro');
  const [resistencia, setResistencia] = useState('16');
  const [efeito, setEfeito] = useState('');
  const [preco, setPreco] = useState('250');
  const [isEpico, setIsEpico] = useState(false);

  // Campos específicos de Armaduras: Nome | Tipo | Peso | RD | Material | Peças | Efeito | Preço
  const [rdBase, setRdBase] = useState('8');
  const [pecas, setPecas] = useState(PECAS_POR_CATEGORIA_ARMADURA['Armaduras Leves']);

  // Campos específicos de Longa Distância (LD): Nome | Peso | Tensão | Prec | Material | Resist | Efeito | Preço
  const [tensao, setTensao] = useState('12');
  const [prec, setPrec] = useState('+2');

  // Campos específicos do Mercado Arcano
  const [alcance, setAlcance] = useState('');
  const [duracao, setDuracao] = useState('');
  const [consequencia, setConsequencia] = useState('');
  const [ativacao, setAtivacao] = useState('');
  const [gasto, setGasto] = useState('');
  const [carga, setCarga] = useState('');
  const [lr, setLr] = useState('');
  const [poder, setPoder] = useState('');
  const [recarga, setRecarga] = useState('');
  const [rm, setRm] = useState('');
  const [dependencia, setDependencia] = useState('');
  const [uso, setUso] = useState('');

  // Campo global: Informação da Mercadoria
  const [informacoes, setInformacoes] = useState('');

  // Imagem: upload ou URL
  const [imagemUrl, setImagemUrl] = useState<string>('');
  const [iconeTipo, setIconeTipo] = useState<string>('sword');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Efeito para sincronizar os campos com o item selecionado para edição (ou resetar para novo)
  useEffect(() => {
    if (!isOpen) return;

    if (itemParaEdicao) {
      setCategoriaSelecionada(itemParaEdicao.categoria || 'mercado_armas');
      setNome(itemParaEdicao.nome || '');
      setPeso(itemParaEdicao.peso !== undefined ? String(itemParaEdicao.peso) : '2.5');
      setPreco(itemParaEdicao.preco !== undefined ? String(itemParaEdicao.preco) : '250');
      setMaterial(itemParaEdicao.material || '');
      setEfeito(itemParaEdicao.efeito || '');
      setInformacoes(itemParaEdicao.informacoes || itemParaEdicao.descricao || '');
      setIsEpico(Boolean(itemParaEdicao.is_epico));
      setIconeTipo(itemParaEdicao.icone_tipo || 'sword');
      setImagemUrl(itemParaEdicao.imagem_url || '');
      setAlcance(itemParaEdicao.alcance || '');
      setDuracao(itemParaEdicao.duracao || '');
      setConsequencia(itemParaEdicao.consequencia || '');
      setAtivacao(itemParaEdicao.ativacao || '');
      setGasto(itemParaEdicao.gasto || '');
      setCarga(itemParaEdicao.carga || '');
      setLr(itemParaEdicao.lr || '');
      setPoder(itemParaEdicao.poder || '');
      setRecarga(itemParaEdicao.recarga || '');
      setRm(itemParaEdicao.rm || '');
      setDependencia(itemParaEdicao.dependencia || '');
      setUso(itemParaEdicao.uso || '');

      // Armaduras
      if (itemParaEdicao.categoria === 'mercado_armaduras') {
        setRdBase(itemParaEdicao.rd_base !== undefined ? String(itemParaEdicao.rd_base) : '8');
        const numPecas = itemParaEdicao.pecas
          ? (String(itemParaEdicao.pecas).match(/\d+/)?.[0] || String(itemParaEdicao.pecas))
          : '4';
        setPecas(numPecas);
        if (itemParaEdicao.subcategoria) {
          setSubcategoriaArmadura(itemParaEdicao.subcategoria);
        } else if (itemParaEdicao.tipo) {
          setSubcategoriaArmadura(itemParaEdicao.tipo);
        }
      } else {
        setRdBase('8');
        setPecas(PECAS_POR_CATEGORIA_ARMADURA['Armaduras Leves'] || '4');
      }

      // Longa Distância
      if (itemParaEdicao.categoria === 'mercado_ld') {
        setTensao(itemParaEdicao.tensao !== undefined ? String(itemParaEdicao.tensao) : '12');
        setPrec(itemParaEdicao.prec || '+2');
        if (itemParaEdicao.subcategoria) {
          setSubcategoriaLD(itemParaEdicao.subcategoria);
        } else if (itemParaEdicao.tipo) {
          setSubcategoriaLD(itemParaEdicao.tipo);
        }
        setDano(itemParaEdicao.dano || '20');
      } else {
        setTensao('12');
        setPrec('+2');
      }

      // Armas
      if (itemParaEdicao.categoria === 'mercado_armas' || !itemParaEdicao.categoria) {
        setDano(itemParaEdicao.dano || '40');
        setResistencia(itemParaEdicao.resist !== undefined ? String(itemParaEdicao.resist) : '16');
        if (itemParaEdicao.subcategoria) {
          setSubcategoriaArma(itemParaEdicao.subcategoria);
        } else if (itemParaEdicao.tipo) {
          setSubcategoriaArma(itemParaEdicao.tipo);
        }
      }

      // Escudos
      if (itemParaEdicao.categoria === 'mercado_acessorios') {
        setRdBase(itemParaEdicao.rd_base !== undefined ? String(itemParaEdicao.rd_base) : '4');
        if (itemParaEdicao.subcategoria) {
          setSubcategoriaEscudo(itemParaEdicao.subcategoria);
        } else if (itemParaEdicao.tipo) {
          setSubcategoriaEscudo(itemParaEdicao.tipo);
        }
      }
    } else {
      // Criação de nova mercadoria: valores padrão limpos
      setNome('');
      setEfeito('');
      setInformacoes('');
      setImagemUrl('');
      setPeso('2.5');
      setPreco('250');
      setMaterial('Aço Forjado & Empunhadura de Couro');
      setDano('40');
      setResistencia('16');
      setRdBase('8');
      setPecas(PECAS_POR_CATEGORIA_ARMADURA['Armaduras Leves'] || '4');
      setTensao('12');
      setPrec('+2');
      setAlcance('');
      setDuracao('');
      setConsequencia('');
      setAtivacao('');
      setGasto('');
      setCarga('');
      setLr('');
      setPoder('');
      setRecarga('');
      setRm('');
      setDependencia('');
      setUso('');
      setSubcategoriaEscudo(SUBCATEGORIAS_ESCUDOS[0].id);
      setIsEpico(false);
      setIconeTipo('sword');
    }
    setFormError(null);
    setUploadError(null);
  }, [isOpen, itemParaEdicao]);

  // Manipulador de upload de imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    // Limite de 3MB
    if (file.size > 3 * 1024 * 1024) {
      setUploadError('A imagem deve ter no máximo 3MB.');
      return;
    }

    try {
      const imageUrl = await enviarImagem(file, 'mercado', { maxWidth: 500, maxHeight: 500, quality: 0.82 });
      if (imageUrl) {
        setImagemUrl(imageUrl);
      }
    } catch {
      setUploadError('Erro ao carregar a imagem selecionada.');
    }
  };

  const handleRemoverImagem = () => {
    setImagemUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // RD por peça calculado em tempo real para pré-visualização e salvamento do Administrador
  const rdPorPecaCalculado = calcularRdPorPeca(Number(rdBase) || 0, pecas || subcategoriaArmadura);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nome.trim()) {
      setFormError('Informe o nome da mercadoria.');
      return;
    }

    const precoNum = Number(preco);
    if (isNaN(precoNum) || precoNum <= 0) {
      setFormError('Informe um preço válido em Moedas de ouro.');
      return;
    }

    const pesoNum = Number(peso);
    if (isNaN(pesoNum) || pesoNum < 0) {
      setFormError('Informe um peso numérico válido.');
      return;
    }

    const isArmadura = categoriaSelecionada === 'mercado_armaduras';
    const isLD = categoriaSelecionada === 'mercado_ld';
    const isEscudo = categoriaSelecionada === 'mercado_acessorios';
    const isArcano = categoriaSelecionada.startsWith('arcano_');

    let rdNum = 0;
    let resistNum = 0;

    if (isArmadura || isEscudo) {
      rdNum = Number(rdBase);
      if (isNaN(rdNum) || rdNum < 0) {
        setFormError('Informe um valor de RD válido.');
        return;
      }
    } else if (!isArcano) {
      resistNum = Number(resistencia);
      if (isNaN(resistNum) || resistNum < 0) {
        setFormError('Informe uma resistência válida.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Cria ou atualiza o item da mercadoria formatado
      const idNovo = itemParaEdicao?.id || `merc-${isArcano ? 'arcano' : isArmadura ? 'armad' : isLD ? 'ld' : isEscudo ? 'escudo' : 'arma'}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const efeitoFormatado = efeito.trim();
      const efeitoResumo = efeitoFormatado.length > 28 ? `${efeitoFormatado.slice(0, 25)}...` : efeitoFormatado;
      const tipoItem = isArmadura ? subcategoriaArmadura : isLD ? subcategoriaLD : isEscudo ? subcategoriaEscudo : subcategoriaArma;

      const iconeDefault = isArmadura
        ? (subcategoriaArmadura === 'Armaduras Leves' ? 'armor_leather' : subcategoriaArmadura === 'Armaduras Médias' ? 'armor_mail' : 'armor_plate')
        : isLD
        ? (subcategoriaLD === 'Bestas' ? 'crossbow' : 'bow')
        : isEscudo
        ? (subcategoriaEscudo === 'Torre' || subcategoriaEscudo === 'Pavise' || subcategoriaEscudo === 'Golem' ? 'shield_tower' : 'shield')
        : 'sword';

      const itemArcanoBase = itemParaEdicao?.categoria.startsWith('arcano_')
        ? { ...itemParaEdicao }
        : {};
      delete itemArcanoBase.alcance;
      delete itemArcanoBase.duracao;
      delete itemArcanoBase.consequencia;
      delete itemArcanoBase.ativacao;
      delete itemArcanoBase.gasto;
      delete itemArcanoBase.carga;
      delete itemArcanoBase.lr;
      delete itemArcanoBase.poder;
      delete itemArcanoBase.recarga;
      delete itemArcanoBase.rm;
      delete itemArcanoBase.dependencia;
      delete itemArcanoBase.uso;

      const novoItem: MercadoItem = {
        ...(isArcano ? itemArcanoBase : {}),
        id: idNovo,
        nome: nome.trim(),
        categoria: categoriaSelecionada,
        ...(isArcano
          ? {
              peso: pesoNum,
              efeito: efeitoFormatado,
              efeito_resumo: efeitoResumo,
              preco: precoNum,
              is_epico: isEpico,
              icone_tipo: iconeTipo || 'talisman',
              imagem_url: imagemUrl || undefined,
              informacoes: informacoes.trim() || undefined,
              descricao: informacoes.trim() || undefined,
              ...(categoriaSelecionada === 'arcano_consumiveis'
                ? { alcance: alcance.trim() || undefined, duracao: duracao.trim() || undefined }
                : categoriaSelecionada === 'arcano_pocoes'
                ? { consequencia: consequencia.trim() || undefined }
                : categoriaSelecionada === 'arcano_chapeus'
                ? { material: material.trim() || undefined }
                : categoriaSelecionada === 'arcano_aneis'
                ? {
                    ativacao: ativacao.trim() || undefined,
                    gasto: gasto.trim() || undefined,
                    carga: carga.trim() || undefined,
                    lr: lr.trim() || undefined,
                  }
                : categoriaSelecionada === 'arcano_cajados'
                ? {
                    carga: carga.trim() || undefined,
                    poder: poder.trim() || undefined,
                    recarga: recarga.trim() || undefined,
                  }
                : categoriaSelecionada === 'arcano_vestimentas'
                ? {
                    rm: rm.trim() || undefined,
                    gasto: gasto.trim() || undefined,
                    carga: carga.trim() || undefined,
                    lr: lr.trim() || undefined,
                  }
                : categoriaSelecionada === 'arcano_colares'
                ? { dependencia: dependencia.trim() || undefined }
                : { uso: uso.trim() || undefined }),
            }
          : {
              tipo: tipoItem,
              subcategoria: tipoItem,
              peso: pesoNum,
              material: material.trim(),
              resist: isArmadura || isEscudo ? undefined : resistNum,
              rd_base: isArmadura || isEscudo ? rdNum : undefined,
              rd_por_peca: isArmadura ? rdPorPecaCalculado : undefined,
              pecas: isArmadura ? (pecas.trim() || undefined) : undefined,
              efeito: efeitoFormatado,
              efeito_resumo: efeitoResumo,
              preco: precoNum,
              is_epico: isEpico,
              icone_tipo: iconeTipo || iconeDefault,
              imagem_url: imagemUrl || undefined,
              informacoes: informacoes.trim() || undefined,
              descricao: informacoes.trim()
                ? informacoes.trim()
                : isArmadura
                ? `${tipoItem}.${pecas.trim() ? ` Peças: ${pecas.trim()}.` : ''}${material ? ` Material: ${material.trim()}.` : ''} RD: +${rdNum}.${efeitoFormatado ? ` Efeito: ${efeitoFormatado}` : ''}`.trim()
                : isLD
                ? `${tipoItem}. Tensão: ${tensao.trim()}. Prec: ${prec.trim()}.${material ? ` Material: ${material.trim()}.` : ''}${efeitoFormatado ? ` Efeito: ${efeitoFormatado}` : ''}`.trim()
                : isEscudo
                ? `${tipoItem}.${material ? ` Material: ${material.trim()}.` : ''} RD: +${rdNum}.${efeitoFormatado ? ` Efeito: ${efeitoFormatado}` : ''}`.trim()
                : `${tipoItem}.${material ? ` Material: ${material.trim()}.` : ''}${efeitoFormatado ? ` Efeito: ${efeitoFormatado}` : ''}`.trim(),
              ...(isLD
                ? {
                    tensao: tensao.trim(),
                    prec: prec.trim(),
                    dano: subcategoriaLD === 'Bumerangue' ? (dano.trim() || '20') : tensao.trim(),
                  }
                : isArmadura || isEscudo
                ? {}
                : {
                    dano: dano.trim() || '20',
                  }),
            }),
      };

      onItemCriado(novoItem);
      
      // Limpa formulário
      setNome('');
      setEfeito('');
      setInformacoes('');
      setImagemUrl('');
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || (itemParaEdicao ? 'Erro ao salvar alterações.' : 'Erro ao cadastrar mercadoria.'));
      setIsSubmitting(false);
    }
  };

  const renderCampoArcano = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    multiline = false,
  ) => (
    <div className={multiline ? 'col-span-1 sm:col-span-2 space-y-1' : 'space-y-1'}>
      <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 outline-none transition-colors resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 outline-none transition-colors"
        />
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onBack={itemParaEdicao ? onVoltar : undefined}
      title={
        <div className="flex items-center gap-2 text-[#e6ddc5]">
          {itemParaEdicao ? (
            <Edit3 className="w-5 h-5 text-[#c5a059]" />
          ) : (
            <Hammer className="w-5 h-5 text-[#c5a059]" />
          )}
          <span>{itemParaEdicao ? 'Editar Mercadoria (Administrador)' : 'Criar Mercadoria (Administrador)'}</span>
        </div>
      }
      subtitle={
        itemParaEdicao
          ? 'Edite todos os campos e propriedades técnicas deste equipamento'
          : 'Cadastre novos equipamentos no mercado para ficarem disponíveis aos jogadores'
      }
      maxWidth="max-w-[680px]"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-serif text-[#dcd1ba]">
        
        {/* SELEÇÃO DE CATEGORIAS DO MERCADO */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-cinzel uppercase tracking-wider text-[#a88d61] font-semibold">
            1. Categoria do Mercado
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {CATEGORIAS_MERCADO.map((cat) => {
              const isSelected = categoriaSelecionada === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategoriaSelecionada(cat.id);
                    if (cat.id === 'mercado_armaduras') {
                      setPecas(PECAS_POR_CATEGORIA_ARMADURA[subcategoriaArmadura] || PECAS_POR_CATEGORIA_ARMADURA['Armaduras Leves']);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-all text-left font-cinzel text-[10px] cursor-pointer ${
                    isSelected
                      ? 'bg-[#3d2714] border-[#d4af37] text-[#f5ebd2] shadow-[0_0_8px_rgba(212,175,55,0.25)] font-bold'
                      : 'bg-[#120d09] border-[#382618] text-stone-400 hover:text-stone-200 hover:border-[#5a402a]'
                  }`}
                >
                  <span className={isSelected ? 'text-[#d4af37]' : 'text-stone-500'}>
                    {cat.icon}
                  </span>
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SUBCATEGORIAS DE ARMAS (Exibidas se categoria for Armas) */}
        {categoriaSelecionada === 'mercado_armas' && (
          <div className="space-y-1.5 bg-[#120e0a] border border-[#422c1b] p-3 rounded">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-cinzel uppercase tracking-wider text-[#c5a059] font-semibold flex items-center gap-1.5">
                <Layers size={13} />
                Subcategoria de Armas (Tipo)
              </label>
              <span className="text-[10px] text-stone-400 font-sans italic">Selecione o tipo exato da arma</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
              {SUBCATEGORIAS_ARMAS.map((sub) => {
                const isSelected = subcategoriaArma === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSubcategoriaArma(sub.id)}
                    className={`px-2 py-1.5 rounded border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2e1d0f] border-[#c5a059] text-[#fceecb] shadow-xs'
                        : 'bg-[#18110b] border-[#302013] text-stone-400 hover:text-stone-200 hover:border-[#4d3320]'
                    }`}
                  >
                    <div className="font-cinzel text-[11px] font-bold truncate">
                      {sub.label}
                    </div>
                    <div className="text-[9px] text-stone-500 truncate font-sans">
                      {sub.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBCATEGORIAS DE LONGA DISTÂNCIA (Exibidas se categoria for Longa Distância) */}
        {categoriaSelecionada === 'mercado_ld' && (
          <div className="space-y-1.5 bg-[#120e0a] border border-[#422c1b] p-3 rounded">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-cinzel uppercase tracking-wider text-[#c5a059] font-semibold flex items-center gap-1.5">
                <Crosshair size={13} />
                Subcategoria de Longa Distância (Tipo)
              </label>
              <span className="text-[10px] text-stone-400 font-sans italic">Selecione o tipo de armamento de alcance</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {SUBCATEGORIAS_LD.map((sub) => {
                const isSelected = subcategoriaLD === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setSubcategoriaLD(sub.id);
                      if (!imagemUrl) {
                        setIconeTipo(sub.icone);
                      }
                    }}
                    className={`px-3 py-2 rounded border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2e1d0f] border-[#c5a059] text-[#fceecb] shadow-xs'
                        : 'bg-[#18110b] border-[#302013] text-stone-400 hover:text-stone-200 hover:border-[#4d3320]'
                    }`}
                  >
                    <div className="font-cinzel text-[11px] font-bold truncate">
                      {sub.label}
                    </div>
                    <div className="text-[9px] text-stone-500 truncate font-sans">
                      {sub.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBCATEGORIAS DE ARMADURAS (Exibidas se categoria for Armaduras) */}
        {categoriaSelecionada === 'mercado_armaduras' && (
          <div className="space-y-1.5 bg-[#120e0a] border border-[#422c1b] p-3 rounded">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-cinzel uppercase tracking-wider text-[#c5a059] font-semibold flex items-center gap-1.5">
                <Shield size={13} />
                Subcategoria de Armaduras (Tipo)
              </label>
              <span className="text-[10px] text-stone-400 font-sans italic">Selecione o tipo de proteção</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {SUBCATEGORIAS_ARMADURAS.map((sub) => {
                const isSelected = subcategoriaArmadura === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setSubcategoriaArmadura(sub.id);
                      setPecas(PECAS_POR_CATEGORIA_ARMADURA[sub.id] || sub.pecas);
                      if (!imagemUrl) {
                        setIconeTipo(sub.icone);
                      }
                    }}
                    className={`px-3 py-2 rounded border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2e1d0f] border-[#c5a059] text-[#fceecb] shadow-xs'
                        : 'bg-[#18110b] border-[#302013] text-stone-400 hover:text-stone-200 hover:border-[#4d3320]'
                    }`}
                  >
                    <div className="font-cinzel text-[11px] font-bold truncate">
                      {sub.label}
                    </div>
                    <div className="text-[9px] text-stone-500 truncate font-sans">
                      {sub.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBCATEGORIAS DE ESCUDOS (Exibidas se categoria for Escudos/Acessórios) */}
        {categoriaSelecionada === 'mercado_acessorios' && (
          <div className="space-y-1.5 bg-[#120e0a] border border-[#422c1b] p-3 rounded">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-cinzel uppercase tracking-wider text-[#c5a059] font-semibold flex items-center gap-1.5">
                <Shield size={13} />
                Subcategoria de Escudos (Tipo)
              </label>
              <span className="text-[10px] text-stone-400 font-sans italic">Selecione o tipo de escudo</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {SUBCATEGORIAS_ESCUDOS.map((sub) => {
                const isSelected = subcategoriaEscudo === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setSubcategoriaEscudo(sub.id);
                      if (!imagemUrl) {
                        setIconeTipo(sub.id === 'Torre' || sub.id === 'Pavise' || sub.id === 'Golem' ? 'shield_tower' : 'shield');
                      }
                    }}
                    className={`px-3 py-2 rounded border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2e1d0f] border-[#c5a059] text-[#fceecb] shadow-xs'
                        : 'bg-[#18110b] border-[#302013] text-stone-400 hover:text-stone-200 hover:border-[#4d3320]'
                    }`}
                  >
                    <div className="font-cinzel text-[11px] font-bold truncate">
                      {sub.label}
                    </div>
                    <div className="text-[9px] text-stone-500 truncate font-sans">
                      {sub.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MENSAGEM DE ESCOPO ATUAL (SE OUTRA CATEGORIA SELECIONADA) */}
        {categoriaSelecionada !== 'mercado_armas' && categoriaSelecionada !== 'mercado_ld' && categoriaSelecionada !== 'mercado_armaduras' && categoriaSelecionada !== 'mercado_acessorios' && !categoriaSelecionada.startsWith('arcano_') && (
          <div className="p-2.5 rounded bg-[#18120b] border border-[#543b23] text-[#c5a059] text-[11px]">
            <p className="italic">
              * O fluxo detalhado de cadastro está ativado para as categorias <strong>Armas</strong>, <strong>Armaduras</strong>, <strong>Longa Distância (LD)</strong> e <strong>Escudos</strong> com suas subcategorias e especificações técnicas.
            </p>
          </div>
        )}

        {/* CAMPOS DA MERCADORIA */}
        <div className="space-y-3 pt-1">
          <h4 className="text-[11px] font-cinzel uppercase tracking-wider text-[#a88d61] font-semibold flex items-center gap-1.5">
            {categoriaSelecionada === 'mercado_armaduras' || categoriaSelecionada === 'mercado_acessorios' ? <Shield size={13} /> : categoriaSelecionada === 'mercado_ld' ? <Crosshair size={13} /> : <Swords size={13} />}
            2. Atributos da Mercadoria {categoriaSelecionada === 'mercado_armaduras' ? '(Armadura)' : categoriaSelecionada === 'mercado_ld' ? '(Longa Distância)' : categoriaSelecionada === 'mercado_acessorios' ? '(Escudo)' : ''}
          </h4>

          {categoriaSelecionada.startsWith('arcano_') ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {renderCampoArcano('Nome da Mercadoria *', nome, setNome)}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block flex items-center gap-1">
                  <Weight size={11} className="text-[#a88d61]" /> Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  min="0"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono outline-none transition-colors"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block flex items-center gap-1">
                  <Coins size={11} className="text-[#c5a059]" /> Preço (Moedas) *
                </label>
                <input
                  type="number"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="Ex: 250"
                  min="1"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono font-bold outline-none transition-colors"
                  required
                />
              </div>
              {categoriaSelecionada === 'arcano_consumiveis' && (
                <>
                  {renderCampoArcano('Alcance', alcance, setAlcance)}
                  {renderCampoArcano('Duração', duracao, setDuracao)}
                  {renderCampoArcano('Efeitos', efeito, setEfeito, true)}
                </>
              )}
              {categoriaSelecionada === 'arcano_pocoes' && (
                <>
                  {renderCampoArcano('Efeitos', efeito, setEfeito, true)}
                  {renderCampoArcano('Consequência', consequencia, setConsequencia, true)}
                </>
              )}
              {categoriaSelecionada === 'arcano_chapeus' && (
                <>
                  {renderCampoArcano('Material', material, setMaterial)}
                  {renderCampoArcano('Efeitos', efeito, setEfeito, true)}
                </>
              )}
              {categoriaSelecionada === 'arcano_aneis' && (
                <>
                  {renderCampoArcano('Ativação', ativacao, setAtivacao)}
                  {renderCampoArcano('Gasto', gasto, setGasto)}
                  {renderCampoArcano('Carga', carga, setCarga)}
                  {renderCampoArcano('LR', lr, setLr)}
                  {renderCampoArcano('Efeitos', efeito, setEfeito, true)}
                </>
              )}
              {categoriaSelecionada === 'arcano_cajados' && (
                <>
                  {renderCampoArcano('Carga', carga, setCarga)}
                  {renderCampoArcano('Poder', poder, setPoder)}
                  {renderCampoArcano('Recarga', recarga, setRecarga)}
                  {renderCampoArcano('Efeitos', efeito, setEfeito, true)}
                </>
              )}
              {categoriaSelecionada === 'arcano_vestimentas' && (
                <>
                  {renderCampoArcano('RM', rm, setRm)}
                  {renderCampoArcano('Gasto', gasto, setGasto)}
                  {renderCampoArcano('Carga', carga, setCarga)}
                  {renderCampoArcano('LR', lr, setLr)}
                  {renderCampoArcano('Efeitos', efeito, setEfeito, true)}
                </>
              )}
              {categoriaSelecionada === 'arcano_colares' && (
                <>
                  {renderCampoArcano('Dependência', dependencia, setDependencia, true)}
                  {renderCampoArcano('Efeitos', efeito, setEfeito, true)}
                </>
              )}
              {categoriaSelecionada === 'arcano_talismas' && (
                <>
                  {renderCampoArcano('Uso', uso, setUso, true)}
                  {renderCampoArcano('Efeitos', efeito, setEfeito, true)}
                </>
              )}
            </div>
          ) : categoriaSelecionada === 'mercado_acessorios' ? (
            /* CAMPOS ESPECÍFICOS DE ESCUDOS: Nome | Tipo | Peso | RD | Material | Efeito | Preço */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nome */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Nome da Mercadoria *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Broquel de Infantaria de Redânia"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 outline-none transition-colors"
                  required
                />
              </div>

              {/* Tipo (Subcategoria selecionada) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Tipo (Subcategoria)
                </label>
                <input
                  type="text"
                  value={subcategoriaEscudo}
                  readOnly
                  className="w-full bg-[#19120c] border border-[#3d2a1c] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] font-cinzel font-semibold outline-none cursor-not-allowed"
                />
              </div>

              {/* Peso (kg) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block flex items-center gap-1">
                  <Weight size={11} className="text-[#a88d61]" /> Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="Ex: 3.5"
                  min="0"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono outline-none transition-colors"
                  required
                />
              </div>

              {/* RD (Redução de Dano) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  RD (Redução de Dano) *
                </label>
                <input
                  type="number"
                  value={rdBase}
                  onChange={(e) => setRdBase(e.target.value)}
                  placeholder="Ex: 4"
                  min="0"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono font-bold outline-none transition-colors"
                  required
                />
              </div>

              {/* Material */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Material
                </label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Ex: Carvalho Rígido com Bordo Metálico"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 outline-none transition-colors"
                />
              </div>

              {/* Preço */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block flex items-center gap-1">
                  <Coins size={11} className="text-[#c5a059]" /> Preço (Moedas) *
                </label>
                <input
                  type="number"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="Ex: 260"
                  min="1"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono font-bold outline-none transition-colors"
                  required
                />
              </div>

              {/* Efeito */}
              <div className="col-span-1 sm:col-span-2 space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Efeitos
                </label>
                <textarea
                  value={efeito}
                  onChange={(e) => setEfeito(e.target.value)}
                  placeholder="Ex: +2 em Bloquear ataques físicos corporais."
                  rows={2}
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 outline-none transition-colors resize-none"
                />
                <p className="text-[10px] text-stone-500 italic">
                  * Na ficha do personagem, o efeito aparecerá de forma resumida, com acesso aos detalhes completos ao clicar no item.
                </p>
              </div>
            </div>
          ) : categoriaSelecionada === 'mercado_armaduras' ? (
            /* CAMPOS ESPECÍFICOS DE ARMADURAS: Nome | Tipo | Peso | RD | Material | Peças | Efeito | Preço */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nome */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Nome da Mercadoria *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Cota de Malha Real de Aedirn"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 outline-none transition-colors"
                  required
                />
              </div>

              {/* Tipo (Subcategoria selecionada) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Tipo (Subcategoria)
                </label>
                <input
                  type="text"
                  value={subcategoriaArmadura}
                  readOnly
                  className="w-full bg-[#19120c] border border-[#3d2a1c] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] font-cinzel font-semibold outline-none cursor-not-allowed"
                />
              </div>

              {/* Peso (kg) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block flex items-center gap-1">
                  <Weight size={11} className="text-[#a88d61]" /> Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="Ex: 8.5"
                  min="0"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono outline-none transition-colors"
                  required
                />
              </div>

              {/* RD (Redução de Dano) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  RD (Redução de Dano) *
                </label>
                <input
                  type="number"
                  value={rdBase}
                  onChange={(e) => setRdBase(e.target.value)}
                  placeholder="Ex: 8"
                  min="0"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono font-bold outline-none transition-colors"
                  required
                />
              </div>

              {/* Material */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Material
                </label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Ex: Anéis de Aço Negro Trançados"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 outline-none transition-colors"
                />
              </div>

              {/* Peças (somente o número: 4, 6, 8) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Peças Protegidas *
                </label>
                <input
                  type="number"
                  value={pecas}
                  onChange={(e) => setPecas(e.target.value)}
                  placeholder="Ex: 4, 6 ou 8"
                  min="1"
                  max="8"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono font-bold outline-none transition-colors"
                />
              </div>

              {/* Distribuição de RD por Peça (Pré-visualização em Tempo Real) */}
              <div className="col-span-1 sm:col-span-2 p-3 bg-[#100c08] border border-[#3d2a1c] rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-cinzel tracking-wider text-[#c5a059] font-bold flex items-center gap-1.5">
                    <Shield size={12} className="text-[#c5a059]" />
                    Distribuição de RD por Peça (Pré-visualização em Tempo Real)
                  </span>
                  <span className="text-[9.5px] text-stone-400 font-sans italic">
                    {pecas || (subcategoriaArmadura.includes('Leve') ? '4' : subcategoriaArmadura.includes('Méd') ? '6' : '8')} peças protegidas
                  </span>
                </div>
                <GradeRdPecasArmadura rdPorPeca={rdPorPecaCalculado} />
              </div>

              {/* Efeito */}
              <div className="col-span-1 sm:col-span-2 space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Efeitos
                </label>
                <textarea
                  value={efeito}
                  onChange={(e) => setEfeito(e.target.value)}
                  placeholder="Ex: Flexibilidade (+1 em Esquiva contra ataques de corte)."
                  rows={2}
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 outline-none transition-colors resize-none"
                />
                <p className="text-[10px] text-stone-500 italic">
                  * Na ficha do personagem, o efeito aparecerá de forma resumida, com acesso aos detalhes completos ao clicar no item.
                </p>
              </div>

              {/* Preço */}
              <div className="col-span-1 sm:col-span-2 space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block flex items-center gap-1">
                  <Coins size={11} className="text-[#c5a059]" /> Preço (Moedas) *
                </label>
                <input
                  type="number"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="Ex: 650"
                  min="1"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono font-bold outline-none transition-colors"
                  required
                />
              </div>
            </div>
          ) : categoriaSelecionada === 'mercado_ld' ? (
            /* CAMPOS ESPECÍFICOS DE LONGA DISTÂNCIA (LD): Nome | Peso | Tensão | Prec | Material | Resist | Efeito | Preço */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nome */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Nome da Mercadoria *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Besta de Cerco Real ou Arco Élfico"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 outline-none transition-colors"
                  required
                />
              </div>

              {/* Tipo (Subcategoria) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Tipo (Subcategoria)
                </label>
                <input
                  type="text"
                  value={subcategoriaLD}
                  readOnly
                  className="w-full bg-[#19120c] border border-[#3d2a1c] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] font-cinzel font-semibold outline-none cursor-not-allowed"
                />
              </div>

              {/* Peso */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block flex items-center gap-1">
                  <Weight size={11} className="text-[#a88d61]" /> Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="Ex: 3.5"
                  min="0"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono outline-none transition-colors"
                  required
                />
              </div>

              {/* Tensão */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Tensão *
                </label>
                <input
                  type="text"
                  value={tensao}
                  onChange={(e) => setTensao(e.target.value)}
                  placeholder="Ex: 12 ou 16"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono font-bold outline-none transition-colors"
                  required
                />
              </div>

              {/* Dano (Exclusivo para Bumerangue em Longa Distância) */}
              {subcategoriaLD === 'Bumerangue' && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                    Dano *
                  </label>
                  <input
                    type="text"
                    value={dano}
                    onChange={(e) => setDano(e.target.value)}
                    placeholder="Ex: 25 ou 1d8+2"
                    className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono font-bold outline-none transition-colors"
                    required
                  />
                </div>
              )}

              {/* Prec (Precisão) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Prec (Precisão) *
                </label>
                <input
                  type="text"
                  value={prec}
                  onChange={(e) => setPrec(e.target.value)}
                  placeholder="Ex: +2 ou 3"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono font-bold outline-none transition-colors"
                  required
                />
              </div>

              {/* Resist (Resistência) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Resistência (Resist) *
                </label>
                <input
                  type="number"
                  value={resistencia}
                  onChange={(e) => setResistencia(e.target.value)}
                  placeholder="Ex: 14"
                  min="0"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono font-bold outline-none transition-colors"
                  required
                />
              </div>

              {/* Preço */}
              <div className="col-span-1 sm:col-span-2 space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block flex items-center gap-1">
                  <Coins size={11} className="text-[#c5a059]" /> Preço (Moedas) *
                </label>
                <input
                  type="number"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="Ex: 300"
                  min="1"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono font-bold outline-none transition-colors"
                  required
                />
              </div>

              {/* Material */}
              <div className="col-span-1 sm:col-span-2 space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Material
                </label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Ex: Madeira de Teixo & Mecanismo de Aço"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 outline-none transition-colors"
                />
              </div>

              {/* Efeito */}
              <div className="col-span-1 sm:col-span-2 space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Efeitos
                </label>
                <textarea
                  value={efeito}
                  onChange={(e) => setEfeito(e.target.value)}
                  placeholder="Ex: Perfuração de Armadura (ignora 2 RD)."
                  rows={2}
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 outline-none transition-colors resize-none"
                />
                <p className="text-[10px] text-stone-500 italic">
                  * Na ficha do personagem, o efeito aparecerá de forma resumida na linha do armamento, com acesso aos detalhes completos ao clicar no ícone de visualização.
                </p>
              </div>
            </div>
          ) : (
            /* CAMPOS DAS ARMAS: Nome | Tipo | Peso | Dano | Material | Resistência | Efeito | Preço */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nome */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Nome da Mercadoria *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Espada Longa de Aço Lyriano"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 outline-none transition-colors"
                  required
                />
              </div>

              {/* Tipo (Subcategoria selecionada) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Tipo (Subcategoria)
                </label>
                <input
                  type="text"
                  value={subcategoriaArma}
                  readOnly
                  className="w-full bg-[#19120c] border border-[#3d2a1c] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] font-cinzel font-semibold outline-none cursor-not-allowed"
                />
              </div>

              {/* Dano */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Dano da Arma
                </label>
                <input
                  type="text"
                  value={dano}
                  onChange={(e) => setDano(e.target.value)}
                  placeholder="Ex: 40, 50 ou 2d6+4"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono font-bold outline-none transition-colors"
                />
              </div>

              {/* Resistência */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Resistência (Resist)
                </label>
                <input
                  type="number"
                  value={resistencia}
                  onChange={(e) => setResistencia(e.target.value)}
                  placeholder="Ex: 16"
                  min="0"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono font-bold outline-none transition-colors"
                />
              </div>

              {/* Peso */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block flex items-center gap-1">
                  <Weight size={11} className="text-[#a88d61]" /> Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="Ex: 2.5"
                  min="0"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono outline-none transition-colors"
                />
              </div>

              {/* Preço */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block flex items-center gap-1">
                  <Coins size={11} className="text-[#c5a059]" /> Preço (Moedas) *
                </label>
                <input
                  type="number"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="Ex: 350"
                  min="1"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 font-mono font-bold outline-none transition-colors"
                  required
                />
              </div>

              {/* Material */}
              <div className="col-span-1 sm:col-span-2 space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Material / Composição
                </label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Ex: Aço Temperado & Empunhadura de Ouro"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 outline-none transition-colors"
                />
              </div>

              {/* Efeito Completo */}
              <div className="col-span-1 sm:col-span-2 space-y-1">
                <label className="text-[10px] uppercase font-cinzel tracking-wider text-[#a88d61] font-semibold block">
                  Efeitos
                </label>
                <textarea
                  value={efeito}
                  onChange={(e) => setEfeito(e.target.value)}
                  placeholder="Ex: Crítico Aprimorado (19-20). Ao desferir um golpe certeiro, causa dano extra contra alvos com armadura leve."
                  rows={2}
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] placeholder:text-stone-600 outline-none transition-colors resize-none"
                />
                <p className="text-[10px] text-stone-500 italic">
                  * Na ficha do personagem, o efeito aparecerá de forma resumida na linha do armamento, com acesso aos detalhes completos ao clicar no ícone de visualização.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CAMPO GLOBAL: Informação da Mercadoria */}
        <div className="space-y-1.5 bg-[#100c08] border border-[#3d2a1c] p-3 rounded">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-cinzel uppercase tracking-wider text-[#c5a059] font-semibold flex items-center gap-1.5">
              <ScrollText size={13} />
              Informação da Mercadoria (Descrição / Lore)
            </label>
            <span className="text-[9px] text-stone-400 font-sans italic">Campo global para todos os itens</span>
          </div>
          <textarea
            value={informacoes}
            onChange={(e) => setInformacoes(e.target.value)}
            placeholder="Ex: Forjada sob encomenda para a guarda real, com runas de proteção e acabamento em aço nobre..."
            rows={2}
            className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 text-xs text-[#e6ddc5] outline-none transition-colors resize-none"
          />
          <p className="text-[10px] text-stone-500 italic">
            * Informações complementares, história ou notas técnicas exibidas em destaque nos detalhes do item.
          </p>
        </div>

        {/* 3. FUNÇÃO DE ADICIONAR IMAGEM */}
        <div className="space-y-2 pt-1 bg-[#100c08] border border-[#3d2a1c] p-3 rounded">
          <label className="text-[11px] font-cinzel uppercase tracking-wider text-[#c5a059] font-semibold flex items-center gap-1.5">
            <ImageIcon size={13} />
            3. Imagem da Mercadoria
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Moldura de Pré-visualização Ornamental */}
            <div
              className="w-20 h-20 rounded-xs flex items-center justify-center relative flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #3a4550 0%, #20272f 50%, #11151a 100%)',
                border: '1.5px solid #526373',
                boxShadow: '0 3px 8px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.18)',
                padding: '2px',
              }}
            >
              <div
                className="relative w-full h-full rounded-xs overflow-hidden flex items-center justify-center"
                style={{
                  border: '1px solid #8c6b41',
                  boxShadow: 'inset 0 0 6px rgba(0,0,0,0.9)',
                  background: 'radial-gradient(circle at center, #232c35 0%, #0d1115 100%)',
                }}
              >
                <ItemIconVisual type={iconeTipo} imageUrl={imagemUrl} className="w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_5px_rgba(0,0,0,0.7)]" />
              </div>
              {imagemUrl && (
                <button
                  type="button"
                  onClick={handleRemoverImagem}
                  title="Remover imagem"
                  className="absolute -top-1.5 -right-1.5 bg-red-900 border border-red-500 text-white rounded-full p-0.5 hover:bg-red-700 cursor-pointer z-30"
                >
                  <X size={10} />
                </button>
              )}
            </div>

            {/* Controles de Upload e URL */}
            <div className="flex-1 w-full space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="mercadoria-file-upload"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded bg-[#241a12] hover:bg-[#342417] border border-[#5a4225] text-[#f5ebd2] font-cinzel text-[11px] cursor-pointer transition-colors"
                >
                  <Upload size={13} />
                  Carregar Imagem do Dispositivo
                </button>

                {imagemUrl && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Imagem carregada
                  </span>
                )}
              </div>

              <p className="text-[10px] text-stone-400 font-serif">
                <span className="text-[#a88d61] font-cinzel font-semibold">Formato Padrão:</span> Proporção <strong className="text-[#e6ddc5]">1:1 quadrada</strong> (recomendado: 128×128 ou 256×256 px). Imagens com fundo preenchem a moldura de forma uniforme e elegante.
              </p>

              {/* Ou link / URL */}
              <div className="flex items-center gap-1.5">
                <input
                  type="url"
                  value={imagemUrl.startsWith('data:') ? '' : imagemUrl}
                  onChange={(e) => setImagemUrl(e.target.value)}
                  placeholder="Ou cole a URL direta de uma imagem web (https://...)"
                  className="w-full bg-[#120d09] border border-[#3d2a1c] focus:border-[#c5a059] rounded px-2.5 py-1.5 sm:py-1 text-[11px] text-[#e6ddc5] placeholder:text-stone-600 outline-none"
                />
              </div>

              {/* Seletor de Ícone Visual Padrão */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5">
                <span className="text-[10px] text-stone-500 font-sans w-full sm:w-auto">Ícone padrão se sem imagem:</span>
                {(['sword', 'dagger', 'axe', 'spear', 'mace'] as const).map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIconeTipo(ic)}
                    className={`px-2 py-1 sm:px-1.5 sm:py-0.5 rounded text-[10px] font-mono capitalize border cursor-pointer min-h-[26px] ${
                      iconeTipo === ic && !imagemUrl
                        ? 'bg-[#3d2714] border-[#c5a059] text-[#e6ddc5] font-bold'
                        : 'bg-[#18110b] border-[#2e1f14] text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>

              {uploadError && (
                <p className="text-[10px] text-red-400 flex items-center gap-1">
                  <AlertCircle size={11} /> {uploadError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* MARCADOR ITEM ÉPICO */}
        <div className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            id="checkbox-item-epico"
            checked={isEpico}
            onChange={(e) => setIsEpico(e.target.checked)}
            className="rounded border-[#5a4225] bg-[#1a120b] text-amber-500 focus:ring-0 cursor-pointer w-4 h-4"
          />
          <label htmlFor="checkbox-item-epico" className="text-[11px] text-[#f3ebd3] font-cinzel cursor-pointer flex items-center gap-1.5">
            <Sparkles size={12} className={isEpico ? 'text-amber-400' : 'text-stone-500'} />
            Classificar como Mercadoria do Arsenal Épico
          </label>
        </div>

        {/* FEEDBACK DE ERRO */}
        {formError && (
          <div className="p-2 rounded bg-red-950/60 border border-red-600/80 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0 text-red-400" />
            <span>{formError}</span>
          </div>
        )}

        {/* BOTÕES DE AÇÃO */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-2 pt-2 border-t border-[#382618]">
          <GothicButton
            type="button"
            onClick={onClose}
            variant="secondary"
            size="sm"
            width="auto"
            height={36}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancelar
          </GothicButton>

          <GothicButton
            type="submit"
            variant="primary"
            size="sm"
            width={200}
            height={38}
            className="w-full sm:w-auto order-1 sm:order-2"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? itemParaEdicao
                ? 'Salvando...'
                : 'Cadastrando...'
              : itemParaEdicao
              ? 'Salvar Alterações'
              : 'Cadastrar no Mercado'}
          </GothicButton>
        </div>
      </form>
    </Modal>
  );
};
