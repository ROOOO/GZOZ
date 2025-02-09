class SceneDepthMaterial extends Material {

    constructor(color, vertexShader, fragmentShader) {    
        super({
            'uSampler': { type: 'texture', value: color },
            'uDepthBuffer': { type: 'texture', value: null },
            'uLevel': { type: '1i', value: 0 },
            'uPreviousLevel': { type: '1i', value: 1 },
            'uPreviousLevelDimensions': { type: '2i', value: [0, 0] },
        }, [], vertexShader, fragmentShader, bufferFBO);
        this.notShadow = true;

        this.mipmaps = [];
        this.generateMipmaps();
    }

    generateMipmaps() {
        let currentWidth = window.screen.width;
        let currentHeight = window.screen.height;
        let previousWidth = currentWidth;
        let previousHeight = currentHeight;
        const numMipmaps = Math.ceil(Math.log2(Math.max(currentWidth, currentHeight)));
        for (let level = 0; level < numMipmaps; ++level) {
            let fbo = new FBO(gl, 1, currentWidth, currentHeight);
            this.mipmaps.push({
                framebuffer: fbo,
                width: currentWidth,
                height: currentHeight,
                previousWidth: previousWidth,
                previousHeight: previousHeight,
            });
            previousWidth = currentWidth;
            previousHeight = currentHeight;
            const nextWidth = Math.max(1, Math.floor(currentWidth / 2));
            const nextHeight = Math.max(1, Math.floor(currentHeight / 2));
            currentWidth = nextWidth;
            currentHeight = nextHeight;
        }
    }
}

async function buildSceneDepthMaterial(color, vertexPath, fragmentPath) {


    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new SceneDepthMaterial(color, vertexShader, fragmentShader);

}