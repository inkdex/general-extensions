function getState<T>(key: string, defaultValue: T): T {
  return (Application.getState(key) as T | undefined) ?? defaultValue;
}

export { getState };
