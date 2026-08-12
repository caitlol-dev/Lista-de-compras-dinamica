document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('wishlist-form');
  const itemNameInput = document.getElementById('item-name');
  const itemPriceInput = document.getElementById('item-price');
  const itemPrioritySelect = document.getElementById('item-priority');
  const itemProductUrlInput = document.getElementById('item-product-url');
  const itemImageInput = document.getElementById('item-image');
  const itemImageUrlInput = document.getElementById('item-image-url');
  const fileNameEl = document.getElementById('file-name');
  const newImagePreview = document.getElementById('new-image-preview');

  const wishlistEl = document.getElementById('wishlist');
  const totalPriceEl = document.getElementById('total-price');
  const totalItemsEl = document.getElementById('total-items');
  const completedItemsEl = document.getElementById('completed-items');
  const emptyState = document.getElementById('empty-state');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const toast = document.getElementById('toast');
  const mobileAddButton = document.getElementById('mobile-add-button');
  const siteTabs = document.querySelectorAll('.site-tab');
  const pageViews = document.querySelectorAll('.page-view');
  const aboutBackButton = document.querySelector('.about-back-btn');

  const modalOverlay = document.getElementById('edit-modal');
  const modalImgPreview = document.getElementById('modal-img-preview');
  const modalPriceInput = document.getElementById('modal-price');
  const modalPrioritySelect = document.getElementById('modal-priority');
  const modalProductUrlInput = document.getElementById('modal-product-url');
  const modalImageFileInput = document.getElementById('modal-image-file');
  const modalImageUrlInput = document.getElementById('modal-image-url');
  const modalFileName = document.getElementById('modal-file-name');
  const modalCancelBtn = document.getElementById('modal-cancel');
  const modalCloseBtn = document.getElementById('modal-close');
  const modalSaveBtn = document.getElementById('modal-save');

  let currentEditingIndex = null;
  let currentBase64Image = '';
  let modalBase64Image = '';
  let activeFilter = 'all';
  let toastTimer;

  let items = [];
  try {
    const savedItems = JSON.parse(localStorage.getItem('wishlist_items'));
    items = Array.isArray(savedItems) ? savedItems : [];
  } catch {
    items = [];
  }

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value) || 0);

  const showToast = (message) => {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };

  const renderNewImagePreview = (src = '') => {
    newImagePreview.innerHTML = '';
    if (!src) {
      newImagePreview.textContent = 'Prévia da imagem';
      return;
    }

    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Prévia do novo item';
    img.onerror = () => {
      newImagePreview.textContent = 'Imagem inválida';
    };
    newImagePreview.appendChild(img);
  };

  const createImageElement = (item) => {
    if (!item.image) {
      return '<span class="item-placeholder" aria-hidden="true">SEM<br>FOTO</span>';
    }

    return `<img src="${escapeHtml(item.image)}" class="item-thumb" alt="Imagem de ${escapeHtml(item.name)}" />`;
  };

  const saveItems = () => {
    localStorage.setItem('wishlist_items', JSON.stringify(items));
    render();
  };

  const closeModal = () => {
    modalOverlay.classList.remove('active');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    currentEditingIndex = null;
  };

  const openModal = (index) => {
    const item = items[index];
    currentEditingIndex = index;
    modalPriceInput.value = item.price ?? 0;
    modalPrioritySelect.value = item.priority ?? 2;
    modalProductUrlInput.value = item.productUrl || '';
    modalImageUrlInput.value = '';
    modalImageFileInput.value = '';
    modalFileName.textContent = 'Escolher arquivo';
    modalBase64Image = '';

    if (item.image) {
      modalImgPreview.src = item.image;
      modalImgPreview.style.opacity = '1';
    } else {
      modalImgPreview.removeAttribute('src');
      modalImgPreview.style.opacity = '0.35';
    }

    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setTimeout(() => modalPriceInput.focus(), 50);
  };

  const getFilteredItems = () => {
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (activeFilter === 'pending') return !item.completed;
        if (activeFilter === 'completed') return item.completed;
        return true;
      });
  };

  const render = () => {
    wishlistEl.innerHTML = '';

    const totalValue = items.reduce((sum, item) => {
      return item.completed ? sum : sum + (Number(item.price) || 0);
    }, 0);
    const completedCount = items.filter((item) => item.completed).length;

    totalPriceEl.textContent = formatCurrency(totalValue);
    totalItemsEl.textContent = items.length;
    completedItemsEl.textContent = completedCount;

    const visibleItems = getFilteredItems();
    emptyState.classList.toggle('visible', visibleItems.length === 0);

    if (visibleItems.length === 0) {
      const title = emptyState.querySelector('h3');
      const text = emptyState.querySelector('p');

      if (items.length === 0) {
        title.textContent = 'Sua lista está vazia';
        text.textContent = 'Adicione seu primeiro item usando o formulário acima.';
      } else {
        title.textContent = 'Nenhum item neste filtro';
        text.textContent = 'Troque o filtro para visualizar os outros itens da sua lista.';
      }
    }

    visibleItems.forEach(({ item, index }) => {
      const li = document.createElement('li');
      li.className = `item-card p-${item.priority}${item.completed ? ' is-completed' : ''}`;
      const isTouchLayout = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
      li.draggable = activeFilter === 'all' && !isTouchLayout;
      li.dataset.index = index;

      const priorityText = { 3: 'Alta', 2: 'Média', 1: 'Baixa' }[item.priority] || 'Média';
      const hasCustomLink = Boolean(item.productUrl && item.productUrl.trim());

      li.innerHTML = `
        <div class="item-main">
          <span class="drag-handle" title="Arraste para reorganizar" aria-hidden="true">•••</span>
          ${createImageElement(item)}
          <div class="item-info">
            <span class="item-title ${item.completed ? 'completed' : ''}" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
            <div class="item-details">
              <span class="item-price">${formatCurrency(item.price)}</span>
              <span class="badge p-${item.priority}">${priorityText}</span>
            </div>
          </div>
        </div>
        <div class="move-controls" aria-label="Reorganizar item" ${activeFilter === 'all' ? '' : 'hidden'}>
          <button type="button" class="move-btn move-up-btn" ${index === 0 ? 'disabled' : ''}>Subir</button>
          <button type="button" class="move-btn move-down-btn" ${index === items.length - 1 ? 'disabled' : ''}>Descer</button>
        </div>
        <div class="actions">
          <button type="button" class="btn-action edit-btn">Editar</button>
          <button type="button" class="btn-action shop-btn">Pesquisar</button>
          <button type="button" class="btn-action link-btn" ${hasCustomLink ? '' : 'disabled'}>${hasCustomLink ? 'Abrir link' : 'Sem link'}</button>
          <button type="button" class="btn-action check-btn">${item.completed ? 'Reabrir' : 'Concluir'}</button>
          <button type="button" class="btn-action delete-btn">Excluir</button>
        </div>
      `;

      const itemImage = li.querySelector('.item-thumb');
      if (itemImage) {
        itemImage.addEventListener('error', () => {
          const placeholder = document.createElement('span');
          placeholder.className = 'item-placeholder';
          placeholder.setAttribute('aria-hidden', 'true');
          placeholder.innerHTML = 'SEM<br>FOTO';
          itemImage.replaceWith(placeholder);
        });
      }

      li.querySelector('.move-up-btn').addEventListener('click', () => {
        if (index <= 0) return;
        [items[index - 1], items[index]] = [items[index], items[index - 1]];
        saveItems();
        showToast('Item movido para cima.');
      });

      li.querySelector('.move-down-btn').addEventListener('click', () => {
        if (index >= items.length - 1) return;
        [items[index + 1], items[index]] = [items[index], items[index + 1]];
        saveItems();
        showToast('Item movido para baixo.');
      });

      li.querySelector('.edit-btn').addEventListener('click', () => openModal(index));

      li.querySelector('.shop-btn').addEventListener('click', () => {
        window.open(`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.name)}`, '_blank', 'noopener');
      });

      li.querySelector('.link-btn').addEventListener('click', () => {
        if (!hasCustomLink) return;
        let url = item.productUrl.trim();
        if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
        window.open(url, '_blank', 'noopener');
      });

      li.querySelector('.check-btn').addEventListener('click', () => {
        items[index].completed = !items[index].completed;
        const wasCompleted = items[index].completed;
        saveItems();
        showToast(wasCompleted ? 'Item marcado como comprado.' : 'Item voltou para os pendentes.');
      });

      li.querySelector('.delete-btn').addEventListener('click', () => {
        const removedName = items[index].name;
        if (!window.confirm(`Excluir “${removedName}” da lista?`)) return;
        items.splice(index, 1);
        saveItems();
        showToast(`“${removedName}” foi removido.`);
      });

      li.addEventListener('dragstart', (event) => {
        if (activeFilter !== 'all') {
          event.preventDefault();
          return;
        }
        li.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(index));
      });

      li.addEventListener('dragend', () => li.classList.remove('dragging'));

      li.addEventListener('dragover', (event) => {
        if (activeFilter !== 'all') return;
        event.preventDefault();
        const draggingItem = wishlistEl.querySelector('.dragging');
        if (!draggingItem) return;

        const siblings = [...wishlistEl.querySelectorAll('.item-card:not(.dragging)')];
        const nextSibling = siblings.find((sibling) => {
          const rect = sibling.getBoundingClientRect();
          return event.clientY <= rect.top + rect.height / 2;
        });

        wishlistEl.insertBefore(draggingItem, nextSibling || null);
      });

      li.addEventListener('drop', (event) => {
        if (activeFilter !== 'all') return;
        event.preventDefault();

        const draggedIdx = Number(event.dataTransfer.getData('text/plain'));
        const orderedIndexes = [...wishlistEl.children].map((child) => Number(child.dataset.index));
        const newPosition = orderedIndexes.indexOf(draggedIdx);

        if (Number.isNaN(draggedIdx) || newPosition < 0) return;

        const [movedItem] = items.splice(draggedIdx, 1);
        items.splice(newPosition, 0, movedItem);
        saveItems();
        showToast('Ordem da lista atualizada.');
      });

      wishlistEl.appendChild(li);
    });
  };

  itemImageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
      fileNameEl.textContent = 'Nenhum arquivo selecionado';
      currentBase64Image = '';
      renderNewImagePreview(itemImageUrlInput.value.trim());
      return;
    }

    fileNameEl.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      currentBase64Image = readerEvent.target.result;
      renderNewImagePreview(currentBase64Image);
    };
    reader.readAsDataURL(file);
  });

  itemImageUrlInput.addEventListener('input', (event) => {
    if (!currentBase64Image) renderNewImagePreview(event.target.value.trim());
  });

  modalImageFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    modalFileName.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      modalBase64Image = readerEvent.target.result;
      modalImgPreview.src = modalBase64Image;
      modalImgPreview.style.opacity = '1';
    };
    reader.readAsDataURL(file);
  });

  modalImageUrlInput.addEventListener('input', (event) => {
    const url = event.target.value.trim();
    if (url) {
      modalImgPreview.src = url;
      modalImgPreview.style.opacity = '1';
    }
  });

  const switchView = (viewId, updateHash = true) => {
    const target = document.getElementById(viewId);
    if (!target) return;

    pageViews.forEach((view) => {
      const isActive = view.id === viewId;
      view.hidden = !isActive;
      view.classList.toggle('active-view', isActive);
    });

    siteTabs.forEach((tab) => {
      const isActive = tab.dataset.view === viewId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });

    const isAbout = viewId === 'about-view';
    document.body.classList.toggle('about-active', isAbout);

    if (updateHash) {
      const hash = isAbout ? '#sobre' : '#wishlist';
      if (window.location.hash !== hash) history.replaceState(null, '', hash);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  siteTabs.forEach((tab) => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  });

  if (aboutBackButton) {
    aboutBackButton.addEventListener('click', () => switchView('wishlist-view'));
  }

  window.addEventListener('hashchange', () => {
    switchView(window.location.hash === '#sobre' ? 'about-view' : 'wishlist-view', false);
  });

  const initialView = window.location.hash === '#sobre' ? 'about-view' : 'wishlist-view';
  switchView(initialView, false);

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      filterButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
      render();
    });
  });

  modalCancelBtn.addEventListener('click', closeModal);
  modalCloseBtn.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalOverlay.classList.contains('active')) closeModal();
  });

  modalSaveBtn.addEventListener('click', () => {
    if (currentEditingIndex === null) return;

    const item = items[currentEditingIndex];
    item.price = Number.parseFloat(modalPriceInput.value) || 0;
    item.priority = Number.parseInt(modalPrioritySelect.value, 10) || 2;
    item.productUrl = modalProductUrlInput.value.trim();

    const newImageUrl = modalImageUrlInput.value.trim();
    if (modalBase64Image) item.image = modalBase64Image;
    else if (newImageUrl) item.image = newImageUrl;

    closeModal();
    saveItems();
    showToast('Alterações salvas.');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = itemNameInput.value.trim();
    if (!name) {
      itemNameInput.focus();
      return;
    }

    const price = Number.parseFloat(itemPriceInput.value) || 0;
    const priority = Number.parseInt(itemPrioritySelect.value, 10) || 2;
    const productUrl = itemProductUrlInput.value.trim();
    const imageUrl = itemImageUrlInput.value.trim();

    items.push({
      name,
      price,
      priority,
      productUrl,
      image: currentBase64Image || imageUrl || '',
      completed: false
    });

    form.reset();
    itemPrioritySelect.value = '2';
    currentBase64Image = '';
    fileNameEl.textContent = 'Nenhum arquivo selecionado';
    renderNewImagePreview();

    activeFilter = 'all';
    filterButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.filter === 'all'));

    saveItems();
    showToast('Item adicionado à wishlist.');
    itemNameInput.focus();
  });

  mobileAddButton.addEventListener('click', () => {
    document.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => itemNameInput.focus(), 450);
  });

  render();
});
