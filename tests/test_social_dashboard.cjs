const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../static/social-dashboard.module.js'),'utf8');
const fixture = [
  {platform:'YouTube',published_on:'2026-10-20',topic:'Water',post_url:'https://www.youtube.com/watch?v=FIXTURE1',views:1500,likes:45,comments:10,shares:5,imported_at:'2026-10-23T02:00:00Z'},
  {platform:'Instagram',published_on:'2026-10-21',topic:'Water',post_url:'https://www.instagram.com/p/FIXTURE2/',views:900,likes:70,comments:12,shares:8,imported_at:'2026-10-23T02:00:00Z'},
  {platform:'YouTube',published_on:'2026-10-22',topic:'Education',post_url:'https://www.youtube.com/watch?v=FIXTURE3',views:800,likes:12,comments:2,shares:1,imported_at:'2026-10-23T02:00:00Z'},
  {platform:'Instagram',published_on:'2026-10-19',topic:'Health',post_url:'https://www.instagram.com/reel/FIXTURE4/',views:null,likes:20,comments:3,shares:1,imported_at:'2026-10-23T02:00:00Z'},
];
function moduleUnderTest(posts){
  const scope={appData:{social_posts:posts},DEVELOPMENT:{outcomes:[]},document:{addEventListener(){}},fmt:x=>x.toLocaleString('en-IN'),h:x=>String(x),Date,Number,Math,Map,Set,Intl};
  return vm.runInNewContext(source+'\n({SOCIAL_UI,socialPosts,socialSelection,socialAggregate,socialBarChart,socialCategory,socialMetric,socialReport})',scope);
}
test('aggregate only imported public post metrics and count missing view data',()=>{
  const m=moduleUnderTest(fixture); const a=m.socialAggregate(m.socialPosts());
  assert.equal(a.count,4);assert.equal(a.views,3200);assert.equal(a.knownViews,3);assert.equal(a.interactions,189);assert.equal(a.topics,3);
});
test('cascading platform and topic drilldown preserves exact scope',()=>{
  const m=moduleUnderTest(fixture);
  m.SOCIAL_UI.platform='YouTube'; assert.equal(m.socialPosts().length,2);
  m.SOCIAL_UI.topic='Water';assert.equal(m.socialSelection(m.socialPosts()).length,1);
  m.SOCIAL_UI.post=fixture[0].post_url;assert.equal(m.socialSelection(m.socialPosts())[0].post_url,fixture[0].post_url);
});
test('waterfall is additive and empty state has no synthetic figures',()=>{
  const m=moduleUnderTest(fixture);const chart=m.socialBarChart(m.socialPosts());
  assert.match(chart,/Recorded interactions by platform/);assert.match(chart,/189/);assert.match(chart,/YouTube/);assert.match(chart,/Instagram/);
  assert.match(m.socialBarChart([]),/No measured contribution yet/);
});
test('source-linked export discloses interpretation limits',()=>{
  const m=moduleUnderTest(fixture);const report=m.socialReport(m.socialPosts());
  assert.match(report,/2026-10-20/);assert.match(report,/FIXTURE1/);assert.match(report,/not a public opinion poll/);assert.match(report,/Views from 3 records/);
});
