/******************************
 * convertit STL ascii en OFF *
 ******************************/

const fs = require('fs');

const args = process.argv.slice(2)
let largs = args.length
let nomFichierEntree

const ext_stl = '.stl'
const ext_jscad = '.jscad'

if(largs < 1){
  console.log("ERREUR : Fichier STL manquant")
  process.exit()
}

nomFichierEntree = args[0]
if(nomFichierEntree.slice(-4).toLowerCase() != ext_stl){
  //nomFichierSortie = nomFichierEntree + ext_jscad
  nomFichierEntree = nomFichierEntree + ext_stl
}
nomFichierSortie = 'modele_stl.jscad';

try { // charge le fichier
  var data = fs.readFileSync(nomFichierEntree, 'utf8');
}
catch(e) {
  console.log('Erreur:', e.stack);
}

let d = data.toString().split(/\n/);

// recherche solid + endsolid
let solid = d[0];
if(!solid.startsWith('solid ')){
  console.log('solid manquant!');
  return;
}
//let endsolid = 'endsolid ';
let lFin = d.findIndex(function(element) {
  return element.startsWith('endsolid ');
});
if(lFin == -1){
  console.log('endsolid manquant!');
  return;
}

let l = 1;
let nbFaces = 0;
let v = [];
let pts = [];
let faces = [];
while(l < lFin){
  // ligne l    : facet normal x y z
  // ligne l+1  : outer loop
  // ligne l+2 +3 +4 : vertex x y z
  // ligne l+5  : endloop
  // ligne l+6  : endfacet
  let tmpFace = [];
  for(let i = 0; i < 3; i++){
    let tmp = d[l+i+2].trim().split(/\s/);
    tmp.shift(); // supprime 'vertex'
    v = tmp.filter(x => x.trim()).map(Number);
    vo = {x:v[0], y:v[1], z:v[2]};
    let n = pts.findIndex(a => 
              (a[0] === vo.x) && (a[1] === vo.y) && (a[2] === vo.z));
    if (n == -1)
      n = pts.push(v) -1;
    tmpFace.push(n);
  }
  faces.push(tmpFace);
  nbFaces++;
  l+=7;
}
let sortie = [];
sortie.push('volume = function () {');
sortie.push('let faces =' + JSON.stringify(faces) +',');
sortie.push('pts = ' + JSON.stringify(pts) + ',');
sortie.push('fCsg = faces.map(m => CSG.Polygon.createFromPoints(m.map(n => pts[n]))),');
sortie.push('csg = CSG.fromPolygons(fCsg);');
sortie.push('return {lPts:faces, lVtx:pts, csg:csg, fCsg:fCsg};');
sortie.push('};');

try {
  const data = fs.writeFileSync(nomFichierSortie, sortie.join('\n'))
} catch (err) {
  console.error('ERREUR: ECRITURE FICHIER', err)
}
