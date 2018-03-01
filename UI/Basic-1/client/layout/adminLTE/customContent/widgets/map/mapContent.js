Template.mapContent.onCreated(function() {
    // We can use the `ready` callback to interact with the map API once the map is ready.
    GoogleMaps.ready('map', function(map) {
        // Add a marker to the map once it's ready

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

        var nodes = [];
        var tags = [];

        // Google Map's listener for mouse movement over the map
        google.maps.event.addListener(map.instance, 'click', function (event) {
                addTag(event.latLng,Math.floor(Math.random() * 60));
        });

        google.maps.event.addListener(map.instance, 'rightclick', function (event) {
                addNode(event.latLng);
        });

        //  Trying to implement a legend
        var legend = $(window).find('#legend')
        console.log(legend);
        for (var key in icons) {
          var type = icons[key];
          var name = type.name;
          var icon = type.icon.path;
          var color = type.icon.fillColor;
          var label = '<div><svg height="22" width="22" viewBox="0 0 25 25"> <path d=' + icon + ' fill=' + color + '/></svg>' + name + '</div>';
          $('#legend').append(label)
        }
        //map.instance.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($(window).find('#legend'))

        function displayCoordinates(latLng) {
              // Function for writing google maps coords as string
              var lat = latLng.lat();
              lat = lat.toFixed(4);
              var lng = latLng.lng();
              lng = lng.toFixed(4);
              return "Latitude: " + lat + "  Longitude: " + lng
          }

        function addTag(latLng,r) {
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

          tags.push(tag);

          tag.marker.addListener('rightclick', function() { // For Testing
            removeMapObject(tag.marker);
            removeMapObject(tag.circle);
            tags.splice(tags.indexOf(tag))

          });
        }

        function addNode(latLng,pin_icon) {
          var node = addMarker(latLng,icons['node'].icon);
          nodes.push(node);

          node.addListener('rightclick', function() { // For Testing
            removeMapObject(node);
            nodes.splice(nodes.indexOf(node))
          });
        }

        function addMarker(latLng,pin_icon) {
            // Function for creating markers
           var marker = new google.maps.Marker({
                position: latLng,
                map: map.instance,
                icon: pin_icon,
            });

            return marker;
        }

        function removeMapObject(marker) {
            // Function for removing markers from the map
            marker.setMap(null);
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
