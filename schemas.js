/**
 * @file schemas.js
 * @description Definição declarativa da estrutura de dados de cada bloco (Schemas) 
 * e motor de renderização dinâmica do Inspetor de Propriedades.
 */

export const blockSchemas = {
  /* ==========================================================================
     1. SISTEMA E AUTOMAÇÃO
     ========================================================================== */
  Mouse: [
    { name: 'x', label: 'Posição X:', type: 'text', default: 0 },
    { name: 'y', label: 'Posição Y:', type: 'text', default: 0 },
    {
      name: 'capturar',
      label: 'Capturar Posição',
      type: 'button',
      handler: function (blockId, updateConfig) {
        alert("A captura de mouse está disponível somente no ambiente Desktop (Windows/Linux) - Não disponível na versão Web Demo.");
      }
    },
    {
      name: 'ignoreCoords',
      label: 'Ignorar Coordenadas',
      type: 'checkbox',
      default: false,
      affects: ['x', 'y', 'RelativeCoords']
    },
    {
      name: 'RelativeCoords',
      label: 'Relativo à posição anterior',
      type: 'checkbox',
      default: false,
      affects: ['ignoreCoords']
    },
    {
      name: 'button',
      label: 'Botão do Mouse',
      type: 'radio',
      default: 'left',
      options: [
        { value: 'left',  label: 'Esquerdo', affects: [] },
        { value: 'right', label: 'Direito',  affects: [] },
        { value: 'Scroll', label: 'Scroll',  affects: [] }
      ]
    },
    {
      name: 'action',
      label: 'Ação',
      type: 'radio',
      default: 'Click',
      options: [
        { value: 'Click',  label: 'Clicar', affects: [] },
        { value: 'Down', label: 'Segurar', affects: [] },
        { value: 'Up', label: 'Soltar', affects: [] },
        { value: 'Move', label: 'Mover', affects: [] }
      ],
    },
    {
      name: 'useScroll',
      label: 'Rodar Scroll',
      type: 'checkbox',
      default: false,
      reveals: 'scrollAmount'
    },
    {
      name: 'scrollAmount',
      label: 'Quantidade de Scroll',
      type: 'number',
      default: 0,
      hidden: true
    },
  ],

  Tecla: [
    {
      name: 'modo',
      label: 'Modo de Entrada',
      type: 'radio',
      default: 'varios',
      options: [
        { value: 'varios', label: 'Vários' },
        { value: 'um', label: 'Um'}
      ]
    },
    {
      name: 'key_text_varios',
      label: 'Tecla(s)',
      type: 'text',
      default: ''
    },
    {
      name: 'key_text_um',
      label: 'Tecla',
      type: 'select',
      options: [
        'Enter','Backspace','Tab','Shift','Control','Alt','Meta','CapsLock',
        'Escape','Space','Delete','Insert','Home','End','PageUp','PageDown',
        'ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
        'Pause','ScrollLock','PrintScreen','ContextMenu',
        'A','B','C','D','E','F','G','H','I','J','K','L','M',
        'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
        'D0','D1','D2','D3','D4','D5','D6','D7','D8','D9',
        '`','-','=','[',']','\\',';',`'`,',','.','/',
        'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
        'Numpad0','Numpad1','Numpad2','Numpad3','Numpad4','Numpad5',
        'Numpad6','Numpad7','Numpad8','Numpad9',
        'NumpadMultiply','NumpadAdd','NumpadSubtract',
        'NumpadDecimal','NumpadDivide','NumpadEnter',
        'Ctrl+C', 'Ctrl+X', 'Ctrl+V', 'Ctrl+Z', 'Ctrl+Y', 'Ctrl+A', 'Ctrl+S',
        'Ctrl+P', 'Ctrl+F', 'Alt+Tab', 'Windows+D', 'Ctrl+Shift'
      ],
      default: ''
    },
    {
      name: 'acao',
      label: 'Ação',
      type: 'radio',
      default: 'Click',
      options: [
        { value: 'Click', label: 'Clicar' },
        { value: 'Down', label: 'Segurar' },
        { value: 'Up', label: 'Soltar' }
      ]
    },
    {
      name: 'init_delay',
      label: 'Init delay (ms)',
      type: 'number',
      default: 200,
      step: 100
    },
    {
      name: 'repeat_delay',
      label: 'Repeat delay (ms)',
      type: 'number',
      default: 50,
      step: 10
    }
  ],

  Delay: [
    {
      name: 'delay_tipo',
      label: 'Tipo de Delay',
      type: 'radio',
      layout: 'vertical',
      default: 'fixo',
      options: [
        { value: 'fixo', label: 'Delay fixo', affects: ['fixo_ms'] },
        { value: 'aleatorio', label: 'Delay aleatório', affects: ['aleatorio_inicio', 'aleatorio_fim'] },
        { value: 'variavel', label: 'Delay por variável', affects: ['variavel_name'] },
        { value: 'horario', label: 'Esperar até o horário', affects: ['hora_lim_delay'] },
        { value: 'processando', label: 'Enquanto processando', affects: [] },
      ]
    },
    {
      name: 'fixo_ms',
      label: 'Tempo (ms)',
      type: 'number',
      default: 1000,
      step: 100
    },
    {
      name: 'aleatorio_inicio',
      label: 'Mínimo (ms)',
      type: 'number',
      default: 500,
      step: 100
    },
    {
      name: 'aleatorio_fim',
      label: 'Máximo (ms)',
      type: 'number',
      default: 2000,
      step: 100
    },
    {
      name: 'variavel_name',
      label: 'Variável',
      type: 'select',
      options: [],
      default: ''
    },
    { 
      name: 'hora_lim_delay',
      label: 'Hora (HH:MM)',     
      type: 'time',    
      default: '00:00'
    },
  ],

  Label: [
    { name: 'text', label: 'Nome do Marcador:', type: 'text', default: '' }
  ],

  GoTo: [
    {
      name: 'label',
      label: 'Escolha o Label alvo:',
      type: 'select',
      options: [],
      default: ''
    }
  ],

  Window: [
    {
      name: 'titulo',
      label: 'Título da Janela',
      type: 'select',
      options: [],
      default: '',
      handler: (blockId, updateConfig) => {
        const select = document.querySelector(`[name="titulo-${blockId}"]`);
        if (!select) return;
        select.addEventListener('change', e => {
          updateConfig({ titulo: e.target.value });
        });
      }
    },
    {
      name: 'btn_atualizar_janelas',
      label: 'Atualizar',
      type: 'button',
      handler: (blockId, updateConfig) => {
        alert("A listagem de janelas abertas está disponível somente no ambiente Desktop (Windows/Linux) - Não disponível na versão Web Demo.");
      }
    },
    { name: 'x',        label: 'X',         type: 'number', default: 0, customLayout: 'geometry' },
    { name: 'largura',  label: 'Largura',   type: 'number', default: 0, customLayout: 'geometry' },
    { name: 'y',        label: 'Y',         type: 'number', default: 0, customLayout: 'geometry' },
    { name: 'altura',   label: 'Altura',    type: 'number', default: 0, customLayout: 'geometry' },
    {
      name: 'maximizar',
      label: 'Maximizar',
      type: 'checkbox',
      default: false
    },
    {
      name: 'minimizar',
      label: 'Minimizar',
      type: 'checkbox',
      default: false
    },
    {
      name: 'esperar',
      label: 'Esperar janela',
      type: 'checkbox',
      default: false
    },
    {
      name: 'mover_redimens',
      label: 'Mover/Redimensionar',
      type: 'checkbox',
      default: false,
    },
    {
      name: 'focar',
      label: 'Focar',
      type: 'checkbox',
      default: false
    },
    {
      name: 'fechar',
      label: 'Fechar',
      type: 'checkbox',
      default: false
    },
    {
      name: 'abrir',
      label: 'Abrir',
      type: 'checkbox',
      default: false,
      reveals: 'abrir_caminho'
    },
    {
      name: 'abrir_tipo',
      label: '',
      type: 'radio',
      default: 'arquivo',
      options: [
        { value: 'arquivo', label: 'Arquivo', affects: [] },
        { value: 'pasta', label: 'Pasta', affects: [] },
      ]
    },
    {
      name: 'abrir_caminho',
      label: 'Abrir Caminho',
      type: 'text',
      default: '',
      hidden: true,
      reveals: 'btn_abrir_path'
    },
    {
      name: 'atraso_ms',
      label: 'Atraso após ações (ms)',
      type: 'number',
      default: 250,
      step: 50
    },
    {
      name: 'sequencia_acoes',
      label: 'Ordem de execução',
      type: 'order-list',
      options: [
        { value: 'abrir',    label: 'ABRIR'     },
        { value: 'esperar',  label: 'ESPERAR'   },
        { value: 'mover',    label: 'MOVER'     },
        { value: 'minimizar',label: 'MINIMIZAR' },
        { value: 'maximizar',label: 'MAXIMIZAR' },
        { value: 'focar',    label: 'FOCAR'     },
        { value: 'fechar',   label: 'FECHAR'    }
      ],
      default: ['abrir','esperar','mover','minimizar','maximizar','focar','fechar']
    }
  ],

  Clipboard: [
    {
      name: 'limpar',
      label: 'Limpar clipboard',
      type: 'checkbox',
      default: false
    },
    {
      name: 'adicionar_texto',
      label: 'Adicionar texto ao clipboard',
      type: 'checkbox',
      default: false,
      reveals: 'texto'
    },
    {
      name: 'texto',
      label: 'Texto para adicionar',
      type: 'text',
      default: ''
    },
    {
      name: 'usar_variavel',
      label: 'Setar valor de variável no clipboard',
      type: 'checkbox',
      default: false,
      reveals: 'variavel'
    },
    {
      name: 'variavel',
      label: 'Escolha a variável',
      type: 'select',
      options: [],
      default: ''
    },
    {
      name: 'usar_variavel2',
      label: 'Setar valor do clipboard na variável',
      type: 'checkbox',
      default: false,
      reveals: 'variavel2'
    },
    {
      name: 'variavel2',
      label: 'Escolha a variável',
      type: 'select',
      options: [],
      default: ''
    },
    {
      name: 'usar_delay',
      label: 'Usar delay entre ações',
      type: 'checkbox',
      default: false,
      reveals: 'delay'
    },
    {
      name: 'delay',
      label: 'Delay (ms)',
      type: 'number',
      default: 50,
      step: 50
    }
  ],

  System: [
    {
      name: 'acao',
      label: 'Ação',
      type: 'radio',
      layout: 'vertical',
      default: 'Reiniciar',
      options: [
        { value: 'Reiniciar', label: 'Reiniciar o computador', affects: [] },
        { value: 'Desligar',  label: 'Desligar o computador', affects: [] },
        { value: 'Suspender', label: 'Suspender/Hibernar', affects: [] },
        { value: 'Bloquear',  label: 'Bloquear a sessão', affects: [] },
        { value: 'Logoff',    label: 'Encerrar sessão (Logoff)', affects: [] },
      ]
    },
    {
      name: 'delay_ms',
      label: 'Delay antes de executar (milissegundos):',
      type: 'number',
      default: 500,
      step: 100
    }
  ],

  IfOCR: [
    {
      name: 'acao_if',
      label: 'Modo',
      type: 'radio',
      default: 'Afirmar',
      options: [
        { value: 'Afirmar', label: 'Se encontrar' },
        { value: 'Negar', label: 'Se não encontrar' },
      ]
    },
    {
      name: 'area',
      label: 'Área (x,y,w,h)',
      type: 'text',
      default: ''
    },
    {
      name: 'btn_capturar_area',
      label: 'Capturar Área',
      type: 'button',
      handler: (blockId, updateConfig) => {
        alert("A captura de área da tela está disponível somente no ambiente Desktop (Windows/Linux) - Não disponível na versão Web Demo.");
      }
    },
    {
      name: 'idioma',
      label: 'Idioma OCR',
      type: 'select',
      options: ['por', 'eng', 'spa', 'deu', 'fra', 'ita'],
      default: 'por'
    },
    { name: 'header_filter', label: 'Critérios de Comparação e Filtro', type: 'header' },
    { name: 'texto_para_encontrar', label: 'Texto para encontrar', type: 'text', default: '' },
    { name: 'regex', label: 'Validar resultado encontrado com Regex', type: 'text', default: '' },
    { name: 'case_sensitive', label: 'Diferenciar maiúsculas/minúsculas', type: 'checkbox', default: false },
    { name: 'ignorar_espacos', label: 'Ignorar espaços em branco na comparação', type: 'checkbox', default: false },
    { name: 'header_img', label: 'Tratamento de Imagem', type: 'header' },
    { name: 'trat_grayscale', label: 'Converter para Escala de Cinza', type: 'checkbox', default: false },
    { name: 'trat_binarize', label: 'Binarizar (Preto e Branco)', type: 'checkbox', default: false },
    { name: 'trat_contrast', label: 'Aumentar Contraste', type: 'checkbox', default: false },
    { name: 'trat_invert', label: 'Inverter Cores (Negativo)', type: 'checkbox', default: false },
    { name: 'trat_denoise', label: 'Remover Ruído da Imagem', type: 'checkbox', default: false },
    { name: 'header_text', label: 'Tratamento e Saída do Texto', type: 'header' },
    { name: 'remover_espacos', label: 'Remover espaços em branco do texto encontrado', type: 'checkbox', default: false },
    { name: 'minusculas', label: 'Converter texto encontrado para minúsculas', type: 'checkbox', default: false },
    { name: 'armazenar_em_variavel', label: 'Armazenar texto encontrado em variável', type: 'checkbox', default: false, reveals: 'nome_variavel' },
    { name: 'nome_variavel', label: 'Variável destino', type: 'select', options: [], default: '', hidden: true },
    { name: 'timeout_ms', label: 'Procurar por (ms)', type: 'number', default: 3000, step: 500 },
    { name: 'btn_test_ocr', label: 'Testar Configuração', type: 'button', handler: (blockId) => {} },
  ],

  OCR: [
    {
      name: 'area',
      label: 'Área (x,y,w,h)',
      type: 'text',
      default: ''
    },
    {
      name: 'btn_capturar_area',
      label: 'Capturar Área',
      type: 'button',
      handler: (blockId, updateConfig) => {
        alert("A captura de área da tela está disponível somente no ambiente Desktop (Windows/Linux) - Não disponível na versão Web Demo.");
      }
    },
    {
      name: 'idioma',
      label: 'Idioma OCR',
      type: 'select',
      options: ['por', 'eng', 'spa', 'deu', 'fra', 'ita'],
      default: 'por'
    },
    { name: 'header_img', label: 'Tratamento de Imagem', type: 'header' },
    { name: 'trat_grayscale', label: 'Converter para Escala de Cinza', type: 'checkbox', default: false },
    { name: 'trat_binarize', label: 'Binarizar (Preto e Branco)', type: 'checkbox', default: false },
    { name: 'trat_contrast', label: 'Aumentar Contraste', type: 'checkbox', default: false },
    { name: 'trat_invert', label: 'Inverter Cores (Negativo)', type: 'checkbox', default: false },
    { name: 'trat_denoise', label: 'Remover Ruído da Imagem', type: 'checkbox', default: false },
    { name: 'header_text', label: 'Tratamento e Saída do Texto', type: 'header' },
    { name: 'remover_espacos', label: 'Remover espaços em branco', type: 'checkbox', default: false },
    { name: 'minusculas', label: 'Converter para minúsculas', type: 'checkbox', default: false },
    { name: 'armazenar_em_variavel', label: 'Armazenar resultado em variável', type: 'checkbox', default: false, reveals: 'nome_variavel' },
    { name: 'nome_variavel', label: 'Variável destino', type: 'select', options: [], default: '', hidden: true },
    { name: 'regex', label: 'Filtrar Texto com Regex', type: 'text', default: '' },
  ],

  ImageMatch: [
    {
      name: 'imagem_preview',
      label: 'Prévia da Imagem',
      type: 'custom',
      render: (_, config) => {
        const path = config.imagem_path;
        if (!path) return '<div style="color:#888">Nenhuma imagem selecionada</div>';
        const safe = path.replace(/\\/g, '/');
        const cacheBuster = Date.now();
        return `
          <div style="margin-top:6px">
            <img src="file://${safe}?cb=${cacheBuster}" style="max-width:300px; max-height:300px; border:1px solid #ccc; border-radius:4px;" />
          </div>
        `;
      }
    },
    {
      name: 'imagem_path',
      label: 'Caminho',
      type: 'text',
      default: ''
    },
    {
      name: 'btn_capturar_tela',
      label: 'Capturar da tela',
      type: 'button',
      handler: (blockId, updateConfig) => {
        alert("A captura de trechos da tela está disponível somente no ambiente Desktop (Windows/Linux) - Não disponível na versão Web Demo.");
      }
    },
    {
      name: 'threshold',
      label: 'Precisão (%)',
      type: 'number',
      default: 85,
      step: 5,
      min: 0,
      max: 100
    },
    {
      name: 'mostrar_deteccao',
      label: 'Mostrar marca visual',
      type: 'checkbox',
      default: false
    },
    {
      name: 'procurar_onde',
      label: 'Onde procurar?',
      type: 'radio',
      default: 'tela',
      layout: 'vertical',
      options: [
        { value: 'tela', label: 'Procurar na tela inteira', affects: [] },
        { value: 'regiao', label: 'Procurar em uma região determinada', affects: [] },
      ]
    },
    {
      name: 'area',
      label: 'Área (x,y,w,h)',
      type: 'text',
      default: ''
    },
    {
      name: 'btn_capturar_area',
      label: 'Capturar Área',
      type: 'button',
      handler: (blockId, updateConfig) => {
        alert("A definição de área de busca visual está disponível somente no ambiente Desktop (Windows/Linux) - Não disponível na versão Web Demo.");
      }
    },
    {
      name: 'acao',
      label: 'Ação a ser executada',
      type: 'select',
      default: 'click',
      options: [
        'Apenas encontrar (sem ação)',
        'Mover mouse para o centro',
        'Clicar no centro',
        'Duplo clique no centro',
        'Clique direito no centro',
        'Armazenar coordenadas em variáveis'
      ]
    },
    {
      name: 'variavel_x',
      label: 'Salvar coordenada X em:',
      type: 'select',
      options: [],
      default: '',
      showIf: { acao: 'Armazenar coordenadas em variáveis' }
    },
    {
      name: 'variavel_y',
      label: 'Salvar coordenada Y em:',
      type: 'select',
      options: [],
      default: '',
      showIf: { acao: 'Armazenar coordenadas em variáveis' }
    },
    {
      name: 'on_failure',
      label: 'Se não encontrar a imagem:',
      type: 'radio',
      default: 'continue',
      layout: 'vertical',
      options: [
        { value: 'parar', label: 'Parar robô' },
        { value: 'pausar', label: 'Pausar robô' },
        { value: 'continue', label: 'Continuar execução (ignorar)' }
      ]
    },
    {
      name: 'btn_test_ocr',
      label: 'Testar Configuração',
      type: 'button',
      handler: (blockId) => {}
    },
  ],

  IfImageMatch: [
    {
      name: 'acao_if',
      label: 'Modo',
      type: 'radio',
      default: 'Afirmar',
      options: [
        { value: 'Afirmar', label: 'Se encontrar' },
        { value: 'Negar', label: 'Se não encontrar' },
      ]
    },
    {
      name: 'imagem_preview',
      label: 'Prévia da Imagem',
      type: 'custom',
      render: (_, config) => {
        const path = config.imagem_path;
        if (!path) return '<div style="color:#888">Nenhuma imagem selecionada</div>';
        const safe = path.replace(/\\/g, '/');
        const cacheBuster = Date.now();
        return `
          <div style="margin-top:6px">
            <img src="file://${safe}?cb=${cacheBuster}" style="max-width:300px; max-height:300px; border:1px solid #ccc; border-radius:4px;" />
          </div>
        `;
      }
    },
    {
      name: 'imagem_path',
      label: 'Caminho',
      type: 'text',
      default: ''
    },
    {
      name: 'btn_capturar_tela',
      label: 'Capturar da tela',
      type: 'button',
      handler: (blockId, updateConfig) => {
        alert("A captura de trechos da tela está disponível somente no ambiente Desktop (Windows/Linux) - Não disponível na versão Web Demo.");
      }
    },
    {
      name: 'threshold',
      label: 'Precisão (%)',
      type: 'number',
      default: 85,
      step: 5,
      min: 0,
      max: 100
    },
    {
      name: 'mostrar_deteccao',
      label: 'Mostrar marca visual',
      type: 'checkbox',
      default: false
    },
    {
      name: 'procurar_onde',
      label: 'Onde procurar?',
      type: 'radio',
      default: 'tela',
      layout: 'vertical',
      options: [
        { value: 'tela', label: 'Procurar na tela inteira', affects: [] },
        { value: 'regiao', label: 'Procurar em uma região determinada', affects: [] },
      ]
    },
    {
      name: 'area',
      label: 'Área (x,y,w,h)',
      type: 'text',
      default: ''
    },
    {
      name: 'btn_capturar_area',
      label: 'Capturar Área',
      type: 'button',
      handler: (blockId, updateConfig) => {
        alert("A definição de área de busca visual está disponível somente no ambiente Desktop (Windows/Linux) - Não disponível na versão Web Demo.");
      }
    },
    {
      name: 'acao',
      label: 'Ação a ser executada',
      type: 'select',
      default: 'click',
      options: [
        'Sem ação adicional',
        'Mover mouse para o centro',
        'Clicar no centro',
        'Duplo clique no centro',
        'Clique direito no centro',
        'Armazenar coordenadas em variáveis'
      ]
    },
    {
      name: 'variavel_x',
      label: 'Salvar coordenada X em:',
      type: 'select',
      options: [],
      default: '',
      showIf: { acao: 'Armazenar coordenadas em variáveis' }
    },
    {
      name: 'variavel_y',
      label: 'Salvar coordenada Y em:',
      type: 'select',
      options: [],
      default: '',
      showIf: { acao: 'Armazenar coordenadas em variáveis' }
    },
    {
      name: 'timeout_ms',
      label: 'Procurar por (ms)',
      type: 'number',
      default: 3000,
      step: 500
    },
    {
      name: 'btn_test_ocr',
      label: 'Testar Configuração',
      type: 'button',
      handler: (blockId) => {}
    },
  ],

  Funcao: [
    { name: 'nome', label: 'Nome da Função', type: 'text', default: '' }
  ],
  Repeat: [
    { name: 'vezes', label: 'Número de Repetições', type: 'text', default:'2' }
  ],

  /* ==========================================================================
     2. CONTROLE DE FLUXO
     ========================================================================== */
  If: [
    {
      name: 'acao_if',
      label: 'Modo',
      type: 'radio',
      default: 'Afirmar',
      options: [
        { value: 'Afirmar', label: 'Afirmar', affects: [] },
        { value: 'Negar',  label: 'Negar', affects: [] },
      ]
    },
    {
      name: 'tipo_condicao',
      label: 'Condição',
      type: 'select',
      default: 'Se janela existir',
      options: [
        'Se janela existir',
        'Se janela estiver ativa',
        'Se variável >/< = valor',
        'Se variável conter texto',
        'Se valor do clipboard for igual',
        'Se valor estiver contido no clipboard',
        'Se arquivo existir',
        'Se tecla estiver pressionada',
        'Se processo estiver rodando',
        'Se título da janela contiver texto',
        'Se tempo atual (HH:MM) >',
        'Se cor do pixel em (X,Y) for igual',
        'Se conexão de rede estiver disponível'
      ]
    },
    { 
      name: 'janela_titulo', 
      label: 'Título da Janela', 
      type: 'select', 
      options: [], 
      default: '', 
      hidden: true 
    },
    {
      name: 'btn_atualizar_janelas',
      label: 'Atualizar Janelas',
      type: 'button',
      hidden: true,
      handler: (blockId, updateConfig) => {
        alert("A listagem de janelas abertas está disponível somente no ambiente Desktop (Windows/Linux) - Não disponível na versão Web Demo.");
      }
    },
    { name: 'variavel_nome',   label: 'Nome da Variável', type: 'select',    default: '', hidden: true },
    { name: 'operador',        label: 'Operador',         type: 'select',  options: ['>','<','=','>=','<=','!='], default: '=', hidden: true },
    { name: 'valor',           label: 'Valor',            type: 'number',    default: '0', hidden: true, step: 50 },
    { name: 'texto',           label: 'Texto',            type: 'text',    default: '', hidden: true },
    { name: 'texto2',          label: 'Texto',            type: 'text',    default: '', hidden: true },
    { name: 'texto3',          label: 'Texto',            type: 'text',    default: '', hidden: true },
    { name: 'texto4',          label: 'Texto',            type: 'text',    default: '', hidden: true },
    { name: 'delay_ms',        label: 'Tempo (ms)',       type: 'number',  default: 1000, hidden: true, step: 250 },
    { name: 'processo_nome',   label: 'Nome do Processo', type: 'select',    default: [], hidden: true },
    { name: 'hora_limite',     label: 'Hora (HH:MM)',     type: 'time',    default: '', hidden: true },
    { name: 'pixel_x',         label: 'Posição X',        type: 'text',  default: 0, hidden: true },
    { name: 'pixel_y',         label: 'Posição Y',        type: 'text',  default: 0, hidden: true },
    { name: 'cor_hex',         label: 'Hex da Cor',       type: 'text',    default: '#ffffff', hidden: true },
    {
      name: 'tecla',
      label: 'Tecla',
      type: 'select',
      hidden: true ,
      default: '',
      options: [
        'Enter','Backspace','Tab','Shift','Control','Alt','Meta','CapsLock',
        'Escape','Space','Delete','Insert','Home','End','PageUp','PageDown',
        'ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
        'Pause','ScrollLock','PrintScreen','ContextMenu',
        'A','B','C','D','E','F','G','H','I','J','K','L','M',
        'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
        'D0','D1','D2','D3','D4','D5','D6','D7','D8','D9',
        '`','-','=','[',']','\\',';',`'`,',','.','/',
        'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
        'Numpad0','Numpad1','Numpad2','Numpad3','Numpad4','Numpad5',
        'Numpad6','Numpad7','Numpad8','Numpad9',
        'NumpadMultiply','NumpadAdd','NumpadSubtract',
        'NumpadDecimal','NumpadDivide','NumpadEnter',
      ],
    },
    {
      name: 'abrir_tipo_if',
      label: '',
      type: 'radio',
      default: 'arquivo',
      options: [
        { value: 'arquivo', label: 'Arquivo', affects: [] },
        { value: 'pasta', label: 'Pasta', affects: [] },
      ]
    },
    {
      name: 'abrir_caminho_if',
      label: 'Caminho do Arquivo',
      type: 'text',
      default: '',
      hidden: true,
      reveals: ''
    },
    {
      name: 'btn_atualizar_process',
      label: 'Atualizar Processos',
      type: 'button',
      hidden: true,
      handler: (blockId, updateConfig) => {
        alert("A leitura de processos rodando está disponível somente no ambiente Desktop (Windows/Linux) - Não disponível na versão Web Demo.");
      }
    },
    {
      name: 'capturar',
      label: 'Capturar cor',
      type: 'button',
      hidden: true,
      handler: function (blockId, updateConfig) {
        alert("A inspeção de pixels/cores do sistema está disponível somente no ambiente Desktop (Windows/Linux) - Não disponível na versão Web Demo.");
      }
    },
    {
      name: 'btn_testar_pixel',
      label: 'Testar Configuração',
      type: 'button',
      hidden: true,
      handler: {}
    },
  ],

  Elif: [
    { name: 'condicao', label: 'Condição (expressão)', type: 'text', default: '' }
  ],
  Else: [],
  While: [
    {
      name: 'while_type',
      label: 'Tipo de Laço While',
      type: 'radio',
      default: 'logica',
      options: [
        { value: 'logica', label: 'Enquanto Lógica' },
        { value: 'imagem', label: 'Enquanto Imagem' },
        { value: 'ocr', label: 'Enquanto OCR' },
      ]
    },
    {
      name: 'logica_condicao',
      label: 'Executar Enquanto a Condição for:',
      type: 'radio',
      default: 'Afirmar',
      options: [
        { value: 'Afirmar', label: 'Verdadeira' },
        { value: 'Negar',  label: 'Falsa' },
      ]
    },
    { name: 'imagem_path', label: 'Caminho da Imagem', type: 'text', default: '', showIf: { while_type: 'imagem' } },
    { name: 'btn_capturar_img', label: 'Capturar da Tela', type: 'button', showIf: { while_type: 'imagem' } },
    { name: 'precisao', label: 'Precisão (%)', type: 'number', default: 90, showIf: { while_type: 'imagem' } },
    { name: 'area_imagem', label: 'Procurar na área (x,y,w,h)', type: 'text', default: '', showIf: { while_type: 'imagem' } },
    { name: 'ocr_texto', label: 'Texto para Encontrar', type: 'text', default: '', showIf: { while_type: 'ocr' } },
    { name: 'ocr_area', label: 'Procurar na Área (x,y,w,h)', type: 'text', default: '', showIf: { while_type: 'ocr' } },
    {
      name: 'tipo_condicao_logica',
      label: 'Condição Lógica',
      type: 'select',
      default: 'variavel',
      showIf: { while_type: 'logica' },
      options: [
        'Se variável >/< = valor',
        'Se janela existir',
        'Se arquivo existir',
        'Se tecla estiver pressionada',
      ]
    },
    { 
      name: 'var_nome', 
      label: 'Nome da Variável', 
      type: 'text', 
      default: '', 
      showIf: { while_type: 'logica', tipo_condicao_logica: 'Se variável >/< = valor' } 
    },
  ],
  Try: [],
  Catch: [
    {
      name: 'variavel_erro',
      label: 'Salvar mensagem de erro na variável (opcional):',
      type: 'text',
      default: ''
    }
  ],

  Variable: [
    {
      name: 'variavel',
      label: '',
      type: 'group',
      multiple: true,
      default: [{ coluna: '', valor: '' }],
      add_button_label: '+ Adicionar linha',
      fields: [
        { name: 'nome', label: 'Nome da Variável', type: 'text', default: '' },
        { name: 'valor',  label: 'Valor',  type: 'text', default: '' }
      ]
    }
  ],

  Break: [],
  Return: [
    {
      name: 'valor',
      label: 'Valor de Retorno (opcional, pode ser texto ou @variável):',
      type: 'text', 
      default: ''
    }
  ],

  /* ==========================================================================
     3. PERSONALIZAÇÃO E AVANÇADOS
     ========================================================================== */
  Python: [
    { name: 'codigo', label: 'Código Python', type: 'code', default: '' }
  ],
  ChamarFuncao: [
    {
      name: 'nome',
      label: 'Nome da Função',
      type: 'select',
      options: [],
      default: ''
    }
  ],

  Log: [
    {
      name: 'mensagem',
      label: 'Mensagem a ser registrada (suporta @variáveis):',
      type: 'text',
      default: ''
    },
    {
      name: 'nivel',
      label: 'Nível do Log:',
      type: 'select',
      default: 'Info',
      options: ['Info', 'Warning', 'Error', 'Debug']
    }
  ],
  Timer: [
    {
      name: 'nome',
      label: 'Nome do Timer (para múltiplos timers):',
      type: 'text',
      default: ''
    },
    {
      name: 'acao',
      label: 'Ação:',
      type: 'radio',
      default: 'start',
      options: [
        { value: 'start', label: 'Iniciar / Zerar' },
        { value: 'stop',  label: 'Parar e Registrar no Log' }
      ]
    }
  ],
  Comment: [
    { name: 'comentario', label: 'Comentário', type: 'textarea', default: '' }
  ],
  End: [],

  /* ==========================================================================
     4. BANCO DE DADOS (SQLite)
     ========================================================================== */
  SQLDDL: [
    {
      name: 'acao',
      label: 'Ação DDL',
      type: 'select',
      default: 'Criar Tabela',
      options: [
        'Criar Tabela',
        'Alterar Tabela',
        'Deletar Tabela'
      ]
    },
    { name: 'caminho', label: 'Banco de Dados (.db)', type: 'text', default: '' },
    {
      name: 'selecionar_sqlite',
      label: 'Selecionar Banco de Dados',
      type: 'button',
      handler: sharedSQLiteHandler('SQLDDL')
    },
    {
      name: 'nome_tabela',
      label: 'Nome da Tabela',
      type: 'text',
      default: '',
      showIf: { acao: 'Criar Tabela' }
    },
    {
      name: 'colunas',
      label: 'Colunas (ex: id INT PRIMARY KEY, nome TEXT)',
      type: 'textarea',
      default: '',
      showIf: { acao: 'Criar Tabela' }
    },
    {
      name: 'tabela_para_alterar',
      label: 'Tabela para Alterar',
      type: 'select',
      options: [],
      default: '',
      showIf: { acao: 'Alterar Tabela' }
    },
    {
      name: 'dados',
      label: 'Criar Nova Coluna',
      type: 'group',
      multiple: true,
      default: [{ valor: '', coluna_id: 'TEXT' }], 
      add_button_label: '+ Adicionar linha',
      showIf: { acao: 'Alterar Tabela' },
      fields: [
        { name: 'valor',  label: 'Nome da Nova Coluna',  type: 'text', default: '' },
        { name: 'coluna_id', label: 'Tipo da Nova Coluna', type: 'select', options: ['TEXT', 'INTEGER', 'REAL', 'NUMERIC', 'BLOB', 'BOOLEAN', 'DATE', 'DATETIME'] , default: 'TEXT' }
      ]
    },
    {
      name: 'tabela_para_deletar',
      label: 'Tabela para Deletar',
      type: 'select',
      options: [],
      default: '',
      showIf: { acao: 'Deletar Tabela' }
    }
  ],

  SQLInsert: [
    { name: 'caminho', label: 'Banco de Dados', type: 'text', default: '' },
    {
      name: 'selecionar_sqlite',
      label: 'Selecionar Banco de Dados',
      type: 'button',
      handler: function (blockId, updateConfig) {
        const { execFile } = window.require('child_process');
        const path = window.require('path');
        const scriptPath = path.join(__dirname, 'bin', 'explorar_sqlite.py');

        execFile('python', [scriptPath], (err, stdout) => {
          if (err) return;

          try {
            const data = JSON.parse(stdout.trim());
            if (data.erro) return;

            const { caminho, tabelas, colunas } = data;

            updateConfig({
              caminho,
              tabelas_disponiveis: tabelas,
              colunas_por_tabela: colunas,
              tabela: tabelas[0] || ''
            });

            const configForm = document.querySelector('#block-config-form');
            if (!configForm) return;

            const inputCaminho = configForm.querySelector(`[name="caminho"]`);
            if (inputCaminho) {
              inputCaminho.value = caminho;
              inputCaminho.dispatchEvent(new Event('input', { bubbles: true }));
            }

            const selectTabela = configForm.querySelector(`[name="tabela-${blockId}"]`);
            if (selectTabela && Array.isArray(tabelas)) {
              selectTabela.innerHTML = tabelas.map(t => `<option value="${t}">${t}</option>`).join('');
              selectTabela.value = tabelas[0] || '';
              selectTabela.dispatchEvent(new Event('change', { bubbles: true }));
            }

          } catch (e) {
            console.error(e);
          }
        });
      }
    },
    { name: 'tabela', label: 'Tabela - (Onde quero inserir?)', type: 'select', options: [], default: '' },
    {
      name: 'dados',
      label: 'Colunas e Valores - (O que eu quero inserir?)',
      type: 'group',
      multiple: true,
      default: [{ coluna: '', valor: '' }],
      add_button_label: '+ Adicionar linha',
      fields: [
        { name: 'coluna', label: 'Coluna', type: 'select', options: [], default: '' },
        { name: 'valor',  label: 'Valor',  type: 'text', default: '' }
      ]
    }
  ],

  SQLUpdate: [
    { name: 'caminho', label: 'Banco de Dados', type: 'text', default: '' },
    {
      name: 'selecionar_sqlite',
      label: 'Selecionar Banco de Dados',
      type: 'button',
      handler: sharedSQLiteHandler('SQLUpdate')
    },
    { name: 'tabela', label: 'Tabela', type: 'select', options: [], default: '' },
    {
      name: 'dados',
      label: 'Colunas e Valores (SET) - (O que será alterado?)',
      type: 'group',
      multiple: true,
      default: [{ coluna: '', valor: '' }],
      add_button_label: '+ Adicionar linha SET',
      fields: [
        {
          name: 'coluna',
          label: 'Coluna',
          type: 'select',
          options: [],
          default: ''
        },
        {
          name: 'valor',
          label: 'Valor',
          type: 'text',
          default: ''
        }
      ]
    },
    {
      name: 'condicoes',
      label: 'Condições WHERE - (O que preciso para alterar?)',
      type: 'group',
      multiple: true,
      default: [{ coluna: '', valor: '' }],
      add_button_label: '+ Adicionar condição WHERE',
      fields: [
        {
          name: 'coluna',
          label: 'Coluna',
          type: 'select',
          options: [],
          default: ''
        },
        {
          name: 'valor',
          label: 'Valor',
          type: 'text',
          default: ''
        }
      ]
    }
  ],

  SQLDelete: [
    { name: 'caminho', label: 'Banco de Dados', type: 'text', default: '' },
    {
      name: 'selecionar_sqlite',
      label: 'Selecionar Banco de Dados',
      type: 'button',
      handler: sharedSQLiteHandler('SQLDelete')
    },
    { name: 'tabela', label: 'Tabela - (De onde será deletado?)', type: 'select', options: [], default: '' },
    {
      name: 'condicoes',
      label: 'Condições WHERE - (O que preciso para deletar?)',
      type: 'group',
      multiple: true,
      default: [{ coluna: '', valor: '' }],
      add_button_label: '+ Adicionar condição WHERE',
      fields: [
        {
          name: 'coluna',
          label: 'Coluna',
          type: 'select',
          options: [],
          default: ''
        },
        {
          name: 'valor',
          label: 'Valor',
          type: 'text',
          default: ''
        }
      ]
    }
  ],

  SQLSelect: [
    { name: 'caminho', label: 'Banco de Dados', type: 'text', default: '' },
    {
      name: 'selecionar_sqlite',
      label: 'Selecionar Banco de Dados',
      type: 'button',
      handler: sharedSQLiteHandler('SQLSelect')
    },
    { name: 'tabela', label: 'Tabela', type: 'select', options: [], default: '' },
    {
      name: 'colunas',
      label: 'Adicione as colunas que farão parte da busca',
      type: 'group',
      multiple: true,
      default: [{ coluna: '' }],
      add_button_label: '+ Adicionar coluna',
      fields: [
        {
          name: 'coluna',
          label: 'Coluna',
          type: 'select',
          options: [],
          default: ''
        }
      ]
    },
    {
      name: 'condicoes',
      label: 'Condições WHERE - (O que eu quero buscar?)',
      type: 'group',
      multiple: true,
      default: [{ coluna: '', valor: '' }],
      add_button_label: '+ Adicionar condição WHERE',
      fields: [
        {
          name: 'coluna',
          label: 'Coluna',
          type: 'select',
          options: [],
          default: ''
        },
        {
          name: 'valor',
          label: 'Valor',
          type: 'text',
          default: ''
        }
      ]
    },
    {
      name: 'modo_resultado',
      label: 'Modo de retorno',
      type: 'radio',
      default: 'primeira',
      options: [
        { value: 'primeira', label: 'Primeira linha' },
        { value: 'todas', label: 'Todas (JSON)' }
      ]
    },
    {
      name: 'variavel_resultado',
      label: 'Salvar resultado em variável',
      type: 'select',
      options: [],
      default: ''
    }
  ],

  SQL: [
    { name: 'codigo', label: 'Código SQL', type: 'code', default: '' }
  ],

  /* ==========================================================================
     5. INTEGRAÇÕES E ARQUIVOS
     ========================================================================== */
  TabSeparator: [
    { name: 'name', label: 'Nome da Aba:', type: 'text', default: 'Nova Aba' }
  ],
  RequisicaoHTTP: [
    { name: 'header_main', label: 'Configuração Principal', type: 'header' },
    { 
      name: 'metodo', 
      label: 'Método HTTP:', 
      type: 'select', 
      default: 'GET', 
      options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] 
    },
    { 
      name: 'url', 
      label: 'URL do Endpoint (com https://):', 
      type: 'text', 
      default: '' 
    },
    {
      name: 'timeout',
      label: 'Timeout da requisição (em segundos):',
      type: 'number',
      default: 30
    },
    { name: 'header_headers', label: 'Cabeçalhos (Headers)', type: 'header' },
    { 
      name: 'headers', 
      label: 'Adicionar cabeçalhos:', 
      type: 'group', 
      multiple: true, 
      default: [{ chave: 'Content-Type', valor: 'application/json' }], 
      add_button_label: '+ Adicionar Cabeçalho',
      fields: [
          { name: 'chave', label: 'Chave', type: 'text' }, 
          { name: 'valor', label: 'Valor', type: 'text' }
      ]
    },
    { 
      name: 'header_params', 
      label: 'Parâmetros da URL (Query String)', 
      type: 'header', 
      showIf: { metodo: 'GET' }
    },
    { 
      name: 'params', 
      label: 'Adicionar parâmetros:', 
      type: 'group', 
      multiple: true, 
      default: [],
      add_button_label: '+ Adicionar Parâmetro',
      showIf: { metodo: 'GET' },
      fields: [
          { name: 'chave', label: 'Chave', type: 'text' }, 
          { name: 'valor', label: 'Valor', type: 'text' }
      ]
    },
    { 
      name: 'header_body', 
      label: 'Corpo da Requisição (Body/Payload)', 
      type: 'header', 
      showIf: { metodo: ['POST', 'PUT', 'PATCH'] }
    },
    { 
      name: 'corpo', 
      label: 'Dados (geralmente em formato JSON):', 
      type: 'code',
      default: '{\n  "key": "value"\n}', 
      showIf: { metodo: ['POST', 'PUT', 'PATCH'] } 
    },
    { name: 'header_output', label: 'Saída (Resposta da API)', type: 'header' },
    { 
      name: 'var_resposta', 
      label: 'Salvar Corpo da Resposta na Variável:', 
      type: 'text', 
      default: '@api_resposta' 
    },
    { 
      name: 'var_status', 
      label: 'Salvar Código de Status HTTP na Variável:', 
      type: 'text', 
      default: '@api_status_code' 
    },
  ],
  LerEscreverArquivo: [
    {
      name: 'acao',
      label: 'Ação:',
      type: 'radio',
      default: 'ler',
      options: [
        { value: 'ler', label: 'Ler Conteúdo' },
        { value: 'escrever', label: 'Escrever no Arquivo' },
      ]
    },
    {
      name: 'caminho_arquivo',
      label: 'Caminho do Arquivo:',
      type: 'text',
      default: 'C:\\caminho\\para\\meu_arquivo.txt'
    },
    {
      name: 'codificacao_leitura',
      label: 'Codificação (Encoding):',
      type: 'select',
      default: 'utf-8',
      options: ['utf-8', 'latin-1', 'ascii'],
      showIf: { acao: 'ler' }
    },
    {
      name: 'variavel_saida',
      label: 'Salvar Conteúdo Lido na Variável:',
      type: 'text',
      default: '@conteudo_arquivo',
      showIf: { acao: 'ler' }
    },
    {
      name: 'conteudo_escrita',
      label: 'Conteúdo a ser Escrito (suporta @variáveis):',
      type: 'textarea',
      default: '',
      showIf: { acao: 'escrever' }
    },
    {
      name: 'modo_escrita',
      label: 'Modo de Escrita:',
      type: 'radio',
      default: 'sobrescrever',
      options: [
        { value: 'sobrescrever', label: 'Sobrescrever arquivo existente' },
        { value: 'adicionar', label: 'Adicionar ao final do arquivo (Append)' },
      ],
      showIf: { acao: 'escrever' }
    },
    {
      name: 'codificacao_escrita',
      label: 'Codificação (Encoding):',
      type: 'select',
      default: 'utf-8',
      options: ['utf-8', 'latin-1', 'ascii'],
      showIf: { acao: 'escrever' }
    },
  ],
  ManipularJSON: [
    {
      name: 'json_entrada',
      label: 'Variável ou Texto JSON de Entrada:',
      type: 'textarea',
      default: '@api_resposta'
    },
    {
      name: 'caminho_json',
      label: 'Caminho do Dado (JSONPath - ex: $.cliente.nome):',
      type: 'text',
      default: '$.'
    },
    {
      name: 'acao',
      label: 'Ação:',
      type: 'radio',
      default: 'ler',
      options: [
        { value: 'ler', label: 'Ler Valor' },
        { value: 'modificar', label: 'Modificar/Adicionar Valor' },
      ]
    },
    {
      name: 'variavel_saida_leitura',
      label: 'Salvar Valor Lido na Variável:',
      type: 'text',
      default: '@dado_extraido',
      showIf: { acao: 'ler' }
    },
    {
      name: 'novo_valor',
      label: 'Novo Valor a ser Escrito (suporta @variáveis):',
      type: 'text',
      default: '',
      showIf: { acao: 'modificar' }
    },
    {
      name: 'variavel_saida_modificado',
      label: 'Salvar o NOVO JSON Modificado na Variável:',
      type: 'text',
      default: '@json_modificado',
      showIf: { acao: 'modificar' }
    }
  ],
  ExecutarComando: [
    {
      name: 'comando',
      label: 'Comando ou Caminho do Script (.bat, .ps1, etc.):',
      type: 'textarea',
      default: 'echo "Olá, Mundo!"'
    },
    {
      name: 'diretorio_execucao',
      label: 'Executar no Diretório (opcional):',
      type: 'text',
      default: ''
    },
    {
      name: 'header_output',
      label: 'Saída do Comando',
      type: 'header'
    },
    {
      name: 'var_saida_padrao',
      label: 'Salvar Saída Padrão (stdout) em:',
      type: 'text',
      default: '@resultado_comando'
    },
    {
      name: 'var_saida_erro',
      label: 'Salvar Saída de Erro (stderr) em:',
      type: 'text',
      default: '@erro_comando'
    },
    {
      name: 'var_exit_code',
      label: 'Salvar Código de Saída em:',
      type: 'text',
      default: '@codigo_saida_comando'
    },
  ],
};

/**
 * Renderiza dinamicamente um campo do formulário de configuração com base no schema.
 * @param {Object} f - Definição do campo extraída do schema.
 * @param {any} value - Valor atual salvo na configuração do bloco.
 * @param {Object} data - Dados globais do bloco ativo (contém o ID e outras propriedades).
 * @returns {string} String HTML estruturada representando o campo.
 */
export function renderField(f, value, data) {
  const id        = data.__blockId;
  const fieldName = `${f.name}-${id}`;
  const hidden    = f.hidden ? 'class="hidden-field"' : "";
  const affects   = Array.isArray(f.affects) && f.affects.length > 0
    ? `data-affects='${JSON.stringify(f.affects)}'`
    : "";
  const reveals   = f.reveals
    ? `data-reveals="${f.reveals}"`
    : "";
  const dataField = `data-field="${f.name}"`;

  if (f.visibleFor && data.config?.modo && f.visibleFor !== data.config.modo) {
    return '';
  }

  if (f.name === 'cor_hex') {
    return `
      <div class="field" ${hidden}>
        <label>${f.label}</label>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input
            type="text"
            name="${f.name}"
            value="${value}"
            ${dataField}
            style="width: 120px;">
          <div style="width: 24px; height: 24px; border: 1px solid #000; background-color: ${value};"></div>
        </div>
      </div>
    `;
  }

  if (f.type === "header") {
    return `<h4 style="margin-top: 16px; margin-bottom: 4px; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 0.95em; color: #333;">${f.label}</h4>`;
  }

  if (f.type === 'group' && f.multiple) {
    const items = Array.isArray(value) ? value : f.default || [];
    const containerId = `group-${f.name}-${id}`;
    const addButtonId = `add-${f.name}-${id}`;
    const itemClass = `group-item-${id}`;

    const renderGroupItem = (item, idx) => {
      const innerFieldsHTML = f.fields.map(innerField => {
        const fieldId = `${f.name}[${idx}].${innerField.name}`;
        const innerValue = item?.[innerField.name] ?? '';
        const fieldAttr = `name="${fieldId}" data-field="${fieldId}"`;
        
        let inputHTML = '';

        if (innerField.type === 'select') {
          const isColunaField = innerField.name.endsWith('coluna');
          let currentOptions = innerField.options || [];

          if (isColunaField && data.config.colunas_por_tabela) {
            const tabelaAtual = data.config.tabela;
            currentOptions = data.config.colunas_por_tabela[tabelaAtual] || [];
          }

          const optionsHtml = (isColunaField ? `<option value="" ${innerValue === '' ? 'selected' : ''}>(Selecione)</option>` : '')
            + currentOptions.map(opt => `<option value="${opt}" ${opt === innerValue ? 'selected' : ''}>${opt}</option>`).join('');
          inputHTML = `<select ${fieldAttr}>${optionsHtml}</select>`;
        }
        else {
          inputHTML = `<input type="${innerField.type || 'text'}" value="${innerValue}" ${fieldAttr}>`;
        }

        return `
          <div class="inline-field" style="flex: 1;">
            <label>${innerField.label}</label>
            ${inputHTML}
          </div>
        `;
      }).join('');

      return `
        <div class="${itemClass}" data-index="${idx}" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 6px;">
          ${innerFieldsHTML}
        </div>
      `;
    };

    const groupItemsHTML = items.map((item, idx) => renderGroupItem(item, idx)).join('');

    return `
      <div class="field group-field" data-field="${f.name}">
        <label>${f.label}</label>
        <div id="${containerId}">
          ${groupItemsHTML}
        </div>
        <button type="button" id="${addButtonId}" style="margin-top: 6px;">
          ${f.add_button_label || '+ Adicionar linha'}
        </button>
      </div>
    `;
  }

  if (f.name === 'abrir_caminho' || f.name === 'abrir_caminho_if') {
    const fieldId = `btn_abrir_path-${data.__blockId}`;
    return `
      <div class="field" ${hidden}>
        <label>${f.label}</label>
        <div style="display: flex; gap: 8px; align-items: center;">
          <input
            type="text"
            name="${f.name}"
            value="${value}"
            ${dataField}
            ${reveals}
            style="flex: 1;">
          <button id="${fieldId}" type="button" style="height: 28px;">📂</button> 
        </div>
      </div>
    `;
  }

  if (f.type === 'order-list') {
    const items = (Array.isArray(value) && value.length)
      ? value
      : f.options.map(opt => opt.value);

    const listId = `order-list-${id}`;
    const listItemsHTML = items.map(item => {
      const label = f.options.find(opt => opt.value === item)?.label || item.toUpperCase();
      return `<li data-value="${item}">${label}</li>`;
    }).join('');

    return `
      <div class="field order-list-field">
        <label>${f.label}</label>
        <ul id="${listId}" class="order-list">${listItemsHTML}</ul>
        <div class="order-list-spacer" aria-hidden="true"></div>
      </div>
    `;
  }
  
  if (f.customLayout === 'geometry') {
    return `
      <div class="field geometry-field">
        <label>${f.label}</label>
        <input
          type="${f.type}"
          name="${f.name}"
          value="${value}"
          ${f.step ? `step="${f.step}"` : ''}
          data-field="${f.name}">
      </div>
    `;
  }

  if (f.type === "textarea") {
    return `
      <div class="field" ${hidden}>
        <label>${f.label}</label>
        <textarea
          name="${f.name}"
          rows="4"
          ${dataField}
        >${value}</textarea>
      </div>
    `;
  }

  if (f.type === "checkbox") {
    return `
      <div class="field" ${hidden}>
        <label>
          <input
            type="checkbox"
            name="${f.name}"
            ${value ? "checked" : ""}
            ${affects}
            ${reveals}
            ${dataField}>
          ${f.label}
        </label>
      </div>
    `;
  }

  if (f.type === "radio" && Array.isArray(f.options)) {
    const groupClass = f.layout === 'vertical' ? 'radio-group-vertical' : 'radio-group';
    return `
      <div class="field" ${hidden}>
        <label>${f.label}</label>
        <div class="${groupClass}">
          ${f.options.map(opt => `
            <label>
              <input
                type="radio"
                name="${fieldName}"
                value="${opt.value}"
                ${opt.value === value ? "checked" : ""}
                data-field="${f.name}"
                data-affects='${JSON.stringify(opt.affects)}'
              >
              ${opt.label}
            </label>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (f.type === "select") {
    let options = Array.isArray(f.options) ? [...f.options] : [];
    if ((f.name === 'titulo' || f.name === 'janela_titulo') && Array.isArray(data.config.windowsList)) {
      options = data.config.windowsList;
    }
    if (f.name === 'processo_nome' && Array.isArray(data.config.windowsList2)) {
      options = data.config.windowsList2;
    }
    const val = data.config[f.name] ?? f.default ?? '';
    return `
      <div class="field" ${hidden} ${affects} ${reveals}>
        <label>${f.label}</label>
        <select
          name="${f.name}-${data.__blockId}"
          ${dataField}>
          ${options.map(opt => `
            <option value="${opt}" ${opt === val ? 'selected' : ''}>
              ${opt}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }

  if (f.type === "button") {
    return `
      <div class="field" ${hidden} ${affects} ${reveals} data-field="${f.name}">
        <button id="${f.name}-${data.__blockId}" type="button">${f.label}</button>
      </div>
    `;
  }

  if (f.type === "code") {
    const fieldId = `${f.name}-${data.__blockId}`;
    return `
      <div class="field code-field">
        <label>${f.label}</label>
        <div id="${fieldId}" class="code-editor"></div>
      </div>
    `;
  }

  if (f.name === 'cor_hex') {
    return `
      <div class="field" ${hidden}>
        <label for="${fieldName}">${f.label}</label>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input
            type="text"
            id="${fieldName}"
            name="${fieldName}"
            data-field="${f.name}"
            value="${value}"
            placeholder="#RRGGBB"
            style="width: 120px;"
            oninput="
              const preview = this.parentElement.querySelector('.cor-preview');
              const hex = this.value.trim().toUpperCase();
              if (/^#[0-9A-F]{6}$/.test(hex)) {
                preview.style.backgroundColor = hex;
              }
            "
          />
          <div
            class="cor-preview"
            style="
              width: 24px;
              height: 24px;
              border: 1px solid #ccc;
              background-color: ${value};
              border-radius: 4px;
            "
          ></div>
        </div>
      </div>
    `;
  }

  if (f.type === 'custom') {
    const id        = data.__blockId;
    const config    = data?.config || {};
    const hiddenStr = f.hidden ? 'class="hidden-field"' : '';
    const affectsStr= Array.isArray(f.affects) && f.affects.length > 0
      ? `data-affects='${JSON.stringify(f.affects)}'`
      : '';
    const revealsStr= f.reveals
      ? `data-reveals="${f.reveals}"`
      : '';
    const dataFieldStr = `data-field="${f.name}"`;

    const shouldHide = f.hidden || (typeof f.revealsWhen === 'function' && !f.revealsWhen(config));
    const hiddenStyle = shouldHide ? 'style="display:none;"' : '';

    const customContent = f.render(f, config);

    return `
      <div class="field" ${dataFieldStr} ${hiddenStr} ${affectsStr} ${revealsStr} ${hiddenStyle}>
        ${customContent}
      </div>
    `;
  }

  return `
    <div class="field" ${hidden}>
      <label>${f.label}</label>
      <input
        type="${f.type}"
        name="${f.name}"
        value="${value}"
        ${f.step ? `step="${f.step}"` : ''}
        ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.max !== undefined ? `max="${f.max}"` : ''} ${dataField}>
    </div>
  `;
}

/**
 * Constrói a configuração específica para o bloco de Delay com base no schema declarativo.
 * @param {Object} values - Valores base a serem extraídos.
 * @returns {Object} Configuração montada para o bloco.
 */
export function buildDelayConfig(values) {
  const schema = blockSchemas.Delay;
  const config = {};

  config.tipo = values.tipo;

  schema.forEach(field => {
    if (field.name === 'tipo') return;

    if (field.requiredWhen && field.requiredWhen.tipo(values.tipo)) {
      config[field.name] = values[field.name];
    }
  });

  return {
    type: 'Delay',
    config
  };
}

/**
 * Fornece um manipulador padrão para eventos de banco de dados SQLite, disparando um alerta de ambiente.
 * Utilizado pelos blocos de manipulação de banco de dados para indicar limitações da versão Web.
 * @param {string} blockType - O tipo de bloco SQL associado ao handler.
 * @returns {Function} Função que executa o alerta com informações do ambiente.
 */
function sharedSQLiteHandler(blockType) {
  return function (blockId, updateConfig) {
    alert("A leitura dinâmica da estrutura de bancos SQLite está disponível somente no ambiente Desktop (Windows/Linux). Na versão Demo Web, os nomes das tabelas e colunas precisam ser inseridos manualmente.");
  };
}