import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';

@Injectable()
export class EmailTemplateService {
  render(templateAbsolutePath: string, variables: Record<string, string>): string {
    const template = readFileSync(templateAbsolutePath, 'utf-8');
    return this.replaceVariables(template, variables);
  }

  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escaped, 'g'), value ?? '');
    }
    return result;
  }
}
