# Documentação Técnica — Violeta: Silêncio Nunca Mais
## Versão 1.0.0 — MVP (Etapa 1)

**Plataforma:** React Native 0.81.5 + Expo SDK 54  
**Instituição:** PIT — Piauí Instituto de Tecnologia  
**Contexto:** Hackathon SEDUC-PI — Programa "Do Piauí para o Mundo", 2026  
**Orientador:** Prof. Me. Tiago Martins Ribeiro  
**Equipe:** Gabriel Furlan de Carvalho Silva · Markus Aurelius Nunes de Holanda · Ryan Carvalho Campelo · Yasmin Antonela Nascimento Oliveira  
**Repositório:** https://github.com/yasminantonelaa/Violeta-app

---

## 1. Visão Geral do Sistema

O Violeta é uma aplicação mobile de segurança voltada ao empoderamento e à proteção de mulheres em ambientes universitários. A solução integra, em uma única plataforma, mecanismos de resposta imediata a emergências, coleta sigilosa de evidências, mapeamento colaborativo de riscos e suporte ao processo de denúncia formal.

O MVP (Etapa 1) foi construído com base em pesquisa quantitativa primária conduzida com 105 participantes nas cidades de Teresina (PI) e Timon (MA), que confirmou: 64,8% dos respondentes já tiveram contato com situações de assédio no ambiente universitário, e 70,5% identificaram o botão SOS como a funcionalidade de maior valor percebido.

### 1.1 Premissas de Design de Sistema

- **Offline-first para funcionalidades críticas:** as operações de segurança imediata (SOS, gravação, contatos) não dependem de conectividade com servidores externos.
- **Compartilhamento colaborativo para informações coletivas:** pontos de risco são persistidos em API remota para serem visíveis a todas as usuárias da plataforma.
- **Privacidade por padrão:** dados de identidade, senha e histórico de gravações são armazenados exclusivamente no dispositivo da usuária, sem transmissão a servidores de terceiros.
- **Degradação graciosa de permissões:** a negação de qualquer permissão do sistema operacional não trava a aplicação; cada módulo exibe feedback contextual e continua operacional nas capacidades remanescentes.

---

## 2. Arquitetura do Sistema

### 2.1 Modelo Arquitetural

O MVP adota uma **arquitetura híbrida cliente-local/cloud seletivo**, dividida em quatro camadas funcionais.

```
┌──────────────────────────────────────────────────────────────────┐
│                         DISPOSITIVO MÓVEL                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  CAMADA DE AUTENTICAÇÃO E NAVEGAÇÃO — App.js               │  │
│  │                                                            │  │
│  │  Estado: 'carregando' → 'login' → 'cadastro' → 'app'       │  │
│  │  Bottom Tab Navigator (React Navigation 6)                 │  │
│  └───────────────────────────┬────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────▼────────────────────────────────┐  │
│  │  CAMADA DE APRESENTAÇÃO — src/screens/                     │  │
│  │                                                            │  │
│  │  LoginScreen      CadastroScreen                           │  │
│  │  HomeScreen       ContatosScreen                           │  │
│  │  GravacaoScreen   MapaScreen                               │  │
│  └────────┬─────────────────────────────────┬─────────────────┘  │
│           │                                 │                    │
│  ┌────────▼──────────────────┐  ┌───────────▼──────────────────┐ │
│  │  CAMADA DE HARDWARE       │  │  CAMADA DE PERSISTÊNCIA      │ │
│  │  Expo SDK 54              │  │                              │ │
│  │                           │  │  Local (offline-first)       │ │
│  │  expo-location (GPS)      │  │  AsyncStorage                │ │
│  │  expo-sms                 │  │  @usuarios · @usuarioLogado  │ │
│  │  expo-av (áudio)          │  │  @contatos · @gravacoes      │ │
│  │  expo-camera (vídeo)      │  │                              │ │
│  │  expo-media-library       │  │  Remota (cloud seletivo)     │ │
│  │  expo-sharing             │  │  jsonbin.io REST API v3      │ │
│  │  react-native-maps        │  │  (pontos de risco            │ │
│  │  Linking (tel://)         │  │   compartilhados)            │ │
│  └────────┬──────────────────┘  └───────────┬──────────────────┘ │
│           │                                 │                    │
└───────────│─────────────────────────────────│────────────────────┘
            │                                 │
    ┌───────▼────────┐              ┌──────────▼───────────────┐
    │  Sistema       │              │  jsonbin.io              │
    │  Operacional   │              │  REST API v3             │
    │  (SMS, galeria,│              │  GET/PUT /v3/b/{BIN_ID}  │
    │   discador)    │              │  Header: X-Master-Key    │
    └────────────────┘              └──────────────────────────┘
```

### 2.2 Camada de Autenticação e Navegação (`App.js`)

Controlador principal da aplicação. Implementa uma máquina de estados finita com quatro valores possíveis:

| Estado | Descrição | Tela renderizada |
|---|---|---|
| `'carregando'` | Estado inicial; consulta `AsyncStorage` | `null` (sem render) |
| `'login'` | Sessão inexistente ou encerrada | `LoginScreen` |
| `'cadastro'` | Usuária optou por criar conta | `CadastroScreen` |
| `'app'` | Sessão ativa confirmada | `NavigationContainer` + `Tab.Navigator` |

A transição `'carregando' → 'login'|'app'` ocorre no `useEffect` inicial via `verificarLogin()`, que consulta a chave `@usuarioLogado` no `AsyncStorage`. A renderização condicional é resolvida antes de qualquer componente de tela ser montado, evitando flash de tela incorreta.

O `Tab.Navigator` é configurado com `screenOptions` globais que definem paleta de cores, cabeçalho e o botão de encerramento de sessão (presente em todas as abas via `headerRight`). O logout remove `@usuarioLogado` e reverte o estado para `'login'`, desmontando o `NavigationContainer`.

### 2.3 Camada de Apresentação (`src/screens/`)

Todos os componentes de tela são **componentes funcionais React Native** sem camada de gerenciamento de estado global. A comunicação entre telas de autenticação e o controlador ocorre via **callbacks injetados como props** (`onLogin`, `onCadastro`, `onVoltar`, `onIrCadastro`). A comunicação entre telas do aplicativo principal ocorre via `AsyncStorage` como repositório compartilhado — lido a cada montagem ou foco de tela via `useFocusEffect`.

### 2.4 Camada de Hardware (Expo SDK 54)

Abstração unificada sobre as APIs nativas de Android e iOS. Todas as permissões são solicitadas em tempo de execução utilizando as APIs de hook (`useCameraPermissions`, `useMicrophonePermissions`, `MediaLibrary.usePermissions`) ou funções assíncronas (`requestForegroundPermissionsAsync`, `requestPermissionsAsync`). A tabela de permissões completa está na Seção 8.

### 2.4.1 Diferencial Arquitetural: Nova Arquitectura React Native

O `app.json` habilita `"newArchEnabled": true`, ativando a **Nova Arquitetura do React Native** (Fabric + JSI). Isso implica comunicação síncrona entre JavaScript e nativo via JSI em vez de bridge assíncrona, com impacto direto na responsividade do botão SOS e do preview de câmera.

### 2.5 Camada de Persistência

#### 2.5.1 AsyncStorage (persistência local)

Banco chave-valor assíncrono baseado em armazenamento nativo do dispositivo. Todas as operações de leitura/escrita são `async/await`. O padrão de atualização adotado é **otimista**: o estado React é atualizado imediatamente e a persistência ocorre na sequência, mantendo a UI responsiva.

#### 2.5.2 jsonbin.io REST API (persistência remota — Pontos de Risco)

Serviço de armazenamento de JSON na nuvem utilizado como backend compartilhado para o módulo de Mapa. A integração utiliza a API v3 com autenticação via header `X-Master-Key`. A coleção é um documento JSON único com a estrutura `{ pontos: Ponto[] }`, persistido via `PUT` a cada adição ou remoção de ponto.

```
GET  https://api.jsonbin.io/v3/b/{BIN_ID}   → carrega todos os pontos
PUT  https://api.jsonbin.io/v3/b/{BIN_ID}   → substitui a coleção inteira
```

> **Limitação de segurança:** a chave de acesso está embutida no código-fonte (`ACCESS_KEY` em `MapaScreen.js`). Em produção, essa credencial deve ser movida para variáveis de ambiente e protegida por um proxy de backend próprio.

---

## 3. Módulos de Tela — Especificação Técnica

### 3.1 `LoginScreen.js` — Autenticação

**Entradas:** `onLogin: () => void`, `onIrCadastro: () => void`

**Responsabilidade:** autenticar uma usuária previamente cadastrada no dispositivo. O processo é executado em três etapas sequenciais:

1. **Validação de campos:** campos obrigatórios verificados antes de qualquer acesso ao `AsyncStorage`, evitando operações desnecessárias.
2. **Busca no repositório local:** desserialização de `@usuarios` e localização por correspondência case-insensitive de `usuario` + igualdade estrita de `senha`.
3. **Persistência de sessão:** gravação do objeto da usuária encontrada em `@usuarioLogado` e invocação de `onLogin()`.

**Estados locais:**

```js
const [usuario, setUsuario] = useState('');
const [senha, setSenha] = useState('');
const [senhaVisivel, setSenhaVisivel] = useState(false);
```

**Recuperação de conta:** a função `esqueceuSenha()` verifica a existência da conta pelo `usuario` e exibe uma dica contextual sem revelar a senha. Caso o usuário não seja encontrado, exibe mensagem de erro. Não implementa reset de senha — limitação documentada para versões futuras.

**Nota de segurança:** senhas são comparadas em texto plano. A implementação de hash com salt (bcrypt/argon2) é pré-requisito para o build de produção (Etapa 3).

---

### 3.2 `CadastroScreen.js` — Criação de Conta

**Entradas:** `onCadastro: () => void`, `onVoltar: () => void`

**Responsabilidade:** registrar uma nova usuária com validação em cascata de sete etapas e autodeclaração obrigatória de identidade de gênero.

**Pipeline de validação (ordem de execução):**

| Etapa | Regra | Mensagem de erro |
|---|---|---|
| 1 | Todos os campos de texto preenchidos | "Preencha todos os campos." |
| 2 | `usuario.length >= 3` | "O nome de usuário deve ter pelo menos 3 caracteres." |
| 3 | `senha.length >= 6` | "A senha deve ter pelo menos 6 caracteres." |
| 4 | `senha === confirmarSenha` | "As senhas não coincidem." |
| 5 | `generoSelecionado !== null` | "Por favor, selecione como você se identifica." |
| 6 | `aceitouTermos === true` | "Por favor, confirme sua autodeclaração." |
| 7 | Unicidade de `usuario` (case-insensitive) | "Este nome de usuário já está em uso." |

**Opções de gênero** (array constante `GENEROS`, definido fora do componente para evitar recriação a cada render):

```js
const GENEROS = [
  'Mulher cisgênero', 'Mulher transgênero', 'Não binário',
  'Gênero fluido', 'Agênero', 'Outro gênero correlato ao feminino',
];
```

**Criação de ID:** `Date.now().toString()` — timestamp Unix em milissegundos. Suficiente para unicidade em banco local. Para sincronização multi-dispositivo (Etapa 2), substituir por UUID v4.

---

### 3.3 `HomeScreen.js` — Botão SOS

**Responsabilidade:** executar a sequência de acionamento de emergência com latência mínima e máxima confiabilidade, funcionando independentemente de conectividade à internet.

**Sequência de execução ao pressionar SOS:**

```
1. Vibration.vibrate([500, 200, 500, 200, 500])
   → feedback tátil imediato; não aguarda resposta

2. Location.getCurrentPositionAsync({})
   → atualiza coordenadas; fallback: estado localizacao existente
   → fallback final: mensagem sem link de mapa

3. Montagem da mensagem:
   `🚨 ALERTA DE EMERGÊNCIA - VIOLETA\nPreciso de ajuda! Minha localização: ${linkMapa}`

4. SMS.sendSMSAsync(numeros[], mensagem)
   → abre app de SMS nativo com campos preenchidos
   → requere confirmação manual da usuária (limitação da API)

5. Alert.alert(...)
   → opções: "Ligar 190" → Linking.openURL('tel:190')
              "Fechar"   → encerra o fluxo
```

**Inicialização da tela:** ao montar (`useEffect`), `carregarContatos()` e `pedirPermissaoLocalizacao()` são disparados em paralelo. A permissão de localização é do tipo foreground (`requestForegroundPermissionsAsync`), adequada ao caso de uso onde o app está em primeiro plano durante a emergência.

**Indicadores de status:** a tela exibe em tempo real a contagem de contatos cadastrados e o estado do GPS (`localizacao !== null`), permitindo à usuária verificar a prontidão do SOS antes de uma situação de risco.

---

### 3.4 `ContatosScreen.js` — Rede de Proteção

**Responsabilidade:** gerenciar o cadastro de contatos de emergência que receberão o SMS de alerta ao acionar o SOS.

**Recarregamento entre sessões:** implementado via `useFocusEffect` + `useCallback([], [])`. O `useCallback` com array de dependências vazio é obrigatório para evitar loops de re-renderização — `useFocusEffect` exige uma função memorizada como argumento.

**Operações CRUD:**

- **Create:** validação de campos → criação de objeto com `id: Date.now().toString()` → atualização de estado → persistência em `@contatos`.
- **Read:** `AsyncStorage.getItem('@contatos')` → `JSON.parse()` → `setContatos()`. Encapsulado em `try/catch` para tratamento de dados corrompidos.
- **Delete:** `Alert.alert` com `style: 'destructive'` → `.filter(c => c.id !== id)` → atualização de estado e AsyncStorage.

**Renderização de lista:** `FlatList` com `keyExtractor={item => item.id}`. O uso de `FlatList` em vez de `.map()` dentro de `ScrollView` garante virtualização — apenas os itens visíveis são renderizados, prevenindo degradação de desempenho em listas extensas.

---

### 3.5 `GravacaoScreen.js` — Gravação Discreta de Evidências

**Responsabilidade:** capturar e persistir evidências de áudio e vídeo de forma discreta, com armazenamento automático na galeria do dispositivo e histórico persistente.

#### 3.5.1 Gravação de Áudio

**Configuração do modo de áudio (`Audio.setAudioModeAsync`):**

| Opção | Valor | Justificativa |
|---|---|---|
| `allowsRecordingIOS` | `true` | Habilita captura no iOS |
| `staysActiveInBackground` | `true` | Mantém gravação com tela bloqueada |
| `playsInSilentModeIOS` | `true` | Não interrompido pelo modo silencioso do iPhone |

**Codec e formato:** `Audio.RecordingOptionsPresets.HIGH_QUALITY` — AAC, `.m4a`, taxa de amostragem 44.1 kHz. Equilíbrio entre qualidade probatória e tamanho de arquivo.

**Ciclo de vida:**

```
iniciarAudio()
  └── Audio.setAudioModeAsync({ allowsRecordingIOS: true, ... })
  └── Audio.Recording.createAsync(HIGH_QUALITY)
  └── setGravacao(recording) · setGravandoAudio(true)

pararAudio()
  └── gravacao.stopAndUnloadAsync()      ← encerra captura e libera microfone
  └── gravacao.getURI()                  ← obtém caminho temporário do arquivo
  └── salvarNaGaleria(uri)               ← copia para álbum "Violeta"
  └── novo registro → [novo, ...registros]
  └── AsyncStorage.setItem('@gravacoes', JSON.stringify(lista))
```

#### 3.5.2 Gravação de Vídeo

**Gerenciamento da câmera:** o componente `CameraView` é referenciado via `useRef(null)` para acesso imperativo a `recordAsync()` e `stopRecording()`, sem causar re-renderizações. A câmera só é renderizada após `cameraPermission?.granted === true`.

**Ciclo de vida:**

```
iniciarVideo()
  └── verifica cameraPermission · micPermission (solicita se necessário)
  └── cameraRef.current.recordAsync({ maxDuration: 120 })
      ← Promise que aguarda até stopRecording() ser chamado
      ← resolve com { uri } após encerramento

pararVideo()
  └── cameraRef.current.stopRecording()
      ← sinaliza encerramento → Promise de recordAsync() resolve
      ← fluxo de salvamento executado em iniciarVideo() após o await
```

#### 3.5.3 Salvamento na Galeria

```js
async function salvarNaGaleria(uri) {
  const asset = await MediaLibrary.createAssetAsync(uri);
  await MediaLibrary.createAlbumAsync('Violeta', asset, false);
  // false = não move o arquivo original, cria referência no álbum
}
```

#### 3.5.4 Reprodução e Compartilhamento

- **Reprodução (áudio):** `Audio.Sound.createAsync({ uri })` → `sound.playAsync()`. Antes de carregar novo áudio, o anterior é descarregado via `reproducao.unloadAsync()` e o modo é trocado para `allowsRecordingIOS: false`.
- **Compartilhamento:** `Sharing.shareAsync(uri, { mimeType, dialogTitle })` abre o painel nativo de compartilhamento do SO, compatível com qualquer app instalado (WhatsApp, e-mail, Drive, etc.).

---

### 3.6 `MapaScreen.js` — Mapa Colaborativo de Riscos

**Responsabilidade:** exibir e gerenciar pontos de risco georreferenciados em um mapa interativo, com persistência compartilhada entre todas as usuárias via API remota.

Esta é a tela de maior complexidade na versão atualizada do MVP, representando uma evolução arquitetural significativa em relação à versão anterior — que utilizava apenas dados estáticos em estado local.

#### 3.6.1 Integração com Backend (jsonbin.io)

```js
const BIN_ID = '6a0e3a496877513b27a6c929';
const ACCESS_KEY = '$2a$10$vNFKR5...';  // ⚠️ deve ser movida para variável de ambiente
const URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
```

| Operação | Método HTTP | Trigger |
|---|---|---|
| Carregamento inicial | `GET` | Montagem da tela |
| Adição de ponto | `PUT` (lista completa) | Confirmação no modal |
| Remoção de ponto | `PUT` (lista filtrada) | Confirmação no alert |

A estratégia de escrita é **replace-all**: a cada modificação, a lista inteira é reenviada via `PUT`. Adequada para o volume de dados do MVP; para produção, substituir por endpoints granulares com controle de concorrência.

#### 3.6.2 Geocodificação Reversa

`Location.reverseGeocodeAsync(coords)` é invocada em dois momentos:

1. Na inicialização, para pré-preencher `bairro` e `cidade` com base na localização da usuária.
2. Ao tocar no mapa em modo de adição, para pré-preencher os campos com o endereço do ponto selecionado.

O campo `district` é priorizado sobre `subregion` para `bairro`; `city` sobre `region` para `cidade`.

#### 3.6.3 Modos de Visualização

A tela implementa dois modos de visualização alternados via estado `vistaAtual`:

- **Vista Mapa (`'mapa'`):** `MapView` com `showsUserLocation={true}`. Marcadores coloridos por nível de risco (`corDoNivel(nivel)`). Botões flutuantes para centralizar no GPS e recarregar da API. Modal inferior de detalhes ao tocar em marcador.
- **Vista Lista (`'lista'`):** `FlatList` com cards contendo nome, endereço, coordenadas formatadas, chips de horário e nível de risco. Toque no card navega para o mapa e abre o detalhe do ponto.

#### 3.6.4 Fluxo de Adição de Ponto

```
Botão "+ Reportar" → setAdicionando(true)

Toque no MapView (evento onPress)
  └── evento.nativeEvent.coordinate → setCoordSelecionada()
  └── Location.reverseGeocodeAsync() → pré-preenche bairro/cidade
  └── setModalVisivel(true) · setAdicionando(false)

Modal (campos: nome*, bairro*, cidade*, descrição, nível*, horários*)
  └── confirmarPonto()
      └── validações em cascata (4 campos obrigatórios)
      └── monta objeto Ponto com metadados completos
      └── fetch PUT → lista atualizada no jsonbin.io
      └── setPontos(lista) → novo Marker renderizado no MapView
```

#### 3.6.5 Região Inicial do Mapa

```js
const regiaoInicial = localizacao
  ? { latitude: localizacao.latitude, longitude: localizacao.longitude,
      latitudeDelta: 0.01, longitudeDelta: 0.01 }
  : { latitude: -5.0920, longitude: -42.8016,   // centro de Teresina-PI
      latitudeDelta: 0.015, longitudeDelta: 0.015 };
```

O fallback para Teresina reflete o mercado-alvo inicial do produto (Beachhead Market: Teresina-PI e Timon-MA).

---

## 4. Modelo de Dados

### 4.1 AsyncStorage — Esquemas

#### `@usuarios` — `Usuario[]`

```typescript
interface Usuario {
  id: string;           // Date.now().toString() — timestamp em ms
  nome: string;         // nome completo
  usuario: string;      // identificador único, case-insensitive
  senha: string;        // ⚠️ texto plano — pendente de hash em produção
  genero: string;       // valor de GENEROS[]
}
```

#### `@usuarioLogado` — `Usuario`

Objeto idêntico a `Usuario`. Presença indica sessão ativa; ausência redireciona para login.

#### `@contatos` — `Contato[]`

```typescript
interface Contato {
  id: string;      // Date.now().toString()
  nome: string;    // nome de exibição do contato
  numero: string;  // número com DDD, sem formatação
}
```

#### `@gravacoes` — `Gravacao[]`

```typescript
interface Gravacao {
  id: string;    // Date.now().toString()
  tipo: 'audio' | 'video';
  uri: string;   // caminho local: file:///data/user/0/.../Recording_*.m4a
  data: string;  // new Date().toLocaleString('pt-BR') — "dd/mm/aaaa, hh:mm:ss"
}
```

### 4.2 jsonbin.io — Esquema (Pontos de Risco)

```typescript
interface BinRecord {
  pontos: Ponto[];
}

interface Ponto {
  id: string;                        // Date.now().toString()
  latitude: number;                  // coordenada decimal (Number coerced)
  longitude: number;                 // coordenada decimal (Number coerced)
  nome: string;                      // nome do local
  bairro: string;                    // bairro (geocodificação reversa ou manual)
  cidade: string;                    // cidade (geocodificação reversa ou manual)
  descricao: string;                 // descrição opcional da situação de risco
  nivel: 'baixo' | 'medio' | 'alto'; // nível de periculosidade
  horarios: string[];                // subconjunto de HORARIOS[]
  data: string;                      // new Date().toLocaleDateString('pt-BR')
}

// Cores associadas ao nível (renderização dos marcadores e barras laterais):
// 'baixo' → '#4CAF50' (verde)
// 'medio' → '#FFC107' (amarelo)
// 'alto'  → '#F44336' (vermelho)
```

---

## 5. Stack Tecnológica

### 5.1 Dependências de Produção

| Pacote | Versão | Função |
|---|---|---|
| `react` | 19.1.0 | Biblioteca de UI e gerenciamento de ciclo de vida |
| `react-native` | 0.81.5 | Framework de UI nativa multiplataforma |
| `expo` | ~54.0.33 | Toolchain, runtime e acesso a APIs nativas |
| `@react-navigation/native` | ^6.1.18 | Roteamento e gerenciamento de histórico |
| `@react-navigation/bottom-tabs` | ^6.6.1 | Navegador de abas inferiores |
| `@react-native-async-storage/async-storage` | 2.2.0 | Persistência chave-valor local |
| `expo-location` | ~19.0.8 | GPS e geocodificação reversa |
| `expo-sms` | ~14.0.8 | Envio de SMS via app nativo do SO |
| `expo-av` | ~16.0.8 | Gravação e reprodução de áudio |
| `expo-camera` | ~17.0.10 | Captura de vídeo com preview |
| `expo-media-library` | ~18.2.1 | Acesso e gerenciamento da galeria |
| `expo-sharing` | ~14.0.8 | Compartilhamento nativo de arquivos |
| `expo-status-bar` | ~3.0.9 | Controle da barra de status do SO |
| `react-native-maps` | 1.20.1 | MapView interativo (Google Maps / Apple Maps) |
| `react-native-safe-area-context` | ~5.6.0 | Respeito às safe areas do dispositivo |
| `react-native-screens` | ~4.16.0 | Otimização de performance das telas |
| `firebase` | ^12.13.0 | SDK Firebase (previsto para Etapa 2 — sincronização de gravações) |

### 5.2 Configurações de Build (`app.json`)

| Configuração | Valor | Descrição |
|---|---|---|
| `orientation` | `portrait` | Bloqueia rotação para retrato |
| `newArchEnabled` | `true` | Ativa Nova Arquitetura React Native (Fabric + JSI) |
| `android.edgeToEdgeEnabled` | `true` | UI em tela cheia no Android |
| `ios.supportsTablet` | `true` | Suporte a iPad |

---

## 6. Estrutura de Arquivos

```
Violeta-app-main/
├── index.js                     # Entry point — AppRegistry.registerComponent
├── App.js                       # Controlador de autenticação e navegador de abas
├── app.json                     # Manifesto Expo
├── package.json                 # Dependências npm e scripts
│
├── assets/
│   ├── borboleta.jpg / .jpeg    # Logotipo — telas de autenticação
│   ├── icon.png                 # Ícone da aplicação
│   ├── adaptive-icon.png        # Ícone adaptativo Android
│   ├── splash-icon.png          # Imagem da splash screen
│   └── favicon.png              # Favicon para build web
│
└── src/
    ├── screens/
    │   ├── LoginScreen.js       # Autenticação de sessão
    │   ├── CadastroScreen.js    # Criação de conta com autodeclaração de gênero
    │   ├── HomeScreen.js        # Botão SOS — acionamento de emergência
    │   ├── ContatosScreen.js    # CRUD de contatos da rede de proteção
    │   ├── GravacaoScreen.js    # Gravação de áudio e vídeo com persistência
    │   ├── MapaScreen.js        # Mapa colaborativo com integração jsonbin.io
    │   └── LimparStorage.js     # Utilitário de desenvolvimento
    │
    └── utils/
        └── storage.js           # Reservado — utilitários de persistência (futuro)
```

---

## 7. Permissões do Sistema Operacional

| Permissão | API de Solicitação | Tela | Momento | Comportamento se Negada |
|---|---|---|---|---|
| Localização (foreground) | `Location.requestForegroundPermissionsAsync()` | HomeScreen, MapaScreen | Montagem | SOS funciona sem GPS; mapa usa região padrão |
| Microfone | `Audio.requestPermissionsAsync()` | GravacaoScreen | Montagem | Gravação de áudio desabilitada |
| Microfone (câmera) | `useMicrophonePermissions()` | GravacaoScreen | Iniciar vídeo | Alert + retorno sem gravar |
| Câmera | `useCameraPermissions()` | GravacaoScreen | Iniciar vídeo | Alert + botão de solicitar permissão |
| Galeria/Mídia | `MediaLibrary.requestPermissionsAsync()` | GravacaoScreen | Montagem | Arquivo salvo apenas no app, não na galeria |

---

## 8. Padrões de Implementação

### 8.1 Atualização de Estado e Persistência

O padrão adotado em todas as operações de escrita é a **atualização otimista com persistência imediata**:

```js
// 1. Atualiza o estado React → UI responde imediatamente
setEstado(novaLista);
// 2. Persiste no banco local → dado sobrevive ao fechamento do app
await AsyncStorage.setItem('@chave', JSON.stringify(novaLista));
```

### 8.2 Geração de Identificadores

IDs de registros são gerados via `Date.now().toString()`, retornando o timestamp Unix em milissegundos como string. Colisões são improváveis em operações sequenciais de usuária única. Para sincronização multi-dispositivo (Etapa 2), substituir por `uuid` v4.

### 8.3 Recarregamento entre Telas

`ContatosScreen` utiliza `useFocusEffect` para recarregar dados ao receber foco. O `useCallback` com `[]` é mandatório para evitar loops de re-renderização — sem ele, a referência da função mudaria a cada render, disparando `useFocusEffect` repetidamente.

### 8.4 Design de Cores

Duas paletas são aplicadas com semântica intencional:

| Contexto | Background | Primária | Texto secundário | Objetivo |
|---|---|---|---|---|
| Telas de autenticação e gravação | `#FDF0F5` | `#C06090` | `#A080B0` | Acolhimento e confiança |
| Telas operacionais (SOS, Contatos) | `#1a1a2e` | `#9C27B0` | `#ce93d8` | Urgência e seriedade |

O botão SOS utiliza `#c62828` (vermelho intenso) com sombra `shadowColor: '#f44336'` e `shadowRadius: 20`, criando efeito de "brilho" que reforça a criticidade da ação.

### 8.5 Gestão de Referências Imperativas (`useRef`)

`GravacaoScreen` e `MapaScreen` utilizam `useRef` para manter referências diretas a componentes nativos (`CameraView` e `MapView`, respectivamente). Diferente de `useState`, a atualização de um `ref` não causa re-renderização — ele é utilizado exclusivamente para invocação de métodos imperativos (`recordAsync`, `stopRecording`, `animateToRegion`).

---

## 9. Instalação e Execução

### 9.1 Pré-requisitos

- Node.js 20 ou superior
- Expo Go instalado no dispositivo ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- Conexão à internet para o módulo de Mapa de Riscos (jsonbin.io)

### 9.2 Passos

```bash
# Clonar o repositório
git clone https://github.com/yasminantonelaa/Violeta-app.git
cd Violeta-app

# Instalar dependências
# --legacy-peer-deps necessário por conflitos de peer deps entre
# algumas bibliotecas Expo e o React 19
npm install --legacy-peer-deps
npx expo install expo-location
npx expo install expo-sms
npx expo install expo-av
npx expo install expo-camera
npx expo install expo-sharing
npx expo install expo-media-library
npx expo install react-native-maps
npx expo install react-native-screens
npx expo install react-native-safe-area-context

# 3. Dependências do npm (navegação e storage)
npm install @react-navigation/native@6.1.18 --legacy-peer-deps
npm install @react-navigation/bottom-tabs@6.6.1 --legacy-peer-deps
npm install @react-native-async-storage/async-storage --legacy-peer-deps

# 4. Ngrok para tunnel
npm install -g @expo/ngrok@^4.1.0
# Iniciar o servidor de desenvolvimento através da mesma rede wi-fi
npx expo start --lan
```

Escanear o QR Code exibido no terminal com o Expo Go no dispositivo móvel.

---

## 10. Roadmap de Desenvolvimento

| Etapa | Período | Escopo | Status |
|---|---|---|---|
| **Etapa 1 — MVP** | Maio–Junho/2026 | SOS, gravação, rede de proteção, mapa colaborativo | ✅ Concluído |
| **Etapa 2** | Julho–Agosto/2026 | Alertas por proximidade, BO com IA, sincronização Firebase, migração jsonbin.io → Firestore | 🔄 Planejado |
| **Etapa 3** | Set–Out/2026 | Antecedentes criminais, assinatura premium, testes com usuárias piloto | 🔄 Planejado |
| **Finalização** | Nov–Dez/2026 | Hardening de segurança, otimização de performance, build de produção | 🔄 Planejado |

---

## 11. Referências Técnicas

- [Expo SDK 54 — Documentação oficial](https://docs.expo.dev/versions/v54.0.0/)
- [React Navigation v6](https://reactnavigation.org/docs/6.x/getting-started)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [expo-av — Audio](https://docs.expo.dev/versions/v54.0.0/sdk/audio/)
- [expo-camera](https://docs.expo.dev/versions/v54.0.0/sdk/camera/)
- [expo-location](https://docs.expo.dev/versions/v54.0.0/sdk/location/)
- [expo-sms](https://docs.expo.dev/versions/v54.0.0/sdk/sms/)
- [react-native-maps](https://docs.expo.dev/versions/v54.0.0/sdk/map-view/)
- [jsonbin.io REST API v3](https://jsonbin.io/api-reference)
- [React Native Nova Arquitetura](https://reactnative.dev/docs/the-new-architecture/landing-page)

---
## 📜 Licença

Projeto desenvolvido para fins educacionais — Hackathon Programa Do Piauí para o Mundo, SEDUC-PI, 2026.


