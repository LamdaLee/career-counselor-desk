(function () {
  var KEY = 'desk-lamp-v1';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return { pace: 'speak', threads: [], lastVisit: null };
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') throw new Error('bad');
      if (['look', 'speak', 'stay'].indexOf(data.pace) < 0) data.pace = 'speak';
      if (!Array.isArray(data.threads)) data.threads = [];
      return data;
    } catch (e) {
      return { pace: 'speak', threads: [], lastVisit: null };
    }
  }

  function dayStart(t) {
    var d = new Date(t);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  function whenLabel(at) {
    var days = Math.round((dayStart(Date.now()) - dayStart(at)) / 86400000);
    if (days <= 0) return '오늘';
    if (days === 1) return '어제';
    var d = new Date(at);
    return (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
  }

  function greet(state) {
    var hour = new Date().getHours();
    var part = hour < 11 ? '아침' : hour < 17 ? '낮' : hour < 21 ? '저녁' : '늦은 시간';
    var hello = document.getElementById('hello');
    var lead = document.getElementById('lead');
    var when = document.getElementById('when');
    when.textContent = part;
    if (!state.lastVisit) {
      hello.textContent = '책상 불을 켜 둘게요';
      lead.textContent = '처음이어도 차례는 없어요. 내담자 한 사람의 장면만 있고, 기본은 12분이에요. 장면만 읽고 일어나도 됩니다.';
      return;
    }
    var days = Math.round((dayStart(Date.now()) - dayStart(state.lastVisit)) / 86400000);
    if (days <= 0) {
      hello.textContent = '또 왔구나';
      lead.textContent = state.threads.length
        ? '아까 남겨 둔 말은 아직 책상 위에 있어요. 이어서 해도 되고, 장면만 다시 봐도 돼요.'
        : '같은 날 다시 와도 장면은 그대로예요. 새로 시작하지 않아도 됩니다.';
      return;
    }
    if (days === 1) {
      hello.textContent = '어제 자리도 그대로예요';
      lead.textContent = '밀린 분량은 없어요. 오늘은 이 장면 하나면 됩니다.';
      return;
    }
    hello.textContent = '오래간만이에요';
    lead.textContent = '며칠이 비어도 자리는 치우지 않았어요. 오늘 분량은 장면 하나예요.';
  }

  var state = load();
  greet(state);
  state.lastVisit = Date.now();

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  var list = document.getElementById('shelf-list');
  var empty = document.getElementById('shelf-empty');

  function render() {
    list.replaceChildren();
    empty.hidden = state.threads.length > 0;
    state.threads.forEach(function (thread, index) {
      var li = document.createElement('li');
      var meta = document.createElement('div');
      meta.className = 'shelf-meta';
      var scene = document.createElement('span');
      scene.textContent = thread.scene + ' · ' + whenLabel(thread.at);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '치우기';
      btn.addEventListener('click', function () {
        state.threads.splice(index, 1);
        persist();
        render();
      });
      meta.appendChild(scene);
      meta.appendChild(btn);
      var p = document.createElement('p');
      p.textContent = thread.text;
      li.appendChild(meta);
      li.appendChild(p);
      list.appendChild(li);
    });
    renderScraps();
  }

  function renderScraps() {
    var box = document.getElementById('scraps');
    if (!box) return;
    box.replaceChildren();
    state.threads.slice(0, 3).forEach(function (thread, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'scrap';
      button.style.setProperty('--tilt', (index % 2 ? 2.1 : -2.3) + 'deg');
      button.textContent = thread.text;
      button.addEventListener('click', function () { openDesk('say'); });
      box.appendChild(button);
    });
  }

  var PACE_LABEL = { look: ['4분', '들여다보기'], speak: ['12분', '말해보기'], stay: ['25분', '앉아있기'] };
  function showPace(pace) {
    var pair = PACE_LABEL[pace] || PACE_LABEL.speak;
    var label = document.getElementById('pace-chip-label');
    var hint = document.getElementById('pace-chip-hint');
    if (label) label.textContent = pair[0];
    if (hint) hint.textContent = pair[1];
  }

  var sheet = document.getElementById('sheet');
  var scroller = document.getElementById('sheet-scroll');
  var lastFocus = null;
  function openDesk(name) {
    lastFocus = document.activeElement;
    sheet.classList.add('open');
    sheet.inert = false;
    var target = scroller.querySelector('[data-anchor="' + name + '"]');
    requestAnimationFrame(function () {
      window.dispatchEvent(new Event('resize'));
      if (target) scroller.scrollTop = Math.max(0, target.offsetTop - 8);
      var close = document.getElementById('sheet-close');
      if (close) close.focus();
    });
  }
  function closeDesk() {
    sheet.classList.remove('open');
    sheet.inert = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  window.openDesk = openDesk;
  document.getElementById('sheet-close').addEventListener('click', closeDesk);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sheet.classList.contains('open')) closeDesk();
  });
  document.querySelectorAll('[data-open]').forEach(function (button) {
    button.addEventListener('click', function () { openDesk(button.getAttribute('data-open')); });
  });

  document.addEventListener('pace-change', function (e) {
    state.pace = e.detail.pace;
    document.body.dataset.pace = e.detail.pace;
    document.documentElement.dataset.pace = e.detail.pace;
    showPace(e.detail.pace);
    persist();
  });

  document.addEventListener('thread-save', function (e) {
    var text = (e.detail.text || '').trim();
    if (!text) return;
    state.threads.unshift({ text: text, at: Date.now(), scene: '사무실은 싫어요' });
    if (state.threads.length > 8) state.threads.length = 8;
    persist();
    render();
    var host = document.querySelector('.u070');
    if (host && host.pushToast) {
      host.pushToast('ok');
      var nodes = host.querySelectorAll('.u070-t');
      var small = nodes.length ? nodes[nodes.length - 1].querySelector('small') : null;
      if (small) small.textContent = text.length > 36 ? text.slice(0, 36) + '…' : text;
    }
    if (sheet.classList.contains('open')) {
      var shelf = document.getElementById('shelf');
      if (shelf) shelf.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }
  });

  if (state.pace && state.pace !== 'speak') {
    var btn = document.querySelector('.u015-opt[data-pace="' + state.pace + '"]');
    if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  } else {
    document.body.dataset.pace = 'speak';
  }

  showPace(state.pace);
  render();
  persist();

  var deferredInstall = null;
  var installBtn = document.getElementById('install');
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredInstall = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener('click', function () {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    deferredInstall = null;
    installBtn.hidden = true;
  });
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
