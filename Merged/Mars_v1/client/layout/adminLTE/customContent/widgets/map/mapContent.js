import { Random } from 'meteor/random';

Template.mapContent.onCreated(function() {
    var self = this;

    GoogleMaps.ready('map', function(map) {

        // ================================================
        // Define map icons
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

        // ================================================
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
        // ================================================
        /*
        // Reactively update map
        self.autorun(function() {
          const nodes = Nodes.find().observe({

            added: function(x) {
              var latLng = new google.maps.LatLng({lat: x.gps.lat, lng: x.gps.lon});
              addNode(latLng);
            },

            changed: function(x) {},

            removed: function(x) {}

          });

          //const tags = tags.find().map(function(x) {
          //});
        });
        */


        //===================================================
        // Google Map's listeners for testing
        google.maps.event.addListener(map.instance, 'click',
          function (event) {
            addTag(event.latLng,0);
            //Tags.insert({})
        });
        google.maps.event.addListener(map.instance, 'rightclick', function (event) {
          addNode(event.latLng);
          /*
          // Add node to database
                Nodes.insert({
                    nodeID: Random.id(),
                    nodeVersion: '1.0.0',
                    nodeType: 'Tester',
                    battery: {
                        voltage: Random.fraction()*10,
                        amperage: Random.fraction()*2,
                        timestamp: new Date()
                    },
                    gps: {
                        lat: event.latLng.lat(),
                        lon: event.latLng.lng(),
                        timestamp: new Date()
                    }
                });
                */
        });
        //====================================================
        // Map functions
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

          var hovertxt = displayCoordinates(tag.marker.position)
          var txt = hoverBox(tag.marker,hovertxt)

          tag.marker.addListener('rightclick', function() { // For Testing
            removeMapObject(tag.marker);
            removeMapObject(tag.circle);
            txt.setMap(null);
            txt = null;
            pins_tags.splice(pins_tags.indexOf(tag));
          });
        }

        function addNode(latLng,pin_icon) {
          // Add node marker and listeners
          // Could set up so that node json objects are passed instead
          var node = addMarker(latLng,icons['node'].icon);
          pins_nodes.push(node);

          var hovertxt = displayCoordinates(node.position)
          var txt = hoverBox(node,hovertxt)

          node.addListener('rightclick', function() { // For Testing
            removeMapObject(node);
            txt.setMap(null);
            txt = null;
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

        function hoverBox(mapObj, hovertxt){
          var latLng = mapObj.getPosition()

          var txt = new TxtOverlay(latLng, hovertxt, "hoverBox", map.instance)
          txt.hide();

          mapObj.addListener('mouseover', function() {
            txt.show();
          });

          mapObj.addListener('mouseout', function() {
            txt.hide();
          });

          return txt;
        }

        function removeMapObject(object) {
            // Function for removing markers from the map
            object.setMap(null);
        }

        function TxtOverlay(pos, txt, cls, map) {

              // Now initialize all properties.
              this.pos = pos;
              this.txt_ = txt;
              this.cls_ = cls;
              this.map_ = map;

              // We define a property to hold the image's
              // div. We'll actually create this div
              // upon receipt of the add() method so we'll
              // leave it null for now.
              this.div_ = null;

              // Explicitly call setMap() on this overlay
              this.setMap(map);
        }

        TxtOverlay.prototype = new google.maps.OverlayView();

        TxtOverlay.prototype.onAdd = function() {

          // Note: an overlay's receipt of onAdd() indicates that
          // the map's panes are now available for attaching
          // the overlay to the map via the DOM.

          // Create the DIV and set some basic attributes.
          var div = document.createElement('DIV');
          div.className = this.cls_;

          div.innerHTML = this.txt_;

          // Set the overlay's div_ property to this DIV
          this.div_ = div;
          var overlayProjection = this.getProjection();
          var position = overlayProjection.fromLatLngToDivPixel(this.pos);
          div.style.left = position.x + 'px';
          div.style.top = position.y + 'px';
          // We add an overlay to a map via one of the map's panes.

          var panes = this.getPanes();
          panes.floatPane.appendChild(div);
        }
        TxtOverlay.prototype.draw = function() {


            var overlayProjection = this.getProjection();

            // Retrieve the southwest and northeast coordinates of this overlay
            // in latlngs and convert them to pixels coordinates.
            // We'll use these coordinates to resize the DIV.
            var position = overlayProjection.fromLatLngToDivPixel(this.pos);


            var div = this.div_;
            div.style.left = position.x + 'px';
            div.style.top = position.y + 'px';



        }
          //Optional: helper methods for removing and toggling the text overlay.
        TxtOverlay.prototype.onRemove = function() {
          this.div_.parentNode.removeChild(this.div_);
          this.div_ = null;
        }
        TxtOverlay.prototype.hide = function() {
          if (this.div_) {
            this.div_.style.visibility = "hidden";
          }
        }

        TxtOverlay.prototype.show = function() {
          if (this.div_) {
            this.div_.style.visibility = "visible";
          }
        }

        TxtOverlay.prototype.toggle = function() {
          if (this.div_) {
            if (this.div_.style.visibility == "hidden") {
              this.show();
            } else {
              this.hide();
            }
          }
        }

        TxtOverlay.prototype.toggleDOM = function() {
          if (this.getMap()) {
            this.setMap(null);
          } else {
            this.setMap(this.map_);
          }
        }
        //====================================================

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
