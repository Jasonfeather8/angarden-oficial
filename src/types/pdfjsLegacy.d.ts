// O build `legacy` do pdf.js é o caminho de compatibilidade oficial da Mozilla
// (embute o polyfill de `Map/WeakMap.prototype.getOrInsertComputed`) e não
// publica declarações de tipo próprias: os tipos vêm do pacote raiz.
declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export * from 'pdfjs-dist';
}
