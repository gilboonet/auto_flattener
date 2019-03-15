# auto_flattener
Voir dans une autre langue : [english](https://github.com/gilboonet/auto_flattener/blob/master/README.md) [français](https://github.com/gilboonet/auto_flattener/blob/master/README.fr.md)

Déplie automatiquement un modèle 3d en gabarit 2d (pour découpe laser et assemblage manuel).

Le code source le plus récent est dans le répertoire dodeca avec un modèle géométrique en 148 triangles.

Le script a besoin d'un modèle 3d sauvé au format .stl ascii. S'il faut convertir le fichier, j'utilise Meshlab, soit interactivement, soit en ligne de commande avec la commande suivante :
```
meshlabserver -i fichier.obj -o fichier.stl (fichier.obj à remplacer par le nom du fichier).
```
Le fichier .stl doit être intégré à un script jscad, avec cette commande qui crée le fichier modele_stl.jscad :
```
node stl2jscad fichier (utilisera fichier.stl)
```

L'échelle du modèle peut être modifiée lors du dépliage avec le paramètre --echelle 10 (pour agrandir 10x).
J'utilise Meshlab interactivement pour voir les dimensions du modèle et les changer si nécessaire. Pour voir les dimensions du modèle il faut activer 'Bounding Box', puis dans les options de visualisation à droite (une fois le modèle chargé), mettre 'Measure info' à 'On', et enfin dans le menu Renders, cocher 'Show Box Corners'. On obtient ainsi les mesures en mm. Pour modifier les dimensions du modèle, il faut utiliser dans le menu Filters, Normals... / Transform : Scale, Normalize. Puis, bien entendu, sauver le modèle redimensionné dans un fichier au format .stl (décocher binary encoding  et materialize colors). Il faut ensuite relancer la commande stl2jscad avec ce fichier.

Le modèle peut alors être déplié avec :
```
openjscad depliev3.jscad > rendu.dat
```
Les paramètres optionnels suivants peuvent être utilisé si besoin (le format par défaut est A4).
- --format 'a3' organisera le gabarit sur des pages au format a3 (les formats possibles vont de a1 à a4)
- --triangle '...' est optionnel et forcera chaque page (avant le tri par taille) à commencer par le triangle indiqué (par défaut il y a triangle '0').

Enfin, le fichier pdf contenant le gabarit est créé par :
```
node pdf fichier.pdf a4 1
```
- fichier.pdf sera le nom du gabarit
- a4 sera le format de page utilisé
- 1 sera le facteur d'échelle utilisé pour les nombres (utile si la valeur par défaut ne convient pas)

Les plis sont visualisés sous la forme de pointillés. Le sens des plis (vallée ou montagne) sera indiqué par des couleurs distinctes, marron pour montagne et vert pour vallée.


Pré-requis :
- nodejs (https://nodejs.org/en/)
- OpenJSCAD CLI (npm install -g @jscad/openjscad)
- pdfkit (npm install pdfkit)
