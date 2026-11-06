# IFSP MOTO KART 64: Progresso do desenvolvimento

Último checkpoint: 06/11/2026 (refatoração visual dos pilotos e motos).
Estado: **o jogo é jogável do começo ao fim.** Menu → modo → seleção de piloto → mapa → contagem → corrida de 3 voltas com IA e itens → resultado/pódio. Os três modos foram testados no navegador.

## Como rodar

```bash
cd D:\if-racer
npm install      # só se node_modules tiver sido apagado
npm run dev      # abre em http://localhost:5173 (ou a próxima porta livre)
npm run build    # versão de produção em dist/
```

Controles: W/↑ acelerar • S/↓ frear/ré • A D/← → virar • Espaço derrapar (mini-turbo ao soltar) • Shift (ou E) usar item • Esc/P pausar. Em telas de toque aparecem botões na tela.

## ✅ Implementado

| Arquivo | Conteúdo |
|---|---|
| `index.html`, `src/style.css` | Todas as telas em DOM (título, modos, seleção, mapa com manhã/tarde/noite, opções, HUD, pausa, resultado, botões de toque) com visual de menu N64 |
| `src/main.js` | Classe `Game`: renderer em baixa resolução (retrô 240p/360p/nativo), máquina de estados, modo demonstração com IA no fundo dos menus, palco de seleção no estacionamento em frente ao prédio "INSTITUTO FEDERAL" (personagens **em pé** ao lado das motos, girando, Cauã acenando e Renato com braços cruzados), prévia aérea do mapa, contagem 3-2-1-VAI com largada perfeita e motor afogado, câmera de perseguição suave com FOV dinâmico, colisões (pilotos, objetos, cones), classificação, pausa, resultado com tabela, tempos e melhor volta, mensagens humorísticas, pódio 3D com confete. Modos: **Corrida rápida** (4 pilotos), **Campeonato** (3 corridas manhã/tarde/noite, pontos 10/6/3/1, campeão no final), **Contra o professor** (Cauã x Renato). Opções salvas no `localStorage` |
| `src/racer.js` | Física arcade (aceleração, freio/ré, grama mais lenta, derrapagem com pulinho e mini-turbo azul/laranja, inclinação, pulo nas rampas com turbo ao pousar, placas de turbo, muro invisível), voltas com 8 checkpoints, contramão, estados (giro, lentidão, escudo, invulnerabilidade), piloto animado em cima da moto, nome flutuante dos rivais. **IA** com antecipação de curva, troca de faixa, desvio de obstáculos, rubber-band por dificuldade, uso inteligente de itens e ré quando fica presa |
| `src/items.js` | Caixas "?" (5 fileiras × 5) que reaparecem, roleta, e os 7 poderes funcionando: Café (boost + vapor), Coxinha (projétil que persegue o rival da frente pela pista), Prova surpresa (folha "0,0" cai do céu no líder, que fica lento e tonto), Turbo IFSP (boost forte com rastro verde/branco/vermelho), Chuva de boletos (6 boletos caem atrás), Trabalho em grupo (parede de tijolos à frente do rival), Recuperação de nota (escudo que bloqueia um ataque) |
| `src/hud.js` | Volta, tempo, posição, velocidade em km/h com barra, slot de item com roleta, avisos (contramão, mini-turbo, item), mensagens grandes e minimapa com os pilotos |
| `src/audio.js` | WebAudio sintetizado: motor que varia com a velocidade, músicas chiptune originais (menu, corrida, vitória, derrota) e ~25 efeitos |
| `src/effects.js` | Partículas cúbicas instanciadas (poeira, faíscas, fumaça, confete, rastro) |
| `src/campus.js` | Campus IFSP Birigui estilizado: prédio principal com letreiro, blocos A–D, biblioteca, laboratórios, caixa d'água, usina solar, estacionamento com carros, pórtico "IFSP • CAMPUS BIRIGUI", totem IF, bandeiras, placas humorísticas, postes (acesos à noite), rampas, placas de turbo, cones derrubáveis, pneus, ~420 árvores (com ipês), canaviais, morros e 3 variações de horário |
| `src/models/` (refeito em 06/11) | Modelos em componentes independentes. `common.js`: materiais, perfis laterais extrudados, tubos, rodas e sombra. `character.js`: bonecos N64 com cabeça grande. Cauã tem cabelo preto volumoso com topete, bigode, óculos aviador dourados e macacão verde de piloto com bandeira do Brasil, plaqueta e bolsos. Renato tem cabelo grisalho curto texturizado, óculos retangulares pretos, rugas de expressão, jaqueta de couro preta e jeans. `poses.js`: em pé (`idle`, `wave`, `hips`, `cross`, `thumbs`, `victory`, `cheer`, `clap`, `sad`) e pilotando (postura ereta na naked ou deitada na superbike, inclinação com o joelho para dentro, aceleração/frenagem). `trident.js`: Trident 660 com tanque cinza, farol redondo, motor de 3 cilindros com aletas, coletores, escape curto embaixo, defletores vermelhos e rodas pretas. `s1000rr.js`: S1000RR com carenagem cinza/preta, grafismos vermelho/branco, faróis em fenda, bolha fumê, rabeta alta, escape lateral e garfo dourado. `genericBike.js`: motos dos NPCs |
| `src/models.js` | Reexporta os componentes (mesma API de antes para o resto do jogo) |
| `src/debugViewer.js` | Só em `npm run dev`: `viewModel(...)` no console para inspecionar os modelos de qualquer ângulo |
| `src/track.js`, `src/config.js`, `src/textures.js`, `src/input.js` | Pista em spline e consultas, dados de pilotos (aparência, pose principal e alternativa, estilo de pilotagem), itens e mensagens, texturas procedurais, entrada |
| `.claude/launch.json` | Configuração para abrir o servidor de desenvolvimento pelo app |

## Testes feitos (06/11)

- Corrida simulada de 3 voltas com 4 pilotos: todos completaram, chegada apertada (~93–94 s), 33 itens usados e 11 acertos.
- Modo duelo e campeonato completo (3 corridas → tela de campeão) com os botões corretos em cada etapa.
- Telas conferidas visualmente: título, seleção, corrida de dia e de noite, uso de itens, resultado/pódio e layout de celular com botões de toque.
- `npm run build` sem erros e nenhum erro no console.

## ⏳ Melhorias possíveis (ainda não feitas)

1. Jogar com teclado de verdade por várias corridas e ajustar o equilíbrio (dificuldade da IA, força dos itens, frequência das caixas).
2. Conferir de perto, na tela, o telhado em prisma do prédio principal e os sheds dos laboratórios.
3. Os modelos foram refeitos a partir da folha de referência de personagens. Ainda dá para refinar o rosto e as poses se algo não parecer fiel jogando.
4. Mais detalhes na tela de seleção (atributos animados, troca com animação) e no pódio (motos ao lado dos personagens).
5. Faróis acesos nas motos na corrida noturna.
6. Separar o código em chunks para reduzir o aviso de bundle > 500 kB (não afeta o funcionamento).

## Detalhes técnicos

- Modelos olham para **+Z**; virar à esquerda aumenta `heading`; `lateral` positivo = direita da pista.
- O índice 0 da pista é a linha de chegada; o grid fica atrás dela. A volta conta ao cruzar `N → 0` com todos os checkpoints passados.
- Para testes: `game.autopilot = true` no console faz a IA pilotar a moto do jogador.
- Python não está instalado nesta máquina: use Node para scripts auxiliares.

## Como retomar

Abra o projeto e peça, por exemplo: *"Leia o PROGRESS.md e continue com as melhorias possíveis do IFSP Moto Kart 64."*
