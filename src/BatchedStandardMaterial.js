import { MeshStandardMaterial } from 'three';
import { BatchedPropertiesTexture } from './BatchedPropertiesTexture.js';

const properties = {
    diffuse: 'vec3',
    emissive: 'vec3',
    metalness: 'float',
    roughness: 'float',
};

export class BatchedStandardMaterial extends MeshStandardMaterial {

    constructor( params, geometryCount ) {

        super( params );
        
        const propertiesTex = new BatchedPropertiesTexture( properties, geometryCount );
        this.propertiesTex = propertiesTex;

        this.onBeforeCompile = ( parameters, renderer ) => {

            parameters.uniforms.propertiesTex = { value: propertiesTex };

            parameters.vertexShader = parameters
                .vertexShader
                .replace(
                    'void main() {',
                    `
                        flat varying float vBatchId;
                        void main() {

                            vBatchId = batchId;
                    `
                );


            parameters.fragmentShader = parameters
                .fragmentShader
                .replace(
                    'void main() {',
                    `
                        uniform highp sampler2D propertiesTex;
                        flat varying float vBatchId;
                        void main() {
  
                            ${ propertiesTex.getGlsl() }
                    `
                );

        };

    }

    setValue( ...args ) {

        this.propertiesTex.setValue( ...args );
        
    }

}