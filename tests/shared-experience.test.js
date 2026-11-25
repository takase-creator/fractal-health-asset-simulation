const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),get=p=>fs.readFileSync(path.join(root,p),'utf8');
const common=get('health-asset-simulation.html');
assert.equal(get('body-palette.html'),common,'Legacy entry must use the same generated experience');
for(const file of ['health-asset-simulation.html','body-palette.html','BODY_PALETTE_offline.html','survey-preview.html']){
 const html=get(file);assert(!html.includes('株式会社ニップン'),'Reference company leaked into '+file);
 for(const [,ref]of html.matchAll(/(?:src|href)="(assets\/[^"?]+)(?:\?[^"]*)?"/g))assert(fs.existsSync(path.join(root,ref)),'Missing published dependency '+ref);
}
for(const f of ['simulator-core.js','min/simulator-core.js','health-ocr.js','min/health-ocr.js','mobile-experience.css','bp-brand.css','intent-experience.js'])assert.equal(get('assets/'+f),get('nippn/assets/'+f),'Approved calculation or presentation drift: '+f);
for(const name of ['projectAsset','simulate','computeLifespan','computeExerciseValue'])assert(get('assets/simulator-core.js').includes('function '+name+'('));
for(const file of ['health-asset-simulation.html','body-palette.html','BODY_PALETTE_offline.html'])assert(get(file).includes('id="chart"')&&get(file).includes('id="age80box"')&&get(file).includes('id="lifespanResult"'));
const offline=get('BODY_PALETTE_offline.html');assert(offline.includes('data:image/webp;base64,'));assert(!/<script src="assets\//.test(offline));
for(const [i,m]of [...offline.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].entries())new vm.Script(m[1],{filename:'standalone-'+i});
console.log('PASS: shared entries keep approved calculations, layout assets, dependencies, company separation and standalone script syntax.');
