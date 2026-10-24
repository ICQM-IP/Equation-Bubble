'use strict';
const assert=require('node:assert/strict'),{placement,entranceFor,crosses}=require('./mentor-entrance.js');
const base={width:1120,height:660,line:476,origin:560};
const normal=placement(base);assert(normal);assert(normal.y>476);assert(normal.y+normal.h<660);assert.equal(normal.x,16);
const strong=placement({...base,strong:true});assert(strong);assert(strong.x>normal.x,'strong events enter near the central cannon');
const right=placement({...base,side:1});assert(right.x>800,'player two enters from its own edge');
const blocked=placement({...base,obstacles:[{x:0,y:500,w:1120,h:160}]});assert.equal(blocked,null,'hide rather than cover equations');
const path=[{x:0,y:550},{x:1120,y:550}];assert.equal(placement({...base,path}),null,'line segments crossing portraits suppress entry');
const nearLeftPath=[{x:560,y:580},{x:400,y:480}];const alternative=placement({...base,strong:true,path:nearLeftPath});assert(alternative);assert(alternative.x>560,'move to safe side of aiming line');
for(const config of [{width:1120,height:660,line:476,origin:560,compact:true},{width:760,height:620,line:478,origin:380},{width:760,height:620,line:478,origin:380,compact:true}])for(const strong of [false,true]){const p=placement({...config,strong});assert(p);assert(p.x>=16);assert(p.x+p.w<=config.width-16);assert(p.y>config.line+30);assert(p.y+p.h<config.height);}
assert(crosses({x:20,y:20,w:10,h:10},{x:0,y:0},{x:50,y:50}));assert(!crosses({x:20,y:20,w:10,h:10},{x:0,y:0},{x:0,y:50}));
assert.equal(entranceFor({type:'fire'}),null);assert.equal(entranceFor({type:'clear'}).strong,false);assert.equal(entranceFor({type:'chain',chain:3}).strong,true);assert.equal(entranceFor({type:'rescue'}).pose,11);assert.equal(entranceFor({type:'attack-reflect'}).pose,14);
console.log('PASS: side-entry clears, central high-chain/rescue entries, both players and handheld bounds; equations and aim-line avoidance; hidden fallback; event mapping.');
// Execute the real event/animation integration to verify lifetime and original-teacher restoration.
const fs=require('node:fs'),vm=require('node:vm');
class El{
 constructor(){this.children=[];this.style={};this.dataset={};this.attrs={};this.hidden=false;this.offsetWidth=1120;this.offsetHeight=660;this.complete=true;this.naturalWidth=this.naturalHeight=1280;this.set=new Set();this.classList={add:k=>this.set.add(k),remove:k=>this.set.delete(k),contains:k=>this.set.has(k),toggle:(k,on)=>on?this.set.add(k):this.set.delete(k)};}
 setAttribute(k,v){this.attrs[k]=v}getAttribute(k){return this.attrs[k]||null}append(...xs){this.children.push(...xs)}getBoundingClientRect(){return {left:0,top:0,width:1120,height:660}}getContext(){return {clearRect(){},drawImage(){}}}querySelector(){return null}querySelectorAll(){return []}
}
const field=new El(),source=new El(),mobile=new El(),actor=new El(),decoration=new El(),body=new El(),guide=new El();source.attrs.src=mobile.attrs.src='assets/teacher.png';source.parentElement=mobile.parentElement={querySelector:()=>actor};
const nodes={'#field':field,'#teacher':source,'#mobileTeacherIcon':mobile,'#trajectory path':guide},frames=[],preference={matches:false};let forwarded=0;
const context={document:{body,hidden:false,querySelector:s=>nodes[s]||null,querySelectorAll:()=>[decoration],createElement:()=>new El()},Image:El,EquationTeachers:[{image:'assets/teacher.png'}],matchMedia:()=>preference,requestAnimationFrame:f=>frames.push(f),arcadeArtEvent:()=>forwarded++,version:1,running:true,paused:false,mobileInputEditing:false,mobileMode:false,combo:0,fastChain:0,turbo:false,excitementEffects:true};
vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/mentor-entrance.js','utf8'),context);let now=0;const tick=(n=1)=>{for(let i=0;i<n;i++)frames.shift()(now+=50)};tick();const entrance=field.children[0];
context.arcadeArtEvent({type:'rescue'});tick();assert.equal(forwarded,1);assert(!entrance.hidden);assert(source.set.has('mentor-offstage'));assert(actor.set.has('mentor-offstage'));assert(decoration.set.has('mentor-offstage'));
context.paused=true;tick(50);assert(!entrance.hidden,'pause preserves entrance');context.paused=false;tick(30);assert(entrance.hidden);assert(!source.set.has('mentor-offstage'));assert(!actor.set.has('mentor-offstage'));
preference.matches=true;context.arcadeArtEvent({type:'rescue'});tick();assert(entrance.set.has('quiet'));assert(!entrance.set.has('behind-cannon'),'reduced motion uses static side pose');
context.version++;tick();assert(entrance.hidden);assert(!source.set.has('mentor-offstage'),'restart restores original teacher');
context.arcadeArtEvent({type:'clear'});tick();context.running=false;tick();assert(entrance.hidden);assert(!decoration.set.has('mentor-offstage'));
console.log('PASS: real event forwarding, pause/resume lifetime, reduced-motion fallback, original teacher restoration, restart and inactive cleanup.');
