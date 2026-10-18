# Documentação de Arquitetura e Manual de Funcionalidades

## Projeto: NoCode Editor (Versão Web/Desktop)

## 1. Visão Geral e Filosofia Arquitetural

O **NoCode Editor** é uma plataforma de desenvolvimento visual baseada em blocos, projetada para criar scripts de automação complexos sem a necessidade de escrever código tradicional (embora suporte inserção avançada de código Python e SQL).

A principal decisão arquitetural deste projeto foi a **utilização estrita de tecnologias web nativas (Vanilla JavaScript, HTML5 e CSS3 puro)**, abolindo frameworks reativos pesados. 

### Por que Vanilla JS?

1. **Performance Absoluta:** O editor precisa lidar com centenas de blocos na tela, com mecânicas de arrastar e soltar operando a 60 frames por segundo, além de recalcular indentações em tempo real. O DOM virtual de frameworks reativos adicionaria um *overhead* desnecessário para essas manipulações diretas complexas.
2. **Integração Desktop/Web:** O projeto foi desenhado para atuar como o cérebro visual (Blueprint) que gera um artefato JSON. Esse artefato pode ser empacotado e lido por um motor nativo (em Python/C#) no Desktop, ou rodar de forma demonstrativa na Web, sem conflitos de dependências.
3. **Dependências Mínimas:** As únicas abstrações externas utilizadas são exclusivas para a experiência do usuário: um editor de código integrado (para *syntax highlighting*) e uma biblioteca de iconografia vetorial.

### Gerenciamento de Estado (Híbrido)

A arquitetura adota um padrão dividido:
* **O DOM é a fonte da verdade estrutural:** A ordem dos elementos visuais na tela dita o fluxo de execução real do algoritmo.
* **A Memória é a fonte da verdade paramétrica:** Um dicionário global de dados armazena as configurações pesadas, variáveis e propriedades de cada bloco de forma assíncrona ao visual, otimizando o consumo de RAM.

---

## 2. Componentes Lógicos do Sistema

A engenharia do sistema está dividida em módulos lógicos, separando a responsabilidade visual da lógica de negócios.

### 2.1. O Esqueleto Semântico e Interface (UI/UX)
A interface adota um layout clássico de IDE (Ambiente de Desenvolvimento Integrado), focada em fluidez:
* **Barra de Ferramentas:** Acesso rápido a ações globais (Salvar, Executar, Ordenar Abas).
* **Catálogo de Componentes:** Menu lateral colapsável com todas as ferramentas de automação divididas por categoria.
* **Área de Trabalho (Workspace):** O "canvas" infinito onde a lógica ganha vida. Possui um sistema de *scrollbar* customizado para não interferir nos eventos de *Drag and Drop* e suporta múltiplas abas dinâmicas.
* **Inspetor de Propriedades:** Um painel reativo lateral que se molda automaticamente dependendo de qual bloco foi selecionado, gerando formulários sob medida.

### 2.2. Motor de Dados e Esquemas Declarativos
O cérebro de configuração do projeto. Em vez de criar painéis visuais manualmente para cada bloco novo, o sistema utiliza **Esquemas Declarativos**.
Cada bloco possui um "molde" que define seus campos (texto, número, seletores, botões, ou grids complexos). Este motor suporta:
* **Lógica Condicional de Interface (`showIf` / `reveals`):** Campos que só aparecem se uma determinada opção for selecionada (Ex: o campo "Caminho do Arquivo" só aparece se a caixa "Abrir Arquivo" for marcada).
* **Grupos Dinâmicos:** Permite criar listas infinitas dentro das propriedades (ex: adicionar múltiplas variáveis ou dezenas de filtros `WHERE` em uma consulta SQL).

### 2.3. O Controlador Global (Core Engine)
O maestro da aplicação responsável por unir o visual aos dados. Suas principais engrenagens são:

* **Sistema de Desfazer/Refazer (Undo/Redo Stack):** O sistema captura o estado antes de qualquer alteração destrutiva (deletar, colar, arrastar). Ele realiza cópias profundas da lógica, limitando a pilha na memória para garantir performance.
* **Motor de Drag and Drop Nativo:** Uma mecânica de arrasto otimizada que calcula a colisão do cursor a 60FPS, injetando indicadores de posicionamento (placeholders) sem travar a interface.
* **Autocompletar Dinâmico:** Um varredor em tempo real que analisa campos de texto. Quando o usuário digita `@`, o sistema varre o projeto inteiro buscando variáveis declaradas e oferece sugestões na tela.
* **Algoritmos de Escopo e Indentação:** Analisadores léxicos visuais. Ao identificar blocos "abridores" (como `If`, `While`), o controlador aumenta a profundidade (indentação) dos blocos seguintes no eixo X, e cria laços colapsáveis (para esconder blocos gigantescos dentro de um escopo e manter a tela limpa).
* **Parser de Execução Híbrida:** Mecanismo que avalia se a execução é Web ou Desktop. Na Web, ele intercepta botões que exigiriam acesso ao sistema operacional (como listar janelas do Windows) e oferece testes lógicos simulados direto no navegador.

---

## 3. Manual Exaustivo de Blocos e Capacidades

O NoCode Editor possui um arsenal de ferramentas projetadas para cobrir desde fluxos simples até automações de engenharia de dados.

### 3.1. Controle de Fluxo
Controlam o rumo que o script vai tomar com base em inteligência lógica.

* **If (Se Lógico):** O bloco decisório mestre. Pode avaliar variáveis (usando matemática `>`, `<`, `=`), verificar se uma janela ou arquivo específico existe no computador, ler a área de transferência, monitorar se uma tecla física está sendo pressionada, checar processos do Windows, ler a hora atual do sistema ou inspecionar a cor de um pixel específico (Hex).
* **If Imagem (Image Match):** Une a lógica `If` com Visão Computacional. Toma decisões caso encontre (ou não) um recorte de imagem na tela, com controle de tolerância (Threshold).
* **If OCR:** Une a lógica `If` com Inteligência Artificial de Leitura Óptica. Decide caminhos baseados na existência de textos renderizados na tela, permitindo uso de Regex para validar padrões.
* **Elif / Else (Senão Se / Senão):** Acoplados a qualquer bloco `If`. Oferecem rotas alternativas caso a condição principal falhe. O sistema visualmente mescla blocos `Elif` na interface para criar "cascatas" limpas.
* **While (Enquanto):** Cria laços de repetição infinitos baseados no estado do computador. Pode ficar rodando "Enquanto a lógica X for verdadeira", "Enquanto a imagem Y estiver na tela", ou "Enquanto o texto Z for legível no OCR".
* **Repeat:** Um loop forçado. Executa tudo o que estiver dentro dele uma quantidade `X` exata de vezes.
* **Break:** Interrompe abruptamente qualquer laço de repetição (`While` ou `Repeat`), forçando o robô a sair do ciclo.
* **Try / Catch:** Sistema profissional de tratamento de exceções. Tenta executar o bloco `Try`. Se houver qualquer falha fatal, o robô não trava: ele aborta o `Try`, salva a mensagem de erro em uma variável declarada, e executa o bloco `Catch` para tentar se recuperar.
* **Função / Chamar Função / Return:** Modularização extrema. Permite "empacotar" uma rotina gigante dentro de um bloco `Função`, e depois executá-la em várias partes do script usando `Chamar Função`. O `Return` devolve os cálculos para o fluxo principal.
* **Label / GoTo:** Sistema de navegação por âncoras. O `Label` marca um ponto na lógica, e o `GoTo` força o algoritmo a voltar no tempo ou pular diretamente para aquele ponto.

### 3.2. Comandos de Automação
Atuam diretamente no ecossistema do Sistema Operacional, emulando um ser humano.

* **Mouse:** Move o cursor em coordenadas absolutas ou relativas. Simula cliques esquerdos, direitos, ou pressionamento de botões. Possui controle de rolagem (Scroll).
* **Teclado:** Possui modo "Um" (para atalhos complexos como `Ctrl+Shift+Esc`) ou modo "Vários" para digitação humana contínua. Permite configurar o delay entre cada pressionamento de tecla para evitar bloqueios anti-bot de sistemas.
* **Ler Texto (OCR):** Motor de extração de texto. Define-se uma região da tela (x,y,w,h) e o idioma. O bloco possui filtros robustos de pré-processamento de imagem embarcados (Conversão Grayscale, Binarização, Contraste, Inversão Negativa e Denoise) para ler fundos complexos. O texto extraído limpo vai direto para uma variável.
* **Image Match:** Visão Computacional de ação. Busca uma sub-imagem, exibe a prévia no inspetor visual e, ao encontrar, pode executar ações automaticamente (clicar no centro, duplo clique, arrastar ou apenas salvar as coordenadas `X` e `Y` em variáveis). Permite definir o que fazer em caso de falha (Parar robô, Pausar, ou Ignorar).
* **Janela:** Gestor de janelas do SO. Seleciona janelas ativas e pode Forçar Foco, Minimizar, Maximizar, Fechar ou reposicioná-las para metragens exatas na tela. Também serve como "Abridor" de arquivos/pastas.
* **Sistema:** Comandos agressivos de OS: Desligar o computador, Reiniciar, Bloquear Sessão, Logoff ou Hibernar, com temporizadores de carência.
* **Variável:** Matriz de dados. Permite criar múltiplas variáveis ao mesmo tempo através de uma interface de *Grid*. Variáveis são globais e podem armazenar textos, números ou retornos de funções.
* **Área de Transferência (Clipboard):** Manipula o Ctrl+C do sistema. Limpa a área, insere textos forçados, joga valores de variáveis no clipboard ou captura o que está copiado e salva no robô.

### 3.3. Engenharia de Banco de Dados (SQLite)
Uma interface visual de DBA (Database Administrator) completa acoplada ao sistema, sem exigir que o usuário saiba linguagem SQL pura.

* **SQL Estrutura (DDL):** Construtor de tabelas. Cria novas estruturas de dados, deleta tabelas ou altera a estrutura em tempo real adicionando novas colunas via formulário limpo.
* **Inserir Dados (SQL Insert):** Mapeamento dinâmico. O bloco escaneia a tabela, lista os campos exigidos, e o usuário apenas mapeia quais variáveis do robô vão para quais colunas do banco.
* **Atualizar Dados (SQL Update):** Combina ações `SET` e `WHERE`. Ex: "Mude a coluna 'Status' para 'Processado' APENAS ONDE a coluna 'ID' for igual a '@id_atual'".
* **Deletar Dados (SQL Delete):** Construtor visual de cláusulas `WHERE` para deletar registros específicos com segurança.
* **Consultar Dados (SQL Select):** O extrator. Busca dados filtrados e permite definir o retorno: ou puxa apenas a primeira linha para uma variável, ou puxa o lote inteiro em formato JSON estruturado (ideal para rodar um `While` ou envio para API).

### 3.4. Avançado (Integrações e Scripting)
Para quando as automações visuais não são suficientes e o fluxo exige conexões externas.

* **Requisição HTTP (API):** Construtor completo de conexões com a Web. Suporta métodos `GET`, `POST`, `PUT`, `DELETE`, `PATCH`. Permite injetar Cabeçalhos (Headers) personalizados, Parâmetros de Query String e o Corpo (Payload) com Syntax Highlighting. Salva a resposta da API e o Código de Status HTTP em variáveis independentes.
* **Manipular JSON:** Ferramenta cirúrgica de tratamento de dados. Utiliza sintaxe *JSONPath* (Ex: `$.clientes[0].endereco.cep`) para extrair ou reescrever pedaços específicos de um amontoado de dados de resposta de APIs de forma simplificada.
* **Ler / Escrever Arquivo:** Automação física de disco. Manipula arquivos do Windows (`.txt`, `.csv`, `.log`). Na leitura, puxa o texto (em utf-8, latin, etc) para a RAM. Na escrita, permite criar novos relatórios suportando injeção de variáveis, com modo "Sobrescrever" ou "Adicionar ao Final" (Append).
* **Executar Comando (Shell):** Acesso direto ao *Command Prompt* ou PowerShell. Executa scripts `.bat`, `.ps1` ou utilitários do sistema operando num diretório específico. Salva as respostas `stdout` (sucesso), `stderr` (erro) e o *Exit Code* em variáveis para uso no robô.
* **Código SQL:** Um bloco de editor profundo para *Queries* de altíssima complexidade (ex: `INNER JOINS` recursivos) que as telas visuais do CRUD não cobririam.
* **Código Python:** A "Bala de Prata" do sistema. Abre um IDE com validação de escopo onde desenvolvedores podem escrever lógica Python pura. O script inserido herda o contexto do robô.

### 3.5. Monitoramento e Utilitários
Blocos vitais para auditoria e sincronismo da automação.

* **Delay:** O regente do tempo. Permite agendar uma pausa "Fixa" (ex: esperar 2 segundos), "Aleatória" (ex: esperar entre 1 e 4 segundos, muito usado em bots para evitar padronização), "Por Variável" ou "Esperar até um horário limite" (Ex: pausar o robô até as 08:00 AM).
* **Timer:** Um cronômetro interno. Inicia a contagem num ponto do fluxo e a encerra em outro, registrando automaticamente nos logs quanto tempo a transação demorou (ideal para gerar métricas de SLA).
* **Log:** Auditoria. Imprime mensagens rastreáveis no console ou arquivo externo de execução, suportando mescla de texto e `@variáveis`, classificados por níveis (Info, Warning, Error, Debug).
* **Comentário:** Bloco passivo visual. Não executa nada, apenas carrega anotações gigantes (post-its) na área de trabalho para explicar trechos do código para outros desenvolvedores da equipe.

---

## 4. Considerações Finais e Entrega

A arquitetura do NoCode Editor demonstra que interfaces complexas, escaláveis e de alta performance podem ser construídas de forma estrita com tecnologias nativas, descartando a dependência de pacotes *node_modules* colossais. 

Ao mantermos uma fronteira absoluta entre **"O Que o Usuário Desenha"** (O Visual) e **"O Que o Robô Entende"** (O JSON exportado e interpretado em tempo de execução nativa), o sistema garante retrocompatibilidade infinita e segurança operacional. O projeto empodera usuários de negócios a criarem lógicas avançadas de *RPA* (Robotic Process Automation) sem sacrificar o poder destrutivo e versátil de ferramentas de código profundo.