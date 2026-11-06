import React, { useLayoutEffect, useState } from 'react';
import { clsx } from 'clsx';

export type MarcaVariante = 'completa' | 'arvore';

interface ArteDaMarca {
  src: string;
  rotulo: string;
}

/** Artes oficiais da marca. Trocar a marca é trocar o arquivo em public/brand. */
const ARTES: Record<MarcaVariante, ArteDaMarca> = {
  completa: { src: '/brand/angarden-logo.png', rotulo: 'Angarden' },
  arvore: { src: '/brand/angarden-arvore.png', rotulo: 'Símbolo de Angarden' },
};

/**
 * Caixa realmente desenhada da arte, em pixels do arquivo. As artes chegam em
 * prancheta quadrada com margem transparente: sem recortar essa margem a marca
 * apareceria minúscula dentro do espaço reservado para ela.
 */
interface RecorteDaArte {
  x: number;
  y: number;
  largura: number;
  altura: number;
  arteLargura: number;
  arteAltura: number;
}

/** Alfa mínimo para o pixel contar como desenho (sombra suave também entra no recorte). */
const LIMITE_DE_ALFA = 8;
/** A margem é medida em uma redução da arte: acha a caixa sem carregar os 16 MB de pixels originais. */
const LADO_DA_MEDICAO = 512;
/** Folga para não cortar o antialiasing das bordas. */
const FOLGA = 1;

const recortesMedidos = new Map<string, RecorteDaArte | null>();

const medirRecorte = (imagem: HTMLImageElement): RecorteDaArte | null => {
  const arteLargura = imagem.naturalWidth;
  const arteAltura = imagem.naturalHeight;
  if (!arteLargura || !arteAltura) return null;

  const reducao = Math.min(1, LADO_DA_MEDICAO / Math.max(arteLargura, arteAltura));
  const largura = Math.max(1, Math.round(arteLargura * reducao));
  const altura = Math.max(1, Math.round(arteAltura * reducao));

  const tela = document.createElement('canvas');
  tela.width = largura;
  tela.height = altura;
  const contexto = tela.getContext('2d');
  if (!contexto) return null;

  contexto.drawImage(imagem, 0, 0, largura, altura);
  const pixels = contexto.getImageData(0, 0, largura, altura).data;

  let minX = largura;
  let minY = altura;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < altura; y += 1) {
    const linha = y * largura;
    for (let x = 0; x < largura; x += 1) {
      if (pixels[(linha + x) * 4 + 3] <= LIMITE_DE_ALFA) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  // Libera o buffer da medição assim que a caixa está calculada.
  tela.width = 0;
  tela.height = 0;

  if (maxX < 0 || maxY < 0) return null;

  const escala = 1 / reducao;
  const x = Math.max(0, (minX - FOLGA) * escala);
  const y = Math.max(0, (minY - FOLGA) * escala);
  return {
    x,
    y,
    largura: Math.min(arteLargura - x, (maxX - minX + 1 + FOLGA * 2) * escala),
    altura: Math.min(arteAltura - y, (maxY - minY + 1 + FOLGA * 2) * escala),
    arteLargura,
    arteAltura,
  };
};

/** Mede a arte uma única vez por arquivo e reaproveita no resto da sessão. */
const useRecorteDaArte = (src: string) => {
  const [recorte, setRecorte] = useState<RecorteDaArte | null | undefined>(() => recortesMedidos.get(src));

  useLayoutEffect(() => {
    if (recorte !== undefined) return;
    if (recortesMedidos.has(src)) {
      setRecorte(recortesMedidos.get(src) ?? null);
      return;
    }

    let ativo = true;
    let medido = false;
    const imagem = new Image();

    const concluir = (resultado: RecorteDaArte | null) => {
      if (medido) return;
      medido = true;
      recortesMedidos.set(src, resultado);
      if (ativo) setRecorte(resultado);
    };

    imagem.onload = () => concluir(medirRecorte(imagem));
    imagem.onerror = () => concluir(null);
    imagem.src = src;
    // Arte em cache: resolve antes da primeira pintura, sem piscar sem marca.
    if (imagem.complete && imagem.naturalWidth) concluir(medirRecorte(imagem));

    return () => {
      ativo = false;
    };
  }, [src, recorte]);

  return recorte;
};

export interface BrandMarkProps {
  variant?: MarcaVariante;
  /** Altura da marca já recortada, em pixels. */
  altura: number;
  /** Teto de largura: arte muito larga diminui de altura para caber inteira, sem cortar nada. */
  larguraMaxima?: number;
  /** Pinta a arte de escuro: para superfícies claras, como a folha da ficha técnica. */
  escura?: boolean;
  /** Marca apenas ornamental: sem texto alternativo, para quando já existe rótulo ao lado. */
  decorativa?: boolean;
  className?: string;
}

/**
 * Marca oficial de Angarden. Use 'completa' onde o nome aparece e 'arvore' no
 * lugar do símbolo (menu recolhido, ficha técnica, favicon). Nunca recrie a
 * marca com ícone de escudo e texto solto.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({
  variant = 'completa',
  altura,
  larguraMaxima,
  escura = false,
  decorativa = false,
  className,
}) => {
  const { src, rotulo } = ARTES[variant];
  const recorte = useRecorteDaArte(src);

  const proporcao = recorte ? recorte.largura / recorte.altura : null;
  const alturaFinal = proporcao && larguraMaxima ? Math.min(altura, larguraMaxima / proporcao) : altura;
  const classes = clsx('inline-block select-none align-middle', escura && 'brightness-0 opacity-80', className);
  const texto = decorativa ? '' : rotulo;

  // Sem a medida (primeiro carregamento ou falha), desenha a arte inteira: a marca nunca desaparece.
  if (!recorte || !proporcao) {
    return (
      <img
        src={src}
        alt={texto}
        draggable={false}
        className={clsx(classes, 'w-auto')}
        style={{ height: alturaFinal }}
      />
    );
  }

  const escala = alturaFinal / recorte.altura;
  return (
    <span
      className={clsx(classes, 'relative overflow-hidden')}
      style={{ width: alturaFinal * proporcao, height: alturaFinal }}
    >
      <img
        src={src}
        alt={texto}
        draggable={false}
        className="absolute max-w-none"
        style={{
          width: recorte.arteLargura * escala,
          height: recorte.arteAltura * escala,
          left: -recorte.x * escala,
          top: -recorte.y * escala,
        }}
      />
    </span>
  );
};

export default BrandMark;
