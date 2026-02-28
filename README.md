# MRD Brindes - Sistema de Gerenciamento de Raspinhas

Este é um sistema PWA (Progressive Web App) desenvolvido para gerenciamento de clientes, rotas, prêmios e cobranças de raspinhas.

## Principais Funcionalidades

- **Gestão de Clientes**: Cadastro completo com localização GPS e integração direta com WhatsApp.
- **Controle de Cobranças**: Registro de vendas, cálculo automático de comissão e geração de recibos térmicos (80mm).
- **Mapa de Clientes**: Visualização geográfica dos clientes com status de visita (Visitado vs. Não Visitado).
- **Gestão de Estoque de Prêmios**: Controle de brindes e kits iniciais.
- **Relatórios**: Histórico de cobranças e despesas com filtros por rota e data.
- **Modo PWA**: Instalável em dispositivos móveis com suporte a tela cheia.
- **Animações de Sucesso**: Feedback visual em todas as operações de salvamento.

## Como subir para o seu GitHub

Como este ambiente é um protótipo, você pode baixar os arquivos e usar os comandos abaixo no seu terminal local:

1. Inicie o repositório: `git init`
2. Adicione os arquivos: `git add .`
3. Faça o primeiro commit: `git commit -m "Initial commit - MRD Brindes System"`
4. Conecte ao seu repositório remoto: `git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git`
5. Envie os arquivos: `git push -u origin main`

## Tecnologias Utilizadas

- **Frontend**: Next.js 14, React, Tailwind CSS, ShadCN UI.
- **Backend/Banco de Dados**: Firebase (Firestore, Auth).
- **Inteligência Artificial**: Google Genkit.
- **Mapas**: React Leaflet.
