import {
	WebGLArrayRenderTarget,
	RGBAFormat,
	UnsignedByteType,
	MeshBasicMaterial,
	Color,
	RepeatWrapping,
	LinearFilter,
	NoToneMapping,
    DataTexture,
    ByteType,
} from 'three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

const whiteTex = new DataTexture( new Uint8Array( [ 255, 255, 255, 255 ] ), 1, 1, RGBAFormat, ByteType );
const prevColor = new Color();
export class RenderTarget2DArray extends WebGLArrayRenderTarget {

	constructor( renderer, ...args ) {

		super( ...args );

        this._renderer = renderer;

		const tex = this.texture;
		tex.format = RGBAFormat;
		tex.type = UnsignedByteType;
		tex.minFilter = LinearFilter;
		tex.magFilter = LinearFilter;
		tex.wrapS = RepeatWrapping;
		tex.wrapT = RepeatWrapping;

		const fsQuad = new FullScreenQuad( new MeshBasicMaterial() );
		this.fsQuad = fsQuad;

	}

    setTextureAt( id, texture ) {

        texture = texture || whiteTex;

        // save previous renderer state
        const renderer = this._renderer;
		const prevRenderTarget = renderer.getRenderTarget();
		const prevToneMapping = renderer.toneMapping;
		const prevAlpha = renderer.getClearAlpha();
		renderer.getClearColor( prevColor );

		// resize the render target and ensure we don't have an empty texture
		// render target depth must be >= 1 to avoid unbound texture error on android devices
		renderer.setClearColor( 0, 0 );
		renderer.toneMapping = NoToneMapping;

		// render each texture into each layer of the target
		const fsQuad = this.fsQuad;

        // revert to default texture transform before rendering
        texture.matrixAutoUpdate = false;
        texture.matrix.identity();

        fsQuad.material.map = texture;
        fsQuad.material.transparent = true;

        renderer.setRenderTarget( this, id );
        fsQuad.render( renderer );

        // restore custom texture transform
        texture.updateMatrix();
        texture.matrixAutoUpdate = true;

		// reset the renderer
		fsQuad.material.map = null;
		renderer.setClearColor( prevColor, prevAlpha );
		renderer.setRenderTarget( prevRenderTarget );
		renderer.toneMapping = prevToneMapping;

    }

	dispose() {

		super.dispose();
		this.fsQuad.dispose();

	}

}
