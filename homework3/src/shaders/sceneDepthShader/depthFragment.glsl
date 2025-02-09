#version 300 es
precision mediump float;

uniform sampler2D uSampler;
uniform sampler2D uDepthBuffer;
uniform int uLevel;
uniform int uPreviousLevel;
uniform ivec2 uPreviousLevelDimensions;

in highp vec2 vTextureCoord;

out vec4 FragColor;

void main() {
    if (uLevel == 0) {
        vec3 color = texture(uSampler, vTextureCoord).rgb;
        FragColor = vec4(color, 1.0);
    } else {
        ivec2 thisLevelTexelCoord = ivec2(gl_FragCoord);
        ivec2 previousLevelBaseTexelCoord = 2 * thisLevelTexelCoord;

        vec4 depthTexelValues;
        depthTexelValues.x = texelFetch(uDepthBuffer,
                                        previousLevelBaseTexelCoord,
                                        uPreviousLevel).r;
        depthTexelValues.y = texelFetch(uDepthBuffer,
                                        previousLevelBaseTexelCoord + ivec2(1, 0),
                                        uPreviousLevel).r;
        depthTexelValues.z = texelFetch(uDepthBuffer,
                                        previousLevelBaseTexelCoord + ivec2(1, 1),
                                        uPreviousLevel).r;
        depthTexelValues.w = texelFetch(uDepthBuffer,
                                        previousLevelBaseTexelCoord + ivec2(0, 1),
                                        uPreviousLevel).r;

        float minDepth = min(min(depthTexelValues.x, depthTexelValues.y),
                             min(depthTexelValues.z, depthTexelValues.w));

//        // Incorporate additional texels if the previous level's width or height (or both)
//        // are odd.
//        bool shouldIncludeExtraColumnFromPreviousLevel = ((uPreviousLevelDimensions.x & 1) != 0);
//        bool shouldIncludeExtraRowFromPreviousLevel = ((uPreviousLevelDimensions.y & 1) != 0);
//        if (shouldIncludeExtraColumnFromPreviousLevel) {
//            vec2 extraColumnTexelValues;
//            extraColumnTexelValues.x = texelFetch(uDepthBuffer,
//                                                  previousLevelBaseTexelCoord + ivec2(2, 0),
//                                                  uPreviousLevel).r;
//            extraColumnTexelValues.y = texelFetch(uDepthBuffer,
//                                                  previousLevelBaseTexelCoord + ivec2(2, 1),
//                                                  uPreviousLevel).r;
//
//            // In the case where the width and height are both odd, need to include the
//            // 'corner' value as well.
//            if (shouldIncludeExtraRowFromPreviousLevel) {
//                float cornerTexelValue = texelFetch(uDepthBuffer,
//                                                    previousLevelBaseTexelCoord + ivec2(2, 2),
//                                                    uPreviousLevel).r;
//                minDepth = min(minDepth, cornerTexelValue);
//            }
//            minDepth = min(minDepth, min(extraColumnTexelValues.x, extraColumnTexelValues.y));
//        }
//        if (shouldIncludeExtraRowFromPreviousLevel) {
//            vec2 extraRowTexelValues;
//            extraRowTexelValues.x = texelFetch(uDepthBuffer,
//                                               previousLevelBaseTexelCoord + ivec2(0, 2),
//                                               uPreviousLevel).r;
//            extraRowTexelValues.y = texelFetch(uDepthBuffer,
//                                               previousLevelBaseTexelCoord + ivec2(1, 2),
//                                               uPreviousLevel).r;
//            minDepth = min(minDepth, min(extraRowTexelValues.x, extraRowTexelValues.y));
//        }
//
        FragColor = vec4(vec3(minDepth), 1.0);
    }
}