class WebGLRenderer {
    meshes = [];
    shadowMeshes = [];
    lights = [];

    constructor(gl, camera) {
        this.gl = gl;
        this.camera = camera;
        this.rotateY = 0.0;
    }

    addLight(light) {
        this.lights.push({
            entity: light,
            meshRender: new MeshRender(this.gl, light.mesh, light.mat)
        });
    }
    addMeshRender(mesh) { this.meshes.push(mesh); }
    addShadowMeshRender(mesh) { this.shadowMeshes.push(mesh); }

    render() {
        const gl = this.gl;

        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        gl.clearDepth(1.0); // Clear everything
        gl.enable(gl.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(gl.LEQUAL); // Near things obscure far things

        console.assert(this.lights.length != 0, "No light");
        console.assert(this.lights.length == 1, "Multiple lights");

        for (let l = 0; l < this.lights.length; l++) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.lights[l].entity.fbo);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // Draw light
            // TODO: Support all kinds of transform
            this.lights[l].meshRender.mesh.transform.translate = this.lights[l].entity.lightPos;
            this.lights[l].meshRender.draw(this.camera);

            this.rotateY += 0.01;
            const lightMVPs = [];
            for (let i = 0; i < this.meshes.length; i++) {
                const mesh = this.meshes[i].mesh;
                // [-PI/2, PI/2]
                mesh.transform.rotate[1] = Math.sin(this.rotateY) * 0.5 * Math.PI;
                const translate = mesh.transform.translate;
                const rotate = mesh.transform.rotate;
                const scale = mesh.transform.scale;
                const uLightMVP = this.lights[l].entity.CalcLightMVP(translate, scale, rotate);
                lightMVPs.push(uLightMVP);
            }

            // Shadow pass
            if (this.lights[l].entity.hasShadowMap == true) {
                for (let i = 0; i < this.shadowMeshes.length; i++) {
                    this.shadowMeshes[i].material.uniforms.uLightMVP.value = lightMVPs[i];
                    this.shadowMeshes[i].draw(this.camera);
                }
            }

            // Camera pass
            for (let i = 0; i < this.meshes.length; i++) {
                this.gl.useProgram(this.meshes[i].shader.program.glShaderProgram);
                this.gl.uniform3fv(this.meshes[i].shader.program.uniforms.uLightPos, this.lights[l].entity.lightPos);
                this.meshes[i].material.uniforms.uLightMVP.value = lightMVPs[i];
                this.meshes[i].draw(this.camera);
            }
        }
    }
}