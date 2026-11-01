export interface FichaTheme {
  id: string;
  name: string;
  description: string;
  previewColor: string;
  pageWrapper: string;
  paperOverlay: string;
  bannerBg: string;
  boxBg: string;
  boxBgLight: string;
  inputBg: string;
  textTitle: string;
  textSubtitle: string;
  textBody: string;
  textMuted: string;
  badgeBorder: string;
  badgeBg: string;
  attrCardBg: string;
  attrInnerBox: string;
  attrBottomPill: string;
  tableHeader: string;
  tableRowEven: string;
  tableRowOdd: string;
  tableBorder: string;
  headerBarBg: string;
  headerBorder: string;
  btnSecondary: string;
  btnPrimary: string;
  brandAccent: string;
  isDark: boolean;
}

export const FICHA_THEMES: Record<string, FichaTheme> = {
  sistema: {
    id: 'sistema',
    name: 'Padrão do Sistema (Medieval Dark & Ouro)',
    description: 'Estilo padrão com a identidade visual sombria e refinada em ouro e ferro envelhecido.',
    previewColor: '#8c6b41',
    isDark: true,
    pageWrapper: 'relative bg-[#0d0a07] border-2 border-[#8c6b41] rounded-xs shadow-[0_0_30px_rgba(140,107,65,0.25)] p-4 sm:p-6 text-[#e6ddc5] overflow-hidden',
    paperOverlay: 'absolute inset-0 bg-[#140f0a]/95 pointer-events-none z-0',
    bannerBg: 'bg-gradient-to-r from-[#5a4225] via-[#8c6b41] to-[#5a4225] text-[#fbf6e2] shadow-sm',
    boxBg: 'bg-[#18120c] border-2 border-[#8c6b41] text-[#f2dfa8]',
    boxBgLight: 'bg-[#1f1710] border border-[#8c6b41]/60 text-[#f2dfa8]',
    inputBg: 'bg-transparent text-[#f2dfa8]',
    textTitle: 'text-[#f2dfa8]',
    textSubtitle: 'text-[#d5c7a3]',
    textBody: 'text-[#e6ddc5]',
    textMuted: 'text-[#a89776]',
    badgeBorder: 'border-[#8c6b41]',
    badgeBg: 'bg-[#2a1d10]',
    attrCardBg: 'bg-gradient-to-b from-[#2e2114] to-[#1c140d] border border-[#8c6b41]',
    attrInnerBox: 'bg-[#3d2c1b]/80 border border-[#a88242]/40 text-[#f2dfa8]',
    attrBottomPill: 'bg-[#18120c] border-2 border-[#8c6b41] text-[#f2dfa8]',
    tableHeader: 'bg-[#2a1d10] border-b-2 border-[#8c6b41] text-[#f2dfa8]',
    tableRowEven: 'bg-[#18120c]',
    tableRowOdd: 'bg-[#130d08]',
    tableBorder: 'border-[#5a4225]',
    headerBarBg: 'bg-[#120e0a]',
    headerBorder: 'border-[#8c6b41]',
    btnSecondary: 'border-[#8c6b41] bg-[#2a1d10] hover:bg-[#3d2a17] text-[#f2dfa8] hover:text-white',
    btnPrimary: 'border-[#d4af37] bg-[#8c6b41] hover:bg-[#a88242] text-white shadow-[0_0_12px_rgba(168,130,66,0.4)]',
    brandAccent: 'text-[#f2dfa8]',
  },
  angarden_oficial: {
    id: 'angarden_oficial',
    name: 'Oficial Angarden (Turquesa & Papel Claro)',
    description: 'Paleta canônica do livro de Angarden com tons turquesa vibrante e pergaminho claro.',
    previewColor: '#00a8a8',
    isDark: false,
    pageWrapper: 'relative bg-[#051114] border-2 border-[#00a8a8] rounded-xs shadow-[0_0_30px_rgba(0,166,166,0.2)] p-4 sm:p-6 text-[#0d2e33] overflow-hidden',
    paperOverlay: 'absolute inset-0 bg-[#e7eff1] pointer-events-none opacity-98 z-0',
    bannerBg: 'bg-[#00a8a8] text-white shadow-sm',
    boxBg: 'bg-white border-2 border-[#00a8a8] text-[#08272c]',
    boxBgLight: 'bg-white border border-[#00a8a8] text-[#08272c]',
    inputBg: 'bg-transparent text-[#0e3b43]',
    textTitle: 'text-[#08272c]',
    textSubtitle: 'text-[#0d3b42]',
    textBody: 'text-[#0e3b43]',
    textMuted: 'text-[#08272c]',
    badgeBorder: 'border-[#00a8a8]',
    badgeBg: 'bg-[#e0f0f2]',
    attrCardBg: 'bg-[#00a8a8]',
    attrInnerBox: 'bg-[#3ec5c5]/40 border border-white/20 text-white',
    attrBottomPill: 'bg-[#f0f4f8] border-2 border-[#00a8a8] text-[#08272c]',
    tableHeader: 'bg-[#00a8a8] border-b-2 border-[#005f5f] text-white',
    tableRowEven: 'bg-white',
    tableRowOdd: 'bg-[#f4f8f9]',
    tableBorder: 'border-[#00a8a8]',
    headerBarBg: 'bg-[#041012]',
    headerBorder: 'border-[#005f5f]',
    btnSecondary: 'border-[#008f8f] bg-[#0c2428] hover:bg-[#12363c] text-[#7ee3e3] hover:text-white',
    btnPrimary: 'border-[#00c8c8] bg-[#008f8f] hover:bg-[#00a8a8] text-white shadow-[0_0_12px_rgba(0,166,166,0.4)]',
    brandAccent: 'text-[#00c8c8]',
  },
  pergaminho_classico: {
    id: 'pergaminho_classico',
    name: 'Pergaminho Rústico (Sépia & Couro)',
    description: 'Textura clássica de pergaminho antigo de taverna e biblioteca arcana.',
    previewColor: '#7a4c25',
    isDark: false,
    pageWrapper: 'relative bg-[#1f1812] border-2 border-[#b38b4d] rounded-xs shadow-[0_0_30px_rgba(179,139,77,0.2)] p-4 sm:p-6 text-[#3b2b1b] overflow-hidden',
    paperOverlay: 'absolute inset-0 bg-[#f7efe0] pointer-events-none opacity-98 z-0',
    bannerBg: 'bg-[#7a4c25] text-[#fef9f2] shadow-sm',
    boxBg: 'bg-[#fdf9f0] border-2 border-[#7a4c25] text-[#2c1d0f]',
    boxBgLight: 'bg-[#fdf9f0] border border-[#a87441] text-[#2c1d0f]',
    inputBg: 'bg-transparent text-[#2c1d0f]',
    textTitle: 'text-[#2c1d0f]',
    textSubtitle: 'text-[#5a3a1d]',
    textBody: 'text-[#3b2b1b]',
    textMuted: 'text-[#7a5735]',
    badgeBorder: 'border-[#7a4c25]',
    badgeBg: 'bg-[#faebd7]',
    attrCardBg: 'bg-[#7a4c25]',
    attrInnerBox: 'bg-[#9c6637]/40 border border-[#fef9f2]/30 text-[#fff]',
    attrBottomPill: 'bg-[#f5ecda] border-2 border-[#7a4c25] text-[#2c1d0f]',
    tableHeader: 'bg-[#7a4c25] border-b-2 border-[#5a3a1d] text-[#fef9f2]',
    tableRowEven: 'bg-[#fdf9f0]',
    tableRowOdd: 'bg-[#f5ecda]',
    tableBorder: 'border-[#7a4c25]',
    headerBarBg: 'bg-[#181109]',
    headerBorder: 'border-[#7a4c25]',
    btnSecondary: 'border-[#7a4c25] bg-[#2a1d10] hover:bg-[#3d2a17] text-[#e8c89b] hover:text-white',
    btnPrimary: 'border-[#b38b4d] bg-[#7a4c25] hover:bg-[#9c6637] text-white shadow-[0_0_12px_rgba(122,76,37,0.4)]',
    brandAccent: 'text-[#d4af37]',
  },
  noite_arcana: {
    id: 'noite_arcana',
    name: 'Noite Arcana (Índigo & Violeta)',
    description: 'Estilo místico voltado para grimórios arcanos e magos estelares.',
    previewColor: '#654399',
    isDark: true,
    pageWrapper: 'relative bg-[#090814] border-2 border-[#7b5ea7] rounded-xs shadow-[0_0_30px_rgba(123,94,167,0.25)] p-4 sm:p-6 text-[#e8e2f4] overflow-hidden',
    paperOverlay: 'absolute inset-0 bg-[#110e24]/95 pointer-events-none z-0',
    bannerBg: 'bg-gradient-to-r from-[#442c6b] via-[#654399] to-[#442c6b] text-[#f8f5fd] shadow-sm',
    boxBg: 'bg-[#171330] border-2 border-[#7b5ea7] text-[#e8e2f4]',
    boxBgLight: 'bg-[#1d183d] border border-[#7b5ea7]/60 text-[#e8e2f4]',
    inputBg: 'bg-transparent text-[#e8e2f4]',
    textTitle: 'text-[#d8c7ff]',
    textSubtitle: 'text-[#b79fe0]',
    textBody: 'text-[#e8e2f4]',
    textMuted: 'text-[#9f88c8]',
    badgeBorder: 'border-[#7b5ea7]',
    badgeBg: 'bg-[#221c47]',
    attrCardBg: 'bg-gradient-to-b from-[#352254] to-[#1f1433] border border-[#7b5ea7]',
    attrInnerBox: 'bg-[#4a3075]/80 border border-[#b79fe0]/40 text-[#f8f5fd]',
    attrBottomPill: 'bg-[#171330] border-2 border-[#7b5ea7] text-[#d8c7ff]',
    tableHeader: 'bg-[#2a1b42] border-b-2 border-[#7b5ea7] text-[#f8f5fd]',
    tableRowEven: 'bg-[#171330]',
    tableRowOdd: 'bg-[#110e24]',
    tableBorder: 'border-[#4a3075]',
    headerBarBg: 'bg-[#0b0918]',
    headerBorder: 'border-[#7b5ea7]',
    btnSecondary: 'border-[#7b5ea7] bg-[#1d183d] hover:bg-[#2d255e] text-[#d8c7ff] hover:text-white',
    btnPrimary: 'border-[#b79fe0] bg-[#654399] hover:bg-[#7b5ea7] text-white shadow-[0_0_12px_rgba(101,67,153,0.4)]',
    brandAccent: 'text-[#b79fe0]',
  },
  elberefh: {
    id: 'elberefh',
    name: 'Ëlberefh (Árvore Solar & Ouro Divino)',
    description: 'Inspirado no esplendor divino de Angarden: radiância em ouro solar sagrado, resplendor celestial e base em obsidiana cósmica.',
    previewColor: '#f5ba38',
    isDark: true,
    pageWrapper: 'relative bg-[#090503] border-2 border-[#f5ba38] rounded-xs shadow-[0_0_40px_rgba(245,186,56,0.35)] p-4 sm:p-6 text-[#fbf3e6] overflow-hidden',
    paperOverlay: 'absolute inset-0 bg-[#0f0703]/95 pointer-events-none z-0',
    bannerBg: 'bg-gradient-to-r from-[#9e4408] via-[#f5ba38] to-[#9e4408] text-[#140802] font-bold shadow-[0_0_22px_rgba(245,186,56,0.45)]',
    boxBg: 'bg-[#150d06] border-2 border-[#f5ba38] text-[#fff6d6]',
    boxBgLight: 'bg-[#22140a] border border-[#f5ba38]/70 text-[#fff6d6]',
    inputBg: 'bg-transparent text-[#fff6d6]',
    textTitle: 'text-[#ffe885]',
    textSubtitle: 'text-[#f5ba38]',
    textBody: 'text-[#fbf3e6]',
    textMuted: 'text-[#d69f58]',
    badgeBorder: 'border-[#f5ba38]',
    badgeBg: 'bg-[#2a1608]',
    attrCardBg: 'bg-gradient-to-b from-[#422208] via-[#241204] to-[#120802] border-2 border-[#f5ba38] shadow-[0_0_15px_rgba(245,186,56,0.2)]',
    attrInnerBox: 'bg-[#69390a]/85 border border-[#ffe07a] text-[#ffffff]',
    attrBottomPill: 'bg-[#140a04] border-2 border-[#f5ba38] text-[#ffe885]',
    tableHeader: 'bg-[#331a06] border-b-2 border-[#f5ba38] text-[#ffe885]',
    tableRowEven: 'bg-[#170e06]',
    tableRowOdd: 'bg-[#100903]',
    tableBorder: 'border-[#8f5215]',
    headerBarBg: 'bg-[#120803]',
    headerBorder: 'border-[#f5ba38]',
    btnSecondary: 'border-[#f5ba38] bg-[#291406] hover:bg-[#3d1e08] text-[#ffe07a] hover:text-white',
    btnPrimary: 'border-[#fff0a3] bg-gradient-to-r from-[#c98014] via-[#f5ba38] to-[#c98014] hover:brightness-110 text-[#140802] font-bold shadow-[0_0_20px_rgba(245,186,56,0.55)]',
    brandAccent: 'text-[#ffe07a]',
  },
  vampirico: {
    id: 'vampirico',
    name: 'Vampírico (Carmim Sanguíneo & Ébano)',
    description: 'Paleta gótica nobre com tons escarlates, carmim sanguíneo (#AD2831, #800E13, #640D14) e profundezas em vinho ébano (#38040E, #250902).',
    previewColor: '#ad2831',
    isDark: true,
    pageWrapper: 'relative bg-[#120405] border-2 border-[#ad2831] rounded-xs shadow-[0_0_35px_rgba(173,40,49,0.3)] p-4 sm:p-6 text-[#f8e5e7] overflow-hidden',
    paperOverlay: 'absolute inset-0 bg-[#250902]/95 pointer-events-none z-0',
    bannerBg: 'bg-gradient-to-r from-[#640d14] via-[#ad2831] to-[#640d14] text-[#fff0f2] shadow-[0_0_18px_rgba(173,40,49,0.4)]',
    boxBg: 'bg-[#250902] border-2 border-[#800e13] text-[#fcdfe2]',
    boxBgLight: 'bg-[#38040e] border border-[#ad2831]/60 text-[#fcdfe2]',
    inputBg: 'bg-transparent text-[#fcdfe2]',
    textTitle: 'text-[#ffbac0]',
    textSubtitle: 'text-[#e58a93]',
    textBody: 'text-[#f8e5e7]',
    textMuted: 'text-[#b86b72]',
    badgeBorder: 'border-[#ad2831]',
    badgeBg: 'bg-[#38040e]',
    attrCardBg: 'bg-gradient-to-b from-[#640d14] via-[#38040e] to-[#250902] border border-[#ad2831]',
    attrInnerBox: 'bg-[#800e13]/80 border border-[#ad2831]/60 text-[#ffffff]',
    attrBottomPill: 'bg-[#250902] border-2 border-[#ad2831] text-[#ffbac0]',
    tableHeader: 'bg-[#640d14] border-b-2 border-[#ad2831] text-[#fff0f2]',
    tableRowEven: 'bg-[#250902]',
    tableRowOdd: 'bg-[#180507]',
    tableBorder: 'border-[#640d14]',
    headerBarBg: 'bg-[#150406]',
    headerBorder: 'border-[#ad2831]',
    btnSecondary: 'border-[#ad2831] bg-[#38040e] hover:bg-[#640d14] text-[#ffbac0] hover:text-white',
    btnPrimary: 'border-[#ff949d] bg-[#800e13] hover:bg-[#ad2831] text-white shadow-[0_0_15px_rgba(173,40,49,0.5)]',
    brandAccent: 'text-[#ff949d]',
  },
  gaderniano: {
    id: 'gaderniano',
    name: 'Gaderniano (Azul Real & Abismo Celeste)',
    description: 'Paleta nobre com tons de safira real (#2078CF, #0E4EB2), azul marinho imperial (#011F65) e profundezas do éter noturno (#020C47, #000521).',
    previewColor: '#2078cf',
    isDark: true,
    pageWrapper: 'relative bg-[#000521] border-2 border-[#2078cf] rounded-xs shadow-[0_0_35px_rgba(32,120,207,0.3)] p-4 sm:p-6 text-[#dbeafe] overflow-hidden',
    paperOverlay: 'absolute inset-0 bg-[#020c47]/90 pointer-events-none z-0',
    bannerBg: 'bg-gradient-to-r from-[#011f65] via-[#2078cf] to-[#011f65] text-[#ffffff] shadow-[0_0_18px_rgba(32,120,207,0.4)]',
    boxBg: 'bg-[#000521] border-2 border-[#0e4eb2] text-[#e0f2fe]',
    boxBgLight: 'bg-[#020c47] border border-[#2078cf]/60 text-[#e0f2fe]',
    inputBg: 'bg-transparent text-[#e0f2fe]',
    textTitle: 'text-[#93c5fd]',
    textSubtitle: 'text-[#60a5fa]',
    textBody: 'text-[#dbeafe]',
    textMuted: 'text-[#3b82f6]',
    badgeBorder: 'border-[#2078cf]',
    badgeBg: 'bg-[#020c47]',
    attrCardBg: 'bg-gradient-to-b from-[#011f65] via-[#020c47] to-[#000521] border border-[#2078cf]',
    attrInnerBox: 'bg-[#0e4eb2]/80 border border-[#2078cf]/60 text-[#ffffff]',
    attrBottomPill: 'bg-[#000521] border-2 border-[#2078cf] text-[#93c5fd]',
    tableHeader: 'bg-[#011f65] border-b-2 border-[#2078cf] text-[#ffffff]',
    tableRowEven: 'bg-[#000521]',
    tableRowOdd: 'bg-[#00082e]',
    tableBorder: 'border-[#011f65]',
    headerBarBg: 'bg-[#000317]',
    headerBorder: 'border-[#2078cf]',
    btnSecondary: 'border-[#2078cf] bg-[#020c47] hover:bg-[#011f65] text-[#93c5fd] hover:text-white',
    btnPrimary: 'border-[#bfdbfe] bg-[#0e4eb2] hover:bg-[#2078cf] text-white shadow-[0_0_15px_rgba(32,120,207,0.5)]',
    brandAccent: 'text-[#bfdbfe]',
  },
  necromante: {
    id: 'necromante',
    name: 'Necromante (Cripta & Lodo Cadavérico)',
    description: 'Paleta sombria e macabra com tons de cripta (#1A1F1B, #2E3B2F), musgo cadavérico (#5B6B4A), cinzas de tumba (#A6AD9B) e osso espectral (#E7E4D6).',
    previewColor: '#5b6b4a',
    isDark: true,
    pageWrapper: 'relative bg-[#111512] border-2 border-[#5b6b4a] rounded-xs shadow-[0_0_35px_rgba(91,107,74,0.35)] p-4 sm:p-6 text-[#e7e4d6] overflow-hidden',
    paperOverlay: 'absolute inset-0 bg-[#1a1f1b]/95 pointer-events-none z-0',
    bannerBg: 'bg-gradient-to-r from-[#2e3b2f] via-[#5b6b4a] to-[#2e3b2f] text-[#e7e4d6] shadow-[0_0_18px_rgba(91,107,74,0.4)]',
    boxBg: 'bg-[#1a1f1b] border-2 border-[#2e3b2f] text-[#e7e4d6]',
    boxBgLight: 'bg-[#242d25] border border-[#5b6b4a]/60 text-[#e7e4d6]',
    inputBg: 'bg-transparent text-[#e7e4d6]',
    textTitle: 'text-[#e7e4d6]',
    textSubtitle: 'text-[#a6ad9b]',
    textBody: 'text-[#e7e4d6]',
    textMuted: 'text-[#87917a]',
    badgeBorder: 'border-[#5b6b4a]',
    badgeBg: 'bg-[#2e3b2f]',
    attrCardBg: 'bg-gradient-to-b from-[#2e3b2f] via-[#1a1f1b] to-[#111512] border border-[#5b6b4a]',
    attrInnerBox: 'bg-[#2e3b2f]/90 border border-[#5b6b4a]/70 text-[#e7e4d6]',
    attrBottomPill: 'bg-[#1a1f1b] border-2 border-[#5b6b4a] text-[#a6ad9b]',
    tableHeader: 'bg-[#2e3b2f] border-b-2 border-[#5b6b4a] text-[#e7e4d6]',
    tableRowEven: 'bg-[#1a1f1b]',
    tableRowOdd: 'bg-[#141815]',
    tableBorder: 'border-[#2e3b2f]',
    headerBarBg: 'bg-[#121613]',
    headerBorder: 'border-[#5b6b4a]',
    btnSecondary: 'border-[#5b6b4a] bg-[#242d25] hover:bg-[#2e3b2f] text-[#a6ad9b] hover:text-[#e7e4d6]',
    btnPrimary: 'border-[#e7e4d6] bg-[#5b6b4a] hover:bg-[#6c7f58] text-[#111512] font-bold shadow-[0_0_15px_rgba(91,107,74,0.45)]',
    brandAccent: 'text-[#a6ad9b]',
  },
};

export function getFichaTheme(themeId?: string): FichaTheme {
  if (!themeId) {
    return FICHA_THEMES.sistema;
  }
  if (FICHA_THEMES[themeId]) {
    return FICHA_THEMES[themeId];
  }
  const normalized = themeId.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized.includes('necromante') || normalized.includes('necro') || normalized.includes('necromancy')) {
    return FICHA_THEMES.necromante;
  }
  if (normalized.includes('gaderniano') || normalized.includes('gadernia') || normalized.includes('gadern')) {
    return FICHA_THEMES.gaderniano;
  }
  if (normalized.includes('vampirico') || normalized.includes('vampiro') || normalized.includes('vamp')) {
    return FICHA_THEMES.vampirico;
  }
  if (normalized.includes('elberefh') || normalized.includes('elberef')) {
    return FICHA_THEMES.elberefh;
  }
  return FICHA_THEMES.sistema;
}
