export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    const g = globalThis as any;
    if (typeof g.scheduler !== "undefined" && typeof g.scheduler.postTask === "function") {
      g.scheduler.postTask(() => resolve(), { priority: "user-visible" }).catch(() => {
        setTimeout(resolve, 0);
      });
    } else if (typeof g.requestIdleCallback === "function") {
      g.requestIdleCallback(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}
