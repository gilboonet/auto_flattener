/*********************************************
 * DEPLIAGE v2                               *
 * - Modèle 3D :MARY 200 faces (format .OFF) *
 *********************************************/
const gep_bord = 0.05,
gln = '#' + '-'.repeat(25),
gPrec = 0.01,
gPCNumVoisin = 0.7,
gTaillePage = {x:210, y:297}, gEchPDF = 2.65;

var _num = [], _nb = [], gLAff = [], _gTextScale = 0.25;
const vXp_NON_PRESENT = 0, vXp_SEPARE = 1, 
      vXp_LIE = 10, vXp_LIE_COPLANAIRE = 11;

function flatNonRec(input) {
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

/*var params = {
  triangle: '0',
  echelle: 3,
  echTexte: 0.15,
  mode: 'prod'
};*/

function getParameterDefinitions() {
  return [
    { name: 'triangle', type: 'text', initial:'0', caption: 'Départ(s):' },
    { name: 'echelle', type: 'number', initial:'3', caption: 'Echelle:' },
    { name: 'echTexte', type: 'number', initial:'0.15', caption: 'Taille txt:' },
    { name: 'mode', type: 'text', initial:'dev', caption:'Mode:'}
  ];
}
function main(params){
  let msDebut = (new Date()).getTime();
  // A: { csg, lPts, cag, V}
  /* T : { cag, v0p, v1p, v2p }
    	valeurs possible pour vXp :
	- 0		= non présent
	- 1		= séparé avec n° affiché	AFFICHER n°
	----------------------------------------------
	- 10	= attaché                 NE PAS AFFICHER n°
	- 11	= attaché coplanaire
	- 12	= séparé sans n° affiché
	*/
  let a = lit_off(fichier());
  a.nom = 'MARY';
  //afficheInfosFichier(a);
  a.V = rechercheVoisins(a);
  a.csg = poseAuSol(a.csg.scale(params.echelle));
  a.V = rechercheV_Coplanaires(a);
  a.cag = []; // chaque triangle en 2D (calculé quand posé ou lié)
  a.lTPage = []; // liste des triangles de chaque page
  a.cumul = []; // cumul (cag) des triangles de chaque page
  let nTriangles = a.V.length, r = {cag:[], pdf:[]}, nPage = 0;
  let xD;
  let prems = params.triangle.split(',').map(Number);
  _gTextScale = params.echTexte;
  do{ // Dépliage
    xD = (prems.length > 0) ? prems.shift() : 0;
    while(gLAff.indexOf(xD) > -1){// Rech. prochain triangle
      xD++;
    }
    let lT = depliePage(a, xD);
    a.lTPage.push(lT);
    let R = {cag: [], pdf: []};
    for(let i = 0; i < lT.length; i++){
      let tmp = afficheTriangle(a, lT[i]);
      R.cag.push(tmp.cag);
      R.pdf.push(tmp.pdf);
    } 
    if(params.mode == 'dev'){
      r.cag.push(R.cag.flat()); 
      r.pdf.push(R.pdf.flat());
    }
    else{
      r.cag.push(flatNonRec(R.cag));
      r.pdf.push(flatNonRec(R.pdf));
    }
  }while(gLAff.length < nTriangles);
  
  let tmp = trieEtAjuste(a.cumul, r.cag, r.pdf);
  a.cumul = tmp.a;
  r.cag = tmp.b;
  r.pdf = tmp.c;
  //console.log('# nb Pages brutes:', r.length);

  do{ // regroupements en X
    let dern1 = a.cumul.length-1;
    let t1 = a.cumul[dern1];
    let dern2 = dern1 -1;
    let t2 = a.cumul[dern2];
    let hypX = getTaille(t1).x + getTaille(t2).x;
    if(hypX < gTaillePage.x - 0.5){
      let b1 = t1.getBounds();
      let b2 = t2.getBounds();
      let delta = new CSG.Vector2D(b2[1].x - b1[0].x + 0.5, 0);
      r.cag[dern1] = deplaceTriangle(r.cag[dern1], delta);
      r.pdf[dern1] = deplacePDF(r.pdf[dern1], delta);
      a.cumul[dern1] = a.cumul[dern1].translate(delta);
      r.cag[dern2] = r.cag[dern2].concat(r.cag.pop());
      r.pdf[dern2] = r.pdf[dern2].concat(r.pdf.pop());
      a.cumul[dern2] = a.cumul[dern2].union(a.cumul.pop());
      
      let tmp = trieEtAjuste(a.cumul, r.cag, r.pdf);
      a.cumul = tmp.a;
      r.cag = tmp.b;
      r.pdf = tmp.c;
      ok = true;
    }else{
      ok = false;
    }
  }while(ok);
  
  do{ // regroupements en Y
    let dern1 = a.cumul.length-1;
    let t1 = a.cumul[dern1];
    let dern2 = dern1 -1;
    let t2 = a.cumul[dern2];
    let hypY = getTaille(t1).y + getTaille(t2).y;
    if(hypY < gTaillePage.y - 0.5){
      let b1 = t1.getBounds();
      let b2 = t2.getBounds();
      let delta = new CSG.Vector2D(b2[1].x+0.5 - b1[1].x, b2[1].y - b1[0].y + 0.5);
      r.cag[dern1] = deplaceTriangle(r.cag[dern1], delta);
      r.pdf[dern1] = deplacePDF(r.pdf[dern1], delta);
      a.cumul[dern1] = a.cumul[dern1].translate(delta);
      r.cag[dern2] = r.cag[dern2].concat(r.cag.pop());
      r.pdf[dern2] = r.pdf[dern2].concat(r.pdf.pop());
      a.cumul[dern2] = a.cumul[dern2].union(a.cumul.pop());

      let tmp = trieEtAjuste(a.cumul, r.cag, r.pdf);
      a.cumul = tmp.a;
      r.cag = tmp.b;
      r.pdf = tmp.c;
      ok = true;
    }else{
      ok = false;
    }
  }while(ok);
  
  let sortie = [];
  for(let i = 0; i < r.pdf.length; i++){
    sortie.push(exportePDF(r.pdf[i]));
    if(i < r.pdf.length-1){ sortie.push('page'); }
  }
  //if(params.mode == 'dev'){ console.log(sortie.flat().join('\n')); }
  if(params.mode == 'dev'){
    afficheTempsCalcul(msDebut);
    console.log('# nb Pages:', r.cag.length);
    return r.cag.flat();
  }
  else{
    console.log(flatNonRec(sortie).join('\n'));
    return cube(1);
  }
}
function exportePDF(pdf){
  let retour = [], t, P1, P2, petit, grand, delta;

  // met à l'échelle
  for(let i = 0; i < pdf.length; i++){
    pdf[i].p1 = pdf[i].p1.times(gEchPDF);
    if(pdf[i].p2 !== null){
      pdf[i].p2 = pdf[i].p2.times(gEchPDF);
    }
  }
  // recherche le plus grand y
  grand = {x:-1000, y:-1000};
  for(let i = 0; i < pdf.length; i++){
    if(pdf[i].p1.y > grand.y){ grand.y = pdf[i].p1.y;}
  }
  delta = new CSG.Vector2D(0, grand.y);
  // tourne les points à 180°
  for(let i = 0; i < pdf.length; i++){
    pdf[i].p1 = new CSG.Vector2D(pdf[i].p1.x, grand.y - pdf[i].p1.y)
    if(pdf[i].p2 !== null){
      pdf[i].p2 = new CSG.Vector2D(pdf[i].p2.x,  grand.y - pdf[i].p2.y);
    }
  }
  
  petit = {x:10000, y:10000};
  grand = {x:-10000, y:-10000};
  for(let i = 0; i < pdf.length; i++){
    P1 = pdf[i].p1;
    P2 = pdf[i].p2
    
    if(P1.x > grand.x){ grand.x = P1.x; }
    if(P1.y > grand.y){ grand.y = P1.y; }
    
    if(P1.x < petit.x){ petit.x = P1.x; }
    if(P1.y < petit.y){ petit.y = P1.y; }
    if(P2 !== null){
      if(P2.x > grand.x){ grand.x = P2.x; }
      if(P2.y > grand.y){ grand.y = P2.y; }
      if(P2.x < petit.x){ petit.x = P2.x; }
      if(P2.y < petit.y){ petit.y = P2.y; }
    }
  }
  delta = new CSG.Vector2D(petit.x, petit.y);
  for (let i = 0; i < pdf.length; i++){
    pdf[i].p1 = pdf[i].p1.minus(delta);
    if(pdf[i].p2 !== null){
      pdf[i].p2 = pdf[i].p2.minus(delta);
    }
  }

  for(let i = 0; i< pdf.length; i++){
    switch(pdf[i].type){
      case 'L':
      case 'D':
        t = (pdf[i].type == 'L') ? 'line' : 'dash';
        retour.push(t
          + ' ' + pdf[i].p1.x.toFixed(2) 
          + ' ' + pdf[i].p1.y.toFixed(2)
          + ' ' + pdf[i].p2.x.toFixed(2)
          + ' ' + pdf[i].p2.y.toFixed(2));
        break;

      case 'T':
      case 't':
        t = (pdf[i].type == 'T') ? 'textT' : 'textE';
        retour.push(t
          + ' ' + pdf[i].texte
          + ' ' + pdf[i].p1.x.toFixed(2) 
          + ' ' + pdf[i].p1.y.toFixed(2));
        break;

      case 'P':
        retour.push('page');
        break;
    }
  }

  return retour;
}
function pushPDF(ltype, lp1, lp2, ltexte){
  return { type: ltype, p1: lp1, p2: lp2, texte : ltexte };
}
function trieEtAjuste(tA, tB, tC){ // tri par taille de tA[x].area
  let lTri = [];
  for(let i = 0; i < tA.length; i++){
    lTri.push({idx:i, value:tA[i].area()});
  }
  lTri.sort(function(a, b){ return (a.value > b.value) ? -1: 1; });
  
  let tt = { a:[], b:[], c:[] };
  for(let i = 0; i < lTri.length; i++){
    let it = lTri[i].idx;
    tt.a.push(tA[it]);
    tt.b.push(tB[it]);
    tt.c.push(tC[it]);
  }
  let retour = {a:[], b:[], c:[] };
  for(let i = 0; i < tt.b.length; i++){
    let cT = new CSG.Vector2D(gTaillePage.x * (i+1), 0);
    let delta = cT.minus(centre(tt.a[i].getBounds()));
    retour.a.push(tt.a[i].translate(delta));
    retour.b.push(deplaceTriangle(tt.b[i], delta));
    retour.c.push(deplacePDF(tt.c[i], delta));
  }
  return retour;
}
function deplacePDF(lPDF, delta){
  let retour = [];
  for(let i = 0; i < lPDF.length; i++){
    if(lPDF[i] !== undefined){
      switch(lPDF[i].type){
        case 'L':
        case 'D':
          retour.push(pushPDF(lPDF[i].type, lPDF[i].p1.plus(delta), lPDF[i].p2.plus(delta), ''));
          break;

        case 'T':
        case 't':
          retour.push(pushPDF(lPDF[i].type, lPDF[i].p1.plus(delta), null, lPDF[i].texte));
          break;

        case 'P':
          retour.push(lPDF[i]);
          break;
      }
    }
  }
  return retour;
}
function deplaceTriangle(lTriangle, delta){
  return lTriangle.map(x => x.translate(delta));
}
function centre(p){ return p[0].plus(p[1].minus(p[0]).dividedBy(2)); }
function afficheTempsCalcul(msDebut){
  let msFin = (new Date()).getTime();
  let ds = Math.floor((msFin - msDebut)/1000);
  console.log('#Executé en ', (ds / 60).toFixed(0), 'min.', (ds % 60));
}
function supprimeSListe(liste, aSupprimer){
  return liste.filter((el) => ! aSupprimer.includes(el));
}
function depliePage(a, n){
  let lPageTriangles = [];
  poseTriangle(a, n);
  lPageTriangles.push(n);
  a.lKO = [];
  let nbT = a.csg.polygons.length;
  let nbF = 1;
  let nbOK;
  do{
    nbOK = 0;
    let tmp = gLAff.map(el => el);
    // supprime les triangles des pages déjà calculées
    for(let i = 0; i< a.lTPage.length; i++){
      tmp = supprimeSListe(tmp, a.lTPage[i]);
    }

    for(let i = 0; i < tmp.length; i++){
      let x = tmp[i];
      for(let j = 0; j < a.V[x].length; j++){
        let y = a.V[x][j].T;
        if(gLAff.indexOf(y) == -1){
          if(lieTriangle(a, x, y)){
            lPageTriangles.push(y);
            nbOK++;
          }
        }
      }
    }
    nbF += nbOK;
  }while((nbOK > 0) && (gLAff.length < nbT));
  if (params.mode == 'dev'){ console.log('# T.',n, ':', nbF, 't.'); }

  return lPageTriangles;
}
function afficheInfosFichier(a){
  let txt = [];
  //txt.push(gln);
  txt.push('#Fichier ' + a.nom +'.off');
  txt.push("#" + a.csg.polygons.length + ' polygones');
  console.log(txt.join('\n'));
}
function poseTriangle(a, n){
  a.cag[n] = poseAPlat(a, n);
  a.cumul.push(a.cag[n].expandToCAG(gep_bord));
  gLAff.push(n);
  a.T[n] = [1, 1, 1];
}
function lieTriangle(a, n1, n2){
  let tmp;
  let chIdx = Math.max(n1, n2) + '_' + Math.min(n1, n2);
  if(a.lKO.indexOf(chIdx) > -1){ return false; }

  // recherche des indices concernés
  let i11 = rechIndexVoisin(a, n1, n2);
  let i12 = pt2(i11);
  let i21 = a.V[n1][i11].n1;
  let i22 = a.V[n1][i11].n2;

  let poly1 = a.cag[n1];
  let pa1 = poly1.points[i11];
  let pa2 = poly1.points[i12];

  let poly2 = poseAPlat(a, n2);
  let pb1 = poly2.points[i21];
  let pb2 = poly2.points[i22];

  poly2 = poly2.translate(pa1.minus(pb2));// deplace poly2 de (pa1 - pb2)
  pb1 = poly2.points[i21];
  pb2 = poly2.points[i22];	

  // tourne poly2 autour de pb2 de façon à ce que pb1 = pa2
  let angle = calcTriangleAngleB(pb1, pb2, pa2);
  if(angle !== null){
    tmp = poly2.rotate(pb2, [0,0,1], angle);
    if(pa2.distanceTo(tmp.points[i21]) > gPrec){
      tmp = poly2.rotate(pb2, [0,0,1], 360-angle);
    }
  }else{
    tmp = poly2.rotate(pa1, [0,0,1], 180);
  }

  poly2 = tmp;
  // vérifie que le triangle ne recouvre pas un triangle déjà placé
  let tNouv = poly2.innerToCAG().subtract(poly2.expandToCAG(gep_bord));
  let nC = a.cumul.length - 1;
  let ok = a.cumul[nC].intersect(tNouv).area() === 0;
  if(ok){
    // verifie qu'ajouter le triangle ne fasse pas déborder la page
    let tmpCumul = a.cumul[nC].union(poly2.expandToCAG(gep_bord));
    let d = getTaille(tmpCumul);
    ok = (d.x <= gTaillePage.x) && (d.y <= gTaillePage.y);
    if(ok){
      a.cag[n2] = tmp;
      a.cumul[nC] = tmpCumul;
      gLAff.push(n2);
      a.T[n2]= [1, 1, 1];
      a.T[n2][i21] = vXp_LIE;
      a.T[n1][i11] = vXp_LIE;
    }
  }
  if(!ok){
    a.lKO.push(n1 + '_' + n2);
  }
  return ok;
}
function getTaille(cag){
  let b = cag.getBounds();
  return b[1].minus(b[0]);
}
function pt2(p1){ return (p1 + 1) % 3; } // bouclage circulaire dans triplet
function calcTriangleAngleA(a, b, c){
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
  return (Math.abs(x) <= 1) ? radians(Math.acos(x)) : null;
}
function calcTriangleAngleB(a, b, c){
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
  return (Math.abs(x) <= 1) ? radians(Math.acos(x)) : null;
}
function calcTriangleAngleC(a, b, c){
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
  return (Math.abs(x)<=1) ? radians(Math.acos(x)) : null;
}
function radians(d){ return d * 180 / Math.PI; }
function afficheTriangle(a, n){
  let poly = a.cag[n];
  let lcag = [], lpdf = [];
  let p1, p2;
  /* PDF
   * 
   * line/dash  : L/D, p1, p2   Affiche Ligne/pointillés entre p1 et p2
   * text       : T/t, p, txt   Affiche Texte au point P (type T ou t)
   * page       : P             Ajoute une page
   */

  // Triangle
  for(let i = 0; i < poly.points.length; i++){
    let t = a.T[n][i];
    let estCoP = a.V[n][i].estCoP;
    let c = (t < 10) ? "blue" : (estCoP ? null : "red");
    if(c !== null){
      p1 = poly.points[i];
      p2 = poly.points[pt2(i)];
      lcag.push(color(c, cylinder({start:p1, end:p2, r:0.05})));
      lpdf.push(pushPDF(((c == "blue") ? 'L' : 'D'), p1, p2, ''));
    }
  }

  // n° Triangle
  p1 = centroid(poly);
  lcag.push(color("green", nombreCentre(p1, n, false)));
  lpdf.push(pushPDF('T', p1, null, n));

  let tmp = poly.scale(gPCNumVoisin);
  tmp = tmp.translate(p1.minus(centroid(tmp)));
  // n° voisins
  for(let i = 0; i < a.V[n].length; i++){
    if(a.T[n][i] < 10){ // Si le voisin est d'un type à afficher
      let c = centroid({points:[tmp.points[i], tmp.points[pt2(i)]]});
      let nV = a.V[n][i].T;
      lcag.push(color("black", nombreCentre(c, nV, true)));
      lpdf.push(pushPDF('t', c, null, nV));
    }
  }
  return {cag: lcag, pdf: lpdf};
}
function poseAPlat(a, n){
  let p = a.csg.polygons[n];
  const v1 = p.vertices[0].pos, v2 = p.vertices[1].pos, v3 = p.vertices[2].pos;
  const tC = new CSG.Connector(v1, v2.minus(v1), p.plane.normal);
  const z0xC = new CSG.Connector([0, 0, 0], [0,v2.minus(v1).length(), 0.2], [0, 0, 1]);
  const tb = tC.getTransformationTo(z0xC, false, 0);
  p = (CSG.fromPolygons([p]).transform(tb)).polygons[0];

  p2 = [];
  for(let i = 0; i < p.vertices.length; i++){
    p2.push(new CSG.Vector2D(p.vertices[i].pos._x, p.vertices[i].pos._y));
  }
  let poly2D = new CSG.Path2D(p2, true);
  return poly2D;
}
function aVoisinCoPlanaire(v){
  let ok = false;
  for(let i = 0; i< v.length; i++){
    if(v[i].estCoP){ ok = true; break; }
  }
  return ok;
}
function rechercheV_Coplanaires(a){
// Recherche si des polys voisins sont coplanaires
  var i, ci, pni, ncc, j, cj, pnj;

  for (let i = 0; i < a.V.length; i++){
    let ci = a.csg.polygons[i];
    let pni = ci.plane.normal;
    let ncc = 0;
    for (let j = 0; j < a.V[i].length; j++){
      if (i == j){ continue; }
      if (a.V[i][j] === null){ continue;}
      if (i > a.V[i][j].T){ continue; }

      let ji = a.V[i][j].T;
      let cj = a.csg.polygons[ji];
      //let pnj = cj.plane.normal;
      if (pni.distanceTo(cj.plane.normal) < 0.075){
        a.V[i][j].estCoP = true;
        //n = rechIndexVoisin(a, ji, i);
        a.V[ji][rechIndexVoisin(a, ji, i)].estCoP = true;
      }
    }
  }
  return a.V;
}
function rechIndexVoisin(a, iv, i){
// retourne l'indice du voisin iv ayant pour voisin i
  let n=0, max_n = a.V[iv].length;
  while ((a.V[iv][n].T != i)&&(n <= max_n)){ n++; }

  if(n>max_n){
    throw "Les triangles " + iv +" et " + i + " ne sont pas voisins";
  }

  return (n <= max_n) ? n: -1;
}
function rechercheVoisins(a){
  let V = [];
    // Recherche des voisins
    // valeur : {T:#triangle, n:#ligne comme ci-dessous, estCoP}
    //V[n][0] voisin 0 ligne entre point 0 - point 1
    //V[n][1] voisin 1 ligne entre point 1 - point 2
    //V[n][2] voisin 2 ligne entre point 2 - point 0

  let nPolys = a.lPts.length;
  for(let i = 0; i < nPolys; i++){
    V.push([]);
    for(let nl = 0; nl <= 2; nl++){
      let a0 = a.lPts[i][nl];
      let a1 = a.lPts[i][pt2(nl)];
      for(let j = 0; j< nPolys; j++){
        if(j == i){ continue; }
        ok = false;
        for(let ml = 0; ml <=2; ml++){
          ml2 = pt2(ml);
          let b0 = a.lPts[j][ml];
          let b1 = a.lPts[j][ml2];
          if((a0 == b0) && (a1 == b1)){
            V[i][nl] = {T:j, n1:ml2, n2:ml, estCoP:false};
            break;
          }
          if((a0 == b1) && (a1 == b0)){
            V[i][nl] = {T:j, n1:ml, n2:ml2, estCoP:false};
            break;
          }
        }
      }
    }
  }
  return V;
}
function poseAuSol(csg){ // pose le solide sur l'axe Z
    var b, d;
    
    b = csg.getBounds();
    d = b[1].minus(b[0]).dividedBy(2);
    return csg.translate([0, 0,-b[1].z+2*d.z]);
}
function centroid(p){ // retourne le centroid du polygone p
	var c = new CSG.Vector2D(0,0),
		v = p.points;
		vl = v.length;
	
	for(var i = 0; i < vl; i++){
		c = c.plus(v[i]);
	}
	
	return c.dividedBy(vl);
}
function fait_nombres(){
var np = [
[[0,0],[0,16],[8,16],[8,0],[0,0]],
[[0,8],[8,16],[8,0]],
[[0,12],[0,16],[8,16],[8,8],[0,8],[0,0],[8,0]],
[[0,13],[0,16],[8,16],[8,11],[4,8],[8,5],[8,0],[0,0],[0,3]],
[[8,8],[0,8],[6,16],[6,0]],
[[8,16],[0,16],[0,8],[8,8],[8,0],[0,0]],
[[8,16],[0,8],[0,0],[8,0],[8,8],[0,8]],
[[0,16],[8,16],[0,0]],
[[4,9],[1,12],[1,16],[7,16],[7,12],[4,9],[8,7],[8,0],[0,0],[0,7],[4,9]],
[[8,8],[0,8],[0,16],[8,16],[8,0],[0,0]]
];
for(var i in np)
    _num[i] = new CSG.Path2D(np[i]).rectangularExtrude(1, 0.2, 2, true).scale(_gTextScale);
}
function nombreCentre(center, n, estPetit){
	var label, B, d, dx, dy;
		
	label = nombre(n);	
	if(estPetit)label = label.scale(0.75);
	B = label.getBounds();
	d = center.minus(B[1].minus(B[0]).dividedBy(2));
	
	return label.translate(d);
}
function nombre (n){
	var i, ch, r, c, t;
	
	if (_num.length === 0)fait_nombres();

	if(typeof _nb[n] === 'undefined'){
		ch = n.toString();
		r = [];
		for(i=0; i<ch.length; i++){
		    c = ch.charCodeAt(i) - 48;
	    	t = _num[c].translate([i*11*_gTextScale, 0]);
			r.push(t);
		}
		r = union(r);
		_nb[n] = r;
	}else{
		r = _nb[n];
	}
	return r;
}
function lit_off(off){ // chargement du modele au format .OFF
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
function fichier(){// copier-coller de fichier 3D au format .OFF
	return `OFF
102 200 0
1.001741 17.51158 8.796722 
3.992898 15.18346 7.598772 
4.269698 15.98075 -8.13061 
-3.875824 20.92385 -9.244047 
-5.621907 20.97728 4.191997 
8.212344 12.66209 6.508863 
1.496891 17.83106 36.09719 
-1.840474 18.45163 33.28899 
7.903306 13.26568 24.3126 
2.085762 17.16222 51.72099 
3.86854 15.43489 55.1474 
6.903355 14.23787 50.07095 
-7.242036 17.90087 -3.045658 
0.9737777 18.12791 62.07397 
-6.73385 20.7499 18.20783 
-7.146102 21.10178 41.5194 
-7.392631 20.83382 59.75484 
4.68535 13.77016 72.55856 
-3.491883 18.41695 69.28925 
-9.124445 18.08537 22.96147 
7.586835 10.38202 66.33081 
6.383527 10.00427 7.294143 
7.958084 10.2124 43.1045 
7.760318 9.035585 -1.77031 
-8.010155 18.6106 67.56001 
1.966861 11.54808 87.79832 
-9.608145 19.12004 33.81339 
10.3859 7.407311 46.60295 
7.401396 7.325176 1.200581 
-13.04075 19.07528 -10.17724 
-5.903911 15.73244 76.5134 
8.172747 8.046753 15.37944 
-12.52793 17.94272 6.194672 
-13.87755 18.63249 24.25831 
-11.7318 17.84066 35.95316 
-14.25848 18.76815 49.30115 
3.784662 8.715171 75.38698 
-12.54922 16.26494 68.1477 
-3.596027 14.70936 86.82042 
7.9527 3.057366 37.21258 
-15.72043 12.66238 -5.391894 
-11.6253 13.34935 13.01105 
6.022446 2.462277 -2.60379 
-5.989741 6.140035 88.65739 
8.391512 2.163782 22.23913 
3.120226 4.993481 76.46291 
0.6511293 6.393971 81.104 
-15.64746 15.6657 14.76853 
9.790771 3.218828 -10.40379 
-12.0117 13.08092 -1.848069 
0.8050151 1.356501 7.795412 
5.174548 3.825703 9.711727 
8.159583 1.956283 62.04771 
-1.27467 3.911289 86.31831 
-8.352881 11.1071 80.10821 
8.889399 3.098787 53.65951 
-15.49454 14.7531 49.2333 
-12.01538 -2.087879 -8.566502 
-17.61609 7.206097 -10.4962 
2.242162 -3.912926 -10.39892 
0.6734447 6.07306 73.04786 
-15.52189 16.22444 32.73922 
-11.84547 8.476636 7.585187 
-0.7147098 0.2449462 0.8487081 
-10.11685 11.36242 71.21024 
7.342918 -1.829219 32.4799 
-8.464625 6.331419 67.84123 
-10.68601 6.129103 -1.461192 
2.913093 0.9693544 25.26503 
-4.678093 6.231884 78.95677 
-3.469313 3.164533 65.84779 
-13.4535 10.03989 21.19281 
-3.859874 2.675879 7.134622 
3.918972 -1.008169 54.01537 
3.446312 -1.973872 59.40375 
-8.552197 4.507306 11.10602 
-10.94604 7.866461 17.29436 
-16.62097 10.41895 53.53345 
-16.96198 11.75968 38.08247 
2.387861 -2.49155 34.23862 
3.290339 -0.7761675 33.52551 
1.518106 -4.265308 -5.778681 
-17.30163 12.59582 60.2728 
-2.425634 -1.463041 62.08569 
-18.36569 7.656655 37.6427 
2.761564 -4.319904 40.99866 
-5.555971 4.668016 62.57296 
-8.15187 0.08766042 73.38258 
-6.77225 2.358009 19.09198 
-5.369941 1.504159 49.27877 
-1.594581 2.378424 56.05797 
-7.503186 0.9749932 64.60321 
-0.0109059 -3.197366 31.17045 
-3.757883 -2.96557 23.29283 
-12.40039 3.13057 19.06586 
-3.304897 -0.855716 35.13401 
-11.95408 5.000937 31.54039 
-10.03931 7.373915 56.2787 
-13.81425 3.84535 43.0028 
-12.47583 4.832372 60.64503 
-2.336864 -3.062851 45.83651 
-9.923204 2.366884 34.14769 
3 0 2 3
3 2 0 1
3 5 23 2
3 1 5 2
3 3 4 0
3 0 6 1
3 6 10 1
3 0 7 6
3 1 8 5
3 9 6 7
3 8 10 11
3 1 10 8
3 6 9 10
3 13 10 9
3 4 14 0
3 0 14 7
3 7 14 15
3 15 9 7
3 9 16 13
3 17 10 13
3 17 11 10
3 9 15 16
3 8 11 22
3 13 18 17
3 15 14 19
3 11 17 20
3 12 4 3
3 23 5 21
3 21 5 8
3 13 24 18
3 20 22 11
3 18 38 25
3 8 22 21
3 4 19 14
3 16 26 24
3 16 24 13
3 22 20 27
3 26 16 15
3 12 19 4
3 23 21 28
3 28 21 31
3 17 36 20
3 19 26 15
3 12 3 29
3 38 18 30
3 21 22 31
3 18 25 17
3 30 18 24
3 27 31 22
3 29 49 12
3 26 35 24
3 12 33 19
3 20 55 27
3 26 19 34
3 33 12 32
3 31 27 39
3 24 37 30
3 17 25 36
3 37 24 35
3 20 36 52
3 33 34 19
3 55 20 52
3 49 29 40
3 41 32 12
3 28 42 23
3 39 27 55
3 26 34 56
3 43 25 38
3 41 12 49
3 33 61 34
3 36 25 45
3 35 82 37
3 44 31 39
3 46 69 54
3 32 47 33
3 26 56 35
3 42 48 23
3 61 56 34
3 50 42 28
3 37 64 30
3 51 31 44
3 51 50 28
3 32 41 47
3 28 31 51
3 47 61 33
3 38 30 54
3 57 58 59
3 54 30 64
3 25 43 53
3 65 44 39
3 47 41 71
3 25 53 45
3 36 74 52
3 36 60 74
3 46 60 45
3 60 36 45
3 54 64 60
3 54 60 46
3 63 42 50
3 46 45 53
3 68 51 44
3 47 71 61
3 43 38 54
3 41 49 62
3 82 64 37
3 40 67 49
3 56 61 78
3 66 60 64
3 82 35 77
3 44 80 68
3 69 46 53
3 65 39 55
3 70 60 66
3 43 54 69
3 35 56 77
3 50 72 63
3 71 41 62
3 80 44 65
3 56 78 77
3 74 73 52
3 73 55 52
3 65 55 73
3 78 61 71
3 76 62 75
3 67 75 62
3 68 80 79
3 69 53 43
3 71 62 76
3 65 73 80
3 62 49 67
3 68 93 51
3 42 63 81
3 76 96 71
3 83 60 70
3 78 84 77
3 48 42 81
3 70 66 87
3 97 86 99
3 72 88 75
3 80 73 85
3 67 72 75
3 89 90 86
3 50 88 72
3 48 81 59
3 67 63 72
3 90 83 86
3 99 86 91
3 68 79 92
3 58 67 40
3 74 60 83
3 51 93 50
3 99 98 97
3 79 80 85
3 86 97 89
3 75 94 76
3 88 95 89
3 90 89 95
3 101 97 96
3 50 93 88
3 82 99 64
3 84 98 77
3 99 66 64
3 82 77 99
3 78 71 96
3 96 97 98
3 94 75 88
3 73 100 85
3 92 95 68
3 91 86 83
3 83 70 91
3 83 90 100
3 88 89 101
3 66 99 91
3 76 94 96
3 97 101 89
3 93 68 95
3 96 84 78
3 73 74 83
3 90 95 100
3 87 91 70
3 29 3 58
3 73 83 100
3 100 92 79
3 88 101 94
3 84 96 98
3 79 85 100
3 67 58 57
3 93 95 88
3 92 100 95
3 66 91 87
3 96 94 101
3 63 67 57
3 98 99 77
3 48 59 58
3 2 48 58
3 3 2 58
3 81 63 57
3 59 81 57
3 40 29 58
3 2 23 48
`;
}
