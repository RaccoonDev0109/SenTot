export function parseDurationToMs(input: string): number {
  const s = input.trim();
  const m = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(s);
  if (!m) throw new Error(`Invalid duration: ${input}`);
  const value = Number(m[1]);
  const unit = m[2].toLowerCase();
  switch (unit) {
    case "ms":
      return value;
    case "s":
      return value * 1000;
    case "m":
      return value * 60_000;
    case "h":
      return value * 3_600_000;
    case "d":
      return value * 86_400_000;
    default:
      throw new Error(`Invalid duration unit: ${unit}`);
  }
}

