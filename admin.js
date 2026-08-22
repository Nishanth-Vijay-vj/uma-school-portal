const loginForm = document.getElementById('loginForm');
const loginScreen = document.getElementById('loginScreen');
const adminShell = document.getElementById('adminShell');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');

const validUser = {
  email: 'principal@umamatric.com',
  password: 'admin123',
  otp: '123456'
};

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();
  const otp = document.getElementById('otpInput').value.trim();

  if (!email || !password || !otp) {
    loginError.textContent = 'Please enter email, password and the 2FA code.';
    return;
  }

  if (email !== validUser.email || password !== validUser.password || otp !== validUser.otp) {
    loginError.textContent = 'Invalid credentials. Use the demo admin login details and 2FA code 123456.';
    return;
  }

  loginError.textContent = '';
  loginScreen.classList.add('hidden');
  adminShell.classList.remove('hidden');
});

logoutBtn.addEventListener('click', () => {
  adminShell.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  loginForm.reset();
  loginError.textContent = '';
});

const adminStateKey = 'umaAdminDashboardState';
const defaultState = {
  admissions: [
    {
      student: 'Arjun V',
      parent: 'Vijay',
      phone: '+91 98200 12121',
      className: 'Grade 9',
      date: '12 Aug 2025',
      status: 'New',
      notes: 'Interested in science stream',
      remarks: 'Follow-up on Friday'
    },
    {
      student: 'Meera P',
      parent: 'Priya',
      phone: '+91 98888 43210',
      className: 'Grade 7',
      date: '10 Aug 2025',
      status: 'Contacted',
      notes: 'Asked for campus tour',
      remarks: 'Tour scheduled'
    },
    {
      student: 'Nisha R',
      parent: 'Raja',
      phone: '+91 90300 78912',
      className: 'Grade 11',
      date: '08 Aug 2025',
      status: 'Visit Scheduled',
      notes: 'Documents pending',
      remarks: 'Need counseling'
    },
    {
      student: 'Dhruv S',
      parent: 'Shankar',
      phone: '+91 90567 29081',
      className: 'Grade 12',
      date: '04 Aug 2025',
      status: 'Admission Confirmed',
      notes: 'Fee process in progress',
      remarks: 'Ready for enrollment'
    }
  ],
  content: [
    { title: 'Science Expo 2025', description: 'Scheduled for 24 Sep' },
    { title: 'Holiday Notice', description: 'Monsoon break on 15 Aug' }
  ],
  gallery: [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80'
  ],
  documents: [
    { name: 'Academic Calendar.pdf', icon: 'fa-file-pdf' },
    { name: 'Faculty Roster.docx', icon: 'fa-file-word' },
    { name: 'Disclosures.csv', icon: 'fa-file-csv' }
  ]
};

const normalizeAdminState = (state) => ({
  admissions: Array.isArray(state?.admissions) ? state.admissions : defaultState.admissions,
  content: Array.isArray(state?.content) ? state.content : defaultState.content,
  gallery: Array.isArray(state?.gallery) ? state.gallery : defaultState.gallery,
  documents: Array.isArray(state?.documents) ? state.documents : defaultState.documents
});

const loadState = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(adminStateKey) || 'null');
    if (!saved) return JSON.parse(JSON.stringify(defaultState));
    return normalizeAdminState(saved);
  } catch {
    return JSON.parse(JSON.stringify(defaultState));
  }
};

const saveState = (state) => {
  const normalized = normalizeAdminState(state);
  localStorage.setItem(adminStateKey, JSON.stringify(normalized));
  fetch('/api/state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalized)
  }).catch(() => {});
};

const hydrateAdminStateFromServer = async () => {
  try {
    const response = await fetch('/api/state', { cache: 'no-store' });
    if (!response.ok) return;
    const serverState = normalizeAdminState(await response.json());
    localStorage.setItem(adminStateKey, JSON.stringify(serverState));
    renderDashboards();
  } catch {
    // Keep using the browser cache if the backend is unavailable.
  }
};

const renderAdmissions = () => {
  const state = loadState();
  const tbody = document.getElementById('admissionsTableBody');
  const searchValue = document.getElementById('searchApplicants')?.value.trim().toLowerCase() || '';

  const filtered = state.admissions
    .map((row, originalIndex) => ({ row, originalIndex }))
    .filter(({ row }) => {
      const haystack = `${row.student} ${row.parent} ${row.phone} ${row.className} ${row.status} ${row.notes} ${row.remarks}`.toLowerCase();
      return haystack.includes(searchValue);
    });

  tbody.innerHTML = filtered
    .map(({ row, originalIndex }) => `
      <tr>
        <td>${row.student}</td>
        <td>${row.parent}</td>
        <td>${row.phone}</td>
        <td>${row.className}</td>
        <td>${row.date}</td>
        <td>
          <select class="status-select" data-index="${originalIndex}">
            ${['New', 'Contacted', 'Visit Scheduled', 'Documents Pending', 'Admission Confirmed', 'Rejected']
              .map((status) => `<option value="${status}" ${status === row.status ? 'selected' : ''}>[${status}]</option>`)
              .join('')}
          </select>
        </td>
        <td><input type="text" value="${row.notes}" data-field="notes" data-index="${originalIndex}" /></td>
        <td><input type="text" value="${row.remarks}" data-field="remarks" data-index="${originalIndex}" /></td>
      </tr>
    `)
    .join('');
};

const renderContent = () => {
  const state = loadState();
  const list = document.getElementById('contentList');
  list.innerHTML = state.content
    .map((item, index) => `
      <li>
        <div>
          <strong>${item.title}</strong>
          <span>${item.description}</span>
        </div>
        <div class="action-row">
          <button type="button" data-edit-index="${index}">Edit</button>
          <button type="button" data-delete-index="${index}">Delete</button>
        </div>
      </li>
    `)
    .join('');
};

const renderGallery = () => {
  const state = loadState();
  const galleryGrid = document.getElementById('galleryGrid');
  galleryGrid.innerHTML = state.gallery
    .map((src, index) => `
      <div class="gallery-item-wrap">
        <img src="${src}" alt="Gallery item" />
        <button type="button" class="gallery-delete" data-gallery-index="${index}" aria-label="Delete gallery image">×</button>
      </div>
    `)
    .join('');
};

const renderDocuments = () => {
  const state = loadState();
  const documentGrid = document.getElementById('documentGrid');
  documentGrid.innerHTML = state.documents
    .map((doc, index) => `
      <div class="doc-card">
        <div class="doc-card-main">
          <i class="fa-solid ${doc.icon}"></i>
          <span>${doc.name}</span>
        </div>
        <button type="button" class="doc-delete" data-document-index="${index}" aria-label="Delete document">Delete</button>
      </div>
    `)
    .join('');
};

const renderDashboards = () => {
  renderAdmissions();
  renderContent();
  renderGallery();
  renderDocuments();
};

const syncState = (updater) => {
  const state = loadState();
  updater(state);
  saveState(state);
  renderDashboards();
  window.dispatchEvent(new Event('umaAdminStateChanged'));
};

const searchInput = document.getElementById('searchApplicants');
if (searchInput) {
  searchInput.addEventListener('input', renderAdmissions);
}

const statusSelectsHandler = (event) => {
  const target = event.target;
  if (!target.classList.contains('status-select')) return;

  const index = Number(target.dataset.index);
  syncState((state) => {
    state.admissions[index].status = target.value.replace(/[\[\]]/g, '');
  });
};

document.addEventListener('change', (event) => {
  const target = event.target;

  if (target.classList.contains('status-select')) {
    statusSelectsHandler(event);
    return;
  }

  if (target.matches('[data-field="notes"]') || target.matches('[data-field="remarks"]')) {
    const index = Number(target.dataset.index);
    const field = target.dataset.field;
    syncState((state) => {
      state.admissions[index][field] = target.value;
    });
  }
});

document.addEventListener('click', (event) => {
  const galleryDeleteButton = event.target.closest('[data-gallery-index]');
  if (galleryDeleteButton) {
    event.preventDefault();
    event.stopPropagation();
    const index = Number(galleryDeleteButton.dataset.galleryIndex);
    syncState((state) => {
      state.gallery.splice(index, 1);
    });
    return;
  }

  const documentDeleteButton = event.target.closest('[data-document-index]');
  if (documentDeleteButton) {
    event.preventDefault();
    event.stopPropagation();
    const index = Number(documentDeleteButton.dataset.documentIndex);
    syncState((state) => {
      state.documents.splice(index, 1);
    });
    return;
  }

  const button = event.target.closest('[data-delete-index]');
  if (button) {
    event.preventDefault();
    event.stopPropagation();
    const index = Number(button.dataset.deleteIndex);
    syncState((state) => {
      state.content.splice(index, 1);
    });
    return;
  }

  const editButton = event.target.closest('[data-edit-index]');
  if (editButton) {
    event.preventDefault();
    event.stopPropagation();
    const index = Number(editButton.dataset.editIndex);
    const state = loadState();
    const item = state.content[index];
    const modal = document.getElementById('itemModal');
    const modalTitle = document.getElementById('modalTitle');
    const itemTitle = document.getElementById('itemTitle');
    const itemDescription = document.getElementById('itemDescription');
    const form = document.getElementById('itemForm');

    if (!item || !modal || !modalTitle || !itemTitle || !itemDescription || !form) return;

    modalTitle.textContent = 'Edit item';
    itemTitle.value = item.title;
    itemDescription.value = item.description;
    form.dataset.editIndex = String(index);
    modal.classList.remove('hidden');
    return;
  }

  const closeModalButton = event.target.closest('#closeModalBtn');
  if (closeModalButton) {
    event.preventDefault();
    event.stopPropagation();
    const modal = document.getElementById('itemModal');
    const form = document.getElementById('itemForm');
    if (modal) modal.classList.add('hidden');
    if (form) {
      form.reset();
      delete form.dataset.editIndex;
    }
  }
});

const itemForm = document.getElementById('itemForm');
if (itemForm) {
  itemForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const titleInput = document.getElementById('itemTitle');
    const descriptionInput = document.getElementById('itemDescription');
    if (!titleInput || !descriptionInput) return;

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    if (!title || !description) return;

    const editIndex = itemForm.dataset.editIndex;
    syncState((state) => {
      if (editIndex !== undefined) {
        const index = Number(editIndex);
        state.content[index] = {
          ...state.content[index],
          title,
          description,
          date: state.content[index]?.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        };
      } else {
        state.content.push({
          title,
          description,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        });
      }
    });

    itemForm.reset();
    const modal = document.getElementById('itemModal');
    if (modal) modal.classList.add('hidden');
    delete itemForm.dataset.editIndex;
  });
}

const addItemBtn = document.getElementById('addItemBtn');
if (addItemBtn) {
  addItemBtn.addEventListener('click', () => {
    const modal = document.getElementById('itemModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('itemForm');

    modalTitle.textContent = 'Add item';
    form.reset();
    delete form.dataset.editIndex;
    modal.classList.remove('hidden');
  });
}

const mediaInput = document.getElementById('mediaInput');
const uploadMediaBtn = document.getElementById('uploadMediaBtn');
if (uploadMediaBtn && mediaInput) {
  uploadMediaBtn.addEventListener('click', () => mediaInput.click());
  mediaInput.addEventListener('change', () => {
    const file = mediaInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      syncState((state) => state.gallery.push(String(reader.result)));
      mediaInput.value = '';
    };
    reader.readAsDataURL(file);
  });
}

const fileInput = document.getElementById('fileInput');
const uploadFileBtn = document.getElementById('uploadFileBtn');
if (uploadFileBtn && fileInput) {
  uploadFileBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const extension = file.name.split('.').pop().toLowerCase();
    const icon = extension === 'pdf' ? 'fa-file-pdf' : extension === 'doc' || extension === 'docx' ? 'fa-file-word' : 'fa-file-csv';
    syncState((state) => state.documents.push({ name: file.name, icon }));
    fileInput.value = '';
  });
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  document.getElementById('adminShell').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginForm').reset();
  document.getElementById('loginError').textContent = '';
});

document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
  const state = loadState();
  const rows = [
    ['Student', 'Parent', 'Phone', 'Class', 'Date', 'Status', 'Notes', 'Remarks']
  ];
  state.admissions.forEach((row) => rows.push([
    row.student, row.parent, row.phone, row.className, row.date, row.status, row.notes, row.remarks
  ]));

  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'uma-admissions.csv';
  link.click();
  URL.revokeObjectURL(url);
});

hydrateAdminStateFromServer();
renderDashboards();
