import test from 'node:test';
import assert from 'node:assert/strict';
import {distributeMechanicalTorque,STADIUM_DRIVE,CAR_CONFIG} from '../physics.js';
const wheels=()=>Array.from({length:4},()=>({contact:true,load:10000,mu:1.24,surface:{slipResistance:1},detached:false}));
test('stadium sends 30/70, keeps rear pulling with an unloaded front wheel, and supports reverse',()=>{
 const w=wheels(),state={arcadeDrive:STADIUM_DRIVE};assert.deepEqual(distributeMechanicalTorque(1000,w,false,true,CAR_CONFIG,state),[150,150,350,350]);assert.deepEqual(distributeMechanicalTorque(-1000,w,false,true,CAR_CONFIG,state),[-150,-150,-350,-350]);w[0].contact=false;const t=distributeMechanicalTorque(1000,w,false,true,CAR_CONFIG,state);assert.ok(t[0]+t[1]<300);assert.equal(t[2]+t[3],700);state.frontDriveActive=false;assert.deepEqual(distributeMechanicalTorque(1000,w,false,true,CAR_CONFIG,state),[0,0,350,350]);
});
test('original drivetrain without stadium profile retains its open-center 50/50 distribution',()=>{assert.deepEqual(distributeMechanicalTorque(1000,wheels(),false,false,CAR_CONFIG,{}),[250,250,250,250]);});
