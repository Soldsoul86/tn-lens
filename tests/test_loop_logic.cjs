const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const code = fs.readFileSync(path.join(__dirname,'../loop/app.js'),'utf8');
const elements = {};
const handlers = {};
const storage = new Map();
function el(id) {
  if(!elements[id]) elements[id] = {id,innerHTML:'',textContent:'',value:id==='vol-hours'?'12':id==='hours-per'?'2':id==='evidence-type'?'self':'',checked:false,scrollHeight:0,scrollTop:0,classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(name,fn){handlers[id+':'+name]=fn}};
  return elements[id];
}
const document={getElementById:el, querySelectorAll(){return []},addEventListener(name,fn){handlers['document:'+name]=fn}};
const localStorage={getItem(k){return storage.has(k)?storage.get(k):null},setItem(k,v){storage.set(k,v)}};
const window={scrollTo(){}};
const sandbox={document,localStorage,window,crypto:{getRandomValues(a){a[0]=16348;return a}},Date,Number,String,Math,Uint32Array,JSON,Array,Set,Map,console,clearTimeout(){},setTimeout(){return 1}};
vm.runInNewContext(code,sandbox,{filename:'ground-loop-app.js'});
const data=()=>JSON.parse(storage.get('tn-lens-ground-loop-v1'));
function click(attr,value){const t={dataset:{[attr]:value},closest(sel){return sel===`[data-${attr.replace(/[A-Z]/g,x=>'-'+x.toLowerCase())}]`?this:null}};handlers['document:click']({target:t});}
function direct(id,type='click'){handlers[id+':'+type]({})}
function fixture(name,v){el(name).value=v}
assert.equal(el('leader-metrics').innerHTML.match(/class="value">(\d+)/)[1],'24');
click('chat','consent');
assert.equal(data().cases.length,25);
const id=data().cases.at(-1).id;
assert(/^NL-/.test(id));
click('chat','step:mentor');click('chat','due:7');click('chat','needs-help');click('chat','block:mentor');
let caseData=data().cases.at(-1);
assert.equal(caseData.stage,2);assert.equal(caseData.help,true);assert.equal(caseData.blocker,'mentor');
click('view','field');
assert(el('field-list').innerHTML.includes(id),'case in field queue');
click('selectCase',id);
fixture('support-type','mentor');
click('recordSupport',id);
caseData=data().cases.at(-1);assert.equal(caseData.help,false);assert.equal(caseData.support,'mentor');
click('view','chat');click('chat','completed');
assert.equal(data().cases.at(-1).stage,3);
click('view','field');click('selectCase',id);fixture('evidence-type','self');el('review-confirm').checked=true;click('verify',id);
assert.equal(data().cases.at(-1).stage,3,'self report cannot be marked reviewed');
fixture('evidence-type','partner');el('review-confirm').checked=true;click('verify',id);
assert.equal(data().cases.at(-1).stage,4);
click('view','leadership');
assert(el('leader-metrics').innerHTML.includes('>25</div>'),'25 cases after extra one');
assert(el('leader-metrics').innerHTML.includes('>21</div>'),'21 next steps');
assert(el('leader-metrics').innerHTML.includes('>6</div>'),'6 completions');
assert(el('leader-metrics').innerHTML.includes('>3</div>'),'3 reviewed');
click('funnel','4');assert(el('funnel-detail').textContent.includes('3 of 25'));
fixture('vol-hours','4');direct('vol-hours','input');assert(el('scenario').innerHTML.includes('2 of 3'));
direct('clear-fixtures');assert.equal(data().cases.length,1);
direct('restore-fixtures');assert.equal(data().cases.length,25);
console.log('PASS Ground Loop: 24 fixture stages, opt-in chat, help queue, field support, evidence gate, leader waterfall, scenario, local reset.');
