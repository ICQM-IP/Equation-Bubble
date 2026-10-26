'use strict';
const assert=require('node:assert/strict'),{translate}=require('./i18n.js');
for(const [input,output]of [['自主練習','Solo practice'],['開始挑戰電腦 →','Challenge computer →'],['平衡完成！x = 2','Balanced! x = 2'],['提示 1：先處理發光項 −3x。','Hint 1: remove the highlighted term −3x。'],['2x + 4 = 10','2x + 4 = 10'],['Mr. IP','Mr. IP']])assert.equal(translate(input),output);
for(const text of ['你已解 3 題 · 星題可攻擊電腦','火力 1/5 · 8 秒內連解可追擊','3 分鐘限時賽：先比解題數，再比命中率；碰線不扣心。','★ 星題送 2 題；連解最多送 3 題！'])assert(!/[\u4e00-\u9fff]/.test(translate(text)),translate(text));
console.log('PASS: menu, dynamic hints, results and attack messages translate; mathematics and teacher names stay unchanged.');

// Include every teacher reaction, not only static menus and equation messages.
const fs=require('node:fs'),art=fs.readFileSync(__dirname+'/arcade-art.js','utf8');
const reactions=[...art.matchAll(/\['([^']*[\u4e00-\u9fff][^']*)',\s*[.\d]+/g)].map(m=>m[1]);assert(reactions.length>=10);for(const phrase of reactions)assert(!/[\u4e00-\u9fff]/.test(translate(phrase)),phrase);assert.equal(translate('漂亮一步！'),'Nice step!');assert.equal(translate('3 連解！'),'3 Combo!');console.log('PASS: all teacher reaction captions have English translations.');
assert.equal(translate('拆括弧'),'Expand');assert.equal(translate('分配律：每一項都要乘！'),'Distributive law: multiply every term!');
