export function signals(signals: string[]): Promise<string> {
  return new Promise<string>((resolve) => {
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`Received ${signal}`);
        resolve(signal);
      });
    });
  });
}

export function promiseSequential<T>(
  promiseFns: (() => Promise<T>)[],
): Promise<T[]> {
  return promiseFns.reduce<Promise<T[]>>(async (accP, promiseFn) => {
    const acc = await accP;
    const value = await promiseFn();
    return [...acc, value];
  }, Promise.resolve([]));
}
