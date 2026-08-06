let listElement = document.querySelector('.list');
let textElement = document.querySelector('input');
let buttonElement = document.querySelector('.btn-add');

let arr = [
    'Fazer um café',
    'Pagar as contas',
    'Ir descansar',
];

let dragIndex = null;
let dropIndex = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let dragCard = null;

const trashIconSVG = `
    <svg class="btn-delete__icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <g transform="translate(4.16665 2.75)">
            <path d="M13.5 6.41667V15.8611C13.5 16.9043 12.6543 17.75 11.6111 17.75H4.05557C3.01236 17.75 2.16668 16.9043 2.16668 15.8611V6.41667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5.94444 7.36111V13.9722" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9.72223 7.36111V13.9722" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14.9167 3.58334H0.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M11.6111 3.58333L11.0973 2.042C10.8403 1.27031 10.1181 0.749807 9.30477 0.750001H6.36188C5.54782 0.748993 4.82468 1.26965 4.56744 2.042L4.05555 3.58333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
    </svg>
`;

const gripIconSVG = `
    <svg class="list-item__grip-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 6a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-6 0a1 1 0 1 1-2 0a1 1 0 0 1 2 0m6 12a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0-6a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-6 6a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0-6a1 1 0 1 1-2 0a1 1 0 0 1 2 0"/>
    </svg>
`;

function clearDragState() {
    if (dragCard && dragCard.parentNode) {
        dragCard.parentNode.removeChild(dragCard);
    }

    dragCard = null;
    dragIndex = null;
    dropIndex = null;

    document.body.classList.remove('is-sorting');
    listElement.querySelectorAll('.is-placeholder, .is-drop-target').forEach(function (el) {
        el.classList.remove('is-placeholder', 'is-drop-target');
    });
}

function moveDragCard(clientX, clientY) {
    if (!dragCard) return;
    dragCard.style.left = (clientX - dragOffsetX) + 'px';
    dragCard.style.top = (clientY - dragOffsetY) + 'px';
}

function updateDropTarget(clientY) {
    var items = Array.from(listElement.querySelectorAll('li'));

    items.forEach(function (item) {
        item.classList.remove('is-drop-target');
    });

    dropIndex = items.length;

    for (var i = 0; i < items.length; i++) {
        var rect = items[i].getBoundingClientRect();
        if (clientY < rect.top + rect.height / 2) {
            dropIndex = i;
            break;
        }
    }

    if (dropIndex < items.length && dropIndex !== dragIndex) {
        items[dropIndex].classList.add('is-drop-target');
    } else if (dropIndex === items.length && dragIndex !== items.length - 1) {
        items[items.length - 1].classList.add('is-drop-target');
    }
}

function finishDrag() {
    if (dragIndex === null) {
        clearDragState();
        return;
    }

    var to = dropIndex === null ? dragIndex : dropIndex;
    var shouldMove = to !== dragIndex && to !== dragIndex + 1;

    if (shouldMove) {
        var movedItem = arr.splice(dragIndex, 1)[0];
        var insertAt = to > dragIndex ? to - 1 : to;
        arr.splice(insertAt, 0, movedItem);
    }

    clearDragState();
    renderTodo();
}

function startDrag(liElement, index, event) {
    var rect = liElement.getBoundingClientRect();

    dragIndex = index;
    dropIndex = index;
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;

    dragCard = liElement.cloneNode(true);
    dragCard.classList.add('list-item--dragging-card');
    dragCard.classList.remove('is-placeholder', 'is-drop-target', 'is-entering', 'is-leaving');
    dragCard.style.width = rect.width + 'px';
    document.body.appendChild(dragCard);

    liElement.classList.add('is-placeholder');
    document.body.classList.add('is-sorting');

    moveDragCard(event.clientX, event.clientY);
}

function createTodoItem(item, index) {
    var liElement = document.createElement('li');

    var content = document.createElement('div');
    content.className = 'list-item__content';

    var grip = document.createElement('span');
    grip.className = 'list-item__grip';
    grip.setAttribute('aria-hidden', 'true');
    grip.innerHTML = gripIconSVG;

    var text = document.createElement('span');
    text.className = 'list-item__text';
    text.textContent = item;

    content.appendChild(grip);
    content.appendChild(text);

    var deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn-delete';
    deleteButton.setAttribute('aria-label', 'Excluir');
    deleteButton.innerHTML = trashIconSVG + '<span>Excluir</span>';
    deleteButton.addEventListener('click', function (event) {
        event.stopPropagation();
        deleteItem(index, liElement);
    });

    liElement.appendChild(content);
    liElement.appendChild(deleteButton);

    liElement.addEventListener('pointerdown', function (event) {
        if (event.button !== 0) return;
        if (event.target.closest('.btn-delete')) return;

        event.preventDefault();
        liElement.setPointerCapture(event.pointerId);
        startDrag(liElement, index, event);
    });

    liElement.addEventListener('pointermove', function (event) {
        if (dragIndex === null || !dragCard) return;
        moveDragCard(event.clientX, event.clientY);
        updateDropTarget(event.clientY);
    });

    liElement.addEventListener('pointerup', function () {
        if (dragIndex === null) return;
        finishDrag();
    });

    liElement.addEventListener('pointercancel', function () {
        clearDragState();
        renderTodo();
    });

    return liElement;
}

function renderTodo() {
    listElement.innerHTML = '';

    arr.forEach(function (item, index) {
        listElement.appendChild(createTodoItem(item, index));
    });
}

let tipElement = document.getElementById('tip');
let tipTimer = null;

const tipIcons = {
    success: `
        <svg class="tip__icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <g fill="none" stroke="currentColor" stroke-width="1">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10s10-4.477 10-10Z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="m8 12.5l2.5 2.5L16 9"/>
            </g>
        </svg>
    `,
    error: `
        <svg class="tip__icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10s10-4.477 10-10m-7 3L9 9m0 6l6-6"/>
        </svg>
    `,
};

function showTip(type, itemName) {
    if (tipTimer) {
        clearTimeout(tipTimer);
        tipTimer = null;
    }

    var safeName = itemName || 'Item';
    var message = type === 'success'
        ? 'O Item <span class="tip__item-name">' + escapeHtml(safeName) + '</span> foi adicionado à lista com sucesso!'
        : 'O Item <span class="tip__item-name">' + escapeHtml(safeName) + '</span> foi excluído da lista';

    tipElement.className = 'tip tip--' + type;
    tipElement.innerHTML = tipIcons[type] + '<p class="tip__text">' + message + '</p>';
    tipElement.hidden = false;

    // Reinicia o fade-in mesmo se já estiver visível
    tipElement.classList.remove('is-visible');
    void tipElement.offsetWidth;
    tipElement.classList.add('is-visible');

    tipTimer = setTimeout(function () {
        tipElement.classList.remove('is-visible');

        tipTimer = setTimeout(function () {
            tipElement.hidden = true;
            tipElement.innerHTML = '';
            tipTimer = null;
        }, 300);
    }, 4000);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function addItem() {
    var itemTexto = textElement.value.trim();
    if (!itemTexto) return;

    arr.push(itemTexto);
    textElement.value = '';

    var index = arr.length - 1;
    var liElement = createTodoItem(itemTexto, index);
    liElement.classList.add('is-entering');
    listElement.appendChild(liElement);

    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            liElement.classList.remove('is-entering');
        });
    });

    showTip('success', itemTexto);
}

function deleteItem(pos, liElement) {
    if (liElement.classList.contains('is-leaving')) return;

    var itemName = arr[pos];
    liElement.classList.add('is-leaving');

    liElement.addEventListener('transitionend', function onLeave(event) {
        if (event.target !== liElement) return;
        if (event.propertyName !== 'opacity') return;

        liElement.removeEventListener('transitionend', onLeave);
        arr.splice(pos, 1);
        renderTodo();
        showTip('error', itemName);
    });
}

renderTodo();

buttonElement.addEventListener('click', addItem);
