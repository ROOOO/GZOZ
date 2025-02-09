#version 300 es

in vec3 aVertexPosition;
in vec2 aTextureCoord;

out highp vec2 vTextureCoord;

void main(void) {
  gl_Position = vec4(aVertexPosition, 1.0);
  vTextureCoord = aTextureCoord;
}