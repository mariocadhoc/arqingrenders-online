(function () {
    function initPaymentHistory() {
        const payments = window.payments;
        if (!payments || !Array.isArray(payments)) return;

        const totalAmountEl = document.getElementById('totalAmount');
        const statsGrid = document.getElementById('yearlyStats');
        const paymentsList = document.getElementById('paymentsList');
        const totalPaymentsEl = document.getElementById('totalPayments');
        const activeYearsEl = document.getElementById('activeYears');
        const paymentsTitleEl = document.querySelector('.payments-section h2');

        let activeYearFilter = null;

        const totalReceived = payments.reduce((s, p) => s + p.amount, 0);

        if (totalAmountEl) {
            totalAmountEl.textContent = totalReceived.toLocaleString();
        }

        const yearlyBreakdown = payments.reduce((acc, p) => {
            const year = p.date.split('-')[2];
            acc[year] = (acc[year] || 0) + p.amount;
            return acc;
        }, {});

        if (statsGrid && !document.getElementById('filterHint')) {
            const hint = document.createElement('div');
            hint.id = 'filterHint';
            hint.className = 'filter-hint';
            hint.innerHTML = `
                <div class="hint-line">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                    <span>Click a year to filter payments below</span>
                </div>
                <div class="hint-line">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="7" y1="17" x2="17" y2="7"></line>
                        <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                    <span>Click <strong>Google Drive</strong> to view that year's renders.</span>
                </div>
            `;
            statsGrid.parentNode.insertBefore(hint, statsGrid);
        }

        function renderStats() {
            if (!statsGrid) return;
            statsGrid.innerHTML = '';
            Object.entries(yearlyBreakdown)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .forEach(([year, amount]) => {
                    const pct = Math.round((amount / totalReceived) * 100);
                    const isActive = activeYearFilter === year;
                    const isDimmed = activeYearFilter !== null && !isActive;
                    
                    const driveUrl = (window.driveUrls && window.driveUrls[year]) ? window.driveUrls[year] : null;
                    const card = document.createElement('div');
                    card.className = `stat-card ${isActive ? 'active' : ''} ${isDimmed ? 'dimmed' : ''}`;
                    card.innerHTML = `
                        <div class="card-header">
                            <div class="year">📅 ${year}</div>
                            ${driveUrl ? `<a href="${driveUrl}" target="_blank" rel="noopener noreferrer" class="drive-link" title="Open Google Drive folder with renders for ${year}" onclick="event.stopPropagation();">📁 Google Drive ↗</a>` : ''}
                        </div>
                        <div class="amount">$${amount.toLocaleString()}</div>
                        <div class="percentage">${pct}% of total</div>
                    `;
                    card.addEventListener('click', () => {
                        activeYearFilter = activeYearFilter === year ? null : year;
                        renderStats();
                        renderPayments();
                    });
                    statsGrid.appendChild(card);
                });
        }

        function renderPayments() {
            if (!paymentsList) return;
            paymentsList.innerHTML = '';
            
            if (paymentsTitleEl) {
                if (activeYearFilter) {
                    paymentsTitleEl.innerHTML = `📊 Payment Details <span style="font-size: 0.75em; opacity: 0.7; margin-left: 0.5rem; font-weight: normal;">(Filtered by ${activeYearFilter})</span>`;
                } else {
                    paymentsTitleEl.innerHTML = `📊 Payment Details`;
                }
            }

            let filteredPayments = [...payments].sort((a, b) => {
                const pA = a.date.split('-');
                const pB = b.date.split('-');
                // sorting descending: newest to oldest
                return (pB[2] + pB[0] + pB[1]).localeCompare(pA[2] + pA[0] + pA[1]);
            });
            
            if (activeYearFilter) {
                filteredPayments = filteredPayments.filter(p => p.date.split('-')[2] === activeYearFilter);
            }

            if (filteredPayments.length === 0) {
                 paymentsList.innerHTML = '<div style="color: rgba(232, 229, 240, 0.6); padding: 1rem;">No payments found.</div>';
                 return;
            }

            filteredPayments.forEach(p => {
                paymentsList.innerHTML += `
                    <div class="payment-item">
                        <div>
                            <div class="payment-date">${p.date}</div>
                            <div class="payment-concept">${p.concept}</div>
                        </div>
                        <div class="payment-amount">$${p.amount.toLocaleString()}</div>
                    </div>`;
            });
        }

        renderStats();
        renderPayments();

        if (totalPaymentsEl) {
            totalPaymentsEl.textContent = payments.length;
        }

        if (activeYearsEl) {
            activeYearsEl.textContent = Object.keys(yearlyBreakdown).length;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPaymentHistory);
    } else {
        initPaymentHistory();
    }
})();
