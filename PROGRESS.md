# IFSP MOTO KART 64: Progresso do desenvolvimento

Último checkpoint: 05/11/2026.
Estado: **o jogo ainda NÃO roda.** Os módulos de base estão escritos e passam na checagem de sintaxe, mas `src/main.js` (o ponto de entrada que o `index.html` carrega) ainda não existe. Nada foi testado no navegador.

## Stack

- Vite 5 + Three.js 0.169 (instalados em `node_modules`)
- JavaScript (ES modules), HTML5, CSS3
- Sem modelos 3D externos: tudo é feito com primitivas e texturas geradas em canvas

## ✅ Já implementado (arquivos completos)

| Arquivo | Conteúdo |
|---|---|
| `package.json` | Scripts `dev`, `build`, `preview`; dependências three + vite |
| `index.html` | Todas as telas em DOM: título, modos, seleção de piloto, seleção de mapa (manhã/tarde/noite), opções, HUD (volta, tempo, posição, item, minimapa, velocímetro, mensagens, contagem), pausa, resultado, controles de toque. Carrega `/src/main.js` |
| `src/style.css` | Visual dos menus inspirado em N64 (fontes grossas com contorno, botões, cards), HUD, pódio/tabela, controles mobile, layout responsivo |
| `src/textures.js` | Texturas procedurais: grama, asfalto com faixa central, zebra, quadriculado, estacionamento, calçada, terra vermelha, canavial, fachadas com janelas, telhado, painel solar, caixa "?", placa de turbo, faixa de perigo. Também placas de texto, logo estilizado do IF e emojis como textura |
| `src/track.js` | Classe `Track`: spline fechada (CatmullRom) a partir de `CONTROL_POINTS` (layout do campus), amostragem com tangentes e curvatura, `project()` (posição → índice/lateral na pista), `pointAt()`, `heading()`, `curvAhead()`, malha da pista (asfalto, acostamento, zebras só nas curvas, linha de largada). Constantes `TRACK_WIDTH = 18` e `WALL_DIST` (muro invisível) |
| `src/campus.js` | Classe `Campus` e `VARIANTS` (manhã/tarde/noite, com céu, neblina, luz e janelas/postes acesos à noite). Constrói: céu em gradiente, nuvens, estrelas, chão; prédio principal com letreiro "INSTITUTO FEDERAL", marquise e logo IF; blocos A–D com passarelas; biblioteca; laboratórios com telhado shed; caixa d'água; usina solar (dentro e fora da pista); estacionamento com carros e guarita; pórtico "IFSP • CAMPUS BIRIGUI" sobre a pista; totem IF; bandeiras; placas humorísticas; postes; rampas; placas de turbo; posições das fileiras de caixas de item (`track.features`); cones derrubáveis; pilhas de pneus; cerca de ~420 árvores instanciadas (com ipês); canaviais, morros e cerca do campus. Expõe `colliders`, `cones`, `setVariant(i)`, `update(dt)` |
| `src/models.js` | `buildCharacter(def)`: bonecos cabeçudos com articulações (quadril, tronco, cabeça, ombros, cotovelos, pernas, joelhos), cabelo cacheado / curto grisalho / capacete, bigode, óculos escuros, macacão verde (Cauã) e jaqueta preta (Renato). Poses: `poseStand` (idle, `wave`, `cross`, `cheer`, `sad`, `clap`) e `poseRide` (pilotando, com inclinação, `cheer`, `spin`, `dizzy`). Motos: `buildTrident` (Trident 660), `buildS1000` (S1000RR), `buildGenericBike`; `spinWheels`, `blobShadow` |
| `src/config.js` | `DRIVERS` (Cauã, Prof. Renato e os NPCs Calouro Lucas e Veterana Bia) com atributos, frase e pose; `physicsFor(stats)`; `ITEMS` (os 7 poderes); `rollItem(pos, total)` com chance por posição; `MESSAGES` humorísticas de vitória, derrota e meio de tabela |
| `src/input.js` | Classe `Input`: teclado (WASD/setas, Espaço, Shift, Esc), eventos de borda (`consume`) e botões de toque |

## 🚧 Em andamento

Nada ficou pela metade dentro de arquivos. Todos os arquivos acima estão completos e salvos. O próximo passo era escrever os módulos que faltam.

## ⏳ Falta fazer (em ordem sugerida)

1. **`src/audio.js`**: WebAudio sintetizado: som do motor (frequência pela velocidade), músicas chiptune originais (menu/corrida/resultado), efeitos (contagem, item, turbo, batida, coxinha, chegada). Respeitar opções de música e efeitos.
2. **`src/effects.js`**: partículas (poeira na grama, faíscas de drift azul/laranja, rastro verde do Turbo IFSP, vapor do café, confete).
3. **`src/racer.js`**: classe `Racer` (moto + piloto em `poseRide`, sombra):
   - física arcade: aceleração, freio, `maxSpeed` reduzido na grama, derrapagem com mini-turbo, inclinação, pulo nas rampas, placas de turbo;
   - colisões: muro invisível (`WALL_DIST`), `campus.colliders`, cones (derrubar), entre pilotos;
   - voltas e checkpoints (`track.K = 8`), progresso para ranking, tempos por volta;
   - estados: boost, lentidão, giro, escudo;
   - **IA**: segue a pista com antecipação e offset lateral, freia pela `curvAhead`, rubber-band pela dificuldade e usa itens.
4. **`src/items.js`**: caixas "?" giratórias nas `track.features.itemRows` (reaparecem após ~3 s), roleta de item, e os efeitos:
   - Café: boost por ~3 s
   - Coxinha: projétil que segue a pista até o rival da frente
   - Prova surpresa: lentidão no líder, com folha "0,0" e tontura
   - Turbo IFSP: boost forte com rastro
   - Chuva de boletos: obstáculos atrás
   - Trabalho em grupo: parede à frente do rival
   - Recuperação de nota: escudo
5. **`src/hud.js`**: atualizar o HUD do `index.html` e desenhar o minimapa no `<canvas id="minimap">`.
6. **`src/main.js`**: renderer (resolução retrô 240p/360p com `image-rendering: pixelated`), máquina de estados (título → modo → piloto → mapa → corrida → resultado), câmera de perseguição suave, cena de seleção (personagens EM PÉ ao lado das motos, girando, com `wave`/`cross`), prévia 3D do mapa, contagem 3-2-1-VAI, pausa, modos (**Corrida rápida**: 4 pilotos; **Campeonato**: 3 corridas manhã/tarde/noite, pontos 10/6/3/1; **Contra o professor**: Cauã x Renato), pódio 3D e tabela de resultado com mensagens. Esconder `#loading` ao terminar de carregar.
7. **Testar no navegador** (`npm run dev`): pista fechada, IA completando as 3 voltas, itens, colisões, vitória e derrota, mobile.
8. **Refinar e conferir visualmente**: telhado em prisma do prédio principal e sheds dos laboratórios (rotações ainda não conferidas na tela), poses de braços cruzados e aceno, escala piloto/moto, distâncias dos prédios até a pista.

## Detalhes técnicos importantes

- Convenção de direção: modelos olham para **+Z**; `heading` h → frente `(sin h, 0, cos h)`; direita = `(-cos h, 0, sin h)`; virar à esquerda **aumenta** h. `lateral` positivo = direita.
- Na pista, o índice 0 é a linha de largada (no estacionamento, sentido leste). O grid de largada deve ficar atrás dela (índices perto de `N`). A volta conta ao cruzar `N → 0` com todos os checkpoints passados.
- Python não está instalado nesta máquina: use Node para scripts auxiliares.
- O `npm install` avisou que o postinstall do esbuild não rodou, mas o esbuild foi testado e funciona.

## Como retomar

```bash
cd D:\if-racer
npm install      # só se node_modules tiver sido apagado
npm run dev      # só vai funcionar depois que src/main.js existir
```

Para continuar com o Claude, abra o projeto e peça algo como:

> "Leia o PROGRESS.md e continue o desenvolvimento do IFSP Moto Kart 64 a partir do item 1 da lista 'Falta fazer'."
