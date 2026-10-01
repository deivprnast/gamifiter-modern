
function myMarkerStats(user, totalDistance) {
    const roadStatsText = roadStats(totalDistance, user.progress);

    return `<h5 class="fw-bold my-0 mb-1">${user.user}</h5>
            <p class="my-0 lh-sm"><span class="fw-bold">Výzva:</span> ${parseInt(user.progress * 100)} %</p>
            <p class="my-0 lh-sm"><span class="fw-bold">Virtuální vzdálenost:</span> ${roadStatsText}</p>
            `
}

function roadStats(totalDistance, challenge) {
    walkedDistance = (totalDistance * challenge).toFixed()
    totalDistance = totalDistance.toFixed();

    let actualDistanceColor;
    let endColor;
    if (challenge === 1) {
        actualDistanceColor = "#00e676"
        endColor = actualDistanceColor
    } else if (challenge === 0) {
        actualDistanceColor = "#ff3d00"
        endColor = actualDistanceColor
    }

    return `<span style =color:${actualDistanceColor}> ${walkedDistance}</span>/<span style="color:${endColor}">${totalDistance}</span> km`
}

function filterMarkersByWalkedRoad(road, markers) {
    road_coords = road.geometry.coordinates

    for (let i = 0; i < markers.length; i++) {
        markers[i].properties.show = false
        for (let y = 0; y < road_coords.length; y++) {
            if ((JSON.stringify(markers[i].geometry.coordinates) === JSON.stringify(road_coords[y]) && (markers[i].properties.start != true))) {
                markers[i].properties.show = true
            }
        }
    }
    return markers
}

function DistanceMarker(road, markers) {
    road_coords = road.geometry.coordinates

    for (let i = 0; i < markers.length; i++) {
        markers[i].properties.show = false
        for (let y = 0; y < road_coords.length; y++) {
            if (JSON.stringify(markers[i].geometry.coordinates) === JSON.stringify(road_coords[y])) {
                markers[i].properties.position = y
            }
        }
    }

    return markers
}

function createMarkers(markers, actualPosition, roadDistance, roadLength) {
    const width = 64
    const height = 48
    const unknownIcon = `https://ui-avatars.com/api/?background=424242&color=ffffff&size=${width}&name=??`

    return L.geoJson(markers, {
        pointToLayer: function (feature, coordinates) {
            if ((feature.properties.show == true) || (actualPosition == roadLength)) {
                feature.properties.show = true
                url = `https://countryflagsapi.com/svg/${feature.properties.code}`
                // url = `https://flagcdn.com/${width}x${height}/${feature.properties.code}.png`
            } else {
                url = unknownIcon
            }
            const markerOptions = {
                icon: L.icon({
                    iconUrl: url,
                    iconSize: [width / 2, height / 2],
                    iconAnchor: [width / 4, height / 4],
                })
            }
            return L.marker(coordinates,
                markerOptions)
        },
        onEachFeature: function onEachFeature(feature, layer) {
            layer.bindPopup(createMarkPopup(feature, actualPosition, roadDistance, roadLength))
        }
    })

}

function createMarkPopup(feature, actualPosition, roadDistance, roadLength) {
    const position_distance = feature.properties.position
    const x = roadDistance / roadLength
    const unlockAtKm = (position_distance - actualPosition) * x
    let popup;
    if (feature.properties.show === true) {
        if (feature.properties.title === null) {
            feature.properties.title = feature.properties.city_cs
        }
        popup = `
        <h5 class="fw-bold my-0 mb-1">${feature.properties.city_cs}, ${feature.properties.country_cs}</h5>
        <p class="my-0 lh-sm">${feature.properties.content}</p>
        <p class="fst-italic my-0 mt-1 lh-sm text-end"><a href="${feature.properties.link}">${feature.properties.reference}</a></p>
        `
    } else {
        popup = `<p class="my-0 lh-sm">Bod na mapě se odemkne za ${unlockAtKm.toFixed()} km!</p>`
    }
    return popup
}

function createRoad(road, toGo, interactive) {
    let roadStyle;
    if (toGo === true) {
        roadStyle = {
            "color": "#ff3d00",
            "weight": 5,
            "opacity": 0.6
        };
    } else {
        roadStyle = {
            "color": "#00e676",
            "weight": 5,
            "opacity": 0.6
        };
    }

    return L.geoJson(road, {
        style: roadStyle,
        interactive: interactive
    })
}

function createMyMarker(user) {
    const userColor = "ffffff"
    const userBgColor = "f50057"
    const size = 30;
    const markerOptions = {
        icon: L.icon({
            iconUrl: `https://ui-avatars.com/api/?background=${userBgColor}&color=${userColor}&rounded=true&size=${size}&name=${user.user}`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
        })
    }

    const myMarker = L.marker(user.coordinates, markerOptions);
    return myMarker
}

function getRoadToShow(users) {
    var road = users.find(e => e.showTrack === true);

    // var leader = users.reduce(function (prev, current) {
    //     if (+current.progress > +prev.progress) {
    //         return current;
    //     } else {
    //         return prev;
    //     }
    // });

    return road
}

function getMyMarkerCoordinates(user, road, roadLength) {
    let actualPosition = roadLength * user.progress;
    let coordinates = road.geometry.coordinates.slice(0, actualPosition);
    if (user.progress == 0) {
        myMarkerCoordinates = [road.geometry.coordinates[0][1], road.geometry.coordinates[0][0]];
    } else if (user.progress != 0) {
        last_ele = coordinates.length - 1;
        myMarkerCoordinates = [road.geometry.coordinates[last_ele][1], road.geometry.coordinates[last_ele][0]];
    }

    return myMarkerCoordinates
}

function createClusters() {
    const clusterBgColor = "c51162"
    const clusterColor = "ffffff"
    const clusterSize = 30
    let markersCluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 5,
        iconCreateFunction: function (cluster) {
            return L.icon({
                iconUrl: `https://ui-avatars.com/api/?background=${clusterBgColor}&color=${clusterColor}&rounded=true&size=${clusterSize}&name=${cluster.getChildCount()}`,
                iconSize: [clusterSize, clusterSize],
                iconAnchor: [clusterSize / 2, clusterSize / 2],
            });
        }
    });

    return markersCluster
}

async function initRoads(settings, users) {
    div = settings.div
    file = settings.file
    userRoadShow = getRoadToShow(users)

    const attribution =
        "&copy Gamifiter 2022 | &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors";

    const map = new L.map(div, {
        minZoom: 3,
        zoomSnap: 0.25
    });
    const tiles = new L.TileLayer(
        "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution }
    );

    map.addLayer(tiles);

    const response = await fetch(file);
    const geojson = await response.json();

    let road = geojson["features"].filter(feature => {
        return feature.properties.info == "full_road";
    })[0]
    let walkedRoad = structuredClone(road)

    let markers = geojson.features.filter(feature => {
        return feature.geometry.type == "Point";
    })

    markers = DistanceMarker(road, markers)

    const roadDistance = road.properties.distance;
    const roadLength = road.geometry.coordinates.length;
    let roadShow = roadLength * userRoadShow.progress;
    walkedRoad.geometry.coordinates = walkedRoad.geometry.coordinates.slice(0, roadShow);

    // users.forEach(function (user) {
    //     user.coordinates = getMyMarkerCoordinates(user, road, roadLength);
    // })

    const markers_layer = createMarkers(filterMarkersByWalkedRoad(walkedRoad, markers), roadShow, roadDistance, roadLength);
    const road_layer = createRoad(road, true, false);
    const walkedRoad_layer = createRoad(walkedRoad, false, false);

    let markersCluster = createClusters()

    markers_layer.addTo(markersCluster)
    road_layer.addTo(map)
    walkedRoad_layer.addTo(map)


    users.forEach(function (user) {
        user.coordinates = getMyMarkerCoordinates(user, road, roadLength);
        let myMarker = createMyMarker(user);
        let myMarkerStatsText = myMarkerStats(user, roadDistance);
        myMarker.setZIndexOffset(100).bindPopup(myMarkerStatsText).addTo(markersCluster)
    })

    markersCluster.addTo(map);

    bounds = markers_layer.getBounds();
    bounds._southWest.lat -= 0.75; // Add more space to "zoom" distance
    bounds._northEast.lat += 0.75; // Add more space to "zoom" distance
    map.fitBounds(bounds);

}

function deleteCreateMapContainer(div) {
    const element = document.getElementById(div);
    element.remove();

    const appContainer = document.getElementById("app-container");

    const createApp = document.createElement("div");
    createApp.setAttribute("class", "ratio ratio-16x9");
    createApp.setAttribute("id", div);

    appContainer.appendChild(createApp);

}

// settings = { "div": "challengeDiv", "file": "tour_de_cities.geojson" }
// users = [{ "user": "Michal Vorlíček", "progress": 1, "showTrack": false }, { "user": "Josef Heidler", "progress": 0.7, "showTrack": true }, { "user": "David Prycl", "progress": 1, "showTrack": true }]
// initRoads(settings, users);