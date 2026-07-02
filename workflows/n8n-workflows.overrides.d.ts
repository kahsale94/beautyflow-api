import '@n8n-as-code/transformer';

declare module '@n8n-as-code/transformer' {
    export interface WorkflowDecoratorOptions {
        tags?: string[];
    }
}
