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
            loginView.style.display = 'none';
            appView.style.display = 'block';
            userDisplay.textContent = user.email;
            // Aquí podrías cargar datos iniciales si fuera necesario
        } else {
            console.log('No hay usuario logueado');
            appView.style.display = 'none';
            loginView.style.display = 'flex';
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
            break;
        case 'economic':
            const modalEco = document.getElementById('modal-economic');
            if(modalEco) modalEco.style.display = 'block';
            loadEconomicData(); // Cargar datos si existen
            break;
        case 'simulation':
            alert('Iniciando Simulación Anual...');
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
    const exencion = getVal('eco-exencion');

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
        eco_exencion: Number(document.getElementById('eco-exencion').value),
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
            if(data.eco_exencion) document.getElementById('eco-exencion').value = data.eco_exencion;
            
            // Recalcular con los datos cargados
            calculateEconomic();
        }
    }).catch((error) => {
        console.log("Error al cargar datos:", error);
    });
}