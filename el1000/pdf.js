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
//mx = 10; my = 10;
mode = 'prod';

// Cree le document
var doc = new PDFDocument({size:taille, layout:sens, margin: 0});
ws = fs.createWriteStream(nomFichier);
doc.pipe(ws);

for(i=0; i<imax; i++){
  ch = d[i];
  
  if(ch.startsWith('#')){ continue; } // commentaire
  
  ct = ch.split(" ");
  if((ct[0]=='line')||(ct[0]=='dash')||(ct[0]=='mont')){
    x1 = parseFloat(ct[1])+mx;
    y1 = parseFloat(ct[2])+my;
    x2 = parseFloat(ct[3])+mx;
    y2 = parseFloat(ct[4])+my;
  }
  else if((ct[0]=='textT')||(ct[0]=='textt')||(ct[0]=='textE')){
    txt = ct[1];
    n=parseInt(txt);
    x = parseFloat(ct[2])+mx;
    y = parseFloat(ct[3])+my;
  }

switch(ct[0]){
    case 'line':
    case 'dash':
    case 'mont':
      if (ct[0] == 'line'){
        c = 'blue';
        //doc.undash().lineWidth(1);
        doc.lineWidth(2);
      }else{ 
        c = (ct[0] == 'mont') ? 'maroon' : 'green';
        //doc.dash(4,{space:8}).lineWidth(0.5);
        doc.lineWidth(1);
      }
      doc.polygon([x1, y1], [x2, y2]).stroke(c);
      break;

    case 'textT': // n° de triangle
    case 'textt': // idem grisé
      c = 'green';
      doc.fontSize(15*ff).fillColor(c);
      x = x - doc.widthOfString(txt)/2;
      y = y - doc.heightOfString(txt)/2;
      doc.text(txt, x, y);
      break;

    case 'textE': // n° d'encoche
      c = 'black';
      doc.fillColor(c).fontSize(12*ff);
      x = x - doc.widthOfString(txt)/2;	
      doc.text(txt, x, y);
      break;
      
    case 'page': // ajouter une page
      doc.addPage();
      break;
  }
}

// Finalize PDF file
doc.end()
//}
