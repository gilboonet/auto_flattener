/**************************
 *  POUR v2.6 auto puzzle *
 **************************/
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
txt_x = 10.5; txt_y = 18;

// Cree le document
var doc = new PDFDocument({size:taille, layout:sens, margin: 0});
ws = fs.createWriteStream(nomFichier);
doc.pipe(ws);
//doc.font("Courier");
doc.lineWidth(1);

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

function afficheNombre(d, x, y, n, coul, ff, angle, estEncoche){
  var dx, dy, ddy, ch, tmp;
  
  if(estEncoche){
    dx = txt_x * ff * n.length / 2;

    /*if(ff == 1){ddy = 1}
    else if(ff == 0.75){ddy = -1}
    else if(ff == 0.6){ddy = 0}
    else if(ff == 0.5){ddy = 1}*/

    dy = txt_y * ff + 1; //ddy
  }else{
    dx = 0;
    dy = 0;
  }
  ch = 'M ' + (x - dx) + ' ' + (y - dy);
  tmp = n.split('').map(el => num[Number(el)]);
  tmp.unshift(ch);
  ch = tmp.join(' ');
  d.save();
  d.rotate(angle, {origin:[x,y]});
  d.fillColor('yellow').text(n.toString().padStart(3,'0'), x-dx, y-dy);
  d.path(ch).stroke(coul);
  d.restore();
}

function milieu (p1x, p1y, p2x, p2y){
  return {x : (p1x + p2x)/2, y: (p1y + p2y)/2};
}

function distance (p1x, p1y, p2x, p2y){
  return Math.sqrt(((p2x - p1x) * (p2x - p1x)) + ((p2y - p1y) * (p2y - p1y)));
}

function calcAngle(cx, cy, ex, ey) {
  var dy = ey - cy;
  var dx = ex - cx;
  var theta = Math.atan2(dy, dx); // range (-PI, PI]
  theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
  //if (theta < 0) theta = 360 + theta; // range [0, 360)
  return theta;
}

function faitLigne(d, p1x, p1y, p2x, p2y, sens, delta){
  var a = calcAngle(p1x, p1y, p2x, p2y);
  var di = distance(p1x, p1y, p2x, p2y), d9 = di / 9;
  var p3,p4,p31,p32,p33,p24,p35,p36,p37,p38,h = 20, dk = 0.66;

  p3 = {x: p1x, y:p1y};
  p4 = {x:p3.x + di, y:p3.y}; 

  if(Math.abs(sens) == 1){
    sens = 1;
  } else {
    sens = -1;
  }
  if(di< 75){
    h = h/2;
  }else if(di<150){
    h = h/3*2;
  }
  p31 = {x: p1x + d9 *(2+dk), y: p1y};
  p32 = {x: p1x + d9 *(1.25+dk), y: p1y + h * sens};
  p33 = {x: p1x + d9 *(3.75+dk), y: p1y + h * sens};
  p34 = {x: p1x + d9 *(3+dk), y: p1y};
  p35 = {x: p1x + d9 *(6-dk), y: p1y};
  p36 = {x: p1x + d9 *(5.25-dk), y: p1y - h * sens};
  p37 = {x: p1x + d9 *(7.75-dk), y: p1y - h * sens};
  p38 = {x: p1x + d9 *(7-dk), y: p1y};

  d.save();
  d.rotate(a, {origin:[p3.x, p3.y]})
  d.moveTo(p3.x, p3.y).lineTo(p31.x, p31.y)
  d.lineTo(p32.x, p32.y);
  d.lineTo(p33.x, p33.y);
  d.lineTo(p34.x, p34.y);
  d.lineTo(p35.x, p35.y);
  d.lineTo(p36.x, p36.y);
  d.lineTo(p37.x, p37.y);
  d.lineTo(p38.x, p38.y);
  d.lineTo(p4.x, p4.y);

  d.stroke('red');
  d.restore();
}

function faitLigneOLD(d, p1x, p1y, p2x, p2y, sens, delta){
  var a = calcAngle(p1x, p1y, p2x, p2y);
  var di = distance(p1x, p1y, p2x, p2y);
  var pM,p3,p3,pM2,p5,p6,p7,p8, dec;

  var m = di < 100 ? 1.5 : (di < 200) ? 2 : 2.5;
  var nb = Math.floor((di-(5*m)) / (19*m));
  p3 = {x: p1x, y:p1y};
  p4 = {x:p3.x + di, y:p3.y};
  //pM = milieu(p3.x, p3.y, p4.x, p4.y);
  dec = (di -((19*m) * (nb-1)) + (8*m))/2;
  pM = {x:p3.x + dec-(4*m), y:p3.y};
  //console.log(di, nb);

  p5 = {x:pM.x-4*m, y:pM.y};
  p6 = {x:pM.x+4*m, y:pM.y};
  p7 = {x:pM.x+6*m, y:pM.y+7.5*sens*m};
  p8 = {x:pM.x-6*m, y:pM.y+7.5*sens*m};

  d.save();
  d.rotate(a, {origin:[p3.x, p3.y]})
  d.moveTo(p3.x, p3.y).lineTo(p5.x, p5.y)
  d.lineTo(p8.x, p8.y);
  d.lineTo(p7.x, p7.y);
  d.lineTo(p6.x, p6.y);

  for(var i = 1; i < nb; i++){
    pM = {x:p6.x+15*m, y:p6.y};
    p5 = {x:pM.x-4*m, y:pM.y};
    p6 = {x:pM.x+4*m, y:pM.y};
    p7 = {x:pM.x+6*m, y:pM.y+7.5*sens*m};
    p8 = {x:pM.x-6*m, y:pM.y+7.5*sens*m};
    d.lineTo(p5.x, p5.y);
    d.lineTo(p8.x, p8.y);
    d.lineTo(p7.x, p7.y);
    d.lineTo(p6.x, p6.y);
  }  
  d.lineTo(p4.x, p4.y);

  d.stroke('red');
  d.restore();
}

// traitement des textes
var lignes = [];
var tLigne = ['dash',  'line', 'mont'];
var couls  = ['green', 'blue', 'maroon'];

var ET = [];

for(i = 0; i < imax; i++){
  ch = d[i];
  
  if(ch.startsWith('#')){ continue; } // commentaire
  
  ct = ch.split(" ");
  if((ct[0]=='line')||(ct[0]=='dash')||(ct[0]=='mont')){
    x1 = parseFloat(ct[1])+mx;
    y1 = parseFloat(ct[2])+my;
    x2 = parseFloat(ct[3])+mx;
    y2 = parseFloat(ct[4])+my;
    id = ct[5];
    if (ct[0] == 'line'){
      if(ct.length > 6){
        dk = parseFloat(ct[6]);
      }else{
        dk = 0;
      }
      if(ct.length > 7){
        sens = parseInt(ct[7]);
      }else{
        sens = ET.findIndex(item => item.id == id) > -1 ? -1 : 1;
      }
      faitLigne(doc, x1, y1, x2, y2, sens, dk);
      ET.push({id:id, sens:sens});
    } else {
      lignes.push({type:ct[0], x1:x1, y1:y1, x2:x2, y2:y2});
    }
  }
  else if((ct[0]=='textT')||(ct[0]=='textt')||(ct[0]=='textE')||(ct[0]=='textTE')){
    txt = ct[1];
    n = parseInt(txt);
    x = parseFloat(ct[2]) + mx;
    y = parseFloat(ct[3]) + my;
    angle = parseFloat(ct[5]);
  }
  
  switch(ct[0]){
    case 'textT': // n° de triangle
    case 'textt': // idem grisé
    case 'textTE': // n° triangle déplacé en encoche
      c = ct[0] != 'textt' ? 'green' : 'gainsboro';
      if(ct[0] != 'textTE'){
        x = x - (txt.length *txt_x * ff / 2);
        y = y - (txt_y * ff / 2);
        afficheNombre(doc, x, y, txt, c, ff, angle, false);
      }else{
        afficheNombre(doc, x, y, txt, c, ff, angle, true);
      }
      break;

    case 'textE': // n° d'encoche
      afficheNombre(doc, x, y, txt, 'black', ff, angle, true);
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
      if(ct[0] == 'page'){ doc.addPage().lineWidth(1);}
      lignes = [];
      break;
  }
}

// Finalize PDF file
doc.end()
//}
