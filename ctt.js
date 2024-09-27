// Add pin
let mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
)

function convertLatLngToCartesian(p) {
    let lat = (p.lat) * Math.PI/180
    let lng = (p.lng) * Math.PI/180

    let x = 5 * Math.cos(lat) * Math.cos(lng)
    let y = 5 * Math.cos(lat) * Math.sin(lng)
    let z = 5 * Math.sin(lat)

    return{
        x, y, z
    }
}

const groupmesh = new THREE.Group()

let centralJava = { lat: 7.1510, lng: 110.1403 }

let centralJavaCartesian = convertLatLngToCartesian(centralJava)
console.log(centralJavaCartesian)
mesh.position.set(centralJavaCartesian.x, centralJavaCartesian.y, centralJavaCartesian.z); // subtract mesh radius from z position
scene.add(mesh);


// // Define the countries with their latitudes and longitudes
// let countries = [
//     { name: 'Netherlands', lat: 7.1510, lng: 110.1403 },
//     { name: 'Belgium', lat: 50.8503, lng: 4.3517 },
//     { name: 'Germany', lat: 51.1657, lng: 10.4515 },
//     { name: 'Austria', lat: 47.5162, lng: 14.5501 },
//     { name: 'Sweden', lat: 60.1282, lng: 18.6435 },
//     { name: 'Finland', lat: 61.9241, lng: 25.7482 },
//     { name: 'Norway', lat: 60.4720, lng: 8.4689 },
//     { name: 'Denmark', lat: 56.2639, lng: 9.5018 },
//     { name: 'UK', lat: 54.7580, lng: -2.6953 }
// ];
  
//   // Create a mesh point for each country
//   countries.forEach(country => {
//     let pos = convertLatLngToCartesian(country);
//     let mesh = new THREE.Mesh(
//       new THREE.SphereGeometry(0.1, 20, 20),
//       new THREE.MeshBasicMaterial({ color: 0xff0000 })
//     );
//     mesh.position.set(pos.x, pos.y, pos.z - 0.1); // subtract mesh radius from z position
//     scene.add(mesh);
//     groupmesh.add(mesh);
// });

const group = new THREE.Group()
scene.add(group)
group.add(sphere, mesh);
camera.position.z = 15