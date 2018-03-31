import { Random } from 'meteor/random';

Template.mapContent.onCreated(function() {
    var self = this;
// ================================================
// Function to run once googlemaps api is ready
    GoogleMaps.ready('map', function(map) {
    // ================================================
    // initialization
        // Define map symbols for tags and nodes
        var icons = {// Define Icons
            tag: {
              name: 'Tag',
              default: {
                          path: "M0,10L20,10L20,0L0,0z",
                          fillColor: 'green',
                          fillOpacity: 0.8,
                          scale: 1,
                          strokeWeight: 0.5,
                          anchor: new google.maps.Point(10,5)
                        },
              selected: {
                          path: "M0,10L20,10L20,0L0,0z",
                          fillColor: 'cyan',
                          fillOpacity: 0.8,
                          scale: 1,
                          strokeWeight: 0.5,
                          anchor: new google.maps.Point(10,5)
                        },
                    },
            node: {
              name: 'Node',
              default:  {
                          path: "M0,20L10,0L20,20z",
                          fillColor: 'green',
                          fillOpacity: 0.8,
                          scale: 1,
                          strokeWeight: 0.5,
                          anchor: new google.maps.Point(10,5)
                        },
              selected: {
                          path: "M0,20L10,0L20,20z",
                          fillColor: 'cyan',
                          fillOpacity: 0.8,
                          scale: 1,
                          strokeWeight: 0.5,
                          anchor: new google.maps.Point(10,5)
                        },
                  }
        };

        // Create Google Maps data layers for tags and nodes
        nodeLayer = new google.maps.Data({
          map: map.instance,
          style: {
            clickable: true,
            icon: icons['node'].default
          }
        });

        tagLayer = new google.maps.Data({
          map:map.instance,
          style: {
            clickable: true,
            icon: icons['tag'].default
          }
        });

        // Create arrays for node and tag pins
        var pins_nodes = {};
        var pins_tags = {};
        var textboxes = {};
    // ================================================
    // Draw map controls
        // Draw Legend
        map.instance.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($('#legend')[0])
        for (var key in icons) {
          var type = icons[key];
          var name = type.name;
          var icon = type.default.path;
          var color = type.default.fillColor;
          var label = '<div><svg height="22" width="22" viewBox="0 0 25 25"> <path d=' + icon + ' fill=' + color + '/></svg>' + name + '</div>';
          $('#legend').append(label)
        }
        // Draw Info Box
        map.instance.controls[google.maps.ControlPosition.LEFT_BOTTOM].push($('#infobox')[0])

    // ================================================
    // Reactively update map
        self.autorun(function() {

          const nodes = Nodes.find().observe({

            added: function(document) {
              pin = addNode(document);
              pins_nodes[document._id] = pin;
              // console.log('added ' + pins_nodes[document._id].getId());
            },

            changed: function(newDocument, oldDocument) {
              var latLng = new google.maps.LatLng({lat: newDocument.gps.lat, lng: newDocument.gps.lon});
              pins_nodes[newDocument._id].setGeometry(latLng);
              txtbox = textboxes[oldDocument._id];
              removeMapObject(txtbox);
            },

            removed: function(oldDocument) {
              // console.log('removed ' + pins_nodes[oldDocument._id].getId());
              txtbox = textboxes[oldDocument._id];
              nodeLayer.remove(pins_nodes[oldDocument._id]);

              removeMapObject(txtbox);
              pins_nodes[oldDocument._id] = null;
            }

          });

          // const tags = Tags.find().observe({
          //
          //   added: function(document) {
          //     pin = addTag(document);
          //     pins_tags[document._id] = pin;
          //     // console.log('added ' + pins_tags[document._id].getId());
          //   },
          //
          //   changed: function(newDocument, oldDocument) {
          //     var latLng = new google.maps.LatLng({lat: newDocument.gps.lat, lng: newDocument.gps.lon});
          //     pins_tags[newDocument._id].setGeometry(latLng);
          //     txtbox = textboxes[oldDocument._id];
          //     removeMapObject(txtbox);
          //   },
          //
          //   removed: function(oldDocument) {
          //     // console.log('removed ' + pins_nodes[oldDocument._id].getId());
          //     txtbox = textboxes[oldDocument._id];
          //     tagLayer.remove(pins_nodes[oldDocument._id]);
          //
          //     removeMapObject(txtbox);
          //     pins_tags[oldDocument._id] = null;
          //   }
          //
          // });
        });
    //===================================================
    // Google Map's listeners for testing
        google.maps.event.addListener(map.instance, 'click',
          function (event) {});
        google.maps.event.addListener(map.instance, 'rightclick', function (event) {
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
        });

        nodeLayer.addListener('rightclick',
            function (event) {
              Nodes.remove(event.feature.getId());
            });

        // nodeLayer.addListener('click',
        //     function (event) {
        //       lat = (Random.fraction()*180) - 90;
        //       lon = (Random.fraction()*360) - 180;
        //
        //       nodeLayer.overrideStyle(event.feature, {icon: icons['node'].selected});
        //       Nodes.update(event.feature.getId(), { $set: {gps: { lat: lat, lon: lon}}});
        //     });

        tagLayer.addListener('rightclick',
            function (event) {
              nodeLayer.remove(event.feature);
            });
    //===================================================
    // Google Maps listeners for displaying infoboxes
        // Nodes: Mouseover event
        nodeLayer.addListener('mouseover',
            function (event) {
              // console.log('mouseover: ' + event.feature.getId());
              txt = event.feature.getProperty('text');
              txtbox = hoverBox(event.latLng,txt);
              textboxes[event.feature.getId()] = txtbox;
              txtbox.show();
            });
        // Nodes: Mouseout event
        nodeLayer.addListener('mouseout',
            function (event) {
              // console.log('mouseout: ' + event.feature.getId());
              txtbox = textboxes[event.feature.getId()];
              removeMapObject(txtbox);
            });

        // Nodes: Mouseover event
        tagLayer.addListener('mouseover',
            function (event) {
              // console.log('mouseover: ' + event.feature.getId());
              txt = event.feature.getProperty('text');
              txtbox = hoverBox(event.latLng,txt);
              textboxes[event.feature.getId()] = txtbox;
              txtbox.show();
            });
        // Nodes: Mouseout event
        tagLayer.addListener('mouseout',
            function (event) {
              // console.log('mouseout: ' + event.feature.getId());
              txtbox = textboxes[event.feature.getId()];
              removeMapObject(txtbox);
            });

    //====================================================
    // Map functions
        function nodeText(node) {

          //console.log(node)
          var txt = "<b>nodeID: </b>" + "<br> " + node.nodeID + "<br><br>" +
                    "<b>GPS: </b>" + "<br> " +
                    "<b>Lat: </b>" + "<br> " + node.gps.lat + "<br> " +
                    "<b>Lon: </b>" + "<br> " + node.gps.lon + "<br> " +
                    "<b>Timestamp: </b>" + "<br> " + node.gps.timestamp + "<br>";

          return txt;
        }

        function addTag(tag) {
          // Add tag marker
          var latLng = new google.maps.LatLng({lat: node.gps.lat, lng: node.gps.lon});

          var pin_tag = new google.maps.Data.Feature({
            geometry: new google.maps.Data.Point(latLng),
            id: node.nodeID,
            properties: {
              timestamp: node.gps.timestamp,
              info: hoverBox(latLng,displayCoordinates(latLng))
            }
          });

          var tag = tagLayer.add(pin_node);
        }

        function addNode(node) {
          // Add node marker
          var latLng = new google.maps.LatLng({lat: node.gps.lat, lng: node.gps.lon});

          var pin_node = new google.maps.Data.Feature({
            geometry: new google.maps.Data.Point(latLng),
            id: node._id,
            properties: {
              nodeID: node.nodeID,
              text: nodeText(node)
            }
          });

          // console.log(pin_node);
          // console.log(pin_node.getGeometry().get().lat());
          // console.log(pin_node.getGeometry().get().lng());
          return nodeLayer.add(pin_node);
        }

        function hoverBox(latLng, hovertxt){
          var txt = new TxtOverlay(latLng, hovertxt, "hoverBox", map.instance)
          txt.hide();
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
                zoom: 18, // 18
                minZoom: 16, // 16
                disableDefaultUI: true,
                fullscreenControl: true,
                styles: [{
                    featureType: 'poi',
                    stylers: [{visibility: 'off'}]
                }]

            };
        }
    }
});
