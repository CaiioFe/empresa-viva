# Design · Empresa Viva

Linha visual aprovada em 29/09/2026, a partir das referências de painel de finanças e RH mais vistas no Dribbble (Finance Dashboard da Nixtio e Atur HR Dashboard da Orenji Studio). O dono pediu explicitamente esse nível de acabamento: nada de "simples demais" ou "feito em 10 minutos".

## Assinatura

- Fundo bege quente; tudo o que é conteúdo fica em **painéis brancos bem arredondados (22px), sem borda, com sombra suave**.
- **Números em blocos brancos com um ponto de cor** (sálvia, manteiga, lavanda, pêssego, céu), e o número principal num **bloco escuro**. Refinado em 29/09: blocos inteiros em pastel ficaram "carnaval"; a cor é detalhe, não fundo. O tamanho do número acompanha a largura do bloco (nunca vaza). Quatro números lado a lado só em tela larga (1280px); abaixo disso, dois por linha.
- **Gráficos com personalidade**: barras em cápsula com trilho claro, área com degradê suave, rosca com cantos arredondados.
- **Avatar colorido** com iniciais em toda pessoa e empresa (cor estável pelo nome, `tomDoNome`).
- Menu lateral branco flutuando sobre o fundo, item ativo em **cápsula escura**. No celular, barra inferior escura flutuante.
- Botões, etiquetas e filtros em **cápsula** (rounded-full). Campos com fundo creme, sem borda até o foco.

## Tipografia

Uma família: **Plus Jakarta Sans** (variável). Números tabulares. Títulos em 800, números grandes em 800, títulos de painel em 700, texto em 400 a 600. Nada de serifa nem de fonte mono.

| Uso | Tamanho |
|---|---|
| Número do bloco escuro | 30 a 32px |
| Título da página | 28px |
| Número dos blocos | 19px (celular) a 26px |
| Título de seção | 18px |
| Título de painel | 16px |
| Texto e tabela | 14px |
| Rótulo e apoio | 13px / 12px |

## Cor (OKLCH)

- Fundo `oklch(0.94 0.012 85)`, painel `oklch(0.995 0.003 85)`, creme `oklch(0.962 0.008 85)`.
- Tinta `oklch(0.21 0.01 70)` (texto, bloco escuro, botão principal).
- Acento lavanda `oklch(0.52 0.16 285)` para seleção, foco e o mês atual no gráfico.
- Pastéis com o tom escuro correspondente para o rótulo dentro do bloco (ver `index.css`).
- Estado: bom (verde), ruim (vermelho) e atenção (âmbar), sempre com sinal ou texto junto.

## Densidade (29/09)

Tudo compacto para caber sem rolagem longa: raio 18px, painéis com 16 a 20px de respiro, título de página 22px, números de 21px (26px no bloco escuro), gráficos com 190px de altura. No painel, gráfico, rosca e "o que mais subiu" ficam lado a lado a partir de 1280px. O dono reclamou quando tudo ficou grande: "gera uma grande rolagem vertical".

## Regras

- Não voltar para borda fina em volta de painel, nem para cartão branco repetido para número.
- Todo painel novo usa `Card` (título + subtítulo) e todo número de resumo usa `Resumo` + `Kpi`.
- Movimento só em estado: hover leve (subir 2px), 150ms.
