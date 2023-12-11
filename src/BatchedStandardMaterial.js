import { MeshStandardMaterial } from 'three';
import { BatchedPropertiesTexture } from './BatchedPropertiesTexture.js';

const properties = {
    diffuse: 'vec3',
    emissive: 'vec3',
    metalness: 'float',
    roughness: 'float',
};

export class BatchedStandardMaterial extends MeshStandardMaterial {

    constructor( params, geometryCount, propertiesList = null ) {

        super( params );

        let props = { ...properties };
        if ( propertiesList ) {

            for ( const key in props ) {

                if ( ! propertiesList.includes( key ) ) {

                    delete props[ key ];

                }

            }

        }

        const propertiesTex = new BatchedPropertiesTexture( props, geometryCount );
        this.propertiesTex = propertiesTex;

        this.onBeforeCompile = ( parameters, renderer ) => {

            if ( Object.keys( props ).length === 0 ) {

                return;

            }

            parameters.uniforms.propertiesTex = { value: propertiesTex };

            parameters.vertexShader = parameters
                .vertexShader
                .replace(
                    'void main() {',
                    `
                        varying float vBatchId;
                        void main() {

                            // add 0.5 to the value to avoid floating error that may cause flickering
                            vBatchId = batchId + 0.5;
                    `
                );

            parameters.fragmentShader = parameters
                .fragmentShader
                .replace(
                    'void main() {',
                    `
                        uniform highp sampler2D propertiesTex;
                        varying float vBatchId;
                        void main() {
  
                            ${ propertiesTex.getGlsl() }
                    `
                );

        };

    }

    setValue( ...args ) {

        this.propertiesTex.setValue( ...args );
        
    }

    dispose() {

        super.dispose();
        this.propertiesTex.dispose();

    }

}