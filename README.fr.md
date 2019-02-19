# auto_flattener
Voir dans une autre langue : [english] (https://github.com/gilboonet/auto_flattener/blob/master/README.md) [french] (https://github.com/gilboonet/auto_flattener/blob/master/README.fr.md)
Déplie automatiquement un modèle 3d en gabarit 2d (pour découpe laser et assemblage manuel).

Le code source le plus récent est dans le répertoire el1000, avec le modèle exemple d'un éléphant en 1000 triangles.

Le script a besoin d'un modèle 3d sauvé au format .off. Pour cela, j'utilise Meshlab, soit interactivement, soit en ligne de commande avec la commande suivante :
```
meshlabserver -i file.stl -o file.off (.stl can be replaced by any 3d model format handled by meshlab).
```
Le fichier .off doit être intégré à un script jscad, avec cette commande qui crée le fichier modele_off.jscad :
```
node creeModele file (this will use file.off)
```

L'on peut alors lancer echelle.jscad afin de déterminer le facteur d'échelle à donner au gabarit.
Ces trois fichiers doivent être glissés-déposés dans un navigateur ouvert sur https://openjscad.org :
- echelle.jscad
- modele_off.jscad
- utils.jscad


Le modèle est alors déplié avec :
```
openjscad deplie.jscad --echelle 10 --format 'a4' --triangle '10,50,100' > rendu.dat
```
- --echelle 10 dépliera le modèle avec un facteur d'échelle x10
- --format 'a4' organisera le gabarit sur des pages au format a4 (les formats possibles vont de a1 à a4)
- --triangle '...' est optionnel et forcera chaque page (avant le tri par taille) à commencer par le triangle indiqué


Enfin, le fichier pdf contenant le gabarit est créé par :
```
node pdf file.pdf a4 1
```
- file.pdf sera le nom du gabarit
- a4 sera le format de page utilisé
- 1 sera le facteur d'échelle utilisé pour les nombres (utile si la valeur par défaut ne convient pas)

Le sens des plis (vallée ou montagne) sera indiqué par des couleurs distinctes, mais attention, cette information n'est pas toujours correcte.


Pré-requis :
- nodejs (https://nodejs.org/en/)
- OpenJSCAD CLI (npm install -g @jscad/openjscad)
- pdfkit (npm install pdfkit)
