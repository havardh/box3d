import * as THREE from "three"
import { VRButton } from "./VRButton.js"
import { XRControllerModelFactory } from './XRControllerModelFactory.js';

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);

camera.position.set(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor("#ffffff")
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement)

document.body.appendChild(VRButton.createButton(renderer));


const controller1 = renderer.xr.getController(1);
controller1.addEventListener('connected', event => {
    controller1.add(buildController(event.data))
})
scene.add(controller1)

const controllerModelFactory = new XRControllerModelFactory();

const controllerGrip1 = renderer.xr.getControllerGrip(1);
controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
scene.add(controllerGrip1);


function buildController(data) {
    let geometry, material;

    switch (data.targetRayMode) {

        case 'tracked-pointer':

            geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, - 1], 3));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3));

            material = new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending });

            return new THREE.Line(geometry, material);

        case 'gaze':

            geometry = new THREE.RingGeometry(0.02, 0.04, 32).translate(0, 0, - 1);
            material = new THREE.MeshBasicMaterial({ opacity: 0.5, transparent: true });
            return new THREE.Mesh(geometry, material);

    }

    return new THREE.Mesh()

}



function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

window.addEventListener('resize', onWindowResize);

function box({ x, y, z }) {
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
    const material = new THREE.MeshBasicMaterial({ color: "#433F81" })
    const cube = new THREE.Mesh(geometry, material)

    cube.position.x = x
    cube.position.y = y
    cube.position.z = z

    cube.userData = {
        velocity: {
            dx: 0, dy: 0, dz: 0
        }
    }

    return cube
}

function pull({ x, y, z }) {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ color: "#FF1100" })
    const cube = new THREE.Mesh(geometry, material)

    cube.userData = {
        gravity: 0.001
    }

    cube.position.x = x
    cube.position.y = y
    cube.position.z = z

    return cube
}

function push({ x, y, z }) {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ color: "#11FF00" })
    const cube = new THREE.Mesh(geometry, material)

    cube.userData = {
        gravity: -0.0001
    }

    cube.position.x = x
    cube.position.y = y
    cube.position.z = z

    return cube
}

function bounce({ x, y, z }) {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ color: "#000000" })
    const cube = new THREE.Mesh(geometry, material)

    cube.position.x = x
    cube.position.y = y
    cube.position.z = z

    return cube
}

const b = box({ x: 0, y: 0, z: -2 })
scene.add(b)

const puller = pull({ x: 0, y: -3, z: -10 })
scene.add(puller)

const pusher = push({ x: 0, y: 0, z: -5 })
//scene.add(pusher)

const bouncer = bounce({ x: 0, y: 0, z: -10 })
//scene.add(bouncer)

const pullers = [puller/*, pusher*/]
const bouncers = [/*bouncer*/]

let start = false;
let initialSpeed = 0.1

let selectStart;
controller1.addEventListener("selectstart", () => {
    const v = new THREE.Vector3()
    controller1.getWorldDirection(v)

    const dir = v.multiplyScalar(-1)
    dir.normalize()
    b.position.copy(controller1.position.add(dir))
    selectStart = new Date().getTime()
    start = false
})

controller1.addEventListener("selectend", () => {

    const now = new Date().getTime()

    const pressedFor = (now - selectStart) / 1000
    const speed = (initialSpeed * pressedFor)

    const v = new THREE.Vector3()
    controller1.getWorldDirection(v)

    const dir = v.multiplyScalar(-1)
    dir.normalize()
    b.position.copy(controller1.position.add(dir))
    b.userData.velocity.dx = dir.x * speed
    b.userData.velocity.dy = dir.y * speed
    b.userData.velocity.dz = dir.z * speed
    start = true;
})

function render() {

    if (start) {
        for (let p of pullers) {
            const p1 = p.position.clone();
            const p0 = b.position.clone();

            const factor = 1 / p1.distanceTo(p0);

            const d = p1.sub(p0)

            const { x, y, z } = d.multiplyScalar(factor * p.userData.gravity);

            let { dx, dy, dz } = b.userData.velocity

            dx += x;
            dy += y;
            dz += z;

            b.userData.velocity = { dx, dy, dz }
        }

        for (let bouncer of bouncers) {
            const p1 = bouncer.position.clone();
            const p0 = b.position.clone();

            const distance = p1.distanceTo(p0);

            if (distance < 1) {
                b.userData.velocity.dx = -b.userData.velocity.dx
                b.userData.velocity.dy = -b.userData.velocity.dy
                b.userData.velocity.dz = -b.userData.velocity.dz
            }
        }


        const { dx, dy, dz } = b.userData.velocity;
        b.position.x += dx;
        b.position.y += dy;
        b.position.z += dz;
    } else {
        const v = new THREE.Vector3()
        controller1.getWorldDirection(v)
        v.normalize()
        b.position.copy(controller1.position.add(v.multiplyScalar(-1)))
    }

    renderer.render(scene, camera)
}


renderer.setAnimationLoop(render);