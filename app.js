// --- DATOS FALSOS: HISTORIAL DE CITAS DEL PACIENTE ---
const mockHistorialMedic = [
    "05/05/2026 | Alergologo - Prueba de alergias",
    "02/05/2026 | Radiologia - Radiografia",
    "15/04/2026 | Urgències - Atenció per esquinç turmell",
    "10/03/2026 | Cardiologia - Electrocardiograma",
    "22/01/2026 | Medicina Interna - Analítica general"
];

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
    initData();
    routeLogic();
});

function initData() {
    if (!localStorage.getItem('docusalut_requests')) {
        const mockRequests = [
            { id: 1683000000001, sip: "11111111", name: "Carles Puig", email: "carles@test.com", type: "Informe Clínic", appointment: "02/05/2026 | Traumatologia - Radiografia de tòrax", reason: "Revisió per a metge privat", status: "Pendent", date: "2026-05-08" },
            { id: 1683000000002, sip: "22222222", name: "Aina Fuster", email: "aina@test.com", type: "Justificant d'Assistència", appointment: "15/04/2026 | Urgències - Atenció per esquinç turmell", reason: "Justificar absència a la feina", status: "Acceptada", date: "2026-05-07" }
        ];
        localStorage.setItem('docusalut_requests', JSON.stringify(mockRequests));
    }
    if (!localStorage.getItem('docusalut_surveys')) {
        localStorage.setItem('docusalut_surveys', JSON.stringify([]));
    }
}

// --- ENRUTADOR BASADO EN EL DOM ---
function routeLogic() {
    // 1. Lógica para login.html
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const sip = document.getElementById('loginSip').value.trim();
            if(sip.length > 4) {
                sessionStorage.setItem('currentUserSIP', sip);
                window.location.href = 'pacient.html';
            }
        });
    }

    // 2. Lógica para pacient.html
    const patientTableBody = document.getElementById('patientTableBody');
    if (patientTableBody) {
        const activeSip = sessionStorage.getItem('currentUserSIP');
        if (!activeSip) {
            window.location.href = 'login.html';
            return;
        }
        document.getElementById('reqSip').value = activeSip;
        
        // Cargar historial de citas en el select
        const selectAppointment = document.getElementById('reqAppointment');
        if(selectAppointment) {
            mockHistorialMedic.forEach(cita => {
                let opt = document.createElement('option');
                opt.value = cita;
                opt.textContent = cita;
                selectAppointment.appendChild(opt);
            });
        }

        renderPatientTable(activeSip);

        // Enviar nueva solicitud
        const requestForm = document.getElementById('requestForm');
        if(requestForm) {
            requestForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const newReq = {
                    id: Date.now(),
                    sip: document.getElementById('reqSip').value,
                    name: document.getElementById('reqName').value,
                    email: document.getElementById('reqEmail').value,
                    appointment: document.getElementById('reqAppointment').value,
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
                Swal.fire('Enviada', 'Petició registrada correctament.', 'success');
                renderPatientTable(activeSip);
            });
        }

        // Lógica de la encuesta
        const surveyForm = document.getElementById('surveyForm');
        if(surveyForm) {
            surveyForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const survey = {
                    usability: parseInt(document.getElementById('surveyUsability').value),
                    security: parseInt(document.getElementById('surveySecurity').value)
                };
                let surveys = JSON.parse(localStorage.getItem('docusalut_surveys'));
                surveys.push(survey);
                localStorage.setItem('docusalut_surveys', JSON.stringify(surveys));
                bootstrap.Modal.getInstance(document.getElementById('surveyModal')).hide();
                Swal.fire('Gràcies!', 'La teua valoració ha sigut guardada.', 'success');
            });
        }
    }

    // 3. Lógica para admin.html
    if (document.getElementById('adminTableBody')) {
        renderAdminTable();
    }
}

// --- FUNCIONES DE TABLAS Y GESTIÓN ---

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
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No tens sol·licituds actives.</td></tr>`;
        return;
    }

    userRequests.forEach(req => {
        let actionHtml = req.status === 'Acceptada' 
            ? `<button class="btn btn-success btn-sm" onclick="downloadDocument(${req.id})"><i class="fa-solid fa-file-pdf"></i> Descarregar</button>` 
            : `<span class="badge bg-secondary">${req.status}</span>`;
        
        tbody.innerHTML += `
            <tr>
                <td>${req.date}</td>
                <td>
                    <strong>${req.type}</strong><br>
                    <small class="text-muted"><i class="fa-solid fa-stethoscope text-primary me-1"></i> ${req.appointment || 'No especificada'}</small>
                </td>
                <td>${req.status}</td>
                <td>${actionHtml}</td>
            </tr>`;
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
    
    const searchInput = document.getElementById('searchSip');
    const searchSip = searchInput ? searchInput.value.trim() : '';

    if (searchSip) requests = requests.filter(r => r.sip.includes(searchSip));
    tbody.innerHTML = '';

    requests.forEach(req => {
        let actionBtn = req.status === 'Pendent' ? `
            <button class="btn btn-success btn-sm me-1" onclick="updateReq(${req.id}, 'Acceptada')" title="Validar i Adjuntar PDF"><i class="fa-solid fa-check"></i></button>
            <button class="btn btn-outline-danger btn-sm" onclick="updateReq(${req.id}, 'Denegada')" title="Denegar"><i class="fa-solid fa-xmark"></i></button>
        ` : `<span class="badge bg-light text-dark border">Gestionat</span>`;

        let badgeStatus = req.status === 'Pendent' ? 'bg-warning text-dark' : (req.status === 'Acceptada' ? 'bg-success' : 'bg-danger');

        tbody.innerHTML += `
            <tr>
                <td class="small">${req.date}</td>
                <td>
                    <strong>${req.sip}</strong><br>
                    <small class="text-muted">${req.name}</small>
                </td>
                <td>
                    <strong>${req.type}</strong><br>
                    <small class="text-primary"><i class="fa-solid fa-stethoscope"></i> Cita: ${req.appointment || 'N/A'}</small><br>
                    <small class="text-muted fst-italic"><i class="fa-solid fa-comment-dots"></i> "${req.reason}"</small>
                </td>
                <td><span class="badge ${badgeStatus}">${req.status}</span></td>
                <td class="text-center">${actionBtn}</td>
            </tr>`;
    });

    const surveyStats = document.getElementById('surveyStats');
    if (surveyStats) {
        const surveys = JSON.parse(localStorage.getItem('docusalut_surveys')) || [];
        if (surveys.length > 0) {
            let total = surveys.reduce((acc, curr) => acc + ((curr.usability + curr.security) / 2), 0);
            surveyStats.innerHTML = `${(total / surveys.length).toFixed(1)} / 5 <i class="fa-solid fa-star text-warning ms-1" style="font-size:1.2rem;"></i>`;
        }
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
        didOpen: () => { Swal.showLoading() }
    }).then(() => {
        const sipDemo = "99999999"; 
        sessionStorage.setItem('currentUserSIP', sipDemo);
        
        Swal.fire({
            icon: 'success', title: 'Identitat Verificada', text: 'Accedint al portal...', showConfirmButton: false, timer: 1500
        }).then(() => { window.location.href = 'pacient.html'; });
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
    const inputElement = document.getElementById(inputId);
    const labelElement = document.getElementById(labelId);
    
    if(inputElement && labelElement) {
        const value = parseInt(inputElement.value);
        labelElement.textContent = descripcionesEscala[value];
        
        if (value >= 4) {
            labelElement.className = "badge bg-success fs-6 shadow-sm";
        } else if (value === 3) {
            labelElement.className = "badge bg-warning text-dark fs-6 shadow-sm";
        } else {
            labelElement.className = "badge bg-danger fs-6 shadow-sm";
        }
    }
}