function filterDistrictsByChallenge(challenge, geojson) {
    let districts = geojson.features
    let show_edge = 1 / districts.length
    let status = true

    for (let i = 0; i < districts.length; i++) {
        let edge = show_edge + (i * show_edge)
        districts[i].properties.status = null
        districts[i].properties.limit = null

        if (challenge > edge) {
            districts[i].properties.show = true
        }
        else {
            districts[i].properties.show = false
            districts[i].properties.limit = Math.round((edge - challenge) * 100)

            if (status && i < 0) {
                districts[i - 1].properties.status = "new"
                districts[i].properties.status = "upcoming"
                status = false
            }
        }

    }

    console.log(districts)
    return districts
}

function districtStyle(feature) {
    let color;
    let fillOpacity = 0.2

    if (feature.properties.show) {
        color = "#00e676"
    } else {
        color = "#ff3d00"
    }

    if (feature.properties.status) {
        fillOpacity = 0.6
    }

    return {
        "color": color,
        "weight": 2,
        "opacity": 1,
        "fillOpacity": fillOpacity
    };
}

function districtPopup(feature, layer) {
    let status = null
    let limit = feature.properties.limit
    switch (feature.properties.status) {
        case "new":
            status = `<span class="badge bg-success">Nový</span>`
            break;
        case "upcoming":
            status = `<p class="my-0 lh-sm fw-bold">Toto pole bude brzy odemknuto.</p>`
            break;
        default:
            status = ""
            break;
    }

    let popup_content = `<p class="my-0 lh-sm">Bod na mapě je zamčený!</p>
                    <p class="my-0 lh-sm">Zbývá splnit ještě <span style="color:#ff3d00">${limit} % výzvy</span>.</p>` + status
    if (feature.properties.show) {
        let district = feature.properties.name
        let city = `<span class="fw-bold">Sídlo kraje:</span> ${feature.properties.city}`
        let area = `<span class="fw-bold">Rozloha:</span> ${feature.properties.area} km<sup>2</sup>`
        let urban = `<span class="fw-bold">Počet obyvatel:</span> ${feature.properties.urban}`
        let density = `<span class="fw-bold">Hustota zalidnění:</span> ${feature.properties.density_km} obyv./km<sup>2</sup>`
        popup_content = `<h5 class="fw-bold my-0 mb-1">${district} ${status}</h5>
                    <p class="my-0 lh-sm">${city}</p>
                    <p class="my-0 lh-sm">${area}</p>
                    <p class="my-0 lh-sm">${urban}</p>
                    <p class="my-0 lh-sm">${density}</p>
                    `
    }

    layer.bindPopup(popup_content);
}

async function initDistricts(settings, user) {
    let div = settings.div
    let file = settings.file
    let challenge = user.progress

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

    layers = filterDistrictsByChallenge(challenge, geojson)

    let districts_layer = L.geoJSON(geojson, {
        onEachFeature: districtPopup,
        style: districtStyle
    })
    districts_layer.addTo(map)

    bounds = districts_layer.getBounds();
    bounds._southWest.lat -= 0.25; // Add more space to "zoom" distance
    bounds._northEast.lat += 0.25; // Add more space to "zoom" distance
    map.fitBounds(bounds);

}

// let settings = { "div": "challengeDiv", "file": "districts.geojson" }
// let user = { "user": "Michal Vorlíček", "progress": 1 }
// initDistricts(settings, user);