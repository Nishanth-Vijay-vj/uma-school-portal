const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
let siteState = { admissions:[], content:[], gallery:[], documents:[] };
const fetchState = async () => {
  const response = await fetch('/api/state', { cache:'no-store' });
  const data = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(data.error || data.message || 'Could not load website data');
  siteState=data; renderDynamicContent();
};
const renderDynamicContent = () => {
  const items=siteState.content || [];
  const news=document.querySelector('.news-list');
  if(news) news.innerHTML=items.slice(0,3).map(item=>`<li><span class="date">${escapeHtml((item.date||'').split(' ').slice(0,2).join(' '))}</span><div><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.description)}</p></div></li>`).join('');
  const events=document.querySelector('.event-list');
  if(events) events.innerHTML=items.slice(0,3).map(item=>{const p=(item.date||'24 Sep').split(' ');return `<div class="event-card"><div class="event-date"><strong>${escapeHtml(p[0])}</strong><span>${escapeHtml(p[1])}</span></div><div><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.description)}</p></div></div>`}).join('');
  const gallery=document.querySelector('.gallery-mini-grid');
  if(gallery) gallery.innerHTML=(siteState.gallery||[]).slice(0,4).map(src=>`<img src="${escapeHtml(src)}" alt="Campus gallery image" loading="lazy">`).join('');
  const downloads=document.querySelector('#downloadsTableBody');
  if(downloads) downloads.innerHTML=(siteState.documents||[]).map((doc,index)=>`<tr><td>${escapeHtml(doc.name)}</td><td>${escapeHtml((doc.name.split('.').pop()||'FILE').toUpperCase())}</td><td>Latest</td><td><button class="download-link" data-doc-index="${index}">Download</button></td></tr>`).join('');
};
fetchState().catch(console.error); setInterval(()=>fetchState().catch(()=>{}),10000);

const slides=document.querySelectorAll('.slide'); let current=0;
if(slides.length) setInterval(()=>{slides[current].classList.remove('active');current=(current+1)%slides.length;slides[current].classList.add('active');},4200);
const header=document.querySelector('.site-header');
document.querySelector('.menu-toggle')?.addEventListener('click',()=>header.classList.toggle('open'));
document.querySelectorAll('.dropdown > a').forEach(trigger=>trigger.addEventListener('click',event=>{if(innerWidth<=820){event.preventDefault();trigger.parentElement.classList.toggle('active');}}));
document.querySelectorAll('.tab').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-selected',b===button)});document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id===button.dataset.tab));}));
document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b===button));document.querySelectorAll('.award-card').forEach(card=>card.classList.toggle('hidden',button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter));}));
const counters=document.querySelectorAll('[data-count]'); const stats=document.querySelector('.stats');
if(stats) new IntersectionObserver((entries,observer)=>entries.forEach(entry=>{if(!entry.isIntersecting)return;counters.forEach(counter=>{const target=Number(counter.dataset.count);let value=0;const step=Math.max(1,Math.ceil(target/90));const tick=()=>{value=Math.min(target,value+step);counter.textContent=value.toLocaleString();if(value<target)requestAnimationFrame(tick)};tick()});observer.disconnect()}),{threshold:.25}).observe(stats);

document.addEventListener('click',event=>{const button=event.target.closest('[data-doc-index]');if(!button)return;const doc=siteState.documents[Number(button.dataset.docIndex)];if(!doc?.dataUrl){alert('The uploaded file content is not available. Upload the document again from the admin dashboard.');return;}const a=document.createElement('a');a.href=doc.dataUrl;a.download=doc.name;a.click();});
const form=document.querySelector('#admissionForm');
form?.addEventListener('submit',async event=>{event.preventDefault();const status=document.querySelector('.form-status');const payload=Object.fromEntries(new FormData(form));status.textContent='Submitting...';status.style.color='#0d5c75';try{const response=await fetch('/api/admissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await response.json();if(!response.ok)throw new Error(data.error||data.message);siteState=data;renderDynamicContent();form.reset();status.textContent='Admission enquiry submitted successfully.';status.style.color='#2e9d63';}catch(error){status.textContent=error.message||'Submission failed. Please try again.';status.style.color='#d94c4c';}});
