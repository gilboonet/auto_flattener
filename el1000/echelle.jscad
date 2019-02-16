/************************************************************
 * ECHELLE : affiche les dimensions selon l'echelle choisie *
 * - Modèle 3D :GORILLA 400 faces (format .OFF)             *
 ************************************************************/
include ("utils.jscad");
include ("modele_off.jscad");

function getParameterDefinitions() {
  return [
    { name: 'echelle', type: 'number', initial:'1', caption: 'Echelle:' }
  ];
}


function main(params){
  utils();
  volume();
  let a = utils.lit_off(volume.fichier());
  a.csg = utils.poseAuSol(a.csg.scale(params.echelle));
  
  let dim = utils.getTaille(a.csg).dividedBy(10); // en cm

  a.csg = a.csg.translate([0,dim.y*5,0]);
  
  const u = ' cm';
  let txtH = vectorText('Hauteur: ' + dim.z.toFixed(2) + u);
  let txtL = vectorText('Largeur: ' + dim.y.toFixed(2) + u);
  let txtP = vectorText('Profondeur: ' + dim.x.toFixed(2) + u);
  
  return [a.csg
    ,utils.csgFromSegments(txtH).scale(0.5).translate([-100,-50])
    ,utils.csgFromSegments(txtL).scale(0.5).translate([-100,-65])
    ,utils.csgFromSegments(txtP).scale(0.5).translate([-100,-80])
  ].flat();
}
