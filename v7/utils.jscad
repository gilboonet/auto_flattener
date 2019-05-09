utils = function () {
utils.lit_off = function (off){ // chargement du modele au format .OFF
  let fl = off.split('\n');
  if(fl[0].startsWith("OFF")){
    fl.shift(); // supprime 1e ligne si [OFF]
  }
  let nbs = fl.shift().split(' '); // Lit 2e ligne [#points #polys 0]
  let nbPts  = Number(nbs[0]);
  let nbPolys = Number(nbs[1]);
  let points = [];
  for(let i = 0; i < nbPts; i++){ // lecture des points
    nbs = fl[i].split(' ').map(Number);
    points.push(new CSG.Vertex(new CSG.Vector3D(nbs[0], nbs[1], nbs[2])));
  }

  let polys = [];
  let f = [];
  let lPts = [];
  for(let i = 0; i < nbPolys; i++){ // lecture des polygones
    nbs = fl[nbPts + i].split(' ').map(Number);

    let pts = [];
    for(let j = 1; j <= nbs[0]; j++){ // preparation des pts du poly
      pts.push(points[nbs[j]].pos);
    }
    f.push(CSG.Polygon.createFromPoints(pts));//.flipped()); // flipped() pour bonne normale
    nbs.shift();
    lPts.push(nbs);
  }
  return {csg:CSG.fromPolygons(f), lPts:lPts, V:[], T:[], lKO:[], cumul:[]};
}
utils.poseAuSol = function (csg){ // pose le solide sur l'axe Z
    var b, d;
    
    b = csg.getBounds();
    d = b[1].minus(b[0]).dividedBy(2);
    return csg.translate([0, 0,-b[1].z+2*d.z]);
}
utils.csgFromSegments = function (segments) {
  let output = [];
  segments.forEach(segment => output.push(
    rectangular_extrude(segment, { w:2, h:1 })
  ));
  return union(output);
}
utils.getTaille = function (g){
  let b = g.getBounds();
  return b[1].minus(b[0]);
}
utils.centroid = function (p){ // retourne le centroid du polygone p
  var c = new CSG.Vector2D(0,0),
    v = p.points;
    vl = v.length;
	
	for(var i = 0; i < vl; i++){
		c = c.plus(v[i]);
	}
	
	return c.dividedBy(vl);
}
utils.centre = function (p){
  return p[0].plus(p[1].minus(p[0]).dividedBy(2));
}
utils.flatNonRec = function (input) {
  const stack = [...input];
  const res = [];
  while (stack.length) {
    // On sort une valeur de la pile
    const next = stack.pop();
    if (Array.isArray(next)) {
      // On place les éléments qui sont des tableaux dans
      // la pile sans modifier l'entrée
      stack.push(...next);
    } else {
      res.push(next);
    }
  }
  // On inverse le résultat pour revenir 
  // à l 'ordre de l'entrée
  return res.reverse();
}
utils.calcTriangleAngleA = function (a, b, c){
  let Ab = Math.abs(b.x - c.x);
  let Ac = Math.abs(b.y - c.y);  
  let A = Math.sqrt((Ab * Ab) + (Ac * Ac));

  let Bb = Math.abs(a.x - c.x);
  let Bc = Math.abs(a.y - c.y);
  let B = Math.sqrt((Bb * Bb) + (Bc * Bc));

  let Cb = Math.abs(a.x - b.x);
  let Cc = Math.abs(a.y - b.y);
  let C = Math.sqrt((Cb * Cb) + (Cc * Cc));

  let x = (A * A + C * C - B * B) / (2*A * C);
  return (Math.abs(x) <= 1) ? utils.radians(Math.acos(x)) : null;
}
utils.calcTriangleAngleB = function (a, b, c){
  let Ab = Math.abs(b.x - c.x);
  let Ac = Math.abs(b.y - c.y);
  let A = Math.sqrt((Ab * Ab) + (Ac * Ac));

  let Bb = Math.abs(a.x - c.x);
  let Bc = Math.abs(a.y - c.y);
  let B = Math.sqrt((Bb * Bb) + (Bc * Bc));

  let Cb = Math.abs(a.x - b.x);
  let Cc = Math.abs(a.y - b.y);
  let C = Math.sqrt((Cb * Cb) + (Cc * Cc));
  
  let x = (A * A + C * C - B * B) / (2 * A * C);
  return (Math.abs(x) <= 1) ? utils.radians(Math.acos(x)) : null;
}
utils.calcTriangleAngleC = function (a, b, c){
  let Ab = Math.abs(b.x - c.x);
  let Ac = Math.abs(b.y - c.y);
  let A = Math.sqrt((Ab*Ab) + (Ac*Ac));

  let Bb = Math.abs(a.x - c.x);
  let Bc = Math.abs(a.y - c.y);
  let B = Math.sqrt((Bb*Bb) + (Bc*Bc));

  let Cb = Math.abs(a.x - b.x);
  let Cc = Math.abs(a.y - b.y);
  let C = Math.sqrt((Cb*Cb) + (Cc*Cc));

  let x = (A*A + B*B - C*C) / (2*A*B);    
  return (Math.abs(x)<=1) ? utils.radians(Math.acos(x)) : null;
}
utils.radians = function (d){ return d * 180 / Math.PI; }

}
