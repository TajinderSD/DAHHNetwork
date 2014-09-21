// Hide the action bar, dont need at this stage
// $.index.activity.actionBar.hide();

var activityIndicator = Ti.UI.createActivityIndicator({
	message : 'Checking services...',
	color : 'red'
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
	gpsProvider = Ti.Geolocation.Android.createLocationProvider({
		name: Ti.Geolocation.PROVIDER_GPS,
		minUpdateDistance: 100,
		minUpdateTime: 60
	});
	
	Ti.Geolocation.Android.addLocationProvider(gpsProvider);
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
			openPeopleNearby([latitude, longitude]);
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
			openPeopleNearby(coordinates);
		} else {
			alert('Error:\n' + ((e.error && e.message) || JSON.stringify(e)));
		}
	});
}

function openPeopleNearby(coordinates) {
	var peopleNearbyWin = Alloy.createController('peopleNearby', [coordinates]).getView();
	peopleNearbyWin.open();
}
