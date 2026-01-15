// --- CONFIGURACIÓN FIREBASE ---
// IMPORTANTE: Reemplaza este objeto con la configuración de tu proyecto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBU75dmHvzEfDrdkscUbOL2DtaUyBbdNzM",
    authDomain: "ere26-32277.firebaseapp.com",
    projectId: "ere26-32277",
    storageBucket: "ere26-32277.appspot.com",
    messagingSenderId: "958947155278",
    appId: "1:958947155278:web:1f88cde6793db4400f121f"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let comparisonChart = null; // Variable global para la instancia del gráfico
let lastSimulationData = []; // Variable para almacenar los datos de la última simulación

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuario logueado, inicializar funcionalidad de la página
            const btnCalculate = document.getElementById('btn-calculate-pension');
            if (btnCalculate) {
                btnCalculate.addEventListener('click', () => runComparison(user));
            }

            // Listeners para exportación
            const btnExcel = document.getElementById('btn-export-excel');
            const btnPdf = document.getElementById('btn-export-pdf');
            if (btnExcel) {
                btnExcel.addEventListener('click', exportToCSV);
            }
            if (btnPdf) {
                btnPdf.addEventListener('click', () => window.print());
            }

            // Auto-rellenar fecha B = Fecha A + 2 años
            const dateA = document.getElementById('opt1-pension-fecha');
            const dateB = document.getElementById('opt2-pension-fecha');
            if (dateA && dateB) {
                dateA.addEventListener('change', () => {
                    if (dateA.value) {
                        const d = new Date(dateA.value);
                        d.setFullYear(d.getFullYear() + 2);
                        dateB.value = d.toISOString().split('T')[0];
                    }
                });
            }
        } else {
            // Si no hay usuario, redirigir a la página de login
            console.log('Usuario no autenticado, redirigiendo a login...');
            window.location.href = 'index.html';
        }
    });
});

async function runComparison(user) {
    const resultsContainer = document.getElementById('comparison-results-container');
    resultsContainer.innerHTML = '<p style="padding: 2rem; text-align: center;">Calculando...</p>';

    // 1. Obtener fecha de nacimiento del usuario desde Firestore
    let birthDate;
    try {
        const userDoc = await db.collection('empleados').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().nacimiento) {
            birthDate = new Date(userDoc.data().nacimiento);
        } else {
            resultsContainer.innerHTML = `<p class="error-msg" style="display:block; padding: 2rem;">No se encontró tu fecha de nacimiento. Por favor, ve a "Datos Personales" en la página principal y añádela.</p>`;
            return;
        }
    } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        resultsContainer.innerHTML = `<p class="error-msg" style="display:block; padding: 2rem;">Error al cargar tus datos. Inténtalo de nuevo.</p>`;
        return;
    }
    
    const maxDate = new Date(birthDate);
    maxDate.setFullYear(birthDate.getFullYear() + 100); // Límite extendido hasta los 100 años

    // 2. Obtener valores de los inputs
    const getVal = id => document.getElementById(id).value;
    const getNum = id => parseFloat(getVal(id)) || 0;

    const opt1 = {
        pensionImporte: getNum('opt1-pension-importe'),
        pensionFecha: getVal('opt1-pension-fecha') ? new Date(getVal('opt1-pension-fecha')) : null,
        pensionReductor: getNum('opt1-pension-reducctor') / 100,
        convenio: getNum('opt1-convenio'),
    };

    const opt2 = {
        pensionImporte: getNum('opt2-pension-importe'),
        pensionFecha: getVal('opt2-pension-fecha') ? new Date(getVal('opt2-pension-fecha')) : null,
        pensionReductor: getNum('opt2-pension-reducctor') / 100,
    };

    // 3. Determinar fecha de inicio de la simulación
    if (!opt1.pensionFecha || !opt2.pensionFecha) {
        resultsContainer.innerHTML = `<p class="error-msg" style="display:block; padding: 2rem;">Por favor, introduce la 'Fecha Jubilación' en ambas opciones para poder comparar.</p>`;
        return;
    }
    // Empezamos la simulación en la fecha más temprana de las dos, ajustada al día 1 del mes
    let currentDate = new Date(Math.min(opt1.pensionFecha, opt2.pensionFecha));
    currentDate.setDate(1); 

    // 4. Bucle de simulación
    let resultsData = [];
    let acc1 = 0;
    let acc2 = 0;
    let breakEvenPointFound = false;

    while (currentDate < maxDate) {
        let monthly1 = 0;
        let monthly2 = 0;

        // --- Cálculo Opción 1 ---
        if (currentDate >= opt1.pensionFecha) {
            monthly1 += opt1.pensionImporte * (1 - opt1.pensionReductor);
        } else {
            // Si no está jubilado en Opción 1, aplicamos el gasto del Convenio Especial (si existe)
            // 
            monthly1 += opt1.convenio;
        }
        acc1 += monthly1;

        // --- Cálculo Opción 2 ---
        if (currentDate >= opt2.pensionFecha) {
            monthly2 += opt2.pensionImporte * (1 - opt2.pensionReductor);
        }
        acc2 += monthly2;
        
        // Cálculo de edad
        let ageYears = currentDate.getFullYear() - birthDate.getFullYear();
        let ageMonths = currentDate.getMonth() - birthDate.getMonth();
        if (ageMonths < 0 || (ageMonths === 0 && currentDate.getDate() < birthDate.getDate())) {
            ageYears--;
            ageMonths = (ageMonths + 12) % 12;
        }
        const edadTexto = `${ageYears}a ${ageMonths}m`;

        const diffAcc = acc1 - acc2;

        // Comprobar si la diferencia se iguala o invierte (punto de equilibrio)
        let stopLoop = false;
        if (resultsData.length > 0) {
            const prevDiff = resultsData[resultsData.length - 1].diffAcc;
            // Si había diferencia previa (no era 0) y el signo cambia, hemos encontrado el cruce
            // Buscamos específicamente cuando la Opción 1 deja de ser ventajosa ()
            if (prevDiff > 0 && diffAcc <= 0) {
                stopLoop = true;
                breakEvenPointFound = true;
            }
        }

        resultsData.push({
            date: new Date(currentDate),
            age: edadTexto,
            monthly1: monthly1,
            acc1: acc1,
            monthly2: monthly2,
            acc2: acc2,
            diffAcc: diffAcc
        });

        if (stopLoop) break;

        // Avanzar al siguiente mes
        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Guardar datos para exportación y mostrar botones
    lastSimulationData = resultsData;
    const exportBtns = document.getElementById('export-buttons');
    if (exportBtns) exportBtns.style.display = 'block';

    // 5. Renderizar la tabla
    renderComparisonTable(resultsData, resultsContainer, breakEvenPointFound);
    renderChart(resultsData);
}

function renderComparisonTable(data, container, breakEvenPointFound) {
    if (data.length === 0) {
        container.innerHTML = '<p style="padding: 2rem; text-align: center;">No hay datos para mostrar con los parámetros introducidos.</p>';
        return;
    }

    const fmt = (num) => num.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

    let tableHTML = `
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Edad</th>
                    <th class="col-opt1">Opción 1 (Mensual)</th>
                    <th class="col-opt1">Opción 1 (Acumulado)</th>
                    <th class="col-opt2">Opción 2 (Mensual)</th>
                    <th class="col-opt2">Opción 2 (Acumulado)</th>
                    <th class="col-diff">Diferencia Acumulada</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(row => {
        const monthName = row.date.toLocaleString('es-ES', { month: 'short' });
        const year = row.date.getFullYear();
        const diffClass = row.diffAcc > 0 ? 'positive-diff' : (row.diffAcc < 0 ? 'negative-diff' : '');

        tableHTML += `
            <tr>
                <td>${monthName}. ${year}</td>
                <td>${row.age}</td>
                <td class="col-opt1">${fmt(row.monthly1)}</td>
                <td class="col-opt1">${fmt(row.acc1)}</td>
                <td class="col-opt2">${fmt(row.monthly2)}</td>
                <td class="col-opt2">${fmt(row.acc2)}</td>
                <td class="col-diff ${diffClass}">${fmt(row.diffAcc)}</td>
            </tr>
        `;
    });

    // Añadir fila de punto de equilibrio si se encontró
    if (breakEvenPointFound && data.length > 0) {
        const lastRow = data[data.length - 1];
        const monthName = lastRow.date.toLocaleString('es-ES', { month: 'long' });
        const year = lastRow.date.getFullYear();
        const diffClass = lastRow.diffAcc > 0 ? 'positive-diff' : (lastRow.diffAcc < 0 ? 'negative-diff' : '');

        tableHTML += `
            <tr class="breakeven-row">
                <td colspan="2">
                    <strong>Punto de Equilibrio</strong><br>
                    <small>${monthName} de ${year} (${lastRow.age})</small>
                </td>
                <td class="col-opt1">${fmt(lastRow.monthly1)}</td>
                <td class="col-opt1">${fmt(lastRow.acc1)}</td>
                <td class="col-opt2">${fmt(lastRow.monthly2)}</td>
                <td class="col-opt2">${fmt(lastRow.acc2)}</td>
                <td class="col-diff ${diffClass}">${fmt(lastRow.diffAcc)}</td>
            </tr>
        `;
    }

    tableHTML += `
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
}

function renderChart(data) {
    const chartCard = document.getElementById('chart-card');
    const ctx = document.getElementById('comparisonChart');

    if (!ctx || data.length === 0) {
        if (chartCard) chartCard.style.display = 'none';
        return;
    }

    chartCard.style.display = 'block';

    if (comparisonChart) {
        comparisonChart.destroy();
    }

    const labels = data.map(row => {
        const d = row.date;
        return `${d.toLocaleString('es-ES', { month: 'short' })} ${d.getFullYear()}`;
    });

    comparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Escenario A (Acumulado)',
                    data: data.map(row => row.acc1),
                    borderColor: '#4f46e5', // var(--primary)
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0, // Ocultar puntos para limpieza visual
                    pointHoverRadius: 5,
                    fill: false
                },
                {
                    label: 'Escenario B (Acumulado)',
                    data: data.map(row => row.acc2),
                    borderColor: '#0ea5e9', // var(--secondary)
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumSignificantDigits: 3 }).format(value);
                        }
                    }
                }
            }
        }
    });
}

function exportToCSV() {
    if (!lastSimulationData || lastSimulationData.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    let csv = "Fecha;Edad;Opción 1 (Mensual);Opción 1 (Acumulado);Opción 2 (Mensual);Opción 2 (Acumulado);Diferencia\n";
    
    lastSimulationData.forEach(row => {
        const dateStr = row.date.toLocaleDateString('es-ES');
        const fmt = n => n.toFixed(2).replace('.', ','); // Formato español para Excel (coma decimal)
        csv += `${dateStr};${row.age};${fmt(row.monthly1)};${fmt(row.acc1)};${fmt(row.monthly2)};${fmt(row.acc2)};${fmt(row.diffAcc)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "comparativa_pensiones.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}