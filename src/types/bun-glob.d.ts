// import.meta.glob is a Bun bundler transform. It is not yet present in
// @types/bun — this augmentation bridges the gap until upstream adds it.
// eslint-disable-next-line consistent-type-definitions -- declaration merging requires interface; type alias cannot be merged
interface ImportMeta {
  glob(pattern: string): Record<string, () => Promise<unknown>>;
  glob<T>(pattern: string, options: { eager: true }): Record<string, T>;
}
