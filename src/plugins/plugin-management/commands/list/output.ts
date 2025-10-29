/**
 * List Plugins Command Output
 * Defines output schema and template for the list plugins command
 */
import { z } from 'zod';
import { ListPluginsOutputSchema } from '../../schema';

// Export the schema
export { ListPluginsOutputSchema };

// Human-readable template
export const LIST_PLUGINS_TEMPLATE = `📋 Available Plugins ({{count}}):

{{#each plugins}}
{{@index}}.
   Name: {{name}}
   Display Name: {{displayName}}
   Version: {{version}}
   Status: {{status}}
{{/each}}

Use "plugin-management info <name>" for detailed information`;

// Type export
export type ListPluginsOutput = z.infer<typeof ListPluginsOutputSchema>;
