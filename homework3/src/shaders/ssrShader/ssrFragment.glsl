#version 300 es

#ifdef GL_ES
precision highp float;
#endif

uniform vec3 uLightDir;
uniform vec3 uCameraPos;
uniform vec3 uLightRadiance;
uniform sampler2D uGDiffuse;
uniform sampler2D uGDepth;
uniform sampler2D uGNormalWorld;
uniform sampler2D uGShadow;
uniform sampler2D uGPosWorld;
uniform sampler2D uDepthMipmaps[11];

in mat4 vWorldToScreen;
in highp vec4 vPosWorld;

out vec4 FragColor;

#define M_PI 3.1415926535897932384626433832795
#define TWO_PI 6.283185307
#define INV_PI 0.31830988618
#define INV_TWO_PI 0.15915494309

float Rand1(inout float p) {
  p = fract(p * .1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

vec2 Rand2(inout float p) {
  return vec2(Rand1(p), Rand1(p));
}

float InitRand(vec2 uv) {
	vec3 p3  = fract(vec3(uv.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 SampleHemisphereUniform(inout float s, out float pdf) {
  vec2 uv = Rand2(s);
  float z = uv.x;
  float phi = uv.y * TWO_PI;
  float sinTheta = sqrt(1.0 - z*z);
  vec3 dir = vec3(sinTheta * cos(phi), sinTheta * sin(phi), z);
  pdf = INV_TWO_PI;
  return dir;
}

vec3 SampleHemisphereCos(inout float s, out float pdf) {
  vec2 uv = Rand2(s);
  float z = sqrt(1.0 - uv.x);
  float phi = uv.y * TWO_PI;
  float sinTheta = sqrt(uv.x);
  vec3 dir = vec3(sinTheta * cos(phi), sinTheta * sin(phi), z);
  pdf = z * INV_PI;
  return dir;
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

vec4 Project(vec4 a) {
  return a / a.w;
}

float GetDepth(vec3 posWorld) {
  float depth = (vWorldToScreen * vec4(posWorld, 1.0)).w;
  return depth;
}

/*
 * Transform point from world space to screen space([0, 1] x [0, 1])
 *
 */
vec2 GetScreenCoordinate(vec3 posWorld) {
  vec2 uv = Project(vWorldToScreen * vec4(posWorld, 1.0)).xy * 0.5 + 0.5;
  return uv;
}

float GetGBufferDepth(vec2 uv) {
  float depth = texture(uGDepth, uv).x;
  if (depth < 1e-2) {
    depth = 1000.0;
  }
  return depth;
}

vec3 GetGBufferNormalWorld(vec2 uv) {
  vec3 normal = texture(uGNormalWorld, uv).xyz;
  return normal;
}

vec3 GetGBufferPosWorld(vec2 uv) {
  vec3 posWorld = texture(uGPosWorld, uv).xyz;
  return posWorld;
}

float GetGBufferuShadow(vec2 uv) {
  float visibility = texture(uGShadow, uv).x;
  return visibility;
}

vec3 GetGBufferDiffuse(vec2 uv) {
  vec3 diffuse = texture(uGDiffuse, uv).xyz;
  diffuse = pow(diffuse, vec3(2.2));
  return diffuse;
}

/*
 * Evaluate diffuse bsdf value.
 *
 * wi, wo are all in world space.
 * uv is in screen space, [0, 1] x [0, 1].
 *
 */
vec3 EvalDiffuse(vec3 wi, vec3 wo, vec2 uv) {
  vec3 albedo = GetGBufferDiffuse(uv);
  vec3 normal = GetGBufferNormalWorld(uv);
  float cosTheta = max(0.0, dot(normal, wi));
  vec3 f = albedo * cosTheta * INV_PI;
  return albedo;
}

/*
 * Evaluate directional light with shadow map
 * uv is in screen space, [0, 1] x [0, 1].
 *
 */
vec3 EvalDirectionalLight(vec2 uv) {
  vec3 Le = GetGBufferuShadow(uv) * uLightRadiance;
  return Le;
}

bool RayMarch(vec3 ori, vec3 dir, out vec3 hitPos) {
  vec3 step = normalize(dir) * 0.05;
  const int numSteps = 100;
  vec3 curPos = ori;

  for (int i = 0; i < numSteps; ++i) {
    vec2 uv = GetScreenCoordinate(curPos);
    float depthGBuffer = GetGBufferDepth(uv);
    float depth = GetDepth(curPos);
    if (depth - depthGBuffer > 0.0001) {
      hitPos = curPos;
      return true;
    }
    curPos += step;
  }
  return false;
}

vec3 TestRayMarch(vec3 wi, vec2 uv) {
  vec3 normal = GetGBufferNormalWorld(uv);
  vec3 wo = reflect(-wi, normal);
  vec3 hitPos;
  if (RayMarch(vPosWorld.xyz, wo, hitPos)) {
    vec2 hitUV = GetScreenCoordinate(hitPos);
    return GetGBufferDiffuse(hitUV);
  }
  return vec3(0.0);
}

ivec2 GetTextureSize(int level) {
  if (level == 0) {
    return textureSize(uDepthMipmaps[0], 0);
  } else if (level == 1) {
    return textureSize(uDepthMipmaps[1], 0);
  } else if (level == 2) {
    return textureSize(uDepthMipmaps[2], 0);
  } else if (level == 3) {
    return textureSize(uDepthMipmaps[3], 0);
  } else if (level == 4) {
    return textureSize(uDepthMipmaps[4], 0);
  } else if (level == 5) {
    return textureSize(uDepthMipmaps[5], 0);
  } else if (level == 6) {
    return textureSize(uDepthMipmaps[6], 0);
  } else if (level == 7) {
    return textureSize(uDepthMipmaps[7], 0);
  } else if (level == 8) {
    return textureSize(uDepthMipmaps[8], 0);
  } else if (level == 9) {
    return textureSize(uDepthMipmaps[9], 0);
  } else if (level == 10) {
    return textureSize(uDepthMipmaps[10], 0);
  }
  return textureSize(uDepthMipmaps[0], 0);
}

float GetDepthMapMipmapDepth(vec2 uv, int level) {
  ivec2 size = GetTextureSize(level);
  ivec2 p = ivec2(floor(uv * vec2(size)));
  if (level == 0) {
    return texelFetch(uDepthMipmaps[0], p, 0).x;
  } else if (level == 1) {
    return texelFetch(uDepthMipmaps[1], p, 0).x;
  } else if (level == 2) {
    return texelFetch(uDepthMipmaps[2], p, 0).x;
  } else if (level == 3) {
    return texelFetch(uDepthMipmaps[3], p, 0).x;
  } else if (level == 4) {
    return texelFetch(uDepthMipmaps[4], p, 0).x;
  } else if (level == 5) {
    return texelFetch(uDepthMipmaps[5], p, 0).x;
  } else if (level == 6) {
    return texelFetch(uDepthMipmaps[6], p, 0).x;
  } else if (level == 7) {
    return texelFetch(uDepthMipmaps[7], p, 0).x;
  } else if (level == 8) {
    return texelFetch(uDepthMipmaps[8], p, 0).x;
  } else if (level == 9) {
    return texelFetch(uDepthMipmaps[9], p, 0).x;
  } else if (level == 10) {
    return texelFetch(uDepthMipmaps[10], p, 0).x;
  }
  return texelFetch(uDepthMipmaps[0], p, 0).x;
}

bool RayMarchOpt(vec3 ori, vec3 dir, out vec3 hitPos) {
  vec3 step = normalize(dir) * 0.05;
  vec3 curPos = ori;
  int level = 0;

  while (level > -1 && level < 11) {
    curPos += step * float(level);
    vec2 uv = GetScreenCoordinate(curPos);
    float depthMipmap = GetDepthMapMipmapDepth(uv, level);
    float depth = GetDepth(curPos);
    if (depth - depthMipmap > 0.0001) {
      level -= 1;
      if (level < 0) {
        hitPos = curPos;
        return true;
      }
    } else {
      level += 1;
    }
  }
  return false;
}

vec3 TestRayMarchOpt(vec3 wi, vec2 uv) {
  vec3 normal = GetGBufferNormalWorld(uv);
  vec3 wo = reflect(-wi, normal);
  vec3 hitPos;
  if (RayMarchOpt(vPosWorld.xyz, wo, hitPos)) {
    vec2 hitUV = GetScreenCoordinate(hitPos);
    return GetGBufferDiffuse(hitUV);;
  }
  return vec3(0.0);
}

#define SAMPLE_NUM 1

vec3 EvalIndirectionalLight(vec3 wi, vec3 wo, vec2 uv) {
  float s = InitRand(gl_FragCoord.xy);

  vec3 L = vec3(0.0);
  vec3 ori = vPosWorld.xyz;

  vec3 b1, b2;
  vec3 n = GetGBufferNormalWorld(uv);
  LocalBasis(n, b1, b2);
  mat3 m = mat3(b1, b2, n);

  for (int i = 0; i < SAMPLE_NUM; ++i) {
    float pdf;
    vec3 localDir = SampleHemisphereCos(s, pdf);
    vec3 dir = normalize(m * localDir);

    vec3 hitPos;
    if (RayMarchOpt(ori, dir, hitPos)) {
      vec2 hitUV = GetScreenCoordinate(hitPos);
      L += EvalDiffuse(dir, wo, uv) / pdf * EvalDiffuse(wi, dir, hitUV) * EvalDirectionalLight(hitUV);
    }
  }

  L /= float(SAMPLE_NUM);
  return L;
}

void main() {
  vec3 L = vec3(0.0);

  vec3 wi = normalize(uLightDir);
  vec3 wo = normalize(uCameraPos - vPosWorld.xyz);
  vec2 uv = GetScreenCoordinate(vPosWorld.xyz);

  // directional lighting
  L = EvalDiffuse(wi, wo, uv) * EvalDirectionalLight(uv);

  // testing RayMarch
  // L = (TestRayMarch(wo, uv)) * 1.;

  // testing RayMarchOpt
//  L = TestRayMarchOpt(wo, uv);

  // directional + indirectional lighting
  L += EvalIndirectionalLight(wi, wo, uv);

  vec3 color = pow(clamp(L, vec3(0.0), vec3(1.0)), vec3(1.0 / 2.2));
  FragColor = vec4(vec3(color.rgb), 1.0);
}
