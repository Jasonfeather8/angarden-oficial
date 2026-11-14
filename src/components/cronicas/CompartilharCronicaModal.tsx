import React, { useEffect, useState } from 'react';
import { Check, Copy, Link } from 'lucide-react';
import { cronicaService } from '@/services/cronicaService';
import { conviteCronicaPath } from '@/routes/paths';
import { GothicButton } from '../GothicButton';
import { Modal } from '../Modal';

export interface CompartilharCronicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cronicaId: string;
}

/**
 * Gera o link de convite da crônica. O convidado precisa de conta aprovada,
 * escolhe os próprios personagens e o Mestre aprova a inscrição depois.
 */
export const CompartilharCronicaModal: React.FC<CompartilharCronicaModalProps> = ({
  isOpen,
  onClose,
  cronicaId,
}) => {
  const [url, setUrl] = useState('');
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) return;
    setUrl('');
    setCopiado(false);
    setErro('');
  }, [isOpen]);

  const gerar = async () => {
    setGerando(true);
    setErro('');
    try {
      const token = await cronicaService.criarConvite(cronicaId);
      setUrl(`${window.location.origin}${conviteCronicaPath(token)}`);
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível gerar o convite.');
    } finally {
      setGerando(false);
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1800);
    } catch {
      setErro('Não foi possível copiar o link neste navegador.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compartilhar crônica"
      subtitle="Convide a companhia para participar"
      maxWidth="max-w-[600px]"
    >
      <p className="font-serif text-sm text-[#c4b9a3]">
        O convidado precisa ter uma conta aprovada e escolherá os próprios personagens. Depois, você aprova as
        inscrições na companhia da crônica.
      </p>

      {url ? (
        <div className="space-y-3">
          <label className="block font-cinzel text-[10px] uppercase tracking-wider text-[#c9aa68]">
            Link de convite
            <input
              readOnly
              value={url}
              aria-label="Link de convite"
              onFocus={(event) => event.target.select()}
              className="mt-1 w-full border border-[#4b3823] bg-[#0d0906] px-3 py-2 font-serif text-sm text-[#e6ddc5]"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <GothicButton
              size="sm"
              width={150}
              height={38}
              onClick={() => void copiar()}
              icon={copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {copiado ? 'Copiado!' : 'Copiar'}
            </GothicButton>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-[38px] items-center border border-[#8c6b41] bg-[#150f0a] px-4 font-cinzel text-[10px] uppercase tracking-[0.12em] text-[#c6a66d] transition-colors hover:border-[#a88d61] hover:text-[#f3dfaa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
            >
              Abrir link
            </a>
          </div>
        </div>
      ) : (
        <GothicButton
          size="sm"
          width={220}
          height={38}
          disabled={gerando}
          onClick={() => void gerar()}
          icon={<Link className="h-4 w-4" />}
        >
          {gerando ? 'Gerando…' : 'Gerar link de convite'}
        </GothicButton>
      )}

      {erro && <p role="alert" className="font-serif text-sm text-red-300">{erro}</p>}
    </Modal>
  );
};

export default CompartilharCronicaModal;
