/**
 * Pré-carrega no navegador a arte que a tela de detalhes vai mostrar.
 *
 * A lista usa a miniatura reduzida e o modal usa a imagem original: são URLs
 * diferentes, então o arquivo grande não está em cache e só começa a ser
 * baixado quando o modal monta, deixando a moldura vazia por um instante.
 * Disparar o download no hover/foco (ou na ociosidade) deixa o arquivo pronto
 * antes da abertura.
 */
const precarregadas = new Set<string>();

export function precarregarImagem(url: string | null | undefined): void {
  if (!url || precarregadas.has(url)) return;
  precarregadas.add(url);
  const imagem = new Image();
  imagem.decoding = 'async';
  imagem.src = url;
}
