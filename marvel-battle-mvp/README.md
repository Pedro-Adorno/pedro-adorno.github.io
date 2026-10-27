# Marvel Battle — 2D Battle Prototype

Protótipo de jogo de luta 2D no navegador, desenvolvido com **TypeScript, Vite e Phaser 3**. O MVP contém apenas uma arena, Spider-Man controlado pelo jogador e Captain America controlado por IA local. Não há backend, banco de dados, autenticação ou chamadas de API durante a batalha.

> Os personagens são representações geométricas originais de protótipo. O projeto não inclui imagens oficiais nem assets licenciados.

## Requisitos

- Node.js 20 ou superior (recomendado)
- npm
- Git (opcional para executar localmente; necessário para o fluxo GitHub → Vercel)

## Instalar e executar

```bash
npm install
npm run dev
```

Abra o endereço local exibido pelo Vite, normalmente `http://localhost:5173`.

## Validar e gerar build

```bash
npm run typecheck
npm run build
npm run preview
```

O build de produção fica em `dist/`. O comando `npm run build` executa a checagem TypeScript antes de gerar os arquivos estáticos.

## Publicar gratuitamente na Vercel

1. Crie um repositório no GitHub e envie os arquivos deste projeto.
2. Entre na [Vercel](https://vercel.com/), importe o repositório e autorize o acesso.
3. Use estas configurações (a Vercel normalmente detecta o Vite automaticamente):
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Clique em Deploy. Não são necessárias variáveis de ambiente nem configuração de backend.

## Controles

| Tecla | Ação |
|---|---|
| A / D | Mover para esquerda / direita |
| W | Pular |
| J | Ataque básico |
| K | Teia — dano e redução temporária de velocidade |
| L | Teia puxadora — aproximação rápida e dano |
| U | Aranha Sense — velocidade e dano aumentados por tempo limitado |

## Estrutura do projeto

```text
src/
├── main.ts                       # Inicialização Phaser e conexão dos botões
├── style.css                     # Interface externa ao canvas e responsividade
├── characters/
│   ├── characterTypes.ts         # Tipos de personagens, atributos e habilidades
│   └── characters.ts             # Configuração centralizada dos dois personagens
└── game/
    ├── ai/CaptainAI.ts           # Máquina de estados da IA
    ├── config/gameConfig.ts      # Constantes gerais da arena e física
    ├── effects/Effects.ts        # Partículas, dano flutuante e projéteis
    ├── entities/Fighter.ts       # Estado e desenho procedural dos lutadores
    ├── scenes/BattleScene.ts     # Coordenação da partida e loop de jogo
    └── systems/HudController.ts  # Atualização do HUD e tela de resultado
```

## Como adicionar um personagem

1. Acrescente o identificador e a configuração de personagem em `src/characters/characterTypes.ts` e `src/characters/characters.ts`.
2. Defina atributos e habilidades na configuração do personagem; evite espalhar valores de balanceamento pela cena.
3. Se precisar de um visual específico, amplie `Fighter.draw()` ou crie uma implementação visual separada. A lógica de desenho pode futuramente ser trocada por sprites profissionais sem alterar o formato público dos atributos.
4. Adicione o personagem à cena e à lógica de seleção quando houver uma etapa de seleção de lutadores. Essa seleção não faz parte deste MVP.

## Como alterar atributos e balanceamento

Edite `src/characters/characters.ts`. Os atributos de força e combate afetam o dano causado; defesa reduz dano recebido; velocidade influencia deslocamento e cadência de ataques; mobilidade fica disponível para ajustes futuros de movimentação; HP determina a resistência. O Spider-Sense aplica uma chance passiva de esquiva e o buff temporário aumenta velocidade e dano.

Constantes de arena e física ficam em `src/game/config/gameConfig.ts`. Fórmulas de dano e regras de batalha estão centralizadas na cena de batalha e na entidade `Fighter`, em vez de duplicadas pela interface.

## Como criar uma habilidade

1. Adicione o tipo de habilidade e a configuração ao personagem em `characters.ts`.
2. Defina dano, cooldown, alcance, tipo e efeitos opcionais no objeto `AbilityConfig`.
3. Implemente a execução no sistema de combate da cena (por exemplo, ataque corpo a corpo, projétil, buff ou defesa).
4. Para habilidades do jogador, conecte a tecla e inclua um indicador de cooldown na interface. Para habilidades da IA, adicione a decisão na máquina de estados `CaptainAI`.
5. Rode `npm run typecheck` e `npm run build`, depois teste manualmente os casos de acerto, erro, cooldown e fim de partida.

## Limites conhecidos do protótipo

- A IA e os tempos de reação são deliberadamente simples e ainda precisam de playtesting para balanceamento.
- A interface inclui HUD para o kit do jogador; os movimentos do Captain America são controlados pela IA.
- A mobilidade é exposta como atributo para balanceamento futuro, mas ainda não tem uma fórmula independente.
- O jogo é focado em desktop com teclado; o canvas se ajusta à área disponível, mas não há controles touch ou suporte a gamepad nesta fase.
- O projeto não depende de assets remotos nem de APIs; depois de instalado, o jogo pode ser executado localmente sem requisições durante o gameplay.
