/******************************************
 * DEPLIAGE v2                            *
 * - Modèle 3D :test simple (format .OFF) *
 ******************************************/
include ("utils.jscad");
include ("modele_off.jscad");

const gep_bord = 0.05,
gPrec = 0.01,
gPCNumVoisin = 0.7,
gEchPDF = 2.8;

var _num = [], _nb = [], gLAff = [], _gTextScale = 0.25, gTaillePage;
const vXp_NON_PRESENT = 0, vXp_SEPARE = 1, 
      vXp_LIE = 10, vXp_LIE_COPLANAIRE = 11;

function getParameterDefinitions() {
  return [
    { name: 'triangle', type: 'text', initial:'0', caption: 'Départ(s):' },
    { name: 'echelle', type: 'number', initial:'5', caption: 'Echelle:' },
    { name: 'echTexte', type: 'number', initial:'0.15', caption: 'Taille txt:' },
    { name: 'mode', type: 'text', initial:'prod', caption:'Mode:'},
    { name: 'format', type: 'text', initial:'', caption:'Format:'}
  ];
}
function main(params){
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
  utils();
  volume();
  switch(params.format){
    case 'a4':
    case'A4':
      gTaillePage = {y:(210*1)-10, x:(297*1)-10};
      break;
    case 'a3':
    case 'A3':
      gTaillePage = {y:(297*1)-10, x:(210*2)-10};
      break;
    case 'a2':
    case 'A2':
      gTaillePage = {y:(210*2)-10, x:(297*2)-10};
      break;
    case 'a1':
    case 'A1':
      gTaillePage = {y:(297*2)-10, x:(210*4)-10};
      break;
    default:
      gTaillePage = {y:(260*1)-10, x:(400*1)-10};
  }
  let a = utils.lit_off(volume.fichier());
  a.V = rechercheVoisins(a);
  a.csg = utils.poseAuSol(a.csg.scale(params.echelle));
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
      r.cag.push(utils.flatNonRec(R.cag));
      r.pdf.push(utils.flatNonRec(R.pdf));
    }
  }while(gLAff.length < nTriangles);
  
  let tmp = trieEtAjuste(a.cumul, r.cag, r.pdf);
  a.cumul = tmp.a;
  r.cag = tmp.b;
  r.pdf = tmp.c;
  //console.log('# nb Pages brutes:', r.length);

  if(a.cumul.length > 2){
    do{ // regroupements en Y
      let dern1 = a.cumul.length-1;
      let t1 = a.cumul[dern1];
      let dern2 = dern1 -1;
      if(dern2 >= 0){
      let t2 = a.cumul[dern2];
      let hypY = utils.getTaille(t1).y + utils.getTaille(t2).y;
      if(hypY < gTaillePage.y - 0.5){
      try{
        let b1 = t1.getBounds();
        let b2 = t2.getBounds();
        let delta = new CSG.Vector2D(b2[1].x+0.5 - b1[1].x, b2[1].y - b1[0].y + 0.5);
        r.cag[dern1] = deplaceTriangle(r.cag[dern1], delta);
        r.pdf[dern1] = deplacePDF(r.pdf[dern1], delta);
        a.cumul[dern1] = a.cumul[dern1].translate(delta);
        r.cag[dern2] = r.cag[dern2].concat(r.cag.pop());
        r.pdf[dern2] = r.pdf[dern2].concat(r.pdf.pop());
        a.cumul[dern2] = a.cumul[dern2].union(a.cumul.pop());
      }catch(e){}

        let tmp = trieEtAjuste(a.cumul, r.cag, r.pdf);
        a.cumul = tmp.a;
        r.cag = tmp.b;
        r.pdf = tmp.c;
        ok = true;
      }else{
        ok = false;
      }
      }else{ ok = false;}
    }while(ok);
    
    do{ // regroupements en X
      let dern1 = a.cumul.length-1;
      let t1 = a.cumul[dern1];
      let dern2 = dern1 -1;
      if(dern2 >= 0){
      let t2 = a.cumul[dern2];
      let hypX = utils.getTaille(t1).x + utils.getTaille(t2).x;
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
      }else{ ok = false;}
    }while(ok);    
  }
  
  let sortie = [];
  for(let i = 0; i < r.pdf.length; i++){
    sortie.push(exportePDF(r.pdf[i]));
    if(i < r.pdf.length-1){ sortie.push('page'); }
  }
  //if(params.mode == 'dev'){ console.log(sortie.flat().join('\n')); }
  if(params.mode == 'dev'){
    console.log('# nb Pages:', r.cag.length);
    return r.cag.flat();
  }
  else{
    console.log(utils.flatNonRec(sortie).join('\n'));
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
  grand = {x:-10000000, y:-1000000};
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
  
  petit = {x:10000000, y:10000000};
  grand = {x:-10000000, y:-10000000};
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
      case 'L': // bord
      case 'D': // pli vallee
      case 'M': // pli montagne
        if(pdf[i].type == 'L'){
          t = 'line';
        }else if(pdf[i].type == 'D'){
          t = 'dash';
        }else{
          t = 'mont'
        };
        //recherche doublon
        let tmpch1 = ' ' + pdf[i].p1.x.toFixed(2) + ' ' + pdf[i].p1.y.toFixed(2); 
        let tmpch2 = ' ' + pdf[i].p2.x.toFixed(2) + ' ' + pdf[i].p2.y.toFixed(2);
        if(!retour.includes(t + tmpch2 + tmpch1)){
          retour.push(t + tmpch1 + tmpch2);
        }
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
    let delta = cT.minus(utils.centre(tt.a[i].getBounds()));
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
        case 'M':
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
function deplaceTriangle(lTriangle, depl){
  return lTriangle.map(x => x.translate(depl));
}
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
  let i12 = getpt2(i11);
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
  let angle = utils.calcTriangleAngleB(pb1, pb2, pa2);
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
    let d = utils.getTaille(tmpCumul);
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
function getpt2(p1){ return (p1 + 1) % 3; } // bouclage circulaire dans triplet
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
    let sens = a.V[n][i].sens;
    let c, cP;
    if (t < 10){
      c = "blue";
      cP = 'L';
    }else{
      if(estCoP){
        c = null;
        cP = null;
      }else{
        if(sens == 'M'){
          c = "maroon";
          cP = 'M';
        }else{
          c = "green";
          cP = 'D';
        }
      }
    }
    
    if(c !== null){
      p1 = poly.points[i];
      p2 = poly.points[getpt2(i)];
      lcag.push(color(c, cylinder({start:p1, end:p2, r:0.05})));
      lpdf.push(pushPDF(cP, p1, p2, ''));
    }
  }

  // n° Triangle
  p1 = utils.centroid(poly);
  lcag.push(color("green", nombreCentre(p1, n, false)));
  lpdf.push(pushPDF('T', p1, null, n));

  let tmp = poly.scale(gPCNumVoisin);
  tmp = tmp.translate(p1.minus(utils.centroid(tmp)));
  // n° voisins
  for(let i = 0; i < a.V[n].length; i++){
    if(a.T[n][i] < 10){ // Si le voisin est d'un type à afficher
      let c = utils.centroid({points:[tmp.points[i], tmp.points[getpt2(i)]]});
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
  let bA = a.csg.getBounds();
  let centreA = (bA[0].plus(bA[1])).dividedBy(2);
  for (let i = 0; i < a.V.length; i++){
    let ci = a.csg.polygons[i];
    let pni = ci.plane.normal;
    let ncc = 0;
    let pts1 = ci.vertices;
    for (let j = 0; j < a.V[i].length; j++){
      if (i == j){ continue; }
      if (a.V[i][j] === null){ continue;}
      if (i > a.V[i][j].T){ continue; }

      let ji = a.V[i][j].T;
      let cj = a.csg.polygons[ji];
      let ni = rechIndexVoisin(a, ji, i);
      if (pni.distanceTo(cj.plane.normal) < 0.075){
        a.V[i][j].estCoP = true;
        a.V[ji][ni].estCoP = true;
      }else{ // rech sens pli (montagne ou vallee)
        /*let pts2 = cj.vertices;
        let tri1 = trie(pts1, pts2);
        let tri2 = trie(pts2, pts1);
        let ptBC = tri1.communs;
        let ptV1 = (ptBC[0].plus(ptBC[1])).dividedBy(2);
        let ptD = tri2.uniques[0];
        let diff1 = ptV1.distanceTo(centreA);
        let diff2 = ptD.distanceTo(centreA);
        let sens = (diff1 < diff2) ? 'M' : 'V';*/
        let sens = classify(ci, cj);
        a.V[i][j].sens = sens;
        a.V[ji][ni].sens = sens;
      }
    }
  }
  return a.V;
}
// Given two triangles p1 & p2 return "mountain" or "valley".
function classify(p1, p2) {
// Find the unshared vertex in each triangle (u1 & u2).
const s1 = new Set(p1.vertices.map(v => v.pos));
const s2 = new Set(p2.vertices.map(v => v.pos));
const u1 = [...s1].filter(v => !s2.has(v))[0];
const u2 = [...s2].filter(v => !s1.has(v))[0];
const distBetweenUnsharedVertices = u1.distanceTo(u2);
const distBetweenHeadsOfPlaneNormalsFromUnsharedVertices =
u1.plus(p1.plane.normal).distanceTo(u2.plus(p2.plane.normal));
if (distBetweenUnsharedVertices < distBetweenHeadsOfPlaneNormalsFromUnsharedVertices) {
  return "M";
}
return "V";
}
function trie(t1, t2){
  let communs = [];
  let uniques = [];
  for(let i = 0; i < t1.length; i++){
    let pt1 = t1[i].pos;
    let ok = false;
    for(let j = 0; j < t2.length; j++){
      let pt2 = t2[j].pos;
      if(pt1.distanceTo(pt2) < gPrec){
        ok = true;
        communs.push(pt1);
      }
    }
    if(!ok){
      uniques.push(pt1);
    }
  }
  return {communs, uniques};
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
      let a1 = a.lPts[i][getpt2(nl)];
      for(let j = 0; j< nPolys; j++){
        if(j == i){ continue; }
        ok = false;
        for(let ml = 0; ml <=2; ml++){
          ml2 = getpt2(ml);
          let b0 = a.lPts[j][ml];
          let b1 = a.lPts[j][ml2];
          if((a0 == b0) && (a1 == b1)){
            V[i][nl] = {T:j, n1:ml2, n2:ml, estCoP:false, sens:''};
            break;
          }
          if((a0 == b1) && (a1 == b0)){
            V[i][nl] = {T:j, n1:ml, n2:ml2, estCoP:false, sens:''};
            break;
          }
        }
      }
    }
  }
  return V;
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
