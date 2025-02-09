class SceneDepthRender extends MeshRender {

    draw() {
        const gl = this.gl;

        const mipmaps = this.material.mipmaps;
        for (let level = 0; level < mipmaps.length; ++level) {
            const depthMip = mipmaps[level];
            const fbo = depthMip.framebuffer;
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.useProgram(this.shader.program.glShaderProgram);

            const updatedParameters = {
                uLevel: level,
                uPreviousLevelDimensions: [depthMip.previousWidth, depthMip.previousHeight],
                // todo: using LOD
                // uPreviousLevel: Math.max(level - 1, 0),
                uPreviousLevel: 0,
            };
            if (level > 0) {
                updatedParameters.uDepthBuffer = mipmaps[level - 1].framebuffer.textures[0];
            }

            // Bind geometry information
            this.bindGeometryInfo();

            // Bind material parameters
            this.updateMaterialParameters(updatedParameters);
            this.bindMaterialParameters();

            // Draw
            gl.viewport(0.0, 0.0, depthMip.width, depthMip.height);
            {
                const vertexCount = this.mesh.count;
                const type = gl.UNSIGNED_SHORT;
                const offset = 0;
                gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
            }
        }
    }

}
