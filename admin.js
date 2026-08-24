const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
const today = () => new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
let state = { admissions: [], content: [], gallery: [], documents: [] };
let saveTimer;
let saving = false;

const showMessage = (message, isError = false) => {
  let box = $('#adminMessage');
  if (!box) {
    box = document.createElement('div'); box.id = 'adminMessage'; box.className = 'admin-message'; document.body.appendChild(box);
  }
  box.textContent = message; box.classList.toggle('error', isError); box.classList.add('show');
  clearTimeout(box._timer); box._timer = setTimeout(() => box.classList.remove('show'), 3200);
};
const api = async (url, options = {}) => {
  const response = await fetch(url, { cache:'no-store', ...options, headers:{ 'Content-Type':'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || `Request failed (${response.status})`);
  return data;
};
const loadState = async () => {
  state = await api('/api/state');
  renderAll();
};
const saveState = async () => {
  if (saving) return;
  saving = true;
  try { state = await api('/api/state', { method:'PUT', body:JSON.stringify(state) }); showMessage('Saved to Neon. Changes are live on every device.'); }
  catch (error) { showMessage(error.message, true); throw error; }
  finally { saving = false; }
};
const scheduleSave = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => saveState().catch(() => {}), 450); };

const renderAdmissions = () => {
  const query = ($('#searchApplicants')?.value || '').toLowerCase();
  $('#admissionsTableBody').innerHTML = state.admissions.map((row, index) => ({ row, index }))
    .filter(({row}) => Object.values(row).join(' ').toLowerCase().includes(query))
    .map(({row,index}) => `<tr>
      <td>${escapeHtml(row.student)}</td><td>${escapeHtml(row.parent)}</td><td>${escapeHtml(row.phone)}</td><td>${escapeHtml(row.className)}</td><td>${escapeHtml(row.date)}</td>
      <td><select class="status-select" data-index="${index}">${['New','Contacted','Visit Scheduled','Documents Pending','Admission Confirmed','Rejected'].map(v => `<option ${v===row.status?'selected':''}>${v}</option>`).join('')}</select></td>
      <td><input data-index="${index}" data-field="notes" value="${escapeHtml(row.notes)}"></td>
      <td><input data-index="${index}" data-field="remarks" value="${escapeHtml(row.remarks)}"></td>
    </tr>`).join('');
};
const renderContent = () => { $('#contentList').innerHTML = state.content.map((item,index) => `<li><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description)}</span></div><div class="action-row"><button data-edit-index="${index}">Edit</button><button data-delete-index="${index}">Delete</button></div></li>`).join(''); };
const renderGallery = () => { $('#galleryGrid').innerHTML = state.gallery.map((src,index) => `<div class="gallery-item-wrap"><img src="${escapeHtml(src)}" alt="Gallery image"><button class="gallery-delete" data-gallery-index="${index}" aria-label="Delete">×</button></div>`).join(''); };
const renderDocuments = () => { $('#documentGrid').innerHTML = state.documents.map((doc,index) => `<div class="doc-card"><div class="doc-card-main"><i class="fa-solid ${escapeHtml(doc.icon)}"></i><span>${escapeHtml(doc.name)}</span></div><button class="doc-delete" data-document-index="${index}">Delete</button></div>`).join(''); };
const renderAll = () => { renderAdmissions(); renderContent(); renderGallery(); renderDocuments(); };

$('#loginForm').addEventListener('submit', event => {
  event.preventDefault();
  const valid = $('#emailInput').value.trim()==='principal@umamatric.com' && $('#passwordInput').value==='admin123' && $('#otpInput').value.trim()==='123456';
  if (!valid) { $('#loginError').textContent='Invalid credentials or 2FA code.'; return; }
  $('#loginError').textContent=''; $('#loginScreen').classList.add('hidden'); $('#adminShell').classList.remove('hidden');
  loadState().catch(error => showMessage(error.message, true));
});
$('#logoutBtn').addEventListener('click', () => { $('#adminShell').classList.add('hidden'); $('#loginScreen').classList.remove('hidden'); $('#loginForm').reset(); });
$('#searchApplicants').addEventListener('input', renderAdmissions);

document.addEventListener('change', event => {
  const target = event.target;
  if (target.matches('.status-select')) { state.admissions[Number(target.dataset.index)].status=target.value; scheduleSave(); }
  if (target.matches('[data-field]')) { state.admissions[Number(target.dataset.index)][target.dataset.field]=target.value.trim(); scheduleSave(); }
});
document.addEventListener('click', event => {
  const gallery = event.target.closest('[data-gallery-index]');
  const doc = event.target.closest('[data-document-index]');
  const del = event.target.closest('[data-delete-index]');
  const edit = event.target.closest('[data-edit-index]');
  if (gallery) { state.gallery.splice(Number(gallery.dataset.galleryIndex),1); renderGallery(); saveState().catch(()=>{}); }
  else if (doc) { state.documents.splice(Number(doc.dataset.documentIndex),1); renderDocuments(); saveState().catch(()=>{}); }
  else if (del) { state.content.splice(Number(del.dataset.deleteIndex),1); renderContent(); saveState().catch(()=>{}); }
  else if (edit) { const index=Number(edit.dataset.editIndex); $('#itemTitle').value=state.content[index].title; $('#itemDescription').value=state.content[index].description; $('#itemForm').dataset.editIndex=index; $('#modalTitle').textContent='Edit item'; $('#itemModal').classList.remove('hidden'); }
});
$('#addItemBtn').addEventListener('click', () => { $('#itemForm').reset(); delete $('#itemForm').dataset.editIndex; $('#modalTitle').textContent='Add item'; $('#itemModal').classList.remove('hidden'); });
$('#closeModalBtn').addEventListener('click', () => $('#itemModal').classList.add('hidden'));
$('#itemForm').addEventListener('submit', event => {
  event.preventDefault(); const item={ title:$('#itemTitle').value.trim(), description:$('#itemDescription').value.trim(), date:today() };
  const index=event.currentTarget.dataset.editIndex;
  if (index===undefined) state.content.unshift(item); else state.content[Number(index)]={...state.content[Number(index)],...item};
  $('#itemModal').classList.add('hidden'); renderContent(); saveState().catch(()=>{});
});

const compressImage = file => new Promise((resolve,reject) => {
  if (!file.type.startsWith('image/')) return reject(new Error('Please select an image file.'));
  const reader=new FileReader(); reader.onerror=()=>reject(new Error('Could not read image.'));
  reader.onload=()=>{ const img=new Image(); img.onerror=()=>reject(new Error('Invalid image.')); img.onload=()=>{
    const max=1280, scale=Math.min(1,max/Math.max(img.width,img.height));
    const canvas=document.createElement('canvas'); canvas.width=Math.round(img.width*scale); canvas.height=Math.round(img.height*scale);
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height); resolve(canvas.toDataURL('image/jpeg',0.76));
  }; img.src=reader.result; }; reader.readAsDataURL(file);
});
$('#uploadMediaBtn').addEventListener('click', () => $('#mediaInput').click());
$('#mediaInput').addEventListener('change', async event => {
  try { const file=event.target.files[0]; if(!file)return; const data=await compressImage(file); if(data.length>2_500_000) throw new Error('Image is still too large. Choose an image below 5 MB.'); state.gallery.unshift(data); renderGallery(); await saveState(); }
  catch(error){ showMessage(error.message,true); } finally { event.target.value=''; }
});
$('#uploadFileBtn').addEventListener('click', () => $('#fileInput').click());
$('#fileInput').addEventListener('change', event => {
  const file=event.target.files[0]; if(!file)return;
  if(file.size>900000){ showMessage('Document must be smaller than 900 KB for database storage.',true); event.target.value=''; return; }
  const reader=new FileReader(); reader.onload=async()=>{ const ext=file.name.split('.').pop().toLowerCase(); const icon=ext==='pdf'?'fa-file-pdf':['doc','docx'].includes(ext)?'fa-file-word':'fa-file'; state.documents.unshift({name:file.name,icon,dataUrl:String(reader.result)}); renderDocuments(); await saveState().catch(()=>{}); }; reader.readAsDataURL(file); event.target.value='';
});
$('#exportCsvBtn').addEventListener('click', () => {
  const rows=[['Student','Parent','Phone','Class','Date','Status','Notes','Remarks'],...state.admissions.map(r=>[r.student,r.parent,r.phone,r.className,r.date,r.status,r.notes,r.remarks])];
  const csv=rows.map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='uma-admissions.csv'; a.click(); URL.revokeObjectURL(a.href);
});
renderAll();
