/** Formatadores e helpers usados apenas pela tela de Dashboard. */

export const contar = (n: number, singular: string, plural: string) =>
  `${n} ${n === 1 ? singular : plural}`;

export const formatarNumero = (valor: number) => new Intl.NumberFormat('pt-BR').format(valor);

export const formatarQuando = (iso: string) => {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';

  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const diaDaEntrada = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(data);
  if (diaDaEntrada.getTime() === hoje.getTime()) return `Hoje às ${hora}`;
  hoje.setDate(hoje.getDate() - 1);
  if (diaDaEntrada.getTime() === hoje.getTime()) return `Ontem às ${hora}`;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(data);
};

export const pad = (value: number) => String(value).padStart(2, '0');

export const toDatetimeLocal = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const isHttpUrl = (value: string) => {
  try {
    const link = new URL(value);
    return ['http:', 'https:'].includes(link.protocol);
  } catch {
    return false;
  }
};

export const formatSessionDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export const formatToday = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(date);

export const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};
