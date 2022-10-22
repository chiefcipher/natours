/* eslint-disable */
export const displayMap = locations => {


  mapboxgl.accessToken =
    'pk.eyJ1IjoiY2hpZWZjaXBoZXIiLCJhIjoiY2t4bHVpMmZoMWs2OTJ3dWI3ZnM3dG1qNSJ9.vT1pLDVvVIzncKD5aGqA9g';
  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/chiefcipher/cl8zwwkjh00td14obkw5mhz60', // style URL
    scrollZoom : false, 
    // center: [-74.5, 40], // starting position [lng, lat]
    // zoom: 9, // starting zoom
    // projection: 'globe',
    // interactive: false// display the map as a 3D globe
  });
  map.on('style.load', () => {
    map.setFog({}); // Set the default atmosphere style
  });
  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach((loc) => {
    // create marker  a marker
    const el = document.createElement('div');
    el.className = 'marker';
    //add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    // add popup
    new mapboxgl.Popup({
      offset :30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    // extend mapbound to include currentloction
    bounds.extend(loc.coordinates);
  });
  
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
  
}
