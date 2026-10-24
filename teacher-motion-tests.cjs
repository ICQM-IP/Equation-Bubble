const assert=require('node:assert/strict'),{Controller,eventAction,ACTIONS}=require('./teacher-motion.js');
for(const action of Object.keys(ACTIONS)){const c=new Controller();assert(c.play(action,{force:true}));assert.equal(c.action,action);}
const c=new Controller();c.play('rescue');assert.equal(c.play('fire'),false);assert.equal(c.action,'rescue');const t=c.clock,left=c.left;c.step(.5,{paused:true});assert.equal(c.clock,t);assert.equal(c.left,left);c.step(2);assert.equal(c.action,'idle');c.step(.1,{danger:true});assert.equal(c.action,'danger');c.step(.1,{aim:-30});assert.equal(c.action,'aim');assert.equal(c.direction,-1);
assert.equal(eventAction({type:'clear'},1),'clear');assert.equal(eventAction({type:'clear'},2),'clap');assert.equal(eventAction({type:'clear'},4),'pump');for(const type of ['fire','hit','miss','rescue','attack-send','attack-reflect','attack-cancel','attack-receive','life-loss'])assert(eventAction({type}));
console.log('PASS: 16 teacher actions, event mapping, escalating chains, rescue priority, expiry, pause and aim direction.');
const {poseAt,PoseBlend}=require('./teacher-motion.js');
for(let id=0;id<5;id++)for(const a of Object.keys(ACTIONS))for(let t=0;t<=3;t+=.025){const pose=poseAt(a,10+t,t,id);assert(Object.values(pose).every(Number.isFinite));assert(pose.squash>.9&&pose.squash<1.1);}
const tween=new PoseBlend(),rest=poseAt('idle',0,0);tween.step(rest,0);const target=poseAt('clear',.5,.5);const first=tween.step(target,1/60);assert(first.ry>target.ry&&first.ry<rest.ry,'hands travel through intermediate positions');const frozen={...first};assert.deepEqual(tween.step(target,0),frozen,'pause freezes the actual rendered pose');for(let i=0;i<120;i++)tween.step(target,1/60);assert(Math.abs(tween.value.ry-target.ry)<1e-8);
const one=new PoseBlend(),many=new PoseBlend();one.step(rest,0);many.step(rest,0);one.step(target,.2);for(let i=0;i<12;i++)many.step(target,1/60);for(const k of Object.keys(target))assert(Math.abs(one.value[k]-many.value[k])<1e-10,'frame rate independent blend');
const action=new Controller();action.play('fire');action.step(.1);const started=action.started;assert.equal(action.play('fire'),false);assert.equal(action.started,started,'duplicate events must not restart the gesture');
console.log('PASS: five teachers / all actions finite; intermediate hand poses; frame-rate independent smoothing; actual pose pause; repeated-event suppression.');

for(const a of Object.keys(ACTIONS))assert.deepEqual(poseAt(a,1,.1,2,1,false),poseAt(a,10,2,2,1,false),'reduced motion holds a static gesture');
