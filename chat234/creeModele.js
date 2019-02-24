/**************************
 * construit modele_ff.js *
 **************************/
// syntaxe : creeModele <fichierOFF> [<fichierJS>]
//                      obligatoire  optionnel


const fs = require ('fs')

const args = process.argv.slice(2)
let largs = args.length
let nomFichierEntree
let nomFichierSortie

const ext_off = '.off'
const ext_jscad = '.jscad'

if(largs < 1){
  console.log("ERREUR : Fichier OFF manquant")
  process.exit()
}

nomFichierEntree = args[0]
if(nomFichierEntree.slice(-4).toLowerCase() != ext_off){
  nomFichierSortie = nomFichierEntree + ext_jscad
  nomFichierEntree = nomFichierEntree + ext_off
}

/*
if(largs > 1){
  nomFichierSortie = args[1]
  if(nomFichierSortie.slice(-4).toLowerCase() != ext_jscad){
    nomFichierSortie = nomFichierSortie + ext_jscad
  }
}*/
nomFichierSortie = 'modele_off.jscad';

console.log('entree:', nomFichierEntree)
console.log('sortie:', nomFichierSortie)

try {  // charge le fichier
    var data = fs.readFileSync(nomFichierEntree, 'utf8')
} catch(e) {
    console.log('Error:', e.stack)
}
let d = data.toString().split('\n');

let sortie = []
sortie.push('volume = function () {')
sortie.push('volume.fichier = function (){ return `OFF')
for(let i = 1; i < d.length; i++){
  if(d[i].trim() !== ''){
    sortie.push(d[i])
  }
}
sortie.push('`;}}')

try {
  const data = fs.writeFileSync(nomFichierSortie, sortie.join('\n'))
} catch (err) {
  console.error('ERREUR: ECRITURE FICHIER', err)
}

