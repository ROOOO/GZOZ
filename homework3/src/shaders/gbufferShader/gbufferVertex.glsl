#version 300 es

in vec3 aVertexPosition;
in vec3 aNormalPosition;
in vec2 aTextureCoord;

uniform mat4 uLightVP;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out mat4 vWorldToLight;

out highp vec2 vTextureCoord;
out highp vec3 vNormalWorld;
out highp vec4 vPosWorld;
out highp float vDepth;

void main(void) {
  vec4 posWorld = uModelMatrix * vec4(aVertexPosition, 1.0);
  vPosWorld = posWorld.xyzw / posWorld.w;
  vec4 normalWorld = uModelMatrix * vec4(aNormalPosition, 0.0);
  vNormalWorld = normalize(normalWorld.xyz);
  vTextureCoord = aTextureCoord;
  vWorldToLight = uLightVP;

  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aVertexPosition, 1.0);
  vDepth = gl_Position.w;
}