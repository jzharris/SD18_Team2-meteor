import { Random } from 'meteor/random';

Template.mapContent.onCreated(function() {
    var self = this;

    // Meteor.setInterval(function() {
    //
    //     console.log("inserting");
    //     Nodes.insert(node());
    //
    //     if(Random.fraction() < 0.25) {
    //
    //         const nodeID = Random.id();
    //         const tagID = Random.id();
    //
    //         let arr = [];
    //         for (let i = 1; i <= 10; i++) {
    //             arr.push(i);
    //         }
    //
    //         //random number of tag events between 1 and 10
    //         for (let i = 0; i < Random.choice(arr); i++) {
    //             Tags.insert(tag(nodeID, tagID));
    //         }
    //     }
    //
    // }, 60000);

// ================================================
// Function to run once googlemaps api is ready
    GoogleMaps.ready('map', function(map) {
    // ================================================
    // Setup common variables
        // Define map symbols for tags and nodes
        var icons = {
            tag: {
              name: 'Tag',
              default: new Icon('Tag','LimeGreen'),
              selected: new Icon('Tag','LightBlue'),
              alert: new Icon('Tag','OrangeRed')
            },
            node: {
              name: 'Node',
              default: new Icon('Node','LimeGreen'),
              selected: new Icon('Node','LightBlue'),
              alert: new Icon('Node','OrangeRed')
            }
        };

        // Create Google Maps data layers for tags and nodes
        nodeLayer = new google.maps.Data({
          map: map.instance,
          style: {
            clickable: true,
            icon: icons.node.default
          }
        });

        tagLayer = new google.maps.Data({
          map:map.instance,
          style: {
            clickable: true,
            icon: icons.tag.default
          }
        });


        var textbox = ''
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
              addNode(document);
            },

            changed: function(newDocument, oldDocument) {
              var latLng = new google.maps.LatLng({lat: newDocument.gps.lat, lng: newDocument.gps.lon});

              var pin = nodeLayer.getFeatureById(oldDocument.nodeID);
              pin.setGeometry(latLng);
              removeMapObject(txtbox);
            },

            removed: function(oldDocument) {

              var pin = nodeLayer.getFeatureById(oldDocument.nodeID);
              if (typeof pin !== 'undefined'){
                // Node is already plotted on map
                // Remove exsisting marker
                nodeLayer.remove(pin);
                removeMapObject(txtbox);

                console.log('Removed map marker for node: ' + oldDocument.nodeID);
              }
            }
          });

          const tags = Tags.find().observe({

            added: function(document) {
              addTag(document);

            },

            changed: function(newDocument, oldDocument) {
              var latLng = new google.maps.LatLng({lat: newDocument.gps.lat, lng: newDocument.gps.lon});

              var pin = tagLayer.getFeatureById(oldDocument._id);
              pin.setGeometry(latLng);

              removeMapObject(txtbox);
            },

            removed: function(oldDocument) {

              var pin = tagLayer.getFeatureById(oldDocument._id);

              console.log('Removed map marker for tag: ' + oldDocument.nodeID);
              tagLayer.remove(pin);
              removeMapObject(txtbox);
            }

          });
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
              Nodes.find({nodeID: event.feature.getId()}).forEach(
                function(document){
                    Nodes.remove(document._id);
                });
            });

        nodeLayer.addListener('click', function (event) {
          Nodes.insert({
              nodeID: event.feature.getId(),
              nodeVersion: '1.0.0',
              nodeType: 'Tester',
              battery: {
                  voltage: Random.fraction()*10,
                  amperage: Random.fraction()*2,
                  timestamp: new Date()
              },
              gps: {
                  lat: (Random.fraction()*180) - 90,
                  lon: (Random.fraction()*360) - 180,
                  timestamp: new Date()
              }
          });
        });

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
              txtbox = hoverBox(event.latLng,event.feature.getProperty('text'));
              txtbox.show();
            });
        // Nodes: Mouseout event
        nodeLayer.addListener('mouseout',
            function (event) {
              // console.log('mouseout: ' + event.feature.getId());
              removeMapObject(txtbox);
            });
        // Nodes: Mouseover event
        tagLayer.addListener('mouseover',
            function (event) {
              // console.log('mouseover: ' + event.feature.getId());
              var txt = event.feature.getProperty('text');
              txtbox = hoverBox(event.latLng,txt);
              txtbox.show();
            });
        // Nodes: Mouseout event
        tagLayer.addListener('mouseout',
            function (event) {
              // console.log('mouseout: ' + event.feature.getId());
              removeMapObject(txtbox);
            });

    //====================================================
    // Map functions

        function addTag(tag) {
          // Add tag marker
          var pin = tagLayer.getFeatureById(tag.tagID);


          var latLng = new google.maps.LatLng({lat: tag.gps.lat, lng: tag.gps.lon});

          var pin_tag = new google.maps.Data.Feature({
            geometry: new google.maps.Data.Point(latLng),
            id: tag.tagID,
            properties: {
              timestamp: tag.sent,
              info: 'test'
            }
          });

          var tag = tagLayer.add(pin_node);
        }

        function addNode(node) {
          // Add node marker
          var pin = nodeLayer.getFeatureById(node.nodeID);
          var latLng = new google.maps.LatLng({lat: node.gps.lat, lng: node.gps.lon});
          var txt = "<b>nodeID: </b>" + "<br> " + node.nodeID + "<br><br>" +
                    "<b>GPS: </b>" + "<br> " +
                    "<b>Lat: </b>" + "<br> " + node.gps.lat + "<br> " +
                    "<b>Lon: </b>" + "<br> " + node.gps.lon + "<br> " +
                    "<b>Timestamp: </b>" + "<br> " + node.gps.timestamp + "<br>";

          if (typeof pin !== 'undefined'){
            // Node is already plotted on map
            // Update map data
            console.log('Updating map marker for node: ' + node.nodeID);
            pin.setGeometry(latLng);
            pin.setProperty('text',txt);

          } else {
            // Node is not already plotted on map
            // Plot new node marker
            console.log('Creating new map marker for node: ' + node.nodeID);
            var pin_node = new google.maps.Data.Feature({
              geometry: new google.maps.Data.Point(latLng),
              id: node.nodeID,
              properties: {
                docID: node._id,
                text: txt
              }
            });
          }

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
            // Function for removing objectss from the map
            if (typeof object !== 'undefined'){
              // Check if object exsists
              object.setMap(null);
            }
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
                zoom: 0, // 18
                minZoom: 0, // 16
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
