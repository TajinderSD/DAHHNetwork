// Hide the action bar, dont need at this stage
// $.index.activity.actionBar.hide();

var activityIndicator = Ti.UI.createActivityIndicator({
	message : 'Checking services...',
	color : 'red',
	top: 50
});

$.index.add(activityIndicator);
activityIndicator.show();
$.index.open();

var user_id = Ti.App.Properties.getString('user_id');
var is_anon_user = Ti.App.Properties.getBool('is_anon_user', true);
var device_id = Ti.Platform.id;
var user;

if(user_id){
	if(is_anon_user){
		loginUser(device_id + '@mydomain.com', 'passwordAnon');
	} else {
		
	}
} else {
	createUser(device_id);
}

function createUser(device_id) {
	Cloud.Users.create({
		email: device_id + '@mydomain.com',
		first_name: 'Anon_' + device_id,
		last_name: 'Anon',
		password: 'passwordAnon',
		password_confirmation: 'passwordAnon'
	}, function(e){
		if(e.success) {
			user = e.users[0];
			
			Ti.App.Properties.setString('user_id', user.id);
			Ti.App.Properties.setBool('is_anon_user', true);
			
			loginUser(user.email, 'passwordAnon');
		} else {
			alert('Error:\n' + ((e.error && e.message) || JSON.stringify(e)));
		}
	});
}

function loginUser(email, password) {
	Cloud.Users.login({
		login: email,
		password: password
	}, function(e) {
		if(e.success) {
			user = e.users[0];
			
			getGeolocation();
		} else {
			alert('Error:\n' + ((e.error && e.message) || JSON.stringify(e)));
		}
	});
}

function getGeolocation() {
	// gpsProvider = Ti.Geolocation.Android.createLocationProvider({
		// name: Ti.Geolocation.PROVIDER_GPS,
		// minUpdateDistance: 100,
		// minUpdateTime: 60
	// });
// 	
	// Ti.Geolocation.Android.addLocationProvider(gpsProvider);
	
	// Ti.Geolocation.preferredProvider = "gps";
	// Ti.Geolocation.purpose = "GPS demo";
	Titanium.Geolocation.accuracy = Titanium.Geolocation.ACCURACY_BEST;
	Titanium.Geolocation.distanceFilter = 10;
	Ti.Geolocation.getCurrentPosition(currentPositionCallback);
}

function currentPositionCallback(locationResults) {
	var locationCoordinates = locationResults.coords;
	var latitude = locationCoordinates.latitude;
	var longitude = locationCoordinates.longitude;
	
	Cloud.Objects.query({
		classname: 'geolocation',
		where: {
			user_id : user.id
		}
	}, function(e){
		if(e.success) {
			var geolocation = e.geolocation[0];
			var coordinates = geolocation.coordinates[0];
			if(geolocation){
				updateGeolocation(geolocation.id, coordinates);
			} else {
				createGeolocation(latitude, longitude);
			}
		} else {
			createGeolocation(latitude, longitude);
		}
	});
}

function createGeolocation(latitude, longitude) {
	Cloud.Objects.create({
		classname: 'geolocation',
		fields: {
			user_id: user.id,
			first_name: user.first_name,
			last_name: user.last_name,
			is_anon_user: is_anon_user,
			coordinates: [latitude, longitude]
		}
	}, function(e) {
		if(e.success) {
			activityIndicator.hide();
			$.index.remove(activityIndicator);
			searchPeopleNearby([latitude, longitude]);
		} else {
			alert('Error:\n' + ((e.error && e.message) || JSON.stringify(e)));
		}
	});
}

function updateGeolocation(gid, coordinates) {
	Cloud.Objects.update({
		classname: 'geolocation',
		id: gid,
		user_id: user.id,
		fields: {
			coordinates: coordinates
		}
	}, function(e) {
		if(e.success) {
			activityIndicator.hide();
			$.index.remove(activityIndicator);
			searchPeopleNearby(coordinates);
		} else {
			alert('Error:\n' + ((e.error && e.message) || JSON.stringify(e)));
		}
	});
}

function openPeopleNearby(coordinates) {
	var peopleNearbyWin = Alloy.createController('peopleNearby', [coordinates]).getView();
	peopleNearbyWin.open();
}

function searchPeopleNearby(coordinates) {
	var activityInd = Ti.UI.createActivityIndicator({
		message : 'Searching people nearby...',
		color : 'red',
		top: 50
	});

	$.index.add(activityInd);
	activityInd.show();

	Cloud.Objects.query({
		classname: 'geolocation',
			where: {
				user_id : {"$ne": user_id},
				coordinates: {
					"$nearSphere": [coordinates[0], coordinates[1]],
					"$maxDistance": 5/3959 
				}
			}
		}, function(e){
			if(e.success) {
				var geolocations = e.geolocation;
				
				var tableData = [];
				for(count = 0; count < geolocations.length; count++) {
					var geolocation = geolocations[count];
					
					var row = Ti.UI.createTableViewRow({
						selectedBackgroundColor: '#222',
						height: 70,
						touchEnabled: true,
						user_id: geolocation.user_id,
						is_anon_user: geolocation.is_anon_user
					});
					
					var image = Ti.UI.createImageView({
					    image: '',
					    left:70,
					    bottom: 2,
					    width:32,
					    height: 32,
					    layout: 'horizontal'
					  });
					  
					row.add(image);
	  
					var row_label = Ti.UI.createLabel({
						color:'#576996',
						text: geolocation.first_name,
						font: {fontFamily: 'Arial', fontSize: 16, fontWeight: 'bold'}
					});
					
					row.add(row_label);
					
					tableData.push(row);
				}
				
				var header = Ti.UI.createView({
				    backgroundColor: '#222',
        			height: 60,
        			width: Ti.UI.FILL,
        			top: 0
				});
				var text = Ti.UI.createLabel({
			        text: 'People Nearby',
			        left: 20,
			        color: '#fff',
			        font: {fontFamily: 'Arial', fontSize: 20}
			    });
			    var map_pin = Ti.UI.createButton({
			    	image: '/images/map_pin_2.png',
			    	borderRadius: 5,
			    	top: 5,
			    	left: 250,
  					width:Ti.UI.SIZE,
        			height:Ti.UI.SIZE,
  					verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER
			    });
			    map_pin.addEventListener('click', function(e) {
			    	var peopleNearbyMapView = Alloy.createController('peopleNearbyMapView', {coordinates : coordinates, geolocations : geolocations}).getView();
					peopleNearbyMapView.open();
			    });
			    
    			header.add(text);
    			header.add(map_pin);
				
				var tableView = Ti.UI.createTableView({
					backgroundColor: 'white',
					data: tableData,
					headerView: header
				});
				
				tableView.addEventListener('click', function(e){
					if(e.rowData.is_anon_user) {
						alert('Please register to view details');
					} else {
						alert(e.rowData.user_id);
					}
				});
				
				activityInd.hide();
				$.index.remove(activityInd);
				$.index.add(header);
				$.index.add(tableView);
			} else {
				activityInd.hide();
				$.index.remove(activityInd);
				alert('Error:\n' + ((e.error && e.message) || JSON.stringify(e)));
			}
	});
}

function mapWindow() {
	var MapModule = require('ti.map');


var win = Titanium.UI.createWindow();
var mountainView = MapModule.createAnnotation({
    latitude:37.390749,
    longitude:-122.081651,
    title:"Appcelerator Headquarters",
    subtitle:'Mountain View, CA',
    pincolor:MapModule.ANNOTATION_RED
});

var eentweedrie = MapModule.createAnnotation({
    latitude:51.32811396764682,
    longitude:3.850465540405268,
    title:"school",
    subtitle:'terneuzen',
    pincolor:MapModule.ANNOTATION_RED
});



var mapview = MapModule.createView({
    mapType: MapModule.NORMAL_TYPE,
    region: {latitude:33.74511, longitude:-84.38993,
            latitudeDelta:0.01, longitudeDelta:0.01},
    animate:true,
    regionFit:true,
    userLocation:true,
    annotations:[mountainView, eentweedrie]
});
win.add(mapview);
win.open();
}
