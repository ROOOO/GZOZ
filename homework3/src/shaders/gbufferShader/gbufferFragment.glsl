#version 300 es
precision highp float;

layout(location = 0) out vec4 color0;
layout(location = 1) out vec4 color1;
layout(location = 2) out vec4 color2;
layout(location = 3) out vec4 color3;
layout(location = 4) out vec4 color4;

uniform sampler2D uKd;
uniform sampler2D uNt;
uniform sampler2D uShadowMap;

in mat4 vWorldToLight;
in highp vec2 vTextureCoord;
in highp vec4 vPosWorld;
in highp vec3 vNormalWorld;
in highp float vDepth;

float SimpleShadowMap(vec3 posWorld,float bias){
  vec4 posLight = vWorldToLight * vec4(posWorld, 1.0);
  vec2 shadowCoord = clamp(posLight.xy * 0.5 + 0.5, vec2(0.0), vec2(1.0));
  float depthSM = texture(uShadowMap, shadowCoord).x;
  float depth = (posLight.z * 0.5 + 0.5) * 100.0;
  return step(0.0, depthSM - depth + bias);
}

void LocalBasis(vec3 n, out vec3 b1, out vec3 b2) {
  float sign_ = sign(n.z);
  if (n.z == 0.0) {
    sign_ = 1.0;
  }
  float a = -1.0 / (sign_ + n.z);
  float b = n.x * n.y * a;
  b1 = vec3(1.0 + sign_ * n.x * n.x * a, sign_ * b, -sign_ * n.x);
  b2 = vec3(b, sign_ + n.y * n.y * a, -n.y);
}

vec3 ApplyTangentNormalMap() {
  vec3 t, b;
  LocalBasis(vNormalWorld, t, b);
  vec3 nt = texture(uNt, vTextureCoord).xyz * 2.0 - 1.0;
  nt = normalize(nt.x * t + nt.y * b + nt.z * vNormalWorld);
  return nt;
}

void main(void) {
  vec3 kd = texture(uKd, vTextureCoord).rgb;
  color0 = vec4(kd, 1.0);
  color1 = vec4(vec3(vDepth), 1.0);
  color2 = vec4(ApplyTangentNormalMap(), 1.0);
  color3 = vec4(vec3(SimpleShadowMap(vPosWorld.xyz, 1e-2)), 1.0);
  color4 = vec4(vec3(vPosWorld.xyz), 1.0);
}
