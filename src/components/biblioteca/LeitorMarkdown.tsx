import React from 'react';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface LeitorMarkdownProps {
  conteudo: string;
  className?: string;
}

/**
 * Renderiza o Markdown do pergaminho sobre a superfície de pergaminho. O
 * `react-markdown` não interpreta HTML cru por padrão, então o texto escrito
 * pelo Administrador não vira vetor de script — e é por isso que nada aqui usa
 * `dangerouslySetInnerHTML`.
 */
export const LeitorMarkdown: React.FC<LeitorMarkdownProps> = ({ conteudo, className }) => (
  <div className={clsx('font-serif text-[15px] leading-relaxed text-[#3b2b1b]', className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h2 className="mb-3 mt-7 border-b border-[#7a4c25]/40 pb-1 font-cinzel text-xl font-bold uppercase tracking-wide text-[#2c1d0f] first:mt-0">
            {children}
          </h2>
        ),
        h2: ({ children }) => (
          <h3 className="mb-2 mt-6 font-cinzel text-lg font-bold uppercase tracking-wide text-[#2c1d0f] first:mt-0">
            {children}
          </h3>
        ),
        h3: ({ children }) => (
          <h4 className="mb-2 mt-5 font-cinzel text-base font-bold uppercase tracking-wide text-[#2c1d0f] first:mt-0">
            {children}
          </h4>
        ),
        p: ({ children }) => <p className="mb-3">{children}</p>,
        ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-6 marker:text-[#7a4c25]">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-6 marker:text-[#7a4c25]">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="my-4 border-l-4 border-[#b38b4d] bg-[#7a4c25]/5 px-4 py-2 italic text-[#5a3a1d]">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-6 border-[#7a4c25]/30" />,
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7a4c25] underline decoration-dotted underline-offset-2 hover:text-[#5a3a1d]"
          >
            {children}
          </a>
        ),
        strong: ({ children }) => <strong className="font-bold text-[#2c1d0f]">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => (
          <code className="rounded-xs bg-[#7a4c25]/10 px-1 py-0.5 font-mono text-[13px] text-[#5a3a1d]">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="my-4 overflow-x-auto rounded-xs border border-[#7a4c25]/30 bg-[#7a4c25]/10 p-3 font-mono text-[13px]">
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-[#7a4c25]/40 bg-[#7a4c25]/10 px-2 py-1 text-left font-cinzel text-xs uppercase tracking-wide text-[#2c1d0f]">
            {children}
          </th>
        ),
        td: ({ children }) => <td className="border border-[#7a4c25]/40 px-2 py-1 align-top">{children}</td>,
      }}
    >
      {conteudo}
    </ReactMarkdown>
  </div>
);

export default LeitorMarkdown;
