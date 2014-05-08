/**
 * Create a custom overlay for our window marker display, extending google.maps.OverlayView.
 * This is somewhat complicated by needing to async load the google.maps api first - thus, we
 * wrap CustomWindow into a closure, and when instantiating CustomWindow, we first execute the closure
 * (to create our CustomWindow function, now properly extending the newly loaded google.maps.OverlayView),
 * and then instantiate said function.
 * @type {Function}
 */
function GenCustomWindow(){
    var CustomWindow = function(){
        this.container = document.createElement('div');
        this.container.classList.add('map-info-window');
        this.layer = null;
        this.marker = null;
        this.position = null;
    };
    /**
     * Inherit from OverlayView
     * @type {google.maps.OverlayView}
     */
    CustomWindow.prototype = new google.maps.OverlayView();
    /**
     * Called when this overlay is set to a map via this.setMap. Get the appropriate map pane
     * to add the window to, append the container, bind to close element.
     * @see CustomWindow.open
     */
    CustomWindow.prototype.onAdd = function(){
        this.layer = this.getPanes().floatPane;
        this.layer.appendChild(this.container);
        this.container.getElementsByClassName('map-info-close')[0].addEventListener('click', function(){
            // Close info window on click
            this.close();
        }.bind(this), false);
        // Ensure newly opened window is fully in view
        setTimeout(this.panToView.bind(this), 200);
    };
    /**
     * Called after onAdd, and every time the map is moved, zoomed, or anything else that
     * would effect positions, to redraw this overlay.
     */
    CustomWindow.prototype.draw = function(){
        var markerIcon = this.marker.getIcon(),
            cHeight = this.container.offsetHeight + markerIcon.scaledSize.height + 10,
            cWidth = this.container.offsetWidth / 2;
        this.position = this.getProjection().fromLatLngToDivPixel(this.marker.getPosition());
        this.container.style.top = this.position.y - cHeight+'px';
        this.container.style.left = this.position.x - cWidth+'px';
    };
    /**
     * If the custom window is not already entirely within the map view, pan the map the minimum amount
     * necessary to bring the custom info window fully into view.
     */
    CustomWindow.prototype.panToView = function(){
        var position = this.position,
            latlng = this.marker.getPosition(),
            top = parseInt(this.container.style.top, 10),
            cHeight = position.y - top,
            cWidth = this.container.offsetWidth / 2,
            map = this.getMap(),
            center = map.getCenter(),
            bounds = map.getBounds(),
            degPerPixel = (function(){
                var degs = {},
                    div = map.getDiv(),
                    span = bounds.toSpan();

                degs.x = span.lng() / div.offsetWidth;
                degs.y = span.lat() / div.offsetHeight;
                return degs;
            })(),
            infoBounds = (function(){
                var infoBounds = {};

                infoBounds.north = latlng.lat() + cHeight * degPerPixel.y;
                infoBounds.south = latlng.lat();
                infoBounds.west = latlng.lng() - cWidth * degPerPixel.x;
                infoBounds.east = latlng.lng() + cWidth * degPerPixel.x;
                return infoBounds;
            })(),
            newCenter = (function(){
                var ne = bounds.getNorthEast(),
                    sw = bounds.getSouthWest(),
                    north = ne.lat(),
                    east = ne.lng(),
                    south = sw.lat(),
                    west = sw.lng(),
                    x = center.lng(),
                    y = center.lat(),
                    shiftLng = ((infoBounds.west < west) ? west - infoBounds.west : 0) +
                        ((infoBounds.east > east) ? east - infoBounds.east : 0),
                    shiftLat = ((infoBounds.north > north) ? north - infoBounds.north : 0) +
                        ((infoBounds.south < south) ? south - infoBounds.south : 0);

                return (shiftLng || shiftLat) ? new google.maps.LatLng(y - shiftLat, x - shiftLng) : void 0;
            })();

        if (newCenter){
            map.panTo(newCenter);
        }
    };
    /**
     * Called when this overlay has its map set to null.
     * @see CustomWindow.close
     */
    CustomWindow.prototype.onRemove = function(){
        this.layer.removeChild(this.container);
    };
    /**
     * Sets the contents of this overlay.
     * @param {string} html
     */
    CustomWindow.prototype.setContent = function(html){
        this.container.innerHTML = html;
    };
    /**
     * Sets the map and relevant marker for this overlay.
     * @param {google.maps.Map} map
     * @param {google.maps.Marker} marker
     */
    CustomWindow.prototype.open = function(map, marker){
        this.marker = marker;
        this.setMap(map);
    };
    /**
     * Close this overlay by setting its map to null.
     */
    CustomWindow.prototype.close = function(){
        this.setMap(null);
    };
    return CustomWindow;
}