/*********************************************
 * DEPLIAGE v2                               *
 * - Modèle 3D :MARY 150 faces (format .OFF) *
 *********************************************/
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
    { name: 't1', type: 'number', initial:'0', caption: '#1:' },
    { name: 't2', type: 'number', initial:'0', caption: '#2:' }
  ];
}
function poseAuSol(csg){ // pose le solide sur l'axe Z
    var b, d;
    
    b = csg.getBounds();
    d = b[1].minus(b[0]).dividedBy(2);
    return csg.translate([0, 0,-b[1].z+2*d.z]);
}
function csgFromSegments (segments) {
  let output = [];
  segments.forEach(segment => output.push(
    rectangular_extrude(segment, { w:2, h:1 })
  ));
  return union(output);
}
function getTaille(g){
  let b = g.getBounds();
  return b[1].minus(b[0]);
}

function main(params){
  let a = lit_off(fichier());
  a.csg = poseAuSol(a.csg);
  
  let r = [];
  let t1 = params.t1;
  let t2 = params.t2;
  let sens;
  
  if(t1 != t2){
    let p1 = a.csg.polygons[t1];
    let p2 = a.csg.polygons[t2];
    r.push(color("blue", new CSG.fromPolygons([p1])));
    r.push(color("red", new CSG.fromPolygons([p2])));
/*    
    let ab = a.csg.getBounds();
    let centre = (ab[0].plus(ab[1])).dividedBy(2);

    let pts1 = p1.vertices;
    let pts2 = p2.vertices;
    tri1 = trie(pts1, pts2);
    tri2 = trie(pts2, pts1);
    ptBC = tri1.communs;
    ptV1 = (ptBC[0].plus(ptBC[1])).dividedBy(2);
    ptA = tri1.uniques[0];
    ptD = tri2.uniques[0];
    ptV2 = (ptA.plus(ptD)).dividedBy(2);
    diff1 = ptV1.distanceTo(centre);
    diff2 = ptD.distanceTo(centre);
    
    r.push(color("maroon", cylinder({start:centre, end:ptV1, r1:0, r2:0.5})));
    r.push(color("green", cylinder({start:centre, end:ptD, r1:0, r2:0.5})));
*/

    sens = sensPli(p1, p2);
    /*if(sens == -1){
      console.log("pli montagne");
    }else{
      console.log("pli vallée");
    }*/
  }
  let cs = (sens == -1) ? [1,0,0,0.5] : [0,1,0,0.5];
  r.push(color(cs, a.csg));
  
return r;
}

function trie(t1, t2){
  let communs = [];
  let uniques = [];
  let ok;
  for(let i = 0; i < t1.length; i++){
    pt1 = t1[i].pos;
    ok = false;
    for(let j = 0; j < t2.length; j++){
      pt2 = t2[j].pos;
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

function sensPli(p1, p2){
  // From Ami Fishman
  // triangle p1: (a, b, c) - triangle p2: (b, c, d)
  // trouver d (pt non partagé de p2)
  // dist(d, v) < dist(d, v.plus(w)) indicates a "mountain" while
  // dist(d, v) > dist(d, v.plus(w)) indicates a valley.
  let ok;
  let d;
  for(let i = 0; i < p2.vertices.length; i++){
    let pt2 = p2.vertices[i].pos;
    ok = false;
    for(let j = 0; j < p1.vertices.length; j++){
      let pt1 = p1.vertices[j].pos;
      if(pt2.distanceTo(pt1)< gPrec){ ok = true; }
    }
    if(ok == false){ d = pt2; }
  }
  let v = p1.plane.normal;
  //let w = p1.plane.normal.unit().times(p1.plane.w);
  let w = p1.plane.normal.unit();
  let d1 = d.distanceTo(v);
  let d2 = d.distanceTo(v.plus(w));
  if(d1 < d2){
    return 1;
  }else{
    return -1;
  }
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
77 150 0
1.683531 17.08118 8.702868 
4.269698 15.98075 -8.13061 
-4.20883 21.08179 -9.279742 
8.212344 12.66209 6.508863 
7.903306 13.26568 24.3126 
2.468824 16.89032 54.11567 
6.903355 14.23787 50.07095 
-7.242036 17.90087 -3.045658 
0.9737777 18.12791 62.07397 
-6.320526 20.36473 24.9027 
-7.146102 21.10178 41.5194 
-7.392631 20.83382 59.75484 
6.537899 12.12664 69.22875 
-3.491883 18.41695 69.28925 
-9.124445 18.08537 22.96147 
6.383527 10.00427 7.294143 
7.958084 10.2124 43.1045 
-8.010155 18.6106 67.56001 
1.966861 11.54808 87.79832 
-9.608145 19.12004 33.81339 
10.3859 7.407311 46.60295 
8.003547 8.179536 -0.9334669 
-13.04075 19.07528 -10.17724 
-5.903911 15.73244 76.5134 
8.172747 8.046753 15.37944 
-12.52793 17.94272 6.194672 
-13.7251 18.41998 29.50521 
-14.25848 18.76815 49.30115 
3.23741 6.498552 74.41763 
-3.596027 14.70936 86.82042 
7.9527 3.057366 37.21258 
-12.99793 13.30042 -2.585117 
-12.24246 10.84257 15.01927 
-4.127238 4.085791 88.71605 
8.391512 2.163782 22.23913 
0.3894345 5.070486 80.24023 
-15.64746 15.6657 14.76853 
8.696293 1.328976 -10.71952 
2.758454 2.118053 3.503026 
5.174548 3.825703 9.711727 
8.39025 2.738845 61.4733 
-15.49454 14.7531 49.2333 
-12.01538 -2.087879 -8.566502 
-17.61609 7.206097 -10.4962 
-15.52189 16.22444 32.73922 
-8.813493 12.03654 74.30943 
7.342918 -1.829219 32.4799 
-8.464625 6.331419 67.84123 
-10.68601 6.129103 -1.461192 
2.913093 0.9693544 25.26503 
-2.567425 -0.9037856 63.02314 
-3.859874 2.675879 7.134622 
3.918972 -1.008169 54.01537 
3.446312 -1.973872 59.40375 
-8.552197 4.507306 11.10602 
-12.26662 9.0214 19.49428 
-16.62097 10.41895 53.53345 
-16.96198 11.75968 38.08247 
1.491806 -2.517482 32.47258 
3.290339 -0.7761675 33.52551 
1.154248 -2.186282 -2.2835 
-15.90652 14.37852 63.16669 
-18.36569 7.656655 37.6427 
2.761564 -4.319904 40.99866 
-5.555971 4.668016 62.57296 
-7.81851 1.034992 68.74628 
-6.77225 2.358009 19.09198 
-1.594581 2.378424 56.05797 
-3.757883 -2.96557 23.29283 
-12.40039 3.13057 19.06586 
-3.304897 -0.855716 35.13401 
-11.95408 5.000937 31.54039 
-10.03931 7.373915 56.2787 
-13.81425 3.84535 43.0028 
-12.47583 4.832372 60.64503 
-2.336864 -3.062851 45.83651 
-7.481591 1.719639 44.32368 
3 0 1 2
3 3 21 1
3 0 3 1
3 0 9 5
3 0 4 3
3 4 5 6
3 0 5 4
3 2 9 0
3 10 5 9
3 5 11 8
3 12 5 8
3 12 6 5
3 5 10 11
3 4 6 16
3 8 13 12
3 10 9 14
3 21 3 15
3 15 3 4
3 8 17 13
3 12 16 6
3 13 29 18
3 4 16 15
3 2 14 9
3 11 19 17
3 11 17 8
3 16 12 20
3 19 11 10
3 7 14 2
3 21 15 24
3 14 19 10
3 7 2 22
3 29 13 23
3 15 16 24
3 13 18 12
3 23 13 17
3 20 24 16
3 22 31 7
3 19 27 17
3 7 26 14
3 12 40 20
3 19 14 26
3 26 7 25
3 24 20 30
3 17 61 23
3 12 18 28
3 61 17 27
3 12 28 40
3 32 25 7
3 30 20 40
3 19 26 41
3 33 18 29
3 32 7 31
3 28 18 35
3 34 24 30
3 25 36 26
3 19 41 27
3 38 37 21
3 44 41 26
3 61 45 23
3 39 24 34
3 39 38 21
3 25 32 36
3 21 24 39
3 36 44 26
3 29 23 45
3 42 43 37
3 46 34 30
3 36 32 55
3 18 33 35
3 28 53 40
3 45 28 35
3 49 39 34
3 36 55 44
3 33 29 45
3 41 44 57
3 47 28 45
3 61 27 56
3 34 59 49
3 46 30 40
3 50 28 47
3 33 45 35
3 27 41 56
3 38 51 60
3 59 34 46
3 41 57 56
3 53 52 40
3 46 40 52
3 57 44 55
3 55 32 54
3 48 54 32
3 49 59 58
3 46 52 59
3 32 31 48
3 49 68 39
3 57 62 56
3 37 38 60
3 50 47 65
3 72 64 74
3 51 66 54
3 59 52 63
3 48 51 54
3 76 67 64
3 38 66 51
3 48 60 51
3 67 50 64
3 74 64 65
3 43 48 31
3 53 28 50
3 39 68 38
3 74 73 72
3 58 59 63
3 64 72 76
3 54 69 55
3 66 70 76
3 67 76 70
3 76 72 71
3 38 68 66
3 61 74 45
3 62 73 56
3 74 47 45
3 61 56 74
3 57 55 71
3 71 72 73
3 69 54 66
3 52 75 63
3 58 70 49
3 65 64 50
3 50 67 75
3 47 74 65
3 55 69 71
3 68 49 70
3 71 62 57
3 52 53 50
3 67 70 75
3 22 2 43
3 52 50 75
3 66 76 69
3 62 71 73
3 58 63 75
3 48 43 42
3 68 70 66
3 58 75 70
3 71 69 76
3 60 48 42
3 73 74 56
3 1 37 43
3 2 1 43
3 37 60 42
3 31 22 43
3 1 21 37
`;
}
