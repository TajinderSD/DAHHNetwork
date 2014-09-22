var geoArgs = arguments[0] || {};
var user_id = Ti.App.Properties.getString('user_id');
var coordinates = geoArgs[0];

var activityIndicator = Ti.UI.createActivityIndicator({
	message : 'Searching people nearby...',
	color : 'red'
});

$.peopleNearby.add(activityIndicator);
activityIndicator.show();
// $.peopleNearby.open();

Cloud.Objects.query({
	classname: 'geolocation',
		where: {
			//user_id : {"$ne": user_id}
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
					height: 80,
					touchEnabled: true
				});
				
				var image = Ti.UI.createImageView({
				    image: '',
				    left:70, bottom: 2,
				    width:32, height: 32
				  });
				  
				row.add(image);
  
				var row_label = Ti.UI.createLabel({
					color:'#576996',
					text: geolocation.is_anon_user ? 'Anon' : geolocation.first_name,
					font: {fontFamily: 'Arial', fontSize: 16, fontWeight: 'bold'}
				});
				
				row.add(row_label);
				
				tableData.push(row);
			}
			
			var tableView = Ti.UI.createTableView({
				backgroundColor: 'white',
				data: tableData,
				top: 40,
				borderWidth: 1,
				borderRadius: 1,
				borderColor: 'black'
			});
			
			$.peopleNearby.add(tableView);
			activityIndicator.hide();
		} else {
			activityIndicator.hide();
			alert('Error:\n' + ((e.error && e.message) || JSON.stringify(e)));
		}
});
