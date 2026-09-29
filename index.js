import {ORDER,MOODS,MODELS,normalize,eligible,nextTrack,parseChoice,time,bound,recentMessages,DEFAULT_SELECTION_PROMPT,SELECTION_PROTOCOL} from './core.mjs';
const mobileQuery=matchMedia('(max-width: 768px), (pointer: coarse)');
const BASE=new URL('.',import.meta.url),KEY='bielawski_salon_player_v2',ctx=()=>SillyTavern.getContext();
let s,tracks,player,dialog,audio,ready=false,running=true,current='waltz',chatKey='',epoch=0,controller,timer,pausedByUser=false,silenceRequested=false,waitingSilence=false,lastText='',lastMood='',generating=false,serial=0;
const $=x=>player.querySelector(x),q=x=>dialog.querySelector(x),save=()=>ctx().saveSettingsDebounced();
const active=()=>running&&bound(ctx(),s),ids=()=>s.auto?s.order:eligible(s),track=id=>tracks.find(t=>t.id===id);
function cancel(){epoch++;clearTimeout(timer);controller?.abort();controller=null;}
function status(t){$('.bs-status').textContent=t;q('.bs-feedback').textContent=t;}
function button(action,text,label,cls=''){return `<button type="button" class="${cls}" data-action="${action}" title="${label}" aria-label="${label}">${text}</button>`;}
function updateTitleScroll(){
 const box=$('.bs-title'),text=$('.bs-title-text');
 if(!box.clientWidth)return;
 const overflow=Math.ceil(text.scrollWidth-box.clientWidth);
 box.classList.toggle('is-scrolling',overflow>1);
 if(overflow>1){box.style.setProperty('--bs-title-shift',`-${overflow}px`);box.style.setProperty('--bs-title-duration',`${(Math.max(7,overflow/26/.8)/2)}s`);}
}
function applyVolume(){audio.volume=mobileQuery.matches?1:s.volume;if(player)player.dataset.mobile=String(mobileQuery.matches);}
function paint(){
 player.dataset.theme=dialog.dataset.theme=s.theme;const entry=document.getElementById('bs-extension-settings');if(entry)entry.dataset.theme=s.theme;player.dataset.size=s.size;
 const expanded=!$('.bs-drawer').hidden;const drawer=$('[data-action="drawer"]');drawer.textContent=expanded?'▲':'▼';drawer.setAttribute('aria-expanded',String(expanded));drawer.title=drawer.ariaLabel=expanded?'곡 목록 접기':'곡 목록 펼치기';
 const t=track(current);const title=$('.bs-title-text');if(title.textContent!==t.title){title.textContent=t.title;$('.bs-title').classList.remove('is-scrolling');}$('.bs-title').title=t.title;requestAnimationFrame(updateTitleScroll);$('.bs-opus').textContent=t.opus;$('.bs-performer').textContent=t.performer;
 $('.bs-cover').src=new URL(t.cover,BASE);$('.bs-cover').alt=t.label+' 음반 표지';
 const play=$('[data-action="play"]');play.textContent=audio.paused?'▶':'Ⅱ';play.title=play.ariaLabel=audio.paused?'재생':'일시정지';
 for(const [a,v,label] of [['random',s.random,'랜덤재생'],['repeat',s.repeatOne,'한 곡 반복'],['auto',s.auto,'AI 자동 선곡']]){$(`[data-action="${a}"]`).setAttribute('aria-pressed',String(v));$(`[data-action="${a}"]`).title=label+': '+(v?'켜짐':'꺼짐');}
 $('[data-action="random"]').textContent=s.random?'⤨':'→';$('[data-action="repeat"]').textContent=s.repeatOne?'↻₁':'↻';
 $('[data-action="shrink"]').disabled=s.size===2;$('[data-action="expand"]').disabled=s.size===0;
 $('[data-action="home"]').disabled=!ids().includes('waltz');
 $('.bs-list').querySelectorAll('[data-id]').forEach(e=>{e.classList.toggle('is-current',e.dataset.id===current);});
 for(const a of ['play','next','previous'])$(`[data-action="${a}"]`).disabled=!ids().length;
}
function progress(){const d=audio.duration;$('.bs-elapsed').textContent=time(audio.currentTime);$('.bs-duration').textContent=time(d);$('.bs-seek').disabled=!Number.isFinite(d);$('.bs-seek').value=Number.isFinite(d)&&d>0?audio.currentTime/d*1000:0;}
async function play(){if(!active()||!ids().length)return;const n=++serial;try{await audio.play();if(n===serial&&!active())audio.pause();}catch{if(n===serial)status('▶ を 눌러 재생을 시작해 주세요.'.replace('を',''))}paint();}
function select(id,shouldPlay=true){if(!active()||!ids().includes(id))return;if(current!==id||!audio.src){current=id;serial++;audio.pause();audio.src=new URL(track(id).src,BASE);audio.load();progress();}paint();if(shouldPlay&&!pausedByUser)void play();}
function navigate(step){cancel();silenceRequested=false;waitingSilence=false;select(nextTrack(ids(),current,step,s.random),!pausedByUser);}
function list(){const root=$('.bs-list');root.replaceChildren();for(const id of ids()){const t=track(id),row=document.createElement('li');row.dataset.id=id;const h=document.createElement('button');h.type='button';h.className='bs-reorder';h.textContent='⠿';h.ariaLabel=t.label+' 순서 이동 (위·아래 방향키)';h.title='드래그 또는 위·아래 방향키로 순서 변경';const b=document.createElement('button');b.type='button';b.className='bs-track';b.textContent=t.title.split(' No.')[0]+' · '+t.opus;b.onclick=()=>{cancel();silenceRequested=false;waitingSilence=false;pausedByUser=false;select(id);};row.append(h,b);root.append(row);
 const move=target=>{if(!target||target===id)return;const a=s.order.indexOf(id),z=s.order.indexOf(target);s.order.splice(a,1);s.order.splice(z,0,id);save();};
 h.onkeydown=e=>{if(!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const a=ids(),i=a.indexOf(id),j=i+(e.key==='ArrowUp'?-1:1);if(a[j]){move(a[j]);list();$(`[data-id="${id}"] .bs-reorder`).focus();}};
 let dropTarget=null;
 h.onpointerdown=e=>{e.preventDefault();dropTarget=null;h.setPointerCapture(e.pointerId);row.classList.add('is-dragging');};
 h.onpointermove=e=>{if(!h.hasPointerCapture(e.pointerId))return;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.bs-list li');root.querySelectorAll('.is-drop').forEach(e=>e.classList.remove('is-drop'));if(target&&target!==row){dropTarget=target.dataset.id;target.classList.add('is-drop');}};
 h.onpointerup=e=>{if(h.hasPointerCapture(e.pointerId))h.releasePointerCapture(e.pointerId);move(dropTarget);list();};h.onpointercancel=()=>list();
 }paint();}
function constrain(){const r=player.getBoundingClientRect();const x=Math.max(6,Math.min(r.x,innerWidth-r.width-6)),y=Math.max(6,Math.min(r.y,innerHeight-r.height-6));player.style.left=x+'px';player.style.top=y+'px';s.position={x,y};}
function synchronize(){if(!ready)return;cancel();const c=ctx(),key=String(c.characters?.[c.characterId]?.avatar)+'|'+String(c.chatId);player.hidden=!active();if(!active()){serial++;audio.pause();return;}if(chatKey!==key){chatKey=key;silenceRequested=false;waitingSilence=false;pausedByUser=false;lastText='';lastMood='';audio.pause();audio.removeAttribute('src');current=ids().includes('waltz')?'waltz':ids()[0]||'waltz';select(current,s.autoplay);}paint();requestAnimationFrame(constrain);}
function setAuto(value){cancel();silenceRequested=false;waitingSilence=false;s.auto=value;lastText='';save();q('#bs-auto').checked=value;if(!ids().length){serial++;audio.pause();}else if(!ids().includes(current)){select(ids()[0],!audio.paused&&!pausedByUser);}list();status('');}
function schedule(){clearTimeout(timer);if(!active()||!s.auto)return;cancel();if(generating)return;timer=setTimeout(choose,1200);}
async function choose(){
 if(!active()||!s.auto||generating||!ids().length)return;
 const recent=recentMessages(ctx().chat);const output=JSON.stringify(recent);
 if(!recent.length||output===lastText)return;cancel();const ticket=epoch;controller=new AbortController();const requestController=controller;const signal=requestController.signal;const timeout=setTimeout(()=>requestController.abort(),25000);status('채팅 분위기를 살피는 중…');
 try{
 const available=ids();
 const c=ctx(),saved=c.chatCompletionSettings;
 if(typeof c.getRequestHeaders!=='function')throw new Error('SillyTavern 확장 API를 사용할 수 없습니다. 업데이트를 확인해 주세요');
 if(s.provider==='vertexai'&&!saved)throw new Error('SillyTavern Vertex AI 연결 설정을 확인해 주세요');
 const messages=[{role:'system',content:SELECTION_PROTOCOL},{role:'user',content:s.selectionPrompt.trim()||DEFAULT_SELECTION_PROMPT},
 {role:'user',content:JSON.stringify({runtimeData:{allowed:available.map(id=>({id,mood:s.moods[id]})),current,manuallyPaused:pausedByUser,previousMood:lastMood,silenceRequested,waitingSilence,recentMessages:recent}})}];
 const request={chat_completion_source:s.provider,model:s.model,stream:false,max_tokens:2048,temperature:.1,reasoning_effort:'low',include_reasoning:false,use_sysprompt:true,responseMimeType:'application/json',messages};
 if(s.provider==='vertexai')Object.assign(request,{vertexai_auth_mode:saved.vertexai_auth_mode||'express',vertexai_region:saved.vertexai_region||'us-central1',vertexai_express_project_id:saved.vertexai_express_project_id||''});
 const res=await fetch('/api/backends/chat-completions/generate',{method:'POST',signal,credentials:'same-origin',headers:c.getRequestHeaders(),body:JSON.stringify(request)});
 if(!res.ok)throw new Error('선택한 Gemini 연결의 등록 정보 또는 모델 사용 권한을 확인해 주세요 ('+res.status+')');
 const body=await res.json();if(body.error)throw new Error('선택한 Gemini 연결에서 선곡에 실패했습니다. SillyTavern 연결 설정을 확인해 주세요');
 const text=body.choices?.[0]?.message?.content||'';const choice=parseChoice(text,available);
 if(ticket!==epoch||signal.aborted||!s.auto||!active())return;if(!choice)throw new Error('선곡 응답 형식이 올바르지 않습니다');lastText=output;
 if(choice.silence===true){
  silenceRequested=true;lastMood=String(choice.mood||'').slice(0,200);
  waitingSilence=audio.paused||audio.ended;
  status(waitingSilence?'음악 없이 장면을 이어갑니다':'현재 곡이 끝나면 음악을 쉽니다');return;
 }
 const wasManuallyPaused=pausedByUser;
 const resuming=silenceRequested||waitingSilence||wasManuallyPaused;
 silenceRequested=false;waitingSilence=false;
 if(!choice.changed&&!resuming){if(!lastMood)lastMood=String(choice.mood||'').slice(0,200);status('분위기 유지 · 현재 곡을 계속 재생합니다');return;}
 lastMood=String(choice.mood||'').slice(0,200);
 pausedByUser=false;
 if(choice.id===current&&!audio.ended&&!audio.paused){status('현재 곡이 어울립니다 · 이어서 재생');return;}
 if(choice.id===current&&(audio.ended||wasManuallyPaused))audio.currentTime=0;
 select(choice.id,true);status(track(choice.id).label+' · '+lastMood);
 }catch(e){if(ticket===epoch&&s.auto&&active())status(signal.aborted?'선곡 요청 시간 초과 · 현재 곡 유지':e.message+' · 현재 곡 유지');}
 finally{clearTimeout(timeout);if(ticket===epoch)controller=null;}
}
function openSettings(){q('#bs-selection-prompt').value=s.selectionPrompt;q('#bs-enabled').checked=s.enabled;q('#bs-theme').value=s.theme;q('#bs-model').value=s.model;q('#bs-provider').value=s.provider;q('#bs-auto').checked=s.auto;q('#bs-autoplay').checked=s.autoplay;q('#bs-binding').textContent=s.avatar||'연결된 캐릭터 없음';dialog.showModal();}
async function init(){if(ready)return;tracks=await(await fetch(new URL('catalog.json',BASE))).json();const old=ctx().extensionSettings.bielawski_salon_player_v1;s=normalize(ctx().extensionSettings[KEY]||{avatar:old?.avatar,theme:old?.theme,volume:old?.volume});ctx().extensionSettings[KEY]=s;
 audio=new Audio();audio.preload='metadata';applyVolume();
 player=document.createElement('aside');player.id='bs-player';player.hidden=true;player.setAttribute('aria-label','비엘라프스키 음악 플레이어');
 player.innerHTML=`<header class="bs-top"><button class="bs-handle" title="드래그로 이동 · 방향키 지원" aria-label="플레이어 이동">⠿</button><span class="bs-brand">BIELAWSKI</span>${button('settings','⚙','설정')}${button('shrink','−','한 단계 축소')}${button('expand','+','한 단계 확대')}</header><section class="bs-art"><img class="bs-cover"><div class="bs-info"><h3 class="bs-title"><span class="bs-title-text"></span></h3><p class="bs-opus"></p><p class="bs-performer"></p></div></section><section class="bs-timeline"><input class="bs-seek" type="range" min="0" max="1000" value="0" aria-label="재생 위치"><div><time class="bs-elapsed">0:00</time><time class="bs-duration">0:00</time></div></section><div class="bs-controls">${button('previous','&lt;','이전 곡')}${button('play','▶','재생','bs-play')}${button('next','&gt;','다음 곡')}</div><div class="bs-options">${button('random','→','순차·랜덤 전환')}${button('repeat','↻','전체·한 곡 반복 전환')}${button('home','⌂','기본 왈츠 듣기')}${button('auto','AI','AI 자동 선곡 전환')}<input class="bs-volume" type="range" min="0" max="1" step=".01" aria-label="음량">${button('drawer','▼','곡 목록 펼치기')}</div><p class="bs-status" role="status"></p><section class="bs-drawer" hidden><ol class="bs-list"></ol></section>`;
 dialog=document.createElement('dialog');dialog.id='bs-settings';dialog.innerHTML=`<header><h2>Franciszek music player</h2>${button('close','×','닫기')}</header><p class="bs-note">프란치셰크의 네 곡만 재생합니다.</p><fieldset><legend>플레이어</legend><label><input type="checkbox" id="bs-enabled"> 플레이어 활성화</label><p class="bs-note">끄면 플레이어를 숨기고 음악과 자동 선곡 요청을 중단합니다. 이 설정에서 다시 켤 수 있습니다.</p></fieldset><fieldset><legend>캐릭터 연결</legend><p id="bs-binding"></p>${button('bind','현재 캐릭터에 연결','현재 캐릭터에 연결')}<label><input type="checkbox" id="bs-autoplay"> 채팅을 열면 기본 곡 자동재생</label></fieldset><fieldset><legend>화면</legend><label>테마 <select id="bs-theme"><option value="light">화이트 · 리넨</option><option value="dark">다크 · 저녁</option></select></label></fieldset><fieldset><legend>AI 자동 선곡</legend><label><input type="checkbox" id="bs-auto"> 채팅 분위기에 맞춰 자동 선곡</label><label>선곡 모델 <select id="bs-model"><option value="gemini-3.7-flash">Gemini Flash 3.7</option><option value="gemini-3.8-flash">Gemini Flash 3.8</option></select></label><label>등록된 Gemini 연결 <select id="bs-provider"><option value="makersuite">Google AI Studio</option><option value="vertexai">Google Vertex AI</option></select></label></fieldset><fieldset><legend>선곡 프롬프트</legend><label for="bs-selection-prompt">AI에게 전달할 선곡 지시</label><textarea id="bs-selection-prompt" rows="9" spellcheck="false" placeholder="Prefer preludes for bright, cheerful scenes. Choose silence when music is unnecessary."></textarea>${button('prompt-reset','기본 선곡 프롬프트로 초기화','기본 선곡 프롬프트로 초기화')}</fieldset><fieldset><legend>재생할 곡 · 분위기</legend><div class="bs-moods"></div>${button('reset','분위기 기본값으로 초기화','분위기 기본값으로 초기화')}<p class="bs-note">체크박스는 일반 재생에만 적용됩니다. 자동 선곡은 체크 여부와 관계없이 내장된 네 곡 전체에서 선택합니다.</p></fieldset><p class="bs-feedback" role="status"></p>`;
 document.body.append(player,dialog);applyVolume();mobileQuery.addEventListener('change',applyVolume);
 const titleObserver=new ResizeObserver(updateTitleScroll);titleObserver.observe($('.bs-title'));document.fonts.ready.then(updateTitleScroll);
 for(const t of tracks){const row=document.createElement('div');row.className='bs-mood';const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.dataset.track=t.id;check.checked=!s.excluded.includes(t.id);label.append(check,document.createTextNode(t.displayTitle));const mood=document.createElement('input');mood.type='text';mood.maxLength=300;mood.value=s.moods[t.id];mood.dataset.mood=t.id;mood.ariaLabel=t.label+' 분위기';row.append(label,mood);q('.bs-moods').append(row);
 check.onchange=()=>{cancel();s.excluded=tracks.filter(t=>!q(`[data-track="${t.id}"]`).checked).map(t=>t.id);lastText='';if(!ids().length){serial++;audio.pause();status('재생할 곡을 하나 이상 선택해 주세요');}else if(!ids().includes(current))select(ids()[0],!pausedByUser&&!waitingSilence);list();save();};mood.onchange=()=>{cancel();s.moods[t.id]=mood.value.trim()||MOODS[t.id];mood.value=s.moods[t.id];lastText='';save();};}
 player.onclick=e=>{const a=e.target.closest('[data-action]')?.dataset.action;if(!a)return;if(a==='play'){cancel();if(audio.paused){silenceRequested=false;waitingSilence=false;pausedByUser=false;void play();}else{pausedByUser=true;serial++;audio.pause();}}if(a==='next')navigate(1);if(a==='previous')navigate(-1);if(a==='home'){cancel();silenceRequested=false;waitingSilence=false;pausedByUser=false;select('waltz');}if(a==='settings')openSettings();if(a==='auto')setAuto(!s.auto);if(a==='random'){s.random=!s.random;save();}if(a==='repeat'){s.repeatOne=!s.repeatOne;save();}if(a==='shrink'||a==='expand'){s.size=Math.max(0,Math.min(2,s.size+(a==='shrink'?1:-1)));if(s.size){$('.bs-drawer').hidden=true;$('[data-action="drawer"]').setAttribute('aria-expanded','false');}save();}if(a==='drawer'){$('.bs-drawer').hidden=!$('.bs-drawer').hidden;$('[data-action="drawer"]').setAttribute('aria-expanded',String(!$('.bs-drawer').hidden));}paint();requestAnimationFrame(constrain);};
 dialog.onclick=e=>{const a=e.target.closest('[data-action]')?.dataset.action;if(a==='close')dialog.close();if(a==='bind'){const c=ctx();if(c.groupId||!c.characters?.[c.characterId]){status('개인 캐릭터 채팅을 먼저 열어 주세요');return;}s.avatar=c.characters[c.characterId].avatar;save();q('#bs-binding').textContent=s.avatar;synchronize();}if(a==='prompt-reset'){cancel();s.selectionPrompt=DEFAULT_SELECTION_PROMPT;q('#bs-selection-prompt').value=s.selectionPrompt;lastText='';save();}if(a==='reset'){cancel();s.moods={...MOODS};lastText='';for(const t of tracks)q(`[data-mood="${t.id}"]`).value=s.moods[t.id];save();}};
 q('#bs-enabled').onchange=e=>{s.enabled=e.target.checked;save();synchronize();status(s.enabled?'플레이어 활성화':'플레이어 비활성화');};
 q('#bs-selection-prompt').oninput=e=>{cancel();s.selectionPrompt=e.target.value;lastText='';save();};
 q('#bs-auto').onchange=e=>setAuto(e.target.checked);q('#bs-theme').onchange=e=>{s.theme=e.target.value;save();paint();};q('#bs-model').onchange=e=>{cancel();s.model=e.target.value;lastText='';save();};q('#bs-provider').onchange=e=>{cancel();s.provider=e.target.value;lastText='';save();};q('#bs-autoplay').onchange=e=>{s.autoplay=e.target.checked;save();};
 $('.bs-volume').value=s.volume;$('.bs-volume').oninput=e=>{if(mobileQuery.matches){applyVolume();return;}s.volume=Number(e.target.value);applyVolume();save();};$('.bs-seek').oninput=e=>{if(Number.isFinite(audio.duration))audio.currentTime=audio.duration*Number(e.target.value)/1000;progress();};
 for(const event of ['timeupdate','durationchange','loadedmetadata'])audio.addEventListener(event,progress);for(const event of ['play','pause'])audio.addEventListener(event,paint);
 audio.onended=()=>{if(!active()||pausedByUser||!ids().length)return;if(s.auto){if(silenceRequested){waitingSilence=true;status('음악 없이 장면을 이어갑니다');paint();return;}audio.currentTime=0;void play();return;}if(s.repeatOne){audio.currentTime=0;void play();}else navigate(1);};audio.onerror=()=>status('음악 파일을 읽지 못했습니다. media 폴더를 확인해 주세요.');
 const h=$('.bs-handle');let drag;h.onpointerdown=e=>{const r=player.getBoundingClientRect();drag={x:e.clientX-r.x,y:e.clientY-r.y};h.setPointerCapture(e.pointerId);};h.onpointermove=e=>{if(!drag)return;player.style.left=e.clientX-drag.x+'px';player.style.top=e.clientY-drag.y+'px';constrain();};h.onpointerup=h.onpointercancel=()=>{drag=null;save();};h.onkeydown=e=>{const delta={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]}[e.key];if(!delta)return;e.preventDefault();const r=player.getBoundingClientRect();player.style.left=r.x+delta[0]+'px';player.style.top=r.y+delta[1]+'px';constrain();save();};
 player.style.left=(s.position?.x??Math.max(6,innerWidth-350))+'px';player.style.top=(s.position?.y??90)+'px';window.addEventListener('resize',constrain);
 const entry=document.createElement('div');entry.id='bs-extension-settings';entry.innerHTML=button('settings','Franciszek music player','음악 설정');entry.onclick=openSettings;(document.querySelector('#extensions_settings2')||document.querySelector('#extensions_settings')||document.body).append(entry);
 const c=ctx(),ev=c.eventTypes||c.event_types;const on=(name,fn)=>{if(ev[name])c.eventSource.on(ev[name],fn);};on('CHAT_CHANGED',synchronize);on('CHARACTER_MESSAGE_RENDERED',schedule);on('USER_MESSAGE_RENDERED',schedule);on('GENERATION_STARTED',()=>{generating=true;cancel();});on('GENERATION_ENDED',()=>{generating=false;schedule();});on('GENERATION_STOPPED',()=>{generating=false;cancel();});
 ready=true;list();synchronize();save();
}
export function onDisable(){running=false;cancel();serial++;audio?.pause();if(player)player.hidden=true;dialog?.close();}
export function onEnable(){running=true;if(ready)synchronize();}
const c=ctx(),ev=c.eventTypes||c.event_types;c.eventSource.on(ev.APP_READY,()=>init().catch(e=>console.error('Bielawski player initialization failed',e)));
