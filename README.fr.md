# auto_flattener
Voir dans une autre langue : [english](https://github.com/gilboonet/auto_flattener/blob/master/README.md) [français](https://github.com/gilboonet/auto_flattener/blob/master/README.fr.md)

Déplie automatiquement un modèle 3d en gabarit 2d (pour découpe laser et assemblage manuel).

Le code source le plus récent est dans le répertoire v7 avec 4 modèles (format .wings et .obj)

Le script a besoin d'un modèle 3d sauvé au format .obj (triangulaire).
Le fichier .obj doit être intégré à un script jscad, avec cette commande qui crée le fichier modele_obj.jscad :
```
node obj2jscad fichier (utilisera fichier.obj)
```

L'échelle du modèle peut être modifiée lors du dépliage avec le paramètre --echelle 10 (pour agrandir 10x).

Le modèle peut alors être déplié avec :
```
openjscad deplie.jscad > rendu.dat
```
Les paramètres optionnels suivants peuvent être utilisé si besoin (le format par défaut est A4).
- --format 'a3' organisera le gabarit sur des pages au format a3 (les formats possibles vont de a1 à a4)
- --triangle '...' est optionnel et forcera chaque page (avant le tri par taille) à commencer par le triangle indiqué (par défaut il y a triangle '0').
- --angle '...' est optionnel et tournera chaque page (chaque triangle de début de page indiqué avec le paramètre précédent) de l'angle spécifié. Permet d'optimiser le dépliage d'une grande pièce.

La version 7 utilise le format de fichier 3D OBJ qui permet de sauver les couleurs des facettes (plus exactement leur matériau), cette information servant désormais à générer des zones qui seront dépliées séparément. Il est toujours possible d'influer sur le gabarit qui sera automatiquement généré en excluant des couplets de facettes voisines, ce qui est fait en éditant dans le code du fichier deplie.jscad, le tableau a.npl. Si ce code est utilisé pour déplier un nouveau modèle 3d, il faut vider ce tableau, puis le renseigner selon les besoins du modèle.

Si vous éditez votre modèle avec wings 3D, il est possible de créer des groupes de matériaux automatiquement après avoir colorié les facettes comme voulu, en sélectionnant en mode 'Objet', l'option 'Propriétés de sommet', puis 'Couleurs en matériaux'.

Enfin, le fichier pdf contenant le gabarit est créé par :
```
node pdf fichier.pdf a4 1
```
- fichier.pdf sera le nom du gabarit
- a4 sera le format de page utilisé
- 1 sera le facteur d'échelle utilisé pour les nombres (utile si la valeur par défaut ne convient pas)

Les plis sont visualisés sous la forme de pointillés. Le sens des plis (vallée ou montagne) sera indiqué par des couleurs distinctes, marron pour montagne et vert pour vallée.

Avec la version 5, il est possible de créer une version du gabarit contenant des encoches "queue d'aronde double". Pour cela, il faut remplacer le fichier pdf.js par pdfP3.js (lancer la commande node pdfP3 ...). Il est possible de changer le sens des encoches en éditant le fichier rendu.dat généré par le script de dépliage. Pour cela, il faut se placer successivement sur les deux lignes commençant par "line" et se terminant par les numéros des deux triangles concernés (le plus petit suivi de '_' suivi du plus grand) en ajoutant " 0 2" aux deux lignes concernées. Attention, le fichier rendu.dat est recréé à chaque fois qu'on lancer un dépliage (commande openjscad deplie.jscad ...).


Pré-requis :
- nodejs (https://nodejs.org/en/)
- OpenJSCAD CLI (npm install -g @jscad/openjscad)
- pdfkit (npm install pdfkit)
