Template.mapContent.onCreated(function() {
    // We can use the `ready` callback to interact with the map API once the map is ready.
    GoogleMaps.ready('exampleMap', function(map) {
        // Add a marker to the map once it's ready

        var marker_node = "dist/img/map/pin_node.png";
        var marker = new google.maps.Marker({
            position: map.options.center,
            map: map.instance,
            icon: marker_node
        });
    });
});

Template.mapContent.helpers({
    exampleMapOptions: function() {
        // Make sure the maps API has loaded
        if (GoogleMaps.loaded()) {
            // Map initialization options
            return {
                center: new google.maps.LatLng(34.0584, -106.8914),
                zoom: 15,
                disableDefaultUI: true


            };
        }
    }
});