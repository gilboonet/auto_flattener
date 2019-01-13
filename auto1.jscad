/**********************************************
 * DEPLIAGE v2                                *
 * - Modèle 3D :ICOSA 120 faces (format .OFF) *
 * - Modèle 3D :TDY   236 faces (format .OFF) *
 **********************************************/
const gep_bord = 0.05,
gln = '#' + '-'.repeat(25),
gPrec = 0.01,
gPCNumVoisin = 0.7,
gTaillePage = {x:210, y:297}, gEchPDF = 2.65;

var _num = [], _nb = [], gLAff = [], _gTextScale = 0.25;
const vXp_NON_PRESENT = 0, vXp_SEPARE = 1, 
      vXp_LIE = 10, vXp_LIE_COPLANAIRE = 11;

function getParameterDefinitions() {
  return [
    { name: 'triangle', type: 'text', initial:'0', caption: 'Départ(s):' },
    { name: 'echelle', type: 'number', initial:'1', caption: 'Echelle:' },
    { name: 'echTexte', type: 'number', initial:'0.25', caption: 'Taille txt:' },
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
  a.nom = 'ICOSA';
  //a.nom = 'TDY';
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
    r.cag.push(R.cag.flat()); 
    r.pdf.push(R.pdf.flat()); 
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
  console.log(sortie.flat().join('\n'));

  //afficheTempsCalcul(msDebut);
  //console.log('# nb Pages:', r.cag.length);

  if(params.mode == 'dev'){
    return r.cag.flat();
  }else
    return cube(1);
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
  //console.log('# T.',n, ':', nbF, 't.');

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
62 120 0
1.295835e-18 2.327438 1.776357e-17 
2.081724 1.040862 1.776357e-17 
0.6432881 1.040862 1.979837 
-1.68415 1.040862 1.223607 
-1.68415 1.040862 -1.223607 
0.6432881 1.040862 -1.979837 
-2.081724 -1.040862 -8.881784e-18 
-0.6432881 -1.040862 -1.979837 
1.68415 -1.040862 -1.223607 
1.68415 -1.040862 1.223607 
-0.6432881 -1.040862 1.979837 
1.90594e-17 -2.327438 -1.776357e-17 
1.194746 1.93314 0 
0.3691969 1.93314 1.136271 
-0.9665701 1.93314 0.7022542 
-0.9665701 1.93314 -0.7022542 
0.3691969 1.93314 -1.136271 
1.563943 1.194746 1.136271 
1.563943 1.194746 -1.136271 
2.161316 0 -0.7022542 
2.161316 0 0.7022542 
-0.5973731 1.194746 1.838526 
1.335767 0 1.838526 
0 0 2.272542 
-1.93314 1.194746 0 
-2.161316 0 0.7022542 
-1.335767 0 1.838526 
-0.5973731 1.194746 -1.838526 
-2.161316 0 -0.7022542 
-1.335767 0 -1.838526 
0 0 -2.272542 
1.335767 0 -1.838526 
-1.563943 -1.194746 -1.136271 
-1.563943 -1.194746 1.136271 
-1.194746 -1.93314 0 
0.5973731 -1.194746 -1.838526 
-0.3691969 -1.93314 -1.136271 
1.93314 -1.194746 0 
0.9665701 -1.93314 -0.7022542 
0.5973731 -1.194746 1.838526 
0.9665701 -1.93314 0.7022542 
-0.3691969 -1.93314 1.136271 
1.113516 1.801707 0.809017 
-0.4253254 1.801707 1.309017 
-1.376382 1.801707 0 
-0.4253254 1.801707 -1.309017 
1.113516 1.801707 -0.809017 
-1.801707 -0.4253254 -1.309017 
1.801707 0.4253254 1.309017 
0.6881909 -0.4253254 -2.118034 
-0.6881909 0.4253254 2.118034 
2.227033 -0.4253254 0 
-2.227033 0.4253254 0 
0.6881909 -0.4253254 2.118034 
-0.6881909 0.4253254 -2.118034 
-1.801707 -0.4253254 1.309017 
1.801707 0.4253254 -1.309017 
-1.113516 -1.801707 0.809017 
-1.113516 -1.801707 -0.809017 
0.4253254 -1.801707 -1.309017 
1.376382 -1.801707 0 
0.4253254 -1.801707 1.309017 
3 0 13 12
3 0 14 13
3 0 15 14
3 0 16 15
3 1 12 17
3 1 19 18
3 1 20 19
3 2 13 21
3 2 17 13
3 2 23 22
3 3 14 24
3 3 21 14
3 4 15 27
3 4 24 15
3 4 29 28
3 5 18 31
3 5 27 16
3 5 31 30
3 6 28 32
3 6 34 33
3 7 30 35
3 7 32 29
3 8 19 37
3 8 31 19
3 8 35 31
3 9 22 39
3 9 37 20
3 10 33 41
3 10 39 23
3 11 41 34
3 12 16 0
3 13 17 42
3 14 21 43
3 15 24 44
3 16 18 5
3 16 27 45
3 17 20 1
3 18 12 1
3 18 16 46
3 19 31 56
3 20 22 9
3 20 37 51
3 21 23 2
3 22 17 2
3 22 20 48
3 23 26 10
3 23 39 53
3 24 25 3
3 25 26 3
3 25 28 6
3 26 21 3
3 26 23 50
3 26 33 10
3 27 29 4
3 28 24 4
3 28 25 52
3 29 30 7
3 29 32 47
3 30 27 5
3 30 29 54
3 31 35 49
3 32 34 6
3 33 25 6
3 33 26 55
3 34 36 11
3 34 41 57
3 35 36 7
3 36 32 7
3 36 34 58
3 36 38 11
3 37 38 8
3 38 35 8
3 38 36 59
3 38 40 11
3 39 40 9
3 40 37 9
3 40 38 60
3 40 41 11
3 41 39 10
3 41 40 61
3 42 12 13
3 42 17 12
3 43 13 14
3 43 21 13
3 44 14 15
3 44 24 14
3 45 15 16
3 45 27 15
3 46 12 18
3 46 16 12
3 47 28 29
3 47 32 28
3 48 17 22
3 48 20 17
3 49 30 31
3 49 35 30
3 50 21 26
3 50 23 21
3 51 19 20
3 51 37 19
3 52 24 28
3 52 25 24
3 53 22 23
3 53 39 22
3 54 27 30
3 54 29 27
3 55 25 33
3 55 26 25
3 56 18 19
3 56 31 18
3 57 33 34
3 57 41 33
3 58 32 36
3 58 34 32
3 59 35 38
3 59 36 35
3 60 37 40
3 60 38 37
3 61 39 41
3 61 40 39
`;
}
function fichierTDY(){// copier-coller de fichier 3D au format .OFF
	return `OFF
120 236 0
10.15038 -21.79561 3.972423 
6.128283 1.070933 4.012395 
15.73894 -19.91494 4.259407 
4.487398 -5.992334 4.003177 
-7.202734 0.5333713 4.075795 
-4.482864 -7.003459 4.024944 
-10.15029 -21.79565 3.972605 
-15.72979 -19.91756 4.229756 
14.551 -12.28934 6.463836 
10.76298 -1.36878 9.195963 
5.764264 -19.92875 7.902763 
2.346502 4.885339 4.004436 
4.320348 6.954203 8.907577 
9.472825 3.573525 9.538837 
-9.472825 3.573525 9.538837 
-4.247551 6.346508 6.603807 
-5.764449 -19.92893 7.90287 
-14.81032 -12.42584 9.357927 
2.232103 12.20453 6.662509 
-4.24603 9.750993 4.827477 
2.991124 -10.13578 9.416736 
6.43918 -9.759279 13.91706 
13.2691 -12.9982 13.36698 
18.62351 -15.70903 8.458076 
16.97139 -15.61952 18.0741 
8.261781 -18.35408 20.04078 
7.042172 -15.7078 12.88952 
18.26717 -19.02368 14.79976 
7.347226 -22.9973 13.66591 
12.12873 -20.91123 20.75879 
11.15087 -0.404856 12.71499 
10.55204 -4.859673 22.03741 
0 -10.93486 18.88985 
9.913552 4.270247 19.6821 
-11.15089 -0.4035865 12.71465 
-10.3398 3.95791 18.72829 
-10.72688 -2.135863 10.02528 
-4.875074 4.907337 33.76081 
-6.071596 7.17884 19.41313 
1.041786 6.931574 34.04704 
7.722606 2.138701 34.83724 
6.084542 7.160394 19.45585 
2.922977 -4.792564 32.51565 
3.019397 -8.46415 28.27425 
-4.0236 -3.997287 32.92401 
-6.432688 -7.927584 24.39408 
0.0390022 8.433691 13.04866 
-10.54482 -4.368904 27.84898 
-16.52966 -2.000722 8.73462 
-14.74249 4.191605 10.44203 
-11.02228 4.995775 28.28519 
-11.16883 -4.839063 18.65768 
0 10.49092 38.28888 
6.16435 8.951387 38.28888 
-8.394613 7.772336 38.25528 
14.82571 4.176893 10.34414 
11.14636 5.34562 26.48678 
14.65348 -4.624963 14.77645 
13.15298 -3.976523 25.46607 
16.77373 -1.658743 8.697367 
-5.666435 -13.26734 36.77138 
1.97932 -14.17522 35.00432 
0.6141177 -17.17795 41.42042 
-8.445187 -0.2769429 35.02816 
-14.00436 0.6482446 27.56436 
-18.0261 2.775787 12.96146 
-17.27201 -2.890878 17.60848 
-6.74177 -9.995467 36.91165 
-12.38194 -3.238303 38.33966 
-10.33567 -1.363042 62.0269 
-6.552445 -4.271188 57.39831 
-6.680452 1.232282 57.67129 
-15.7693 -3.74235 51.33794 
-13.69839 -1.129882 45.96655 
-11.49083 -1.907915 52.58408 
-19.67952 -0.9086435 54.02721 
-15.63604 0.7605822 60.56674 
-11.74768 1.594364 53.0517 
-13.416 2.592548 47.94775 
-14.13576 -3.006421 58.28336 
-11.81139 -7.101575 45.40725 
-7.877664 -8.754862 52.96355 
0 -1 59.64323 
-6.108696 -12.27107 42.81891 
0 -11.56829 52.52524 
0.2211659 -13.37333 44.02964 
0 11.20315 45.40725 
6.819225 9.568287 45.40725 
11.81139 5.101575 45.40725 
10.67717 4.745462 38.28888 
13.71702 -1.175628 47.40654 
12.1076 -3.706351 38.20571 
11.81139 -7.101575 45.40725 
-6.819225 9.568287 45.40725 
-3.672594 9.282148 52.60968 
7.072323 7.556807 52.52201 
7.906111 -8.722258 53.01292 
5.649355 -12.47584 41.90928 
-0.6379669 5.050264 58.22019 
7.777568 1.199278 57.21515 
2.775999 -6.251514 58.14665 
17.18863 0.6330395 49.97467 
7.309149 -3.170138 56.62635 
16.34022 0.6639491 60.27008 
12.38891 -2.528522 61.25311 
16.66709 -3.97948 52.18123 
7.074541 -3.078092 34.22667 
11.74748 0.7564599 31.59035 
17.35786 0.5952135 19.26001 
17.66984 3.224008 13.66788 
-3.088978 -9.827249 9.449183 
-6.556606 -8.942047 13.48783 
-16.97139 -15.61952 18.0741 
-12.12873 -20.91123 20.75879 
-8.261781 -18.35408 20.04078 
-7.347226 -22.9973 13.66591 
-18.26717 -19.02368 14.79976 
-18.62351 -15.70903 8.458076 
-7.042172 -15.7078 12.88952 
-11.82272 -13.78308 13.97016 
3 0 1 2
3 0 3 1
3 4 5 6
3 7 4 6
3 8 1 9
3 8 2 1
3 3 0 10
3 11 12 13
3 11 13 1
3 4 14 15
3 16 6 5
3 4 7 17
3 18 11 19
3 20 3 10
3 9 21 22
3 2 8 23
3 23 22 24
3 24 22 25
3 22 26 25
3 26 10 25
3 23 8 22
3 10 26 20
3 26 21 20
3 26 22 21
3 22 8 9
3 27 2 23
3 10 0 28
3 28 0 2
3 28 2 27
3 28 27 29
3 27 23 24
3 27 24 29
3 29 25 28
3 28 25 10
3 24 25 29
3 9 30 31
3 3 11 1
3 1 13 9
3 5 3 20
3 31 21 9
3 21 32 20
3 13 33 30
3 13 30 9
3 14 34 35
3 34 14 36
3 35 37 38
3 33 39 40
3 39 33 41
3 42 43 31
3 43 42 44
3 43 44 45
3 38 37 39
3 11 3 5
3 11 4 15
3 12 41 33
3 12 33 13
3 14 35 38
3 14 38 15
3 46 39 41
3 31 43 21
3 21 43 32
3 32 43 45
3 38 39 46
3 47 45 44
3 34 48 49
3 49 50 35
3 35 34 49
3 51 45 47
3 50 37 35
3 39 52 53
3 37 54 52
3 37 52 39
3 55 33 56
3 33 55 30
3 31 30 57
3 57 58 31
3 55 59 30
3 33 40 56
3 31 58 42
3 60 61 62
3 50 63 37
3 47 63 64
3 47 44 63
3 48 65 49
3 65 48 66
3 48 51 66
3 48 34 51
3 49 65 50
3 65 64 50
3 65 66 64
3 66 51 47
3 66 47 64
3 50 64 63
3 63 44 67
3 68 63 67
3 54 37 63
3 68 54 63
3 69 70 71
3 72 73 74
3 72 75 73
3 76 77 78
3 77 76 71
3 73 75 78
3 70 79 74
3 74 79 72
3 69 79 70
3 69 71 76
3 69 76 79
3 76 75 79
3 75 76 78
3 75 72 79
3 80 81 74
3 73 80 74
3 70 74 81
3 71 70 82
3 81 83 84
3 84 83 85
3 52 86 87
3 52 87 53
3 53 87 88
3 53 88 89
3 89 88 90
3 89 90 91
3 91 90 92
3 68 80 73
3 68 73 78
3 68 78 54
3 54 78 93
3 54 93 86
3 54 86 52
3 86 94 95
3 86 95 87
3 87 95 88
3 92 96 97
3 83 81 80
3 78 77 94
3 78 94 93
3 93 94 86
3 94 98 95
3 95 98 99
3 96 100 84
3 84 100 70
3 84 70 81
3 77 71 98
3 77 98 94
3 82 99 98
3 82 70 100
3 82 98 71
3 90 88 101
3 99 101 88
3 88 95 99
3 92 90 96
3 102 100 96
3 90 102 96
3 100 99 82
3 99 100 102
3 103 104 105
3 104 103 99
3 105 101 103
3 90 105 104
3 102 90 104
3 101 99 103
3 90 101 105
3 104 99 102
3 97 106 91
3 91 92 97
3 80 67 83
3 80 68 67
3 60 44 61
3 67 44 60
3 61 42 106
3 83 60 62
3 61 44 42
3 61 97 62
3 106 97 61
3 83 67 60
3 85 83 62
3 85 62 97
3 40 53 89
3 39 53 40
3 91 40 89
3 91 106 40
3 56 40 107
3 108 107 58
3 56 107 108
3 108 58 57
3 109 56 108
3 55 56 109
3 59 57 30
3 59 108 57
3 109 108 59
3 59 55 109
3 58 106 42
3 106 58 107
3 107 40 106
3 84 97 96
3 85 97 84
3 34 36 51
3 5 4 11
3 20 110 5
3 36 14 4
3 111 32 45
3 32 111 110
3 20 32 110
3 111 45 51
3 51 36 111
3 112 113 114
3 115 16 114
3 113 115 114
3 116 113 112
3 116 112 117
3 115 113 116
3 115 116 7
3 115 7 6
3 16 115 6
3 116 117 7
3 118 111 119
3 118 110 111
3 16 110 118
3 17 36 4
3 118 114 16
3 119 114 118
3 112 114 119
3 112 119 17
3 117 112 17
3 7 117 17
3 36 17 119
3 111 36 119
3 5 110 16
3 12 46 41
3 38 46 15
3 18 19 46
3 11 15 19
3 15 46 19
3 11 18 12
3 18 46 12
`;
}
