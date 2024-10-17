class PRTMaterial extends Material {

    constructor(vertexShader, fragmentShader) {
        super({
            'uPrecomputeL': { type: 'PrecomputeL', value: null },
        }, [
            'aPrecomputeLT',
        ], vertexShader, fragmentShader, null);
    }
}

async function buildPRTMaterial(vertexPath, fragmentPath) {
    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new PRTMaterial(vertexShader, fragmentShader);

}