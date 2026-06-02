const payments = [
    { date: '03-04-2020', amount: 1430, concept: '2 Renderings // $715x2' },
    { date: '03-04-2020', amount: 250, concept: 'Extras - 17.5%' },

    { date: '02-26-2021', amount: 629, concept: '2 Changes // Night' },

    { date: '03-12-2022', amount: 899, concept: '1 Rendering // Weekend' },
    { date: '03-14-2022', amount: 268, concept: '1 Change' },
    { date: '05-26-2022', amount: 268, concept: '1 Change' },

    { date: '11-01-2023', amount: 3560, concept: '4 Renderings' },
    { date: '11-01-2023', amount: 178, concept: '5% // Currency exchange rate update' },
    { date: '11-07-2023', amount: 981, concept: 'Changes // 35% x 3 Images + 5%' },
    { date: '12-05-2023', amount: 935, concept: '1 Extra Rendering // 2x5K Images NO CHARGE' },
    { date: '12-16-2023', amount: 2136, concept: '2 Extra Renderings // Weekend 20%' },

    { date: '01-11-2024', amount: 665, concept: 'Changes // 35% Rogers + Aerial' },
    { date: '01-17-2024', amount: 1900, concept: '2 Renderings // Veronicas x2' },
    { date: '01-29-2024', amount: 1900, concept: '2 Renderings // Church Interior + Facade' },
    { date: '01-29-2024', amount: 665, concept: 'Changes // 35% - 2 Interiors' },
    { date: '07-08-2024', amount: 693, concept: 'Changes // 35% - 2 Exteriors' },
    { date: '11-25-2024', amount: 396, concept: '2 Changes // 2 Renderings // 20%' },

    { date: '04-29-2025', amount: 1528, concept: '360° Tour // Church Interior' },
    { date: '10-23-2025', amount: 3535, concept: '1st Payment - Partial' },
    { date: '11-13-2025', amount: 718, concept: '2nd Payment - Cleared' }
];

const totalReceived = payments.reduce((s,p)=>s+p.amount,0);

const yearlyBreakdown = payments.reduce((acc,p)=>{
    const year = p.date.split('-')[2];
    acc[year] = (acc[year]||0) + p.amount;
    return acc;
},{});

// Render yearly cards
const statsGrid = document.getElementById("yearlyStats");
Object.entries(yearlyBreakdown).sort().forEach(([year, amount])=>{
    const pct = Math.round((amount/totalReceived)*100);
    statsGrid.innerHTML += `
        <div class="stat-card">
            <div class="year">📅 ${year}</div>
            <div class="amount">$${amount.toLocaleString()}</div>
            <div class="percentage">${pct}% of total</div>
        </div>`;
});

// Render payments list
const paymentsList = document.getElementById("paymentsList");
payments.forEach(p=>{
    paymentsList.innerHTML += `
        <div class="payment-item">
            <div>
                <div class="payment-date">${p.date}</div>
                <div class="payment-concept">${p.concept}</div>
            </div>
            <div class="payment-amount">$${p.amount.toLocaleString()}</div>
        </div>`;
});

// Summary
document.getElementById("totalPayments").textContent = payments.length;
document.getElementById("activeYears").textContent = Object.keys(yearlyBreakdown).length;