#version 300 es

in vec3 aVertexPosition;
in vec3 aNormalPosition;
in vec2 aTextureCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uLightMVP; 


out mat4 vWorldToScreen;
out highp vec4 vPosWorld;


void main(void) {
  vec4 posWorld = uModelMatrix * vec4(aVertexPosition, 1.0);
  vPosWorld = posWorld.xyzw / posWorld.w;
  vWorldToScreen = uProjectionMatrix * uViewMatrix;

  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aVertexPosition, 1.0);
}