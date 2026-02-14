// Configurações
const WHATSAPP_NUMBER = '5561992286508';

// Variáveis Globais
let storeName = '';
let sales = [];
let currentPayment = 'pix';
let currentFilter = 'all';

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    loadData();
});

// Relógio em Tempo Real
function initClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    const dateString = now.toLocaleDateString('pt-BR');

    const clockElement = document.getElementById('liveClock');
    if (clockElement) {
        clockElement.textContent = timeString;
        clockElement.title = dateString;
    }

    // Atualiza datas nos recibos
    document.getElementById('receiptDate').textContent = now.toLocaleString('pt-BR');
    document.getElementById('orderReceiptDate').textContent = now.toLocaleString('pt-BR');
}

// Carregar Dados
function loadData() {
    const saved = localStorage.getItem('caixaData');
    if (saved) {
        const data = JSON.parse(saved);
        storeName = data.storeName || '';
        sales = data.sales || [];

        if (storeName) {
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            initApp();
        }
    }
}

// Salvar Dados
function saveData() {
    localStorage.setItem('caixaData', JSON.stringify({ 
        storeName, 
        sales,
        lastUpdate: new Date().toISOString()
    }));
}

// Inicializar App
function initApp() {
    document.getElementById('storeNameDisplay').textContent = storeName;
    document.getElementById('receiptStoreName').textContent = storeName.toUpperCase();
    document.getElementById('orderReceiptStore').textContent = storeName.toUpperCase();

    updateStats();
    updateReceiptPreview();
    renderHistory();

    // Animação de entrada
    document.querySelectorAll('.slide-up').forEach((el, index) => {
        setTimeout(() => {
            el.style.opacity = '1';
        }, index * 100);
    });
}

// Login
function startStore() {
    const name = document.getElementById('storeNameInput').value.trim();
    if (!name) {
        showNotification('Digite o nome do estabelecimento!', 'error');
        return;
    }

    storeName = name;
    saveData();

    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    initApp();

    showNotification('Caixa aberto com sucesso!', 'success');
}

// Navegação entre Tabs
function switchTab(tab) {
    // Esconder todos os conteúdos
    ['Sales', 'Orders', 'History'].forEach(t => {
        document.getElementById('content' + t).classList.add('hidden');
        document.getElementById('tab' + t).classList.remove('tab-active');
        document.getElementById('tab' + t).classList.add('text-gray-500');
    });

    // Mostrar tab selecionada
    document.getElementById('content' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove('hidden');
    document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('tab-active');
    document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove('text-gray-500');

    // Animação de transição
    const content = document.getElementById('content' + tab.charAt(0).toUpperCase() + tab.slice(1));
    content.classList.add('fade-in');
    setTimeout(() => content.classList.remove('fade-in'), 500);
}

// Seleção de Pagamento
function selectPayment(method) {
    currentPayment = method;

    // Resetar todos os botões
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.remove('border-green-500', 'border-red-500', 'border-blue-500', 'border-yellow-500');
        btn.classList.remove('bg-green-50', 'bg-red-50', 'bg-blue-50', 'bg-yellow-50');
        btn.classList.remove('text-green-700', 'text-red-700', 'text-blue-700', 'text-yellow-700');
        btn.classList.add('border-gray-200', 'text-gray-600');
    });

    // Destacar botão selecionado
    const colors = {
        pix: ['border-green-500', 'bg-green-50', 'text-green-700'],
        credit: ['border-red-500', 'bg-red-50', 'text-red-700'],
        debit: ['border-blue-500', 'bg-blue-50', 'text-blue-700'],
        cash: ['border-yellow-500', 'bg-yellow-50', 'text-yellow-700']
    };

    const btn = document.getElementById('btn' + method.charAt(0).toUpperCase() + method.slice(1));
    btn.classList.remove('border-gray-200', 'text-gray-600');
    btn.classList.add(...colors[method]);

    updateReceiptPreview();
}

// Atualizar Preview do Recibo
function updateReceiptPreview() {
    const product = document.getElementById('saleProduct').value || 'Produto';
    const value = parseFloat(document.getElementById('saleValue').value) || 0;
    const qty = parseInt(document.getElementById('saleQty').value) || 1;
    const total = value * qty;

    const paymentNames = { 
        pix: 'PIX', 
        credit: 'Cartão de Crédito', 
        debit: 'Cartão de Débito', 
        cash: 'Dinheiro' 
    };

    const itemsHtml = value > 0 ? `
        <div class="flex justify-between items-start py-2 border-b border-dashed border-gray-200">
            <div>
                <p class="font-medium">${qty}x ${product}</p>
                <p class="text-xs text-gray-500">${paymentNames[currentPayment]}</p>
            </div>
            <p class="font-bold">${formatCurrency(total)}</p>
        </div>
    ` : '<p class="text-center text-gray-400 italic py-8">Nenhum item</p>';

    document.getElementById('receiptItems').innerHTML = itemsHtml;
    document.getElementById('receiptTotal').textContent = formatCurrency(total);
    document.getElementById('receiptPayment').textContent = value > 0 
        ? `Pagamento: ${paymentNames[currentPayment]}` 
        : '-';
}

// Adicionar Venda
function addSale() {
    const product = document.getElementById('saleProduct').value.trim();
    const value = parseFloat(document.getElementById('saleValue').value);
    const qty = parseInt(document.getElementById('saleQty').value) || 1;

    if (!product || !value || value <= 0) {
        showNotification('Preencha o produto e o valor!', 'error');
        return;
    }

    const sale = {
        id: Date.now(),
        date: new Date().toISOString(),
        product,
        value: value * qty,
        qty,
        payment: currentPayment
    };

    sales.unshift(sale);
    saveData();

    // Resetar formulário
    document.getElementById('saleProduct').value = '';
    document.getElementById('saleValue').value = '';
    document.getElementById('saleQty').value = '1';

    // Atualizar interface
    updateStats();
    updateReceiptPreview();
    renderHistory();

    showNotification('Venda registrada com sucesso!', 'success');

    // Efeito visual no card
    const card = document.querySelector('.stats-card');
    card.style.transform = 'scale(1.05)';
    setTimeout(() => card.style.transform = '', 200);
}

// Atualizar Estatísticas
function updateStats() {
    const today = new Date().toDateString();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Totais por forma de pagamento (hoje)
    const todayStats = {
        pix: { total: 0, count: 0 },
        credit: { total: 0, count: 0 },
        debit: { total: 0, count: 0 },
        cash: { total: 0, count: 0 }
    };

    let todayTotal = 0;
    let todayCount = 0;
    let monthTotal = 0;
    let allTotal = 0;

    sales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const value = sale.value;

        allTotal += value;

        if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
            monthTotal += value;
        }

        if (saleDate.toDateString() === today) {
            todayTotal += value;
            todayCount++;

            if (todayStats[sale.payment]) {
                todayStats[sale.payment].total += value;
                todayStats[sale.payment].count++;
            }
        }
    });

    // Atualizar cards principais
    document.getElementById('todayTotal').textContent = formatCurrency(todayTotal);
    document.getElementById('todayCount').textContent = `${todayCount} vendas hoje`;

    document.getElementById('pixTotal').textContent = formatCurrency(todayStats.pix.total);
    document.getElementById('pixCount').textContent = `${todayStats.pix.count} transações`;

    const cardTotal = todayStats.credit.total + todayStats.debit.total;
    const cardCount = todayStats.credit.count + todayStats.debit.count;
    document.getElementById('cardTotal').textContent = formatCurrency(cardTotal);
    document.getElementById('cardCount').textContent = `${cardCount} transações`;

    document.getElementById('cashTotal').textContent = formatCurrency(todayStats.cash.total);
    document.getElementById('cashCount').textContent = `${todayStats.cash.count} transações`;

    // Atualizar detalhamento
    document.getElementById('detailPix').textContent = formatCurrency(todayStats.pix.total);
    document.getElementById('detailCredit').textContent = formatCurrency(todayStats.credit.total);
    document.getElementById('detailDebit').textContent = formatCurrency(todayStats.debit.total);
    document.getElementById('detailCash').textContent = formatCurrency(todayStats.cash.total);

    // Atualizar totais gerais (cards inferiores)
    document.getElementById('monthTotal').textContent = formatCurrency(monthTotal);
    document.getElementById('allTimeTotal').textContent = formatCurrency(allTotal);
    document.getElementById('monthCount').textContent = `${sales.filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length} vendas este mês`;
    document.getElementById('allTimeCount').textContent = `${sales.length} vendas no total`;
}

// Pedidos - Adicionar Campo de Item
function addOrderItemField() {
    const container = document.getElementById('orderItemsContainer');
    const div = document.createElement('div');
    div.className = 'flex gap-2 slide-right';
    div.innerHTML = `
        <input type="text" class="order-item-input flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition" 
            placeholder="Ex: 1x Refrigerante 2L">
        <button onclick="removeOrderItemField(this)" class="text-red-500 hover:text-red-700 px-3 transition hover:scale-110">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(div);
}

// Pedidos - Remover Campo
function removeOrderItemField(btn) {
    btn.parentElement.remove();
}

// Gerar Recibo do Pedido
function generateOrderReceipt() {
    const client = document.getElementById('orderClient').value.trim();
    const phone = document.getElementById('orderPhone').value.trim();
    const notes = document.getElementById('orderNotes').value.trim();

    const items = [];
    document.querySelectorAll('#orderItemsContainer input').forEach(input => {
        if (input.value.trim()) items.push(input.value.trim());
    });

    if (!client || items.length === 0) {
        showNotification('Digite o nome do cliente e pelo menos um item!', 'error');
        return;
    }

    document.getElementById('orderReceiptClient').textContent = client;
    document.getElementById('orderReceiptPhone').textContent = phone || 'Sem telefone';
    document.getElementById('orderReceiptNotes').textContent = notes || 'Nenhuma observação';
    document.getElementById('orderReceiptDate').textContent = new Date().toLocaleString('pt-BR');

    document.getElementById('orderReceiptItems').innerHTML = items.map((item, i) => `
        <div class="flex items-start py-1 border-b border-dashed border-gray-100">
            <span class="text-gray-400 mr-2 w-4">${i + 1}.</span>
            <span class="font-medium flex-1">${item}</span>
        </div>
    `).join('');

    showNotification('Recibo do pedido gerado!', 'success');
}

// Enviar Recibo por WhatsApp (como foto)
async function sendReceiptWhatsApp() {
    const receipt = document.getElementById('receiptContainer');

    try {
        const canvas = await html2canvas(receipt, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
        });

        const imageData = canvas.toDataURL('image/png');

        // Converter para blob
        const response = await fetch(imageData);
        const blob = await response.blob();
        const file = new File([blob], 'recibo.png', { type: 'image/png' });

        // Tentar compartilhamento nativo (mobile)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Recibo - ' + storeName,
                    text: 'Segue o recibo:'
                });
                showNotification('Recibo enviado!', 'success');
            } catch (err) {
                fallbackSendImage(imageData, 'recibo');
            }
        } else {
            fallbackSendImage(imageData, 'recibo');
        }
    } catch (err) {
        console.error(err);
        showNotification('Erro ao gerar imagem', 'error');
    }
}

// Enviar Pedido por WhatsApp (como foto)
async function sendOrderWhatsApp() {
    const receipt = document.getElementById('orderReceiptContainer');

    if (document.getElementById('orderReceiptClient').textContent === '-') {
        showNotification('Gere o recibo do pedido primeiro!', 'error');
        return;
    }

    try {
        const canvas = await html2canvas(receipt, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
        });

        const imageData = canvas.toDataURL('image/png');
        const response = await fetch(imageData);
        const blob = await response.blob();
        const file = new File([blob], 'pedido.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Pedido - ' + storeName,
                    text: 'Novo pedido:'
                });
                showNotification('Pedido enviado!', 'success');
            } catch (err) {
                fallbackSendImage(imageData, 'pedido');
            }
        } else {
            fallbackSendImage(imageData, 'pedido');
        }
    } catch (err) {
        console.error(err);
        showNotification('Erro ao gerar imagem', 'error');
    }
}

// Fallback para envio de imagem
function fallbackSendImage(imageData, type) {
    // Baixar imagem
    const link = document.createElement('a');
    link.download = type + '.png';
    link.href = imageData;
    link.click();

    // Abrir WhatsApp
    setTimeout(() => {
        const message = type === 'recibo' 
            ? `Olá! Segue o recibo de compra em ${storeName}.` 
            : `Olá! Segue o pedido para ${storeName}.`;

        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');

        showNotification('Imagem baixada! Anexe no WhatsApp.', 'success');
    }, 500);
}

// Imprimir Recibo
function printReceipt() {
    const receipt = document.getElementById('receiptContainer').cloneNode(true);
    const printSection = document.getElementById('printSection');
    printSection.innerHTML = '';
    printSection.appendChild(receipt);
    printSection.classList.remove('hidden');
    window.print();
    printSection.classList.add('hidden');
}

// Imprimir Recibo do Pedido
function printOrderReceipt() {
    const receipt = document.getElementById('orderReceiptContainer').cloneNode(true);
    const printSection = document.getElementById('printSection');
    printSection.innerHTML = '';
    printSection.appendChild(receipt);
    printSection.classList.remove('hidden');
    window.print();
    printSection.classList.add('hidden');
}

// Renderizar Histórico
function renderHistory(filter = 'all') {
    currentFilter = filter;
    const tbody = document.getElementById('historyTable');
    const empty = document.getElementById('emptyHistory');

    let filteredSales = sales;

    if (filter === 'today') {
        const today = new Date().toDateString();
        filteredSales = sales.filter(s => new Date(s.date).toDateString() === today);
    } else if (filter === 'pix') {
        filteredSales = sales.filter(s => s.payment === 'pix');
    } else if (filter === 'credit') {
        filteredSales = sales.filter(s => s.payment === 'credit');
    } else if (filter === 'debit') {
        filteredSales = sales.filter(s => s.payment === 'debit');
    } else if (filter === 'cash') {
        filteredSales = sales.filter(s => s.payment === 'cash');
    }

    // Atualizar botões de filtro
    document.getElementById('filterAll').className = filter === 'all' 
        ? 'px-4 py-2 rounded-lg bg-purple-100 text-purple-700 transition text-sm font-medium' 
        : 'px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-sm font-medium';
    document.getElementById('filterToday').className = filter === 'today' 
        ? 'px-4 py-2 rounded-lg bg-purple-100 text-purple-700 transition text-sm font-medium' 
        : 'px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-sm font-medium';

    if (filteredSales.length === 0) {
        tbody.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');

    const colors = { 
        pix: 'text-green-600 bg-green-100', 
        credit: 'text-red-600 bg-red-100', 
        debit: 'text-blue-600 bg-blue-100', 
        cash: 'text-yellow-600 bg-yellow-100' 
    };
    const names = { 
        pix: 'PIX', 
        credit: 'Crédito', 
        debit: 'Débito', 
        cash: 'Dinheiro' 
    };

    tbody.innerHTML = filteredSales.map(sale => `
        <tr class="hover:bg-gray-50 transition cursor-pointer" onclick="showSaleDetails(${sale.id})">
            <td class="px-4 py-3 text-sm text-gray-600">
                ${new Date(sale.date).toLocaleDateString('pt-BR')}<br>
                <span class="text-xs text-gray-400">${new Date(sale.date).toLocaleTimeString('pt-BR')}</span>
            </td>
            <td class="px-4 py-3 text-sm font-medium">${sale.product}</td>
            <td class="px-4 py-3 text-sm font-bold">${formatCurrency(sale.value)}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${colors[sale.payment]}">
                    ${names[sale.payment]}
                </span>
            </td>
            <td class="px-4 py-3 text-center">
                <button onclick="event.stopPropagation(); deleteSale(${sale.id})" class="text-red-500 hover:text-red-700 transition hover:scale-110">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Filtrar por forma de pagamento (clicando nos cards)
function filterByPayment(method) {
    switchTab('history');
    renderHistory(method);
}

// Filtrar histórico
function filterHistory(type) {
    renderHistory(type);
}

// Excluir Venda
function deleteSale(id) {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) return;

    sales = sales.filter(s => s.id !== id);
    saveData();
    updateStats();
    renderHistory(currentFilter);
    showNotification('Venda excluída!', 'success');
}

// Exportar Dados
function exportData() {
    const csv = [
        ['Data', 'Produto', 'Quantidade', 'Valor Total', 'Forma de Pagamento'].join(';'),
        ...sales.map(s => [
            new Date(s.date).toLocaleString('pt-BR'),
            s.product,
            s.qty,
            s.value.toFixed(2).replace('.', ','),
            s.payment
        ].join(';'))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vendas_${storeName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showNotification('Dados exportados!', 'success');
}

// Fechamento de Caixa
function closeCashier() {
    const today = new Date().toDateString();
    const totals = { pix: 0, credit: 0, debit: 0, cash: 0 };

    sales.forEach(s => {
        if (new Date(s.date).toDateString() === today) {
            totals[s.payment] += s.value;
        }
    });

    const total = totals.pix + totals.credit + totals.debit + totals.cash;

    document.getElementById('closePix').textContent = formatCurrency(totals.pix);
    document.getElementById('closeCredit').textContent = formatCurrency(totals.credit);
    document.getElementById('closeDebit').textContent = formatCurrency(totals.debit);
    document.getElementById('closeCash').textContent = formatCurrency(totals.cash);
    document.getElementById('closeTotal').textContent = formatCurrency(total);

    document.getElementById('closeModal').classList.remove('hidden');
}

function cancelClose() {
    document.getElementById('closeModal').classList.add('hidden');
}

function confirmClose() {
    const today = new Date().toDateString();
    const totals = { pix: 0, credit: 0, debit: 0, cash: 0 };
    let count = 0;

    sales.forEach(s => {
        if (new Date(s.date).toDateString() === today) {
            totals[s.payment] += s.value;
            count++;
        }
    });

    const total = totals.pix + totals.credit + totals.debit + totals.cash;

    const message = `*Fechamento de Caixa - ${storeName}*\n\n` +
        `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n` +
        `📊 Total de vendas: ${count}\n\n` +
        `💰 *Resumo Financeiro:*\n` +
        `• PIX: ${formatCurrency(totals.pix)}\n` +
        `• Cartão Crédito: ${formatCurrency(totals.credit)}\n` +
        `• Cartão Débito: ${formatCurrency(totals.debit)}\n` +
        `• Dinheiro: ${formatCurrency(totals.cash)}\n\n` +
        `*TOTAL DO DIA: ${formatCurrency(total)}*\n\n` +
        `_Sistema de Caixa_`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    document.getElementById('closeModal').classList.add('hidden');

    showNotification('Fechamento enviado!', 'success');
}

// Utilitários
function formatCurrency(value) {
    return 'R$ ' + parseFloat(value).toFixed(2).replace('.', ',');
}

function showNotification(message, type = 'success') {
    // Remover notificações anteriores
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const div = document.createElement('div');
    div.className = `notification fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg z-50 transform transition-all duration-300 translate-y-20 ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white flex items-center gap-2`;

    div.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(div);

    // Animar entrada
    requestAnimationFrame(() => {
        div.classList.remove('translate-y-20');
    });

    // Remover após 3 segundos
    setTimeout(() => {
        div.classList.add('translate-y-20');
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

// Event Listeners para Preview do Recibo
document.addEventListener('DOMContentLoaded', () => {
    ['saleProduct', 'saleValue', 'saleQty'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateReceiptPreview);
        }
    });
});
