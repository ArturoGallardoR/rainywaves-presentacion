const pesos = new Intl.NumberFormat('es-MX', {style:'currency', currency:'MXN', maximumFractionDigits:0});
const monto = n => Number.isFinite(n) && n > 0 ? pesos.format(n) : '';

function nodo(tag, contenido, clase) {
  const el = document.createElement(tag);
  if (contenido) el.textContent = contenido;
  if (clase) el.className = clase;
  return el;
}

function fila(dl, etiqueta, valor, clase) {
  if (!valor) return;
  const linea = nodo('div', '', clase);
  linea.append(nodo('dt', etiqueta), nodo('dd', valor));
  dl.append(linea);
}

export function pintarPrecios(seccion, config, catalogo) {
  const oferta = seccion.querySelector('.oferta');
  const {textos, condiciones, servicios} = catalogo;
  const tarjetas = nodo('div', '', 'paquetes');
  const notas = [config.nota];
  let conTestimonio = false;
  for (const id of config.paquetes) {
    const paquete = catalogo.paquetes[id];
    if (!paquete) continue;
    const tarjeta = nodo('article', '', id === config.destacado ? 'paquete destacado' : 'paquete');
    tarjeta.append(nodo('h3', paquete.nombre), nodo('p', config.resumen[id], 'incluye'));
    const dl = nodo('dl', '', 'cifras');
    fila(dl, textos.lista, monto(paquete.precio?.lista));
    const especial = monto(paquete.precio?.testimonio);
    if (especial) {
      conTestimonio = true;
      const etiqueta = [textos.testimonio, paquete.precio.condicion].filter(Boolean).join(', ');
      fila(dl, etiqueta, paquete.precio.testimonioDesde ? textos.desde.replace('{precio}', especial) : especial, 'testimonio');
    }
    fila(dl, textos.entrega, paquete.plazo, 'plazo');
    tarjeta.append(dl);
    tarjetas.append(tarjeta);
    const mensual = monto(paquete.mensual?.precio);
    notas.push(`${paquete.nombre}: ${paquete.incluye.join('; ')}.`);
    if (mensual) notas.push(`${textos.mensual}: ${textos.opcional.replace('{precio}', mensual)}.`);
  }
  if (conTestimonio) notas.push(condiciones.oferta.texto);
  if (Number.isFinite(condiciones.entrega)) notas.push(condiciones.pago.texto.replace('{entrega}', condiciones.entrega));
  const dominio = monto(servicios[condiciones.dominio.servicio]?.precio);
  if (dominio) notas.push(condiciones.dominio.texto.replace('{precio}', dominio));
  for (const id of config.servicios) {
    const s = servicios[id];
    if (!s) continue;
    const precio = monto(s.precio);
    notas.push([s.nombre, precio && precio + (textos.unidades[s.unidad] || ''), s.plazo, s.nota].filter(Boolean).join(' · '));
  }
  seccion.dataset.nota = notas.filter(Boolean).join('\n\n');
  const pie = config.pie.split(/(?<=\.)\s+/)
    .filter(frase => !frase.includes('{anticipo}') || Number.isFinite(condiciones.anticipo))
    .join(' ').replace('{anticipo}', condiciones.anticipo);
  oferta.replaceChildren(tarjetas, nodo('p', [pie,config.notaFactura].filter(Boolean).join(' '), 'pie-precios'));
  return true;
}
