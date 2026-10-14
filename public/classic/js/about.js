(() => {
  const list=document.getElementById('about-source-list');
  const data=window.DeskLibrary;
  if(!list || !data) return;
  Object.values(data.sources).forEach(source=>{
    const row=document.createElement('div');row.className='source-register';
    const link=document.createElement('a');link.className='source-link';link.textContent=source.org+' · '+source.title;link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';
    const basis=document.createElement('p');basis.textContent=source.basis;
    const use=document.createElement('p');use.textContent=source.use;
    row.append(link,basis,use);list.append(row);
  });
})();
