import { setupServer } from "msw/node";
import { handlers } from "~/mocks/handlers";

// テスト（Node.js）で使う。src/__setup__/setup.ts で起動する
export const server = setupServer(...handlers);
