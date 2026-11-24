import {BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments, PerspectiveCamera, Scene, WebGLRenderer} from './assets/vendor/three.module.min.js';

// Una cortina breve frente a la maqueta. El plano terminado no necesita GPU.
export function encender(marco) {
  let renderer;
  try { renderer = new WebGLRenderer({alpha:true, antialias:false, powerPreference:'low-power'}); }
  catch { return; }
  const {width, height} = marco.getBoundingClientRect();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(width, height, false);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  marco.append(renderer.domElement);
  const cam = new PerspectiveCamera(42, width / height, .1, 50);
  cam.position.z = 10;
  const puntos = new Float32Array(6 * 130);
  for (let i=0; i<puntos.length; i+=6) {
    const x = Math.random()*20 - 10, y = Math.random()*19 - 6, z = Math.random()*6 - 4;
    puntos.set([x,y,z,x-.035,y-.13,z], i);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(puntos,3));
  const mat = new LineBasicMaterial({color:0xcfc9ec,transparent:true,opacity:0,depthWrite:false});
  const lluvia = new LineSegments(geo,mat), escena = new Scene();
  escena.add(lluvia);
  const inicio = performance.now();
  let fin = false;
  function parar() {
    if (fin) return;
    fin = true;
    renderer.setAnimationLoop(null);
    geo.dispose(); mat.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
  }
  renderer.setAnimationLoop(ahora => {
    const t = (ahora-inicio)/3200;
    if (t>=1) { parar(); return; }
    lluvia.position.set(-1.3*t, -5*t, 0);
    mat.opacity = Math.sin(Math.PI*t)*.42;
    renderer.render(escena,cam);
  });
  return parar;
}
