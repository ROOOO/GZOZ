class PhongMaterial extends Material {
    /**
     * Creates an instance of PhongMaterial.
     * @param {vec3f} color The material color
     * @param {Texture} colorMap The texture object of the material
     * @param {vec3f} specular The material specular coefficient
     * @param {float} intensity The light intensity
     * @memberof PhongMaterial
     */
    constructor(color, colorMap, specular, intensity) {
        const uniforms = {
            'uTextureSample': { type: '1i', value: 0 },
            'uKd': { type: '3fv', value: color },
            'uKs': { type: '3fv', value: specular },
            'uLightIntensity': { type: '1f', value: intensity },
        };
        if (colorMap != null) {
            uniforms['uTextureSample'].value = 1;
            uniforms['uSample'] = { type: 'texture', value: colorMap };
        }
        super(uniforms, [], PhongVertexShader, PhongFragmentShader);
    }
}
