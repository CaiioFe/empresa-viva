# Como testar Pessoas, DISC e Configurações

Roteiro para conferir as telas de Pessoas (TASK-201 e 202), do teste DISC (TASK-203) e de Configurações.
Precisa do sistema aberto com o banco da demonstração (dados inventados). Leva uns 15 minutos.

## 1. Lista de pessoas (entrar como RH)

1. Entre como **RH** e clique em **Pessoas** no menu.
2. No topo aparecem quatro números: quantos colaboradores ativos, quantos estão em integração, quanto do time já fez o DISC e quantos ainda não fizeram.
3. Na lista, cada pessoa tem uma bolinha com as iniciais, o nome, a função, a situação da integração (Concluída, Em andamento ou Não iniciada) e um quadradinho com a letra do DISC. Quem não fez o DISC aparece com um "?" pontilhado.
4. Digite parte de um nome na busca (pode ser sem acento): a lista filtra na hora.
5. Troque o **Setor** e a **Situação** (Ativos, Desligados, Todos) e veja a lista mudar.

## 2. Cadastrar alguém

1. Clique em **Novo colaborador**.
2. Preencha nome, função, setor, data de entrada, telefone (com DDD) e e-mail. Só o nome é obrigatório.
3. Clique em **Cadastrar**. O sistema abre a ficha da pessoa nova.
4. Na ficha, a **Jornada na empresa** já mostra a contratação. Ela entra sozinha.

## 3. Ficha da pessoa

1. **Editar dados:** mude a função, salve e veja o cabeçalho atualizar.
2. **Registrar na jornada:** escolha o tipo (anotação, treinamento, avaliação, mudança de função, férias, integração), a data e o texto. O evento aparece na linha do tempo, do mais novo para o mais antigo, com a cor e o ícone do tipo.
3. **Integração:** marque as caixinhas das etapas. Ao marcar a última, a situação vira **Concluída** e a jornada ganha "Integração concluída". Dá para desmarcar se errou.
4. **Desligar:** clique em **Desligar**, informe a data de saída e um motivo e confirme. A pessoa some da lista de ativos (aparece em "Desligados") e o desligamento entra na jornada.

## 4. Mandar o DISC

1. Abra a ficha de alguém sem DISC e clique em **Enviar teste DISC**.
2. Aparece o link do teste, o botão **Copiar link** e o botão **Enviar no WhatsApp** (esse só aparece se a ficha tiver telefone). O WhatsApp abre com a mensagem pronta e o link.
3. Enquanto a pessoa não responde, a ficha mostra **Aguardando resposta** e o link continua ali para mandar de novo.

## 5. Responder o DISC (como se fosse o colaborador)

1. Copie o link e abra numa janela anônima do navegador ou no celular. Não precisa de login.
2. A tela diz "Olá" com o primeiro nome da pessoa e explica o teste. Toque em **Começar**.
3. São 24 perguntas, uma por tela, com a barra de progresso em cima. O botão **Voltar** leva para a pergunta anterior e deixa trocar a resposta.
4. Ao responder a última, aparece a letra do perfil, o nome e o texto, com a frase "Pronto, o resultado já está na sua ficha".
5. Volte à ficha no sistema e atualize a página: o card do DISC mostra a letra grande, o texto do perfil e as quatro barras com a porcentagem. A jornada ganha "DISC respondido pelo celular".
6. Abra o mesmo link de novo: a tela avisa que o link já foi usado. Um link inventado mostra a mesma mensagem.

## 6. O que cada papel vê

| Papel | O que conferir |
|---|---|
| **Dono** | Tudo: cadastra, edita, desliga, marca integração, manda DISC e abre Configurações |
| **RH** | Igual ao Dono em Pessoas, mas sem Configurações no menu |
| **Consultora** | Vê a lista e as fichas. Não tem "Novo colaborador", "Editar dados", "Desligar" nem "Enviar teste DISC". As caixinhas da integração ficam travadas. Mas **tem "Registrar na jornada"** |
| **Financeiro** | Não acha Pessoas em lugar nenhum |

## 7. Configurações (entrar como Dono)

1. Clique em **Configurações** no menu.
2. **Etapas da integração:** crie uma etapa nova, mude o nome de uma (aparece o botão "Salvar nome"), use as setinhas para mudar a ordem e desative uma. Abra uma ficha e confira que a etapa desativada sumiu da lista de caixinhas.
3. **Usuários da empresa:** a sua própria linha aparece com "Você" e sem botões (ninguém se rebaixa por engano). Nas outras linhas dá para trocar o papel e desativar.
4. Para incluir uma pessoa nova no sistema, a tela avisa para falar com a Maestria. É de propósito: o banco é compartilhado com a área de membros e o usuário é criado por nós.

## Se algo der errado

- Toda tela mostra "Carregando..." enquanto busca e um aviso com **Tentar de novo** se a internet cair.
- Anote o que clicou, o papel com que entrou e o que apareceu na tela. Depois mande para a Maestria.
