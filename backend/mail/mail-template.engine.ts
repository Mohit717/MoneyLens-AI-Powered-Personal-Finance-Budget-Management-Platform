import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface RenderOptions {
    templateName: 'email-verification' | 'password-reset';
    subject: string;
    data: Record<string, string>;
}

export class MailTemplateEngine {
    private static templatesDir = path.join(__dirname, 'templates');
    private static templateCache = new Map<string, string>();

    /**
     * Load raw template content from disk with caching
     */
    private static getTemplateContent(fileName: string): string {
        if (this.templateCache.has(fileName)) {
            return this.templateCache.get(fileName)!;
        }

        const filePath = path.join(this.templatesDir, fileName);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Email template file not found: ${filePath}`);
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        this.templateCache.set(fileName, content);
        return content;
    }

    /**
     * Replace {{key}} placeholders in string template
     */
    private static replacePlaceholders(template: string, data: Record<string, string>): string {
        return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
            return data[key] !== undefined ? data[key] : match;
        });
    }

    /**
     * Render template and bind into layout HTML
     */
    static render(options: RenderOptions): string {
        const { templateName, subject, data } = options;

        // Default global variables
        const globalData: Record<string, string> = {
            appName: 'AuthService',
            currentYear: new Date().getFullYear().toString(),
            subject,
            ...data,
        };

        // 1. Load layout.html and target content template
        const layoutRaw = this.getTemplateContent('layout.html');
        const templateRaw = this.getTemplateContent(`${templateName}.html`);

        // 2. Replace placeholders in content template
        const compiledContent = this.replacePlaceholders(templateRaw, globalData);

        // 3. Bind compiled content into layout's {{bodyContent}} placeholder
        const fullData = { ...globalData, bodyContent: compiledContent };
        const finalHtml = this.replacePlaceholders(layoutRaw, fullData);

        return finalHtml;
    }
}