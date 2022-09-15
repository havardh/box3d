import * as THREE from "three"
import { PointerLockControls } from "./controls";

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

camera.position.z = 0;

const renderer = new THREE.WebGLRenderer({ antialias: true })

renderer.setClearColor("#ffffff")

renderer.setSize(window.innerWidth, window.innerHeight)

document.body.appendChild(renderer.domElement)

const controls = new PointerLockControls(camera, document.body)
document.addEventListener("click", () => {
    if (controls.isLocked) {
        controls.unlock()

    } else {
        controls.lock()
    }

})
controls.addEventListener('lock', function () {

    //menu.style.display = 'none';

});

controls.addEventListener('unlock', function () {

    //menu.style.display = 'block';

});

const clock = new THREE.Clock()

function box({ x, y, z }) {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
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
scene.add(pusher)

const bouncer = bounce({ x: 0, y: 0, z: -10 })
scene.add(bouncer)

const pullers = [puller, pusher]
const bouncers = [bouncer]

let start = false;
let direction = new THREE.Vector3(0, 0, -1);
document.body.onkeyup = function (e) {
    if (e.key == " ") {
        b.userData.velocity.dx = direction.x * 0.01
        b.userData.velocity.dy = direction.y * 0.01
        b.userData.velocity.dz = direction.z * 0.01
        start = true;
    }
}

function render() {
    requestAnimationFrame(render)

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

        const v = new THREE.Vector3(0, 0, -2);


        v.applyEuler(camera.rotation)

        b.position.x = v.x;
        b.position.y = v.y;
        b.position.z = v.z;

        const v1 = new THREE.Vector3(0, 0, -4);

        v1.applyEuler(camera.rotation)
        b.lookAt(v1)

        direction = v1.sub(v1).normalize()
    }


    // controls.update(delta)
    renderer.render(scene, camera)
}

render()