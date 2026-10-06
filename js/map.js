document.addEventListener("DOMContentLoaded", () => {
  const mapElement = document.getElementById('map');
  
  if (mapElement) {
    const cartoKey = 'cb1_47o8_1_8b23ad4e293ea7852650d8a9';
    const map = L.map('map').setView([35.6762, 139.6503], 6);

    L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${cartoKey}`, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> | Viaje TIC',
      maxZoom: 19
    }).addTo(map);

    const points = [
      {lat: 35.6762, lng: 139.6503, title: "Día 1-2: Tokio (Shibuya y Akihabara)"},
      {lat: 35.2333, lng: 139.0494, title: "Día 3: Hakone y Monte Fuji"},
      {lat: 35.0116, lng: 135.7681, title: "Día 4-5: Kioto (Fushimi Inari)"},
      {lat: 34.6851, lng: 135.8048, title: "Día 6: Nara (Parque de los Ciervos)"}
    ];

    points.forEach((pt) => {
      const marker = L.marker([pt.lat, pt.lng]).addTo(map);
      marker.bindPopup(`<b>${pt.title}</b>`);
    });
  }
});