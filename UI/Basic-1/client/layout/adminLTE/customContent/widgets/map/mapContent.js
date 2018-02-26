Template.mapContent.onCreated(function() {
    // We can use the `ready` callback to interact with the map API once the map is ready.
    GoogleMaps.ready('map', function(map) {
        // Add a marker to the map once it's ready
       
        var icons = {// Define Icons
            node: {
                name: 'Node',
                icon: {
                  path: 'M 10 20 L 30 20 L 30 10 L 10 10 z',
                  fillColor: 'green',
                  fillOpacity: 0.8,
                  scale: 1,
                  strokeWeight: 0,
                  anchor: new google.maps.Point(11,11),
                }},
            tag: {
                name: 'Tag',
                icon: {
                  path: 'M 10 30 L 20 10 L 30 30  z',
                  fillColor: 'green',
                  fillOpacity: 0.8,
                  scale: 1,
                  strokeWeight: 0,
                  anchor: new google.maps.Point(11,11)
            }}
        };

        /*  Trying to implement a legend
        var legend = this.find('#legend')
        for (var key in icons) {
          var type = icons[key];
          var name = type.name;
          var icon = type.icon;
          var div = this.createElement('div');
          div.innerHTML = '<img src="' + icon + '"> ' + name;
          legend.appendChild(div);
        }
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);
        */


        // Test Points
        var marker = addMarker(map.options.center,icons['node'].icon);
        var marker2 = addMarker(new google.maps.LatLng(34.0659, -106.9075),icons['tag'].icon);
        

        // Google Map's listener for mouse movement over the map
        google.maps.event.addListener(map.instance, 'mousemove', function (event) {
                console.log(displayCoordinates(event.latLng));
        });  


        function displayCoordinates(latLng) {
              // Function for writing google maps coords as string
              var lat = latLng.lat();
              lat = lat.toFixed(4);
              var lng = latLng.lng();
              lng = lng.toFixed(4);
              return "Latitude: " + lat + "  Longitude: " + lng
          }  

        function addMarker(latLng,pin_icon) {
            // Function for creating markers
           return new google.maps.Marker({
                position: latLng,
                map: map.instance,
                icon: pin_icon,
                title: displayCoordinates(latLng)
            });
        }

        function RemoveMarker(marker) {
            // Function for
            marker.setMap(null);
            marker = null;
        }

    });
});

Template.mapContent.helpers({
    MapOptions() {
        // Make sure the maps API has loaded
        if (GoogleMaps.loaded()) {
            // Map initialization options
            return {
                center: new google.maps.LatLng(34.066109, -106.907439),
                zoom: 18,
                minZoom: 17,
                disableDefaultUI: true,
                styles: [{
                    featureType: 'poi',
                    stylers: [{visibility: 'off'}]
                }]

            };
        }
    }
});
