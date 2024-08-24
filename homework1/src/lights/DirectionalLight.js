class DirectionalLight {

    constructor(lightIntensity, lightColor, lightPos, focalPoint, lightUp, hasShadowMap, gl) {
        this.mesh = Mesh.cube(setTransform(0, 0, 0, 0.2, 0.2, 0.2, 0));
        this.mat = new EmissiveMaterial(lightIntensity, lightColor);
        this.lightPos = lightPos;
        this.focalPoint = focalPoint;
        this.lightUp = lightUp

        this.hasShadowMap = hasShadowMap;
        this.frustumSize = 340;
        this.fbo = new FBO(gl);
        if (!this.fbo) {
            console.log("无法设置帧缓冲区对象");
            return;
        }
    }

    CalcLightMVP(translate, scale, rotate = [0, 0, 0]) {
        let lightMVP = mat4.create();
        let modelMatrix = mat4.create();
        let viewMatrix = mat4.create();
        let projectionMatrix = mat4.create();

        // Model transform
        mat4.identity(modelMatrix);
        mat4.translate(modelMatrix, modelMatrix, translate);
        mat4.scale(modelMatrix, modelMatrix, scale);
        mat4.rotateX(modelMatrix, modelMatrix, rotate[0]);
        mat4.rotateY(modelMatrix, modelMatrix, rotate[1]);
        mat4.rotateZ(modelMatrix, modelMatrix, rotate[2]);

        // View transform
        mat4.lookAt(viewMatrix, this.lightPos, this.focalPoint, this.lightUp);

        // Projection transform
        const frustumSize = this.frustumSize * 0.5;
        mat4.ortho(projectionMatrix, -frustumSize, frustumSize, -frustumSize, frustumSize, 0.01, 500);

        mat4.multiply(lightMVP, projectionMatrix, viewMatrix);
        mat4.multiply(lightMVP, lightMVP, modelMatrix);

        return lightMVP;
    }
}
