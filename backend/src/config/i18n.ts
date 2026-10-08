import i18next from 'i18next';
import * as i18nextMiddleware from 'i18next-http-middleware';
const middleware = (i18nextMiddleware as any).default || i18nextMiddleware;
import Backend from 'i18next-fs-backend';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

i18next
    .use(Backend)
    .use(middleware.LanguageDetector)
    .init({
        fallbackLng: 'en',
        preload: ['en', 'es', 'fr'],
        backend: {
            loadPath: path.join(__dirname, '../locales/{{lng}}.json'),
        },
        detection: {
            order: ['header', 'querystring', 'cookie'],
            lookupHeader: 'accept-language',
            lookupQuerystring: 'lang',
        },
    });

export const i18nMiddleware = middleware.handle(i18next);
export { i18next };