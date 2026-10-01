# Como testar o módulo Caixa

Roteiro para conferir as quatro telas do Caixa (TASK-101 a 104) com o sistema aberto no navegador. Não precisa saber programar: é só seguir os passos e ver se acontece o que está escrito em "o que deve aparecer".

Antes de começar:

- Entre com um usuário **Dono** ou **Financeiro** de uma empresa de teste. Esses dois podem mudar tudo no Caixa.
- Tenha à mão a **planilha modelo** (ela se baixa na própria tela de importar, passo 2 abaixo).
- No menu, clique em **Caixa**. No topo da tela aparecem quatro abas: **Fluxo do ano**, **Lançamentos**, **Importar** e **Categorias**.

## 1. Categorias (o plano de contas)

1. Clique na aba **Categorias**.
2. O que deve aparecer: um quadro para cada grupo (Recebimentos operacionais, Pagamentos operacionais, investimentos, acionistas, financiamento e não operacional), cada um com as suas categorias.
3. Em **Pagamentos operacionais**, escreva "Frete" no campo "Nova categoria" e clique em **Criar**. A categoria aparece no fim da lista.
4. Clique na setinha para cima ao lado de "Frete". Ela sobe uma posição.
5. Clique em **Renomear**, troque para "Fretes e entregas" e clique em **Salvar**.
6. Clique em **Desativar**. O nome fica riscado com a etiqueta "Desativada". Clique em **Ativar** para voltar.

## 2. Importar planilha

1. Clique na aba **Importar**.
2. Clique em **Baixar planilha modelo**. Ela tem 6 linhas inventadas de setembro de 2026.
3. Em "Arquivo da planilha", escolha a planilha que você baixou.
4. O que deve aparecer:
   - **Passo 2**: as colunas já escolhidas sozinhas (Data, Descrição e Valor). Confira se estão certas.
   - **Passo 3**: os contadores (Lidas 6, Recusadas 0) e a prévia com as linhas. A coluna "Categoria" mostra "Sem categoria" em amarelo nas linhas que nenhuma regra reconheceu.
5. No **passo 4**, clique em **Importar 6 lançamentos**.
6. O que deve aparecer: "6 lançamentos gravados", com os botões **Ver o fluxo do ano** e **Classificar os sem categoria**.

Testes extras:

- **Importar de novo a mesma planilha.** Na prévia deve aparecer um aviso vermelho: "Parece que esta planilha já foi importada". Não confirme; é só para ver o aviso.
- **Linha com erro.** Abra a planilha modelo no Excel, apague a data de uma linha e escreva "dez reais" no valor de outra. Salve e escolha o arquivo de novo. Na prévia, essas linhas aparecem em "Linhas que não vão entrar", com o motivo e o número da linha.
- **Colunas lembradas.** Na segunda vez que escolher uma planilha com o mesmo cabeçalho, aparece o aviso "Usamos as mesmas colunas de antes".

## 3. Lançamentos e a fila sem categoria

1. Clique na aba **Lançamentos**. A tela abre no último mês que tem dado.
2. O que deve aparecer: a lista com data, descrição, categoria e valor. Entrada aparece em verde com "+"; saída em preto com "-".
3. Se houver lançamento sem categoria, aparece um aviso azul com o link **Abrir a fila**. Clique nele.
4. Na fila, escolha uma categoria na caixinha de uma linha. A linha sai da fila na hora.
5. Em outra linha, clique em **Virar regra**. Abre um campo com a descrição inteira: deixe só a parte que se repete (por exemplo "energia"), escolha a categoria e clique em **Salvar regra**. Deve aparecer quantos lançamentos foram classificados na hora.
6. Clique em **Novo lançamento** (no topo). Preencha data, descrição, valor (por exemplo 150,00), tipo "Saída" e a categoria. Clique em **Salvar lançamento**. Ele aparece na lista com a etiqueta "manual".
7. Só o lançamento manual tem o botão **Excluir**. Os que vieram de planilha saem desfazendo a importação inteira.
8. No fim da tela, em **Importações recentes**, clique em **Desfazer esta importação** na planilha modelo e confirme. Os 6 lançamentos dela somem.

Filtros para conferir: troque o mês (ou "Ano todo"), a categoria e escreva algo na busca. A lista muda na hora.

## 4. Fluxo do ano

Importe a planilha modelo de novo (passo 2) e classifique as linhas antes de testar esta tela.

1. Clique na aba **Fluxo do ano**.
2. O que deve aparecer:
   - O **ano** no canto de cima (abre no ano atual ou no último que tem dado).
   - Quatro **números grandes** do último mês com dado: saldo final, recebimentos, pagamentos operacionais e margem de caixa.
   - O **gráfico da margem** mês a mês (barra azul; se a margem for negativa, a barra fica vermelha).
   - A frase do **saldo inicial**. Clique em **Alterar saldo inicial**, digite 10.000,00 e salve. O saldo final da tabela sobe 10 mil em todos os meses.
   - A **tabela do ano**: saldo inicial, recebimentos, pagamentos (sem o sinal de menos), resultado da operação, os outros grupos, "Sem categoria" (se tiver, com link para a fila), fluxo líquido e saldo final. No celular, arraste a tabela para o lado: a primeira coluna fica parada.
   - **Comparar mês**: escolha um mês. Cada categoria mostra o valor, a porcentagem sobre os recebimentos e a variação contra o mês anterior. Pagamento que subiu mais de 12% fica vermelho; recebimento que subiu mais de 12% fica verde.
   - **Curva 80/20**: as categorias de pagamento que juntas fazem 80% do que saiu no mês aparecem em destaque, com a etiqueta "nos 80%".

Conta de conferência com a planilha modelo (setembro de 2026, saldo inicial zero e tudo classificado): entrou R$ 2.490,50 e saiu R$ 5.863,15, então o fluxo líquido do mês é **-3.372,65**.

## 5. Quem vê o quê

- Entre como **Consultora**. Ela vê as quatro telas, mas sem nenhum botão de mudar: sem "Novo lançamento", sem "Criar regra", sem "Renomear" e com um aviso na tela de importar.
- Entre como **RH**. O Caixa nem aparece no menu.

## Se algo der errado

Toda tela mostra um aviso vermelho quando não consegue falar com o banco. Anote a frase que apareceu em "Detalhe" e mande para a Maestria.
