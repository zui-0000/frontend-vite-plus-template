import { setupWorker } from "msw/browser";
import { handlers } from "~/mocks/handlers";

// 開発中のブラウザで使う。Service Worker のスクリプトは vite.config.ts の msw プラグインが配信する
export const worker = setupWorker(...handlers);
