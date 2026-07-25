import { chromium } from 'playwright';
const URL = 'https://freenodalvpn.xyz/cooked/';
const results = [];
const ok = (name, cond, detail) => results.push({ name, pass: !!cond, detail: detail || '' });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message));
const shot = n => p.screenshot({ path: 'shots/' + n + '.png' });

await p.goto(URL, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1600);

// 1 · no white anywhere behind the app
const bgs = await p.evaluate(() => [getComputedStyle(document.documentElement).backgroundColor, getComputedStyle(document.body).backgroundColor]);
ok('html/body background is dark (no white leak)', bgs.every(c => c.includes('13, 10, 7') || c.includes('rgba(0, 0, 0, 0)')), bgs.join(' | '));

// 2 · no horizontal overflow on mobile
const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok('no horizontal overflow on 390px viewport', overflow <= 0, 'scrollWidth - innerWidth = ' + overflow);

// 3 · grief ticker is alive
const g1 = await p.textContent('#grief'); await p.waitForTimeout(1600); const g2 = await p.textContent('#grief');
ok('grief ticker counts live', g1 !== g2, g1 + ' → ' + g2);
await shot('t1-landing');

// 4a · garbage address is rejected with a shake, no scan
await p.fill('#addrIn', 'lol not an address');
await p.click('#goBtn');
await p.waitForTimeout(700);
ok('invalid address blocked (still on landing, no scan)', await p.evaluate(() => !document.getElementById('scanBox').classList.contains('on') && !document.getElementById('addrBox').classList.contains('gone')));
await p.fill('#addrIn', 'vitalik.eth');

// 4 · in-place preheat, then auto-advance
await p.click('#goBtn');
await p.waitForTimeout(1300);
ok('preheat replaces input in place (still on s1)', await p.isVisible('#scanBox') && await p.evaluate(() => document.getElementById('s1').classList.contains('active')));
await shot('t2-preheat');
await p.waitForSelector('#s2.active', { timeout: 8000 });
ok('scan auto-advances to verdict', true);

// 5 · verdict sequence lands
await p.waitForTimeout(7200);
const score = await p.textContent('#scoreV');
ok('score counter reaches 68', score.trim() === '68', 'got: ' + score);
ok('stamp slammed', await p.evaluate(() => document.getElementById('stampV').classList.contains('on')));
ok('knives revealed', await p.evaluate(() => document.getElementById('knivesV').classList.contains('on')));
ok('exploit € counted up to 4,120', (await p.textContent('#amt1')).includes('4,120'), await p.textContent('#amt1'));
ok('verdict screen tinted to band (UI cooks with you)', await p.evaluate(() => document.getElementById('s2').classList.contains('hotbg')));
await p.click('#frows .formrow'); await p.waitForTimeout(300);
ok('form row expands evidence on tap', await p.evaluate(() => document.querySelector('#frows .formrow').classList.contains('open')));
await p.click('#frows .formrow');
await shot('t3-verdict');

// 6 · seal + share modals
await p.click('.sealbtn'); await p.waitForTimeout(400);
ok('attestation modal opens', await p.isVisible('#sealModal .sheet'));
await shot('t4-attestation');
await p.click('#sealModal button');
await p.click('text=Share the misery'); await p.waitForTimeout(400);
ok('misery card opens', await p.isVisible('#shareModal .cardwrap'));
await shot('t5-misery');
await p.click('#shareModal button');

// 7 · THE GATE: anonymous surgeon cannot operate
await p.click('text=Want the knives out'); await p.waitForTimeout(700);
ok('OPERATE disabled while anonymous', await p.isDisabled('#operateBtn'));
await shot('t6-locked');
await p.click('#verifyBtn'); await p.waitForTimeout(1900);
ok('OPERATE enabled after selfie check', !(await p.isDisabled('#operateBtn')));
ok('authority badge updated', (await p.textContent('#authLvl')).includes('selfie-backed'));
ok('selfie countdown ticking', await p.isVisible('#cd'));
ok('batch + gas line present', (await p.textContent('#s3')).includes('batched'));
await shot('t7-armed');

// 8 · operate → both wounds heal → auto-discharge
await p.click('#operateBtn'); await p.waitForTimeout(2500); await shot('t8-operating');
await p.waitForSelector('#s4.active', { timeout: 11000 });
const healed = await p.evaluate(() => document.querySelectorAll('#s3 .wound.healed').length);
ok('both wounds revoked', healed === 2, healed + '/2');
await p.waitForTimeout(2100);
const sd = await p.textContent('#scoreD');
ok('discharge score lands on 31%', sd.trim() === '31%', 'got: ' + sd);
ok('recovery sparkline present', await p.isVisible('.sparkcard svg'));
await shot('t9-discharge');

// 9 · recourse bottom sheet
await p.click('text=my options'); await p.waitForTimeout(1400);
ok('recourse sheet opens with 3 options', (await p.evaluate(() => document.querySelectorAll('#recList .rec-opt.on').length)) === 3);
ok('data-minimization line present', (await p.textContent('#recModal')).includes('two booleans'));
await shot('t10-recourse');
await p.click('#recModal button');

// 10 · start over resets cleanly
await p.click('text=start over'); await p.waitForTimeout(600);
ok('reset returns to landing with input restored', await p.evaluate(() => document.getElementById('s1').classList.contains('active') && !document.getElementById('addrBox').classList.contains('gone')));

// 11 · reduced motion doesn't crash
const ctx2 = await b.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 800 } });
const p2 = await ctx2.newPage(); const errs2 = [];
p2.on('pageerror', e => errs2.push(e.message));
await p2.goto(URL, { waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(1200);
ok('reduced-motion load is clean', errs2.length === 0 && await p2.isVisible('#goBtn'));

ok('zero page errors across full flow', errs.length === 0, errs.slice(0, 2).join('; '));
await b.close();
const passed = results.filter(r => r.pass).length;
for (const r of results) console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + r.name + (r.detail ? '  (' + r.detail + ')' : ''));
console.log('\n' + passed + '/' + results.length + ' tests passed');
process.exit(passed === results.length ? 0 : 1);
