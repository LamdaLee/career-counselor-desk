(() => {
  'use strict';
  let key = 'desk-game-conversation-v1';
  let draftKey = 'desk-game-draft-v1';
  const baseLabels = {interest:'흥미', aptitude:'적성', value:'가치'};
  let labels = {...baseLabels};
  const $ = (s) => document.querySelector(s);
  const storage = {
    get(k) {try {return localStorage.getItem(k);} catch {return null;}},
    set(k,v) {try {localStorage.setItem(k,v);return true;} catch {$('#save-status').textContent='● 저장 공간을 확인해 주세요';return false;}}
  };
  const cases=window.DeskCases || [];
  let active=cases.find(c=>c.id===storage.get('desk-active-case-v1')) || null;
  let session;
  function loadSession() {
    key=active?'desk-game-conversation-'+active.id+'-v1':'desk-game-conversation-v1';
    draftKey=active?'desk-game-draft-'+active.id+'-v1':'desk-game-draft-v1';
    labels=active?Object.fromEntries(active.concepts.map(c=>[c.id,c.label])):{...baseLabels};
    session={messages:[],found:[]};
    try {
      const saved=JSON.parse(storage.get(key));
      if(saved && Array.isArray(saved.messages) && Array.isArray(saved.found)) {
        session.messages=saved.messages.filter(m=>m && ['client','counselor'].includes(m.role) && typeof m.text==='string');
        session.found=saved.found.filter(c=>Object.hasOwn(labels,c));
      }
    } catch {}
  }
  loadSession();
  let first = '가족은 안정적인 사무직이 좋대요. 그런데 저는 앉아서 하는 일이 숨이 막혀요. 손으로 뭔가를 만들거나 고칠 때가 더 나은 것 같아요.';
  const baseFirst=first;
  first=active?.first || baseFirst;
  const sheet = $('#sheet');
  const desk = $('#desk');
  const scroll = $('#sheet-scroll');
  const oldOpen = window.openDesk;
  const sections = [...scroll.children].filter(el => el.matches('article,section,hr'));
  const drawer = $('#drawer');
  const why = $('#why');
  const shelf = $('#shelf');
  const titles = {cases:'의뢰서 보관함 · 내담자 고르기',scene:'의뢰서 01 · 민정 씨',say:'상담 메모 · 말을 건네는 자리',pace:'오늘 머무는 시간',drawer:'서랍 01 · 이론 뭉치',theory:'직업심리 · 흥미, 적성, 가치',library:'이론 자료집 · 공식 자료와 연결',about:'만든 사람 · 자료 출처',shelf:'서랍 02 · 남겨 둔 말'};
  let returnFocus = null;
  function open(name) {
    if (!titles[name]) name='scene';
    if (!sheet.classList.contains('open')) returnFocus=document.activeElement;
    sections.forEach(el => {el.hidden = !((name==='theory' && el===(active?$('#case-theory'):why)) || (name!=='theory' && el.id===name));});
    $('#conversation').hidden = name!=='say';
    $('#sheet-label').textContent=titles[name];
    sheet.dataset.view=name;
    oldOpen(name==='theory'?'scene':name);
    desk.inert=true;
    requestAnimationFrame(() => {scroll.scrollTop=0;$('#sheet-close').focus();});
  }
  window.openDesk=open;
  document.addEventListener('click', e => {
    const obj=e.target.closest('[data-open]');
    if (!obj) return;
    e.preventDefault();e.stopImmediatePropagation();open(obj.dataset.open);
  }, true);
  function closed() {
    desk.inert=false;
    if (returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
  }
  $('#sheet-close').addEventListener('click',closed);
  sheet.addEventListener('click',e => {if(e.target===sheet) $('#sheet-close').click();});
  document.addEventListener('keydown',e => {
    if(!sheet.classList.contains('open')) return;
    if(e.key==='Escape') {$('#sheet-close').click(); return;}
    if(e.key!=='Tab') return;
    const focusable=[...sheet.querySelectorAll('button,a[href],textarea,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length>0 && el.getAttribute('tabindex')!=='-1');
    const firstEl=focusable[0],lastEl=focusable.at(-1);
    if(e.shiftKey && document.activeElement===firstEl){e.preventDefault();lastEl?.focus();}
    else if(!e.shiftKey && document.activeElement===lastEl){e.preventDefault();firstEl?.focus();}
  });
  function bubble(role,text) {
    const el=document.createElement('div');el.className='dialogue-bubble '+role;
    const who=document.createElement('small');who.textContent=role==='client'?(active?active.name+' 씨':'민정 씨'):'나 · 상담사';
    const content=document.createElement('span');content.textContent=text;
    el.append(who,content);$('#dialogue').append(el);
  }
  function render() {
    $('#dialogue').replaceChildren();bubble('client',first);
    session.messages.forEach(m=>bubble(m.role,m.text));
    $('#concept-chips').replaceChildren();
    Object.entries(labels).forEach(([id,label]) => {const span=document.createElement('span');const found=session.found.includes(id);span.className=found?'found':'';span.textContent=(found?'✓ ':'○ ')+label;$('#concept-chips').append(span);});
  }
  const responses = {
    interest:{reply:'작은 가구를 조립하거나 고장 난 물건을 고칠 때는 시간 가는 줄 모르겠어요. 계속 해 보고 싶다는 생각도 들고요. 다만 좋아하는 만큼 잘하는지는 아직 모르겠어요.',note:'흥미의 조각을 발견했어요. 하고 싶은 것과 잘할 가능성은 따로 살펴볼 수 있어요.',next:'이번에는 실제로 해냈던 경험을 물어보면 어떨까요?'},
    aptitude:{reply:'지난번에는 집의 흔들리는 의자를 직접 고쳤어요. 친구가 부탁한 선반도 조립했고요. 하지만 일을 맡길 만큼 잘하는지는 더 확인해 보고 싶어요.',note:'적성을 살펴볼 단서를 찾았어요. 구체적 경험은 단서이며, 이 한 장면만으로 능력을 확정하지는 않아요.',next:'그 일을 좋아하는 이유나 일에서 중요한 것도 물어볼 수 있어요.'},
    value:{reply:'가족은 안정적인 월급을 중요하게 생각해요. 저는 제 손으로 만든 결과를 눈으로 보는 게 중요해요. 물론 생활할 수 있는 수입도 놓치고 싶지는 않아요.',note:'가치의 조각을 발견했어요. 가족이 중요하게 여기는 것과 민정 씨 자신의 가치를 나누어 들었어요.',next:'흥미와 경험을 함께 확인하면 민정 씨의 이야기가 더 입체적으로 보일 거예요.'}
  };
  function respond(text) {
    if (!text) return;
    let concept=null, reply, note;
    const remaining=Object.keys(labels).filter(k=>!session.found.includes(k));
    // Explicit cues only: this is a scene-based practice, not an AI assessment.
    if(active) {
      if(/무조건|해야\s*해|하셔야|위법.*확정|확실.*불법/.test(text)){reply=active.blocked;note='결론을 미리 정하기보다 내담자의 상황과 확인할 근거를 더 들어 보세요.';}
      else {
        const exact=active.concepts.find(c=>c.prompt===text);
        const matches=active.concepts.filter(c=>new RegExp(c.cue).test(text));
        const chosen=exact || matches.find(c=>remaining.includes(c.id)) || matches[0];
        if(chosen){concept=chosen.id;reply=chosen.reply;note=chosen.note;}
        else{reply=active.fallback;note='준비된 반응 범위 밖의 표현이에요. 아래 예시 질문을 빌리거나 탐색할 내용을 구체적으로 적어 보세요.';}
      }
    } else if(/현실형|기술직.*추천|추천.*기술직|무조건|해야\s*해|하셔야/.test(text)) {
      reply='제가 어떤 유형인지보다, 왜 이 일이 답답하고 어떤 일이 나은지부터 이야기해 보고 싶어요.';
      note='유형이나 직업을 먼저 정하기 전에, 민정 씨의 구체적인 경험을 더 들어 보세요.';
    } else {
      const cues={value:/중요|가치|안정|보수|수입|가족|놓치|의미/,aptitude:/잘하|잘\s*해|잘할|해냈|해낸|경험|능력|적성|성공|해\s*본|고쳐|고친/,interest:/좋아|즐겁|즐거|흥미|관심|하고\s*싶|해\s*보고\s*싶|만들|손|끌리|시간\s*가는/};
      const matches=Object.keys(cues).filter(k=>cues[k].test(text));
      concept=matches.find(k=>remaining.includes(k)) || matches[0] || null;
      if(concept){const r=responses[concept];reply=r.reply;note=r.note+' '+r.next;}
      else if(/힘든|답답|숨|앉아|사무|싫|어려/.test(text)) {
        reply='종일 같은 자리에 앉아서 화면만 보는 게 답답해요. 손을 움직이고 직접 뭔가 해 볼 수 있으면 좀 더 편할 것 같아요.';
        note='불편한 장면을 구체적으로 들었어요. 무엇을 하고 싶은지, 무엇을 해냈는지, 무엇이 중요한지도 천천히 물어보세요.';
      } else if(/이해|그렇|힘드셨|마음|느끼|공감/.test(text)) {
        reply='제 이야기를 들어 주셔서 고마워요. 가족의 기대와 제가 원하는 일 사이에서 고민이 많아요.';
        note='이야기를 이어갈 자리를 만들었어요. 이제 구체적인 경험을 묻는 질문으로 이어가 볼 수 있어요.';
      } else {
        reply='어떤 이야기를 더 하면 좋을까요? 제가 하고 싶은 일인지, 해 봤던 경험인지, 일에서 중요하게 여기는 것인지 물어봐 주시면 이야기해 볼게요.';
        note='이 연습은 미리 준비된 장면으로 반응해요. 아래 질문 시작을 빌리거나, 탐색하고 싶은 내용을 조금 더 구체적으로 적어 보세요.';
      }
    }
    session.messages.push({role:'counselor',text},{role:'client',text:reply});
    if(concept && !session.found.includes(concept)) session.found.push(concept);
    const persisted=storage.set(key,JSON.stringify(session));storage.set(draftKey,'');render();
    const feedback=$('#concept-feedback');feedback.hidden=false;feedback.replaceChildren();
    const title=document.createElement('strong');title.textContent=concept?labels[concept]+' · 상담과 이론 연결':'다음 질문의 실마리';
    const content=document.createElement('div');content.textContent=note;
    const link=document.createElement('button');link.className='feedback-link';link.textContent='이론 뭉치 펼치기 →';link.dataset.open='theory';
    feedback.append(title,content,link);
    const nextPrompt=(active?active.concepts:basePrompts.map((p,i)=>({...p,id:Object.keys(baseLabels)[i]}))).find(c=>!session.found.includes(c.id));
    if(nextPrompt){const next=document.createElement('button');next.className='primary-action';next.textContent='다음 조각 · '+nextPrompt.label+' 질문 써 보기 →';next.addEventListener('click',()=>{textarea.value=nextPrompt.prompt;textarea.dispatchEvent(new Event('input'));textarea.focus();});feedback.append(next);}

    if(session.found.length===Object.keys(labels).length){const complete=document.createElement('p');complete.textContent='✧ '+Object.values(labels).join('·')+', 세 조각을 연결했어요. 여기서 쉬어도 되고 이야기를 계속해도 돼요.';feedback.append(complete);}
    if(!persisted){const error=document.createElement('p');error.textContent='현재 브라우저에 기록을 저장하지 못했어요. 닫기 전에 필요한 문장을 따로 복사해 주세요.';feedback.append(error);}
    requestAnimationFrame(()=>feedback.scrollIntoView({block:'nearest',behavior:'auto'}));
  }
  document.addEventListener('thread-save',e=>respond(e.detail.text.trim()));
  const textarea=$('.u028-ta');
  textarea.value=storage.get(draftKey)||'';textarea.dispatchEvent(new Event('input'));
  textarea.addEventListener('input',()=>storage.set(draftKey,textarea.value));

  const back=document.createElement('button');back.className='text-action';back.dataset.open='say';back.textContent='이론을 접고 상담 이어가기 →';why.append(back);
  let messageTimer;
  $('#cup').addEventListener('click',()=>{const msg=$('#desk-message');msg.textContent='잠깐 쉬어도 괜찮아요. 돌아오면 이야기는 그대로 있어요.';msg.hidden=false;clearTimeout(messageTimer);messageTimer=setTimeout(()=>msg.hidden=true,6500);});
  const mood=$('#mood-switch');
  function setLighting(night) {
    document.body.classList.toggle('lamplit',night);
    mood.setAttribute('aria-pressed',String(night));
    $('#when').textContent=night?'밤':'낮';
    $('#mood-icon').textContent=night?'☾':'☀';
    $('#mood-action').textContent=night?'낮으로 바꾸기':'밤으로 바꾸기';
    mood.setAttribute('aria-label',(night?'밤':'낮')+' · '+(night?'낮으로 바꾸기':'밤으로 바꾸기'));
  }
  setLighting(storage.get('desk-game-lamp')==='on');
  mood.addEventListener('click',()=>{
    const night=!document.body.classList.contains('lamplit');
    setLighting(night);
    storage.set('desk-game-lamp',night?'on':'off');
  });
  const defaultScene=[...$('#scene').childNodes];
  const defaultBook=$('.theory-book b').innerHTML;
  function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
  const basePrompts=[
    {label:'흥미',prompt:'어떤 일을 할 때 즐겁거나 계속 해 보고 싶으세요?'},
    {label:'경험',prompt:'직접 만들거나 고쳐서 잘 해냈던 경험이 있나요?'},
    {label:'가치',prompt:'가족의 의견과 별개로, 일에서 가장 중요하게 여기는 것은 무엇인가요?'}
  ];
  function prepareCase() {
    const name=active?.name || '민정',subject=active?.subject || '직업심리';
    const title=active?.title || '사무실은 싫어요',tag=active?.tag || '진로 탐색';
    const number=active?cases.indexOf(active)+2:1;
    first=active?.first || baseFirst;
    window.DeskActiveScene=name+' 씨 · '+title;
    titles.scene='의뢰서 0'+number+' · '+name+' 씨';titles.theory=subject+' · 상담과 이론 연결';
    $('#active-case-label').textContent='오늘의 내담자 · '+name+' 씨';
    $('#scene-note .folder-tab').textContent='의뢰서 0'+number;
    $('#scene-note .small-label').textContent=subject+' · 오늘의 내담자';
    $('#scene-note .file-title').textContent=title;
    const meta=$('#scene-note .client-meta');meta.replaceChildren(node('span','client-avatar',name[0]));
    const person=node('span','',name+' 씨');person.append(node('small','',(active?.age || 32)+'세 · '+tag));meta.append(person);
    $('#scene-note .file-quote').textContent='“'+(active?.quote || '손으로 뭔가를 만들 때가 훨씬 나은 것 같아요.')+'”';
    $('#conversation .client-avatar').textContent=name[0];$('#conversation .conversation-head b').textContent=name+' 씨와 이야기하기';$('.conversation-tag').textContent=tag;
    const scene=$('#scene');
    if(!active){scene.replaceChildren(...defaultScene);$('.theory-book b').innerHTML=defaultBook;}
    else {
      scene.replaceChildren(node('p','eyebrow',subject+' · 새 창작 장면'),node('h2','',title),node('p','',active.scene),node('p','quiet',active.nudge));
      const talk=node('button','primary-action',name+' 씨에게 말 건네기 →');talk.dataset.open='say';
      const theory=node('button','text-action','관련 이론 먼저 펼치기');theory.dataset.open='theory';scene.append(talk,theory);
      $('.theory-book b').textContent=Object.values(labels).join(' · ');
    }
    const prompts=active?active.concepts:basePrompts;
    window.DeskActivePrompts=prompts.map(c=>c.prompt);
    const starters=$('.question-starters');starters.replaceChildren();
    prompts.forEach(c=>{const btn=node('button','',c.label+' 살펴보기');btn.dataset.prompt=c.prompt;btn.addEventListener('click',()=>{textarea.value=c.prompt;textarea.dispatchEvent(new Event('input'));textarea.focus();});starters.append(btn);});
    const panel=$('#case-theory');panel.replaceChildren();
    if(active){
      panel.append(node('h2','',subject+' · 이번 상담의 이론'),node('p','hint','원문 교재의 문항·해설을 옮기지 않은 설명이에요. 공식 자료로 개념을 확인하고, 상담 반응은 새로 작성했습니다.'));
      active.cards.forEach(id=>{const card=window.DeskLibrary.cards.find(c=>c.id===id);const block=node('div','case-theory-card');block.append(node('h3','',card.title));card.body.forEach(p=>block.append(node('p','',p)));
        card.sources.forEach(id=>{const source=window.DeskLibrary.sources[id];const link=node('a','source-link',source.org+' · '+source.title);link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';block.append(link);});panel.append(block);});
      const all=node('button','primary-action','이 과목의 자료집 펼치기 →');all.addEventListener('click',()=>window.openDeskLibrary(active.group));panel.append(all);
      const back=node('button','text-action','이론을 접고 상담 이어가기 →');back.dataset.open='say';panel.append(back,node('p','source-date','기준 확인 '+window.DeskLibrary.checked+' · 새 창작 사례 · 준비된 반응'));
    }
  }
  function switchCase(id) {
    storage.set(draftKey,textarea.value);
    active=cases.find(c=>c.id===id) || null;
    storage.set('desk-active-case-v1',active?.id || 'minjung');
    loadSession();prepareCase();render();
    textarea.value=storage.get(draftKey)||'';textarea.dispatchEvent(new Event('input'));
    $('#concept-feedback').hidden=true;$('#concept-feedback').replaceChildren();open('scene');
  }
  const choices=[{id:'minjung',name:'민정',subject:'직업심리',title:'사무실은 싫어요'},...cases];
  choices.forEach((c,i)=>{const button=node('button','case-choice');button.append(node('span','',`0${i+1} · ${c.subject}`),node('strong','',c.name+' 씨 · '+c.title),node('small','','의뢰서 펼치기 →'));button.addEventListener('click',()=>switchCase(c.id));$('#case-list').append(button);});
  prepareCase();
  render();
})();
