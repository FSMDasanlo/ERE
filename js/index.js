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

let initialEconomicData = null; // Estado inicial del formulario económico

document.addEventListener('DOMContentLoaded', () => {
    console.log('Aplicación ERE26 inicializada');
    initApp();
});

function initApp() {
    // Referencias a las tarjetas del dashboard
    const cardPersonal = document.getElementById('card-personal');
    const cardEconomic = document.getElementById('card-economic');
    const cardSimulation = document.getElementById('card-simulation');
    const cardAdmin = document.getElementById('card-admin');
    
    // Elementos de Login y Vistas
    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('app-view');
    const loginForm = document.getElementById('login-form');
    const btnSignup = document.getElementById('btn-signup');
    const btnLogout = document.getElementById('btn-logout');
    const btnResetPassword = document.getElementById('btn-reset-password');
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

                // Mostrar panel de administración si es el usuario autorizado
                if(cardAdmin) {
                    cardAdmin.style.display = (user.email === 'jesus.samperruiz@gmail.com') ? 'block' : 'none';
                }
            }
            // Si estamos en la página de informe, cargaríamos datos aquí
            if (window.location.pathname.includes('informe.html')) {
                // Listener para regenerar tabla al cambiar fecha
                const dateInput = document.getElementById('rep-fecha-inicio');
                if(dateInput) {
                    // Establecer fecha por defecto: 1 de marzo de 2026
                    if(!dateInput.value) dateInput.value = '2026-03-01';
                    // Usamos 'input' para que sea más inmediato y 'change' por compatibilidad
                    dateInput.addEventListener('input', loadReportData);
                }
                loadReportData();
            }

            // Lógica para página de Administración
            if (window.location.pathname.includes('admin.html')) {
                if (user.email !== 'jesus.samperruiz@gmail.com') {
                    alert('Acceso denegado. Solo administradores.');
                    window.location.href = 'index.html';
                } else {
                    initAdminPanel();
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

    // Manejar Recuperación de Contraseña
    if(btnResetPassword) {
        btnResetPassword.addEventListener('click', handlePasswordReset);
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
            const modal = e.target.closest('.modal');
            attemptCloseModal(modal);
        });
    });

    // Cerrar modal clicando fuera
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            attemptCloseModal(e.target);
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
    if(cardAdmin) {
        cardAdmin.addEventListener('click', () => window.location.href = 'admin.html');
    }

    // Manejar Botón de Imprimir
    const btnPrint = document.getElementById('btn-print');
    if(btnPrint) {
        btnPrint.addEventListener('click', () => window.print());
    }

    // Manejar Botón Cerrar en Login
    const btnCloseLogin = document.getElementById('btn-close-login');
    if(btnCloseLogin) {
        btnCloseLogin.addEventListener('click', () => {
            if(confirm("¿Deseas cerrar la aplicación?")) {
                window.close();
                // Nota: Si el navegador bloquea el cierre, no pasará nada.
            }
        });
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

function handlePasswordReset(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const errorMsg = document.getElementById('login-error');

    if (!email) {
        errorMsg.textContent = "Por favor, escribe tu correo electrónico arriba para recuperar la contraseña.";
        errorMsg.style.display = 'block';
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            alert("Se ha enviado un correo de recuperación a " + email + ". Revisa tu bandeja de entrada.");
            errorMsg.style.display = 'none';
        })
        .catch((error) => {
            console.error(error);
            let message = "Error al enviar el correo de recuperación.";
            if (error.code === 'auth/user-not-found') message = "No existe un usuario con este correo.";
            if (error.code === 'auth/invalid-email') message = "El correo electrónico no es válido.";
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
    const fechaAntiguedad = document.getElementById('fecha-antiguedad').value;

    // Guardamos en la colección 'empleados'. 
    // Usamos el UID del usuario logueado
    const user = auth.currentUser;
    if (!user) return;

    db.collection('empleados').doc(user.uid).set({
        nombre: nombre,
        email: email,
        nacimiento: nacimiento,
        fecha_antiguedad: fechaAntiguedad,
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
            if (data.fecha_antiguedad) document.getElementById('fecha-antiguedad').value = data.fecha_antiguedad;
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

    // Obtener porcentajes configurados (o valores por defecto)
    const pct63 = getVal('eco-pct63') || 62;
    const pct65 = getVal('eco-pct65') || 34;

    // Cálculo Neto SEPE
    const sepeImporte = getVal('eco-sepe-importe');
    const sepeSS = getVal('eco-sepe-ss');
    document.getElementById('eco-sepe-neto').value = (sepeImporte - sepeSS).toFixed(2);
    
    // Cálculo de Subida Salarial (Porcentaje sobre Salario Bruto)
    const subidaPct = getVal('eco-subida-pct');
    const subidaImporte = salario * (subidaPct / 100);
    document.getElementById('eco-subida-importe').value = subidaImporte.toFixed(2);

    const consolidacion = getVal('eco-consolidacion');
    const otros = getVal('eco-otros');

    // Suma de conceptos positivos
    const sumaConceptos = salario + antiguedad + subidaImporte  + otros;
    
    // Base de cálculo (Suma de conceptos)
    const baseCalculo = sumaConceptos;

    // 1. Salario Base hasta 63 años: (Base * 15 * %Tramo1)
    const base63 = ((baseCalculo * 15 ) + consolidacion)* (pct63 / 100);
    
    // 2. Mensual hasta 63 años: (Anterior / 12)
    const mensual63 = base63 / 12;

    // 3. Salario Base 63-65 años: (Base * 15 * %Tramo2)
    const base65 = ((baseCalculo * 15)+ consolidacion) * (pct65 / 100);

    // 4. Mensual 63-65 años: (Anterior / 12)
    const mensual65 = base65 / 12;

    // Mostrar resultados formateados en Euros
    const fmt = (num) => num.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

    document.getElementById('res-total-bruto').textContent = fmt(sumaConceptos * 15+ consolidacion);
    document.getElementById('res-base63').textContent = fmt(base63);
    document.getElementById('res-mensual63').textContent = fmt(mensual63);
    document.getElementById('res-base65').textContent = fmt(base65);
    document.getElementById('res-mensual65').textContent = fmt(mensual65);

    // --- CÁLCULO INDEMNIZACIÓN LEGAL Y LÍMITE EXENTO ---
    const fechaAntiguedad = document.getElementById('fecha-antiguedad').value;
    const salarioAnualTotal = (baseCalculo * 15) + consolidacion;
    
    // Calculamos la indemnización legal teórica a fecha ERE (28/02/2026)
    const indemnizacionLegal = calculateLegalIndemnity(salarioAnualTotal, fechaAntiguedad);
    document.getElementById('exen-legal').value = fmt(indemnizacionLegal);

    // El límite exento es el menor entre la Legal y 180.000€
    let limiteGlobal = Math.min(indemnizacionLegal, 180000);

    const inputLimite = document.getElementById('exen-limite');
    inputLimite.value = fmt(limiteGlobal);
    inputLimite.dataset.value = limiteGlobal; // Guardamos el valor numérico para guardarlo después
}

function saveEconomicData(e) {
    if(e) e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const data = {
        eco_salario: Number(document.getElementById('eco-salario').value),
        eco_antiguedad: Number(document.getElementById('eco-antiguedad').value),
        eco_subida_pct: Number(document.getElementById('eco-subida-pct').value),
        eco_subida: Number(document.getElementById('eco-subida-importe').value), // Guardamos el importe calculado
        eco_consolidacion: Number(document.getElementById('eco-consolidacion').value),
        eco_otros: Number(document.getElementById('eco-otros').value),
        eco_pct63: Number(document.getElementById('eco-pct63').value) || 62,
        eco_pct65: Number(document.getElementById('eco-pct65').value) || 34,
        eco_sepe_importe: Number(document.getElementById('eco-sepe-importe').value),
        eco_sepe_ss: Number(document.getElementById('eco-sepe-ss').value),
        exen_limite: Number(document.getElementById('exen-limite').dataset.value) || 0,
        exen_movistar: Number(document.getElementById('exen-movistar').value),
        exen_seguro: Number(document.getElementById('exen-seguro').value),
        exen_vida: Number(document.getElementById('exen-vida').value),
        fechaActualizacionEco: new Date()
    };

    db.collection('empleados').doc(user.uid).set(data, { merge: true })
        .then(() => {
            alert('¡Datos económicos guardados!');
            initialEconomicData = getEconomicState(); // Actualizamos el estado inicial tras guardar
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
            if(data.eco_pct63) document.getElementById('eco-pct63').value = data.eco_pct63;
            if(data.eco_pct65) document.getElementById('eco-pct65').value = data.eco_pct65;
            if(data.exen_limite) document.getElementById('exen-limite').value = data.exen_limite;
            if(data.exen_movistar) document.getElementById('exen-movistar').value = data.exen_movistar;
            if(data.exen_seguro) document.getElementById('exen-seguro').value = data.exen_seguro;
            if(data.exen_vida) document.getElementById('exen-vida').value = data.exen_vida;
            if(data.eco_sepe_importe) document.getElementById('eco-sepe-importe').value = data.eco_sepe_importe;
            if(data.eco_sepe_ss) document.getElementById('eco-sepe-ss').value = data.eco_sepe_ss;
            
            // Aseguramos que la fecha de antigüedad esté disponible para el cálculo
            if(data.fecha_antiguedad) document.getElementById('fecha-antiguedad').value = data.fecha_antiguedad;
        }
        // Recalcular y guardar estado inicial (tanto si existen datos como si no)
        calculateEconomic();
        initialEconomicData = getEconomicState();
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
            
            // Consolidación es anual, no se multiplica por 15
            const sumaMensuales = salario + antiguedad + subida + otros;
            
            // Porcentajes dinámicos
            const pct63 = data.eco_pct63 || 62;
            const pct65 = data.eco_pct65 || 34;
            
            // Cálculo del Neto SEPE para el informe
            const sepeImporte = data.eco_sepe_importe;
            const sepeSS = data.eco_sepe_ss || 0;
            const sepeNeto = (sepeImporte !== undefined) ? (sepeImporte - sepeSS) : undefined;

            // Cálculos de bases anuales
            const baseAnualTotal = (sumaMensuales * 15) + consolidacion;
            const base63 = baseAnualTotal * (pct63 / 100);
            const base65 = baseAnualTotal * (pct65 / 100);
            
            // Recalculamos el límite con la fórmula legal
            const indemnizacionLegal = calculateLegalIndemnity(baseAnualTotal, data.fecha_antiguedad);
            let limite = Math.min(indemnizacionLegal, 180000);

            const fmt = (num) => num.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

            document.getElementById('rep-base63').textContent = fmt(base63);
            document.getElementById('rep-base65').textContent = fmt(base65);
            document.getElementById('rep-limite').textContent = fmt(limite);

            // 3. Generar Tabla de Simulación
            const fechaInicio = document.getElementById('rep-fecha-inicio').value;
            if (fechaInicio && data.nacimiento) {
                renderSimulationTable(data, fechaInicio, sumaMensuales, consolidacion, limite, pct63, pct65, sepeNeto);
            } else {
                console.log("Falta fecha de inicio o fecha de nacimiento para generar la tabla.");
            }
        }
    }).catch((error) => {
        console.error("Error al cargar datos del informe:", error);
    });
}

function initAdminPanel() {
    const select = document.getElementById('admin-users-list');
    const summaryDiv = document.getElementById('admin-user-summary');
    const btnCopy = document.getElementById('btn-admin-copy');
    const btnDelete = document.getElementById('btn-admin-delete');
    const status = document.getElementById('admin-status');

    // Función para cargar/recargar usuarios
    const loadUsers = () => {
        status.textContent = "Cargando...";
        db.collection('empleados').get().then(snapshot => {
            select.innerHTML = '<option value="">-- Selecciona un usuario --</option>';
            snapshot.forEach(doc => {
                const data = doc.data();
                const name = data.nombre || 'Sin Nombre';
                const email = data.email || 'Sin Email';
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = `${email} (${name})`;
                select.appendChild(option);
            });
            status.textContent = "";
        }).catch(err => {
            console.error(err);
            if (err.code === 'permission-denied') {
                status.textContent = "Fallo de Permisos: Actualiza las Reglas en Firebase Console para permitir al admin leer 'empleados'.";
            } else {
                status.textContent = "Error al cargar usuarios: " + err.message;
            }
            status.style.color = 'red';
        });
    };

    loadUsers();

    // Mostrar resumen al seleccionar usuario
    select.addEventListener('change', () => {
        const selectedId = select.value;
        if (!selectedId) {
            summaryDiv.style.display = 'none';
            return;
        }

        db.collection('empleados').doc(selectedId).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                const fmt = (num) => num.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
                summaryDiv.innerHTML = `
                    <p style="margin: 0.25rem 0;"><strong>Nombre:</strong> ${data.nombre || '<span style="color:red">No definido</span>'}</p>
                    <p style="margin: 0.25rem 0;"><strong>F. Nacimiento:</strong> ${data.nacimiento || '-'}</p>
                    <p style="margin: 0.25rem 0;"><strong>Salario Bruto:</strong> ${fmt(data.eco_salario || 0)}</p>
                `;
                summaryDiv.style.display = 'block';
            }
        }).catch(err => console.error("Error al cargar detalles:", err));
    });

    // Acción Copiar
    btnCopy.addEventListener('click', () => {
        const selectedId = select.value;
        if(!selectedId) return alert('Selecciona un usuario primero');
        
        const targetEmail = prompt("Introduce el EMAIL del usuario destino (debe existir en BBDD):");
        if(!targetEmail) return;

        // 1. Buscar el usuario destino por su email
        db.collection('empleados').where('email', '==', targetEmail).get().then(snapshot => {
            if(snapshot.empty) {
                alert("No se encontró ningún usuario con ese email.");
                return;
            }
            const targetId = snapshot.docs[0].id;

            // 2. Leer datos del origen y copiar al destino
            db.collection('empleados').doc(selectedId).get().then(doc => {
                if(doc.exists) {
                    const data = doc.data();
                    data.email = targetEmail; // Aseguramos que el destino conserve su email
                    data.nombre = (data.nombre || '') + ' (Copia)';
                    data.fechaActualizacion = new Date();
                    
                    db.collection('empleados').doc(targetId).set(data).then(() => {
                        alert('Datos copiados correctamente a ' + targetEmail);
                        loadUsers();
                    });
                }
            });
        }).catch(err => alert("Error: " + err.message));
    });

    // Acción Eliminar
    btnDelete.addEventListener('click', () => {
        const selectedId = select.value;
        if(!selectedId) return alert('Selecciona un usuario primero');
        
        if(confirm("¿Estás seguro de que quieres eliminar este usuario? Esta acción borrará sus datos de la base de datos.")) {
            db.collection('empleados').doc(selectedId).delete().then(() => {
                alert('Usuario eliminado.');
                loadUsers();
            }).catch(err => alert('Error al eliminar: ' + err.message));
        }
    });
}

function calculateProgressiveIrpf(annualTaxableAmount) {
    if (annualTaxableAmount <= 0) return 0;

    let tax = 0;
    let amount = annualTaxableAmount;

    // Tramo 1: hasta 12.450€ al 19%
    if (amount > 0) {
        const taxableInBracket = Math.min(amount, 12450);
        tax += taxableInBracket * 0.19;
        amount -= taxableInBracket;
    }

    // Tramo 2: de 12.450€ a 20.200€ al 24%
    if (amount > 0) {
        const taxableInBracket = Math.min(amount, 20200 - 12450);
        tax += taxableInBracket * 0.24;
        amount -= taxableInBracket;
    }

    // Tramo 3: de 20.200€ a 35.200€ al 30%
    if (amount > 0) {
        const taxableInBracket = Math.min(amount, 35200 - 20200);
        tax += taxableInBracket * 0.30;
        amount -= taxableInBracket;
    }

    // Tramo 4: de 35.200€ a 60.000€ al 37%
    if (amount > 0) {
        const taxableInBracket = Math.min(amount, 60000 - 35200);
        tax += taxableInBracket * 0.37;
        amount -= taxableInBracket;
    }

    // Tramo 5: más de 60.000€ al 45%
    if (amount > 0) {
        tax += amount * 0.45;
    }

    return tax;
}

function calculateLegalIndemnity(annualSalary, startDateStr) {
    if (!startDateStr || !annualSalary) return 0;
    
    const start = new Date(startDateStr);
    const end = new Date('2026-02-28'); // Fecha estimada ERE
    const reformDate = new Date('2012-02-12');

    if (start >= end) return 0;

    const dailySalary = annualSalary / 365;
    const oneDay = 24 * 60 * 60 * 1000;
    
    let totalIndemnity = 0;

    if (start > reformDate) {
        // Caso 1: Entrada posterior a 12/02/2012 (Solo tramo 33 días)
        const daysWorked = Math.round(Math.abs((end - start) / oneDay)) + 1;
        const years = daysWorked / 365;
        totalIndemnity = years * 33 * dailySalary;
        
        // Tope: 24 mensualidades
        const max24Mensualidades = 24 * (annualSalary / 12);
        totalIndemnity = Math.min(totalIndemnity, max24Mensualidades);
    } else {
        // Caso 2: Entrada anterior a 12/02/2012 (Doble tramo)
        
        // Tramo 1: Hasta 12/02/2012 (45 días)
        const days1 = Math.round(Math.abs((reformDate - start) / oneDay)) + 1;
        const years1 = days1 / 365;
        const amount1 = years1 * 45 * dailySalary;

        // Tramo 2: Desde 13/02/2012 (33 días)
        const nextDayReform = new Date('2012-02-13');
        const days2 = Math.round(Math.abs((end - nextDayReform) / oneDay)) + 1;
        const years2 = days2 / 365;
        const amount2 = years2 * 33 * dailySalary;

        totalIndemnity = amount1 + amount2;

        // Topes legales complejos
        const cap720Days = 720 * dailySalary; // Aprox 24 mensualidades
        const cap42Mensualidades = 42 * (annualSalary / 12); // 1260 días

        if (amount1 > cap720Days) {
            // Si lo generado antes de 2012 ya supera los 720 días, se respeta ese importe (tope 42 men.)
            // y no se suma nada del periodo posterior.
            totalIndemnity = Math.min(amount1, cap42Mensualidades);
        } else {
            // Si no, la suma de ambos no puede superar 720 días
            totalIndemnity = Math.min(totalIndemnity, cap720Days);
        }
    }
    return totalIndemnity;
}

function renderSimulationTable(data, fechaInicioStr, sumaMensuales, consolidacion, limiteGlobal, pct63, pct65, sepeNeto) {
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
    // Si sepeNeto está definido (incluso si es 0), lo usamos. Si no (datos antiguos), usamos 1225.
    const paroBase = (sepeNeto !== undefined && sepeNeto !== null) ? Number(sepeNeto) : 1225;
    const ssAmount = data.eco_sepe_ss ? Number(data.eco_sepe_ss) : 0; // Importe SS

    // Variables de control
    let currentYear = -1;
    let acumuladoExencion = 0;
    const fmt = (num) => num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtInt = (num) => num.toLocaleString('es-ES', { maximumFractionDigits: 0 });

    let rowsGenerated = 0;
    let mesesParo = 0; // Contador de meses de paro consumidos
    let annualTotal = 0;
    let grandTotal = 0;
    let annualRentaTel = 0;
    let grandRentaTel = 0;
    let annualSepe = 0;
    let grandSepe = 0;
    let annualSS = 0;
    let grandSS = 0;
    let annualSumaT = 0;
    let grandSumaT = 0;

    // Variables para cálculo de IRPF anual progresivo
    let annualTaxableIncome = 0;
    let annualIrpfPaid = 0;

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
                    <td colspan="3" style="text-align: right; font-weight: bold; padding-right: 1rem;">Total Año ${currentYear}</td>
                    <td style="text-align: right; font-weight: bold;">${fmt(annualRentaTel)}</td>
                    <td style="text-align: right; font-weight: bold;">${fmt(annualSepe)}</td>
                    <td></td>
                    <td style="text-align: right; font-weight: bold; color: #ef4444;">${fmt(annualSS)}</td>
                    <td style="text-align: right; font-weight: bold; color: var(--primary-dark);">${fmt(annualTotal)}</td>
                    <td colspan="3"></td>
                    <td style="text-align: right; font-weight: bold; color: var(--secondary);">${fmt(annualSumaT)}</td>
                    <td></td>
                `;
                table.appendChild(trSubtotal);
                annualTotal = 0;
                annualRentaTel = 0;
                annualSepe = 0;
                annualSS = 0;
                annualSumaT = 0;
            }
            // Reset contadores anuales
            annualTaxableIncome = 0;
            annualIrpfPaid = 0;

            currentYear = year;
            
            // Fila AÑO
            const trYear = document.createElement('tr');
            trYear.innerHTML = `<td colspan="13" class="year-row">${year}</td>`;
            table.appendChild(trYear);

            // Fila Cabeceras
            const trHeader = document.createElement('tr');
            trHeader.className = 'header-row';
            trHeader.innerHTML = `
                <th>Mes</th>
                <th>Edad</th>
                <th style="text-align: right;">%</th>
                <th style="text-align: right; cursor: help;" title="(Base Salario / 12) - SEPE">Renta TEL <i class="fas fa-info-circle" style="font-size: 0.8em; color: var(--secondary);"></i></th>
                <th style="text-align: right;">SEPE</th>
                <th style="text-align: right; cursor: help;" title="Tablas IRPF sobre el 70% de la Base Sujeta (Reducción 30% Renta Irregular)">IRPF <i class="fas fa-info-circle" style="font-size: 0.8em; color: var(--secondary);"></i></th>
                <th style="text-align: right;">SS</th>
                <th style="text-align: right; cursor: help;" title="Renta Tel. + SEPE + SS">Total <i class="fas fa-info-circle" style="font-size: 0.8em; color: var(--secondary);"></i></th>
                <th style="text-align: right;">Bon. Empl.</th>
                <th style="text-align: right;">Seg. Vida</th>
                <th style="text-align: right;">Seg. Salud</th>
                <th style="text-align: right; cursor: help;" title="Renta TEL + Bon. Empl. + SEG. VIDA + SEG. SALUD">Suma T <i class="fas fa-info-circle" style="font-size: 0.8em; color: var(--secondary);"></i></th>
                <th style="text-align: right;">Pend. Exen.</th>
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
        const pct = isUnder63 ? pct63 : pct65;
        
        // Objetivo Mensual (Lo que se debería cobrar en total bruto antes de especies)
        // Base Anual = (sumaMensuales * 15) + consolidacion
        const baseAnual = (sumaMensuales * 15) + consolidacion;
        const objetivoMensual = (baseAnual * (pct / 100)) / 12;

        // Lógica de Paro (Máximo 24 meses)
        let paroMes = 0;
        let currentSS = 0;
        if (mesesParo < 24) {
            paroMes = paroBase;
            currentSS = ssAmount;
            mesesParo++;
        }

        // La empresa paga la diferencia entre el objetivo y el paro
        // Si se acaba el paro, la empresa paga todo el objetivo
        const importeEmpresa = Math.max(0, objetivoMensual - paroMes);

        // Renta TEL: Restamos la SS
        const rentaTel = importeEmpresa - currentSS;

        // Cálculo IRPF y Exención
        // Consumo mensual del límite = Lo que paga la empresa (Cash + Especie)
        // Asumimos que Movistar y Seguros son retribución en especie que consume límite
        const consumoMensual = rentaTel + movistar + seguroVida + seguroSalud;
        const sumaT = consumoMensual; // Alias para la columna "Suma T"
        
        let irpf = 0;
        let monthlyTaxableAmount = 0;
        
        // Lógica de Exención
        if (acumuladoExencion < limiteGlobal) {
            // Aún tenemos "saldo" de exención
            if ((acumuladoExencion + consumoMensual) <= limiteGlobal) {
                // Todo el mes es exento
                monthlyTaxableAmount = 0;
                acumuladoExencion += consumoMensual;
            } else {
                // Se agota el límite a mitad de este mes
                const parteExenta = limiteGlobal - acumuladoExencion;
                monthlyTaxableAmount = consumoMensual - parteExenta;
                acumuladoExencion = limiteGlobal; // Límite alcanzado
            }
        } else {
            // Límite ya agotado, todo tributa
            monthlyTaxableAmount = consumoMensual;
        }

        if (monthlyTaxableAmount > 0) {
            // Aplicamos reducción del 30% (tributa el 70%) por normativa ERE/Renta Irregular
            const baseLiquidale = monthlyTaxableAmount * 0.70;
            annualTaxableIncome += baseLiquidale;
            const totalIrpfDue = calculateProgressiveIrpf(annualTaxableIncome);
            irpf = totalIrpfDue - annualIrpfPaid;
            annualIrpfPaid += irpf;
        }
        // Pendiente de Exención (Lo que queda de la bolsa)
        const pendienteExencion = Math.max(0, limiteGlobal - acumuladoExencion);

        // Total Neto (Cash Flow)
        // Asumimos: Total = (Importe Empresa + Paro) - IRPF
        // (Movistar y Seguros no se suman al neto porque suelen ser pago directo de la empresa)
        const total = (rentaTel + paroMes + currentSS) - irpf;
        
        annualTotal += total;
        grandTotal += total;
        
        annualRentaTel += rentaTel;
        grandRentaTel += rentaTel;
        annualSepe += paroMes;
        grandSepe += paroMes;
        annualSS += currentSS;
        grandSS += currentSS;
        annualSumaT += sumaT;
        grandSumaT += sumaT;

        // Renderizar Fila
        const tr = document.createElement('tr');
        const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
        tr.innerHTML = `
            <td style="text-transform: capitalize;">${monthName}</td>
            <td>${edadTexto}</td>
            <td style="text-align: right;">${pct}%</td>
            <td style="text-align: right;">${fmt(rentaTel)}</td>
            <td style="text-align: right;">${fmtInt(paroMes)}</td>
            <td style="text-align: right; ${irpf > 0 ? 'color: #ef4444; font-weight:bold;' : ''}">${fmt(irpf)}</td>
            <td style="text-align: right; color: #ef4444;">${fmt(currentSS)}</td>
            <td style="text-align: right; font-weight: bold; color: var(--primary-dark);">${fmt(total)}</td>
            <td style="text-align: right;">${fmt(movistar)}</td>
            <td style="text-align: right;">${fmt(seguroVida)}</td>
            <td style="text-align: right;">${fmt(seguroSalud)}</td>
            <td style="text-align: right; font-weight: bold; color: var(--secondary);">${fmt(sumaT)}</td>
            <td style="text-align: right; color: var(--text-muted);">${fmt(pendienteExencion)}</td>
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
            <td colspan="3" style="text-align: right; font-weight: bold; padding-right: 1rem;">Total Año ${currentYear}</td>
            <td style="text-align: right; font-weight: bold;">${fmt(annualRentaTel)}</td>
            <td style="text-align: right; font-weight: bold;">${fmt(annualSepe)}</td>
            <td></td>
            <td style="text-align: right; font-weight: bold; color: #ef4444;">${fmt(annualSS)}</td>
            <td style="text-align: right; font-weight: bold; color: var(--primary-dark);">${fmt(annualTotal)}</td>
            <td colspan="3"></td>
            <td style="text-align: right; font-weight: bold; color: var(--secondary);">${fmt(annualSumaT)}</td>
            <td></td>
        `;
        table.appendChild(trSubtotal);

        container.appendChild(table);

        // Caja de Resumen Acumulado
        const summaryBox = document.createElement('div');
        summaryBox.className = 'card';
        summaryBox.style.marginTop = '2rem';
        summaryBox.style.backgroundColor = '#f0f9ff';
        summaryBox.style.border = '1px solid #bae6fd';
        summaryBox.style.padding = '1.5rem';
        summaryBox.style.textAlign = 'left';

        summaryBox.innerHTML = `
            <h3 style="color: #0369a1; margin-top: 0; margin-bottom: 1.5rem; border-bottom: 1px solid #bae6fd; padding-bottom: 0.5rem;">
                <i class="fas fa-chart-line"></i> Resumen Total Acumulado
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1.5rem;">
                <div style="text-align: center; padding: 1rem; background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem;">Renta TEL</div>
                    <div style="font-size: 1.2rem; font-weight: 700; color: #334155;">${fmt(grandRentaTel)}</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem;">SEPE</div>
                    <div style="font-size: 1.2rem; font-weight: 700; color: #334155;">${fmt(grandSepe)}</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem;">SS</div>
                    <div style="font-size: 1.2rem; font-weight: 700; color: #ef4444;">${fmt(grandSS)}</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-bottom: 3px solid var(--primary);">
                    <div style="font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem;">TOTAL NETO</div>
                    <div style="font-size: 1.4rem; font-weight: 700; color: var(--primary);">${fmt(grandTotal)}</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem;">SUMA T</div>
                    <div style="font-size: 1.2rem; font-weight: 700; color: var(--secondary);">${fmt(grandSumaT)}</div>
                </div>
            </div>
        `;
        container.appendChild(summaryBox);
    } else {
        container.innerHTML = '<p>No se han generado datos para el rango de fechas seleccionado.</p>';
    }
}

// Funciones auxiliares para control de cambios
function getEconomicState() {
    const ids = [
        'eco-salario', 'eco-antiguedad', 'eco-subida-pct',
        'eco-consolidacion', 'eco-otros', 'eco-pct63', 'eco-pct65',
        'exen-movistar', 'exen-seguro', 'exen-vida',
        'eco-sepe-importe', 'eco-sepe-ss'
    ];
    const data = {};
    ids.forEach(id => {
        const el = document.getElementById(id);
        if(el) data[id] = el.value;
    });
    return JSON.stringify(data);
}

function attemptCloseModal(modal) {
    if (modal.id === 'modal-economic') {
        const currentState = getEconomicState();
        // Verificar si hay cambios respecto al estado inicial
        if (initialEconomicData && currentState !== initialEconomicData) {
            if (confirm("Tienes cambios sin guardar. ¿Quieres guardarlos antes de salir?")) {
                saveEconomicData(); 
            } else {
                modal.style.display = 'none'; // Cerrar sin guardar
            }
        } else {
            modal.style.display = 'none';
        }
    } else {
        modal.style.display = 'none';
    }
}