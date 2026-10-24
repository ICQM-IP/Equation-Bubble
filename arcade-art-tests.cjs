'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Element {
 constructor(){this.children=[];this.style={};this.attrs={};this.dataset={};this.classes=new Set();this.classList={contains:k=>this.classes.has(k),add:k=>this.classes.add(k),remove:k=>this.classes.delete(k),toggle:(k,on)=>on?this.classes.add(k):this.classes.delete(k)};this.offsetLeft=15;this.offsetTop=600;this.offsetWidth=160;this.offsetHeight=185;this.parentElement={querySelector:()=>actor};}
 append(...xs){this.children.push(...xs)}before(el){this.decoration=el}setAttribute(k,v){this.attrs[k]=v}getAttribute(k){return this.attrs[k]||null}getClientRects(){return [{}]}get offsetWidth(){return this._width}set offsetWidth(v){this._width=v}
}
const actor=new Element(),teacher=new Element(),mobileTeacher=new Element(),cannon=new Element();teacher.attrs.src=mobileTeacher.attrs.src='assets/teacher.png';cannon.style.left='646px';cannon.style.top='568px';
const queue=[],reduced={matches:false},body=new Element();
const ctx={document:{body,hidden:false,querySelector:s=>({'#teacher':teacher,'#mobileTeacherIcon':mobileTeacher,'#cannon':cannon}[s]||null),createElement:()=>new Element()},matchMedia:()=>reduced,requestAnimationFrame:f=>queue.push(f),getComputedStyle:()=>({display:'block'}),version:1,running:true,paused:false,mobileInputEditing:false,fastChain:0,excitementEffects:true};ctx.window=ctx;
vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/arcade-art.js','utf8'),ctx);
let now=0;const step=(count=1)=>{for(let i=0;i<count;i++)queue.shift()(now+=50)};step();
assert.equal(teacher.decoration.style.left,'15px');assert.equal(teacher.decoration.style.top,'600px');
ctx.arcadeArtEvent({type:'fire'});assert(cannon.classes.has('arcade-shot'));assert.equal(cannon.style.left,'646px');assert.equal(cannon.style.top,'568px');
ctx.arcadeArtEvent({type:'clear'});step();assert.equal(teacher.decoration.children[2].textContent,'平衡完成！');assert(teacher.decoration.classes.has('is-reacting'));
ctx.paused=true;step(60);assert(teacher.decoration.classes.has('is-reacting'),'pause freezes reaction lifetime');ctx.paused=false;step(30);assert(!teacher.decoration.classes.has('is-reacting'));
ctx.arcadeArtEvent({type:'rescue'});ctx.arcadeArtEvent({type:'hit'});step();assert.equal(teacher.decoration.children[2].textContent,'救援啟動！');assert(teacher.decoration.classes.has('is-special'));
reduced.matches=true;step();assert(!teacher.decoration.classes.has('is-special'));assert(teacher.decoration.classes.has('is-quiet'));
ctx.version++;step();assert(!teacher.decoration.classes.has('is-reacting'),'restart clears old reaction');ctx.running=false;step();assert.equal(teacher.decoration.hidden,true);
console.log('PASS: art follows original teacher bounds; cannon coordinates unchanged; clear/rescue priority; pause; reduced motion; restart and inactive visibility.');
