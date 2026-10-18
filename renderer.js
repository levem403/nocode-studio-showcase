/**
 * @file renderer.js
 * @description Arquitetura Principal. Gerencia o estado global, o ciclo de vida dos blocos, 
 * operações de I/O, Drag and Drop e a construção dinâmica do Inspetor de Propriedades.
 */

import { blockSchemas, renderField } from './schemas.js';
import { createCodeEditor } from './createEditor.js';

document.addEventListener("DOMContentLoaded", () => {
  const workspace = document.getElementById("workspace");
  const inner = document.querySelector(".workspace-inner");
  const thumb = document.querySelector(".scrollbar-thumb");
  const auxiliary = document.querySelector(".auxiliary");
  const mainContent = document.querySelector('.main-content');
  const sidebar = document.querySelector('.sidebar');
  const resizer = document.getElementById("resizer");
  
  const blockList = [];
  const blockDataMap = new Map();
  window.blockDataMap = blockDataMap;
  
  let blockIdCounter = 1;
  let activeTabSeparatorId = null;
  let executionOrderIds = [];
  let isWorkspaceDirty = false;

  const tabPlaceholder = document.createElement('div');
  tabPlaceholder.className = 'tab-placeholder';
  
  const lucideMap = {
    Mouse: "mouse-pointer", Tecla: "keyboard", Delay: "clock", Label: "tag", GoTo: "corner-up-left",
    Window: "app-window", Clipboard: "clipboard", System: "terminal", OCR: "scan", IfOCR: "scan",
    ImageMatch: "image", IfImageMatch: "image", Funcao: "function-square", Repeat: "repeat",
    If: "git-branch", Elif: "git-branch-plus", Else: "git-branch", While: "refresh-ccw",
    Try: "alert-circle", Catch: "shield-alert", Variable: "database", Break: "ban", Return: "undo",
    Python: "code-2", RequisicaoHTTP: "globe", ChamarFuncao: "play-circle", Log: "list", Timer: "timer",
    Comment: "message-circle", End: "chevron-right-square", ManipularJSON: "braces",
    LerEscreverArquivo: "file-text", ExecutarComando: "terminal-square", SQLDDL: "database",
    SQLInsert: "log-in", SQLUpdate: "edit-3", SQLDelete: "trash-2", SQLSelect: "search", SQL: "code-2"
  };

  /* ==========================================================================
   * Gerenciamento de Modais Customizados
   * Substitui os comportamentos nativos de alert() e confirm() do navegador.
     ========================================================================== */
  function showModal({ title, message, buttons = [] }) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const footerEl = document.getElementById('modal-footer');
    const closeBtn = document.getElementById('modal-close-btn');

    titleEl.textContent = title;
    messageEl.innerHTML = message;
    footerEl.innerHTML = '';

    return new Promise(resolve => {
      const closeModal = (value) => {
        overlay.classList.add('hidden');
        resolve(value);
      };

      buttons.forEach(btnInfo => {
        const button = document.createElement('button');
        button.textContent = btnInfo.text;
        if (btnInfo.class) button.className = btnInfo.class;
        button.onclick = () => closeModal(btnInfo.value);
        footerEl.appendChild(button);
      });

      closeBtn.onclick = () => closeModal(false);
      overlay.onclick = e => { if (e.target === overlay) closeModal(false); };
      
      overlay.classList.remove('hidden');
      if (footerEl.firstChild) footerEl.firstChild.focus();
    });
  }

  async function showAlert(message, title = "Aviso") {
    await showModal({
      title,
      message,
      buttons: [{ text: "OK", value: true }]
    });
  }

  async function showConfirm(message, { title = "Confirmação", ok = "Confirmar", cancel = "Cancelar", danger = false } = {}) {
    const confirmClass = danger ? 'btn-danger' : '';
    return await showModal({
      title,
      message,
      buttons: [
        { text: cancel, value: false, class: 'btn-secondary' },
        { text: ok, value: true, class: confirmClass }
      ]
    });
  }

  /* ==========================================================================
   * Gerenciamento do Workspace e Abas
     ========================================================================== */
  function renderTabs() {
      const tabsContainer = document.getElementById('workspace-tabs');
      const addButton = document.getElementById('add-workspace-btn');

      const tabsToRemove = tabsContainer.querySelectorAll('.tab-item');
      tabsToRemove.forEach(tab => {
          if (tab.parentNode === tabsContainer) {
              tabsContainer.removeChild(tab);
          }
      });

      const separatorBlocks = blockList.filter(b => blockDataMap.get(+b.dataset.id)?.type === 'TabSeparator');

      if (!separatorBlocks.length) {
          addBlock('TabSeparator', { name: 'Principal' });
          setTimeout(renderTabs, 0);
          return;
      }

      const visualOrder = getVisualTabOrderIds();
      const executionOrderIsCustom = executionOrderIds.length > 0 && JSON.stringify(visualOrder) !== JSON.stringify(executionOrderIds);

      separatorBlocks.forEach(blockEl => {
          const blockId = +blockEl.dataset.id;
          const data = blockDataMap.get(blockId);
          if (!data) return;

          const tab = document.createElement('div');
          tab.className = 'tab-item';
          tab.dataset.tabId = blockId;

          if (executionOrderIsCustom) {
              const execPosition = executionOrderIds.indexOf(blockId);
              if (execPosition !== -1) {
                  const orderBadge = document.createElement('span');
                  orderBadge.className = 'tab-exec-order';
                  orderBadge.textContent = execPosition + 1;
                  orderBadge.title = `Ordem de Execução: ${execPosition + 1}`;
                  tab.appendChild(orderBadge);
              }
          }

          const tabName = document.createElement('span');
          tabName.textContent = data.config.name;
          tab.appendChild(tabName);

          if (blockId !== +blockList[0].dataset.id) {
              const closeBtn = document.createElement('span');
              closeBtn.className = 'close-tab-btn';
              closeBtn.innerHTML = '&times;';
              closeBtn.title = 'Fechar aba';
              tab.appendChild(closeBtn);
          }

          if (blockId === activeTabSeparatorId) {
              tab.classList.add('active');
          }

          tabsContainer.insertBefore(tab, addButton);
      });

      filterBlocksByTab();
  }

  const tabsContainer = document.getElementById('workspace-tabs');
  tabsContainer.addEventListener('click', e => {
      const tabItem = e.target.closest('.tab-item');
      if (!tabItem) return;

      const blockId = +tabItem.dataset.tabId;
      const data = blockDataMap.get(blockId);
      if (!data) return;

      if (e.target.classList.contains('close-tab-btn')) {
          e.stopPropagation();

          const blockEl = blockList.find(b => +b.dataset.id === blockId);
          if (!blockEl) return;

          const startIndex = blockList.indexOf(blockEl);

          let previousSeparator = null;
          for (let i = startIndex - 1; i >= 0; i--) {
              const prevData = blockDataMap.get(+blockList[i].dataset.id);
              if (prevData && prevData.type === 'TabSeparator') {
                  previousSeparator = blockList[i];
                  break;
              }
          }

          const nextSeparator = blockList.find((b, index) =>
              index > startIndex && blockDataMap.get(+b.dataset.id)?.type === 'TabSeparator'
          );
          const endIndex = nextSeparator ? blockList.indexOf(nextSeparator) : blockList.length;

          const blocksInTab = blockList.slice(startIndex + 1, endIndex);

          if (blocksInTab.length > 0) {
              if (!confirm(`A aba "${data.config.name}" contém ${blocksInTab.length} bloco(s). Deseja realmente excluí-la e todo o seu conteúdo?`)) {
                  return;
              }
          }

          saveStateForUndo();

          const blocksToDelete = [blockEl, ...blocksInTab];
          const startIndexToDelete = blockList.indexOf(blockEl);
          const deleteCount = blocksToDelete.length;

          if (startIndexToDelete > -1) {
              blockList.splice(startIndexToDelete, deleteCount);
          }

          blocksToDelete.forEach(b => {
              const id = +b.dataset.id;
              blockDataMap.delete(id);
              if (b && b.parentNode) b.remove();
          });

          const execIndex = executionOrderIds.indexOf(blockId);
          if (execIndex > -1) {
              executionOrderIds.splice(execIndex, 1);
          }

          auxiliary.innerHTML = '<p class="auxiliary-placeholder">Inspetor de Propriedades</p>';

          const newActiveId = previousSeparator
              ? +previousSeparator.dataset.id
              : (blockList.length > 0 ? +blockList[0].dataset.id : null);


          if (newActiveId) {
              switchTab(newActiveId);
          } else {
              addBlock('TabSeparator', { name: 'Principal' });
          }

          updateBlockOrder();
          return;
      }

      if (blockId === activeTabSeparatorId) {
          if (tabItem.querySelector('input')) return;

          const tabNameSpan = tabItem.querySelector('span:not(.close-tab-btn):not(.tab-exec-order)');
          if (!tabNameSpan) return;

          const originalName = tabNameSpan.textContent;

          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'tab-edit-input';
          input.value = originalName;

          const finishEditing = () => {
              const newName = input.value.trim();
              if (newName && newName !== originalName) {
                  data.config.name = newName;
                  isWorkspaceDirty = true;
              }
              renderTabs();
          };

          input.addEventListener('blur', () => {
              setTimeout(finishEditing, 0);
          });

          input.addEventListener('keydown', e => {
              if (e.key === 'Enter') input.blur();
              else if (e.key === 'Escape') {
                  input.value = originalName;
                  input.blur();
              }
          });

          tabNameSpan.textContent = '';
          tabNameSpan.appendChild(input);
          input.style.width = (input.value.length + 3) + 'ch';
          input.focus();
          input.select();
      } else {
          switchTab(blockId);
      }
  });

  function switchTab(separatorId) {
      deselectAll();
      activeTabSeparatorId = separatorId;
      auxiliary.innerHTML = '<p class="auxiliary-placeholder">Inspetor de Propriedades</p>';
      renderTabs();
  }

  function filterBlocksByTab() {
    if (activeTabSeparatorId === null) return;

    const separatorIndices = blockList
      .map((b, i) => blockDataMap.get(+b.dataset.id)?.type === 'TabSeparator' ? i : -1)
      .filter(i => i !== -1);

    const startIndex = blockList.findIndex(b => +b.dataset.id === activeTabSeparatorId);
    if (startIndex === -1) return;

    const nextSeparatorIndex = separatorIndices.find(i => i > startIndex);
    const endIndex = nextSeparatorIndex !== undefined ? nextSeparatorIndex : blockList.length;

    blockList.forEach((block, i) => {
      const data = blockDataMap.get(+block.dataset.id);
      if (data.type === 'TabSeparator') {
        block.style.display = 'none';
        return;
      }
      if (i > startIndex && i < endIndex) block.classList.remove('hidden-by-tab');
      else block.classList.add('hidden-by-tab');
    });

    updateScrollbar();
  }

  function renderTabReorderUI() {
    if (!executionOrderIds || executionOrderIds.length === 0) {
      executionOrderIds = getVisualTabOrderIds();
    }

    const listHtml = executionOrderIds.map(tabId => {
      const data = blockDataMap.get(tabId);
      if (!data) return '';

      const tabName = data.config.name;
      return `<li class="reorder-list-item" draggable="true" data-tab-id="${tabId}">${tabName}</li>`;
    }).join('');
    
    auxiliary.innerHTML = `
      <h3>Ordenar Abas de Execução</h3>
      <p style="font-size: 0.9em; color: #666;">Arraste e solte as abas para definir a ordem em que seus blocos serão executados.</p>
      <ul id="tab-order-list" class="reorder-list">${listHtml}</ul>
    `;

    setupTabReorderDragDrop();
  }

  function setupTabReorderDragDrop() {
    const list = document.getElementById('tab-order-list');
    if (!list) return;

    let draggedItem = null;

    list.addEventListener('dragstart', e => {
      draggedItem = e.target;
      setTimeout(() => e.target.classList.add('dragging'), 0);
    });

    list.addEventListener('dragend', e => {
      e.target.classList.remove('dragging');
      applyNewTabOrder();
    });

    list.addEventListener('dragover', e => {
      e.preventDefault();
      const afterElement = getDragAfterElement(list, e.clientY);
      if (afterElement == null) {
        list.appendChild(draggedItem);
      } else {
        list.insertBefore(draggedItem, afterElement);
      }
    });
  }
  
  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function applyNewTabOrder() {
    saveStateForUndo();
    const newOrderIds = Array.from(document.querySelectorAll('#tab-order-list li')).map(li => +li.dataset.tabId);
    executionOrderIds = newOrderIds;
    renderTabs();
    isWorkspaceDirty = true;
  }

  /* ==========================================================================
   * Sistema de Desfazer/Refazer e Área de Transferência
     ========================================================================== */
  let clipboardData = null;
  const undoStack = [];
  const redoStack = [];
  const maxUndoStackSize = 15;  

  function saveStateForUndo() {
    const snapshot = blockList.map(b => {
      const id   = +b.dataset.id;
      const d    = blockDataMap.get(id);
      return {
        type: d.type,
        config: deepClone(d.config)
      };
    });
    undoStack.push(snapshot);
    if (undoStack.length > maxUndoStackSize) undoStack.shift();
    redoStack.length = 0;
    isWorkspaceDirty = true;
  }

  function restoreState(snapshot) {
    const current = blockList.map(b => {
      const id = +b.dataset.id;
      const d = blockDataMap.get(id);
      return { type: d.type, config: deepClone(d.config) };
    });
    redoStack.push(current);

    inner.innerHTML = "";
    blockList.length = 0;
    blockDataMap.clear();

    snapshot.forEach(item => addBlock(item.type, deepClone(item.config)));
    deselectAll();
    auxiliary.innerHTML = '<p class="auxiliary-placeholder">Inspetor de Propriedades</p>';
  }

  function copySelectedBlocks() {
    const sel = expandCollapsedSelection(getSelectedBlocks());
    if (!sel.length) return;
    clipboardData = sel.map(b => {
      const id = +b.dataset.id;
      const d  = blockDataMap.get(id);
      return {
        type: d.type,
        config: deepClone(d.config)
      };
    });
  }

  function pasteBlocks() {
    if (!clipboardData) return;
    saveStateForUndo();
    clipboardData.forEach(item => {
      addBlock(item.type, deepClone(item.config));
    });
  }

  function cutSelectedBlocks() {
    const sel = expandCollapsedSelection(getSelectedBlocks());
    if (!sel.length) return;
    saveStateForUndo();
    copySelectedBlocks();
    sel.forEach(b => {
      const id = +b.dataset.id;
      blockDataMap.delete(id);
      blockList.splice(blockList.indexOf(b), 1);
      b.remove();
    });
    auxiliary.innerHTML = '<p class="auxiliary-placeholder">Inspetor de Propriedades</p>';
    updateBlockOrder();
    updateScrollbar();
  }

  function duplicateSelectedBlocks() {
    const sel = expandCollapsedSelection(getSelectedBlocks());
    if (!sel.length) return;
    saveStateForUndo();
    sel.forEach(b => {
      const id0 = +b.dataset.id;
      const d0 = blockDataMap.get(id0);
      addBlock(d0.type, deepClone(d0.config));
    });
  }

  function selectAllBlocks() {
    deselectAll();
    blockList.forEach(b => b.classList.add("selected"));
  }

  /* ==========================================================================
   * Tratamento de Arquivos JSON (Importação/Exportação)
     ========================================================================== */
  function generateJSON() {
    const finalScript = [];
    const orderedTabIds = executionOrderIds; 
    const tabChunks = getTabChunksMap();
    
    orderedTabIds.forEach(id => {
      const chunk = tabChunks.get(id);
      if (chunk) {
        const chunkData = chunk.map(b => {
            const blockId = +b.dataset.id;
            const data = blockDataMap.get(blockId);
            return { type: data.type, config: deepClone(data.config) };
        });
        finalScript.push(...chunkData);
      }
    });

    return JSON.stringify(finalScript, null, 2);
  }

  function getVisualTabOrderIds() {
      return blockList
          .filter(b => blockDataMap.get(+b.dataset.id)?.type === 'TabSeparator')
          .map(b => +b.dataset.id);
  }

  function loadFromJSON(jsonString) {
      let blocksData;
      try {
          blocksData = JSON.parse(jsonString);
          if (!Array.isArray(blocksData)) {
              if (blocksData.version === "2.0" && Array.isArray(blocksData.workspaces)) {
                  blocksData = blocksData.workspaces.flatMap((ws, index) => {
                      const separator = { type: 'TabSeparator', config: { name: ws.name } };
                      return index === 0 ? ws.blocks : [separator, ...ws.blocks];
                  });
              } else {
                  throw new Error("Formato de JSON inválido");
              }
          }
      } catch (error) {
          console.error("Erro ao carregar JSON:", error);
          alert("Erro: Arquivo JSON inválido ou corrompido.");
          return;
      }

      inner.innerHTML = "";
      blockList.length = 0;
      blockDataMap.clear();
      undoStack.length = 0;
      redoStack.length = 0;
      isWorkspaceDirty = false;
      auxiliary.innerHTML = '<p class="auxiliary-placeholder">Inspetor de Propriedades</p>';

      if (blocksData.length === 0 || blocksData[0].type !== 'TabSeparator') {
          blocksData.unshift({ type: 'TabSeparator', config: { name: 'Principal' } });
      }

      blocksData.forEach(item => {
          if (!item || !blockSchemas[item.type]) {
              console.warn(`Bloco de tipo desconhecido ignorado:`, item?.type);
              return;
          }

          const block = document.createElement("div");
          block.classList.add("block");

          block.innerHTML = `
            <i data-lucide="${lucideMap[item.type] || 'box'}" style="margin-right: 6px;"></i>
            <span class="block-name">${item.type}</span>
          `;

          const id = blockIdCounter++;
          block.dataset.id = id;
          const schema = blockSchemas[item.type] || [];
          const cfg = {};
          schema.forEach(f => {
              cfg[f.name] = (item.config && f.name in item.config) 
                              ? deepClone(item.config[f.name]) 
                              : deepClone(f.default);
          });
          for (const key in item.config) {
              if (!(key in cfg)) { cfg[key] = deepClone(item.config[key]); }
          }

          blockDataMap.set(id, { type: item.type, config: cfg });
          blockList.push(block);
          setupBlockEvents(block);
      });

      blockList.forEach(block => {
          inner.appendChild(block);
      });
      lucide.createIcons();
      updateBlockOrder();

      renderTabs();
      const firstSeparatorId = blockList.length > 0 ? +blockList[0].dataset.id : null;
      if (firstSeparatorId) {
          switchTab(firstSeparatorId);
      }
      executionOrderIds = getVisualTabOrderIds();
      updateScrollbar();
  }

  async function handleNew() {
    if (isWorkspaceDirty) {
      const confirmed = await showConfirm(
        "Você tem alterações não salvas. Deseja criar um novo projeto e descartá-las?",
        {
          title: "Alterações Não Salvas",
          ok: "Descartar Alterações",
          danger: true
        }
      );
      if (!confirmed) {
        return;
      }
    }
    loadFromJSON('[]');
    executionOrderIds = getVisualTabOrderIds();
  }

  async function handleOpen() {
    if (isWorkspaceDirty) {
      const confirmed = await showConfirm(
        "Você tem alterações não salvas. Deseja abrir outro arquivo e descartá-las?",
        { title: "Alterações Não Salvas", ok: "Descartar e Abrir", danger: true }
      );
      if (!confirmed) {
        return;
      }
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target.result;
        loadFromJSON(content);
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function handleSave() {
    const jsonToSave = generateJSON();
    
    const blob = new Blob([jsonToSave], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "projeto_nocode.json";
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    isWorkspaceDirty = false;
    showAlert("Projeto salvo e baixado com sucesso!", "Salvar");
  }

  /* ==========================================================================
   * UI e Interatividade (Scroll, Drag & Drop, Seleção)
     ========================================================================== */
  function updateScrollbar() {
    const contentH = inner.scrollHeight;
    const viewH    = inner.clientHeight;
    if (contentH <= viewH) {
      thumb.style.height = viewH + "px";
      thumb.style.top    = "0px";
      return;
    }
    const scrollY  = inner.scrollTop;
    const ratio    = viewH / contentH;
    const thumbH   = Math.max(ratio * viewH, 20);
    const thumbTop = (scrollY / (contentH - viewH)) * (viewH - thumbH);
    thumb.style.height = thumbH + "px";
    thumb.style.top    = thumbTop + "px";
  }

  let isThumbDragging = false;
  let dragStartY = 0;
  let initialScrollTop = 0;

  thumb.addEventListener("mousedown", e => {
    isThumbDragging = true;
    dragStartY = e.clientY;
    initialScrollTop = inner.scrollTop;
    document.body.style.userSelect = "none";
    e.preventDefault();
  });

  document.addEventListener("mousemove", e => {
    if (!isThumbDragging) return;
    const deltaY = e.clientY - dragStartY;
    const contentH = inner.scrollHeight;
    const viewH = inner.clientHeight;
    const scrollRatio = contentH / viewH;
    inner.scrollTop = initialScrollTop + deltaY * scrollRatio;
  });

  document.addEventListener("mouseup", () => {
    isThumbDragging = false;
    document.body.style.userSelect = "";
  });

  inner.addEventListener("scroll", updateScrollbar);

  const placeholder = document.createElement('div');
  placeholder.className = 'block-placeholder';
  let lastTargetBlock = null;

  let lastDragOverTime = 0;
  const throttleDelay = 16; 

  inner.addEventListener('dragover', e => {
    e.preventDefault();
    const now = performance.now();
    if (now - lastDragOverTime < throttleDelay) return;
    lastDragOverTime = now;

    const dragging = inner.querySelector('.block.dragging');
    if (!dragging) return;

    const mouseY = e.clientY;
    const blocks = Array.from(inner.querySelectorAll('.block:not(.dragging)'));
    let found = false;

    for (let b of blocks) {
      const rect = b.getBoundingClientRect();
      const top = rect.top + 6;
      const bottom = rect.bottom - 6;
      const children = Array.from(inner.children).filter(el => !el.classList.contains('dragging'));

      if (mouseY >= top && mouseY <= bottom) {
        const targetIdx = children.indexOf(b) + 1;
        if (children.indexOf(placeholder) !== targetIdx) {
          placeholder.classList.add('moving');
          inner.insertBefore(placeholder, b.nextSibling);
        }
        lastTargetBlock = b;
        found = true;
        break;
      } else if (mouseY < top) {
        const targetIdx = children.indexOf(b);
        if (children.indexOf(placeholder) !== targetIdx) {
          placeholder.classList.add('moving');
          inner.insertBefore(placeholder, b);
        }
        lastTargetBlock = b;
        found = true;
        break;
      }
    }

    if (!found && lastTargetBlock && lastTargetBlock.isConnected) {
      const children = Array.from(inner.children).filter(el => !el.classList.contains('dragging'));
      const targetIdx = children.indexOf(lastTargetBlock) + 1;
      if (children.indexOf(placeholder) !== targetIdx) {
        inner.insertBefore(placeholder, lastTargetBlock.nextSibling);
      }
    }
  });

  inner.addEventListener('dragleave', e => {
    if (!e.relatedTarget || !inner.contains(e.relatedTarget)) {
      placeholder.remove();
      placeholder.classList.remove('moving');
      lastTargetBlock = null;
    }
  });

  inner.addEventListener('drop', e => {
    e.preventDefault();

    const draggings = Array.from(inner.querySelectorAll('.block.dragging'));
    if (draggings.length && placeholder.parentNode === inner) {
      draggings.forEach(d => {
        inner.insertBefore(d, placeholder);
      });
    }

    placeholder.remove();
    placeholder.classList.remove('moving');
    lastTargetBlock = null;

    document.querySelectorAll(".block.dragging")
      .forEach(b => b.classList.remove("dragging"));

    blockList.length = 0;
    document.querySelectorAll(".workspace-inner .block").forEach(b => {
      blockList.push(b);
    });

    updateBlockOrder();
    updateScrollbar();
    saveStateForUndo();
    isWorkspaceDirty = true;
  });

  const affectsMap = {
    fixo: ['fixo_ms'],
    aleatorio: ['aleatorio_inicio', 'aleatorio_fim'],
    variavel: ['variavel_name'],
    horario: ['hora_lim_delay'],
    processando: []
  };
  
  function updateUI(selectedValue) {
    const allFields = ['fixo_ms', 'aleatorio_inicio', 'aleatorio_fim', 'variavel_name'];

    allFields.forEach(field => {
      const el = document.getElementById(field);
      if (!el) return;
      if (affectsMap[selectedValue].includes(field)) {
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
      }
    });
  }

  let isSelecting = false;
  let selectionRect = null;
  let startX, startY;

  function createSelectionRectangle() {
    selectionRect = document.createElement("div");
    selectionRect.classList.add("selection-rectangle");
    selectionRect.style.left = startX + "px";
    selectionRect.style.top = startY + "px";
    selectionRect.style.width = "0px";
    selectionRect.style.height = "0px";
    inner.appendChild(selectionRect);
  }

  function updateSelectionRectangle(x, y) {
    const left = Math.min(x, startX);
    const top = Math.min(y, startY);
    const width = Math.abs(x - startX);
    const height = Math.abs(y - startY);
    Object.assign(selectionRect.style, {
      left: left + "px",
      top: top + "px",
      width: width + "px",
      height: height + "px"
    });
  }

  function rectsIntersectCustom(selRect, block) {
    const sel = {
      left: parseFloat(selRect.style.left),
      top: parseFloat(selRect.style.top),
      right: parseFloat(selRect.style.left) + parseFloat(selRect.style.width),
      bottom: parseFloat(selRect.style.top) + parseFloat(selRect.style.height),
    };
    const rect = block.getBoundingClientRect();
    const containerRect = inner.getBoundingClientRect();
    const blockBox = {
      left: rect.left - containerRect.left + inner.scrollLeft,
      top: rect.top - containerRect.top + inner.scrollTop,
      right: rect.right - containerRect.left + inner.scrollLeft,
      bottom: rect.bottom - containerRect.top + inner.scrollTop,
    };
    return !(
      blockBox.left > sel.right ||
      blockBox.right < sel.left ||
      blockBox.top > sel.bottom ||
      blockBox.bottom < sel.top
    );
  }

  workspace.addEventListener("mousedown", e => {
    if (e.target.classList.contains("scrollbar-thumb")) return;
    if (e.target.closest(".block")) return;
    isSelecting = true;
    const rect = inner.getBoundingClientRect();
    startX = e.clientX - rect.left + inner.scrollLeft;
    startY = e.clientY - rect.top + inner.scrollTop;
    createSelectionRectangle();
    deselectAll();
  });

  document.addEventListener("mousemove", e => {
    if (!isSelecting) return;
    const rect = inner.getBoundingClientRect();
    const currX = e.clientX - rect.left + inner.scrollLeft;
    const currY = e.clientY - rect.top + inner.scrollTop;
    updateSelectionRectangle(currX, currY);
    const intersected = [];
    blockList.forEach(b => {
      if (rectsIntersectCustom(selectionRect, b)) {
        intersected.push(b);
      }
    });

    const expanded = expandCollapsedSelection(intersected);
    deselectAll();
    expanded.forEach(b => b.classList.add("selected"));
  });

  document.addEventListener("mouseup", () => {
    if (!isSelecting) return;
    isSelecting = false;
    selectionRect?.remove();
    selectionRect = null;
  });

  document.querySelectorAll(".sidebar li").forEach(item => {
    item.addEventListener("click", () => addBlock(item.dataset.type));
  });

  function addBlock(type, config) {
    const block = document.createElement("div");
    block.classList.add("block");

    block.innerHTML = `
      <i data-lucide="${lucideMap[type] || 'box'}" style="margin-right: 6px;"></i>
      <span class="block-name">${type}</span>
    `;
    const id = blockIdCounter++;
    block.dataset.id = id;
    
    const schema = blockSchemas[type] || [];
    const cfg = {};
    schema.forEach(f => {
      cfg[f.name] = (config && f.name in config)
                      ? deepClone(config[f.name])
                      : deepClone(f.default);
      for (const key in config) {
        if (!(key in cfg)) {
          cfg[key] = deepClone(config[key]);
        }
      }
    });

    blockDataMap.set(id, { type, config: cfg });

    const sel = getSelectedBlocks();
    if (sel.length > 0) {
      const indices  = sel.map(b => blockList.indexOf(b)).sort((a, b) => a - b);
      const insertPos = indices[indices.length - 1] + 1;
      blockList.splice(insertPos, 0, block);
      inner.insertBefore(block, inner.children[insertPos] || null);
    } else {
      const separatorIndices = blockList
          .map((b, index) => (blockDataMap.get(+b.dataset.id)?.type === 'TabSeparator' ? index : -1))
          .filter(index => index !== -1);

      const activeSeparatorIndex = blockList.findIndex(b => +b.dataset.id === activeTabSeparatorId);
      const nextSeparatorIndex = separatorIndices.find(i => i > activeSeparatorIndex);

      if (nextSeparatorIndex !== undefined) {
          const insertIndex = nextSeparatorIndex;
          const referenceNode = blockList[insertIndex];
          blockList.splice(insertIndex, 0, block);
          inner.insertBefore(block, referenceNode);
      } else {
          blockList.push(block);
          inner.appendChild(block);
      }
    }

    setupBlockEvents(block);
    updateBlockOrder();
    updateScrollbar();
    lucide.createIcons();
    isWorkspaceDirty = true;
    
    if (type === 'TabSeparator') {
        const id = +block.dataset.id;
        executionOrderIds.push(id);
        setTimeout(() => switchTab(id), 0);
    } else {
      filterBlocksByTab();
    }
  }

  function deepClone(val) {
    return typeof val === "object" && val !== null
      ? JSON.parse(JSON.stringify(val))
      : val;
  }

 function setupBlockEvents(block) {
    block.setAttribute("draggable", "true");

    block.addEventListener("dragstart", () => {
      let selected = getSelectedBlocks();
      selected = expandCollapsedSelection(selected);

      if (!block.classList.contains("selected")) {
        selected = [block];
        selected = expandCollapsedSelection(selected);
      }

      selected.forEach(b => b.classList.add("dragging"));
    });

    block.addEventListener("dragend", () => {
      document.querySelectorAll(".block.dragging")
        .forEach(b => b.classList.remove("dragging"));
    });

    block.addEventListener("click", e => {
      if (e.ctrlKey) {
        block.classList.toggle("selected");
        const expanded = expandCollapsedSelection(getSelectedBlocks());
        expanded.forEach(b => b.classList.add("selected"));
      } else if (e.shiftKey) {
        const selected = getSelectedBlocks();
        if (selected.length > 0) {
          const firstIndex = blockList.indexOf(selected[0]);
          const currentIndex = blockList.indexOf(block);
          const [start, end] = [firstIndex, currentIndex].sort((a, b) => a - b);
          deselectAll();
          for (let i = start; i <= end; i++) {
            blockList[i].classList.add("selected");
          }
        } else {
          deselectAll();
          block.classList.add("selected");
        }
        const expanded = expandCollapsedSelection(getSelectedBlocks());
        expanded.forEach(b => b.classList.add("selected"));
      } else {
        deselectAll();
        block.classList.add("selected");
        const expanded = expandCollapsedSelection(getSelectedBlocks());
        expanded.forEach(b => b.classList.add("selected"));
      }
    });

    block.addEventListener("dblclick", () => {
      if (block.classList.contains("active")) {
        block.classList.remove("active");
        auxiliary.innerHTML = '<p class="auxiliary-placeholder">Inspetor de Propriedades</p>';
        return;
      }

      document.querySelectorAll(".block.active")
        .forEach(b => b.classList.remove("active"));
      block.classList.add("active");

      const id = +block.dataset.id;
      const data = blockDataMap.get(id);

      const schemaOriginal = blockSchemas[data.type] || [];
      const schema = schemaOriginal.map(field => {
        const copia = { ...field };
        if (field.type === 'group' && Array.isArray(field.fields)) {
          copia.fields = field.fields.map(inner => ({ ...inner }));
        }
        return copia;
      });

      if (data.type === 'SQLDDL') {
          const config = data.config;
          const tabelasDisponiveis = config.tabelas_disponiveis || [];
          schema.forEach(f => {
              if (f.name === 'tabela_para_alterar' || f.name === 'tabela_para_deletar') {
                  f.options = [...tabelasDisponiveis];
              }
          });
      }
      
      const tiposSQL = ['SQLInsert', 'SQLUpdate', 'SQLDelete', 'SQLSelect', 'SQLDDL'];

      if (tiposSQL.includes(data.type)) {
        const config = data.config;
        const tabela = config.tabela;
        const colunas = config.colunas_por_tabela?.[tabela] || [];

        schema.forEach(f => {
          if (f.name === 'tabela' && config.tabelas_disponiveis) {
            f.options = [...config.tabelas_disponiveis];
          }

          if (['dados', 'dados2', 'condicoes', 'campos', 'filtros'].includes(f.name)) {
            f.fields.forEach(inner => {
              if (inner.name === 'coluna') {
                inner.options = [...colunas];
              }
            });
          }
        });
      }

      renderField(auxiliary, data, schema);

      data.__blockId = id;

      let html = `
        <h3> ${data.type}</h3>
        <p style="margin-top: -8px; font-size: 0.85em; color: #666;">ID: ${id}</p>
        <div id="block-config-form">
      `;

      if (tiposSQL.includes(data.type)) {
        const selectTabela = document.querySelector(`[name="tabela-${id}"]`);
        if (selectTabela) {
            selectTabela.addEventListener('change', (e) => {
              const novaTabela = e.target.value;
              const novasColunas = data.config.colunas_por_tabela?.[novaTabela] || [];
              data.config.tabela = novaTabela;

              document.querySelectorAll(`[name^="${data.type === 'SQLInsert' ? 'dados' : data.type === 'SQLUpdate' ? 'campos' : 'condicoes'}["] select`).forEach(sel => {
                const nomeCampo = sel.name;
                if (nomeCampo.includes('.coluna')) {
                  sel.innerHTML = novasColunas.map(col => `<option value="${col}">${col}</option>`).join('');
                }
              });

              if (typeof window.renderBlockConfigForm === 'function') {
                window.renderBlockConfigForm(id, data);
              }
            });
          }
      }
      
      let inGeometry = false;

      schema.forEach((f, i) => {
        if (data.type === "GoTo" && f.name === "label") f.options = getAllLabelNames();
        if (data.type === "Delay" && f.name === "variavel_name") f.options = getAllVariableNames();
        if (data.type === "Clipboard" && f.name === "variavel") f.options = getAllVariableNames();
        if (data.type === "Clipboard" && f.name === "variavel2") f.options = getAllVariableNames();
        if (data.type === "If" && f.name === "variavel_nome") f.options = getAllVariableNames();
        if (data.type === "ChamarFuncao" && f.name === "nome") f.options = getAllFunctionNames();
        if (data.type === "SQLSelect" && f.name === "variavel_resultado") f.options = getAllVariableNames();
        if (data.type === "ImageMatch" && f.name === "variavel_x") f.options = getAllVariableNames();
        if (data.type === "ImageMatch" && f.name === "variavel_y") f.options = getAllVariableNames();
        if (data.type === "IfImageMatch" && f.name === "variavel_x") f.options = getAllVariableNames();
        if (data.type === "IfImageMatch" && f.name === "variavel_y") f.options = getAllVariableNames();
        if (data.type === "OCR" && f.name === "nome_variavel") f.options = getAllVariableNames();
        if (data.type === "IfOCR" && f.name === "nome_variavel") f.options = getAllVariableNames();

        const val = data.config[f.name];

        if (f.customLayout === 'geometry') {
          if (!inGeometry) {
            html += `<div class="geometry-grid">`;
            inGeometry = true;
          }
          html += renderField(f, val, data);

          const next = schema[i + 1];
          if (!next || next.customLayout !== 'geometry') {
            html += `</div>`;
            inGeometry = false;
          }
        } else {
          html += renderField(f, val, data);
        }
      });

      html += "</form>";
      auxiliary.innerHTML = html;
      
      const textInputs = auxiliary.querySelectorAll('input[type="text"]');
      textInputs.forEach(input => {
        setupAutocomplete(input);
      });

      document.querySelectorAll('button[id^="add-"]').forEach(button => {
        const match = button.id.match(/^add-(.+)-(\d+)$/);
        if (!match) return;
        
        const groupName = match[1];
        const blockId = parseInt(match[2], 10);
        const fieldSchema = blockSchemas[data.type].find(f => f.name === groupName);
        
        if (fieldSchema && fieldSchema.fields) {
          setupGroupAddButton(groupName, blockId, fieldSchema.fields);
        }
      });

      if (data.type === 'SQLDDL') {
        auxiliary.querySelectorAll('select').forEach(select => {
          select.addEventListener('change', () => {
            const field = select.dataset.field;
            if (!field) return;

            const fieldName = field.split('.')[0];
            const value = select.value;
            const blockId = data.__blockId;
            const bloco = window.blockDataMap.get(blockId);
            if (!bloco) return;

            bloco.config[fieldName] = value;
          });
        });
      }

      window.updateImagePreviewOnly = function (blockId, imagePath) {
        const safePath = imagePath.replace(/\\/g, '/');
        const previewContainer = document.querySelector(`.auxiliary [data-field="imagem_preview"]`);

        if (!previewContainer) {
          console.warn('[updateImagePreviewOnly] Contêiner da imagem preview não encontrado.');
          return;
        }

        const html = `
          <img src="file://${safePath}?cb=${Date.now()}"
              style="max-width:300px; max-height:300px; border:1px solid #ccc; border-radius:4px;" />
        `;

        previewContainer.innerHTML = html;
      };

      document.addEventListener('input', (e) => {
        const input = e.target;
        if (input.tagName === 'INPUT' && input.name && input.name.startsWith('imagem_path-')) {
          const blockId = parseInt(input.name.split('-')[1], 10);
          const newPath = input.value;

          if (typeof window.updateImagePreviewOnly === 'function') {
            window.updateImagePreviewOnly(blockId, newPath);
          }
        }
      });

      window.renderBlockConfigForm = function (blockId, data) {
        const schema = blockSchemas[data.type] || [];
        data.__blockId = blockId;

        let html = `
          <h3>🔧 ${data.type}</h3>
          <form id="block-config-form">
        `;

        schema.forEach(field => {
          const value = data.config?.[field.name];
          html += renderField(field, value, data);
        });

        html += `</form>`;

        const auxiliary = document.querySelector('.auxiliary');
        if (auxiliary) {
          auxiliary.innerHTML = html;
          if (typeof window.bindImagePathField === 'function' && data.type === 'IfImageMatch') {
            window.bindImagePathField(blockId);
          }
          if (typeof window.bindConfigFieldEvents === 'function') {
            window.bindConfigFieldEvents(blockId);
          }
        }
      };

      function salvarCamposGroup(blockId, groupName) {
        const container = document.getElementById(`group-${groupName}-${blockId}`);
        if (!container) return;

        const items = container.querySelectorAll(`[class^="group-item-"]`);
        const resultado = [];

        items.forEach(item => {
          const inputs = item.querySelectorAll('input, select');
          const obj = {};
          inputs.forEach(input => {
            const fieldName = input.dataset.field?.split('.').pop();
            if (fieldName) {
              obj[fieldName] = input.value;
            }
          });
          resultado.push(obj);
        });

        const data = blockDataMap.get(blockId);
        if (data) {
          data.config[groupName] = resultado;
        }
      }

      function setupGroupAddButton(groupName, blockId, fields) {
        const containerId = `group-${groupName}-${blockId}`;
        const addButtonId = `add-${groupName}-${blockId}`;
        const itemClass = `group-item-${blockId}`;

        const container = document.getElementById(containerId);
        const button = document.getElementById(addButtonId);
        if (!container || !button) return;

        let index = container.querySelectorAll(`.${itemClass}`).length;

        button.addEventListener('click', () => {
          const wrapper = document.createElement('div');
          wrapper.className = itemClass;
          wrapper.dataset.index = index;
          wrapper.style.cssText = 'display: flex; gap: 12px; margin-bottom: 6px;';

          wrapper.innerHTML = fields.map(innerField => {
            const nameAttr = `${groupName}[${index}].${innerField.name}`;
            const fieldAttr = `data-field="${nameAttr}"`;

            let inputHTML = '';

            if (innerField.type === 'select') {
              let options = innerField.options || [];
              const isColunaField = innerField.name === 'coluna';

              if (['SQLInsert', 'SQLUpdate', 'SQLDelete', 'SQLSelect'].includes(data.type) && isColunaField) {
                const tabelaAtual = data.config?.tabela;
                options = data.config?.colunas_por_tabela?.[tabelaAtual] || [];
              }

              const optionHTML = (isColunaField ? `<option value="">(Selecione)</option>` : '') + options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
              inputHTML = `<select name="${nameAttr}" ${fieldAttr}>${optionHTML}</select>`;
            } else {
              inputHTML = `<input type="${innerField.type || 'text'}" name="${nameAttr}" ${fieldAttr}>`;
            }

            return `
              <div class="inline-field" style="flex: 1;">
                <label>${innerField.label}</label>
                ${inputHTML}
              </div>
            `;
          }).join('');

          container.appendChild(wrapper);
          index++;
        });
      }

      const configForm = auxiliary.querySelector('#block-config-form');
      if (configForm) {
        const blockId = data.__blockId;
        const formSchema = blockSchemas[data.type] || [];

        applyShowIfLogic(configForm, formSchema, data.config);

        const textInputs = configForm.querySelectorAll('input[type="text"]');
        textInputs.forEach(input => {
            setupAutocomplete(input);
        });

        configForm.addEventListener('input', e => {
          const target = e.target;
          const blockId = data.__blockId;
          const blockData = window.blockDataMap.get(blockId);

          if (blockData && blockData.type === 'Variable') {
              const fieldId = target.dataset.field;
              if (fieldId && fieldId.startsWith('variavel[') && fieldId.endsWith('.nome')) {
                  const originalValue = target.value;
                  const sanitizedValue = sanitizePythonVarName(originalValue);

                  if (originalValue !== sanitizedValue) {
                      const cursorPosition = target.selectionStart;
                      target.value = sanitizedValue;
                      target.setSelectionRange(sanitizedValue.length, sanitizedValue.length);
                  }
              }
          }

          const fieldName = target.dataset.field;
          if (fieldName) {
            let val;
            const fld = formSchema.find(f => f.name === fieldName);
            if (fld) {
              if (fld.type === "checkbox") val = target.checked;
              else if (fld.type === "number") val = Number(target.value);
              else val = target.value;
              data.config[fieldName] = val;
            }
          }

          const match = target.name.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
          if (match) {
            const [_, groupName] = match;
            salvarCamposGroup(blockId, groupName);
          }

          if (e.target.name === `cor_hex-${blockId}` || e.target.dataset.field === 'cor_hex') {
            const preview = e.target.nextElementSibling;
            const hex = e.target.value.trim().toUpperCase();
            if (preview && /^#[0-9A-F]{6}$/i.test(hex)) {
              preview.style.backgroundColor = hex;
            }
          }
        });

        configForm.addEventListener('change', e => {
          const target = e.target;
          const fieldName = target.dataset.field;
          const targetName = target.name.split('-')[0];
          if (!fieldName) return;
        
          if (fieldName === 'tabela' || targetName.startsWith('tabela_para')) {
            const novaTabela = target.value;
            const colunas = data.config.colunas_por_tabela?.[novaTabela] || [];
            
            configForm.querySelectorAll(`select[name$=".coluna"]`).forEach(select => {
              const valorAtual = select.value;
              const optionsHtml = `<option value="">(Selecione)</option>` + colunas.map(c => `<option value="${c}">${c}</option>`).join('');
              select.innerHTML = optionsHtml;
              if (colunas.includes(valorAtual)) {
                select.value = valorAtual;
              } else {
                select.value = '';
              }
              select.dispatchEvent(new Event('input', { bubbles: true }));
            });
          }
          
          applyShowIfLogic(configForm, formSchema, data.config);
        
          if (data.type === 'SQLDDL') {
            if (targetName === 'acao') {
                const acao = data.config.acao;
                if (acao === 'Deletar Tabela' || acao === 'Alterar Tabela') {
                    const tabelas = data.config.tabelas_disponiveis || [];
                    const selectsTabela = configForm.querySelectorAll('[data-field="tabela_para_deletar"], [data-field="tabela_para_alterar"]');
                    selectsTabela.forEach(select => {
                        select.innerHTML = tabelas.map(t => `<option value="${t}">${t}</option>`).join('');
                        select.value = data.config[select.dataset.field];
                    });
                }
            }
          }
        });
      }

      window.updateBlockConfig = function (blockId, partialConfig) {
        const data = blockDataMap.get(blockId);
        if (!data || !data.config) {
          return;
        }
        Object.assign(data.config, partialConfig);
      };

      if (data.type === "Python" || data.type === "SQL") {
        setTimeout(() => {
          const editorContainer = document.getElementById(`codigo-${data.__blockId}`);
          if (editorContainer) {
            const mode = data.type === "SQL" ? "text/x-sql" : "python";
            createCodeEditor({
              parent: editorContainer,
              value: data.config.codigo || '',
              mode: mode,
              onChange: (text) => {
                data.config.codigo = text;
              }
            });
          }
        }, 0);
      }
      
      const buttons = auxiliary.querySelectorAll('.field button');
      buttons.forEach(btn => {
        const fieldName = btn.id.split('-')[0];
        const blockId = btn.id.split('-')[1];

        const schemaFields = blockSchemas[data.type];
        const field = schemaFields.find(f => f.name === fieldName);
        if (!field || typeof field.handler !== 'function') return;

        btn.onclick = () => {
          field.handler(blockId, (newVals) => {
            Object.assign(data.config, newVals);
            Object.entries(newVals).forEach(([key, val]) => {
              const input = auxiliary.querySelector(`[name="${key}"]`);
              if (!input) return;
              if (input.type === 'checkbox') input.checked = !!val;
              else input.value = val;
            });
          });
        };
      });

      buttons.forEach(btn => {
        const fieldName = btn.id.split('-')[0];
        
        if (fieldName.startsWith('add')) return;

        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();

          const btnText = btn.textContent.trim() || btn.value || "esta ação";

          if (fieldName === 'btn_testar_pixel' && data.type === "If") {
              const tipoCondicao = data.config.tipo_condicao;
              
              if (tipoCondicao === 'Se variável >/< = valor' || tipoCondicao === 'Se variável conter texto') {
                  const varName = data.config.variavel_nome;
                  
                  if (!varName) {
                      showAlert("Por favor, selecione uma variável na lista antes de testar.", "Aviso");
                      return;
                  }

                  let varValue = null;
                  let varFound = false;
                  
                  window.blockDataMap.forEach((bloco) => {
                      if (bloco.type === 'Variable' && Array.isArray(bloco.config.variavel)) {
                          const variavel = bloco.config.variavel.find(v => v.nome === varName);
                          if (variavel) {
                              varValue = variavel.valor || "";
                              varFound = true;
                          }
                      }
                  });

                  if (!varFound) {
                      showAlert(`A variável <b>${varName}</b> não foi encontrada em nenhum bloco do tipo "Variable" neste projeto.<br><br>Certifique-se de criá-la antes de testar.`, "Variável Não Encontrada");
                      return;
                  }

                  let isTrue = false;
                  let targetValue = tipoCondicao === 'Se variável >/< = valor' ? (data.config.valor || "") : (data.config.texto4 || "");
                  
                  let val1 = isNaN(Number(varValue)) ? String(varValue).toLowerCase() : Number(varValue);
                  let val2 = isNaN(Number(targetValue)) ? String(targetValue).toLowerCase() : Number(targetValue);

                  if (tipoCondicao === 'Se variável >/< = valor') {
                      const op = data.config.operador;
                      if (op === '=') isTrue = (val1 == val2);
                      else if (op === '!=') isTrue = (val1 != val2);
                      else if (op === '>') isTrue = (val1 > val2);
                      else if (op === '<') isTrue = (val1 < val2);
                      else if (op === '>=') isTrue = (val1 >= val2);
                      else if (op === '<=') isTrue = (val1 <= val2);
                  } else if (tipoCondicao === 'Se variável conter texto') {
                      isTrue = String(varValue).toLowerCase().includes(String(targetValue).toLowerCase());
                  }

                  if (data.config.modo === 'Negar') {
                      isTrue = !isTrue;
                  }

                  const resultColor = isTrue ? "#4CAF50" : "#F44336";
                  const resultText = isTrue ? "VERDADEIRO" : "FALSO";

                  showAlert(
                      `Testando a condição: <b>${tipoCondicao}</b><br><br>` +
                      `Variável alvo: <b>${varName}</b><br>` +
                      `Valor inicial salvo: <b>${varValue}</b><br>` +
                      `Valor de comparação: <b>${targetValue}</b><br><br>` +
                      `O fluxo entraria neste IF? <span style="color: ${resultColor}; font-weight: bold; font-size: 1.1em;">${resultText}</span>`,
                      "Resultado do Teste"
                  );
                  return;
              }
          }

          showAlert(
            `A função de <b>${btnText}</b> exige comunicação com o Sistema Operacional (arquivos locais, janelas, pixels, scripts, etc.) e está disponível apenas no aplicativo nativo Desktop (Windows/Linux).<br><br>Esta é uma limitação de segurança exclusiva da versão Web Demo.`, 
            "Recurso Indisponível na Web"
          );
        };
      });

      const form = auxiliary.querySelector("#block-config-form");
      const orderList = form.querySelector(`#order-list-${data.__blockId}`);

      if (orderList) {
        let draggedItem = null;

        orderList.querySelectorAll('li').forEach(li => {
          li.setAttribute('draggable', 'true');

          li.addEventListener('dragstart', (e) => {
            draggedItem = li;
            li.classList.add('dragging');
          });

          li.addEventListener('dragend', () => {
            draggedItem?.classList.remove('dragging');
            draggedItem = null;
          });

          li.addEventListener('dragover', (e) => {
            e.preventDefault();
            const target = e.currentTarget;
            if (draggedItem && target !== draggedItem) {
              const bounding = target.getBoundingClientRect();
              const offset = e.clientY - bounding.top;
              const height = bounding.height / 2;
              if (offset > height) {
                target.after(draggedItem);
              } else {
                target.before(draggedItem);
              }
            }
          });

          li.addEventListener('drop', () => {
            updateOrderListConfig();
          });
        });

        function updateOrderListConfig() {
          const newOrder = Array.from(orderList.children).map(li => li.dataset.value);
          data.config.sequencia_acoes = newOrder;
          saveStateForUndo();
          isWorkspaceDirty = true;
        }
      }

      form.querySelectorAll("input, select, textarea").forEach(input => {
        if (data.type === "Window" && input.name === `titulo-${data.__blockId}` && data.config.windowsData) {
          input.onchange = (e) => {
            const titulo = e.target.value;
            const win = data.config.windowsData?.[titulo];
            if (!win) return;

            data.config.titulo     = titulo;
            data.config.x          = win.x;
            data.config.y          = win.y;
            data.config.largura    = win.largura;
            data.config.altura     = win.altura;
            data.config.minimizar  = !!win.minimizada;
            data.config.maximizar  = !!win.maximizada;

            setTimeout(() => {
              const keys = ['x', 'y', 'largura', 'altura', 'minimizar', 'maximizar'];
              keys.forEach(k => {
                const el = form.querySelector(`[data-field="${k}"]`);
                if (!el) return;

                if (el.type === 'checkbox') {
                  const clone = el.cloneNode(true);
                  clone.checked = !!win[k === 'minimizar' ? 'minimizada' : k === 'maximizar' ? 'maximizada' : k];
                  clone.setAttribute('data-field', k);
                  el.replaceWith(clone);
                } else {
                  el.value = win[k];
                }
              });
            }, 30);
          };
        }

        input.addEventListener("input", e => {
          const fieldName = e.target.dataset.field;
          if (!fieldName) return;

          const fld = schema.find(f => f.name === fieldName);
          if (!fld) return;

          let val;
          if (fld.type === "checkbox") {
            val = e.target.checked;
          } else if (fld.type === "radio") {
            if (!e.target.checked) return;
            val = e.target.value;
          } else if (fld.type === "number") {
            val = Number(e.target.value);
          } else {
            val = e.target.value;
          }

          if (data.type === 'IfImageMatch' && fieldName === 'threshold') {
            let numValue = parseInt(e.target.value, 10);
            if (isNaN(numValue)) {
              numValue = 0;
            }
            const clampedValue = Math.max(0, Math.min(100, numValue));
            e.target.value = clampedValue;
            val = clampedValue;
          }

          data.config[fieldName] = val;
          isWorkspaceDirty = true;
       
          if (e.target.name === `cor_hex-${data.__blockId}`) {
            const fieldWrapper = e.target.closest('.field');
            const colorBox = fieldWrapper?.querySelector('.cor-preview');

            if (colorBox && /^#[0-9A-F]{6}$/i.test(e.target.value.trim())) {
              const hex = e.target.value.trim().toUpperCase();
              colorBox.style.backgroundColor = hex;
            }
          }

          const condicaoMap = {
            'Se janela existir': ['janela_titulo', 'btn_atualizar_janelas','btn_testar_pixel'],
            'Se janela estiver ativa': ['janela_titulo', 'btn_atualizar_janelas','btn_testar_pixel'],
            'Se variável >/< = valor': ['variavel_nome', 'operador', 'valor','btn_testar_pixel'],
            'Se variável conter texto': ['variavel_nome', 'texto4','btn_testar_pixel'],
            'Se valor do clipboard for igual': ['texto','btn_testar_pixel'],
            'Se valor estiver contido no clipboard': ['texto2','btn_testar_pixel'],
            'Se arquivo existir': ['abrir_tipo_if', 'abrir_caminho_if','btn_testar_pixel'],
            'Se tecla estiver pressionada': ['tecla','btn_testar_pixel'],
            'Se processo estiver rodando': ['processo_nome', 'btn_atualizar_process','btn_testar_pixel'],
            'Se título da janela contiver texto': ['texto3','btn_testar_pixel'],
            'Se tempo atual (HH:MM) >': ['hora_limite','btn_testar_pixel'],
            'Se cor do pixel em (X,Y) for igual': ['pixel_x', 'pixel_y', 'cor_hex', 'capturar','btn_testar_pixel'],
            'Se conexão de rede estiver disponível': ['btn_testar_pixel']
          };

          if (fieldName === 'tipo_condicao') {
            const selectedCond = e.target.value;
            const allFields = [
              'janela_titulo', 'variavel_nome', 'operador', 'valor', 'texto', 'texto4', 'abrir_tipo_if',
               'tecla', 'delay_ms', 'processo_nome', 'texto2', 'texto3', 'abrir_caminho_if', 'btn_atualizar_process',
              'hora_limite', 'pixel_x', 'pixel_y', 'cor_hex', 'btn_atualizar_janelas', 'capturar','btn_testar_pixel',
            ];

            const visibleFields = condicaoMap[selectedCond] || [];

            allFields.forEach(name => {
              const el = form.querySelector(`[data-field="${name}"]`);
              if (el) {
                const container = el.closest('.field');
                if (container) {
                  container.style.display = visibleFields.includes(name) ? '' : 'none';
                }
              }
            });
          }

          if (data.type === "Tecla") {
            const form = auxiliary.querySelector("#block-config-form");
            if (!form) return;

            const modo = data.config.modo;

            const campoTexto  = form.querySelector('[data-field="key_text_varios"]')?.closest('.field');
            const campoSelect = form.querySelector('[data-field="key_text_um"]')?.closest('.field');

            if (modo === "varios") {
              campoTexto?.style.setProperty('display', '');
              campoSelect?.style.setProperty('display', 'none');
            } else {
              campoTexto?.style.setProperty('display', 'none');
              campoSelect?.style.setProperty('display', '');
            }

            const initDelayField    = form.querySelector(`[name="init_delay"]`)?.closest(".field");
            const repeatDelayField  = form.querySelector(`[name="repeat_delay"]`)?.closest(".field");

            if (modo === 'um') {
              if (initDelayField)    initDelayField.style.display = "none";
              if (repeatDelayField)  repeatDelayField.style.display = "none";
            } else {
              if (initDelayField)    initDelayField.style.display = "";
              if (repeatDelayField)  repeatDelayField.style.display = "";
            }

            const acaoRadios = form.querySelectorAll(`input[type="radio"][name^="acao"]`);
            if (modo === 'varios') {
              acaoRadios.forEach(radio => {
                radio.checked = (radio.value === 'Click');
                radio.disabled = true;
              });
            } else {
              acaoRadios.forEach(radio => {
                radio.disabled = false;
                radio.checked = (radio.value === data.config.acao);
              });
            }
            
            form.querySelectorAll('[name="modo"]').forEach(input => {
              input.replaceWith(input.cloneNode(true));
            });

            form.querySelectorAll('[name="modo"]').forEach(input => {
              input.addEventListener('change', e => {
                const novoModo = e.target.value;
                if (novoModo !== data.config.modo) {
                  data.config.modo = novoModo;
                  renderBlockConfigForm(data.__blockId, data);
                }
              });
            });
          }

          if (data.type === "IfImageMatch" || data.type === "ImageMatch") {
            const form = auxiliary.querySelector("#block-config-form");
            if (!form) {
              return;
            }
            const campoArea       = form.querySelector('[data-field="area"]')?.closest('.field');
            const btnCapturarArea = form.querySelector('[data-field="btn_capturar_area"]')?.closest('.field');

            if (data.config.procurar_onde === 'tela') {
              campoArea?.style.setProperty('display', 'none');
              btnCapturarArea?.style.setProperty('display', 'none');
            } else {
              campoArea?.style.setProperty('display', '');
              btnCapturarArea?.style.setProperty('display', '');
            }
          }

          if (e.target.dataset.reveals) {
            const fieldName = e.target.dataset.reveals;
            const targetInput = form.querySelector(`[data-field="${fieldName}"]`);
            if (targetInput) {
              const container = targetInput.closest(".field");
              if (container) {
                container.classList.toggle("hidden-field", !e.target.checked);
              }
            }
          }

          if (e.target.dataset.affects) {
            let affected;          
            try {
              affected = JSON.parse(e.target.dataset.affects);
              if (!Array.isArray(affected)) return;
            } catch (_) {
              return; 
            }

            const all = ['fixo_ms','aleatorio_inicio','aleatorio_fim','variavel_name','hora_lim_delay'];

            all.forEach(name => {
              const t = form.querySelector(`[data-field="${name}"]`);
              if (!t) return;

              if (affected.includes(name)) {
                t.disabled = false;
                t.style.backgroundColor = '';
              } else {
                t.disabled = true;
                t.style.backgroundColor = '#eee';
              }
            });
          }
        });

        input.dispatchEvent(new Event("input"));

        if (data.type === "Tecla") {
          const keyBtn = form.querySelector(`[name="key"]`);
          if (keyBtn && data.config.modo === 'um') {
            keyBtn.addEventListener("click", () => {
              keyBtn.value = "⏳ Pressione uma tecla...";
              const handler = (e) => {
                e.preventDefault();
                data.config.key = e.key;
                keyBtn.value = e.key;
                document.removeEventListener("keydown", handler);
              };
              document.addEventListener("keydown", handler);
            });
          }
        }
      });

      const inputs = form.querySelectorAll("input, select");
      let isEditing = false;

      inputs.forEach(input => {
        input.addEventListener("focus", () => {
          isEditing = true;
        });

        input.addEventListener("input", e => {
          const fld = schema.find(x => x.name === e.target.name);
          if (!fld) return;

          let val;
          if (fld.type === "checkbox") {
            val = e.target.checked;
          } else if (fld.type === "radio") {
            if (!e.target.checked) return;
            val = e.target.value;
          } else if (fld.type === "number") {
            val = Number(e.target.value);
          } else {
            val = e.target.value;
          }

          const field = e.target.dataset.field;
          data.config[field] = val;
          
          if (data.type === "Window" && e.target.name === "abrir") {
            const abrirChecked = e.target.checked;
            const abrirTipoField = form.querySelector(`[data-field="abrir_tipo"]`)?.closest(".field");
            if (abrirTipoField) {
              abrirTipoField.style.display = abrirChecked ? "block" : "none";
            }
          }

          if (data.type === "Window") {
            const btnAbrir = form.querySelector(`#btn_abrir_path-${data.__blockId}`);
            if (btnAbrir) {
              btnAbrir.onclick = async () => {
                showAlert("A seleção de diretórios/arquivos locais está disponível apenas no ambiente Desktop (Windows/Linux). Na versão Demo Web, digite o caminho manualmente.", "Recurso Indisponível");
              };
            }
          }

          if (data.type === "If") {
            const btnAbrir = form.querySelector(`#btn_abrir_path-${data.__blockId}`);
            if (btnAbrir) {
              btnAbrir.onclick = async () => {
                showAlert("A seleção de diretórios/arquivos locais está disponível apenas no ambiente Desktop (Windows/Linux). Na versão Demo Web, digite o caminho manualmente.", "Recurso Indisponível");
              };
            }
          }

          if (e.target.dataset.reveals) {
            const target = form.querySelector(`[data-field="${e.target.dataset.reveals}"]`);
            if (target) {
              target.style.display = e.target.checked ? "block" : "none";
            }
          }

          if (e.target.dataset.affects) {
            const affected = JSON.parse(e.target.dataset.affects);
            affected.forEach(name => {
              const target = form.querySelector(`[name="${name}"]`);
              if (target) {
                target.disabled = e.target.checked;
                target.style.backgroundColor = e.target.checked ? "#eee" : "";
              }
            });
          }
        });

        input.addEventListener("blur", () => {
          if (isEditing) {
            saveStateForUndo();
            isEditing = false;
          }
        });

        input.dispatchEvent(new Event("input"));
      });
    });
  }

  function deselectAll() {
    document.querySelectorAll(".block")
      .forEach(b => b.classList.remove("selected"));
  }

  function getSelectedBlocks() {
    return Array.from(document.querySelectorAll(".block.selected"));
  }

  function expandCollapsedSelection(blocks) {
    const expanded = new Set(blocks);

    blocks.forEach(block => {
      const id = +block.dataset.id;
      const data = blockDataMap.get(id);
      const type = data?.type;
      const indent = parseInt(block.dataset.indent || "0");

      if ((type === "If" || type === "Repeat" || type === "Funcao" || type === "IfOCR" || type === "IfImageMatch"|| type === "Try"|| type === "While" ) && block.classList.contains("collapsed")) {
        for (let i = blockList.indexOf(block) + 1; i < blockList.length; i++) {
          const b = blockList[i];
          const bIndent = parseInt(b.dataset.indent || "0");
          expanded.add(b);
          if (blockDataMap.get(+b.dataset.id)?.type === "End" && bIndent === indent) break;
        }
      }

      if (type === "End") {
        const endIndex = blockList.indexOf(block);
        const thisIndent = parseInt(block.dataset.indent || "0");

        for (let i = endIndex - 1; i >= 0; i--) {
          const b = blockList[i];
          const bIndent = parseInt(b.dataset.indent || "0");
          const bType = blockDataMap.get(+b.dataset.id)?.type;

          const isOpening = (bType === "If" || bType === "Repeat" || bType === "Funcao" || bType === "IfOCR" || bType === "IfImageMatch"|| bType === "Try"|| bType === "While" ) && bIndent === thisIndent;

          if (bType === "End" && bIndent === thisIndent) break;

          if (isOpening) {
            const isCollapsed = b.classList.contains("collapsed");

            if (isCollapsed) {
              for (let j = i; j <= endIndex; j++) {
                expanded.add(blockList[j]);
              }
            }

            break;
          }
        }
      }
    });

    document.querySelectorAll(".block").forEach(b => b.classList.remove("selected"));
    expanded.forEach(b => b.classList.add("selected"));

    return blockList.filter(b => expanded.has(b));
  }

  function updateBlockOrder() {
    const blockState = new Map();
    blockList.forEach(b => {
      const id = +b.dataset.id;
      blockState.set(id, {
        collapsed: b.classList.contains("collapsed"),
        visible: b.style.display !== "none"
      });
    });

    applyIndentation();
    applyCollapsibles();

    blockList.forEach(b => {
      const id = +b.dataset.id;
      const state = blockState.get(id);
      if (!state) return;

      if (state.collapsed) b.classList.add("collapsed");
      b.style.display = state.visible ? "" : "none";
    });
    applyElifLogic();
  }

  function applyIndentation() {
    let indentLevel = 0;
    
    const blocksThatOpenScope = ['If', 'IfOCR', 'IfImageMatch', 'Elif', 'ElifOCR', 'ElifImageMatch', 'Else', 'Try', 'Catch', 'Repeat', 'Funcao','elif','While'];
    const blocksThatCloseScope = ['Elif', 'ElifOCR', 'ElifImageMatch', 'Else', 'Catch', 'End', 'elif'];

    blockList.forEach(block => {
      const id = +block.dataset.id;
      const data = blockDataMap.get(id);
      if (!data) return;
      const type = data.type;

      if (blocksThatCloseScope.includes(type)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      block.style.setProperty("--indent", indentLevel);
      block.dataset.indent = indentLevel;

      if (blocksThatOpenScope.includes(type)) {
        indentLevel++;
      }
    });
  }

  function applyCollapsibles() {
    const collapsedSet = new Set();
    blockList.forEach(b => {
      if (b.classList.contains("collapsed")) {
        collapsedSet.add(+b.dataset.id);
      }
      const btn = b.querySelector(".collapse-btn");
      if (btn) btn.remove();
      b.classList.remove("collapsed");
    });

    for (let i = 0; i < blockList.length; i++) {
      const block = blockList[i];
      const id = +block.dataset.id;
      const type = blockDataMap.get(id)?.type;
      const baseIndent = parseInt(block.dataset.indent || "0");

      const isCollapsibleType = ['If', 'Repeat', 'Funcao', 'IfOCR', 'IfImageMatch', 'Try', 'While'].includes(type);

      if (isCollapsibleType) {
        let endIndex = -1;
        for (let j = i + 1; j < blockList.length; j++) {
          const t = blockDataMap.get(+blockList[j].dataset.id)?.type;
          const indentJ = parseInt(blockList[j].dataset.indent || "0");
          if (t === "End" && indentJ === baseIndent) {
            endIndex = j;
            break;
          }
        }

        if (endIndex !== -1) {
          const btn = document.createElement("span");
          btn.className = "collapse-btn";

          const isAlreadyCollapsed = collapsedSet.has(id);
          if (isAlreadyCollapsed) {
            block.classList.add("collapsed");
          }
          btn.textContent = isAlreadyCollapsed ? "▶️" : "🔽";
          btn.title = isAlreadyCollapsed ? "Expandir bloco" : "Colapsar bloco";
          block.insertBefore(btn, block.firstChild);

          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            block.classList.toggle("collapsed");
            updateAllBlocksVisibility();
          });
        }
      }
    }

    function findParentCollapsed(index) {
      let currentIndent = parseInt(blockList[index].dataset.indent || "0");
      for (let p = index - 1; p >= 0; p--) {
        const parentCandidate = blockList[p];
        const parentIndent = parseInt(parentCandidate.dataset.indent || "0");
        if (parentIndent < currentIndent) {
          if (parentCandidate.classList.contains("collapsed")) {
            return true;
          }
          currentIndent = parentIndent;
        }
      }
      return false;
    }

    function updateAllBlocksVisibility() {
      blockList.forEach((b, index) => {
        if (blockDataMap.get(+b.dataset.id)?.type === 'TabSeparator') {
          b.style.display = 'none';
          return;
        }
        if (b.classList.contains('hidden-by-tab')) {
          return;
        }
        b.style.display = findParentCollapsed(index) ? "none" : "";
      });

      blockList.forEach(b => {
        const btn = b.querySelector('.collapse-btn');
        if (btn) {
          const isCollapsed = b.classList.contains('collapsed');
          btn.textContent = isCollapsed ? "▶️" : "🔽";
          btn.title = isCollapsed ? "Expandir bloco" : "Colapsar bloco";
        }
      });
    }

    updateAllBlocksVisibility();
  }

  document.addEventListener("keydown", e => {
    const activeEl = document.activeElement;
    const isInputArea = (
      activeEl.tagName === "INPUT" ||
      activeEl.tagName === "TEXTAREA" ||
      activeEl.tagName === "SELECT" ||
      activeEl.isContentEditable
    );

    const isInsideAux = activeEl.closest(".auxiliary");
    if (isInputArea && isInsideAux) return;

    if (e.key === "Escape") {
      const active = document.querySelector(".block.active");
      if (active) {
        active.classList.remove("active");
        auxiliary.innerHTML = '<p class="auxiliary-placeholder">Inspetor de Propriedades</p>';
      }
    }
    if (e.key === "Delete") {
      saveStateForUndo();
      auxiliary.innerHTML = '<p class="auxiliary-placeholder">Inspetor de Propriedades</p>';
      getSelectedBlocks().forEach(b => {
        const id = +b.dataset.id;
        blockDataMap.delete(id);
        blockList.splice(blockList.indexOf(b), 1);
        b.remove();
      });
      updateBlockOrder();
      setTimeout(() => {
        const maxScroll = inner.scrollHeight - inner.clientHeight;
        inner.scrollTop = Math.min(inner.scrollTop, Math.max(maxScroll, 0));
        updateScrollbar();
      }, 0);
    }

    const isMac  = navigator.platform.toUpperCase().includes("MAC");
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
    if (ctrlKey) {
      switch (e.key.toLowerCase()) {
        case "s":
          e.preventDefault(); 
          handleSave();
          break;
        case "o":
          e.preventDefault(); 
          handleOpen();
          break;
        case "n":
          e.preventDefault(); 
          handleNew();
          break;
        case "c":
          e.preventDefault(); copySelectedBlocks(); break;
        case "v":
          e.preventDefault(); pasteBlocks(); break;
        case "x":
          e.preventDefault(); cutSelectedBlocks(); break;
        case "a":
          e.preventDefault(); selectAllBlocks(); break;
        case "d":
          e.preventDefault(); duplicateSelectedBlocks(); break;
      }
    }

    const sel = expandCollapsedSelection(getSelectedBlocks());
    if (sel.length > 0 && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      const indices = sel.map(b => blockList.indexOf(b)).sort((a, b) => a - b);
      if (e.key === "ArrowUp" && indices[0] > 0) {
        e.preventDefault();
        saveStateForUndo();
        const before = blockList[indices[0] - 1];
        indices.slice().reverse().forEach(i => blockList.splice(i, 1));
        blockList.splice(blockList.indexOf(before), 0, ...sel);
      } else if (e.key === "ArrowDown" && indices[indices.length - 1] < blockList.length - 1) {
        e.preventDefault();
        saveStateForUndo();
        const after = blockList[indices[indices.length - 1] + 1];
        indices.slice().reverse().forEach(i => blockList.splice(i, 1));
        blockList.splice(blockList.indexOf(after) + 1, 0, ...sel);
      }

      inner.innerHTML = "";
      blockList.forEach(x => inner.appendChild(x));
      updateBlockOrder();
      sel.forEach(b => b.classList.add("selected"));
      updateScrollbar();
      isWorkspaceDirty = true;
      setTimeout(() => {
        const maxScroll = inner.scrollHeight - inner.clientHeight;
        inner.scrollTop = Math.min(inner.scrollTop, Math.max(maxScroll, 0));
        updateScrollbar();
      }, 0);
    }
  });

  inner.addEventListener("dragover", e => e.preventDefault());

  /* ==========================================================================
   * Eventos da Toolbar e Menus
     ========================================================================== */
  document.getElementById("btn-reordenar-abas").addEventListener("click", renderTabReorderUI);
  document.getElementById("btn-novo").addEventListener("click", handleNew);
  document.getElementById("btn-abrir").addEventListener("click", handleOpen);
  document.getElementById("btn-salvar").addEventListener("click", handleSave);
  
  document.getElementById("btn-tutorial").addEventListener("click", () => {
    startTutorial();
  });

  document.getElementById("btn-executar").addEventListener("click", async () => {
      await showAlert(
          "A execução real das automações (controle de mouse, teclado, janelas) está disponível apenas nos aplicativos nativos para Windows e Linux.<br><br>Como esta é uma <b>versão de demonstração web</b>, faremos o download do arquivo <code>.json</code> contendo o script completo do seu projeto em vez de executá-lo.",
          "Execução Indisponível na Web"
      );

      const jsonString = generateJSON(); 
      
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "projeto_nocode.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  });

  document.getElementById("btn-executar-passo").addEventListener("click", async () => {
      await showAlert("O modo Debug (Passo a Passo) está disponível apenas na versão Desktop.", "Modo Debug");
  });

  document.getElementById("btn-executar-selecao").addEventListener("click", async () => {
      const sel = getSelectedBlocks();
      if (sel.length === 0) {
          await showAlert("Nenhum bloco selecionado. Clique em um ou mais blocos para utilizar esta função.", "Seleção Vazia");
          return;
      }
      
      await showAlert(
          "A execução real das automações está disponível apenas nos aplicativos nativos para Windows e Linux.<br><br>Como esta é uma <b>versão de demonstração web</b>, faremos o download de um arquivo <code>.json</code> contendo <b>apenas os blocos selecionados</b>.",
          "Execução Indisponível na Web"
      );

      const expanded = expandCollapsedSelection(sel);

      const script = expanded.map(b => {
          const cfg = blockDataMap.get(+b.dataset.id);
          return { type: cfg.type, config: deepClone(cfg.config) };
      });

      const jsonString = JSON.stringify(script, null, 2);
      
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "selecao_nocode.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  });

  /* ==========================================================================
   * Ajuste de Painéis (Resizer)
     ========================================================================== */
  let isResizing = false;

  resizer.addEventListener("mousedown", e => {
      isResizing = true;
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = 'none';
      e.preventDefault();
  });

  document.addEventListener("mousemove", e => {
      if (!isResizing) return;

      const container = resizer.parentElement;
      const containerRect = container.getBoundingClientRect();
      const gap = parseFloat(getComputedStyle(container).gap) || 10;
      const resizeAreaStartX = containerRect.left + sidebar.offsetWidth + gap;
      let newMainContentWidth = e.clientX - resizeAreaStartX;
      const minPanelWidth = 200;

      if (newMainContentWidth < minPanelWidth) {
          newMainContentWidth = minPanelWidth;
      }

      const totalResizableWidth = containerRect.width - sidebar.offsetWidth - resizer.offsetWidth - (gap * 3);

      if (newMainContentWidth > totalResizableWidth - minPanelWidth) {
          newMainContentWidth = totalResizableWidth - minPanelWidth;
      }

      const newAuxiliaryWidth = totalResizableWidth - newMainContentWidth;

      mainContent.style.flex = '0 0 auto';
      auxiliary.style.flex = '0 0 auto';
      mainContent.style.width = newMainContentWidth + 'px';
      auxiliary.style.width = newAuxiliaryWidth + 'px';

      updateScrollbar();
  });

  document.addEventListener("mouseup", () => {
      if (isResizing) {
          isResizing = false;
          document.body.style.cursor = "auto";
          document.body.style.userSelect = '';
          updateScrollbar();
      }
  });

  /* ==========================================================================
   * Auto Scroll no Arrastar
     ========================================================================== */
  let scrollDir = 0, scrollRAF = null, lastMouseY = null;
  const threshold = 50, scrollSpeed = 15;
  function startAutoScroll(dir) {
    if (scrollRAF) cancelAnimationFrame(scrollRAF);
    scrollDir = dir;
    (function step() {
      if (scrollDir !== 0) {
        inner.scrollTop += scrollDir;
        scrollRAF = requestAnimationFrame(step);
      }
    })();
  }
  function stopAutoScroll() {
    if (scrollRAF) cancelAnimationFrame(scrollRAF);
    scrollDir = 0; scrollRAF = null;
  }

  document.addEventListener("mousemove", e => {
      const wr = inner.getBoundingClientRect();

      const isMouseInsideWorkspace = (
          e.clientX >= wr.left &&
          e.clientX <= wr.right &&
          e.clientY >= wr.top &&
          e.clientY <= wr.bottom
      );

      if (!isMouseInsideWorkspace && scrollDir === 0) {
          stopAutoScroll();
          lastMouseY = null;
          return;
      }

      if (!e.buttons || (!isSelecting && getSelectedBlocks().length === 0)) {
          stopAutoScroll();
          lastMouseY = null;
          return;
      }
      lastMouseY = e.clientY;

      if (lastMouseY < wr.top + threshold && inner.scrollTop > 0) {
          startAutoScroll(-scrollSpeed);
      } else if (
          lastMouseY > wr.bottom - threshold &&
          inner.scrollTop < inner.scrollHeight - inner.clientHeight
      ) {
          startAutoScroll(scrollSpeed);
      } else {
          stopAutoScroll();
      }
  });

  document.addEventListener("mouseup", () => {
    stopAutoScroll(); lastMouseY = null;
  });

  function getAllLabelNames() {
    return blockList
      .map(b => {
        const id = +b.dataset.id;
        const data = blockDataMap.get(id);
        if (data?.type === "Label") {
          return data.config.text?.trim();
        }
        return null;
      })
      .filter(Boolean);
  }

  function getAllVariableNames() {
    return blockList
      .flatMap(b => {
        const id = +b.dataset.id;
        const data = blockDataMap.get(id);
        
        if (data?.type === "Variable") {
          return data.config.variavel
            .map(item => item.nome?.trim())
            .filter(Boolean);
        }
        return [];
      });
  }

  function getAllFunctionNames() {
    const nomes = [];
    blockDataMap.forEach((data, id) => {
      if (data.type === "Funcao" && data.config.nome.trim()) {
        nomes.push(`${data.config.nome.trim()} (ID: ${id})`);
      }
    });
    return nomes;
  }

  document.getElementById('add-workspace-btn').addEventListener('click', () => {
      const tabNameSpans = document.querySelectorAll('.tab-item span:not(.close-tab-btn):not(.tab-exec-order)');
      let maxNumber = 0;

      tabNameSpans.forEach(span => {
          const name = span.textContent;
          if (name && name.startsWith('Aba ')) {
              const number = parseInt(name.substring(4), 10);
              if (!isNaN(number) && number > maxNumber) {
                  maxNumber = number;
              }
          }
      });

      const newName = `Aba ${maxNumber + 1}`;
      addBlock('TabSeparator', { name: newName });
  });

  if (blockList.length === 0) {
      addBlock('TabSeparator', { name: 'Principal' });
  } else {
      renderTabs();
      if (activeTabSeparatorId === null && blockList.length > 0) {
          switchTab(+blockList[0].dataset.id);
      }
  }

  function getTabChunksMap() {
      const tabChunks = new Map();
      if (blockList.length === 0) {
          return tabChunks;
      }

      let currentChunk = [];
      let currentTabId = null;

      for (const block of blockList) {
          const data = blockDataMap.get(+block.dataset.id);

          if (data.type === 'TabSeparator') {
              if (currentTabId !== null) {
                  tabChunks.set(currentTabId, currentChunk);
              }
              currentTabId = +block.dataset.id;
              currentChunk = [block];
          } else {
              if (currentTabId !== null) {
                  currentChunk.push(block);
              }
          }
      }

      if (currentTabId !== null && currentChunk.length > 0) {
          tabChunks.set(currentTabId, currentChunk);
      }

      return tabChunks;
  }

  function sanitizePythonVarName(name) {
    if (typeof name !== 'string' || !name) return '';
    let sanitized = name;
    sanitized = sanitized.replace(/\s+/g, '_');
    sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, '');
    if (/^[0-9]/.test(sanitized)) {
      sanitized = '_' + sanitized;
    }
    return sanitized;
  }

  function applyElifLogic() {
    const replacementMap = {
      'IfOCR': 'ElifOCR',
      'IfImageMatch': 'ElifImageMatch',
      'If': 'elif'
    };
    const targetTypes = Object.keys(replacementMap); 
    
    let replacementOccurred = false;

    do {
      replacementOccurred = false;
      for (let i = blockList.length - 2; i >= 0; i--) {
        const currentBlock = blockList[i];
        const nextBlock = blockList[i + 1];

        const currentData = blockDataMap.get(+currentBlock.dataset.id);
        const nextData = blockDataMap.get(+nextBlock.dataset.id);

        if (currentData && currentData.type === 'Elif' && nextData && targetTypes.includes(nextData.type)) {
          
          replacementOccurred = true;

          const replacementIndex = i;
          const newBlockType = replacementMap[nextData.type]; 

          const elifId = +currentBlock.dataset.id;
          const ifId = +nextBlock.dataset.id;
          
          blockDataMap.delete(elifId);
          blockDataMap.delete(ifId);
          
          currentBlock.remove();
          nextBlock.remove();

          const newBlock = createAndSetupBlock(newBlockType, {});

          blockList.splice(i, 2, newBlock);
          
          if (replacementIndex >= inner.children.length) {
              inner.appendChild(newBlock);
          } else {
              inner.insertBefore(newBlock, inner.children[replacementIndex]);
          }

          break;
        }
      }
      applyIndentation();
    } while (replacementOccurred);

    lucide.createIcons();
  }

  function createAndSetupBlock(type, config) {
    const block = document.createElement("div");
    block.classList.add("block");
    block.innerHTML = `
        <i data-lucide="${lucideMap[type] || 'box'}" style="margin-right: 6px;"></i>
        <span class="block-name">${type}</span>
      `;

    const id = blockIdCounter++;
    block.dataset.id = id;
    const schema = blockSchemas[type] || [];
    const cfg = {};
    
    schema.forEach(f => {
      cfg[f.name] = (config && f.name in config)
                      ? deepClone(config[f.f.name])
                      : deepClone(f.default);
    });
    for (const key in config) {
      if (!(key in cfg)) {
        cfg[key] = deepClone(config[key]);
      }
    }

    blockDataMap.set(id, { type, config: cfg });
    setupBlockEvents(block);
    return block;
  }
  
  updateScrollbar();
  
  /* ==========================================================================
   * Sistema de Autocompletar Variáveis
     ========================================================================== */
  function setupAutocomplete(inputElement) {
      let autocompleteList = null;
      let selectedIndex = -1;

      function createAutocompleteList() {
          if (!autocompleteList) {
              autocompleteList = document.createElement('ul');
              autocompleteList.classList.add('autocomplete-list');
              document.body.appendChild(autocompleteList);
          }
      }

      function showAutocomplete(filteredVariables) {
          if (filteredVariables.length === 0) {
              hideAutocomplete();
              return;
          }

          createAutocompleteList();
          autocompleteList.innerHTML = '';
          selectedIndex = -1;

          filteredVariables.forEach((name, index) => {
              const li = document.createElement('li');
              li.textContent = `@${name}`;
              li.addEventListener('click', () => {
                  selectVariable(name);
              });
              autocompleteList.appendChild(li);
          });

          const rect = inputElement.getBoundingClientRect();
          autocompleteList.style.top = `${rect.bottom + window.scrollY}px`;
          autocompleteList.style.left = `${rect.left + window.scrollX}px`;
          autocompleteList.style.display = 'block';
      }

      function hideAutocomplete() {
          if (autocompleteList) {
              autocompleteList.style.display = 'none';
          }
      }

      function selectVariable(name) {
          const atIndex = inputElement.value.lastIndexOf('@');
          const newValue = inputElement.value.substring(0, atIndex) + `@${name}`;
          inputElement.value = newValue;
          hideAutocomplete();
          inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      }

      inputElement.addEventListener('input', (e) => {
          const text = e.target.value;
          const cursorPosition = e.target.selectionStart;

          const atIndex = text.lastIndexOf('@', cursorPosition - 1);

          if (atIndex !== -1) {
              const searchQuery = text.substring(atIndex + 1, cursorPosition);
              const variables = getAllVariableNames();
              const filteredVariables = variables.filter(name =>
                  name.toLowerCase().startsWith(searchQuery.toLowerCase())
              );
              showAutocomplete(filteredVariables);
          } else {
              hideAutocomplete();
          }
      });

      inputElement.addEventListener('keydown', (e) => {
          if (autocompleteList && autocompleteList.style.display === 'block') {
              const items = autocompleteList.querySelectorAll('li');
              if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  selectedIndex = (selectedIndex + 1) % items.length;
                  updateSelection(items);
              } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                  updateSelection(items);
              } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (selectedIndex !== -1) {
                      const selectedName = items[selectedIndex].textContent.substring(1);
                      selectVariable(selectedName);
                  }
              } else if (e.key === 'Escape') {
                  hideAutocomplete();
              }
          }
      });

      inputElement.addEventListener('blur', () => {
          setTimeout(hideAutocomplete, 200);
      });

      function updateSelection(items) {
          items.forEach((item, index) => {
              if (index === selectedIndex) {
                  item.classList.add('selected');
              } else {
                  item.classList.remove('selected');
              }
          });
      }
  }

  function applyShowIfLogic(form, schema, config) {
    schema.forEach(field => {
      const fieldElement = form.querySelector(`[data-field="${field.name}"]`);
      if (!fieldElement) return;
      const container = fieldElement.closest('.field');
      if (!container) return;
      const showIfCondition = field.showIf;
      if (showIfCondition) {
        const triggerField = Object.keys(showIfCondition)[0];
        const triggerValue = showIfCondition[triggerField];
        const currentValue = config[triggerField];
        let shouldShow;
        if (Array.isArray(triggerValue)) {
          shouldShow = triggerValue.includes(currentValue);
        } else {
          shouldShow = (currentValue === triggerValue);
        }
        container.style.display = shouldShow ? '' : 'none';
      }
    });
  }

  /* ==========================================================================
   * Fluxo do Tutorial Interativo
     ========================================================================== */
  setTimeout(async () => {
    const jaFez = localStorage.getItem('tutorialCompleted');
    if (!jaFez) {
      const want = await showConfirm(
        "Bem-vindo à versão Web Demo do NoCode Studio!<br><br>Deseja fazer um rápido tutorial interativo para aprender os comandos essenciais da plataforma?", 
        { title: "Bem-vindo! 👋", ok: "Iniciar Tutorial", cancel: "Pular" }
      );
      if (want) {
        startTutorial();
      } else {
        localStorage.setItem('tutorialCompleted', 'true');
      }
    }
  }, 800);

  async function startTutorial() {
    let checkInterval;
    let highlightInterval;
    let highlightedElement = null;
    let originalStyles = {};

    const clearHighlight = () => {
      if (highlightInterval) {
        clearInterval(highlightInterval);
        highlightInterval = null;
      }
      if (highlightedElement) {
        highlightedElement.style.outline = originalStyles.outline || '';
        highlightedElement.style.boxShadow = originalStyles.boxShadow || '';
        highlightedElement.style.backgroundColor = originalStyles.backgroundColor || '';
        highlightedElement.style.transition = originalStyles.transition || '';
        highlightedElement = null;
      }
    };

    const highlightElement = (selector, options = { once: false }) => {
      clearHighlight();
      const target = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        highlightedElement = target;
        originalStyles = {
          outline: target.style.outline,
          boxShadow: target.style.boxShadow,
          backgroundColor: target.style.backgroundColor,
          transition: target.style.transition
        };

        target.style.transition = options.once ? "all 0.8s ease" : "all 0.3s ease";
        let toggle = false;

        const applyStyles = (active) => {
          if (active) {
            target.style.outline = "3px solid #FF1744";
            target.style.boxShadow = "0 0 15px #FF1744";
            target.style.backgroundColor = "rgba(255, 23, 68, 0.15)";
          } else {
            target.style.outline = originalStyles.outline || "3px solid transparent";
            target.style.boxShadow = originalStyles.boxShadow || "";
            target.style.backgroundColor = originalStyles.backgroundColor || "";
          }
        };

        if (options.once) {
          applyStyles(true);
          setTimeout(() => {
            applyStyles(false);
            clearHighlight();
          }, 1200);
        } else {
          highlightInterval = setInterval(() => {
            if (toggle) applyStyles(true); else applyStyles(false);
            toggle = !toggle;
          }, 400);
        }
      }
    };

    await showAlert(
      "Vamos começar criando um comando.<br><br>Clique no botão <b>OK</b> abaixo e em seguida <b>CLIQUE NO BLOCO LOG</b> que estará marcado de vermelho na barra lateral esquerda.", 
      "Passo 1/10: Adicionar um Bloco"
    );
    
    const logItem = document.querySelector('.sidebar li[data-type="Log"]');
    const catList = logItem ? logItem.closest('.category-list') : null;
    const catHeader = catList ? catList.previousElementSibling : null;

    if (catList && !catList.classList.contains('visible') && catHeader) {
      highlightElement(catHeader);
    } else {
      highlightElement('.sidebar li[data-type="Log"]');
    }

    let categoryOpened = false;

    checkInterval = setInterval(async () => {
      if (catList && !categoryOpened && catList.classList.contains('visible')) {
        categoryOpened = true;
        highlightElement('.sidebar li[data-type="Log"]');
      }
      const logBlock = Array.from(document.querySelectorAll('.workspace-inner .block')).find(b => {
        const id = +b.dataset.id;
        const data = window.blockDataMap.get(id);
        return data && data.type === 'Log';
      });

      if (logBlock) {
        clearInterval(checkInterval);
        clearHighlight();
        
        await showAlert(
          "Ótimo! O bloco foi adicionado à sua área de trabalho.<br><br>Feche este aviso e dê <b>UM CLIQUE SIMPLES</b> no bloco Log (marcado em vermelho) para selecioná-lo.",
          "Passo 2/10: Selecionar o Bloco"
        );

        highlightElement(logBlock);

        checkInterval = setInterval(async () => {
          if (logBlock.classList.contains('selected')) {
            clearInterval(checkInterval);
            clearHighlight();

            await showAlert(
              "A regra de ouro do editor: para abrir o menu de um comando, você deve dar um <b>DUPLO CLIQUE</b> nele.<br><br>Dê um duplo clique rápido no bloco Log.",
              "Passo 3/10: Abrir Configurações"
            );
            
            highlightElement(logBlock);

            checkInterval = setInterval(async () => {
              if (logBlock.classList.contains('active')) {
                clearInterval(checkInterval);
                clearHighlight();

                await showAlert(
                  "Esta é a barra lateral direita (Inspetor de Propriedades)!<br><br>É aqui que você preenche textos, escolhe opções e configura o comportamento de cada bloco.",
                  "Passo 4/10: Inspetor de Propriedades"
                );
                
                highlightElement('.auxiliary', { once: true });

                deselectAll(); 
                addBlock("If", { tipo_condicao: "Se janela existir" });
                addBlock("Delay", { fixo_ms: 1500 });
                addBlock("End", {});

                await showAlert(
                  "Criamos uma estrutura de código real para você ver:<br><br>" +
                  "1. O bloco <b>If</b> abre uma condição.<br>" +
                  "2. O bloco <b>Delay</b> recebeu <b>indentação</b> para a direita para indicar que está dentro do If.<br>" +
                  "3. O bloco <b>End</b> fecha essa estrutura.",
                  "Passo 5/10: Estrutura e Indentação"
                );

                const ifBlock = Array.from(document.querySelectorAll('.workspace-inner .block')).find(b => {
                  const id = +b.dataset.id;
                  const data = window.blockDataMap.get(id);
                  return data && data.type === 'If';
                });

                const collapseBtn = ifBlock ? ifBlock.querySelector('.collapse-btn') : null;

                if (collapseBtn) {
                  await showAlert(
                    "Para facilitar a leitura de projetos grandes, você pode ocultar blocos aninhados.<br><br>Clique na <b>SETINHA (🔽)</b> do bloco 'If' (marcada em vermelho) para colapsar o conteúdo.",
                    "Passo 6/10: Colapsar Escopos"
                  );

                  highlightElement(collapseBtn);

                  checkInterval = setInterval(async () => {
                    if (ifBlock.classList.contains('collapsed')) {
                      clearInterval(checkInterval);
                      clearHighlight();
                      
                      await showAlert(
                        "Perfeito! O conteúdo interno foi ocultado.<br><br>Agora, clique novamente na <b>SETINHA (▶️)</b> para expandir a estrutura antes de continuarmos.",
                        "Passo 7/10: Expandir Escopos"
                      );
                      
                      highlightElement(collapseBtn);

                      checkInterval = setInterval(async () => {
                        if (!ifBlock.classList.contains('collapsed')) {
                          clearInterval(checkInterval);
                          clearHighlight();

                          await showAlert(
                            "Atalho de edição: o <b>duplo clique</b> abre o painel de propriedades do bloco selecionado.<br><br>Execute um duplo clique no bloco <b>Log</b> para abrir seu menu de configurações.",
                            "Passo 3/10: Inspetor de Propriedades"
                          );

                          checkInterval = setInterval(async () => {
                            const visibleBlocks = Array.from(document.querySelectorAll('.workspace-inner .block')).filter(b => b.style.display !== 'none');
                            const idxLog = visibleBlocks.findIndex(b => window.blockDataMap.get(+b.dataset.id)?.type === 'Log');
                            const idxIf = visibleBlocks.findIndex(b => window.blockDataMap.get(+b.dataset.id)?.type === 'If');
                            const idxEnd = visibleBlocks.findIndex(b => window.blockDataMap.get(+b.dataset.id)?.type === 'End');

                            if (idxLog > idxIf && idxEnd !== -1 && idxLog < idxEnd) {
                              clearInterval(checkInterval);
                              clearHighlight();

                              await showAlert(
                                "Excelente! Você organizou o fluxo perfeitamente.<br><br>Agora vamos limpar a tela. Clique num espaço vazio da área principal e <b>arraste o mouse formando um retângulo</b> para selecionar todos os blocos.",
                                "Passo 9/10: Seleção Múltipla"
                              );
                              
                              checkInterval = setInterval(async () => {
                                const qtdSelecionados = document.querySelectorAll('.workspace-inner .block.selected').length;
                                
                                if (qtdSelecionados >= 2) {
                                  clearInterval(checkInterval);
                                  clearHighlight();

                                  setTimeout(async () => {
                                    await showAlert(
                                      "Muito bem, você selecionou os blocos! (eles ficaram azuis).<br><br>Agora, aperte a tecla <b>DELETE</b> no seu teclado para apagá-los do seu projeto.",
                                      "Passo 10/10: Excluir Blocos"
                                    );

                                    checkInterval = setInterval(async () => {
                                      const blocosRestantes = Array.from(document.querySelectorAll('.workspace-inner .block')).filter(b => b.style.display !== 'none').length;
                                      
                                      if (blocosRestantes === 0) {
                                        clearInterval(checkInterval);
                                        clearHighlight();
                                        
                                        await showAlert(
                                          "Meus Parabéns! Você apagou os blocos com sucesso.<br><br>Você concluiu o tutorial e já domina todas as mecânicas principais do NoCode Studio. Divirta-se criando suas automações!",
                                          "Tutorial Concluído! 🎉"
                                        );
                                        localStorage.setItem('tutorialCompleted', 'true');
                                      }
                                    }, 500);
                                  }, 500);
                                }
                              }, 500);
                            }
                          }, 500);
                        }
                      }, 500);
                    }
                  }, 500);
                } else {
                  localStorage.setItem('tutorialCompleted', 'true');
                }
              }
            }, 500);
          }
        }, 500);
      }
    }, 500);
  }
});