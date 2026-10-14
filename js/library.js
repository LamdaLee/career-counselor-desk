(() => {
  'use strict';
  const data=window.DeskLibrary;
  if(!data) return;
  const $=s=>document.querySelector(s);
  let group='all';
  const search=$('#library-search');
  function el(tag,cls,text) {const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;}
  function sourceLink(id) {
    const source=data.sources[id];
    const link=el('a','source-link',source.org+' · '+source.title);
    link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';
    return link;
  }
  const filters=$('#library-filters');
  [{id:'all',name:'전체'},...data.groups].forEach(item=>{
    const button=el('button','library-filter',item.name);button.type='button';button.dataset.group=item.id;
    button.setAttribute('aria-pressed',String(item.id==='all'));
    button.addEventListener('click',()=>{group=item.id;render();});filters.append(button);
  });
  function results() {
    const terms=search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return data.cards.filter(card=>{
      if(group!=='all' && card.group!==group)return false;
      const subject=data.groups.find(g=>g.id===card.group).name;
      const text=[subject,card.title,card.brief,...card.body,card.prompt,card.example].join(' ').toLocaleLowerCase();
      return terms.every(t=>text.includes(t));
    });
  }
  function render() {
    filters.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.group===group)));
    const cards=results();
    $('#library-count').textContent=`${cards.length}개의 이론 조각 · 한 장만 펼쳐도 돼요`;
    const list=$('#library-cards');list.replaceChildren();
    if(!cards.length) {list.append(el('p','library-empty','찾는 조각이 없어요. 검색어를 줄이거나 다른 과목을 골라 보세요.'));return;}
    cards.forEach(card=>{
      const detail=el('details','theory-card');detail.dataset.card=card.id;
      const summary=el('summary','theory-card-cover');
      const name=data.groups.find(g=>g.id===card.group).name;
      const title=el('span','theory-card-title');title.append(el('small','',name),el('strong','',card.title),el('span','',card.brief));
      const plus=el('span','card-toggle','＋');plus.setAttribute('aria-hidden','true');summary.append(title,plus);
      const body=el('div','theory-card-body');
      body.append(el('h3','','핵심 개념'));card.body.forEach(p=>body.append(el('p','',p)));
      const example=el('div','learning-example');example.append(el('h3','','상담 장면에 연결하면'),el('p','',card.example));body.append(example);
      const question=el('div','learning-question');question.append(el('h3','','연습용 예시 질문'),el('p','',card.prompt));
      const use=el('button','primary-action','이 질문을 상담 메모에 가져가기 →');use.type='button';
      use.addEventListener('click',()=>{
        const textarea=$('.u028-ta');
        if(textarea.value.trim()){
          question.querySelector('.draft-guard')?.remove();
          const guard=el('div','draft-guard');guard.append(el('p','','상담 메모에 쓰던 문장이 있어요. 이어 붙일까요?'));
          const append=el('button','text-action','작성 중 문장 뒤에 붙이기');append.type='button';append.addEventListener('click',()=>take(true));
          const cancel=el('button','text-action','지금은 그대로 두기');cancel.type='button';cancel.addEventListener('click',()=>guard.remove());guard.append(append,cancel);question.append(guard);
        } else take(false);
      });
      function take(append) {
        const textarea=$('.u028-ta');
        const value=(append?textarea.value.trim()+'\n':'')+card.prompt;
        if(Array.from(value).length>140){
          question.querySelector('.draft-guard')?.remove();const message=el('p','draft-guard','두 문장을 합치면 메모의 140자를 넘어요. 쓰던 문장을 정리한 뒤 가져올 수 있어요.');message.setAttribute('role','status');question.append(message);return;
        }
        textarea.value=value;textarea.dispatchEvent(new Event('input'));window.openDesk('say');
        requestAnimationFrame(()=>{textarea.scrollIntoView({block:'center',behavior:'auto'});textarea.focus({preventScroll:true});});
      }
      question.append(use);body.append(question);
      const sources=el('div','card-sources');sources.append(el('h3','','확인한 출처'));
      card.sources.forEach(id=>{const row=el('div','card-source-row');row.append(sourceLink(id),el('small','',data.sources[id].basis));sources.append(row);});
      sources.append(el('p','source-date',`기준 확인 ${data.checked} · 개념 요약과 새 예시 질문`));body.append(sources);
      detail.append(summary,body);detail.addEventListener('toggle',()=>{plus.textContent=detail.open?'−':'＋';});list.append(detail);
    });
  }
  search.addEventListener('input',render);
  const bundles=el('div','theory-bundles');
  data.groups.forEach((item,i)=>{
    const count=data.cards.filter(c=>c.group===item.id).length;
    const button=el('button','bundle');button.type='button';button.append(el('span','',`0${i+1} · ${item.name}`),el('b','',item.scene),el('small','',`${count}개의 이론 조각 펼치기 ↗`));
    button.addEventListener('click',()=>{group=item.id;search.value='';render();window.openDesk('library');});bundles.append(button);
  });
  const all=el('button','bundle library-all');all.type='button';all.append(el('span','','공식 자료집'),el('b','',`전체 ${data.cards.length}개 조각에서 찾기`),el('small','','개념 검색과 출처 확인 ↗'));
  all.addEventListener('click',()=>{group='all';search.value='';render();window.openDesk('library');});bundles.append(all);
  $('#drawer').insertBefore(bundles,$('.drawer'));
  const note=el('p','library-scope','각 과목의 핵심 개념을 새로 정리한 자료집이에요. 상담 대화는 현재 민정 씨 사례 한 건이며, 이론 카드의 질문은 작성 연습용입니다.');$('#drawer').insertBefore(note,$('.drawer'));
  const verified=el('button','text-action','출처와 함께 흥미·적성·가치 설명 보기 →');verified.type='button';verified.addEventListener('click',()=>{group='psychology';search.value='흥미 적성 가치';render();window.openDesk('library');});$('#why').append(verified);
  const list=$('#library-source-list');
  Object.entries(data.sources).forEach(([id,source])=>{const row=el('div','source-register');row.append(sourceLink(id),el('p','',source.basis),el('p','',source.use));list.append(row);});
  render();
})();
