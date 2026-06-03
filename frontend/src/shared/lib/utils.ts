// Форматирует ISO-дату в локализованную строку (DD.MM.YYYY HH:mm:ss)
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(dateStr));
}

// Форматирует скорость с точностью до 1 знака и припиской единиц измерения
export function formatSpeed(speed: number): string {
  return `${speed.toFixed(1)} км/ч`;
}

// Форматирует географическую координату с 6 знаками после запятой
export function formatCoord(value: number): string {
  return value.toFixed(6);
}

// Возвращает «N слово» с правильным падежом через Intl.PluralRules.
// forms — массив [one, few, many], например ["событие", "события", "событий"]
const ruPlural = new Intl.PluralRules("ru-RU");
export function pluralize(n: number, forms: [string, string, string]): string {
  const category = ruPlural.select(n);
  const form =
    category === "one" ? forms[0] : category === "few" ? forms[1] : forms[2];
  return `${n} ${form}`;
}
