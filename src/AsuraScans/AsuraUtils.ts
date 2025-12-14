import { type Filters } from "./interfaces/AsuraScansInterfaces";

export async function setFilters(data: Filters) {
  for (const genre of data.genres) {
    Application.setState(genre.id.toString(), genre.name.toUpperCase());
  }
}

export async function getFilter(filter: string): Promise<string> {
  const genre = ((await Application.getState(filter.toUpperCase())) as string) ?? "";
  return genre.toString();
}

export async function getMangaId(slug: string): Promise<string> {
  const id = idCleaner(slug) + "-";

  return id;
}

function idCleaner(str: string): string {
  let cleanId: string | null = str;
  cleanId = cleanId.replace(/\/$/, "");
  cleanId = cleanId.split("/").pop() ?? null;
  // Remove randomised slug part
  cleanId = cleanId?.substring(0, cleanId?.lastIndexOf("-")) ?? null;

  if (!cleanId) {
    throw new Error(`Unable to parse id for ${str}`);
  }

  return cleanId;
}
