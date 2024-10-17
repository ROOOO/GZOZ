attribute vec3 aVertexPosition;
attribute vec3 aNormalPosition;
attribute mat3 aPrecomputeLT;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uPrecomputeL[3];

varying highp vec3 vNormal;
varying highp vec3 vColor;

float computeColor(mat3 precomputeL) {
    float result = 0.0;
    for (int i = 0; i < 3; ++i) {
        result += dot(precomputeL[i], aPrecomputeLT[i]);
    }
    return result;
}

void main(void) {
    vNormal = (uModelMatrix * vec4(aNormalPosition, 0.0)).xyz;

    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix *
                  vec4(aVertexPosition, 1.0);

    for (int i = 0; i < 3; ++i) {
        vColor[i] = computeColor(uPrecomputeL[i]);
    }
}