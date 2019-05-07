include ("modele_obj.jscad");

function volumeFromFaces(f, v){
    return CSG.fromPolygons(f.map(m => CSG.Polygon.createFromPoints(m.map(n => v[n]))));
}
function main(params){

    f = volume().faces;
    v = volume().vertices;
    g = volume().groups;
    
    cols = ['white','red', 'blue', 'yellow', 'green', 'maroon', 'tan', 'pink', 'violet'];
    lg = [... new Set(g)];
    vol = [];
    for(n = 0; n < lg.length; n++){
        f2 = [];
        for(i =0; i< g.length; i++){
            if(g[i] == lg[n]){
                f2.push(f[i]);
            }
        }
        vol.push(color(cols[n], volumeFromFaces(f2,v)));
    }

return vol;
}
