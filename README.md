# MRD Brindes - Sistema de Gerenciamento de Raspinhas

Este é um sistema PWA (Progressive Web App) desenvolvido para gerenciamento de clientes, rotas, prêmios e cobranças de raspinhas.

## Como subir para o seu GitHub

Para enviar este projeto para o repositório que você criou, siga estes passos no seu terminal local:

1. **Baixe os arquivos** do projeto para o seu computador.
2. **Abra o terminal** na pasta do projeto.
3. **Execute os comandos abaixo**:

```bash
# Inicie o repositório local
git init

# Adicione os arquivos
git add .

# Faça o primeiro commit
git commit -m "Initial commit - MRD Brindes System"

# Configure a branch principal
git branch -M main

# Conecte ao seu repositório remoto
git remote add origin https://github.com/lirofyu-web/studio.git

# Envie os arquivos (será solicitado seu usuário e senha/token do GitHub)
git push -u origin main
```

## Principais Funcionalidades

- **Gestão de Clientes**: Cadastro completo com localização GPS e integração direta com WhatsApp.
- **Controle de Cobranças**: Registro de vendas, cálculo automático de comissão e geração de recibos térmicos (80mm).
- **Mapa de Clientes**: Visualização geográfica dos clientes com status de visita (Visitado vs. Não Visitado).
- **Gestão de Estoque de Prêmios**: Controle de brindes e kits iniciais.
- **Relatórios**: Histórico de cobranças e despesas com filtros por rota e data.
- **Modo PWA**: Instalável em dispositivos móveis com suporte a tela cheia.
- **Animações de Sucesso**: Feedback visual em todas as operações de salvamento.

## Tecnologias Utilizadas

- **Frontend**: Next.js 14, React, Tailwind CSS, ShadCN UI.
- **Backend/Banco de Dados**: Firebase (Firestore, Auth).
- **Inteligência Artificial**: Google Genkit.
- **Mapas**: React Leaflet.
