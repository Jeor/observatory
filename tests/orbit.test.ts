import test from 'node:test';
import assert from 'node:assert/strict';
import {orbitStep} from '../web/charts/orbit.ts';
test('horizontal drag keeps foreground movement consistent upright and inverted',()=>{
 for(const pitch of [0,.5,Math.PI,Math.PI+.5,-Math.PI,2*Math.PI]){
  // A point directly in front of the camera before input.
  const point=[0,Math.sin(pitch),Math.cos(pitch)];
  for(const dx of [-.01,.01]){
   const next=orbitStep({x:pitch,y:0},dx,0);
   const projectedX=point[0]*Math.cos(next.y)+point[2]*Math.sin(next.y);
   assert.equal(Math.sign(projectedX),Math.sign(dx));
  }
 }
});
test('momentum adapts when vertical movement crosses a pole',()=>{
 const before={x:Math.PI/2-.01,y:0};
 const after=orbitStep(before,.02,.03);
 const continued=orbitStep(after,.02,0);
 assert.ok(after.y>before.y);assert.ok(continued.y<after.y);
 assert.equal(continued.x,after.x);
});
