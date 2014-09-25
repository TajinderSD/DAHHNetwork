var coordinates = arguments[0].coordinates;
var geolocations = arguments[0].geolocations;

var win1 = {};
win1.win = Titanium.UI.createWindow({  
    title:'People nearby',
    backgroundColor:'#000',
    //for android, to create new activity
    modal: true,
    //for android, to exit app on closing main window
    // exitOnClose: true
});
					
var MapModule = require('ti.map');

var annotations = [];
for(count = 0; count < geolocations.length; count++) {
	var geolocation = geolocations[count];
	var coords = geolocation.coordinates[0];
	var annotation = MapModule.createAnnotation({
	    latitude:coords[0],
	    longitude:coords[1],
	    title:geolocation.first_name,
	    // subtitle:'Mountain View, CA',
	    pincolor:MapModule.ANNOTATION_RED
	});
	annotations.push(annotation);
}

var mapview = MapModule.createView({
    mapType: MapModule.NORMAL_TYPE,
    region: {latitude:coordinates[0], longitude:coordinates[1],
            latitudeDelta:0.01, longitudeDelta:0.01,
            zoom:12},
    animate:true,
    regionFit:true,
    userLocation:true,
    annotations:annotations
});

win1.win.add(mapview);
win1.win.open();