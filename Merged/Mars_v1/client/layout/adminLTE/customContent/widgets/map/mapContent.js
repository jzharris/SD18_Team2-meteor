import { Random } from 'meteor/random';

Template.mapContent.onCreated(function() {
    var self = this;

/*    Meteor.setInterval(function() {
        console.log('interval');


    }, 60000);*/

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
        //map.instance.controls[google.maps.ControlPosition.LEFT_BOTTOM].push($('#infobox')[0])

    // ================================================
    // Reactively update map
        self.autorun(function() {

          const nodes = SortedNodes.find().observe({

            added: function(document) {
              addNode(document);
            },

            changed: function(newDocument, oldDocument) {
              var gps = newDocument.gps[0];

              var latLng = new google.maps.LatLng({lat: gps.lat, lng: gps.lon});

              var pin = nodeLayer.getFeatureById(oldDocument._id);
              pin.setGeometry(latLng);
              pin.setProperty('timestamp', gps.timestamp);
              removeMapObject(txtbox);
            },

            removed: function(oldDocument) {

              var pin = nodeLayer.getFeatureById(oldDocument._id);
              if (typeof pin !== 'undefined'){
                // Node is already plotted on map
                // Remove exsisting marker
                nodeLayer.remove(pin);
                removeMapObject(txtbox);

                console.log('Removed map marker for node: ' + oldDocument._id);
              }
            }
          });

          const tags = SortedTags.find().observe({

            added: function(document) {
              console.log(document)
              addTag(document);
            },

            changed: function(newDocument, oldDocument) {
              var pos = newDocument.pos;

              if (typeof pos !== 'undefined'){
                //console.log(oldDocument._id);

                var latLng = new google.maps.LatLng({lat: pos.lat, lng: pos.lon});

                var pin = tagLayer.getFeatureById(oldDocument._id);
                pin.setGeometry(latLng);
                pin.setProperty('timestamp', pos.timestamp);
                removeMapObject(txtbox);
              }
            },

            removed: function(oldDocument) {

              var pin = tagLayer.getFeatureById(oldDocument._id);
              if (typeof pin !== 'undefined'){
                // Node is already plotted on map
                // Remove exsisting marker
                tagLayer.remove(pin);
                removeMapObject(txtbox);

                console.log('Removed map marker for tag: ' + oldDocument._id);
              }
            }
          });
        });
    //===================================================
    // FOR DEBUGING
        google.maps.event.addListener(map.instance, 'click',
          function (event) {

            Meteor.call('randomNodeId', function(error, result) {

              var tagid = Random.id();

              for (i in result){
                //console.log(result[i]._id);
                var newtag = tag(result[i]._id,tagid);
                //console.log(newtag);
                Tags.insert(newtag);
              }

            });
            //console.log(SortedTags._collection._docs._map)
          });

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
            Tags.find({tagID: event.feature.getId()}).forEach(
              function(document){
                  Tags.remove(document._id);
              });
        });

        tagLayer.addListener('click', function (event) {
          Meteor.call('randomNodeId', function(error, result) {

            var tagid = event.feature.getId();

            for (i in result){
              //console.log(result[i]._id);
              var newtag = tag(result[i]._id,tagid);
              //console.log(newtag);
              Tags.insert(newtag);
            }

          });
          //console.log(SortedTags._collection._docs._map)
        });
    //===================================================
    // Google Maps listeners for displaying infoboxes
        // Nodes: Mouseover event
        nodeLayer.addListener('mouseover',
            function (event) {
              // console.log('mouseover: ' + event.feature.getId());
              var node = event.feature;
              var id = node.getId();
              var latLng = node.getGeometry().get();
              var timestamp = node.getProperty('timestamp');
              var elapsedtime = time_diff(timestamp);

              var txt = "<b>Node ID: </b>" + "<br> " + id + "<br><br>" +
                        "<b>GPS: </b>" + "<br> " +
                        "<b>Lat: </b>" + "<br> " + latLng.lat() + "<br> " +
                        "<b>Lon: </b>" + "<br> " + latLng.lng() + "<br> " +
                        "<b>Last Update: </b>" + "<br> " + elapsedtime + " ago <br>";

              txtbox = hoverBox(event.latLng,txt);
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
              var tag = event.feature;
              var id = tag.getId();
              var latLng = tag.getGeometry().get();
              var timestamp = tag.getProperty('timestamp');
              var elapsedtime = time_diff(timestamp);

              var txt = "<b>Tag ID: </b>" + "<br> " + id + "<br><br>" +
                        "<b>Position: </b>" + "<br> " +
                        "<b>Lat: </b>" + "<br> " + latLng.lat() + "<br> " +
                        "<b>Lon: </b>" + "<br> " + latLng.lng() + "<br> " +
                        "<b>Last Update: </b>" + "<br> " + elapsedtime + " ago <br>";


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
          //var pos = triangulate(tag.nodeID);
          var pos = tag.pos;

          console.log('\nMongo says:\n')
          console.log(SortedTags._collection._docs._map)
          console.log('\n')
          console.log('\nObserver says:\n')
          console.log(tag)
          console.log('\n')

          // Add tag marker
          var pin = tagLayer.getFeatureById(tag._id);
          var latLng = new google.maps.LatLng({lat: pos.lat, lng: pos.lon});

          if (typeof pin !== 'undefined'){
            // Tag is already plotted on map
            // Update map data
            console.log('Updating map marker for tag: ' + tag._id);
            pin.setGeometry(latLng);
            pin.setProperty('timestamp',pos.timestamp);

          } else {
            // Node is not already plotted on map
            // Plot new node marker
            console.log('Creating new map marker for tag: ' + tag._id);
            var pin_tag = new google.maps.Data.Feature({
              geometry: new google.maps.Data.Point(latLng),
              id: tag._id,
              properties: {
                timestamp: pos.timestamp
              }
            });
          }
          // console.log(pin_tag);
          // console.log(pin_tag.getGeometry().get().lat());
          // console.log(pin_tag.getGeometry().get().lng());
          return tagLayer.add(pin_tag);
        }

        function addNode(node) {
          var gps = node.gps[0];

          // Add node marker
          var pin = nodeLayer.getFeatureById(node._id);
          var latLng = new google.maps.LatLng({lat: gps.lat, lng: gps.lon});

          if (typeof pin !== 'undefined'){
            // Node is already plotted on map
            // Update map data
            console.log('Updating map marker for node: ' + node._id);
            pin.setGeometry(latLng);
            pin.setProperty('timestamp',gps.timestamp);

          } else {
            // Node is not already plotted on map
            // Plot new node marker
            console.log('Creating new map marker for node: ' + node._id);
            var pin_node = new google.maps.Data.Feature({
              geometry: new google.maps.Data.Point(latLng),
              id: node._id,
              properties: {
                timestamp: gps.timestamp
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
