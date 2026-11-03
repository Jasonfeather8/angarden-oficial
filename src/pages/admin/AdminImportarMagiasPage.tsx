import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, FileJson, UploadCloud } from 'lucide-react';
import { clsx } from 'clsx';
import { GothicButton } from '@/components/GothicButton';
import { MedievalFrame } from '@/components/MedievalFrame';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/Skeleton';
import { importarMagias, listarIdsExistentes } from '@/services/grimorioService';
import { parsearImportacaoDeMagias, type ResultadoParseImportacaoMagias } from '@/utils/importarMagias';

interface RelatorioImportacao {
  importadas: number;
  falhas: string[];
}

export const AdminImportarMagiasPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [resultado, setResultado] = useState<ResultadoParseImportacaoMagias | null>(null);
  const [totalItens, setTotalItens] = useState(0);
  const [arquivo, setArquivo] = useState('');
  const [idsExistentes, setIdsExistentes] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);
  const [progresso, setProgresso] = useState({ concluidas: 0, total: 0 });
  const [relatorio, setRelatorio] = useState<RelatorioImportacao | null>(null);

  const selecionarArquivo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCarregando(true);
    setErro(null);
    setResultado(null);
    setRelatorio(null);
    setIdsExistentes(new Set());
    setArquivo(file.name);
    try {
      const texto = await file.text();
      const analisado = parsearImportacaoDeMagias(texto);
      let total = 0;
      try {
        const parsed: unknown = JSON.parse(texto);
        total = Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        total = 0;
      }
      const existentes = analisado.validas.length
        ? await listarIdsExistentes(analisado.validas.map((magia) => magia.id))
        : new Set<string>();
      setTotalItens(total);
      setIdsExistentes(existentes);
      setResultado(analisado);
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível ler ou validar o arquivo.');
    } finally {
      setCarregando(false);
    }
  };

  const confirmarImportacao = async () => {
    if (!resultado?.validas.length) return;
    setImportando(true);
    setErro(null);
    setRelatorio(null);
    setProgresso({ concluidas: 0, total: resultado.validas.length });
    try {
      const relatorioFinal = await importarMagias(resultado.validas, (concluidas, total) => {
        setProgresso({ concluidas, total });
      });
      setRelatorio(relatorioFinal);
      if (relatorioFinal.importadas > 0) {
        await queryClient.invalidateQueries({ queryKey: ['grimorio'] });
      }
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível concluir a importação.');
    } finally {
      setImportando(false);
    }
  };

  return (
    <MedievalFrame
      title="Importar magias"
      subtitle="Adicionar um acervo em lote ao Grimório"
      contentClassName="space-y-5"
    >
      <p className="font-serif text-sm text-[#c4b9a3]">
        Escolha um arquivo JSON para validar as magias e revisar o resumo antes de gravá-las. IDs já cadastrados serão ignorados.
      </p>

      <section className="space-y-3 border border-[#5a4225] bg-[#0c0806]/80 p-4" aria-labelledby="formato-json">
        <h2 id="formato-json" className="flex items-center gap-2 font-cinzel text-xs font-bold uppercase tracking-wider text-[#d4af37]">
          <BookOpen className="h-4 w-4" aria-hidden="true" /> Formato esperado
        </h2>
        <p className="font-serif text-xs text-[#c4b9a3]">
          O arquivo deve ser um array de objetos com <code>id</code>, <code>name</code>, <code>schoolId</code> e <code>volumeId</code>. Imagens devem ser enviadas como URL; base64 também funciona, mas deixa o arquivo pesado e será enviado ao armazenamento antes da gravação.
        </p>
        <pre className="overflow-x-auto border border-[#3a2c1d] bg-black/50 p-3 font-mono text-[11px] text-[#d6c6a7]" aria-label="Exemplo de arquivo JSON">
{`[
  {
    "id": "custom-spell-123456",
    "name": "Chama Errante",
    "schoolId": "piromancia",
    "volumeId": "piromancia-volume-i",
    "visual": "fire",
    "description": "Uma pequena chama percorre o ar.",
    "image": "https://exemplo.com/chama.jpg"
  }
]`}
        </pre>
      </section>

      <div className="space-y-2">
        <label htmlFor="arquivo-magias" className="block font-cinzel text-xs font-bold uppercase tracking-wider text-[#d4af37]">
          Arquivo JSON de magias
        </label>
        <input
          id="arquivo-magias"
          type="file"
          accept=".json,application/json"
          onChange={selecionarArquivo}
          disabled={carregando || importando}
          className="block w-full cursor-pointer border border-[#5a4225] bg-[#120f0d] p-2 font-serif text-xs text-[#c4b9a3] file:mr-3 file:border-0 file:bg-[#2a1d10] file:px-3 file:py-2 file:font-cinzel file:text-[10px] file:uppercase file:text-[#e6ddc5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
        />
      </div>

      {carregando ? (
        <LoadingState label="Lendo, validando e verificando o Grimório…" />
      ) : erro ? (
        <ErrorState title="Não foi possível processar a importação" description={erro} />
      ) : !resultado ? (
        <EmptyState
          icon={<FileJson className="h-8 w-8" aria-hidden="true" />}
          title="Aguardando um arquivo"
          description="Selecione um arquivo .json para conferir o conteúdo antes de importar."
        />
      ) : (
        <>
          <section className="space-y-3 border border-[#5a4225] bg-[#0c0806]/80 p-4" aria-labelledby="resumo-importacao">
            <h2 id="resumo-importacao" className="font-cinzel text-sm font-bold uppercase tracking-wider text-[#e6ddc5]">Resumo da validação</h2>
            <p className="break-all font-serif text-xs text-[#8c6b41]">Arquivo: {arquivo}</p>
            <ul className="grid gap-2 font-serif text-sm text-[#c4b9a3] sm:grid-cols-2 lg:grid-cols-4">
              <li>{totalItens} item(ns) no arquivo</li>
              <li>{resultado.validas.length} magia(s) válida(s)</li>
              <li>{idsExistentes.size} ID(s) já existente(s), serão ignorados</li>
              <li>{resultado.erros.length} erro(s) de validação</li>
            </ul>
            {resultado.idsRepetidos.length > 0 && (
              <p className="font-serif text-xs text-[#e0c27e]">{resultado.idsRepetidos.length} ID(s) repetido(s) no arquivo; ocorrências posteriores foram ignoradas.</p>
            )}
            {resultado.erros.length > 0 && (
              <div className="border-t border-[#3a2c1d] pt-3" role="alert">
                <h3 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#f0b09b]">Erros (primeiros 20)</h3>
                <ul className="mt-2 list-inside list-disc space-y-1 font-serif text-xs text-[#e7b29e]">
                  {resultado.erros.slice(0, 20).map((item, index) => <li key={`${item.posicao}-${index}`}>Item {item.posicao}: {item.motivo}</li>)}
                </ul>
              </div>
            )}
            {(resultado.avisos.length > 0 || resultado.idsRepetidos.length > 0) && (
              <div className="border-t border-[#3a2c1d] pt-3">
                <h3 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#e0c27e]">Avisos</h3>
                <ul className="mt-2 list-inside list-disc space-y-1 font-serif text-xs text-[#d6c6a7]">
                  {resultado.avisos.map((item, index) => <li key={`aviso-${item.posicao}-${index}`}>Item {item.posicao}: {item.motivo}</li>)}
                  {resultado.idsRepetidos.map((item, index) => <li key={`repetido-${item.posicao}-${index}`}>Item {item.posicao}: {item.motivo}</li>)}
                </ul>
              </div>
            )}
            <GothicButton
              onClick={confirmarImportacao}
              disabled={importando || resultado.validas.length === 0}
              icon={<UploadCloud className="h-4 w-4" aria-hidden="true" />}
              className="max-w-full"
            >
              Importar {resultado.validas.length} magia(s) válida(s)
            </GothicButton>
          </section>

          {importando && (
            <div className="w-full max-w-xl space-y-2" role="status" aria-live="polite">
              <p className="font-cinzel text-xs uppercase tracking-wider text-[#d4af37]">
                Importando {progresso.concluidas} de {progresso.total}
              </p>
              <div className="h-2 overflow-hidden border border-[#5a4225] bg-[#120f0d]">
                <div
                  className={clsx('h-full bg-[#8c6b41] transition-[width] duration-200')}
                  style={{ width: `${progresso.total ? (progresso.concluidas / progresso.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {relatorio && (
            <section className="space-y-3 border border-[#5a4225] bg-[#0c0806]/80 p-4" aria-labelledby="relatorio-importacao">
              <h2 id="relatorio-importacao" className="font-cinzel text-sm font-bold uppercase tracking-wider text-[#e6ddc5]">Relatório da importação</h2>
              <p className="font-serif text-sm text-[#c4b9a3]">{relatorio.importadas} magia(s) importada(s); {relatorio.falhas.length} falha(s).</p>
              {relatorio.falhas.length > 0 && (
                <div className="border-t border-[#3a2c1d] pt-3">
                  <h3 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#f0b09b]">Falhas</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 font-serif text-xs text-[#e7b29e]">
                    {relatorio.falhas.map((falha, index) => <li key={`${index}-${falha}`}>{falha}</li>)}
                  </ul>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </MedievalFrame>
  );
};

export default AdminImportarMagiasPage;
