import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface RenderOptions {
  template: string; // e.g. 'email-verification', 'password-reset', 'welcome'
  subject: string;
  data?: Record<string, any>;
}

export class MailTemplateEngine {
  private static templatesDir = path.join(__dirname, 'templates');
  private static templateCache = new Map<string, string>();

  /**
   * Read raw template HTML from disk with caching
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
   * Replace {{placeholder}} variables dynamically in HTML string
   */
  private static replacePlaceholders(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
      return data[key] !== undefined && data[key] !== null ? String(data[key]) : match;
    });
  }

  /**
   * Render target template and bind inside base layout.html wrapper
   */
  static render(options: RenderOptions): string {
    const { template, subject, data = {} } = options;

    const globalData: Record<string, any> = {
      appName: 'AuthService',
      currentYear: new Date().getFullYear().toString(),
      subject,
      ...data,
    };

    // 1. Load layout.html and target content template file
    const layoutRaw = this.getTemplateContent('layout.html');
    const templateFileName = template.endsWith('.html') ? template : `${template}.html`;
    const templateRaw = this.getTemplateContent(templateFileName);

    // 2. Replace variables in content template
    const compiledContent = this.replacePlaceholders(templateRaw, globalData);

    // 3. Inject compiled content into layout's {{bodyContent}} placeholder
    const fullData = { ...globalData, bodyContent: compiledContent };
    return this.replacePlaceholders(layoutRaw, fullData);
  }
}