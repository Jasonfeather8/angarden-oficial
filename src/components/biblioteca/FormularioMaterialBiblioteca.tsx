import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, FileText, ImagePlus, Link2, Pencil, Plus, Scroll, Trash2, UploadCloud, X } from 'lucide-react';
import { clsx } from 'clsx';
import { GothicButton } from '@/components/GothicButton';
import { ToolbarButton } from '@/components/ui/ToolbarButton';
import { LeitorMarkdown } from '@/components/biblioteca/LeitorMarkdown';
import {
  CATEGORIAS_BIBLIOTECA,
  GRUPOS_BIBLIOTECA,
  LIMITE_UPLOAD_PDF_BYTES,
  formatarTamanhoArquivo,
} from '@/config/biblioteca';
import { bibliotecaService } from '@/services/bibliotecaService';
import { enviarImagem } from '@/services/mediaService';
import type { EntradaIndiceBiblioteca, ItemBiblioteca, NovoItemBiblioteca, TipoItemBiblioteca } from '@/types';

const classeCampo =
  'mt-1 block w-full border border-[#5a4225] bg-[#120f0d] px-3 py-2 font-serif text-sm text-[#e6ddc5] placeholder:text-[#6b5942] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]';
const classeRotulo = 'block font-cinzel text-xs font-bold uppercase tracking-wider text-[#d4af37]';

export interface FormularioMaterialBibliotecaProps {
  /** Material em edição; ausente quando é publicação nova. */
  inicial?: ItemBiblioteca | null;
  onSalvo: (mensagem: string) => void;
  onCancelar: () => void;
}

/**
 * Formulário de publicação do acervo: um PDF (enviado ao bucket privado ou
 * apontado por link externo) ou um pergaminho em Markdown.
 */
export const FormularioMaterialBiblioteca: React.FC<FormularioMaterialBibliotecaProps> = ({
  inicial,
  onSalvo,
  onCancelar,
}) => {
  const [tipo, setTipo] = useState<TipoItemBiblioteca>(inicial?.tipo ?? 'pdf');
  const [categoria, setCategoria] = useState(inicial?.categoria ?? CATEGORIAS_BIBLIOTECA[0].id);
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [subtitulo, setSubtitulo] = useState(inicial?.subtitulo ?? '');
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '');
  const [oculto, setOculto] = useState(inicial?.oculto ?? false);

  const [capaUrl, setCapaUrl] = useState(inicial?.capaUrl ?? '');
  const [capaArquivo, setCapaArquivo] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string | null>(null);
  const capaPreviewRef = useRef<string | null>(null);

  const [origemPdf, setOrigemPdf] = useState<'upload' | 'externo'>(
    inicial?.arquivoUrl ? 'externo' : 'upload',
  );
  const [arquivoPdf, setArquivoPdf] = useState<File | null>(null);
  const [arquivoUrlTexto, setArquivoUrlTexto] = useState(inicial?.arquivoUrl ?? '');
  const [indice, setIndice] = useState<EntradaIndiceBiblioteca[]>(inicial?.indice ?? []);

  const [conteudo, setConteudo] = useState(inicial?.conteudo ?? '');
  const [modoConteudo, setModoConteudo] = useState<'escrever' | 'visualizar'>('escrever');

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // O endereço local da capa escolhida precisa ser liberado quando sai de cena.
  useEffect(() => {
    capaPreviewRef.current = capaPreview;
  }, [capaPreview]);

  useEffect(
    () => () => {
      if (capaPreviewRef.current) URL.revokeObjectURL(capaPreviewRef.current);
    },
    [],
  );

  const selecionarCapa = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    event.target.value = '';
    if (!arquivo) return;
    if (capaPreviewRef.current) URL.revokeObjectURL(capaPreviewRef.current);
    const endereco = URL.createObjectURL(arquivo);
    setCapaArquivo(arquivo);
    setCapaPreview(endereco);
  };

  const removerCapa = () => {
    if (capaPreviewRef.current) URL.revokeObjectURL(capaPreviewRef.current);
    setCapaArquivo(null);
    setCapaPreview(null);
    setCapaUrl('');
  };

  const atualizarEntradaIndice = (posicao: number, campo: 'titulo' | 'pagina', valor: string) => {
    setIndice((atual) =>
      atual.map((entrada, indiceAtual) => {
        if (indiceAtual !== posicao) return entrada;
        if (campo === 'titulo') return { ...entrada, titulo: valor };
        const numero = Number(valor);
        return { ...entrada, pagina: Number.isFinite(numero) ? Math.max(1, Math.floor(numero)) : 1 };
      }),
    );
  };

  const indiceUtil = useMemo(
    () => indice.filter((entrada) => entrada.titulo.trim().length > 0 && entrada.pagina >= 1),
    [indice],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro(null);

    if (!titulo.trim()) {
      setErro('Informe o título do material.');
      return;
    }
    if (tipo === 'pdf' && origemPdf === 'externo' && !/^https:\/\/\S+$/i.test(arquivoUrlTexto.trim())) {
      setErro('Informe um link https:// válido para o PDF externo.');
      return;
    }
    if (tipo === 'pdf' && origemPdf === 'upload' && !arquivoPdf && !inicial?.arquivoCaminho) {
      setErro('Selecione o arquivo PDF do material.');
      return;
    }
    if (tipo === 'pergaminho' && !conteudo.trim()) {
      setErro('Escreva o conteúdo do pergaminho.');
      return;
    }

    setSalvando(true);
    let caminhoEnviado: string | null = null;

    try {
      const capaFinal = capaArquivo
        ? await enviarImagem(capaArquivo, 'biblioteca-capas', { maxWidth: 800, maxHeight: 1067, quality: 0.85 })
        : capaUrl;

      let arquivoCaminho: string | undefined;
      let arquivoUrl: string | undefined;
      let arquivoBytes: number | undefined;

      if (tipo === 'pdf') {
        if (origemPdf === 'upload') {
          if (arquivoPdf) {
            const envio = await bibliotecaService.enviarPdf(arquivoPdf);
            caminhoEnviado = envio.caminho;
            arquivoCaminho = envio.caminho;
            arquivoBytes = envio.bytes;
          } else {
            arquivoCaminho = inicial?.arquivoCaminho;
            arquivoBytes = inicial?.arquivoBytes;
          }
        } else {
          arquivoUrl = arquivoUrlTexto.trim();
        }
      }

      const dados: NovoItemBiblioteca = {
        tipo,
        categoria,
        titulo,
        subtitulo: subtitulo || undefined,
        descricao: descricao || undefined,
        capaUrl: capaFinal || undefined,
        arquivoCaminho,
        arquivoUrl,
        arquivoBytes,
        indice: tipo === 'pdf' ? indiceUtil : [],
        conteudo: tipo === 'pergaminho' ? conteudo : undefined,
        oculto,
      };

      const item = inicial
        ? await bibliotecaService.atualizar(inicial.id, dados)
        : await bibliotecaService.publicar(dados);

      // O arquivo anterior só sai do bucket depois de o material novo estar
      // gravado: assim uma falha no meio do caminho não deixa o acervo sem PDF.
      if (inicial?.arquivoCaminho && inicial.arquivoCaminho !== item.arquivoCaminho) {
        await bibliotecaService.descartarArquivo(inicial.arquivoCaminho);
      }

      onSalvo(inicial ? 'Material atualizado no acervo.' : 'Material publicado no acervo.');
    } catch (cause) {
      // O PDF subiu, mas o material não foi gravado: não deixa objeto órfão.
      if (caminhoEnviado) await bibliotecaService.descartarArquivo(caminhoEnviado);
      setErro(cause instanceof Error ? cause.message : 'Não foi possível salvar o material.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset disabled={salvando} className="space-y-5">
        <div>
          <span className={classeRotulo}>Tipo de material</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                { id: 'pdf', label: 'Manual em PDF', icon: FileText },
                { id: 'pergaminho', label: 'Pergaminho (notas)', icon: Scroll },
              ] as const
            ).map((opcao) => {
              const Icone = opcao.icon;
              const ativo = tipo === opcao.id;
              return (
                <button
                  key={opcao.id}
                  type="button"
                  onClick={() => setTipo(opcao.id)}
                  aria-pressed={ativo}
                  className={clsx(
                    'inline-flex items-center gap-2 border px-3 py-2 font-cinzel text-[10px] font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]',
                    ativo
                      ? 'border-[#a88d61] bg-[#2a1d10] text-[#f3ebd3]'
                      : 'border-[#5a4225] bg-[#120f0d] text-[#a88d61] hover:border-[#8c6b41] hover:text-[#e6ddc5]',
                  )}
                >
                  <Icone className="h-4 w-4" aria-hidden="true" />
                  {opcao.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="material-categoria" className={classeRotulo}>
              Categoria
            </label>
            <select
              id="material-categoria"
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
              className={classeCampo}
            >
              {GRUPOS_BIBLIOTECA.map((grupo) => (
                <optgroup key={grupo.id} label={grupo.label}>
                  {grupo.categorias.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="material-titulo" className={classeRotulo}>
              Título
            </label>
            <input
              id="material-titulo"
              type="text"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Livro do Jogador"
              className={classeCampo}
            />
          </div>

          <div>
            <label htmlFor="material-subtitulo" className={classeRotulo}>
              Subtítulo
            </label>
            <input
              id="material-subtitulo"
              type="text"
              value={subtitulo}
              onChange={(event) => setSubtitulo(event.target.value)}
              placeholder="Edição revisada"
              className={classeCampo}
            />
          </div>

          <div className="flex items-end">
            <label className="inline-flex cursor-pointer items-center gap-2 border border-[#5a4225] bg-[#120f0d] px-3 py-2 font-serif text-sm text-[#e6ddc5]">
              <input
                type="checkbox"
                checked={oculto}
                onChange={(event) => setOculto(event.target.checked)}
                className="h-4 w-4 accent-[#8c6b41]"
              />
              Ocultar do acervo
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="material-descricao" className={classeRotulo}>
            Descrição
          </label>
          <textarea
            id="material-descricao"
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            rows={3}
            placeholder="O que este material traz para a mesa."
            className={clsx(classeCampo, 'resize-y')}
          />
        </div>

        <div>
          <span className={classeRotulo}>Capa</span>
          <div className="mt-2 flex flex-wrap items-start gap-4">
            <div className="h-[120px] w-[90px] shrink-0 overflow-hidden border border-[#5a4225] bg-[#0c0806]">
              {capaPreview || capaUrl ? (
                <img
                  src={capaPreview ?? capaUrl}
                  alt="Pré-visualização da capa"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[#5a4225]">
                  <ImagePlus className="h-6 w-6" aria-hidden="true" />
                </span>
              )}
            </div>
            <div className="space-y-2">
              <input
                id="material-capa"
                type="file"
                accept="image/*"
                onChange={selecionarCapa}
                className="sr-only"
              />
              <div className="flex flex-wrap gap-2">
                {/* O rótulo abre o seletor de arquivo: o campo real fica oculto, mas continua acessível pelo teclado. */}
                <label
                  htmlFor="material-capa"
                  className="inline-flex h-[34px] cursor-pointer items-center justify-center gap-2 rounded-xs border border-[#4b3823] bg-[#150f0a] px-3.5 font-cinzel text-[10px] font-bold uppercase tracking-[0.12em] text-[#c6a66d] transition-colors hover:border-[#a88d61] hover:bg-[#24180e] hover:text-[#f3dfaa]"
                >
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  Escolher capa
                </label>
                {(capaPreview || capaUrl) && (
                  <ToolbarButton icon={<X className="h-4 w-4" />} onClick={removerCapa}>
                    Remover
                  </ToolbarButton>
                )}
              </div>
              <p className="font-serif text-xs text-[#8c6b41]">
                A capa fica no armazenamento público e é o que aparece na estante. Sem capa, o
                material usa a moldura da marca.
              </p>
            </div>
          </div>
        </div>

        {tipo === 'pdf' ? (
          <div className="space-y-4 border border-[#5a4225] bg-[#0c0806]/80 p-4">
            <div>
              <span className={classeRotulo}>Origem do arquivo</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    { id: 'upload', label: 'Enviar PDF', icon: UploadCloud },
                    { id: 'externo', label: 'Link externo', icon: Link2 },
                  ] as const
                ).map((opcao) => {
                  const Icone = opcao.icon;
                  const ativo = origemPdf === opcao.id;
                  return (
                    <button
                      key={opcao.id}
                      type="button"
                      onClick={() => setOrigemPdf(opcao.id)}
                      aria-pressed={ativo}
                      className={clsx(
                        'inline-flex items-center gap-2 border px-3 py-2 font-cinzel text-[10px] font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]',
                        ativo
                          ? 'border-[#a88d61] bg-[#2a1d10] text-[#f3ebd3]'
                          : 'border-[#5a4225] bg-[#120f0d] text-[#a88d61] hover:border-[#8c6b41] hover:text-[#e6ddc5]',
                      )}
                    >
                      <Icone className="h-4 w-4" aria-hidden="true" />
                      {opcao.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {origemPdf === 'upload' ? (
              <div className="space-y-2">
                <label htmlFor="material-pdf" className={classeRotulo}>
                  Arquivo PDF
                </label>
                <input
                  id="material-pdf"
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setArquivoPdf(event.target.files?.[0] ?? null)}
                  className="block w-full cursor-pointer border border-[#5a4225] bg-[#120f0d] p-2 font-serif text-xs text-[#c4b9a3] file:mr-3 file:border-0 file:bg-[#2a1d10] file:px-3 file:py-2 file:font-cinzel file:text-[10px] file:uppercase file:text-[#e6ddc5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
                />
                <p className="font-serif text-xs text-[#8c6b41]">
                  Limite de {formatarTamanhoArquivo(LIMITE_UPLOAD_PDF_BYTES)} por arquivo. O
                  arquivo fica em área privada e só é liberado para quem tem sessão ativa.
                </p>
                {arquivoPdf && (
                  <p className="font-serif text-xs text-[#c4b9a3]">
                    Selecionado: {arquivoPdf.name} ({formatarTamanhoArquivo(arquivoPdf.size)})
                  </p>
                )}
                {!arquivoPdf && inicial?.arquivoCaminho && (
                  <p className="font-serif text-xs text-[#c4b9a3]">
                    Mantendo o arquivo atual ({formatarTamanhoArquivo(inicial.arquivoBytes)}). Escolha
                    outro para substituí-lo.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="material-pdf-url" className={classeRotulo}>
                  Link do PDF
                </label>
                <input
                  id="material-pdf-url"
                  type="url"
                  value={arquivoUrlTexto}
                  onChange={(event) => setArquivoUrlTexto(event.target.value)}
                  placeholder="https://exemplo.com/livro-do-jogador.pdf"
                  className={classeCampo}
                />
                <p className="font-serif text-xs text-[#e0c27e]">
                  Arquivo externo fica fora do nosso armazenamento: não é protegido pela sessão e a
                  leitura depende de o servidor de origem liberar o acesso. Use para PDFs acima do
                  limite.
                </p>
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={classeRotulo}>Índice (opcional)</span>
                <ToolbarButton
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setIndice((atual) => [...atual, { titulo: '', pagina: 1 }])}
                >
                  Adicionar capítulo
                </ToolbarButton>
              </div>
              <p className="mt-1 font-serif text-xs text-[#8c6b41]">
                O leitor usa primeiro o sumário que já existe dentro do PDF. Preencha aqui apenas se o
                arquivo não tiver sumário.
              </p>
              {indice.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {indice.map((entrada, posicao) => (
                    <li key={posicao} className="flex flex-wrap items-end gap-2">
                      <div className="min-w-[12rem] flex-1">
                        <label htmlFor={`indice-titulo-${posicao}`} className="sr-only">
                          Título do capítulo {posicao + 1}
                        </label>
                        <input
                          id={`indice-titulo-${posicao}`}
                          type="text"
                          value={entrada.titulo}
                          onChange={(event) => atualizarEntradaIndice(posicao, 'titulo', event.target.value)}
                          placeholder="Título do capítulo"
                          className={clsx(classeCampo, 'mt-0')}
                        />
                      </div>
                      <div className="w-24">
                        <label htmlFor={`indice-pagina-${posicao}`} className="sr-only">
                          Página do capítulo {posicao + 1}
                        </label>
                        <input
                          id={`indice-pagina-${posicao}`}
                          type="number"
                          min={1}
                          value={entrada.pagina}
                          onChange={(event) => atualizarEntradaIndice(posicao, 'pagina', event.target.value)}
                          className={clsx(classeCampo, 'mt-0')}
                        />
                      </div>
                      <ToolbarButton
                        icon={<Trash2 className="h-4 w-4" />}
                        aria-label={`Remover o capítulo ${posicao + 1}`}
                        onClick={() => setIndice((atual) => atual.filter((_, indiceAtual) => indiceAtual !== posicao))}
                      >
                        Remover
                      </ToolbarButton>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 border border-[#5a4225] bg-[#0c0806]/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={classeRotulo}>Conteúdo do pergaminho</span>
              <div className="flex gap-2">
                <ToolbarButton
                  icon={<Pencil className="h-4 w-4" />}
                  variant={modoConteudo === 'escrever' ? 'primary' : 'secondary'}
                  aria-pressed={modoConteudo === 'escrever'}
                  onClick={() => setModoConteudo('escrever')}
                >
                  Escrever
                </ToolbarButton>
                <ToolbarButton
                  icon={<Eye className="h-4 w-4" />}
                  variant={modoConteudo === 'visualizar' ? 'primary' : 'secondary'}
                  aria-pressed={modoConteudo === 'visualizar'}
                  onClick={() => setModoConteudo('visualizar')}
                >
                  Pré-visualizar
                </ToolbarButton>
              </div>
            </div>

            <p className="font-serif text-xs text-[#8c6b41]">
              Aceita Markdown: <code>## título</code>, <code>**negrito**</code>, listas e tabelas.
            </p>

            {modoConteudo === 'escrever' ? (
              <>
                <label htmlFor="material-conteudo" className="sr-only">
                  Conteúdo em Markdown
                </label>
                <textarea
                  id="material-conteudo"
                  value={conteudo}
                  onChange={(event) => setConteudo(event.target.value)}
                  rows={16}
                  placeholder={'## A Floresta de Elbereth\n\nDizem que ...'}
                  className={clsx(classeCampo, 'font-mono text-[13px] leading-relaxed resize-y')}
                />
              </>
            ) : (
              <div className="min-h-[16rem] border border-[#7a4c25]/40 bg-[#f7efe0] p-5">
                {conteudo.trim() ? (
                  <LeitorMarkdown conteudo={conteudo} />
                ) : (
                  <p className="font-serif text-sm italic text-[#7a5735]">
                    Escreva o conteúdo para ver como o pergaminho será lido.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </fieldset>

      {erro && (
        <p role="alert" className="border border-[#7f3d2d] bg-[#1c0f0b]/90 px-3 py-2 font-serif text-sm text-[#f0b09b]">
          {erro}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <GothicButton
          type="submit"
          disabled={salvando}
          icon={inicial ? <FileText className="h-4 w-4" aria-hidden="true" /> : <UploadCloud className="h-4 w-4" aria-hidden="true" />}
        >
          {salvando ? 'Salvando…' : inicial ? 'Salvar alterações' : 'Publicar material'}
        </GothicButton>
        <ToolbarButton onClick={onCancelar} disabled={salvando}>
          Cancelar
        </ToolbarButton>
      </div>
    </form>
  );
};

export default FormularioMaterialBiblioteca;
