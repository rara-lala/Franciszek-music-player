import test from 'node:test';
import assert from 'node:assert/strict';
import {poolFor,isBound,parseChoice,nextId,mediaURL,clampPosition,makePrompt,THEME} from '../core.mjs';
const tracks=[{id:THEME,composer:'Bielawski',era:'fictional',instrument:'piano'}, {id:'c',composer:'Frédéric Chopin',era:'romantic',instrument:'piano'}, {id:'s',composer:'Robert Schumann',era:'romantic',instrument:'piano'},{id:'o',composer:'Frédéric Chopin',era:'romantic',instrument:'orchestra'}];
test('Exact avatar binding, renamed card works, another card and groups excluded',()=>{
 const s={enabled:true,avatar:'chosen.png'};
 const c={characters:[{avatar:'chosen.png',name:'Renamed'},{avatar:'other.png',name:'Franciszek Bielawski'}],characterId:0};
 assert.equal(isBound(c,s),true);assert.equal(isBound({...c,characterId:1},s),false);assert.equal(isBound({...c,groupId:'group'},s),false);assert.equal(isBound(c,{...s,enabled:false}),false);
});
test('Composer and repertoire hard filters; theme excluded',()=>{
 assert.deepEqual(poolFor(tracks,'chopin').map(t=>t.id),['c']);assert.deepEqual(poolFor(tracks,'romantic').map(t=>t.id),['c','s']);assert.equal(poolFor(tracks,'custom').length,3);
});
test('Reject fabricated track IDs and disallowed selections',()=>{
 assert.throws(()=>parseChoice('{"id":"evil","eligibleIds":["evil"]}',tracks));assert.throws(()=>parseChoice('{"id":"c","eligibleIds":["s"]}',tracks));assert.throws(()=>parseChoice('not JSON',tracks));
 assert.equal(parseChoice('```json\n{"id":"c","eligibleIds":["c"]}\n```',tracks).id,'c');assert.equal(parseChoice('{"id":null,"eligibleIds":[]}',tracks).id,null);
});
test('Next/previous wrap and missing theme start',()=>{
 assert.equal(nextId(['c','s'],'s'), 'c');assert.equal(nextId(['c','s'],'c',-1),'s');assert.equal(nextId(['c','s'],THEME),'c');assert.equal(nextId([],THEME),null);
});
test('Reject script, data and foreign HTTP media; permit HTTPS and local assets',()=>{
 const base='http://localhost:8000/scripts/extensions/third-party/bielawski-salon-player/';
 for(const s of ['javascript:alert(1)','data:text/html,evil','http://bad.example/music.mp3'])assert.throws(()=>mediaURL(s,base));
 assert.equal(mediaURL('media/theme.mp3',base),base+'media/theme.mp3');assert.equal(mediaURL('https://example.com/a.mp3',base),'https://example.com/a.mp3');
});
test('Player stays within narrow viewport',()=>assert.deepEqual(clampPosition(999,-100,290,190,320,640),{x:22,y:8}));
test('AI sees only last eight non-system messages with capped text',()=>{
 const chat=Array.from({length:20},(_,i)=>({mes:`message${i} `+'x'.repeat(2000),is_user:true}));chat.push({is_system:true,mes:'SECRET_SYSTEM'});
 const text=makePrompt(chat,tracks,'short',THEME);assert.ok(!text.includes('SECRET_SYSTEM'));assert.ok(text.length<16000);
});
