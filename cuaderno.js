import { cargarGiro } from './giro.js';

const todas = [...document.querySelectorAll('.slide')];
const enlaces = [...document.querySelectorAll('.capitulos a')];
const giro = new URL(location.href).searchParams.get('giro') || 'general';
let nombreGiro;
let slides = [], nav = [], conPrecios;
const menu = document.querySelector('#menu');
const lista = menu.querySelector('nav');
const anterior = document.querySelector('#prev');
const siguiente = document.querySelector('#next');
const movimiento = matchMedia('(prefers-reduced-motion: reduce)');
const numero = i => String(i + 1).padStart(2, '0');
let activa = -1;
let entrada;
let apagarLluvia;
let encendido = false;
const pantalla = document.querySelector('#pantalla');
const notas = document.querySelector('#notas');
let monitor;

function actualizarNotas() {
  if (!monitor || monitor.closed || activa < 0) return;
  monitor.postMessage({
    tipo:'lamina', giro, nombreGiro, conPrecios, indice:activa, total:slides.length,
    titulo:slides[activa].querySelector('h1,h2').textContent,
    nota:slides[activa].dataset.nota,
    sigue:slides[activa + 1]?.querySelector('h2')?.textContent
  }, location.origin);
}
function abrirNotas() {
  if (monitor && !monitor.closed) monitor.focus();
  else monitor = window.open(`notas.html?giro=${encodeURIComponent(giro)}`, '_blank', 'popup,width=620,height=660');
  if (!monitor) window.alert('Permite abrir ventanas para ver las notas en una pantalla separada.');
}
notas.hidden = false;
notas.addEventListener('click', abrirNotas);
window.addEventListener('message', ev => {
  if (!monitor || ev.origin !== location.origin || ev.source !== monitor) return;
  if (ev.data === 'lista') actualizarNotas();
  if (ev.data === 'siguiente') ir(activa + 1);
  if (ev.data === 'anterior') ir(activa - 1);
  if (ev.data === 'precios') alternarPrecios();
});

function ampliar() {
  if (!document.fullscreenEnabled) return;
  const cambio = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  cambio.catch(() => pantalla.focus());
}
pantalla.hidden = !document.fullscreenEnabled;
pantalla.addEventListener('click', ampliar);
document.addEventListener('fullscreenchange', () => {
  pantalla.setAttribute('aria-label', document.fullscreenElement ? 'Salir de pantalla completa' : 'Entrar en pantalla completa');
});

function configurarRecorrido() {
  const incluir = new URL(location.href).searchParams.get('precios') === '1';
  if (conPrecios === incluir) return;
  conPrecios = incluir;
  slides = todas.filter(s => !s.hasAttribute('data-omitir') && (incluir || s.id !== 'precios'));
  for (const [i,s] of todas.entries()) {
    enlaces[i].hidden = !slides.includes(s);
    if (enlaces[i].hidden) s.hidden = true;
  }
  nav = enlaces.filter(a => !a.hidden);
  document.getElementById('precios').hidden = true;
  document.getElementById('total').textContent = numero(slides.length - 1);
  lista.replaceChildren(...nav.map((enlace,i) => {
    const item = enlace.cloneNode(true);
    const hora = document.createElement('span');
    hora.textContent = slides[i].querySelector('.sello b').textContent;
    item.prepend(`${numero(i)}　`);
    item.append(hora);
    return item;
  }));
  activa = -1;
}

function alternarPrecios() {
  const url = new URL(location.href);
  if (conPrecios) {
    url.searchParams.delete('precios');
    if (url.hash === '#precios') url.hash = 'proceso';
  } else {
    url.searchParams.set('precios','1');
    url.hash = 'precios';
  }
  history.replaceState(null, '', url);
  mostrar();
}

function detener() {
  if (entrada) entrada.progress(1).kill();
  entrada = null;
  apagarLluvia?.();
  apagarLluvia = null;
}

function mostrar(inicial = false) {
  if (!nombreGiro) return;
  configurarRecorrido();
  const i = Math.max(0, slides.findIndex(s => `#${s.id}` === location.hash));
  if (i === activa) return;
  detener();
  activa = i;
  for (const [j, slide] of slides.entries()) {
    slide.hidden = j !== i;
    for (const a of [nav[j], lista.children[j]]) {
      if (j === i) a.setAttribute('aria-current', 'step');
      else a.removeAttribute('aria-current');
    }
  }
  anterior.disabled = i === 0;
  siguiente.disabled = i === slides.length - 1;
  document.querySelector('#actual').textContent = numero(i);
  const actual = slides[i];
  if (!inicial) {
    const titulo = actual.querySelector('h1,h2');
    titulo.tabIndex = -1;
    titulo.focus({preventScroll:true});
    actual.parentElement.scrollTop = 0;
    window.scrollTo(0, 0);
  }
  if (!movimiento.matches && window.gsap && !actual.dataset.encendida) {
    actual.dataset.encendida = '1';
    const piezas = actual.querySelectorAll('.sello, h1, h2, .bajada, .plano, .comparativa div, .casos article, .pares div, .etapas li, .ficha');
    entrada = gsap.from(piezas, {
      opacity:.35, filter:'blur(2px)', duration:.6, stagger:.045,
      ease:'power2.out', clearProps:'opacity,filter'
    });
  }
  if (!i && !encendido && !movimiento.matches) {
    encendido = true;
    import('./lluvia.js').then(({ encender }) => {
      if (activa === 0 && !movimiento.matches && !document.hidden) apagarLluvia = encender(actual.querySelector('.maqueta'));
    }).catch(() => {}); // La maqueta completa también funciona sin WebGL.
  }
  actualizarNotas();
}

function ir(i) {
  if (slides[i]) location.hash = slides[i].id;
}
anterior.addEventListener('click', () => ir(activa - 1));
siguiente.addEventListener('click', () => ir(activa + 1));
document.querySelector('.indice').addEventListener('click', ev => { ev.preventDefault(); menu.showModal(); });
lista.addEventListener('click', ev => { if (ev.target.closest('a')) menu.close(); });
menu.addEventListener('click', ev => { if (ev.target === menu && !ev.target.closest('nav')) { const b = menu.getBoundingClientRect(); if (ev.clientX < b.left || ev.clientX > b.right || ev.clientY < b.top || ev.clientY > b.bottom) menu.close(); } });
window.addEventListener('keydown', ev => {
  if (menu.open || ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.altKey || (ev.shiftKey && ev.key !== ' ')) return;
  const tecla = ev.key.toLowerCase();
  if (['f','n','p'].includes(tecla)) {
    ev.preventDefault();
    if (!ev.repeat) ({f:ampliar, n:abrirNotas, p:alternarPrecios})[tecla]();
    return;
  }
  if (tecla === ' ' && ev.target.closest('button,a')) return;
  const destino = {ArrowLeft:activa-1, ArrowRight:activa+1, PageUp:activa-1, PageDown:activa+1, ' ':activa+(ev.shiftKey?-1:1), Home:0, End:slides.length-1}[ev.key];
  if (destino !== undefined) { ev.preventDefault(); ir(destino); }
});
window.addEventListener('hashchange', () => mostrar());
movimiento.addEventListener('change', () => { if (movimiento.matches) detener(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) detener(); });
window.addEventListener('pagehide', detener);
try {
  nombreGiro = await cargarGiro(giro);
  document.title = `${nombreGiro} · Cuaderno de rainywaves`;
  document.body.classList.add('presentando');
  document.querySelector('.pasos').hidden = false;
  mostrar(true);
} catch (error) {
  console.error(error);
  const aviso = document.getElementById('error-giro');
  aviso.textContent = 'No se pudo abrir este giro. Revisa el enlace y vuelve a cargar la presentación.';
  aviso.hidden = false;
}
