// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
    initData();
    routeLogic();
});

function initData() {
    if (!localStorage.getItem('docusalut_requests')) {
        const mockRequests = [
            { id: 1683000000001, sip: "11111111", name: "Carles Puig", email: "carles@test.com", type: "Informe Clínic", reason: "Revisió metge privat", status: "Pendent", date: "2026-05-08" },
            { id: 1683000000002, sip: "22222222", name: "Aina Fuster", email: "aina@test.com", type: "Certificat Mèdic", reason: "Renovació carnet de conduir", status: "Acceptada", date: "2026-05-07" }
        ];
        localStorage.setItem('docusalut_requests', JSON.stringify(mockRequests));
    }
    if (!localStorage.getItem('docusalut_surveys')) {
        localStorage.setItem('docusalut_surveys', JSON.stringify([]));
    }
}

// --- ENRUTADOR BASADO EN EL DOM ---
function routeLogic() {
    // Lógica para login.html
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const sip = document.getElementById('loginSip').value.trim();
            if(sip.length > 4) {
                sessionStorage.setItem('currentUserSIP', sip); // Guardamos la sesión
                window.location.href = 'pacient.html'; // Redirigimos
            }
        });
    }

    // Lógica para pacient.html
    const patientTableBody = document.getElementById('patientTableBody');
    if (patientTableBody) {
        const activeSip = sessionStorage.getItem('currentUserSIP');
        if (!activeSip) {
            window.location.href = 'login.html'; // Protegemos la ruta
            return;
        }
        document.getElementById('reqSip').value = activeSip;
        renderPatientTable(activeSip);

        document.getElementById('requestForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const newReq = {
                id: Date.now(),
                sip: document.getElementById('reqSip').value,
                name: document.getElementById('reqName').value,
                email: document.getElementById('reqEmail').value,
                type: document.getElementById('reqType').value,
                reason: document.getElementById('reqReason').value,
                status: "Pendent",
                date: new Date().toISOString().split('T')[0]
            };
            let requests = JSON.parse(localStorage.getItem('docusalut_requests'));
            requests.unshift(newReq);
            localStorage.setItem('docusalut_requests', JSON.stringify(requests));
            this.reset();
            document.getElementById('reqSip').value = activeSip;
            Swal.fire('Enviada', 'Petició registrada.', 'success');
            renderPatientTable(activeSip);
        });

        // Lógica encuesta
        document.getElementById('surveyForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const survey = {
                usability: parseInt(document.getElementById('surveyUsability').value),
                security: parseInt(document.getElementById('surveySecurity').value)
            };
            let surveys = JSON.parse(localStorage.getItem('docusalut_surveys'));
            surveys.push(survey);
            localStorage.setItem('docusalut_surveys', JSON.stringify(surveys));
            bootstrap.Modal.getInstance(document.getElementById('surveyModal')).hide();
            Swal.fire('Gràcies!', 'Valoració guardada.', 'success');
        });
    }

    // Lógica para admin.html
    if (document.getElementById('adminTableBody')) {
        renderAdminTable();
    }
}

// --- FUNCIONES COMPARTIDAS Y GLOBALES ---

function logout() {
    sessionStorage.removeItem('currentUserSIP');
    window.location.href = 'index.html';
}

function renderPatientTable(activeSip) {
    const tbody = document.getElementById('patientTableBody');
    const requests = JSON.parse(localStorage.getItem('docusalut_requests')) || [];
    const userRequests = requests.filter(r => r.sip === activeSip);
    
    tbody.innerHTML = '';
    if (userRequests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No tens sol·licituds.</td></tr>`;
        return;
    }

    userRequests.forEach(req => {
        let actionHtml = req.status === 'Acceptada' 
            ? `<button class="btn btn-success btn-sm" onclick="downloadDocument(${req.id})"><i class="fa-solid fa-file-pdf"></i> Descarregar</button>` 
            : `<span class="badge bg-secondary">${req.status}</span>`;
        
        tbody.innerHTML += `<tr><td>${req.date}</td><td>${req.type}</td><td>${req.status}</td><td>${actionHtml}</td></tr>`;
    });
}

function downloadDocument(id) {
    Swal.fire({
        title: 'Generant PDF...', timer: 1500, didOpen: () => Swal.showLoading()
    }).then(() => {
        new bootstrap.Modal(document.getElementById('surveyModal')).show();
    });
}

function renderAdminTable() {
    const tbody = document.getElementById('adminTableBody');
    let requests = JSON.parse(localStorage.getItem('docusalut_requests')) || [];
    const searchSip = document.getElementById('searchSip').value.trim();

    if (searchSip) requests = requests.filter(r => r.sip.includes(searchSip));
    tbody.innerHTML = '';

    requests.forEach(req => {
        let actionBtn = req.status === 'Pendent' ? `
            <button class="btn btn-success btn-sm" onclick="updateReq(${req.id}, 'Acceptada')">Acceptar</button>
            <button class="btn btn-danger btn-sm" onclick="updateReq(${req.id}, 'Denegada')">Denegar</button>
        ` : `<span class="text-muted">Gestionat</span>`;

        tbody.innerHTML += `<tr><td>${req.date}</td><td>${req.sip}</td><td>${req.type}</td><td>${req.status}</td><td>${actionBtn}</td></tr>`;
    });

    // Actualizar media de encuestas
    const surveys = JSON.parse(localStorage.getItem('docusalut_surveys')) || [];
    if (surveys.length > 0) {
        let total = surveys.reduce((acc, curr) => acc + ((curr.usability + curr.security) / 2), 0);
        document.getElementById('surveyStats').innerHTML = `${(total / surveys.length).toFixed(1)} / 5 <i class="fa-solid fa-star text-warning"></i>`;
    }
}

function updateReq(id, status) {
    let requests = JSON.parse(localStorage.getItem('docusalut_requests'));
    let req = requests.find(r => r.id === id);
    if (req) {
        req.status = status;
        localStorage.setItem('docusalut_requests', JSON.stringify(requests));
        renderAdminTable();
    }
}

// --- FUNCIÓN PARA SIMULAR LOGIN CON CERTIFICADO/CL@VE ---
function simularLoginEspecial(metodo) {
    Swal.fire({
        title: `Connectant amb ${metodo}...`,
        html: 'Validant credencials segures. Per favor, espere.',
        timer: 2000,
        timerProgressBar: true,
        didOpen: () => {
            Swal.showLoading()
        }
    }).then(() => {
        // Logueamos con un SIP genérico de Demo
        const sipDemo = "99999999"; 
        sessionStorage.setItem('currentUserSIP', sipDemo);
        
        Swal.fire({
            icon: 'success',
            title: 'Identitat Verificada',
            text: 'Accedint al portal...',
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            window.location.href = 'pacient.html';
        });
    });
}

// --- LÓGICA DE LOS DESLIZADORES DINÁMICOS (Encuesta) ---
const descripcionesEscala = {
    1: "1 - Molt roí",
    2: "2 - Millorable",
    3: "3 - Acceptable",
    4: "4 - Bé",
    5: "5 - Excel·lent"
};

function updateSliderLabel(inputId, labelId) {
    const value = parseInt(document.getElementById(inputId).value);
    const label = document.getElementById(labelId);
    
    // Cambiar el texto
    label.textContent = descripcionesEscala[value];
    
    // Cambiar el color de la etiqueta visualmente según la nota
    if (value >= 4) {
        label.className = "badge bg-success fs-6 shadow-sm"; // Verde
    } else if (value === 3) {
        label.className = "badge bg-warning text-dark fs-6 shadow-sm"; // Naranja/Amarillo
    } else {
        label.className = "badge bg-danger fs-6 shadow-sm"; // Rojo
    }
}