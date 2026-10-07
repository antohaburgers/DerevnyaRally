import {CIRCUIT_CONFIG,installCircuitSupport} from './circuit-world.js?v=024';
// The same forward road generator, frozen at a finite finish rather than pruned per player.
export const SPRINT_CONFIG={lengths:{SPRINT_5:5000,SPRINT_10:10000},checkpointSpacing:500};
export function buildSprint(world,seed,mode='SPRINT_5'){
 if(!world.atDistance)installCircuitSupport(world.constructor);world.reset(seed);world.finiteRace=true;world.raceLength=SPRINT_CONFIG.lengths[mode];world.raceFinishS=CIRCUIT_CONFIG.startLine+world.raceLength;
 while(world.sections.at(-1).exitDistance<world.raceFinishS)world.append();
 const last=world.sections.at(-1),finish=world.atDistance(world.raceFinishS),oldLength=last.length,u=(world.raceFinishS-last.startDistance)/oldLength;
 last.nodes=last.nodes.filter(n=>n.s<world.raceFinishS);last.nodes.push({...finish,width:last.nodes.at(-1)?.width||last.width,s:world.raceFinishS,u});last.length=world.raceFinishS-last.startDistance;last.exitDistance=world.raceFinishS;for(const n of last.nodes)n.u=(n.s-last.startDistance)/last.length;last.exitTransform={...last.nodes.at(-1)};
 // Clear only the grid/launch area and the last finish approach. The rest keeps normal gameplay.
 for(const s of world.sections){if(s.startDistance<200||s.exitDistance>world.raceFinishS-80){s.localFeatures=[];s.obstacles=[];s.hill=null;s.crestSafe=false;s.animalEvents=[];s.farmerEvents=[];s.pickups=[];s.decorations=s.decorations.filter(d=>!['parked','stone'].includes(d.kind));s.type=s.id===0?'START_FINISH':'SHORT_STRAIGHT';s.mode='FAST';const a=s.nodes[0].y,b=s.nodes.at(-1).y;for(const n of s.nodes){n.y=a+(b-a)*n.u;n.width=CIRCUIT_CONFIG.roadWidth;}s.width=CIRCUIT_CONFIG.roadWidth;s.entryTransform={...s.nodes[0]};s.exitTransform={...s.nodes.at(-1)};}s.decorationRevision++;}
 world.binsDirty=true;world.indexSegments();world.current=world.sections[0];world.revision++;return world;
}
