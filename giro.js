import { pintarPrecios } from './precios.js';

async function json(ruta) {
  const respuesta = await fetch(ruta);
  if (!respuesta.ok) throw new Error(`No se pudo cargar ${ruta}`);
  return respuesta.json();
}

// Un sufijo opcional conserva el énfasis de marca sin aceptar HTML en los datos.
function titular(elemento, {titulo, enfasis}) {
  elemento.textContent = titulo;
  if (enfasis && titulo.endsWith(enfasis)) {
    const em = document.createElement('em');
    em.textContent = enfasis;
    elemento.replaceChildren(titulo.slice(0, -enfasis.length), em);
  }
}

export async function cargarGiro(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Nombre de giro no válido');
  const [giro,catalogo] = await Promise.all([json(`giros/${slug}.json`),json('catalogo.json')]);
  const {pregunta,caso,ayuda,precios,cierre} = giro;
  document.querySelector('#portada .bajada').textContent = giro.portada;
  document.getElementById('agenda').href = giro.agenda;
  const secciones = document.querySelectorAll('main .slide');
  for (const numero of giro.ocultar ?? []) {
    const seccion = secciones[numero - 1];
    if (seccion) seccion.dataset.omitir = '';
  }
  for (const [id,datos] of Object.entries({pregunta,resultado:caso,ayuda,precios,contacto:cierre})) {
    const seccion = document.getElementById(id);
    seccion.dataset.nota = datos.nota;
    if (datos.titulo) titular(seccion.querySelector('h2'), datos);
    if (datos.apoyo) seccion.querySelector('.bajada').textContent = datos.apoyo;
  }
  const casoEl = document.querySelector('#resultado');
  casoEl.querySelector('.sello span').textContent = caso.sello;
  const cifras = casoEl.querySelectorAll('.comparativa strong');
  cifras[0].textContent = caso.antes;
  cifras[1].textContent = caso.despues;
  casoEl.querySelector('.aclaracion').textContent = caso.aclaracion;
  const pares = document.querySelector('#ayuda dl');
  for (const [problema,herramienta] of ayuda.filas) {
    const fila = document.createElement('div');
    const dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = problema;
    dd.textContent = herramienta;
    fila.append(dt,dd);
    pares.append(fila);
  }
  pintarPrecios(document.querySelector('#precios'), precios, catalogo);
  return giro.nombre;
}
