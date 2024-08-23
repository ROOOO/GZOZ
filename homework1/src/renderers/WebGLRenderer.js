class WebGLRenderer {
    meshes = [];
    shadowMeshes = [];
    lights = [];

    constructor(gl, camera) {
        this.gl = gl;
        this.camera = camera;
        this.rotateModelY = 0.0;
    }

    addLight(light) {
        this.lights.push({
            entity: light,
            meshRender: new MeshRender(this.gl, light.mesh, light.mat)
        });
    }
    addMeshRender(mesh) { this.meshes.push(mesh); }
    addShadowMeshRender(mesh) { this.shadowMeshes.push(mesh); }

    clearShadowMap(gl, lightIndex) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lights[lightIndex].entity.fbo);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    calcMeshesLightMVPs(lightIndex) {
        const lightMVPs = [];
        for (let i = 0; i < this.meshes.length; i++) {
            const mesh = this.meshes[i].mesh;
            const translate = mesh.transform.translate;
            const rotate = mesh.transform.rotate;
            const scale = mesh.transform.scale;
            const uLightMVP = this.lights[lightIndex].entity.CalcLightMVP(translate, scale, rotate);
            lightMVPs.push(uLightMVP);
        }
        return lightMVPs;
    }

    updateRotations() {
        for (let l = 0; l < this.lights.length; l++) {
            if (l === 1) {
                let lightPos = this.lights[l].entity.lightPos;
                vec3.rotateY(lightPos, lightPos, this.lights[l].entity.focalPoint, 0.01);
            }
            this.lights[l].meshRender.mesh.transform.translate = this.lights[l].entity.lightPos;
        }
        for (let i = 0; i < this.meshes.length; i++) {
            const mesh = this.meshes[i].mesh;
            // [-PI/2, PI/2]
            mesh.transform.rotate[1] = Math.sin(this.rotateModelY) * 0.5 * Math.PI;
        }
        this.rotateModelY += 0.01;
    }

    updateLightsMVP() {
        for (let l = 0; l < this.lights.length; l++) {
            const lightMVPs = this.calcMeshesLightMVPs(l);
            for (let i = 0; i < this.shadowMeshes.length; i++) {
                if (this.shadowMeshes[i].material.lightIndex !== l) {
                    continue;
                }
                this.shadowMeshes[i].material.uniforms.uLightMVP.value = lightMVPs[i];
                this.meshes[i].material.uniforms.uLightMVP.value = lightMVPs[i];
            }
        }
    }

    render() {
        const gl = this.gl;

        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        gl.clearDepth(1.0); // Clear everything
        gl.enable(gl.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(gl.LEQUAL); // Near things obscure far things

        console.assert(this.lights.length != 0, "No light");
        // console.assert(this.lights.length == 1, "Multiple lights");

        this.updateRotations();
        this.updateLightsMVP();

        for (let l = 0; l < this.lights.length; l++) {
            // Draw light
            // TODO: Support all kinds of transform
            this.lights[l].meshRender.draw(this.camera);

            // Shadow pass
            if (this.lights[l].entity.hasShadowMap == true) {
                this.clearShadowMap(gl, l);

                for (let i = 0; i < this.shadowMeshes.length; i++) {
                    if (this.shadowMeshes[i].material.lightIndex !== l) {
                        continue;
                    }
                    this.shadowMeshes[i].draw(this.camera);
                }
            }

            if (l !== 0) {
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
            }

            // Camera pass
            for (let i = 0; i < this.meshes.length; i++) {
                if (this.meshes[i].material.lightIndex !== l) {
                    continue;
                }
                this.gl.useProgram(this.meshes[i].shader.program.glShaderProgram);
                this.gl.uniform3fv(this.meshes[i].shader.program.uniforms.uLightPos, this.lights[l].entity.lightPos);
                this.meshes[i].draw(this.camera);
            }

            gl.disable(gl.BLEND);
        }
    }
}