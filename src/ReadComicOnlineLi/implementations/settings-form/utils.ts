export function normalizeSettingIds(
  value: unknown,
  knownIds: string[],
  includeMissing: boolean,
): string[] {
  const knownIdSet = new Set(knownIds);
  const normalizedIds: string[] = [];

  if (Array.isArray(value)) {
    for (const id of value) {
      if (typeof id === "string" && knownIdSet.has(id) && !normalizedIds.includes(id)) {
        normalizedIds.push(id);
      }
    }
  }

  if (includeMissing) {
    for (const id of knownIds) {
      if (!normalizedIds.includes(id)) {
        normalizedIds.push(id);
      }
    }
  }

  return normalizedIds;
}

export function moveSettingId(
  ids: string[],
  sourceIndex: number,
  destinationIndex: number,
  fallbackId?: string,
): string[] {
  const id = ids[sourceIndex] ?? fallbackId;
  if (!id) {
    return ids;
  }

  const nextIds = [...ids];
  removeSettingId(nextIds, sourceIndex, id);
  const boundedDestinationIndex = Math.max(0, Math.min(destinationIndex, nextIds.length));
  nextIds.splice(boundedDestinationIndex, 0, id);

  return nextIds;
}

export function removeSettingId(ids: string[], index: number, id: string): void {
  const existingIndex = ids[index] === id ? index : ids.indexOf(id);
  if (existingIndex >= 0) {
    ids.splice(existingIndex, 1);
  }
}

export function getCallbackIndexes(args: unknown[]): number[] {
  return args.filter((arg): arg is number => typeof arg === "number");
}

export function getCallbackRowId(args: unknown[]): string | undefined {
  for (const arg of args) {
    if (typeof arg === "string") {
      return arg;
    }

    if (typeof arg === "object" && arg !== null && "id" in arg) {
      const rowId = (arg as { id?: unknown }).id;
      if (typeof rowId === "string") {
        return rowId;
      }
    }
  }

  return undefined;
}

export function normalizePrefixedSettingId(
  value: string,
  prefix: string,
  isKnown: (id: string) => boolean,
): string | undefined {
  const id = value.startsWith(prefix) ? value.slice(prefix.length) : value;

  return isKnown(id) ? id : undefined;
}
