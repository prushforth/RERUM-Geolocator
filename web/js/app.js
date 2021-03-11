/* 
 * RERUM Geolocator Application Script
 * @author Bryan Haberberger
 * 
 * 
 */


GEOLOCATOR = {}

GEOLOCATOR.mymap={}

GEOLOCATOR.APPAGENT = "http://devstore.rerum.io/v1/id/5ed28964e4b048da2fa4be2b"

GEOLOCATOR.URLS = {
    DELETE: "delete",
    CREATE: "create",
    UPDATE: "update",
    QUERY: "query",
    OVERWRITE: "overwrite"
}

/**
 * Given the URI of a IIIF Presentation API 3.0 Manifest, resolve it and draw the GeoJSON-LD Web Annotations within.
 * @param {type} manifestURL URI of the web resource to render and consume.
 * @return {Array}
 */
GEOLOCATOR.consumeManifestForGeoJSON = async function(manifestURL){
    let r = []
    let manifestObj = await fetch(manifestURL)
        .then(resp => resp.json())
        .then(man => {return man})
        .catch(err => {return null})
   
    if(manifestObj){
        let manifestResourceType = manifestObj.type ? manifestObj.type : manifestObj["@type"] ? manifestObj["@type"] : ""
        if(manifestResourceType !== "Manifest"){
            alert("The data resource must be a IIIF Presentation API 3 'Manifest' resource types.  Please check the type.")
            return r
        }
        if (manifestObj.hasOwnProperty("@context")){
            if(typeof manifestObj["@context"] === "string" && manifestObj["@context"] !== "http://iiif.io/api/presentation/3/context.json"){
                alert("This will only consume IIIF Presentation API 3 Manifest resources.")
                return r
            }
            else if (Array.isArray(manifestObj["@context"]) && manifestObj["@context"].length > 0){
                if(!manifestObj["@context"].includes("http://iiif.io/api/presentation/3/context.json")){
                    alert("This will only consume IIIF Presentation API 3 Manifest resources.")
                    return r
                }
            }
            else if(typeof manifestObj["@context"] === "object"){
                alert("We cannot support custom context objects.  You can include multiple context JSON files, but please include the latest IIIF Presentation API 3 context.  This will only consume IIIF Presentation API 3 Manifest resources.")
                return r
            }
        }
        else{
            alert("This will only consume IIIF Presentation API 3 Manifest resources.  A context (@context) must be present on the resource.")
            return r
        }
        if(manifestObj.hasOwnProperty("annotations") && manifestObj.annotations.length){
            return manifestObj.annotations.map(webAnno => {
                let webAnnoType = webAnno.type ? webAnno.type : webAnno["@type"] ? webAnno["@type"] : ""
                let webAnnoBodyType = ""
                if(webAnnoType === "Annotation"){
                    //The Annotation has properties on it, like label, that need to end up in the Web Annotation body GeoJSON properties...
                    webAnnoBodyType = webAnno.body.type ? webAnno.body.type : webAnno.body["@type"] ? webAnno.body["@type"] : ""
                    if(webAnnoBodyType){
                        if(typeof webAnnoBodyType === "string"){
                            if(webAnnoBodyType === "Feature"){
                                if(!webAnno.body.hasOwnProperty("properties")){
                                    webAnno.body.properties = {}
                                }
                                if(webAnno.hasOwnProperty("creator")){
                                    webAnno.body.properties.annoCreator = webAnno.creator
                                }
                                webAnno.body.properties.annoID = webAnno["@id"] ? webAnno["@id"] : webAnno.id ? webAnno.id : ""
                                webAnno.body.properties.targetID = webAnno.target ? webAnno.target : ""
                                return webAnno.body
                            }
                            else if (webAnnoBodyType === "FeatureCollection"){
                                if(webAnno.hasOwnProperty("features") && webAnno.features.length){
                                    return webAnno.features.map(feature => {
                                        //We assume the application that created these coordinates did not apply properties.  
                                        if(!feature.hasOwnProperty("properties")){
                                            feature.properties = {}
                                        }
                                        if(webAnno.hasOwnProperty("creator")){
                                            feature.properties.annoCreator = webAnno.creator
                                        }
                                        feature.body.properties.annoID = webAnno["@id"] ? webAnno["@id"] : webAnno.id ? webAnno.id : ""
                                        feature.body.properties.targetID = webAnno.target ? webAnno.target : ""
                                        return feature.body
                                    })
                                }
                            }
                        }
                    }
                }
                else if(webAnnoType === "AnnotationPage"){
                    if(webAnno.hasOwnProperty("items") && webAnno.items.length){
                        return webAnno.items.map(webAnno => {
                            let webAnnoType = webAnno.type ? webAnno.type : webAnno["@type"] ? webAnno["@type"] : ""
                            let webAnnoBodyType = ""
                            if(webAnnoType === "Annotation"){
                                //The Annotation has properties on it, like label, that need to end up in the Web Annotation body GeoJSON properties...
                                webAnnoBodyType = webAnno.body.type ? webAnno.body.type : webAnno.body["@type"] ? webAnno.body["@type"] : ""
                                if(webAnnoBodyType){
                                    if(typeof webAnnoBodyType === "string"){
                                        if(webAnnoBodyType === "Feature"){
                                            if(!webAnno.body.hasOwnProperty("properties")){
                                                webAnno.body.properties = {}
                                            }
                                            if(webAnno.hasOwnProperty("creator")){
                                                webAnno.body.properties.annoCreator = webAnno.creator
                                            }
                                            webAnno.body.properties.annoID = webAnno["@id"] ? webAnno["@id"] : webAnno.id ? webAnno.id : ""
                                            webAnno.body.properties.targetID = webAnno.target ? webAnno.target : ""
                                            return webAnno.body
                                        }
                                        else if (webAnnoBodyType === "FeatureCollection"){
                                            if(webAnno.hasOwnProperty("features") && webAnno.features.length){
                                                return webAnno.features.map(feature => {
                                                    //We assume the application that created these coordinates did not apply properties.  
                                                    if(!feature.hasOwnProperty("properties")){
                                                        feature.properties = {}
                                                    }
                                                    if(webAnno.hasOwnProperty("creator")){
                                                        feature.properties.annoCreator = webAnno.creator
                                                    }
                                                    feature.body.properties.annoID = webAnno["@id"] ? webAnno["@id"] : webAnno.id ? webAnno.id : ""
                                                    feature.body.properties.targetID = webAnno.target ? webAnno.target : ""
                                                    return feature.body
                                                })
                                            }
                                        }
                                    }
                                }
                            }
                        })
                    }
                }
            })
        }
        else{
            alert("There were annotations found on this Manifest.  Nothing to draw.")
            return r
        }
    }
    else{
        alert("There was an error getting the manifest from web.  Please check the URL in a separate tab.")
        return r
    }
}

/**
 * Initialize the application by gathering all GeoJSON-LD Web Annotations from RERUM and 
 * formatting them appropriately for the given open source Web map.  Leaflet and MapML are supported.
 * @param {type} view
 * @return {undefined}
 */
GEOLOCATOR.init =  async function(view){
    let latlong = [12, 12] //default starting coords
    let historyWildcard = {"$exists":true, "$size":0}
    let geoWildcard = {"$exists":true}
    let geos = []
    document.getElementById("leafLat").oninput = GEOLOCATOR.updateGeometry
    document.getElementById("leafLong").oninput = GEOLOCATOR.updateGeometry
    //For my map demo app
    let geoAssertionsQuery = {
        "__rerum.history.next": historyWildcard,
        "__rerum.generatedBy"  : GEOLOCATOR.APPAGENT,
        "creator" : "geolocating@rerum.io"
    }
    let formattedWebAnnotationGeoJSON = []
    let manifestInURL = GEOLOCATOR.getURLVariable("manifest")
    if(manifestInURL){
        formattedWebAnnotationGeoJSON = await GEOLOCATOR.consumeManifestForGeoJSON(manifestInURL)
        .then(geoMarkers => {return geoMarkers})
        .catch(err => {
            console.error(err)
            return []
        })
    }
    else{
        formattedWebAnnotationGeoJSON = await fetch(GEOLOCATOR.URLS.QUERY, {
            method: "POST",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(geoAssertionsQuery)
        })
        .then(response => response.json())
        .then(geoMarkers => {
            return geoMarkers.map(anno => {
               //The Annotation has properties on it, like label, that need to end up in the Web Annotation body GeoJSON properties...
               if(!anno.body.hasOwnProperty("properties")){
                   anno.body.properties = {}
               }
               if(anno.hasOwnProperty("creator")){
                   anno.body.properties.annoCreator = anno.creator
               }
               anno.body.properties.annoID = anno["@id"] ? anno["@id"] : anno.id ? anno.id : ""
               anno.body.properties.targetID = anno.target ? anno.target : ""
               return anno.body
            })
        })
        .catch(err => {
            console.error(err)
            return []
        })
    }
    formattedWebAnnotationGeoJSON = formattedWebAnnotationGeoJSON.flat(1) //AnnotationPages and FeatureCollections cause arrays in arrays.  
    let allGeos = await formattedWebAnnotationGeoJSON.map(async function(geoJSON){ 
        //Avoid NULLS and blanks in the UI
        
        let targetObjDescription = "No English description provided.  See targeted resource for more details."
        let targetObjLabel = "No English label provided.  See targeted resource for more details."
        let isIIIF = false
        let targetURI = geoJSON.properties.targetID ? geoJSON.properties.targetID : "Error"
        let annoID = geoJSON.properties.annoID ? geoJSON.properties.annoID : "Unknown"
        let creator = geoJSON.properties.annoCreator ? geoJSON.properties.annoCreator : "geolocating@rerum.io"
        let targetProps = {"annoID":annoID, "label":targetObjLabel,"description":targetObjDescription, "creator": creator, "isIIIF":isIIIF}
        targetProps.targetID = targetURI
        let targetObj = await fetch(targetURI)
        .then(resp => resp.json())
        .catch(err => {
            console.error(err)
            return null
        })
        //We resolve the targets live time to look for label and description.  They are not stored in the GeoJSON.
        //There are multiple standards friendly ways to supply description and label.  IIIF Presentation API 2.1 and 3.0 formats are supported. 
        if(targetObj){
            isIIIF = GEOLOCATOR.checkForIIIF(targetObj)
            //v3 first
            if(targetObj.hasOwnProperty("summary")){
                if(typeof targetObj.summary === "string"){
                    targetObjDescription = targetObj.summary
                }
                else{
                    if(targetObj.summary.hasOwnProperty("en")){
                        targetObjDescription = targetObj.summary.en[0] ? targetObj.summary.en[0] : "No English description provided.  See targeted resource for more details."
                    }
                    else{
                        targetObjDescription = "No English description provided.  See targeted resource for more details."
                    }
                }
            }
            if(targetObjDescription === "No English description provided.  See targeted resource for more details."){
                if(targetObj.hasOwnProperty("description") && typeof targetObj.description === "string"){
                    targetObjDescription = targetObj.description ? targetObj.description : "No English description provided.  See targeted resource for more details."
                }
            }
            if(targetObj.hasOwnProperty("label")){
                if(typeof targetObj.label === "string"){
                    targetObjLabel = targetObj.label
                }
                else{
                    if(targetObj.label.hasOwnProperty("en")){
                        targetObjLabel = targetObj.label.en[0] ? targetObj.label.en[0] : "No English label provided.  See targeted resource for more details."
                    }
                    else{
                        targetObjLabel = "No English label provided.  See targeted resource for more details."
                    }
                }
            }
            if(targetObjLabel=== "No English label provided.  See targeted resource for more details."){
                if(targetObj.hasOwnProperty("name") && typeof targetObj.name === "string"){
                    targetObjLabel = targetObj.name ? targetObj.name : "No English label provided.  See targeted resource for more details."
                }
            }
            targetProps = {"annoID":annoID, "targetID":targetURI, "label":targetObjLabel, "description":targetObjDescription, "creator":creator, "isIIIF":isIIIF}
        }
        else{
            //This geo assertion is not well defined because its target is not well defined or unresolvable.
        } 
        return {"properties":targetProps, "type":"Feature", "geometry":geoJSON.geometry} 
    })
    //After we have all the Annotations from RERUM and all the targets in those Annotations have been resolved for information...
    let geoAssertions = await Promise.all(allGeos).then(assertions => {return assertions}).catch(err => {return []})    
    switch(view){
        case "leaflet":
            //Put GeoJSON into a Leaflet instance
            GEOLOCATOR.initializeLeaflet(latlong, geoAssertions)
        break
        case "mapML":
            //Put GeoJSON into a MapML instance
            GEOLOCATOR.initializeMapML(latlong, geoAssertions)
        break
        default:
            alert("The only supported open source mapping UIs are Leaflet and MapML.")
    }
}

/**
 * Generate a MapML instance dynamically.  We don't know any coordinates until the application or user gives them to us.
 * @param {type} coords
 * @param {type} geoMarkers
 * @return {undefined}
 */
GEOLOCATOR.initializeMapML = async function(coords, geoMarkers){
    GEOLOCATOR.mymap = document.getElementById('mapml-view')
    GEOLOCATOR.mymap.setAttribute("lat", coords[0])
    GEOLOCATOR.mymap.setAttribute("long", coords[1])
    let feature_layer = `<layer- label="RERUM Geolocation Assertions" checked="checked"><extent units="WGS84"></extent>`
    let mapML_features = geoMarkers.map(geojson_feature => {
        //We need each of these to be a <feature>.  Right now, they are GeoJSON-LD
        let feature_creator = geojson_feature.properties.creator
        let feature_web_URI = geojson_feature.properties.annoID
        let feature_label = geojson_feature.properties.label
        let feature_description = geojson_feature.properties.description
        let feature_describes = geojson_feature.properties.targetID
        let feature_lat = geojson_feature.geometry.coordinates[0]
        let feature_long = geojson_feature.geometry.coordinates[1]
        let geometry = `<geometry><point><coordinates>${feature_lat} ${feature_long}</coordinates></point></geometry>`
        let properties = 
        `<properties>
            <p>Label: ${feature_label}</p>
            <p>Description: ${feature_description}</p>
            <p><a target="_blank" href="${feature_describes}">Web Resource</a></p>
            <p><a target="_blank" href="${feature_web_URI}">Web Annotation</a></p>
        </properties>`
        let feature = `<feature class="generic_point">${properties} ${geometry}</feature>`
        return feature
    })
    mapML_features = mapML_features.join(" ")
    feature_layer += `${mapML_features}</layer->` 
    document.getElementById('mapml-container').style.backgroundImage = "none"
    loadingMessage.classList.add("is-hidden")
    //Add the features to the mapml-viewer dynamically
    GEOLOCATOR.mymap.innerHTML += feature_layer
}
    
GEOLOCATOR.initializeLeaflet = async function(coords, geoMarkers){
    GEOLOCATOR.mymap = L.map('leafletInstanceContainer')   
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidGhlaGFiZXMiLCJhIjoiY2pyaTdmNGUzMzQwdDQzcGRwd21ieHF3NCJ9.SSflgKbI8tLQOo2DuzEgRQ', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 19,
        id: 'mapbox.satellite', //mapbox.streets
        accessToken: 'pk.eyJ1IjoidGhlaGFiZXMiLCJhIjoiY2pyaTdmNGUzMzQwdDQzcGRwd21ieHF3NCJ9.SSflgKbI8tLQOo2DuzEgRQ'
    }).addTo(GEOLOCATOR.mymap);
    GEOLOCATOR.mymap.setView(coords,2);

    L.geoJSON(geoMarkers, {
        pointToLayer: function (feature, latlng) {
            let appColor = "#08c49c"
            return L.circleMarker(latlng, {
                radius: 8,
                fillColor: appColor,
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });
        },
        onEachFeature: GEOLOCATOR.pointEachFeature
    }).addTo(GEOLOCATOR.mymap)
    leafletInstanceContainer.style.backgroundImage = "none"
    loadingMessage.classList.add("is-hidden")
}

GEOLOCATOR.pointEachFeature = function (feature, layer) {
    //@id, label, description
    layer.hasMyPoints = true
    layer.isHiding = false
    let popupContent = ""
    if (feature.properties) {
        if(feature.properties.isIIIF){
            popupContent += `<p class="color6 featureCompliance">IIIF Compliant Target</p>`
        }
        if(feature.properties.label) {
            popupContent += `<div class="featureInfo"><label>Target Label:</label>${feature.properties.label}</div>`
        }
        if(feature.properties.targetID || feature.properties.annoID){
            let targetURI = feature.properties.targetID ? feature.properties.targetID : feature.properties.targetID ? feature.properties.targetID : ""
            popupContent += `<div class="featureInfo"><label> Target URI:</label><a target='_blank' href='${targetURI}'>See Target Data</a></div>`
        }
        if(feature.properties.description) {
            popupContent += `<div class="featureInfo"><label> Target Description:</label>${feature.properties.description}</div>`
        }
        if(feature.properties.creator) {
            popupContent += `<div class="featureInfo"><label>Annotation Generated By</label>${feature.properties.creator}</div>`
        }
        if(feature.properties.annoID) {
            popupContent += `<div class="featureInfo"><label>Annotation URI:</label><a target='_blank' href='${feature.properties.annoID}'>See Annotation Data</a></div>`
        }
    }
    layer.bindPopup(popupContent);
}

GEOLOCATOR.goToCoords = function(event, view){
    if(leafLat.value && leafLong.value){
        let coords = [leafLat.value, leafLong.value]
        switch(view){
            case "leaflet":
                GEOLOCATOR.mymap.flyTo(coords,8)
            break
            case "mapML":

            break
            default:
        }
        document.getElementById("currentCoords").innerHTML = "["+coords.toString()+"]"
        window.scrollTo(0, leafletInstanceContainer.offsetTop - 5)
    }
}

GEOLOCATOR.filterMarkers = async function(event, view){
    let app = event.target.getAttribute("app")
    switch(view){
        case "leaflet":
            GEOLOCATOR.mymap.eachLayer(function(layer) {
                if ( layer.hasMyPoints ) {
                    if(app === "isIIIF"){
                        if(layer.feature.properties.isIIIF){
                            //Then it is for sure showing and we want it to stay showing
                        }
                        else{
                            //It is a node we want to toggle
                            if(layer.isHiding){
                                tog.setAttribute("title","Remove all assertions that do not target IIIF resources.")
                                tog.value="IIIF Assertions Only"
                                layer.isHiding = false
                                layer.setRadius(8)
                                layer.getPopup().addEventListener("click")
                                let appColor = "#08c49c"
                                layer.setStyle({
                                    color: "#000",
                                    fillColor : appColor
                                })
                            }
                            else{
                                tog.setAttribute("title","See ALL assertions, even those that do not target IIIF resouces.")
                                tog.value="All Assertions"
                                layer.isHiding = true 
                                layer.setRadius(0)
                                layer.getPopup().removeEventListener("click")
                                layer.setStyle({
                                    color: 'rgba(0,0,0,0)',
                                    fillColor : 'rgba(0,0,0,0)'
                                })
                            }
                        }
                    }
                }
            })
        break
        case "mapML":

        break
        default:
    }

}
                      

/**
 * Connect with the RERUm API to create the Annotation Linked Open Data object.
 * @param {type} event
 * @param {type} app
 * @return {Boolean}
 */
GEOLOCATOR.submitAnno = async function(event, app){
    let geo = {}
    let lat = parseInt(leafLat.value * 1000000) / 1000000
    let long = parseInt(leafLong.value * 1000000) / 1000000
    if (lat && long) {
        geo = {
            type: "Point",
            coordinates: [long, lat]
        }
    }
    else{
        alert("Supply both a latitude and a longitude")
        return false
    }
    let geoJSON = {
        "properties":{},
        "geometry": geo,
        "type": "Feature"
    }
    let targetURL = document.getElementById('objURI').value
    if(targetURL){
        let demoAnno = 
            {
                "type":"Annotation",
                "@context":["http://geojson.org/geojson-ld/geojson-context.jsonld", "http://iiif.io/api/presentation/3/context.json"],
                "motivation":"tagging",
                "target":targetURL,   
                "body":geoJSON,
                "creator":"geolocating@rerum.io"
            }

        let createdObj = await fetch(GEOLOCATOR.URLS.CREATE, {
            method: "POST",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(demoAnno)
        })
        .then(response => response.json())
        .then(newObj => {return newObj.new_obj_state})
        .catch(err => {return null})
        if(null !== createdObj){
            GEOLOCATOR.annoSaveCompletedEvent(createdObj)
        }
        else{
            GEOLOCATOR.annoSaveFailedEvent()
        }
    }
    else{
        alert("The annotation was not created.  You must supply a URI for this annotation to target.")
        return false
    }

}

GEOLOCATOR.annoSaveCompletedEvent =function(createdObj){
    createAnnoBtn.setAttribute("onclick", "document.location.href='leaflet-view.html'")
    createAnnoBtn.value="See It In Leaflet."
    
}

GEOLOCATOR.annoSaveFailedEvent=function(){
    alert("The annotation could not be saved.  Check the Network panel in web console to learn more.");
}

/**
 * Check if the given object has a valid IIIF context associated with it
 * @param {type} obj
 * @return {Boolean}
 */
GEOLOCATOR.checkForIIIF = function(targetObj){
    if(targetObj["@context"]){
        if(Array.isArray(targetObj["@context"])){
            return targetObj["@context"].includes("http://iiif.io/api/presentation/3/context.json") || targetObj["@context"].includes("http://iiif.io/api/presentation/2/context.json")
        }
        else if(typeof targetObj["@context"] === "string"){
           return targetObj["@context"] === "http://iiif.io/api/presentation/3/context.json" || targetObj["@context"] === "http://iiif.io/api/presentation/2/context.json" 
        }
    }
    return false
}

GEOLOCATOR.getURLVariable = function(variable)
    {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
                var pair = vars[i].split("=");
                if(pair[0] == variable){return pair[1];}
        }
        return(false);
    }






