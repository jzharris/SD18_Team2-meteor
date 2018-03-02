Template.mapContent.onCreated(function() {
    // We can use the `ready` callback to interact with the map API once the map is ready.
    GoogleMaps.ready('map', function(map) {


        var icons = {// Define Icons
            tag: {
                name: 'Tag',
                icon: {
                  path: "M0,10L20,10L20,0L0,0z",
                  fillColor: 'green',
                  fillOpacity: 0.8,
                  scale: 1,
                  strokeWeight: 0,
                  anchor: new google.maps.Point(10,5)
                }},
            node: {
                name: 'Node',
                icon: {
                  path: "M0,20L10,0L20,20z",
                  fillColor: 'green',
                  fillOpacity: 0.8,
                  scale: 1,
                  strokeWeight: 0,
                  anchor: new google.maps.Point(10,5)
            }}
        };

        // Create arrays for node and tag pins
        // These may need to be collections instead
        var pins_nodes = [];
        var pins_tags = [];

        // Draw map legend
        map.instance.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($('#legend')[0])
        for (var key in icons) {
          var type = icons[key];
          var name = type.name;
          var icon = type.icon.path;
          var color = type.icon.fillColor;
          var label = '<div><svg height="22" width="22" viewBox="0 0 25 25"> <path d=' + icon + ' fill=' + color + '/></svg>' + name + '</div>';
          $('#legend').append(label)
        }

        // Google Map's listeners for testing
        google.maps.event.addListener(map.instance, 'click', function (event) {
                addTag(event.latLng,Math.floor(Math.random() * 60));
        });
        google.maps.event.addListener(map.instance, 'rightclick', function (event) {
                addNode(event.latLng);
        });

        function displayCoordinates(latLng) {
              // Function for writing google maps coords as string
              var lat = latLng.lat();
              lat = lat.toFixed(4);
              var lng = latLng.lng();
              lng = lng.toFixed(4);
              return "Latitude: " + lat + "  Longitude: " + lng
          }

        function addTag(latLng,r) {
          // Add tag marker and listeners
          // Could set up so that tag json objects are passed instead
          var tag = {
              marker: addMarker(latLng,icons['tag'].icon),
              circle: new google.maps.Circle({
                strokeWeight: 0,
                clickable: false,
                fillColor: '#0b8080',
                fillOpacity: 0.2,
                map: map.instance,
                center: latLng,
                radius: r
            })
          }

          pins_tags.push(tag);

          tag.marker.addListener('rightclick', function() { // For Testing
            removeMapObject(tag.marker);
            removeMapObject(tag.circle);
            pins_tags.splice(pins_tags.indexOf(tag))

          });
        }

        function addNode(latLng,pin_icon) {
          // Add node marker and listeners
          // Could set up so that node json objects are passed instead
          var node = addMarker(latLng,icons['node'].icon);
          pins_nodes.push(node);

          node.addListener('rightclick', function() { // For Testing
            removeMapObject(node);
            pins_nodes.splice(pins_nodes.indexOf(node))
          });
        }

        function addMarker(latLng,pin_icon) {
            // Function for creating base markers
           var marker = new google.maps.Marker({
                position: latLng,
                map: map.instance,
                icon: pin_icon,
            });
            return marker;
        }

        function removeMapObject(object) {
            // Function for removing markers from the map
            object.setMap(null);
        }
    });
});

Template.mapContent.helpers({
    MapOptions: function() {
        // Make sure the maps API has loaded
        if (GoogleMaps.loaded()) {
            // Map initialization options
            return {
                center: new google.maps.LatLng(34.066109, -106.907439),
                zoom: 18,
                minZoom: 16,
                disableDefaultUI: true,
                styles: [{
                    featureType: 'poi',
                    stylers: [{visibility: 'off'}]
                }]

            };
        }
    }
});
