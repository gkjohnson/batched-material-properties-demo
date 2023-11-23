
import * as THREE from 'three';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { BatchedStandardMaterial } from './src/BatchedStandardMaterial.js';

let gui, infoEl;
let camera, controls, scene, renderer;
let geometries, mesh, material;
const ids = [];
const matrix = new THREE.Matrix4();
const color = new THREE.Color();

//

const position = new THREE.Vector3();
const rotation = new THREE.Euler();
const quaternion = new THREE.Quaternion();
const scale = new THREE.Vector3();

//

let averageTime = 0;
let timeSamples = 0;

const MAX_GEOMETRY_COUNT = 5000;

const params = {
    dynamic: MAX_GEOMETRY_COUNT,
    animationSpeed: 1,
};

init();
initGeometries();
initMesh();
animate();

//

function rand( min, max ) {

    const delta = max - min;
    return min + Math.random() * delta;

}

function randomizeMatrix( matrix ) {

    position.randomDirection().multiplyScalar( 40 * Math.random() ** 1.5 );

    rotation.x = Math.random() * 2 * Math.PI;
    rotation.y = Math.random() * 2 * Math.PI;
    rotation.z = Math.random() * 2 * Math.PI;

    quaternion.setFromEuler( rotation );

    scale.x = scale.y = scale.z = 0.35 + ( Math.random() * 1.25 );

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
        new THREE.ConeGeometry( 1.0, 2.0 ).toNonIndexed(),
        new THREE.BoxGeometry( 2.0, 2.0, 2.0 ).toNonIndexed(),
        new THREE.IcosahedronGeometry( 1, 1 ),//( 1.0, 20, 15 ),
        new THREE.SphereGeometry( 1.0, 16, 13 ).toNonIndexed(),
    ];

    geometries[2].computeVertexNormals();

}

function initMesh() {

    const geometryCount = MAX_GEOMETRY_COUNT;
    const vertexCount = geometryCount * 512;
    const indexCount = geometryCount * 1024;

    const euler = new THREE.Euler();
    const matrix = new THREE.Matrix4();
    material = new BatchedStandardMaterial( {}, MAX_GEOMETRY_COUNT );
    mesh = new THREE.BatchedMesh( geometryCount, vertexCount, indexCount, material );
    mesh.sortObjects = false;
    mesh.perObjectFrustumCulled = false;
    mesh.userData.info = [];

    // disable full-object frustum culling since all of the objects can be dynamic.
    mesh.frustumCulled = false;

    ids.length = 0;

    for ( let i = 0; i < geometryCount; i ++ ) {

        const id = mesh.addGeometry( geometries[ i % geometries.length ] );
        mesh.setMatrixAt( id, randomizeMatrix( matrix ) );

        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationFromEuler( randomizeRotationSpeed( euler ) );

        ids.push( id );

        const c0 = new THREE.Color();
        const c1 = new THREE.Color();            
        c0.setHSL( rand( 0, 0.05 ), 1, rand( 0.3, 0.4 ) );
        c1.setHSL( rand( 0.5, 0.55 ), 1, rand( 0.3, 0.4 ) );
        mesh.userData.info.push( {
            rotationMatrix,
            c0,
            c1,
            offset: rand( 0, 2 * Math.PI ),
            speed: rand( 0.5, 3 ),
            value: 0,
        } );

        color.lerpColors( c0, c1, Math.random() );
        material.setValue( i, 'diffuse', ...color );
        material.setValue( i, 'roughness', rand( 0, 0.5 ) );
        material.setValue( i, 'metalness', rand( 0, 1 ) );

        if ( rand( 0, 1 ) < 0.1 ) {

            const emissiveIntensity = rand( 1, 10 );
            material.setValue( i, 'emissive', color.r * emissiveIntensity, color.g * emissiveIntensity, color.b * emissiveIntensity );
            
        } else {

            material.setValue( i, 'emissive', 0, 0, 0 );

        }

    }





    scene.add( mesh );

}

function init() {

    const width = window.innerWidth;
    const height = window.innerHeight;

    // camera

    camera = new THREE.PerspectiveCamera( 70, width / height, 1, 500 );
    camera.position.set( 50, 30, 30 ).multiplyScalar( 1.5 );

    // renderer

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( width, height );
    document.body.appendChild( renderer.domElement );

    // scene

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x222222 );
    scene.fog = new THREE.Fog( 0x222222, 60, 150 );

    const url = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr';
    new RGBELoader()
        .load( url, texture => {

            texture.mapping = THREE.EquirectangularReflectionMapping;

            // scene.background = texture;
            scene.environment = texture;

        } );

    // controls

    controls = new OrbitControls( camera, renderer.domElement );
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.2;

    // gui

    gui = new GUI();
    gui.add( params, 'dynamic', 0, MAX_GEOMETRY_COUNT ).step( 1 );
    gui.add( params, 'animationSpeed', 0, 3 ).step( 0.1 );

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

        const info = mesh.userData.info[ i ];
        const {
            rotationMatrix,
            c0,
            c1,
            speed,
            offset,
        } = info;
        const id = ids[ i ];

        mesh.getMatrixAt( id, matrix );
        matrix.multiply( rotationMatrix );
        mesh.setMatrixAt( id, matrix );

        info.value += 0.016 * speed * params.animationSpeed;
        color.lerpColors( c0, c1, 0.5 + 0.5 * Math.sin( offset + info.value ) );
        material.setValue( i, 'diffuse', ...color );

    }

    scene.fog.near = Math.min( camera.position.length() - 30, 80 );
    scene.fog.far = scene.fog.near + 60;

}

function render() {


    const start = window.performance.now();
    renderer.render( scene, camera );
    const delta = window.performance.now() - start;
    averageTime += ( delta - averageTime ) / ( timeSamples + 1 );
    if ( timeSamples < 60 ) {
        
        timeSamples ++;

    }

    infoEl.innerHTML = `draw calls  : ${ renderer.info.render.calls }\n`;
    infoEl.innerHTML += `render time : ${ averageTime.toFixed( 2 ) }ms`;

}
