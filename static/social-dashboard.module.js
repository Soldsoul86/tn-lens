/* TN Lens v0.3 — source-attributed social waterfall and development drilldown.
   No social API connection, profile analysis or fabricated measurements. */
const SOCIAL_UI = {platform:'All', topic:null, post:null, period:'all', goal:''};
const SOCIAL_KEYS = ['YouTube','Instagram','Other'];
const SOCIAL_FOCUS = [
  {platform:'YouTube',label:'YouTube',desc:'Videos, Shorts and public livestreams',mark:'▶'},
  {platform:'Instagram',label:'Instagram',desc:'Reels and public organisational posts',mark:'◎'},
  {platform:'Other',label:'Other public channels',desc:'Additional supported public posts',mark:'≋'}
];
function socialCategory(p){return p.platform==='YouTube'?'YouTube':p.platform==='Instagram'?'Instagram':'Other';}
function socialMetric(p){return Number(p.likes||0)+Number(p.comments||0)+Number(p.shares||0);}
function socialPosts(){
 const cutoff=SOCIAL_UI.period==='all'?null:(new Date(Date.now()-Number(SOCIAL_UI.period)*86400000)).toISOString().slice(0,10);
 return (appData.social_posts||[]).filter(p=>(SOCIAL_UI.platform==='All'||socialCategory(p)===SOCIAL_UI.platform)&&(!cutoff||p.published_on>=cutoff)).sort((a,b)=>String(b.published_on||'').localeCompare(String(a.published_on||'')));
}
function socialSelection(posts){
 let result=SOCIAL_UI.topic===null?posts:posts.filter(p=>p.topic===SOCIAL_UI.topic);
 if(SOCIAL_UI.post!==null)result=result.filter(p=>p.post_url===SOCIAL_UI.post);
 return result;
}
function socialAggregate(posts){
 const seen=new Set(posts.map(p=>p.topic));
 const known=posts.filter(p=>p.views!==null&&p.views!==undefined&&Number.isFinite(Number(p.views)));
 const latest=posts.map(p=>p.imported_at||'').filter(Boolean).sort().at(-1)||null;
 return {count:posts.length,topics:seen.size,views:known.reduce((a,p)=>a+Number(p.views),0),knownViews:known.length,interactions:posts.reduce((a,p)=>a+socialMetric(p),0),latest};
}
function socialChip(labelText,value,detail){return `<div class="social-kpi"><div class="social-kpi-label">${h(labelText)}</div><strong>${value}</strong><div class="social-kpi-note">${h(detail)}</div></div>`;}
function socialCrumb(labelText,step){return `<button type="button" data-social="${step}">${h(labelText)}</button>`;}
function socialBarChart(posts){
 if(!posts.length)return '<div class="social-blank"><span class="social-blank-symbol">▥</span><strong>No measured contribution yet</strong><p>Import public YouTube or Instagram post metrics to populate this waterfall. We do not generate example counts on the live dashboard.</p></div>';
 let title='Recorded interactions by platform',groups=[];
 if(SOCIAL_UI.post!==null){
  title='Single post · interactions by type';
  const p=posts[0];groups=[['Likes',Number(p.likes||0)],['Comments',Number(p.comments||0)],['Shares',Number(p.shares||0)]];
 }else if(SOCIAL_UI.topic!==null){
  title='This topic · individual post contributions';
  groups=posts.map((p,n)=>[(p.platform==='YouTube'?'YT':p.platform==='Instagram'?'IG':p.platform)+' · '+p.published_on,socialMetric(p)]).slice(0,7);
  if(posts.length>7)groups.push(['Remaining '+(posts.length-7)+' posts',posts.slice(7).reduce((s,p)=>s+socialMetric(p),0)]);
 }else if(SOCIAL_UI.platform!=='All'){
  title='Topic contributions · '+SOCIAL_UI.platform;
  const by=new Map();for(const p of posts)by.set(p.topic,(by.get(p.topic)||0)+socialMetric(p));
  groups=[...by].sort((a,b)=>b[1]-a[1]);
  if(groups.length>7){groups=[...groups.slice(0,7),['Remaining topics',groups.slice(7).reduce((s,x)=>s+x[1],0)]];}
 }else{
  title='Recorded interactions by platform';
  groups=SOCIAL_KEYS.map(k=>[k,posts.filter(p=>socialCategory(p)===k).reduce((s,p)=>s+socialMetric(p),0)]).filter(x=>x[1]>0||posts.some(p=>socialCategory(p)===x[0]));
 }
 const total=groups.reduce((s,x)=>s+x[1],0);
 const n=groups.length+1,barW=58,gap=30,chartW=Math.max(750,n*(barW+gap)+65),top=50,height=165,scale=height/Math.max(1,total);
 let current=0;
 const svg=groups.map(([k,num],i)=>{
  const x=44+i*(barW+gap),old=current;current+=num;
  const y=top+(total-current)*scale;
  const blockH=num===0?2:Math.max(2,num*scale);
  const connector=i<groups.length-1?`<line x1="${x+barW}" x2="${x+barW+gap}" y1="${top+(total-current)*scale}" y2="${top+(total-current)*scale}" stroke="#547486" stroke-dasharray="3 4"/>`:'';
  const short=k.length>18?k.slice(0,17)+'…':k;
  return `<g><title>${h(k)}: ${fmt(num)} interactions, accumulated ${fmt(current)}</title><rect x="${x}" y="${y}" width="${barW}" height="${blockH}" rx="5" fill="${i%2?'#9bbfec':'#83dfca'}"/><text class="water-value" text-anchor="middle" x="${x+barW/2}" y="${Math.max(20,y-8)}">+${fmt(num)}</text><text class="water-label" text-anchor="middle" x="${x+barW/2}" y="239">${h(short)}</text></g>${connector}`;
 }).join('');
 const finalX=44+(n-1)*(barW+gap),fullY=top;
 return `<div class="water-title">${h(title)}<span class="fine">Additive breakdown, not change in public opinion</span></div><div class="water-scroll" tabindex="0" aria-label="Scroll interaction waterfall chart horizontally"><svg class="social-water-svg" viewBox="0 0 ${chartW} 270" width="${chartW}" height="270" role="img" aria-label="${h(title)}: ${fmt(total)} recorded interactions total"><line x1="25" x2="${chartW-22}" y1="${top+height}" y2="${top+height}" stroke="#405567"/>${svg}<g><rect x="${finalX}" y="${fullY}" width="${barW}" height="${total===0?2:height}" rx="5" fill="#5277a0"/><text class="water-value" text-anchor="middle" x="${finalX+barW/2}" y="${Math.max(20,fullY-8)}">${fmt(total)}</text><text class="water-label" text-anchor="middle" x="${finalX+barW/2}" y="239">Total</text></g></svg></div><div class="fine">Sum of imported likes + comments + shares. Different platforms define and expose these metrics differently; data coverage is limited to imported posts.</div>`;
}
function socialRow(k,title,desc,num,action,value,mark){return `<button class="social-drill-row" type="button" data-social="${action}" data-value="${h(value)}"><span class="social-row-symbol">${h(mark||'›')}</span><span class="social-row-main"><strong>${h(title)}</strong><span>${h(desc)}</span></span><span class="social-row-count">${action==='post'?(num===null?'Views unavailable':fmt(num)+' views'):(num===null?'No imported posts':fmt(num)+' posts')}<span>→</span></span></button>`;}
function socialDetail(post){
 if(!post)return '<div class="social-blank"><strong>Select a post</strong><p>Inspect what was published, the dated link and the metrics recorded at import.</p></div>';
 const hasViews=post.views!==null&&post.views!==undefined;
 const snapshot=post.imported_at?(post.imported_at.slice(0,16).replace('T',' ')+' UTC'):'Snapshot date not recorded';
 return `<div class="social-post-detail"><div class="kicker">Source-level record</div><h3>${h(post.topic)} · ${h(post.platform)}</h3><p class="fine">Published ${h(post.published_on)} · ${h(snapshot)}</p><div class="social-post-metrics"><div><small>Views</small><b>${hasViews?fmt(Number(post.views)):'Unknown'}</b></div><div><small>Likes</small><b>${fmt(Number(post.likes||0))}</b></div><div><small>Comments</small><b>${fmt(Number(post.comments||0))}</b></div><div><small>Shares</small><b>${fmt(Number(post.shares||0))}</b></div></div><p class="fine">Metrics are uploader-supplied snapshots, not independently authenticated or longitudinal trends. The import schema does not yet provide transcripts or claim verification.</p><div class="social-original">${link(post.post_url,'Open original public post ↗')}</div></div>`;
}
function socialDrill(posts){
 if(SOCIAL_UI.post!==null){const item=posts.find(p=>p.post_url===SOCIAL_UI.post);return socialDetail(item);}
 if(SOCIAL_UI.topic!==null){
  const chosen=posts.filter(p=>p.topic===SOCIAL_UI.topic);
  return `<div class="social-dive-heading"><strong>3 · Individual posts</strong><span>${fmt(chosen.length)} matching records</span></div>${chosen.length?chosen.map(p=>socialRow(p.platform,p.topic,p.published_on,p.views===null?null:Number(p.views),'post',p.post_url,'↗')).join(''):'<div class="social-blank">No posts in this period. Widen the date filter.</div>'}`;
 }
 if(SOCIAL_UI.platform!=='All'){
  const m=new Map();for(const p of posts){const group=m.get(p.topic)||[];group.push(p);m.set(p.topic,group);}
  const grouped=[...m].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0]));
  return `<div class="social-dive-heading"><strong>2 · Published themes</strong><span>CSV topics · not model-inferred</span></div>${grouped.length?grouped.map(([t,g])=>socialRow('topic',t,fmt(g.reduce((sum,p)=>sum+socialMetric(p),0))+' recorded interactions',g.length,'topic',t,'#')).join(''):'<div class="social-blank"><strong>No posts in this platform and period</strong><p>Import permitted public-post exports or change your time filter.</p></div>'}`;
 }
 return `<div class="social-dive-heading"><strong>1 · Explore a platform</strong><span>Choose a channel to drill down</span></div>`+SOCIAL_FOCUS.map(x=>{
  const subset=posts.filter(p=>socialCategory(p)===x.platform);
  return socialRow('platform',x.label,x.desc,subset.length||null,'platform',x.platform,x.mark);
 }).join('');
}
function socialPostList(posts){
 const list=posts.slice(0,35);
 if(!list.length)return '<div class="social-blank"><strong>No public posts in this scope.</strong><p>Import an authorised channel CSV. Opening this dashboard does not fetch or scrape Instagram or YouTube.</p></div>';
 return `<div class="table-wrap"><table><thead><tr><th>Published</th><th>Platform</th><th>Public topic</th><th>Views</th><th>Interactions</th><th>Record</th></tr></thead><tbody>${list.map(p=>`<tr><td>${h(p.published_on)}</td><td>${h(p.platform)}</td><td>${h(p.topic)}</td><td>${p.views===null?'—':fmt(Number(p.views))}</td><td>${fmt(socialMetric(p))}</td><td><button class="social-text-button" data-social="show-post" data-value="${h(p.post_url)}">Inspect →</button></td></tr>`).join('')}</tbody></table></div><p class="fine" style="margin-top:12px">Showing ${fmt(list.length)} of ${fmt(posts.length)} visible source records. No audience or voter inference.</p>`;
}
function socialGoalContext(){
 const goals=DEVELOPMENT.outcomes||[],g=goals.find(x=>x.id===SOCIAL_UI.goal);
 const opts='<option value="">Select a public outcome (manual comparison)</option>'+goals.map(x=>`<option value="${h(x.id)}" ${x.id===SOCIAL_UI.goal?'selected':''}>${h(x.title)}</option>`).join('');
 return `<div class="social-section-label">From what is published to what should be measured</div><h3>Connect themes to development</h3><p class="fine">A post's topic is not proof of a problem or a result. Manually select an outcome compact and inspect the official baseline and follow-up evidence required.</p><label class="fine" for="social_goal_filter">2031 outcome compact</label><select id="social_goal_filter" aria-label="Choose a development outcome">${opts}</select>${g?`<div class="social-linked-goal"><strong>${h(g.title)}</strong><p>${h(g.outcome)}</p><div class="fine">Suggested indicator: ${h(g.north_star.indicator)}</div><div class="fine">Verified baseline: pending</div><button class="btn small" data-social="open-development" type="button">Open development compact →</button></div>`:`<div class="social-goal-placeholder">Choose a goal to compare the published narrative with measurable public benefit.</div>`}`;
}
function socialReport(posts){
 const summary=socialAggregate(posts);
 const topics=new Map();for(const p of posts)topics.set(p.topic,(topics.get(p.topic)||0)+1);
 const lines=["# TN Lens · Public Social Evidence Brief",'',`Prepared: ${new Date().toISOString().slice(0,10)}`,'Independent source-attributed research; not a public opinion poll.','',`Selected platform: ${SOCIAL_UI.platform}`,`Published-date filter: ${SOCIAL_UI.period==='all'?'All imported dates':'Last '+SOCIAL_UI.period+' days'}`,`Selected topic: ${SOCIAL_UI.topic||'All'}`,`Public posts: ${summary.count}`,`Views from ${summary.knownViews} records: ${summary.knownViews?summary.views:'Not available'}`,`Recorded likes + comments + shares: ${summary.interactions}`,'','## Topics (uploader-declared)',...([...topics].map(([t,c])=>`- ${t}: ${c} posts`)),'','## Original public posts',...posts.map(p=>`- [${p.platform} · ${p.published_on} · ${p.topic}](${p.post_url}) — views ${p.views===null?'unknown':p.views}, recorded interactions ${socialMetric(p)}`),'','## Source and interpretation limits','- Public-post metrics supplied by an importer. Account ownership and numbers have not been independently authenticated.','- Date filter applies to publication date, NOT to the observation period for view and interaction counts.','- Views and engagement differ by platform and do not represent Tamil Nadu public opinion, electoral preferences or measurable development.','- No private user data, location targeting or inferred individual attributes.', ''];
 return lines.join('\n');
}
function renderSocialDashboard(){
 const all=socialPosts(),chosen=socialSelection(all),metrics=socialAggregate(chosen);
 const crumbs=[socialCrumb('Tamil Nadu / public social overview','home')];
 if(SOCIAL_UI.platform!=='All')crumbs.push(socialCrumb(SOCIAL_UI.platform,'to-platform'));
 if(SOCIAL_UI.topic!==null)crumbs.push(socialCrumb(SOCIAL_UI.topic,'to-topic'));
 if(SOCIAL_UI.post!==null)crumbs.push('<span class="social-crumb-current">Post detail</span>');
 $('social_breadcrumbs').innerHTML=crumbs.join('<span class="social-chevron">/</span>');
 $('social_platform_switch').innerHTML=['All',...SOCIAL_KEYS].map(k=>`<button type="button" data-social="platform" data-value="${k}" class="${k===SOCIAL_UI.platform?'active':''}" aria-pressed="${k===SOCIAL_UI.platform}">${k==='All'?'All platforms':k}</button>`).join('');
 $('social_period').value=SOCIAL_UI.period;
 const allImported=appData.social_posts||[];
 const cov=`${fmt(allImported.filter(x=>x.platform==='YouTube').length)} YouTube · ${fmt(allImported.filter(x=>x.platform==='Instagram').length)} Instagram · imported records`;
 $('social_status').innerHTML=`<span class="social-led"></span><span><strong>${allImported.length?'Imported metrics · source review pending':'No social feed connected'}</strong><span class="social-status-sub">${h(cov)}</span></span><span class="social-status-last">${metrics.latest?'Most recent import '+h(metrics.latest.slice(0,10)):'Snapshot unavailable · CSV required'}</span>`;
 $('social_metrics').innerHTML=socialChip('Posts in current scope',fmt(metrics.count),'Source URLs, not audience size')+socialChip('Reported video / post views',metrics.knownViews?fmt(metrics.views):'—',`${fmt(metrics.knownViews)} of ${fmt(metrics.count)} have view counts`)+socialChip('Recorded interactions',metrics.count?fmt(metrics.interactions):'—','Likes + comments + shares')+socialChip('Uploader-declared topics',metrics.count?fmt(metrics.topics):'—','Not automatically classified');
 $('social_waterfall').innerHTML=socialBarChart(chosen);
 $('social_drill').innerHTML=socialDrill(all);
 $('social_post_list').innerHTML=socialPostList(chosen);
 $('social_goal_context').innerHTML=socialGoalContext();
 const step=SOCIAL_UI.post!==null?'Post-level evidence':SOCIAL_UI.topic!==null?'Post-level breakdown':SOCIAL_UI.platform!=='All'?'Themes in this channel':'Choose a platform';
 $('social_drill_stage').textContent=step;
 $('social_evidence_footer').textContent='Publication date filter · Imported lifetime metrics at the time of export. Data is neither live nor independently audited.';
}
document.addEventListener('click',ev=>{
 const b=ev.target.closest('button[data-social]');if(!b)return;
 const action=b.dataset.social,value=b.dataset.value||'';
 if(action==='home'){SOCIAL_UI.platform='All';SOCIAL_UI.topic=null;SOCIAL_UI.post=null;}
 if(action==='platform'){SOCIAL_UI.platform=value;SOCIAL_UI.topic=null;SOCIAL_UI.post=null;}
 if(action==='to-platform'){SOCIAL_UI.topic=null;SOCIAL_UI.post=null;}
 if(action==='topic'){SOCIAL_UI.topic=value;SOCIAL_UI.post=null;}
 if(action==='to-topic'){SOCIAL_UI.post=null;}
 if(action==='post'||action==='show-post'){
  const p=socialPosts().find(p=>p.post_url===value);if(p){SOCIAL_UI.platform=socialCategory(p);SOCIAL_UI.topic=p.topic;SOCIAL_UI.post=p.post_url;}
 }
 if(action==='open-development'){
  if(SOCIAL_UI.goal){developmentSelected=SOCIAL_UI.goal;renderDevelopment();navigate('development');}return;
 }
 if(action==='export-social'){
  download('tn-lens-public-social-'+new Date().toISOString().slice(0,10)+'.md',socialReport(socialSelection(socialPosts())),'text/markdown');notify('Source-linked social research summary downloaded.');return;
 }
 if(action==='reset-social'){SOCIAL_UI.platform='All';SOCIAL_UI.topic=null;SOCIAL_UI.post=null;SOCIAL_UI.period='all';SOCIAL_UI.goal='';}
 renderSocialDashboard();
});
document.addEventListener('change',ev=>{
 if(ev.target.id==='social_period'){SOCIAL_UI.period=ev.target.value;SOCIAL_UI.post=null;renderSocialDashboard();}
 if(ev.target.id==='social_goal_filter'){SOCIAL_UI.goal=ev.target.value;renderSocialDashboard();}
});
