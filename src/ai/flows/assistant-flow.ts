'use server';
/**
 * @fileOverview Fluxo de IA para o Assistente de Negócios da MRD Brindes.
 *
 * - assistantFlow - Lida com as perguntas do usuário sobre o negócio.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssistantInputSchema = z.object({
  message: z.string().describe('A pergunta ou mensagem do usuário.'),
  context: z.string().optional().describe('Contexto opcional sobre clientes e cobranças para ajudar na resposta.'),
});

const AssistantOutputSchema = z.object({
  reply: z.string().describe('A resposta gerada pelo assistente.'),
});

export async function askAssistant(input: z.infer<typeof AssistantInputSchema>) {
  return assistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assistantPrompt',
  input: { schema: AssistantInputSchema },
  output: { schema: AssistantOutputSchema },
  prompt: `Você é o Assistente Inteligente da MRD Brindes, um sistema de gerenciamento de raspinhas e prêmios.
Sua função é ajudar o vendedor/gestor a entender melhor seus dados, rotas e clientes.

Use o contexto fornecido abaixo para responder de forma precisa e profissional.
Se o contexto não contiver a informação necessária, use seu conhecimento geral sobre vendas e rotas, mas deixe claro que é uma sugestão geral.

Mantenha as respostas curtas e diretas ao ponto, ideais para leitura rápida no celular.

Contexto do Negócio:
{{{context}}}

Pergunta do Usuário:
{{{message}}}`,
});

const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
