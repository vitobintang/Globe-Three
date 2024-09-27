import * as THREE from "three";
import gsap from "gsap";
import vertexShader from "./shaders/vertex.glsl"
import fragmentShader from "./shaders/fragment.glsl"
import atmosphereVertexShader from "./shaders/atmosphereVertex.glsl"
import atmosphereFragmentShader from "./shaders/atmosphereFragment.glsl"
import globe from "./textures/globe.jpg"

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera( 
    75, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
)

const renderer = new THREE.WebGLRenderer({
    antialias: true
})
renderer.setSize( window.innerWidth, window.innerHeight )
renderer.setPixelRatio( window.devicePixelRatio )
document.body.appendChild( renderer.domElement )

// Create a sphere
const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(5, 50, 50), 
    new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            globeTexture: {
                value: new THREE.TextureLoader().load(globe)
            }
        }
    })
)
scene.add(sphere)

// Function to create stars
function createStars(numStars) {
    const starsGroup = new THREE.Group();

    for (let i = 0; i < numStars; i++) {
        const starGeometry = new THREE.SphereGeometry(0.05, 8, 8); // Smaller sphere for each star
        const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.position.set(
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 200
        );

        starsGroup.add(star); // Add the star mesh to the group
    }

    return starsGroup; // Return the group of stars
}

// Create and add stars to the scene
const stars = createStars(1000); // Number of stars
scene.add(stars);


// Function to convert lat/lng to 3D coordinates
function coordinatecalc(lat, lng) {
    const radius = 5; // Radius of the Earth sphere

    // Convert latitude and longitude to radians
    const phi = (90 - lat) * (Math.PI / 180); // Invert latitude for correct Y-axis positioning
    const theta = (lng + 180) * (Math.PI / 180); // Shift longitude to the right

    // Spherical to Cartesian conversion (Y-axis is UP)
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta); // Latitude controls the Y position (north/south)

    return { x, y, z };
}

const countries = [
    { name: 'Netherlands', lat: 52.1326, lng: 5.2913, flag: 'https://flagcdn.com/nl.svg' },
    { name: 'Belgium', lat: 50.5039, lng: 4.4699, flag: 'https://flagcdn.com/be.svg' },
    { name: 'Germany', lat: 51.1657, lng: 10.4515, flag: 'https://flagcdn.com/de.svg' },
    { name: 'Austria', lat: 47.5162, lng: 14.5501, flag: 'https://flagcdn.com/at.svg' },
    { name: 'Sweden', lat: 60.1282, lng: 18.6435, flag: 'https://flagcdn.com/se.svg' },
    { name: 'Finland', lat: 61.9241, lng: 25.7482, flag: 'https://flagcdn.com/fi.svg' },
    { name: 'Norway', lat: 60.4720, lng: 8.4689, flag: 'https://flagcdn.com/no.svg' },
    { name: 'Denmark', lat: 56.2639, lng: 9.5018, flag: 'https://flagcdn.com/dk.svg' },
    { name: 'UK', lat: 55.3781, lng: -3.4360, flag: 'https://flagcdn.com/gb.svg' }
];

const group = new THREE.Group()

const pins = [];

// Loop through the countries array
countries.forEach(country => {
    // Calculate 3D position for the current country
    const pos = coordinatecalc(country.lat, country.lng);

    // Create a pin (marker) at the current country
    const pin = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );

    pin.position.set(pos.x, pos.y, pos.z);
    scene.add(pin);

    // Store country information for later use
    pins.push({ pin, country });

    group.add(sphere, pin);
});

// adjust to face the europe/africa initially
group.rotateY(-1.57)
group.rotateZ(-0.6)
scene.add(group)

// Create a atmosphere
const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(5, 50, 50), 
    new THREE.ShaderMaterial({
        vertexShader:atmosphereVertexShader,
        fragmentShader:atmosphereFragmentShader,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    })
)

atmosphere.scale.set(1.2, 1.2, 1.2)
scene.add(atmosphere)

// Set camera position
// Set camera position to focus on Europe
camera.position.set(0, 0, 10); // Adjusted position

let isDragging = false;
let lastMousePosition = null;

document.addEventListener('mousedown', (event) => {
  if (event.button === 0) { // left click
    isDragging = true;
    lastMousePosition = { x: event.clientX, y: event.clientY };
  }
});

document.addEventListener('mousemove', (event) => {
  if (isDragging) {
    const delta = { x: event.clientX - lastMousePosition.x, y: event.clientY - lastMousePosition.y };
    lastMousePosition = { x: event.clientX, y: event.clientY };
    group.rotation.x += delta.y * 0.001;
    group.rotation.y += delta.x * 0.001;
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
//   gsap.to(group.rotation, { x: 0, duration: 1 });
});

document.addEventListener('wheel', (event) => {
    event.preventDefault(); // Prevent default scrolling behavior
    const delta = event.deltaY > 0 ? 1 : -1; // Determine scroll direction
    camera.position.z += delta * 0.5; // Adjust camera position based on scroll direction
    atmosphere.scale.set(1.1 + (camera.position.z / 100), 1.1 + (camera.position.z / 100), 1.1 + (camera.position.z / 100)); // Adjust atmosphere scale based on camera position
}, { passive: false }); // Set passive to false

// Raycaster for pin interaction
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const labelDiv = document.createElement('div');

// Set labelDiv styles
labelDiv.id = 'labelDiv';
labelDiv.style.position = 'absolute';
labelDiv.style.display = 'none';
labelDiv.style.background = 'rgba(0, 0, 0, 0.7)';
labelDiv.style.color = 'white';
labelDiv.style.padding = '10px';
labelDiv.style.borderRadius = '5px';
labelDiv.style.pointerEvents = 'none';
labelDiv.style.transition = 'opacity 0.2s ease';
labelDiv.style.zIndex = '10'; // Ensure it's on top of other elements
document.body.appendChild(labelDiv);

// Handle hover effect
function handleMouseMove(event) {
    // Convert mouse position to normalized device coordinates
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster
    raycaster.setFromCamera(pointer, camera);

    // Check for intersections with pins
    const intersects = raycaster.intersectObjects(pins.map(pinData => pinData.pin));

    // Reset hover states for all pins
    pins.forEach(pinData => {
        pinData.pin.material.color.set(0xff0000); // Reset color
    });

    if (intersects.length > 0) {
        const intersectedPin = intersects[0].object;
        intersectedPin.material.color.set(0x00ff00); // Change color to indicate hover
        document.body.style.cursor = 'pointer'; // Change cursor to pointer
    } else {
        document.body.style.cursor = 'auto'; // Reset cursor
    }
}

window.addEventListener('mousemove', handleMouseMove);

let isRotating = true;
let isLabelOpen = false; // Variable to track if the label is open

window.addEventListener('click', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster
    raycaster.setFromCamera(pointer, camera);

    // Check for intersections with pins
    const intersects = raycaster.intersectObjects(pins.map(pinData => pinData.pin));

    if (intersects.length > 0) {
        const intersectedPin = intersects[0].object;
        const countryData = pins.find(pinData => pinData.pin === intersectedPin).country;

        // Show the label with country name and flag
        labelDiv.innerHTML = `<strong>${countryData.name}</strong><br><img src="${countryData.flag}" style="width: 50px; height: auto;">`;
        labelDiv.style.left = `${event.clientX}px`;
        labelDiv.style.top = `${event.clientY}px`;
        labelDiv.style.transform = 'scale(0)'; // Initial scale to 0
        labelDiv.style.display = 'block'; // Make it visible

        // Animate the labelDiv popping up
        gsap.to(labelDiv, { 
            scale: 1, 
            duration: 0.3, 
            ease: 'back.out', // Using back easing for a pop effect
            onComplete: () => {
                isLabelOpen = true; // Set label open state to true
            }
        });
        isRotating = false; // Stop rotation

    } else {
        if (isLabelOpen) {
            // Animate the labelDiv shrinking back to 0 when closing
            gsap.to(labelDiv, { 
                scale: 0, 
                duration: 0.3, 
                ease: 'back.in', // Using back easing for a pop effect
                onComplete: () => {
                    labelDiv.style.display = 'none'; // Hide the label after shrinking
                    isLabelOpen = false; // Set label open state to false
                    isRotating = true; // Allow rotation
                }
            });
        }
    }
});

// Close the label and resume rotation when clicked
labelDiv.addEventListener('click', () => {
    // Animate the labelDiv shrinking back to 0 when closing
    gsap.to(labelDiv, { 
        scale: 0, 
        duration: 0.3, 
        ease: 'back.in', // Using back easing for a pop effect
        onComplete: () => {
            labelDiv.style.display = 'none'; // Hide the label after shrinking
            isLabelOpen = false; // Set label open state to false
            isRotating = true; // Allow rotation
        }
    });
});


// Close the label and resume rotation when clicked
labelDiv.addEventListener('click', () => {
    // Animate the labelDiv sliding up when closing
    gsap.to(labelDiv, { 
        transform: 'translateY(-20px)', 
        duration: 0.5, 
        ease: 'power2.out',
        onComplete: () => {
            labelDiv.style.display = 'none'; // Hide the label after sliding up
            isLabelOpen = false; // Set label open state to false
            isRotating = true; // Allow rotation
        }
    });
});


window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate)
    if (isDragging) {
        renderer.render(scene, camera)
    } else {
        renderer.render(scene, camera)
        if (isRotating) {
            group.rotation.y += 0.0003
        }
    }
}
animate()

// Create the minimalist box
const boxDiv = document.createElement('div');

// Set boxDiv styles
boxDiv.id = 'boxDiv';
boxDiv.style.position = 'absolute';
boxDiv.style.top = '20px'; // Adjust top positioning
boxDiv.style.right = '20px'; // Adjust right positioning
boxDiv.style.width = '250px'; // Set width
boxDiv.style.height = '50px'; // Set height
boxDiv.style.background = 'rgba(128, 128, 128, 0.3)'; // Grey with 70% opacity
boxDiv.style.color = 'white'; // Text color
boxDiv.style.padding = '10px'; // Inner padding
boxDiv.style.borderRadius = '8px'; // Rounded corners
boxDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.5)'; // Subtle shadow for depth
boxDiv.style.display = 'flex'; // Use flexbox for centering content
boxDiv.style.alignItems = 'center'; // Center vertically
boxDiv.style.justifyContent = 'center'; // Center horizontally
boxDiv.style.fontSize = '16px'; // Font size
boxDiv.style.zIndex = '10'; // Ensure it's on top of other elements
document.body.appendChild(boxDiv);

// Set the text content inside the boxDiv
boxDiv.innerHTML = '<strong>Delavito Bintang Mahaputra</strong>';