document.addEventListener('DOMContentLoaded', () => {
      const form = document.getElementById('wishlist-form');
      const itemNameInput = document.getElementById('item-name');
      const itemPriceInput = document.getElementById('item-price');
      const itemPrioritySelect = document.getElementById('item-priority');
      const itemProductUrlInput = document.getElementById('item-product-url');
      const itemImageInput = document.getElementById('item-image');
      const itemImageUrlInput = document.getElementById('item-image-url');
      const wishlistEl = document.getElementById('wishlist');
      const totalPriceEl = document.getElementById('total-price');
      const totalItemsEl = document.getElementById('total-items');

      // Elementos do Modal
      const modalOverlay = document.getElementById('edit-modal');
      const modalImgPreview = document.getElementById('modal-img-preview');
      const modalPriceInput = document.getElementById('modal-price');
      const modalPrioritySelect = document.getElementById('modal-priority');
      const modalProductUrlInput = document.getElementById('modal-product-url');
      const modalImageFileInput = document.getElementById('modal-image-file');
      const modalImageUrlInput = document.getElementById('modal-image-url');
      const modalCancelBtn = document.getElementById('modal-cancel');
      const modalSaveBtn = document.getElementById('modal-save');

      let currentEditingIndex = null;
      let currentBase64Image = '';
      let modalBase64Image = '';

      // Carrega itens salvos
      let items = JSON.parse(localStorage.getItem('wishlist_items')) || [];

      // Converte imagem do formulário principal para Base64
      itemImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            currentBase64Image = evt.target.result;
          };
          reader.readAsDataURL(file);
        }
      });

      // Converte imagem do modal para Base64
      modalImageFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            modalBase64Image = evt.target.result;
            modalImgPreview.src = modalBase64Image;
          };
          reader.readAsDataURL(file);
        }
      });

      // Atualiza o preview se o usuário digitar uma URL no modal
      modalImageUrlInput.addEventListener('input', (e) => {
        if (e.target.value.trim()) {
          modalImgPreview.src = e.target.value.trim();
        }
      });

      const saveItems = () => {
        localStorage.setItem('wishlist_items', JSON.stringify(items));
        render();
      };

      const render = () => {
        wishlistEl.innerHTML = '';
        let totalValue = 0;

        items.forEach((item, index) => {
          if (!item.completed) {
            totalValue += item.price;
          }

          const li = document.createElement('li');
          li.className = `item-card p-${item.priority}`;
          li.draggable = true;
          li.dataset.index = index;

          const priorityText = { '3': 'Alta', '2': 'Média', '1': 'Baixa' }[item.priority];
          const imgSrc = item.image || 'https://via.placeholder.com/48?text=🛍️';
          const hasCustomLink = Boolean(item.productUrl && item.productUrl.trim());

          li.innerHTML = `
            <div class="item-main">
              <span class="drag-handle">☰</span>
              <img src="${imgSrc}" class="item-thumb" alt="${item.name}" onerror="this.src='https://via.placeholder.com/48?text=🛍️'" />
              <div class="item-info">
                <span class="item-title ${item.completed ? 'completed' : ''}">${item.name}</span>
                <div class="item-details">
                  <span>R$ ${item.price.toFixed(2).replace('.', ',')}</span>
                  <span class="badge p-${item.priority}">${priorityText}</span>
                </div>
              </div>
            </div>
            <div class="actions">
              <button class="btn-action edit-btn" title="Editar item">✏️</button>
              <button class="btn-action shop-btn" title="Buscar no Google Shopping">🛒</button>
              <button class="btn-action link-btn ${hasCustomLink ? '' : 'disabled'}" title="${hasCustomLink ? 'Ir para a página do produto' : 'Nenhum link cadastrado'}">🔗</button>
              <button class="btn-action check-btn" title="Marcar como comprado">${item.completed ? '↩️' : '✅'}</button>
              <button class="btn-action delete-btn" title="Remover item">🗑️</button>
            </div>
          `;

          // --- EVENTOS DOS BOTÕES ---

          // Abrir Modal de Edição
          li.querySelector('.edit-btn').addEventListener('click', () => {
            currentEditingIndex = index;
            modalPriceInput.value = item.price;
            modalPrioritySelect.value = item.priority;
            modalProductUrlInput.value = item.productUrl || '';
            modalImgPreview.src = item.image || 'https://via.placeholder.com/48?text=🛍️';
            modalImageUrlInput.value = '';
            modalImageFileInput.value = '';
            modalBase64Image = '';
            modalOverlay.classList.add('active');
          });

          // Buscar no Google Shopping
          li.querySelector('.shop-btn').addEventListener('click', () => {
            const searchQuery = encodeURIComponent(item.name);
            window.open(`https://www.google.com/search?tbm=shop&q=${searchQuery}`, '_blank');
          });

          // Ir para o Link Próprio
          li.querySelector('.link-btn').addEventListener('click', () => {
            if (hasCustomLink) {
              let url = item.productUrl.trim();
              if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
              }
              window.open(url, '_blank');
            }
          });

          // Marcar como Comprado
          li.querySelector('.check-btn').addEventListener('click', () => {
            items[index].completed = !items[index].completed;
            saveItems();
          });

          // Deletar
          li.querySelector('.delete-btn').addEventListener('click', () => {
            items.splice(index, 1);
            saveItems();
          });

          // --- EVENTOS DE ARRASTAR E SOLTAR (DRAG & DROP) ---
          li.addEventListener('dragstart', (e) => {
            li.classList.add('dragging');
            e.dataTransfer.setData('text/plain', index);
          });

          li.addEventListener('dragend', () => {
            li.classList.remove('dragging');
          });

          li.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingItem = document.querySelector('.dragging');
            const siblings = [...wishlistEl.querySelectorAll('.item-card:not(.dragging)')];
            
            const nextSibling = siblings.find(sibling => {
              return e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2;
            });

            wishlistEl.insertBefore(draggingItem, nextSibling);
          });

          li.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedIdx = parseInt(e.dataTransfer.getData('text/plain'));
            const targetIdx = [...wishlistEl.children].indexOf(li);

            if (draggedIdx !== targetIdx && !isNaN(draggedIdx)) {
              const [movedItem] = items.splice(draggedIdx, 1);
              items.splice(targetIdx, 0, movedItem);
              saveItems();
            }
          });

          wishlistEl.appendChild(li);
        });

        totalPriceEl.textContent = `R$ ${totalValue.toFixed(2).replace('.', ',')}`;
        totalItemsEl.textContent = items.length;
      };

      // --- LÓGICA DO MODAL ---
      modalCancelBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
      });

      modalSaveBtn.addEventListener('click', () => {
        if (currentEditingIndex !== null) {
          const newPrice = parseFloat(modalPriceInput.value) || 0;
          const newPriority = parseInt(modalPrioritySelect.value);
          const newProductUrl = modalProductUrlInput.value.trim();
          const newImgUrl = modalImageUrlInput.value.trim();

          items[currentEditingIndex].price = newPrice;
          items[currentEditingIndex].priority = newPriority;
          items[currentEditingIndex].productUrl = newProductUrl;

          // Atualiza imagem caso tenha sido selecionado um arquivo ou inserido uma URL
          if (modalBase64Image) {
            items[currentEditingIndex].image = modalBase64Image;
          } else if (newImgUrl) {
            items[currentEditingIndex].image = newImgUrl;
          }

          modalOverlay.classList.remove('active');
          saveItems();
        }
      });

      // --- SUBMIT DO FORMULÁRIO ---
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = itemNameInput.value.trim();
        const price = parseFloat(itemPriceInput.value) || 0;
        const priority = parseInt(itemPrioritySelect.value);
        const productUrl = itemProductUrlInput.value.trim();
        const imageUrl = itemImageUrlInput.value.trim();

        if (!name) return;

        const finalImage = currentBase64Image || imageUrl || '';

        items.push({
          name,
          price,
          priority,
          productUrl,
          image: finalImage,
          completed: false
        });

        // Limpa o formulário
        itemNameInput.value = '';
        itemPriceInput.value = '';
        itemPrioritySelect.value = '2';
        itemProductUrlInput.value = '';
        itemImageInput.value = '';
        itemImageUrlInput.value = '';
        currentBase64Image = '';

        saveItems();
      });

      render();
    });