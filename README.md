# auto_flattener
View in another language : [english](https://github.com/gilboonet/auto_flattener/blob/master/README.md) [français](https://github.com/gilboonet/auto_flattener/blob/master/README.fr.md)

Automatically unflatten a 3d model to a 2d pattern (for laser cut and manual assembly).

Most recent source is into el1000 directory, with the example model of a 1000 triangles elephant.

It needs a 3d model saved as .off file. To do so I use Meshlab, it can be used interactively or on the CLI with this command :
```
meshlabserver -i file.stl -o file.off (.stl can be replaced by any 3d model format handled by meshlab).
```
The .off file needs to be wrapped into a jscad script, with this command that will create modele_off.jscad :
```
node creeModele file (this will use file.off)
```

Then you can run echelle.jscad to choose the scale of the pattern.
Those three files must be drag to an internet browser accessing Openjscad.org :
- echelle.jscad
- modele_off.jscad
- utils.jscad


The model is then unflatten with :
```
openjscad deplie.jscad --echelle 10 --format 'a4' --triangle '10,50,100' > rendu.dat
```
- --echelle 10 will unflatten the model with a scale x 10
- --format 'a4' will pack the pattern into a4 pages (possibles values are a1 to a4)
- --triangle '...' is optional and will force each page (before sorting by size) to start with provided triangle


Finally, the pattern pdf file is created with :
```
node pdf file.pdf a4 1
```
- file.pdf will be the name of the pdf
- a4 will be the page format
- 1 will be the scale of numbers (useful when the default is too small/big)

The folds kind (valley or mountain) will be shown on different color, but beware this information is not always accurate.

It requires :
- nodejs (https://nodejs.org/en/)
- OpenJSCAD CLI (npm install -g @jscad/openjscad)
- pdfkit (npm install pdfkit)
