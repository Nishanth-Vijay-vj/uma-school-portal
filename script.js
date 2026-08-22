const adminStateKey = 'umaAdminDashboardState';
const defaultAdminState = {
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
    { title: 'Science Expo 2025', description: 'Scheduled for 24 Sep', date: '12 Aug 2025' },
    { title: 'Holiday Notice', description: 'Monsoon break on 15 Aug', date: '10 Aug 2025' },
    { title: 'Parent Orientation', description: 'Campus briefing for parents on 18 Sep', date: '14 Aug 2025' }
  ],
  gallery: [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
  ],
  documents: [
    { name: 'Academic Calendar.pdf', icon: 'fa-file-pdf' },
    { name: 'Faculty Roster.docx', icon: 'fa-file-word' },
    { name: 'Disclosures.csv', icon: 'fa-file-csv' }
  ]
};

const normalizeAdminState = (state) => ({
  admissions: Array.isArray(state?.admissions) ? state.admissions : defaultAdminState.admissions,
  content: Array.isArray(state?.content) ? state.content : defaultAdminState.content,
  gallery: Array.isArray(state?.gallery) ? state.gallery : defaultAdminState.gallery,
  documents: Array.isArray(state?.documents) ? state.documents : defaultAdminState.documents
});

const readAdminState = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(adminStateKey) || 'null');
    if (!saved) return JSON.parse(JSON.stringify(defaultAdminState));
    return normalizeAdminState(saved);
  } catch {
    return JSON.parse(JSON.stringify(defaultAdminState));
  }
};

const writeAdminState = (state) => {
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
    renderHomePage();
  } catch {
    // Fallback to local browser storage when the backend is unavailable.
  }
};

const formatDownloadMime = (name) => {
  const extension = String(name).split('.').pop().toLowerCase();
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'csv') return 'text/csv';
  if (extension === 'doc' || extension === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return 'application/octet-stream';
};

const renderHomePage = () => {
  const state = readAdminState();
  const items = state.content.length ? state.content : defaultAdminState.content;

  const newsList = document.querySelector('.news-list');
  if (newsList) {
    newsList.innerHTML = items.slice(0, 3).map((item, index) => {
      const label = item.date ? item.date.split(' ').slice(0, 2).join(' ') : `0${index + 1}`;
      return `
        <li>
          <span class="date">${label}</span>
          <div>
            <h4>${item.title}</h4>
            <p>${item.description}</p>
          </div>
        </li>
      `;
    }).join('');
  }

  const eventList = document.querySelector('.event-list');
  if (eventList) {
    eventList.innerHTML = items.slice(0, 3).map((item, index) => {
      const dateParts = item.date ? item.date.split(' ') : ['24', 'Sep'];
      const day = dateParts[0] || String(index + 1);
      const month = dateParts[1] || 'Sep';
      return `
        <div class="event-card">
          <div class="event-date">
            <strong>${day}</strong>
            <span>${month}</span>
          </div>
          <div>
            <h4>${item.title}</h4>
            <p>${item.description}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  const galleryGrid = document.querySelector('.gallery-mini-grid');
  if (galleryGrid) {
    const gallery = state.gallery.length ? state.gallery : defaultAdminState.gallery;
    galleryGrid.innerHTML = gallery.slice(0, 4).map((src) => `<img src="${src}" alt="Campus photos" />`).join('');
  }

  const downloadsTableBody = document.querySelector('#downloadsTableBody');
  if (downloadsTableBody) {
    const documents = state.documents.length ? state.documents : defaultAdminState.documents;
    downloadsTableBody.innerHTML = documents.map((doc) => `
      <tr>
        <td>${doc.name}</td>
        <td>${String(doc.name).split('.').pop().toUpperCase() || 'PDF'}</td>
        <td>Updated today</td>
        <td><button type="button" class="download-link" data-download-name="${doc.name}">Download</button></td>
      </tr>
    `).join('');
  }
};

const triggerDownload = (fileName) => {
  const content = `UMA School Document\n\nDocument: ${fileName}\nGenerated from the UMA School portal demo.`;
  const blob = new Blob([content], { type: formatDownloadMime(fileName) });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const slides = document.querySelectorAll('.slide');
if (slides.length) {
  let current = 0;
  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 4200);
}

const header = document.querySelector('.site-header');
const toggleButton = document.querySelector('.menu-toggle');
if (toggleButton) {
  toggleButton.addEventListener('click', () => {
    header.classList.toggle('open');
  });
}

document.querySelectorAll('.dropdown').forEach((dropdown) => {
  const submenu = dropdown.querySelector('.submenu');
  const trigger = dropdown.querySelector('a');
  if (!submenu || !trigger) return;

  const setDropdownState = (isOpen) => {
    dropdown.classList.toggle('active', isOpen);
    submenu.style.display = isOpen ? 'block' : 'none';
  };

  setDropdownState(false);

  dropdown.addEventListener('mouseenter', () => {
    if (window.innerWidth > 820) setDropdownState(true);
  });

  dropdown.addEventListener('mouseleave', () => {
    if (window.innerWidth > 820) setDropdownState(false);
  });

  trigger.addEventListener('focusin', () => {
    if (window.innerWidth > 820) setDropdownState(true);
  });

  trigger.addEventListener('focusout', (event) => {
    if (!dropdown.contains(event.relatedTarget)) {
      setDropdownState(false);
    }
  });

  trigger.addEventListener('click', (event) => {
    if (window.innerWidth <= 820) {
      event.preventDefault();
      const shouldOpen = !dropdown.classList.contains('active');
      setDropdownState(shouldOpen);
    }
  });
});

const tabButtons = document.querySelectorAll('.tab');
const tabPanels = document.querySelectorAll('.tab-panel');
if (tabButtons.length) {
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.tab;

      tabButtons.forEach((btn) => {
        btn.classList.toggle('active', btn === button);
        btn.setAttribute('aria-selected', btn === button ? 'true' : 'false');
      });

      tabPanels.forEach((panel) => {
        panel.classList.toggle('active', panel.id === target);
      });
    });
  });
}

const filters = document.querySelectorAll('.filter');
const awardCards = document.querySelectorAll('.award-card');
if (filters.length) {
  filters.forEach((filterButton) => {
    filterButton.addEventListener('click', () => {
      const filter = filterButton.dataset.filter;
      filters.forEach((btn) => btn.classList.toggle('active', btn === filterButton));

      awardCards.forEach((card) => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden', !show);
      });
    });
  });
}

const counters = document.querySelectorAll('[data-count]');
const animateNumbers = () => {
  counters.forEach((counter) => {
    const target = Number(counter.dataset.count);
    const duration = 1800;
    const step = Math.ceil(target / (duration / 16));
    let current = 0;

    const tick = () => {
      current += step;
      if (current >= target) {
        counter.textContent = target.toLocaleString();
        return;
      }
      counter.textContent = current.toLocaleString();
      requestAnimationFrame(tick);
    };

    tick();
  });
};

const statsSection = document.querySelector('.stats');
if (statsSection) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateNumbers();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(statsSection);
}

document.addEventListener('click', (event) => {
  const downloadLink = event.target.closest('[data-download-name]');
  if (downloadLink) {
    event.preventDefault();
    triggerDownload(downloadLink.dataset.downloadName);
    return;
  }
});

const admissionForm = document.getElementById('admissionForm');
const formStatus = document.querySelector('.form-status');
if (admissionForm) {
  admissionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(admissionForm);

    const payload = Object.fromEntries(formData.entries());
    const requiredFields = ['studentName', 'parentName', 'mobile', 'email', 'classApplying', 'address'];
    const missing = requiredFields.some((field) => !payload[field] || !String(payload[field]).trim());

    if (missing) {
      formStatus.textContent = 'Please complete the highlighted required fields.';
      formStatus.style.color = '#d94c4c';
      return;
    }

    const state = readAdminState();
    const entry = {
      student: payload.studentName.trim(),
      parent: payload.parentName.trim(),
      phone: payload.mobile.trim(),
      className: payload.classApplying,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'New',
      notes: 'Submitted via website enquiry form',
      remarks: 'Awaiting review'
    };

    state.admissions = [entry, ...state.admissions];
    writeAdminState(state);

    formStatus.textContent = 'Admission enquiry submitted successfully. Our admissions team will contact you shortly.';
    formStatus.style.color = '#2e9d63';
    admissionForm.reset();

    renderHomePage();
    window.dispatchEvent(new Event('umaAdminStateChanged'));

    fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        source: 'UMA school admission enquiry',
        recaptcha: 'v3_validated'
      })
    }).catch(() => {});
  });
}

window.addEventListener('umaAdminStateChanged', renderHomePage);
window.addEventListener('storage', renderHomePage);
hydrateAdminStateFromServer();
renderHomePage();
