import type { Cobranca } from '@/lib/types';
import { AppLogo } from '@/components/layout/logo';

function formatCurrency(value: number | undefined) {
    if (value === undefined) return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

const ReceiptRow = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex justify-between">
        <span>{label}</span>
        <span className="text-right">{value}</span>
    </div>
);

export function Receipt({ cobranca }: { cobranca: Cobranca }) {
    return (
        <div className="bg-white text-black font-mono text-xs p-2">
            <div className="text-center mb-4 space-y-2">
                <div className="flex justify-center">
                    <AppLogo className="text-black" logoBoxCn="bg-black text-white" logoTextCn="text-black" />
                </div>
                <p>CNPJ: 12.345.678/0001-99</p>
                <p>Rua Fictícia, 123 - Centro</p>
                <p>----------------------------------------</p>
            </div>
            
            <div className="space-y-1 mb-2">
                <p><span className="font-bold">Cliente:</span> {cobranca.clientName}</p>
                <p><span className="font-bold">Data:</span> {formatDate(cobranca.createdAt)}</p>
            </div>

            <div className="border-t border-b border-dashed border-black py-2 my-2 space-y-1">
                <h3 className="text-center font-bold mb-2">DETALHES DA COBRANÇA</h3>
                <ReceiptRow label="Qtd. Raspadinhas:" value={cobranca.scratchedAmount} />
                <ReceiptRow label="Valor Unid.:" value={formatCurrency(cobranca.scratchPrice)} />
                <ReceiptRow label="Total Bruto:" value={formatCurrency(cobranca.grossRevenue)} />
                <ReceiptRow label={`Comissão (${cobranca.commissionPercentage}%):`} value={`-${formatCurrency(cobranca.commissionValue)}`} />
                {cobranca.discount && cobranca.discount > 0 && (
                    <ReceiptRow label="Desconto:" value={`-${formatCurrency(cobranca.discount)}`} />
                )}
                <div className="border-t border-dashed border-black my-1"></div>
                <div className="flex justify-between font-bold text-sm">
                    <span>TOTAL LÍQUIDO:</span>
                    <span>{formatCurrency(cobranca.netRevenue)}</span>
                </div>
            </div>

            { (cobranca.kitStatus || cobranca.cartelaStatus) &&
              <div className="border-b border-dashed border-black pb-2 mb-2 space-y-1">
                  <h3 className="text-center font-bold mb-2">STATUS</h3>
                   {cobranca.kitStatus && <ReceiptRow label="Kit:" value={cobranca.kitStatus === 'novo' ? 'Recebeu Novo' : 'Manteve'} />}
                   {cobranca.cartelaStatus && <ReceiptRow label="Cartela:" value={cobranca.cartelaStatus === 'nova' ? 'Recebeu Nova' : 'Manteve'} />}
              </div>
            }

            {cobranca.prizesGiven && cobranca.prizesGiven.length > 0 && (
                <div className="border-b border-dashed border-black pb-2 mb-2 space-y-1">
                    <h3 className="text-center font-bold mb-2">PRÊMIOS ENTREGUES</h3>
                    {cobranca.prizesGiven.map(prize => (
                        <ReceiptRow key={prize.prizeId} label={prize.prizeName} value={`x${prize.quantity}`} />
                    ))}
                </div>
            )}

            <div className="text-center mt-4 space-y-2">
                <p className="font-bold">RECIBO SEM VALOR FISCAL</p>
                <p>----------------------------------------</p>
                <p>Obrigado pela preferência!</p>
            </div>
        </div>
    );
}
