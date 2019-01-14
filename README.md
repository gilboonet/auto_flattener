# auto_flattener
Automatically unflatten a 3d model

To test, open into the browser https://openjscad.org/#https://raw.githubusercontent.com/gilboonet/auto_flattener/master/test_Mary200.jscad

To produce the pdf, open a terminal, run :
- openjscad test_Mary200.jscad --triangle '0' --echelle 3 echTexte 0.15 mode 'prod' > rendu.tmp
- nodejs pdf

To change the 3d model :
- save it to .OFF format (Meshlab handles this format), polygonal and without colors.
- replace into the jscad the content of fichier() by the content of the .OFF file
- adapt the 'echelle' parameter to what you want
- if the numbers are not correctly scaled, change ff variable (scale factor for text) into pdf.js

I still need to indicate folds kind (valley of mountain).
