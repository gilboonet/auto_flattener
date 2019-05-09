# auto_flattener
View in another language : [english](https://github.com/gilboonet/auto_flattener/blob/master/README.md) [français](https://github.com/gilboonet/auto_flattener/blob/master/README.fr.md)

Automatically unflatten a 3d model to a 2d pattern (for laser cut and manual assembly).

Most recent source is into v7 directory, with 4 example models (obj and wings format).

It needs a 3d model saved as .obj file (triangular). The .obj file needs to be wrapped into a jscad script, with this command that will create modele_obj.jscad :
```
node obj2jscad file (this will use file.obj)
```

The model is then unflatten with :
```
openjscad deplie.jscad > rendu.dat
```
Optional parameters are : (default format is a4)
- --format 'a3' will pack the pattern into a3 pages (possibles values are a0 to a4)
- --triangle '...' is optional and will force each page (before sorting by size) to start with provided triangle
- --angle '...' is optional and works with --triangle, rotating each provided triangle, useful for big faces.
- --echelle 0.75 will scale the model ( < 1 to reduce, > 1 to expand)

v6 use OBJ 3d file format that can save faces colors (more exactly their materials), the script use that information to create spaces to unflatten separately. The generated pattern can still be customized by excluding facets couples, by editing file deplie.jscad, and change a.npl array. If this script is used to unflatten a new model, this array must be cleared, then filled as needed.

Finally, the pattern pdf file is created with :
```
node pdf file.pdf a4 1
```
- file.pdf will be the name of the pdf
- a4 will be the page format
- 1 will be the scale of numbers (useful when the default is too small/big)

The folds kind (valley or mountain) will be shown on different color, maroon for mountain and green for valley.

From v5, it is possible to create a pattern with puzzle like notches. To do so, pdf.js must be replace by pdfP3.js (run command node pdfP3 file.pdf...). Notches can be customized by editing file rendu.dat.

It requires :
- nodejs (https://nodejs.org/en/)
- OpenJSCAD CLI (npm install -g @jscad/openjscad)
- pdfkit (npm install pdfkit)
