# auto_flattener
Voir dans une autre langue : [english](https://github.com/gilboonet/auto_flattener/blob/master/README.md) [français](https://github.com/gilboonet/auto_flattener/blob/master/README.fr.md)

Déplie automatiquement un modèle 3d en gabarit 2d (pour découpe laser et assemblage manuel).

Le code source le plus récent est dans le répertoire Puzzle_Moai avec un modèle géométrique en 156 triangles.

Le script a besoin d'un modèle 3d sauvé au format .stl ascii. S'il faut convertir le fichier, j'utilise Meshlab.
Le fichier .stl doit être intégré à un script jscad, avec cette commande qui crée le fichier modele_stl.jscad :
```
node stl2jscad fichier (utilisera fichier.stl)
```

L'échelle du modèle peut être modifiée lors du dépliage avec le paramètre --echelle 10 (pour agrandir 10x).
J'utilise Meshlab interactivement pour voir les dimensions du modèle et les changer si nécessaire. Pour voir les dimensions du modèle il faut activer 'Bounding Box', puis dans les options de visualisation à droite (une fois le modèle chargé), mettre 'Measure info' à 'On', et enfin dans le menu Renders, cocher 'Show Box Corners'. On obtient ainsi les mesures en mm. Pour modifier les dimensions du modèle, il faut utiliser dans le menu Filters, Normals... / Transform : Scale, Normalize. Puis, bien entendu, sauver le modèle redimensionné dans un fichier au format .stl (décocher binary encoding  et materialize colors). Il faut ensuite relancer la commande stl2jscad avec ce fichier.

Le modèle peut alors être déplié avec :
```
openjscad deplie.jscad > rendu.dat
```
Les paramètres optionnels suivants peuvent être utilisé si besoin (le format par défaut est A4).
- --format 'a3' organisera le gabarit sur des pages au format a3 (les formats possibles vont de a1 à a4)
- --triangle '...' est optionnel et forcera chaque page (avant le tri par taille) à commencer par le triangle indiqué (par défaut il y a triangle '0').

Avec la version 5, il est possible d'influer sur le gabarit qui sera automatiquement généré en excluant des couplets de facettes voisines, ce qui est fait en éditant dans le code du fichier deplie.jscad, le tableau a.npl. Si ce code est utilisé pour déplier un nouveau modèle 3d, il faut vider ce tableau, puis le renseigner selon les besoins du modèle.

Enfin, le fichier pdf contenant le gabarit est créé par :
```
node pdf fichier.pdf a4 1
```
- fichier.pdf sera le nom du gabarit
- a4 sera le format de page utilisé
- 1 sera le facteur d'échelle utilisé pour les nombres (utile si la valeur par défaut ne convient pas)

Les plis sont visualisés sous la forme de pointillés. Le sens des plis (vallée ou montagne) sera indiqué par des couleurs distinctes, marron pour montagne et vert pour vallée.

Avec la version 5, il est possible de créer une version du gabarit contenant des encoches "puzzle". Pour cela, il faut remplacer le fichier pdf.js par pdfP.js (lancer la commande node pdfP ...). Il est possible de personnaliser les encoches en éditant le fichier rendu.dat généré par le script de dépliage. Pour cela, il faut se placer successivement sur les deux lignes commençant par "line" et se terminant par les numéros des deux triangles concernés (le plus petit suivi de '_' suivi du plus grand) :
- pour les encoches simples (largeur < 160 pts) le premier paramètre déplace l'encoche et le second l'inverse (sens rentrant ou sortant), il faut faire attention à bien inverser le déplacement et le sens sur la seconde ligne pour qu'ils coincident.
- pour les encoches doubles (largeur >= 160 pts) on ne peut qu'inverser le sens en mettant 0 2 aux deux lignes concernées.
Attention, le fichier rendu.dat est recréé à chaque fois qu'on lancer un dépliage (commande openjscad deplie.jscad ...).


Pré-requis :
- nodejs (https://nodejs.org/en/)
- OpenJSCAD CLI (npm install -g @jscad/openjscad)
- pdfkit (npm install pdfkit)
