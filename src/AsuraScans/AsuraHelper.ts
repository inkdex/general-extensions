export function getFilterTagsBySection(section: string, tags: string[]): string[] {
  return tags
    ?.filter((x: string) => x.startsWith(`${section}_`))
    .map((x: string) => {
      return x.replace(`${section}_`, "");
    });
}
