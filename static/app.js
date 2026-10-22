/* TN Lens v0.1 — portable, public-source civic research workspace. */
(() => {
'use strict';
const BOOT=JSON.parse(document.getElementById('seed-data').textContent);
const STORAGE_KEY='tn-lens-v01-local';
const STATUSES=['open_question','needs_verification','in_review','corroborated','disputed','resolved'];
const PLATFORMS={X:['x.com','twitter.com'],Instagram:['instagram.com'],YouTube:['youtube.com','youtu.be'],Facebook:['facebook.com','fb.com'],LinkedIn:['linkedin.com'],Threads:['threads.net']};
let appData,mode='local',selectedIssue='issue_tasmac_129',selectedBrief='issue_tasmac_129',issueQuery='',issueStatus='all',districtChoice='All districts',csvTarget='social',toastTimer;
const $=id=>document.getElementById(id);
const clone=o=>JSON.parse(JSON.stringify(o));
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>typeof v==='number'?new Intl.NumberFormat('en-IN',{maximumFractionDigits:2}).format(v):h(v);
const label=s=>h(String(s||'').replaceAll('_',' '));
function urlOK(u){try{const x=new URL(u);return x.protocol==='https:'&&!!x.hostname&&!x.username&&!x.password;}catch{return false;}}
function domain(u){try{return new URL(u).hostname.toLowerCase().replace(/^www\./,'');}catch{return '';}}
function link(url,title='Open source ↗'){return urlOK(url)?`<a href="${h(url)}" target="_blank" rel="noopener noreferrer">${h(title)}</a>`:'<span class="muted">Source URL unavailable</span>';}
function currentIssue(id=selectedIssue){return appData.issues.find(x=>x.id===id);}
function cleanSeed(){const d=clone(BOOT);d.issues.forEach(i=>{i.audit=i.audit||[];i.evidence=i.evidence||[];});d.indicators=[];d.social_posts=[];d.mode='local';return d;}
function notify(message,error=false){const t=$('toast');t.textContent=message;t.classList.toggle('error',error);t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),5500);}
function persist(){if(mode==='local')try{localStorage.setItem(STORAGE_KEY,JSON.stringify(appData));}catch{notify('Storage unavailable. Export a JSON backup.',true);}}
async function reload(){if(mode==='server'){const r=await fetch('/api/bootstrap',{cache:'no-store'});if(!r.ok)throw Error('Backend error '+r.status);appData=await r.json();}}
async function startup(){
 if(/^https?:$/.test(location.protocol))try{const r=await fetch('/api/bootstrap',{cache:'no-store'});if(r.ok){appData=await r.json();mode='server';}}catch{}
 if(!appData){try{const s=localStorage.getItem(STORAGE_KEY);appData=s?JSON.parse(s):cleanSeed();}catch{appData=cleanSeed();}mode='local';}
 if(!appData.issues||!appData.election){appData=cleanSeed();mode='local';}
 $('connection-pill').textContent=mode==='server'?'SQLite connected':'Local workspace';$('connection-pill').classList.toggle('local',mode!=='server');
 $('asof').textContent='Source snapshot '+(appData.metadata?.snapshot_as_of||'2026-10-22');renderAll();navigate('overview');
}
function navigate(view){document.querySelectorAll('[data-nav]').forEach(n=>{const on=n.dataset.nav===view;n.classList.toggle('active',on);n.setAttribute('aria-current',on?'page':'false');});document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view_'+view));window.scrollTo(0,0);}
function badge(s){return `<span class="chip ${h(s)}">${label(s)}</span>`;}
function renderAll(){renderOverview();renderIssues();renderData();renderSocial();renderPlaybooks();renderBriefs();renderSources();}
function renderOverview(){
 const n=appData.issues.length,e=appData.issues.reduce((sum,i)=>sum+i.evidence.length,0),u=appData.issues.filter(i=>!['resolved','corroborated'].includes(i.status)).length;
 $('overview_metrics').innerHTML=`<div class="metric"><div class="label">Issues in evidence register</div><strong>${fmt(n)}</strong><small>Human-reviewable records</small></div><div class="metric"><div class="label">Evidence records</div><strong>${fmt(e)}</strong><small>Links to published sources</small></div><div class="metric"><div class="label">Open / under review</div><strong>${fmt(u)}</strong><small>Not substantiated failures</small></div><div class="metric"><div class="label">Registered public sources</div><strong>${fmt(appData.sources.length)}</strong><small>Not automatic data feeds</small></div>`;
 $('home_decisions').innerHTML=appData.issues.filter(i=>i.status!=='resolved').slice(0,3).map((i,n)=>`<div class="signal"><div class="lineicon">${n+1}</div><div><strong>${h(i.title)}</strong><p>${h(i.next_step)}</p><button class="btn ghost small" data-action="show-issue" data-id="${h(i.id)}">Inspect evidence →</button></div></div>`).join('')||'<p class="muted">No open cases.</p>';
 $('home_workflow').innerHTML=[['Register the question','Describe the public issue without identifying people.'],['Attach the evidence','Record original sources and contradictory findings.'],['Review what is known','A reviewer writes a reason for every status.'],['Export a useful brief','Publish sources, gaps and next verification steps.']].map((p,n)=>`<div class="signal"><div class="lineicon">✓</div><div><strong>${n+1}. ${h(p[0])}</strong><p>${h(p[1])}</p></div></div>`).join('');
 $('home_programmes').innerHTML=appData.programme_metrics.map(m=>`<tr><td>${h(m.label)}<div class="fine">${h(m.period)}</div></td><td><b>${fmt(m.value)}</b><div class="fine">${h(m.unit)}</div></td><td>${badge('reported')}<div class="fine" style="margin-top:6px">${h(m.caveat)}</div></td><td>${link(m.source_url,'Original ↗')}</td></tr>`).join('');
}
function renderCaseList(){
 const items=appData.issues.filter(i=>(issueStatus==='all'||i.status===issueStatus)&&(!issueQuery||[i.title,i.summary,i.category,i.district].join(' ').toLowerCase().includes(issueQuery)));
 if(!items.find(i=>i.id===selectedIssue)&&items[0])selectedIssue=items[0].id;
 $('case_list').innerHTML=items.length?items.map(i=>`<button class="case-row ${selectedIssue===i.id?'active':''}" data-action="select-issue" data-id="${h(i.id)}"><div class="tiny">${h(i.category)} · ${h(i.district)}</div><h3>${h(i.title)}</h3><div class="wrap">${badge(i.status)}<span class="sm">${i.evidence.length} sources</span></div></button>`).join(''):'<div class="empty"><strong>No matching cases.</strong>Change filters or register another issue.</div>';
}
function renderCaseDetail(){
 const i=currentIssue();if(!i){$('case_detail').innerHTML='<div class="empty">Select a case to review its sources.</div>';return;}
 const ev=i.evidence||[],a=i.audit||[];
 $('case_detail').innerHTML=`<div class="card case-detail"><div class="wrap" style="align-items:center;justify-content:space-between"><span class="kicker">Case record · ${h(i.opened_on)}</span>${badge(i.status)}</div><h2>${h(i.title)}</h2><div class="wrap"><span class="tag">${h(i.category)}</span><span class="tag">${h(i.district)}</span></div><p class="summary" style="margin-top:18px">${h(i.summary)}</p><div class="detail-label" style="margin-top:21px">Recommended next verification</div><div class="case-next">${h(i.next_step)}</div><div class="wrap" style="margin-top:18px"><button class="btn primary" data-action="add-evidence">+ Add evidence</button><button class="btn" data-action="review">Record review</button><button class="btn quiet" data-action="case-brief">Brief ↓</button></div><div class="rule"></div><div class="card-head"><h2>Source & claim register</h2><span class="fine">${ev.length} records</span></div><div class="evidence-grid">${ev.length?ev.map(x=>`<article class="evidence-card"><div class="evmeta">${h(x.published_on)} · ${h(x.source_type)} · ${h(x.stance)}</div><strong>${h(x.source_label)}</strong><p>${h(x.finding)}</p>${link(x.source_url,'Inspect original ↗')}</article>`).join(''):'<div class="data-empty">No evidence links added yet. Treat all claims as unverified.</div>'}</div><div class="rule"></div><div class="card-head"><h2>Decision history</h2><span class="fine">Append-only</span></div>${a.length?`<ul class="trail">${a.map(x=>`<li><b>${h((x.at||'').slice(0,16))}</b> · ${h(x.event)}${x.new_status?' → '+label(x.new_status):''}<div>${h(x.note)}</div></li>`).join('')}</ul>`:'<p class="fine">No reviewer decision recorded since the initial snapshot.</p>'}</div>`;
}
function renderIssues(){$('filter_status').innerHTML='<option value="all">All statuses</option>'+STATUSES.map(s=>`<option value="${s}" ${s===issueStatus?'selected':''}>${label(s)}</option>`).join('');$('filter_search').value=issueQuery;renderCaseList();renderCaseDetail();}
function renderData(){
 const e=appData.election;$('data_footnote').innerHTML=h(e.notes)+' '+link(e.source_url,'ECI detailed results ↗');
 $('election_seats').innerHTML=e.seats.map((r,n)=>`<tr><td><b>${h(r.party)}</b></td><td><b>${fmt(r.seats)}</b></td><td style="width:48%"><div class="bar"><span class="${n===1?'blue':n===2?'amber':''}" style="width:${100*r.seats/e.total_seats}%"></span></div></td></tr>`).join('');
 $('district_events').innerHTML=appData.district_highlights.map(x=>`<tr><td>${h(x.district)}</td><td><b>${fmt(x.value)}</b></td><td>${badge('reported')}</td><td>${link(x.source_url,'Report ↗')}</td></tr>`).join('');
 $('district_filter').innerHTML='<option value="All districts">All districts</option>'+appData.districts.map(d=>`<option value="${h(d)}" ${d===districtChoice?'selected':''}>${h(d)}</option>`).join('');
 const items=appData.indicators.filter(i=>districtChoice==='All districts'||i.district===districtChoice);$('indicator_count').textContent=appData.indicators.length+' imported values';
 $('indicator_rows').innerHTML=items.length?`<div class="table-wrap"><table><thead><tr><th>District</th><th>Indicator</th><th>Year</th><th>Value</th><th>Source status</th></tr></thead><tbody>${items.slice(0,300).map(x=>`<tr><td>${h(x.district)}</td><td>${h(x.indicator)}</td><td>${fmt(x.year)}</td><td><b>${fmt(x.value)}</b> ${h(x.unit)}</td><td>${badge('reported')}<div class="fine">Uploaded; unreviewed</div>${link(x.source_url,x.source_label)}</td></tr>`).join('')}</tbody></table></div>`:`<div class="data-empty"><strong>${districtChoice==='All districts'?'No district indicator CSV imported yet.':'No uploaded indicators for '+h(districtChoice)+'.'}</strong><br>Source registry links exist, but absent source values are never invented.</div>`;
}
function socialSummary(){
 const posts=appData.social_posts||[],groups={};let views=0,countWithViews=0;
 posts.forEach(p=>{const t=groups[p.topic]||={topic:p.topic,count:0,views:0,viewCount:0,engagements:0,engagementsWithViews:0};const interactions=Number(p.likes||0)+Number(p.comments||0)+Number(p.shares||0);t.count++;t.engagements+=interactions;if(p.views!==null&&p.views!==undefined){t.views+=Number(p.views);t.viewCount++;t.engagementsWithViews+=interactions;views+=Number(p.views);countWithViews++;}groups[p.topic]=t;});
 return {posts,topics:Object.values(groups).sort((a,b)=>b.count-a.count||b.views-a.views),views,countWithViews};
}
function renderSocial(){
 const d=socialSummary();
 $('social_metrics').innerHTML=`<div class="metric"><div class="label">Public posts imported</div><strong>${fmt(d.posts.length)}</strong><small>Manual source URLs only</small></div><div class="metric"><div class="label">Topics in dataset</div><strong>${fmt(d.topics.length)}</strong><small>Uploader-labelled themes</small></div><div class="metric"><div class="label">Total reported views</div><strong>${fmt(d.views)}</strong><small>${fmt(d.countWithViews)} posts include view counts</small></div><div class="metric"><div class="label">Sentiment / vote intent</div><strong>—</strong><small>Not inferred by this system</small></div>`;
 const max=Math.max(1,...d.topics.map(t=>t.count));
 $('topic_analysis').innerHTML=d.topics.length?d.topics.map(t=>`<div class="topic-card"><div class="topic-head"><strong>${h(t.topic)}</strong><span class="stat">${fmt(t.count)} posts · ${fmt(t.views)} views</span></div><div class="bar" style="margin-bottom:7px"><span style="width:${100*t.count/max}%"></span></div><div class="fine">${fmt(t.engagements)} recorded interactions${t.views>0?` · ${(100*t.engagementsWithViews/t.views).toFixed(2)}% interactions/views (only posts with views)`: ' · rate unavailable'}</div></div>`).join(''):'<div class="data-empty"><strong>No live social dataset connected.</strong><br>Import public organisational account data by CSV. We do not infer opinion from post engagements.</div>';
 $('recent_posts').innerHTML=d.posts.length?`<div class="table-wrap"><table><thead><tr><th>Platform</th><th>Date</th><th>Topic</th><th>Views</th><th>Post</th></tr></thead><tbody>${[...d.posts].sort((a,b)=>b.published_on.localeCompare(a.published_on)).slice(0,15).map(p=>`<tr><td>${h(p.platform)}</td><td>${h(p.published_on)}</td><td>${h(p.topic)}</td><td>${p.views===null?'Unknown':fmt(p.views)}</td><td>${link(p.post_url,'Open ↗')}</td></tr>`).join('')}</tbody></table></div>`:'<p class="fine">No public posts have been imported. Metrics are intentionally blank, not synthetic.</p>';
}
function renderPlaybooks(){
 $('playbooks_grid').innerHTML=appData.playbooks.map(p=>`<article class="playbook"><div class="region">${h(p.region)}</div><h2>${h(p.name)}</h2><p>${h(p.mechanism)}</p><div class="pilot"><b>Potential Tamil Nadu pilot</b><div style="margin-top:7px">${h(p.tn_pilot)}</div></div><h3 style="margin:17px 0 5px">Measurement criteria</h3><ul>${p.metrics.map(x=>`<li>${h(x)}</li>`).join('')}</ul><h3 style="margin:9px 0 5px">Transfer constraints</h3><ul>${p.constraints.map(x=>`<li>${h(x)}</li>`).join('')}</ul><div class="bottom">${link(p.source_url,p.source_label+' ↗')}</div></article>`).join('');
}
function makeBrief(i){
 if(!i)return '# No issue selected';
 const evidence=i.evidence.length?i.evidence.map(x=>`- **${x.published_on} · ${x.source_type} · ${x.stance}**: [${x.source_label.replaceAll('[','\\[')}](${x.source_url}) — ${x.finding.replaceAll('\n',' ')}`).join('\n'):'No sources added; claims have not been verified.';
 const audit=(i.audit||[]).length?i.audit.map(a=>`- ${a.at}: ${a.event} — ${a.note}`).join('\n'):'No reviewer decision recorded.';
 return `# ${i.title}\n\nTN Lens evidence memo · ${new Date().toISOString().slice(0,10)} · independent prototype\n\n**District:** ${i.district}  \n**Category:** ${i.category}  \n**Review status:** ${i.status.replaceAll('_',' ')}\n\n## Question and background\n\n${i.summary}\n\n## Available sources\n\n${evidence}\n\n## Missing evidence / next public research step\n\n${i.next_step}\n\n## Reviewer history\n\n${audit}\n\n---\nOrganiser statements are not independent impact audits. This is public policy research, not a voter profile or election forecast.\n`;
}
function renderBriefs(){
 if(!currentIssue(selectedBrief)&&appData.issues.length)selectedBrief=appData.issues[0].id;
 $('brief_issues').innerHTML=appData.issues.map(i=>`<button class="${i.id===selectedBrief?'active':''}" data-action="select-brief" data-id="${h(i.id)}"><span class="fine">${label(i.status)} · ${h(i.district)}</span><br><b>${h(i.title)}</b></button>`).join('');
 $('brief_content').textContent=makeBrief(currentIssue(selectedBrief));
 $('brief_actions').style.display=currentIssue(selectedBrief)?'flex':'none';
}
function renderSources(){$('source_rows').innerHTML=appData.sources.map(s=>`<tr><td><b>${h(s.name)}</b><div class="fine">${h(s.scope)}</div></td><td>${h(s.type)}</td><td>${h(s.verified_as_of)}</td><td>${link(s.url,'Open source ↗')}</td></tr>`).join('');}
function showModal(title,intro,body){
 $('modal_root').innerHTML=`<div class="modal-head"><div><h2>${h(title)}</h2><p>${h(intro)}</p></div><button class="btn quiet small" data-action="close-modal" aria-label="Close dialog">✕</button></div>${body}`;
 $('modal_backdrop').classList.add('open');$('modal_backdrop').setAttribute('aria-hidden','false');$('modal_root').querySelector('input,textarea,select')?.focus();
}
function closeModal(){$('modal_backdrop').classList.remove('open');$('modal_backdrop').setAttribute('aria-hidden','true');}
function field(name,title,type='text',placeholder=''){return `<div class="field"><label for="f_${h(name)}">${h(title)}</label><input id="f_${h(name)}" name="${h(name)}" type="${type}" placeholder="${h(placeholder)}" required></div>`;}
function options(arr){return arr.map(s=>`<option value="${h(s)}">${label(s)}</option>`).join('');}
const actions='<div class="form-actions"><button type="button" class="btn quiet" data-action="close-modal">Cancel</button><button type="submit" class="btn primary">Save record</button></div>';
function caseForm(){
 showModal('Register an issue','Start with a falsifiable public question, not a personal allegation.',`<form data-form="case">${field('title','Issue title','text','What public-service question needs verifying?')}<div class="two-col-form"><div class="field"><label>Category</label><select name="category" required>${options(['Environment','Safety & public services','Public health & regulation','Education','Infrastructure','Employment & skills','Public finance','Other'])}</select></div><div class="field"><label>District</label><select name="district" required>${options(['Statewide',...appData.districts])}</select></div></div><div class="field"><label>Summary / claim</label><textarea name="summary" minlength="20" maxlength="3000" required placeholder="Separate the assertion from the documented facts."></textarea></div><div class="field"><label>Next evidence required</label><textarea name="next_step" minlength="10" maxlength="1500" required placeholder="What record or measured outcome would resolve the issue?"></textarea></div>${actions}</form>`);
}
function evidenceForm(){
 const i=currentIssue();if(!i)return;
 showModal('Add a source','Adding evidence to '+i.title,`<form data-form="evidence">${field('source_label','Publisher / reference','text','Organisation, court, journal or publication')}${field('source_url','Original HTTPS source URL','url','https://...')}<div class="two-col-form"><div class="field"><label>Source class</label><select name="source_type">${options(['government','court','reporting','research','organisation','other'])}</select></div><div class="field"><label>Evidence relation</label><select name="stance">${options(['context','claim','supports','contrasts','outcome'])}</select></div></div>${field('published_on','Published / observed','date')}<div class="field"><label>What this source establishes</label><textarea name="finding" minlength="12" maxlength="1800" required></textarea></div>${actions}</form>`);
 $('modal_root').querySelector('input[name=published_on]').value=new Date().toISOString().slice(0,10);
}
function reviewForm(){
 const i=currentIssue();if(!i)return;
 showModal('Record a review','Human decisions require an auditable reason.',`<form data-form="review"><div class="field"><label>Evidence status</label><select name="status">${STATUSES.map(s=>`<option value="${s}" ${s===i.status?'selected':''}>${label(s)}</option>`).join('')}</select></div>${field('reviewer','Reviewer role','text','Research reviewer')}<div class="field"><label>Reason, uncertainty and next steps</label><textarea name="note" minlength="12" maxlength="1800" required></textarea></div><div class="notice cool" style="margin-bottom:15px">Corroborated requires evidence from two distinct source domains. Resolved requires an evidence link marked <b>outcome</b>. Status is still a human judgment.</div>${actions}</form>`);
 $('modal_root').querySelector('input[name=reviewer]').value='Research reviewer';
}
function uniqueID(){return (typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now()+'_'+Math.random().toString(36).slice(2)).slice(0,20);}
function audit(issue,event,previous_status,new_status,note,reviewer='Research workspace'){
 issue.audit ||= [];issue.audit.unshift({id:'audit_'+uniqueID(),issue_id:issue.id,event,previous_status,new_status,note,reviewer,at:new Date().toISOString()});issue.updated_at=new Date().toISOString();
}
async function write(url,method,payload,localMutation){
 if(mode==='server'){
  const response=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(typeof data.detail==='string'?data.detail:'API request failed ('+response.status+')');
  await reload();return data;
 }
 const result=localMutation();persist();return result;
}
async function submitForm(form){
 const f=Object.fromEntries(new FormData(form));
 if(form.dataset.form==='case'){
  const payload={title:f.title.trim(),category:f.category,district:f.district,summary:f.summary.trim(),next_step:f.next_step.trim()};
  if(payload.title.length<5||payload.summary.length<20||payload.next_step.length<10)throw Error('Add a descriptive title, summary and next evidence step.');
  const r=await write('/api/issues','POST',payload,()=>{
   const id='issue_'+uniqueID(),now=new Date().toISOString(),issue={...payload,id,status:'open_question',opened_on:now.slice(0,10),created_at:now,updated_at:now,evidence:[],audit:[]};
   audit(issue,'created',null,'open_question','Issue created; no independent verification yet');appData.issues.unshift(issue);return {id};
  });
  selectedIssue=r.id;issueQuery='';issueStatus='all';notify('Public issue registered. Now add original sources.');
 }else if(form.dataset.form==='evidence'){
  const payload={source_label:f.source_label.trim(),source_url:f.source_url.trim(),source_type:f.source_type,published_on:f.published_on,stance:f.stance,finding:f.finding.trim()};
  if(!urlOK(payload.source_url)||payload.finding.length<12)throw Error('A valid HTTPS source and a specific finding are required.');
  await write('/api/issues/'+selectedIssue+'/evidence','POST',payload,()=>{
   const i=currentIssue(),id='ev_'+uniqueID();i.evidence.unshift({...payload,id,issue_id:i.id,added_at:new Date().toISOString()});audit(i,'evidence_added',null,null,'Added '+payload.source_type+' source: '+payload.source_label);return {id};
  });notify('Evidence added with source date and citation.');
 }else if(form.dataset.form==='review'){
  const payload={status:f.status,note:f.note.trim(),reviewer:f.reviewer.trim()};
  if(payload.note.length<12)throw Error('Provide a reason of at least 12 characters.');
  await write('/api/issues/'+selectedIssue+'/status','PATCH',payload,()=>{
   const i=currentIssue();if(payload.status==='corroborated'&&new Set(i.evidence.map(e=>domain(e.source_url))).size<2)throw Error('Corroboration requires two different source domains.');
   if(payload.status==='resolved'&&!i.evidence.some(e=>e.stance==='outcome'))throw Error('Add an outcome source before marking resolved.');
   const old=i.status;i.status=payload.status;audit(i,'human_review',old,payload.status,payload.note,payload.reviewer);return {id:i.id};
  });notify('Reviewer decision recorded in append-only history.');
 }
 closeModal();renderAll();
}
function download(name,content,mime='text/plain;charset=utf-8'){
 const blob=new Blob([content],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function parseCSV(text){
 if(text.length>600000)throw Error('CSV must be smaller than 600 KB.');
 const lines=[];let row=[],value='',quoted=false;
 for(let n=0;n<text.length;n++){
  const c=text[n];if(quoted){if(c==='"'&&text[n+1]==='"'){value+='"';n++;}else if(c==='"')quoted=false;else value+=c;}
  else if(c==='"'){if(value!=='')throw Error('Invalid CSV quote placement.');quoted=true;}
  else if(c===','){row.push(value);value='';}
  else if(c==='\n'){row.push(value.replace(/\r$/,''));lines.push(row);row=[];value='';}
  else value+=c;
 }
 if(quoted)throw Error('CSV ends inside a quoted field.');
 if(value!==''||row.length){row.push(value.replace(/\r$/,''));lines.push(row);}
 if(!lines.length)throw Error('CSV is empty.');
 const headers=lines.shift().map(x=>x.trim().replace(/^\uFEFF/,''));
 if(new Set(headers).size!==headers.length)throw Error('Duplicate CSV headers.');
 if(lines.length>5000)throw Error('Maximum 5,000 CSV rows per import.');
 return lines.filter(x=>!(x.length===1&&x[0]==='')).map((r,i)=>{if(r.length!==headers.length)throw Error('CSV column mismatch in row '+(i+2));return Object.fromEntries(headers.map((name,j)=>[name,r[j]]));});
}
function socialRecords(items){
 const required=['platform','published_on','topic','post_url','views','likes','comments','shares'];
 if(!required.every(k=>Object.hasOwn(items[0]||{},k)))throw Error('Expected CSV headers: '+required.join(', '));
 return items.map((r,index)=>{
  const n=index+2,platform=r.platform.trim(),url=r.post_url.trim(),topic=r.topic.trim();
  if(!PLATFORMS[platform]||!urlOK(url)||!PLATFORMS[platform].includes(domain(url)))throw Error('Row '+n+': post URL and platform must match a supported public domain.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(r.published_on.trim())||topic.length<2||topic.length>80)throw Error('Row '+n+': invalid date or topic.');
  const nums=['views','likes','comments','shares'].map(k=>{
   if(k==='views'&&r[k].trim()==='')return null;
   const value=Number(r[k]);if(r[k].trim()===''||!Number.isSafeInteger(value)||value<0||value>2000000000)throw Error('Row '+n+': invalid '+k);
   return value;
  });
  return {id:'post_'+uniqueID(),platform,published_on:r.published_on.trim(),topic,post_url:url,views:nums[0],likes:nums[1],comments:nums[2],shares:nums[3],imported_at:new Date().toISOString()};
 });
}
function indicatorRecords(items){
 const required=['district','indicator','year','value','unit','source_label','source_url'];
 if(!required.every(k=>Object.hasOwn(items[0]||{},k)))throw Error('Expected CSV headers: '+required.join(', '));
 return items.map((r,index)=>{
  const n=index+2,district=r.district.trim(),year=Number(r.year),value=Number(r.value),source_url=r.source_url.trim();
  if(!appData.districts.includes(district))throw Error('Row '+n+': unknown district.');
  if(!Number.isInteger(year)||year<2000||year>2035||r.value.trim()===''||!Number.isFinite(value)||Math.abs(value)>1e12||!urlOK(source_url))throw Error('Row '+n+': invalid year, value or URL.');
  if(!r.indicator.trim()||!r.unit.trim()||!r.source_label.trim())throw Error('Row '+n+': missing indicator, unit or source.');
  return {id:'ind_'+uniqueID(),district,indicator:r.indicator.trim(),year,value,unit:r.unit.trim(),source_label:r.source_label.trim(),source_url,verification:'uploaded_unreviewed',imported_at:new Date().toISOString()};
 });
}
async function importCSV(file){
 if(!file)return;
 const csv=await file.text();let inserted=0,duplicates=0;
 if(mode==='server'){
  const path=csvTarget==='social'?'/api/social/import':'/api/indicators/import';
  const r=await write(path,'POST',{csv_text:csv},()=>{});inserted=r.inserted;duplicates=r.duplicates;
 }else{
  const items=parseCSV(csv),records=csvTarget==='social'?socialRecords(items):indicatorRecords(items),dest=csvTarget==='social'?appData.social_posts:appData.indicators;
  const recordKey=r=>csvTarget==='social'?r.post_url:[r.district,r.indicator,r.year,r.source_url].join('|');
  const seen=new Set(dest.map(recordKey));
  for(const r of records){const k=recordKey(r);if(seen.has(k)){duplicates++;continue;}dest.push(r);seen.add(k);inserted++;}persist();
 }
 renderAll();notify(`Imported ${inserted} ${csvTarget==='social'?'posts':'indicator values'}; skipped ${duplicates} duplicates.`);$('csv_file').value='';
}
async function exportData(){
 if(mode==='server'){const r=await fetch('/api/export');if(!r.ok)throw Error('Export failed');download('tn-lens-backup.json',await r.text(),'application/json');}
 else download('tn-lens-backup.json',JSON.stringify(appData,null,2),'application/json');
 notify('Complete public research workspace exported.');
}
function downloadTemplate(type){
 download('tn-lens-'+type+'-template.csv',type==='social'?'platform,published_on,topic,post_url,views,likes,comments,shares\n':'district,indicator,year,value,unit,source_label,source_url\n','text/csv');
}
async function copyBrief(){const b=makeBrief(currentIssue(selectedBrief));if(navigator.clipboard){await navigator.clipboard.writeText(b);notify('Source-linked briefing copied.');}else{download('tn-lens-brief.md',b,'text/markdown');notify('Clipboard unavailable: downloaded Markdown instead.');}}
document.addEventListener('click',async event=>{
 const b=event.target.closest('button[data-nav],button[data-action]');if(!b)return;
 if(b.dataset.nav){navigate(b.dataset.nav);return;}
 try{
  switch(b.dataset.action){
   case 'go':navigate(b.dataset.view);break;
   case 'show-issue':selectedIssue=b.dataset.id;issueQuery='';issueStatus='all';renderIssues();navigate('issues');break;
   case 'select-issue':selectedIssue=b.dataset.id;renderCaseList();renderCaseDetail();break;
   case 'select-brief':selectedBrief=b.dataset.id;renderBriefs();break;
   case 'new-issue':caseForm();break;
   case 'add-evidence':evidenceForm();break;
   case 'review':reviewForm();break;
   case 'close-modal':closeModal();break;
   case 'case-brief':selectedBrief=selectedIssue;renderBriefs();navigate('briefs');break;
   case 'download-brief':download('tn-lens-'+selectedBrief+'.md',makeBrief(currentIssue(selectedBrief)),'text/markdown');notify('Downloaded source-linked memo.');break;
   case 'copy-brief':await copyBrief();break;
   case 'export-json':await exportData();break;
   case 'import-social':csvTarget='social';$('csv_file').click();break;
   case 'import-indicators':csvTarget='indicators';$('csv_file').click();break;
   case 'template-social':downloadTemplate('social');break;
   case 'template-indicators':downloadTemplate('indicators');break;
   case 'reset-local':if(mode==='local'&&confirm('Reset local records? Export a backup first if you need your changes.')){appData=cleanSeed();persist();renderAll();notify('Demo restored to original sourced snapshot.');}break;
  }
 }catch(e){notify(e.message||'Operation failed',true);}
});
document.addEventListener('submit',async e=>{if(!e.target.matches('form[data-form]'))return;e.preventDefault();const submit=e.target.querySelector('[type=submit]');if(submit)submit.disabled=true;try{await submitForm(e.target);}catch(x){notify(x.message||'Save failed',true);}finally{if(submit)submit.disabled=false;}});
$('filter_search').addEventListener('input',e=>{issueQuery=e.target.value.toLowerCase().trim();renderCaseList();renderCaseDetail();});
$('filter_status').addEventListener('change',e=>{issueStatus=e.target.value;renderCaseList();renderCaseDetail();});
$('district_filter').addEventListener('change',e=>{districtChoice=e.target.value;renderData();});
$('csv_file').addEventListener('change',async e=>{try{await importCSV(e.target.files[0]);}catch(x){notify(x.message||'Import failed',true);e.target.value='';}});
$('modal_backdrop').addEventListener('click',e=>{if(e.target.id==='modal_backdrop')closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
startup().catch(e=>notify('App startup failed: '+e.message,true));
})();
