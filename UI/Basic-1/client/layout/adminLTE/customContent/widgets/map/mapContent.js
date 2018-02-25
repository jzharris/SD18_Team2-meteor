Template.mapContent.onCreated(function() {
    // We can use the `ready` callback to interact with the map API once the map is ready.
    GoogleMaps.ready('Map', function(map) {
        // Add a marker to the map once it's ready

        var marker_node = "dist/img/map/pin_node.png";
        var marker = new google.maps.Marker({
            position: map.options.center,
            map: map.instance,
            icon: marker_node
        });

        google.maps.event.addListener(map.instance, 'mousemove', function (event) {
                displayCoordinates(event.latLng);  
        });      

        function displayCoordinates(pnt) {
              var lat = pnt.lat();
              lat = lat.toFixed(4);
              var lng = pnt.lng();
              lng = lng.toFixed(4);
              console.log("Latitude: " + lat + "  Longitude: " + lng);
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
    },

});

Template.mapContent.events({
    addMarker() {},

    RemoveMarker() {},     

});   

