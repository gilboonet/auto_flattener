/*****************
 *  POUR v2 auto *
 *****************/
const PDFDocument = require ('pdfkit');
const fs = require ('fs');

sens = 'portrait';
page = 1;
taille = 'a4';
try {  // charge rendu.dat
    var data = fs.readFileSync('rendu.tmp', 'utf8');
} catch(e) {
    console.log('Error:', e.stack);
}
d = data.toString().split('\n');
imax = d.length;
mx = 20; my = 20;
//mx = 0; my = 0;
mode = 'prod';
ff = 0.75;

// Cree le document
var doc = new PDFDocument({size:taille, layout:sens, margin: 0});
ws = fs.createWriteStream('gabarit_Mary.pdf');
doc.pipe(ws);

for(i=0; i<imax; i++){
  ch = d[i];
  
  if(ch.startsWith('#')){ continue; } // commentaire
  
  ct = ch.split(" ");
  if((ct[0]=='line')||(ct[0]=='dash')){
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
      if (ct[0] == 'line'){
        c = 'blue';
        doc.undash().lineWidth(1);
      }else{ 
        c = 'red';
        doc.dash(4,{space:8}).lineWidth(0.5);
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
