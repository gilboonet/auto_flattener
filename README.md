# auto_flattener
View in another language : [english](https://github.com/gilboonet/auto_flattener/blob/master/README.md) [français](https://github.com/gilboonet/auto_flattener/blob/master/README.fr.md)

Automatically unflatten a 3d model to a 2d pattern (for laser cut and manual assembly).

Most recent source is into dodeca directory, with the example model of a 148 triangles geometrical model.

It needs a 3d model saved as .stl file. When the file is on another format, I convert it with Meshlab, it can be used interactively or on the CLI with this command :
```
meshlabserver -i file.obj -o file.stl (replace file.obj by the name of the model file).
```
The .stl file needs to be wrapped into a jscad script, with this command that will create modele_stl.jscad :
```
node stl2jscad file (this will use file.stl)
```

Model scale can be adjusted when unflattening with this parameter : --echelle 10 (to expand x10).
If the model needs to be rescaled (I use Meshlab for that), just remember to save it to .stl ascii and without colors.

The model is then unflatten with :
```
openjscad depliev3.jscad > rendu.dat
```
Optional parameters are : (default format is a4)
- --format 'a3' will pack the pattern into a3 pages (possibles values are a1 to a4)
- --triangle '...' is optional and will force each page (before sorting by size) to start with provided triangle
- --echelle 0.75 will scale the model ( < 1 to reduce, > 1 to expand)

Finally, the pattern pdf file is created with :
```
node pdf file.pdf a4 1
```
- file.pdf will be the name of the pdf
- a4 will be the page format
- 1 will be the scale of numbers (useful when the default is too small/big)

The folds kind (valley or mountain) will be shown on different color, maroon for mountain and green for valley.

It requires :
- nodejs (https://nodejs.org/en/)
- OpenJSCAD CLI (npm install -g @jscad/openjscad)
- pdfkit (npm install pdfkit)
