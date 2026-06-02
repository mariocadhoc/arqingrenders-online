const payments = [
    { date: '07-10-2025',  amount: 1050, concept: 'New View + Eataly Caffe' },
    { date: '07-15-2025',  amount: 0,    concept: 'Changes // 2 Set of changes // Included' },
    { date: '11-11-2025', amount: 368,  concept: 'Changes // Wells Fargo GF | 35%' },
    { date: '11-13-2025', amount: 184,  concept: 'Changes // Wells Fargo - No Canopy | 17.5%' },
    { date: '02-20-2026',  amount: 368,  concept: 'Changes // Chase Bank // 35%' },
    { date: '03-19-2026',  amount: 735,  concept: 'Changes // 2 Images // Marine Layer // 35%' },
    { date: '03-25-2026',  amount: 47,   concept: 'Currency exchange rate update | 18.50 (17.74) = 4.23%' },
    { date: '04-07-2026',   amount: 368,  concept: 'Changes // La Cabra + Thisbowl + Fleet Feet // 35%' },
    { date: '04-09-2026',   amount: 184,  concept: 'Changes // Fjallraven + Theory // 17.5%' },
    { date: '04-09-2026',   amount: 38,   concept: 'Currency exchange rate update | 18.50 (17.30) = 6.94%' },
    { date: '05-28-2026',  amount: 0,    concept: 'Changes // Garrett Leight // Colors' },
];

const totalReceived = payments.reduce((s, p) => s + p.amount, 0);

document.getElementById('totalAmount').textContent = totalReceived.toLocaleString();

const yearlyBreakdown = payments.reduce((acc, p) => {
    const year = p.date.split('-')[2];
    acc[year] = (acc[year] || 0) + p.amount;
    return acc;
}, {});

const statsGrid = document.getElementById('yearlyStats');
Object.entries(yearlyBreakdown).sort().forEach(([year, amount]) => {
    const pct = Math.round((amount / totalReceived) * 100);
    statsGrid.innerHTML += `
        <div class="stat-card">
            <div class="year">📅 ${year}</div>
            <div class="amount">$${amount.toLocaleString()}</div>
            <div class="percentage">${pct}% of total</div>
        </div>`;
});

const paymentsList = document.getElementById('paymentsList');
payments.forEach(p => {
    paymentsList.innerHTML += `
        <div class="payment-item">
            <div>
                <div class="payment-date">${p.date}</div>
                <div class="payment-concept">${p.concept}</div>
            </div>
            <div class="payment-amount">$${p.amount.toLocaleString()}</div>
        </div>`;
});

document.getElementById('totalPayments').textContent = payments.length;
document.getElementById('activeYears').textContent = Object.keys(yearlyBreakdown).length;