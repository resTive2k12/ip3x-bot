export interface Controller {
  initializeListeners(): void;
  onReady?(): void | Promise<void>;
}
