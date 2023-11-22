
import * as THREE from 'three';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

let gui, infoEl;
let camera, controls, scene, renderer;
let geometries, mesh, material;
const ids = [];
const matrix = new THREE.Matrix4();

//

const position = new THREE.Vector3();
const rotation = new THREE.Euler();
const quaternion = new THREE.Quaternion();
const scale = new THREE.Vector3();

//

const MAX_GEOMETRY_COUNT = 5000;

const params = {
    dynamic: MAX_GEOMETRY_COUNT,
};

init();
initGeometries();
initMesh();
animate();

//

function randomizeMatrix( matrix ) {

    position.randomDirection().multiplyScalar( 30 * Math.cbrt( Math.random() ) );

    rotation.x = Math.random() * 2 * Math.PI;
    rotation.y = Math.random() * 2 * Math.PI;
    rotation.z = Math.random() * 2 * Math.PI;

    quaternion.setFromEuler( rotation );

    scale.x = scale.y = scale.z = 0.5 + ( Math.random() * 1 );

    return matrix.compose( position, quaternion, scale );

}

function randomizeRotationSpeed( rotation ) {

    rotation.x = Math.random() * 0.01;
    rotation.y = Math.random() * 0.01;
    rotation.z = Math.random() * 0.01;
    return rotation;

}

function initGeometries() {

    geometries = [
        new THREE.ConeGeometry( 1.0, 2.0 ),
        new THREE.BoxGeometry( 2.0, 2.0, 2.0 ),
        new THREE.SphereGeometry( 1.0, 16, 8 ),
    ];

}

function createMaterial() {

    if ( ! material ) {

        material = new THREE.MeshStandardMaterial( { color: 'red', metalness: 1, roughness: 0.2 } );

    }

    return material;

}

function initMesh() {

    const geometryCount = MAX_GEOMETRY_COUNT;
    const vertexCount = geometryCount * 512;
    const indexCount = geometryCount * 1024;

    const euler = new THREE.Euler();
    const matrix = new THREE.Matrix4();
    mesh = new THREE.BatchedMesh( geometryCount, vertexCount, indexCount, createMaterial() );
    mesh.userData.rotationSpeeds = [];

    // disable full-object frustum culling since all of the objects can be dynamic.
    mesh.frustumCulled = false;

    ids.length = 0;

    for ( let i = 0; i < geometryCount; i ++ ) {

        const id = mesh.addGeometry( geometries[ i % geometries.length ] );
        mesh.setMatrixAt( id, randomizeMatrix( matrix ) );

        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationFromEuler( randomizeRotationSpeed( euler ) );
        mesh.userData.rotationSpeeds.push( rotationMatrix );

        ids.push( id );

    }

    scene.add( mesh );

}

function init() {

    const width = window.innerWidth;
    const height = window.innerHeight;

    // camera

    camera = new THREE.PerspectiveCamera( 70, width / height, 1, 500 );
    camera.position.set( 50, 30, 30 );

    // renderer

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( width, height );
    document.body.appendChild( renderer.domElement );

    // scene

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );

    const url = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr';
    new RGBELoader()
        .load( url, texture => {

            texture.mapping = THREE.EquirectangularReflectionMapping;

            // scene.background = texture;
            scene.environment = texture;

        } );

    // controls

    controls = new OrbitControls( camera, renderer.domElement );

    // gui

    gui = new GUI();
    gui.add( params, 'dynamic', 0, MAX_GEOMETRY_COUNT ).step( 1 );

    infoEl = document.getElementById( 'info' );

    // listeners

    window.addEventListener( 'resize', onWindowResize );

}

//

function onWindowResize() {

    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize( width, height );

}

function animate() {

    requestAnimationFrame( animate );

    animateMeshes();

    controls.update();

    render();

}

function animateMeshes() {

    const loopNum = Math.min( MAX_GEOMETRY_COUNT, params.dynamic );
    for ( let i = 0; i < loopNum; i ++ ) {

        const rotationMatrix = mesh.userData.rotationSpeeds[ i ];
        const id = ids[ i ];

        mesh.getMatrixAt( id, matrix );
        matrix.multiply( rotationMatrix );
        mesh.setMatrixAt( id, matrix );

    }

}

function render() {

    infoEl.innerHTML = `draw calls : ${ renderer.info.render.calls }`;

    renderer.render( scene, camera );

}
