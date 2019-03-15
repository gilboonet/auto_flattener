/*****************
 *  POUR v2 auto *
 *****************/
const PDFDocument = require ('pdfkit');
const fs = require ('fs');

const args = process.argv.slice(2);
let largs = args.length;
let ff;
if(largs > 0){ // 1er argument = nom fichier de sortie
  nomFichier = args[0];
  if(largs > 1){ // 2nd argument = format de sortie (A4, ...)
    taille = args[1];
    if(largs > 2){ // 2nd argument = echelle des textes
      ff = Number(args[2]);
    } else {
      ff = 1;
    }
  } else {
    taille = 'a4';
    ff = 1;
  }
} else{
  nomFichier = 'gabarit.pdf';
  taille = 'a4';
  ff = 1;
}

//sens = 'portrait';
sens = 'landscape';
try {  // charge rendu.dat
    var data = fs.readFileSync('rendu.dat', 'utf8');
} catch(e) {
    console.log('Error:', e.stack);
}
d = data.toString().split('\n');
imax = d.length;
mx = 20; my = 20;
mode = 'prod';

// Cree le document
var doc = new PDFDocument({size:taille, layout:sens, margin: 0});
ws = fs.createWriteStream(nomFichier);
doc.pipe(ws);
//doc.font("Courier");
doc.lineWidth(0.2);

// modele chiffres
const gPetit = 0.75;
var num = [
"l 0 0 h 8 v 16 h -8 v -16 m 11 0",
"m 0 8.5 l 8 -8 v 16 m 3 -16",
"m 0 4 v -4 h 8 v 8 h -8 v 8 h 8 m 3 -16",
"m 0 3 v -3 h 8 v 3 l -4 4 4 4 v 5 h -8 v -3 m 11 -13",
"m 8 8.5 h -8 l 6 -8 v 16 m 5 -16",
"m 8 0 h -8 v 8 h 8 v 8 h -8 m 11 -16",
"m 8 0 l -8 8 v 8 h 8 v -8 h -8 m 11 -8",
"h 8 l -8 16 m 11 -16",
"m 2 0 h 6 v 4 l -3 3 -4 2 v 7 h 8 v -7 l -4 -2 l -3 -3 v -4 m 9 0",
"m 8 8 h -8 v -8 h 8 v 16 h -8 m 11 -16"
], numPetit = [];
for(var i =0; i< num.length; i++){
  var tmp = num[i].split(" ");
  num[i] = tmp.map(x=> isNaN(x) ? x : Number(x)* ff).join(' ');
  numPetit[i] = tmp.map(x=> isNaN(x) ? x : Number(x * gPetit)* ff).join(' ');
}

function afficheNombre(d, x, y, n, coul, ff, angle, estPetit = false){
  var ch = 'M '+ x + ' ' + y, tmp;
  
  if(estPetit){
    tmp = n.split('').map(el => numPetit[Number(el)]);
  } else {
    tmp = n.split('').map(el => num[Number(el)]);
  }
  tmp.unshift(ch);
  ch = tmp.join(' ');
  d.save();
  d.rotate(angle, {origin:[x+11*ff/2, y+16*ff/2*n.length]}).path(ch).stroke(coul);
  d.restore();
}

// traitement des textes
var lignes = [];
var tLigne = ['dash',  'line', 'mont'];
var couls  = ['green', 'blue', 'maroon'];

for(i = 0; i < imax; i++){
  ch = d[i];
  
  if(ch.startsWith('#')){ continue; } // commentaire
  
  ct = ch.split(" ");
  if((ct[0]=='line')||(ct[0]=='dash')||(ct[0]=='mont')){
    x1 = parseFloat(ct[1])+mx;
    y1 = parseFloat(ct[2])+my;
    x2 = parseFloat(ct[3])+mx;
    y2 = parseFloat(ct[4])+my;
    lignes.push({type:ct[0], x1:x1, y1:y1, x2:x2, y2:y2});
  }
  else if((ct[0]=='textT')||(ct[0]=='textt')||(ct[0]=='textE')){
    txt = ct[1];
    n = parseInt(txt);
    x = parseFloat(ct[2]) + mx;
    y = parseFloat(ct[3]) + my;
    angle = parseFloat(ct[5]);
  }
  
  switch(ct[0]){
    case 'textT': // n° de triangle
    case 'textt': // idem grisé
      c = ct[0] == 'textT' ? 'green' : 'gainsboro';
      x = x - (txt.length *11 * ff / 2);
      y = y - (16 * ff / 2);      
      afficheNombre(doc, x, y, txt, c, ff, angle);
      break;

    case 'textE': // n° d'encoche
      x = x - (txt.length *11*gPetit * ff/2);
      //afficheNombre(doc, x, y, txt, 'black', ff*gPetit, angle, true);
      afficheNombre(doc, x, y, txt, 'black', ff, angle);
      break;
      
    case 'page': // ajouter une page
    case 'fin':
      // ajout des lignes
      for(var t = 0; t < tLigne.length; t++){
        var L = lignes.filter(el => el.type == tLigne[t]);
        var rL = [];
        if(L.length > 0){
          // reorganise L
          var p = L.shift();
          rL.push(p);
          var pp = p;
          var np = rL.length -1;
          while(L.length > 0){
            pIndex = L.findIndex(el=> (el.x1 == p.x2) && (el.y1 == p.y2));
            // ajout des suivants
            while (pIndex > -1){
              //if(pIndex == -1){ pIndex = 0;}
              p = L[pIndex];
              L.splice(pIndex, 1);
              rL.push(p);
              pIndex = L.findIndex(el=> (el.x1 == p.x2) && (el.y1 == p.y2));
            }
            // ajout des prédédents
            p = pp;
            pIndex = L.findIndex(el=> (el.x2 == p.x1) && (el.y2 == p.y1));
            while(pIndex > -1){
              p = L[pIndex];
              L.splice(pIndex, 1);
              rL.splice(np, 0, p);
              pIndex = L.findIndex(el=> (el.x2 == p.x1) && (el.y2 == p.y1));
            }
            // ajout du prochain
            if(L.length > 0){
              var p = L.shift();
              rL.push(p);
              var pp = p;
              var np = rL.length -1;
            }
          }
          var chemin = '';
          for(var j =0; j< rL.length; j++){
            if( (j == 0) || 
                ( (j>0)&&((rL[j-1].x2 != rL[j].x1)||(rL[j-1].y2 != rL[j].y1)))){
              chemin = chemin + ' M ' + rL[j].x1 + ',' + rL[j].y1;
            }
            chemin = chemin + ' L ' + rL[j].x2 + ',' + rL[j].y2;
          }
          doc.path(chemin);
          switch(t){
            case 0: doc.dash(2, {space:10}); break;
            case 1: doc.undash(); break;
            case 2: doc.dash(5, {space:10}); break;
          }
          doc.stroke(couls[t]);
        }
      }
      if(ct[0] == 'page'){ doc.addPage().lineWidth(0.2);}
      lignes = [];
      break;
  }
}

// Finalize PDF file
doc.end()
//}
