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

let simulationChart = null; // Variable global para el gráfico

document.addEventListener('DOMContentLoaded', () => {
    console.log('Aplicación ERE26 inicializada');
    initApp();
});

function initApp() {
    // Referencias a las tarjetas del dashboard
    const cardPersonal = document.getElementById('card-personal');
    const cardEconomic = document.getElementById('card-economic');
    const cardSimulation = document.getElementById('card-simulation');
    
    // Elementos de Login y Vistas
    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('app-view');
    const loginForm = document.getElementById('login-form');
    const btnSignup = document.getElementById('btn-signup');
    const btnLogout = document.getElementById('btn-logout');
    const userDisplay = document.getElementById('user-display');

    // Elementos del Modal
    const modalPersonal = document.getElementById('modal-personal');
    const modalEconomic = document.getElementById('modal-economic');
    const closeButtons = document.querySelectorAll('.close-modal');
    const formPersonal = document.getElementById('form-personal');
    const formEconomic = document.getElementById('form-economic');

    // --- LÓGICA DE AUTENTICACIÓN ---
    
    // Escuchar cambios en el estado de la sesión
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('Usuario logueado:', user.email);
            if (loginView && appView) {
                loginView.style.display = 'none';
                appView.style.display = 'block';
                if(userDisplay) userDisplay.textContent = user.email;
            }
            // Si estamos en la página de informe, cargaríamos datos aquí
            if (window.location.pathname.includes('informe.html')) {
                loadReportData();
                
                // Listener para regenerar tabla al cambiar fecha
                const dateInput = document.getElementById('rep-fecha-inicio');
                if(dateInput) {
                    // Usamos 'input' para que sea más inmediato y 'change' por compatibilidad
                    dateInput.addEventListener('input', loadReportData);
                }
            }
        } else {
            console.log('No hay usuario logueado');
            if (appView && loginView) {
                appView.style.display = 'none';
                loginView.style.display = 'flex';
            } else if (window.location.pathname.includes('informe.html')) {
                // Si estamos en informe y no hay usuario, volver al login
                window.location.href = 'index.html';
            }
        }
    });

    // Manejar Login
    if(loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Manejar Registro
    if(btnSignup) {
        btnSignup.addEventListener('click', handleRegister);
    }

    // Manejar Logout
    if(btnLogout) {
        btnLogout.addEventListener('click', () => {
            auth.signOut().then(() => console.log('Sesión cerrada'));
        });
    }

    // Cerrar modales con la X (Genérico para todos los modales)
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Buscamos el modal padre más cercano o usamos el ID si lo tuviéramos
            e.target.closest('.modal').style.display = 'none';
        });
    });

    // Cerrar modal clicando fuera
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Guardar formulario
    if(formPersonal) {
        formPersonal.addEventListener('submit', savePersonalData);
    }
    if(formEconomic) {
        formEconomic.addEventListener('submit', saveEconomicData);
        // Añadir listeners para cálculo en tiempo real
        const inputs = formEconomic.querySelectorAll('input');
        inputs.forEach(input => input.addEventListener('input', calculateEconomic));
    }

    // Event Listeners
    if(cardPersonal) {
        cardPersonal.addEventListener('click', () => navigateTo('personal'));
    }
    if(cardEconomic) {
        cardEconomic.addEventListener('click', () => navigateTo('economic'));
    }
    if(cardSimulation) {
        cardSimulation.addEventListener('click', () => navigateTo('simulation'));
    }

    // Manejar Botón de Imprimir
    const btnPrint = document.getElementById('btn-print');
    if(btnPrint) {
        btnPrint.addEventListener('click', () => window.print());
    }
}

function navigateTo(section) {
    console.log(`Navegando a la sección: ${section}`);
    
    // Aquí implementaremos la lógica para cambiar de vista o abrir modales
    switch(section) {
        case 'personal':
            const modal = document.getElementById('modal-personal');
            // Pre-rellenar email con el usuario logueado
            if (auth.currentUser) {
                document.getElementById('email').value = auth.currentUser.email;
            }
            if(modal) modal.style.display = 'block';
            loadPersonalData(); // Cargar datos personales guardados
            break;
        case 'economic':
            const modalEco = document.getElementById('modal-economic');
            if(modalEco) modalEco.style.display = 'block';
            loadEconomicData(); // Cargar datos si existen
            break;
        case 'simulation':
            // Navegar a la página de informe
            window.location.href = 'informe.html';
            break;
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error');

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // El onAuthStateChanged se encargará de cambiar la vista
            errorMsg.style.display = 'none';
        })
        .catch((error) => {
            console.error(error);
            let message = "Error al iniciar sesión.";
            // Traducción de errores comunes
            if (error.code === 'auth/wrong-password') message = "La contraseña es incorrecta.";
            if (error.code === 'auth/user-not-found') message = "No existe un usuario con este correo.";
            if (error.code === 'auth/invalid-email') message = "El correo electrónico no es válido.";
            if (error.code === 'auth/operation-not-allowed') message = "El acceso por correo no está habilitado en Firebase.";
            if (error.code === 'auth/too-many-requests') message = "Demasiados intentos. Prueba más tarde.";
            
            errorMsg.textContent = message;
            errorMsg.style.display = 'block';
        });
}

function handleRegister(e) {
    e.preventDefault();
    const form = document.getElementById('login-form');
    
    // Validar que los campos no estén vacíos usando la validación nativa HTML
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error');

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("Usuario creado:", userCredential.user);
            // No hace falta hacer nada más, el onAuthStateChanged detectará el login automático
        })
        .catch((error) => {
            console.error(error);
            let message = "Error al crear usuario.";
            if (error.code === 'auth/email-already-in-use') message = "Este correo ya está registrado. Por favor, inicia sesión.";
            if (error.code === 'auth/weak-password') message = "La contraseña debe tener al menos 6 caracteres.";
            if (error.code === 'auth/invalid-email') message = "El correo electrónico no es válido.";
            
            errorMsg.textContent = message;
            errorMsg.style.display = 'block';
        });
}

function savePersonalData(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const nacimiento = document.getElementById('nacimiento').value;

    // Guardamos en la colección 'empleados'. 
    // Usamos el UID del usuario logueado
    const user = auth.currentUser;
    if (!user) return;

    db.collection('empleados').doc(user.uid).set({
        nombre: nombre,
        email: email,
        nacimiento: nacimiento,
        fechaActualizacion: new Date()
    }, { merge: true })
    .then(() => {
        alert('¡Datos guardados correctamente!');
        document.getElementById('modal-personal').style.display = 'none';
    })
    .catch((error) => {
        console.error("Error al guardar: ", error);
        if (error.code === 'permission-denied') {
            alert('Error de permisos: Configura las Reglas de Firestore para permitir la escritura.');
        } else {
            alert('Hubo un error al guardar los datos: ' + error.message);
        }
    });
}

function loadPersonalData() {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('empleados').doc(user.uid).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            if (data.nombre) document.getElementById('nombre').value = data.nombre;
            if (data.nacimiento) document.getElementById('nacimiento').value = data.nacimiento;
        }
    }).catch((error) => {
        console.error("Error al cargar datos personales:", error);
    });
}

function calculateEconomic() {
    // Obtener valores (0 si está vacío)
    const getVal = (id) => Number(document.getElementById(id).value) || 0;

    const salario = getVal('eco-salario');
    const antiguedad = getVal('eco-antiguedad');
    
    // Cálculo de Subida Salarial (Porcentaje sobre Salario Bruto)
    const subidaPct = getVal('eco-subida-pct');
    const subidaImporte = salario * (subidaPct / 100);
    document.getElementById('eco-subida-importe').value = subidaImporte.toFixed(2);

    const consolidacion = getVal('eco-consolidacion');
    const otros = getVal('eco-otros');

    // Suma de conceptos positivos
    const sumaConceptos = salario + antiguedad + subidaImporte + consolidacion + otros;
    
    // Base de cálculo (Suma de conceptos)
    const baseCalculo = sumaConceptos;

    // 1. Salario Base hasta 63 años: (Base * 15 * 62%)
    const base63 = baseCalculo * 15 * 0.62;
    
    // 2. Mensual hasta 63 años: (Anterior / 12)
    const mensual63 = base63 / 12;

    // 3. Salario Base 63-65 años: (Base * 15 * 34%)
    const base65 = baseCalculo * 15 * 0.34;

    // 4. Mensual 63-65 años: (Anterior / 12)
    const mensual65 = base65 / 12;

    // Mostrar resultados formateados en Euros
    const fmt = (num) => num.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

    document.getElementById('res-base63').textContent = fmt(base63);
    document.getElementById('res-mensual63').textContent = fmt(mensual63);
    document.getElementById('res-base65').textContent = fmt(base65);
    document.getElementById('res-mensual65').textContent = fmt(mensual65);

    // Cálculo del Límite Global (Base Anual Total * 2.56)
    const limiteGlobal = (baseCalculo * 15) * 2.56;
    document.getElementById('exen-limite').value = limiteGlobal.toFixed(2);
}

function saveEconomicData(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const data = {
        eco_salario: Number(document.getElementById('eco-salario').value),
        eco_antiguedad: Number(document.getElementById('eco-antiguedad').value),
        eco_subida_pct: Number(document.getElementById('eco-subida-pct').value),
        eco_subida: Number(document.getElementById('eco-subida-importe').value), // Guardamos el importe calculado
        eco_consolidacion: Number(document.getElementById('eco-consolidacion').value),
        eco_otros: Number(document.getElementById('eco-otros').value),
        exen_limite: Number(document.getElementById('exen-limite').value),
        exen_movistar: Number(document.getElementById('exen-movistar').value),
        exen_seguro: Number(document.getElementById('exen-seguro').value),
        exen_vida: Number(document.getElementById('exen-vida').value),
        fechaActualizacionEco: new Date()
    };

    db.collection('empleados').doc(user.uid).set(data, { merge: true })
        .then(() => {
            alert('¡Datos económicos guardados!');
            document.getElementById('modal-economic').style.display = 'none';
        })
        .catch(err => console.error(err));
}

function loadEconomicData() {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('empleados').doc(user.uid).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            // Rellenar inputs si existen datos
            if(data.eco_salario) document.getElementById('eco-salario').value = data.eco_salario;
            if(data.eco_antiguedad) document.getElementById('eco-antiguedad').value = data.eco_antiguedad;
            if(data.eco_subida_pct) document.getElementById('eco-subida-pct').value = data.eco_subida_pct;
            if(data.eco_consolidacion) document.getElementById('eco-consolidacion').value = data.eco_consolidacion;
            if(data.eco_otros) document.getElementById('eco-otros').value = data.eco_otros;
            if(data.exen_limite) document.getElementById('exen-limite').value = data.exen_limite;
            if(data.exen_movistar) document.getElementById('exen-movistar').value = data.exen_movistar;
            if(data.exen_seguro) document.getElementById('exen-seguro').value = data.exen_seguro;
            if(data.exen_vida) document.getElementById('exen-vida').value = data.exen_vida;
            
            // Recalcular con los datos cargados
            calculateEconomic();
        }
    }).catch((error) => {
        console.log("Error al cargar datos:", error);
    });
}

function loadReportData() {
    console.log("Cargando datos del informe...");
    const user = auth.currentUser;
    if (!user) return;

    db.collection('empleados').doc(user.uid).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            
            // 1. Datos Personales
            document.getElementById('rep-nombre').textContent = data.nombre || '-';
            
            if (data.nacimiento) {
                const dateParts = data.nacimiento.split('-'); // Viene como YYYY-MM-DD
                document.getElementById('rep-nacimiento').textContent = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
            }

            // 2. Datos Económicos (Recalcular bases)
            const salario = data.eco_salario || 0;
            const antiguedad = data.eco_antiguedad || 0;
            const subida = data.eco_subida || 0; // Importe ya calculado guardado
            const consolidacion = data.eco_consolidacion || 0;
            const otros = data.eco_otros || 0;
            
            const sumaConceptos = salario + antiguedad + subida + consolidacion + otros;
            
            // Cálculos de bases anuales
            const base63 = sumaConceptos * 15 * 0.62;
            const base65 = sumaConceptos * 15 * 0.34;
            // Recalculamos el límite para asegurar que usa la fórmula correcta (Total Anual * 2.56)
            const limite = (sumaConceptos * 15) * 2.56;

            const fmt = (num) => num.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

            document.getElementById('rep-base63').textContent = fmt(base63);
            document.getElementById('rep-base65').textContent = fmt(base65);
            document.getElementById('rep-limite').textContent = fmt(limite);

            // 3. Generar Tabla de Simulación
            const fechaInicio = document.getElementById('rep-fecha-inicio').value;
            if (fechaInicio && data.nacimiento) {
                renderSimulationTable(data, fechaInicio, sumaConceptos, limite);
            } else {
                console.log("Falta fecha de inicio o fecha de nacimiento para generar la tabla.");
            }
        }
    }).catch((error) => {
        console.error("Error al cargar datos del informe:", error);
    });
}

function renderSimulationTable(data, fechaInicioStr, sumaConceptos, limiteGlobal) {
    console.log(`Generando tabla. Inicio: ${fechaInicioStr}, Nacimiento: ${data.nacimiento}`);
    const container = document.getElementById('simulation-table-container');
    container.innerHTML = ''; // Limpiar tabla anterior

    const table = document.createElement('table');
    table.className = 'sim-table';
    
    // Fechas clave
    let currentDate = new Date(fechaInicioStr);
    // Ajustar al día 1 del mes para evitar problemas de saltos
    currentDate.setDate(1); 
    
    const birthDate = new Date(data.nacimiento);
    const date65 = new Date(birthDate);
    date65.setFullYear(birthDate.getFullYear() + 65);

    // Validación: Si la fecha de inicio es posterior a la jubilación
    if (currentDate >= date65) {
        container.innerHTML = '<p style="color: #ef4444; padding: 1rem;">La fecha de inicio seleccionada es posterior a la fecha de jubilación (65 años). Por favor, selecciona una fecha anterior.</p>';
        return;
    }

    // Conceptos fijos
    const movistar = data.exen_movistar || 0;
    const seguroVida = data.exen_vida || 0;
    const seguroSalud = data.exen_seguro || 0;
    const paroBase = 1225;

    // Variables de control
    let currentYear = -1;
    let acumuladoExencion = 0;
    const fmt = (num) => num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    let rowsGenerated = 0;
    let mesesParo = 0; // Contador de meses de paro consumidos
    let annualTotal = 0;
    let grandTotal = 0;
    
    const chartLabels = [];
    const chartData = [];

    // Bucle mes a mes hasta los 65 años
    while (currentDate < date65) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0-11

        // Nueva fila de Año y Cabecera si cambia el año
        if (year !== currentYear) {
            // Si no es el primer año, imprimimos el subtotal del año anterior
            if (currentYear !== -1) {
                const trSubtotal = document.createElement('tr');
                trSubtotal.style.backgroundColor = '#f8fafc';
                trSubtotal.innerHTML = `
                    <td colspan="11" style="text-align: right; font-weight: bold; padding-right: 1rem;">Total Año ${currentYear}</td>
                    <td style="text-align: right; font-weight: bold; color: var(--primary-dark);">${fmt(annualTotal)}</td>
                `;
                table.appendChild(trSubtotal);
                annualTotal = 0;
            }
            currentYear = year;
            
            // Fila AÑO
            const trYear = document.createElement('tr');
            trYear.innerHTML = `<td colspan="12" class="year-row">${year}</td>`;
            table.appendChild(trYear);

            // Fila Cabeceras
            const trHeader = document.createElement('tr');
            trHeader.className = 'header-row';
            trHeader.innerHTML = `
                <th>Mes</th>
                <th>Edad</th>
                <th style="text-align: right;">%</th>
                <th style="text-align: right;">Imp. Empresa</th>
                <th style="text-align: right;">Movistar</th>
                <th style="text-align: right;">Seg. Vida</th>
                <th style="text-align: right;">Seg. Salud</th>
                <th style="text-align: right;">Suma T</th>
                <th style="text-align: right;">Pend. Exen.</th>
                <th style="text-align: right;">Paro</th>
                <th style="text-align: right;">IRPF</th>
                <th style="text-align: right;">Total</th>
            `;
            table.appendChild(trHeader);
        }

        // Cálculos del mes
        // Edad
        let ageYears = year - birthDate.getFullYear();
        let ageMonths = month - birthDate.getMonth();
        if (ageMonths < 0) {
            ageYears--;
            ageMonths += 12;
        }
        const edadTexto = `${ageYears}a ${ageMonths}m`;

        // Porcentaje y Base (Cambia a los 63 años)
        // Consideramos que cumple 63 en el mes de su cumpleaños
        const isUnder63 = (ageYears < 63); 
        const pct = isUnder63 ? 62 : 34;
        
        // Objetivo Mensual (Lo que se debería cobrar en total bruto antes de especies)
        // Base Anual = sumaConceptos * 15
        const baseAnual = sumaConceptos * 15;
        const objetivoMensual = (baseAnual * (pct / 100)) / 12;

        // Lógica de Paro (Máximo 24 meses)
        let paroMes = 0;
        if (mesesParo < 24) {
            paroMes = paroBase;
            mesesParo++;
        }

        // La empresa paga la diferencia entre el objetivo y el paro
        // Si se acaba el paro, la empresa paga todo el objetivo
        const importeEmpresa = Math.max(0, objetivoMensual - paroMes);

        // Cálculo IRPF y Exención
        // Consumo mensual del límite = Lo que paga la empresa (Cash + Especie)
        // Asumimos que Movistar y Seguros son retribución en especie que consume límite
        const consumoMensual = importeEmpresa + movistar + seguroVida + seguroSalud;
        const sumaT = consumoMensual; // Alias para la columna "Suma T"
        
        let irpf = 0;
        
        // Lógica de Exención
        if (acumuladoExencion < limiteGlobal) {
            // Aún tenemos "saldo" de exención
            if ((acumuladoExencion + consumoMensual) <= limiteGlobal) {
                // Todo el mes es exento
                irpf = 0;
                acumuladoExencion += consumoMensual;
            } else {
                // Se agota el límite a mitad de este mes
                const parteExenta = limiteGlobal - acumuladoExencion;
                const parteGravada = consumoMensual - parteExenta;
                acumuladoExencion = limiteGlobal; // Límite alcanzado
                
                // Aplicamos una retención estimada a la parte gravada (ej. 19% base)
                // Nota: Esto es una estimación, ya que no tenemos tipo impositivo del usuario
                irpf = parteGravada * 0.19; 
            }
        } else {
            // Límite ya agotado, todo tributa
            irpf = consumoMensual * 0.19;
        }

        // Pendiente de Exención (Lo que queda de la bolsa)
        const pendienteExencion = Math.max(0, limiteGlobal - acumuladoExencion);

        // Total Neto (Cash Flow)
        // Asumimos: Total = (Importe Empresa + Paro) - IRPF
        // (Movistar y Seguros no se suman al neto porque suelen ser pago directo de la empresa)
        const total = (importeEmpresa + paroMes) - irpf;
        
        annualTotal += total;
        grandTotal += total;
        
        // Datos para el gráfico
        const labelDate = currentDate.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
        chartLabels.push(labelDate);
        chartData.push(total);

        // Renderizar Fila
        const tr = document.createElement('tr');
        const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
        tr.innerHTML = `
            <td style="text-transform: capitalize;">${monthName}</td>
            <td>${edadTexto}</td>
            <td style="text-align: right;">${pct}%</td>
            <td style="text-align: right;">${fmt(importeEmpresa)}</td>
            <td style="text-align: right;">${fmt(movistar)}</td>
            <td style="text-align: right;">${fmt(seguroVida)}</td>
            <td style="text-align: right;">${fmt(seguroSalud)}</td>
            <td style="text-align: right; font-weight: bold; color: var(--secondary);">${fmt(sumaT)}</td>
            <td style="text-align: right; color: var(--text-muted);">${fmt(pendienteExencion)}</td>
            <td style="text-align: right;">${fmt(paroMes)}</td>
            <td style="text-align: right; ${irpf > 0 ? 'color: #ef4444; font-weight:bold;' : ''}">${fmt(irpf)}</td>
            <td style="text-align: right; font-weight: bold; color: var(--primary-dark);">${fmt(total)}</td>
        `;
        table.appendChild(tr);

        // Avanzar mes
        currentDate.setMonth(currentDate.getMonth() + 1);
        rowsGenerated++;
    }

    if (rowsGenerated > 0) {
        // Subtotal del último año
        const trSubtotal = document.createElement('tr');
        trSubtotal.style.backgroundColor = '#f8fafc';
        trSubtotal.innerHTML = `
            <td colspan="11" style="text-align: right; font-weight: bold; padding-right: 1rem;">Total Año ${currentYear}</td>
            <td style="text-align: right; font-weight: bold; color: var(--primary-dark);">${fmt(annualTotal)}</td>
        `;
        table.appendChild(trSubtotal);

        // Gran Total Acumulado
        const trGrandTotal = document.createElement('tr');
        trGrandTotal.style.backgroundColor = '#e0e7ff';
        trGrandTotal.style.borderTop = '2px solid var(--primary)';
        trGrandTotal.innerHTML = `
            <td colspan="11" style="text-align: right; font-weight: bold; font-size: 1.1rem; padding-right: 1rem;">TOTAL NETO ACUMULADO</td>
            <td style="text-align: right; font-weight: bold; font-size: 1.1rem; color: var(--primary-dark);">${fmt(grandTotal)}</td>
        `;
        table.appendChild(trGrandTotal);

        container.appendChild(table);
        
        // Renderizar Gráfico
        renderChart(chartLabels, chartData);
    } else {
        container.innerHTML = '<p>No se han generado datos para el rango de fechas seleccionado.</p>';
    }
}

function renderChart(labels, data) {
    const ctx = document.getElementById('simulationChart').getContext('2d');
    
    if (simulationChart) {
        simulationChart.destroy();
    }

    simulationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Neto Mensual (€)',
                data: data,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
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
                    beginAtZero: true,
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