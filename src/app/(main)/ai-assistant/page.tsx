'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, Loader2, User, Bot } from 'lucide-react';
import { askAssistant } from '@/ai/flows/assistant-flow';
import { useCollection } from '@/firebase';
import type { Client, Cobranca } from '@/lib/types';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou o assistente da IVOPAY BRINDES. Como posso ajudar com seus clientes ou cobranças hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: clients } = useCollection<Client>('clients');
  const { data: cobrancas } = useCollection<Cobranca>('cobrancas');

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    // Prepare context for Gemini
    const context = `
      Clientes Atuais: ${clients?.length || 0}
      Últimas Cobranças: ${cobrancas?.slice(0, 10).map(c => `${c.clientName} (R$ ${c.netRevenue})`).join(', ')}
      Rotas: ${Array.from(new Set(clients?.map(c => c.route))).join(', ')}
    `;

    try {
      const response = await askAssistant({ 
        message: userMessage,
        context 
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um problema ao processar sua pergunta. Tente novamente.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 px-2">
        <Sparkles className="h-6 w-6 text-primary animate-pulse" />
        <h1 className="text-xl font-bold font-headline">Assistente IA</h1>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden bg-card/50 backdrop-blur-sm border-border/40 shadow-xl">
        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
          <ScrollArea ref={scrollRef} className="flex-1 p-4 space-y-4">
            <div className="space-y-4 pb-4">
              {messages.map((msg, i) => (
                <div key={i} className={cn(
                  "flex items-start gap-2 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}>
                  <div className={cn(
                    "p-2.5 rounded-2xl text-sm shadow-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted text-foreground rounded-tl-none border border-border/50"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse ml-2">
                  <Bot className="h-4 w-4" />
                  <span className="text-xs">O Gemini está pensando...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 border-t bg-background/50">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Input 
                placeholder="Pergunte sobre clientes, rotas..." 
                className="h-11 rounded-full px-4 text-base focus-visible:ring-primary"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="rounded-full h-11 w-11 shrink-0 shadow-lg"
                disabled={isTyping || !input.trim()}
              >
                {isTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-[10px] text-center text-muted-foreground px-4">
        O assistente pode cometer erros. Verifique informações importantes nos relatórios oficiais.
      </p>
    </div>
  );
}
