# 🌸 Violeta – Silêncio Nunca Mais

Aplicativo mobile de segurança e proteção para mulheres em ambientes universitários.

---

## 📱 Sobre o Projeto

O **Violeta** é um MVP desenvolvido para o Hackathon do Programa "Do Piauí para o Mundo" (SEDUC-PI, 2026). A solução oferece ferramentas de proteção imediata, registro sigiloso de evidências e suporte ao processo de denúncia para mulheres em situação de vulnerabilidade, com foco inicial no ambiente universitário.

---

## 🚨 Funcionalidades

### Botão SOS
- Aciona alerta de emergência com um único toque
- Abre o discador automaticamente com o número 190 (Polícia Militar)
- Envia SMS com localização atual para contatos cadastrados

### 👥 Rede de Proteção
- Cadastro de contatos de emergência
- Dados salvos localmente no dispositivo
- Contatos recebem alerta automático ao acionar o SOS

### 🎙️ Gravação Discreta
- Gravação de áudio em segundo plano (funciona com a tela bloqueada)
- Gravação de vídeo com a câmera do dispositivo
- Arquivos salvos automaticamente na galeria
- Compartilhamento direto via WhatsApp, e-mail ou outros apps
- Histórico de gravações persistente

### 📍 Pontos de Risco
- Lista de locais de atenção no campus
- Usuária pode reportar novos pontos
- Informações sobre horários de maior risco

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Uso |
|---|---|
| React Native + Expo | Framework principal |
| expo-av | Gravação de áudio |
| expo-camera | Gravação de vídeo |
| expo-location | Geolocalização |
| expo-sms | Envio de SMS |
| expo-sharing | Compartilhamento de arquivos |
| expo-media-library | Salvar na galeria |
| AsyncStorage | Persistência local de dados |
| React Navigation | Navegação entre telas |

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js 20+
- Expo Go instalado no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

### Instalação

No prompt de comando do seu SO, faça:

```bash
# Clonar o repositório
git clone https://github.com/yasminantonelaa/Violeta-app.git
cd Violeta-app

# Instalar dependências
npm install --legacy-peer-deps

# Iniciar o projeto
npx expo start --tunnel
```

Escaneie o QR code com o Expo Go no celular.

---

## 👤 Público-Alvo

Mulheres e públicos afins entre 16 e 50 anos, estudantes de graduação ou pós-graduação, com renda per capita de até 3 salários mínimos, usuárias frequentes de transporte público.

---

## 📊 Validação

Pesquisa de mercado realizada com **105 participantes** de Teresina (PI) e Timon (MA), entre 14 e 15 de maio de 2026:

- **64,8%** já tiveram contato com situações de assédio no ambiente universitário
- **70,5%** consideraram o botão SOS a funcionalidade mais importante
- **59%** aprovaram o registro sigiloso de evidências
- **56,2%** deram nota máxima para a consulta de antecedentes criminais

---

## 💜 Impacto Social

> *"49% das brasileiras com 16 anos ou mais foram vítimas de assédio em 2025 — o maior índice já registrado."*
> — Fórum Brasileiro de Segurança Pública, 2025

> *"60% das universidades federais não possuem políticas de combate ao assédio."*
> — Tribunal de Contas da União (TCU), 2025

> *"81% das vítimas de violência no ambiente universitário não realizaram nenhuma denúncia."*
> — Observatório Caleidoscópio, Unicamp, 2024

O Violeta atua diretamente nessas três frentes: proteção imediata, facilitação de denúncias e criação de uma rede de proteção coletiva.

---

## 📎 Links

- 🔗 Repositório: [github.com/yasminantonelaa/Violeta-app](https://github.com/yasminantonelaa/Violeta-app)
- 📄 Guia Técnico: em anexo

---

## 📜 Licença

Projeto desenvolvido para fins educacionais — Hackathon Programa Do Piauí para o Mundo, SEDUC-PI, 2026.
