const glsl = x => x[0];
const SHADER_MODULE_UTILITY = glsl`

vec3 map(vec3 value, vec3 inMin, vec3 inMax, vec3 outMin, vec3 outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

vec4 map4(vec4 value, vec4 inMin, vec4 inMax, vec4 outMin, vec4 outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

mat3 BuildJacoby(vec3 sample_jacoby_direction_x, vec3 sample_jacoby_direction_y, vec3 sample_jacoby_direction_z)
{
    mat3 matrix;//column major order, matrix[0] references the first column
    matrix[0] = sample_jacoby_direction_x;
    matrix[1] = sample_jacoby_direction_y;
    matrix[2] = sample_jacoby_direction_z;
    return matrix;
}

mat3 BuildHessian(vec3 sample_jacoby_direction_x, vec3 sample_jacoby_direction_y, vec3 sample_jacoby_direction_z)
{
    //the hessian is the transpose of the jacobian of the gradient
    mat3 matrix;//column major order, matrix[0] references the first column
    matrix[0] = vec3(sample_jacoby_direction_x.x, sample_jacoby_direction_y.x, sample_jacoby_direction_z.x);
    matrix[1] = vec3(sample_jacoby_direction_x.y, sample_jacoby_direction_y.y, sample_jacoby_direction_z.y);
    matrix[2] = vec3(sample_jacoby_direction_x.z, sample_jacoby_direction_y.z, sample_jacoby_direction_z.z);
    return matrix;
}

mat3 BuildHessianForceSym(vec3 sample_jacoby_direction_x, vec3 sample_jacoby_direction_y, vec3 sample_jacoby_direction_z)
{
    //the hessian is the transpose of the jacobian of the gradient
    mat3 matrix;//column major order, matrix[0] references the first column
    matrix[0] = 0.5 * (sample_jacoby_direction_x + vec3(sample_jacoby_direction_x.x, sample_jacoby_direction_y.x, sample_jacoby_direction_z.x));
    matrix[1] = 0.5 * (sample_jacoby_direction_y + vec3(sample_jacoby_direction_x.y, sample_jacoby_direction_y.y, sample_jacoby_direction_z.y));
    matrix[2] = 0.5 * (sample_jacoby_direction_z + vec3(sample_jacoby_direction_x.z, sample_jacoby_direction_y.z, sample_jacoby_direction_z.z));
    return matrix;
}

vec3 computeCentralDifference(sampler3D texture, ivec3 pointer, ivec3 offset_backward, ivec3 offset_forward, float h){
    vec3 backward = texelFetch(texture, pointer+offset_backward, 0).xyz;
    vec3 forward = texelFetch(texture, pointer+offset_forward, 0).xyz;
    return (forward - backward) / (2.0*h); 
}

vec3 computeForwardDifference(sampler3D texture, ivec3 pointer, ivec3 offset_forward, float h){
    vec3 value = texelFetch(texture, pointer, 0).xyz;
    vec3 forward = texelFetch(texture, pointer+offset_forward, 0).xyz;
    return (forward - value) / h; 
}

vec3 computeBackwardDifference(sampler3D texture, ivec3 pointer, ivec3 offset_backward, float h){
    vec3 backward = texelFetch(texture, pointer+offset_backward, 0).xyz;
    vec3 value = texelFetch(texture, pointer, 0).xyz;
    return (value - backward) / h; 
}

/**
 * Intended for use with PSFTLE for billiards, i.e., we care about all 3 position components and all 3 velocity components
 */
mat2 BuildCauchyGreen(vec3 dpos_dx, vec3 dvel_dx, vec3 dpos_dy, vec3 dvel_dy){
    /*
                                        A =     
                                        | x_dx x_dy |
                                        | y_dx y_dy |
                                        | z_dx z_dy |
                                        | u_dx u_dy |
                                        | v_dx v_dy |
                                        | w_dx w_dy |
    
    AT =
    | x_dx y_dx z_dx u_dx v_dx w_dx |   | a b |
    | x_dy y_dy z_dy u_dy v_dy w_dy |   | c d |

    */
    float x_dx = dpos_dx.x;
    float y_dx = dpos_dx.y;
    float z_dx = dpos_dx.z;
    float u_dx = dvel_dx.x;
    float v_dx = dvel_dx.y;
    float w_dx = dvel_dx.z;

    float x_dy = dpos_dy.x;
    float y_dy = dpos_dy.y;
    float z_dy = dpos_dy.z;
    float u_dy = dvel_dy.x;
    float v_dy = dvel_dy.y;
    float w_dy = dvel_dy.z;

    float a = x_dx*x_dx + y_dx*y_dx + z_dx*z_dx + u_dx*u_dx + v_dx*v_dx + w_dx*w_dx;
    float b = x_dx*x_dy + y_dx*y_dy + z_dx*z_dy + u_dx*u_dy + v_dx*v_dy + w_dx*w_dy;
    //float c = x_dy*x_dx + y_dy*y_dx + u_dy*u_dx + v_dy*v_dx + w_dy*w_dx;
    float c = b;//symmetry
    float d = x_dy*x_dy + y_dy*y_dy + z_dy*z_dy + u_dy*u_dy + v_dy*v_dy + w_dy*w_dy;
    
    mat2 matrix;//column major order, matrix[0] references the first column
    matrix[0] = vec2(a, c);
    matrix[1] = vec2(b, d);

    return matrix;
}

/**
 * Intended for use with PSFTLE for billiards, i.e., we care about all 3 position components and all 3 velocity components
 */
mat3 BuildCauchyGreen(vec3 dpos_dx, vec3 dvel_dx, vec3 dpos_dy, vec3 dvel_dy, vec3 dpos_dz, vec3 dvel_dz){
    /*
                                        A =     
                                        | x_dx x_dy x_dz |
                                        | y_dx y_dy y_dz |
                                        | z_dx z_dy z_dz |
                                        | u_dx u_dy u_dz |
                                        | v_dx v_dy v_dz |
                                        | w_dx w_dy w_dz |
    
    AT =
    | x_dx y_dx z_dx u_dx v_dx w_dx |   | a b c |
    | x_dy y_dy z_dy u_dy v_dy w_dy |   | d e f |
    | x_dz y_dz z_dz u_dz v_dz w_dz |   | g h i |

    */
    float x_dx = dpos_dx.x;
    float y_dx = dpos_dx.y;
    float z_dx = dpos_dx.z;
    float u_dx = dvel_dx.x;
    float v_dx = dvel_dx.y;
    float w_dx = dvel_dx.z;

    float x_dy = dpos_dy.x;
    float y_dy = dpos_dy.y;
    float z_dy = dpos_dy.z;
    float u_dy = dvel_dy.x;
    float v_dy = dvel_dy.y;
    float w_dy = dvel_dy.z;

    float x_dz = dpos_dz.x;
    float y_dz = dpos_dz.y;
    float z_dz = dpos_dz.z;
    float u_dz = dvel_dz.x;
    float v_dz = dvel_dz.y;
    float w_dz = dvel_dz.z;

    float a = x_dx*x_dx + y_dx*y_dx + z_dx*z_dx + u_dx*u_dx + v_dx*v_dx + w_dx*w_dx;
    float b = x_dx*x_dy + y_dx*y_dy + z_dx*z_dy + u_dx*u_dy + v_dx*v_dy + w_dx*w_dy;
    float c = x_dx*x_dz + y_dx*y_dz + z_dx*z_dz + u_dx*u_dz + v_dx*v_dz + w_dx*w_dz;
    float d = b;//symmetry
    float e = x_dy*x_dy + y_dy*y_dy + z_dy*z_dy + u_dy*u_dy + v_dy*v_dy + w_dy*w_dy;
    float f = x_dy*x_dz + y_dy*y_dz + z_dy*z_dz + u_dy*u_dz + v_dy*v_dz + w_dy*w_dz;
    float g = c;//symmetry
    float h = f;//symmetry
    float i = x_dz*x_dz + y_dz*y_dz + z_dz*z_dz + u_dz*u_dz + v_dz*v_dz + w_dz*w_dz;
    
    mat3 matrix;//column major order, matrix[0] references the first column
    matrix[0] = vec3(a, d, g);
    matrix[1] = vec3(b, e, h);
    matrix[1] = vec3(c, f, i);

    return matrix;
}

/**
 * Intended for use with PSFTLE for billiards, i.e., we care about all 3 position components and all 3 velocity components
 * This version only cares about position
 */
mat2 BuildCauchyGreenPos(vec3 dpos_dx, vec3 dpos_dy){
    /*
                            A =     
                            | x_dx x_dy |
                            | y_dx y_dy |
                            | z_dx z_dy |
    
    AT =
    | x_dx y_dx z_dx |      | a b |
    | x_dy y_dy z_dy |      | c d |

    */
    float x_dx = dpos_dx.x;
    float y_dx = dpos_dx.y;
    float z_dx = dpos_dx.z;

    float x_dy = dpos_dy.x;
    float y_dy = dpos_dy.y;
    float z_dy = dpos_dy.z;

    float a = x_dx*x_dx + y_dx*y_dx + z_dx*z_dx;
    float b = x_dx*x_dy + y_dx*y_dy + z_dx*z_dy;
    //float c = x_dy*x_dx + y_dy*y_dx;
    float c = b;//symmetry
    float d = x_dy*x_dy + y_dy*y_dy + z_dy*z_dy;
    
    mat2 matrix;//column major order, matrix[0] references the first column
    matrix[0] = vec2(a, c);
    matrix[1] = vec2(b, d);

    return matrix;
}

/**
 * Intended for use with PSFTLE for billiards, i.e., we care about all 3 position components and all 3 velocity components
 * This version only cares about position
 */
mat3 BuildCauchyGreenPos(vec3 dpos_dx, vec3 dpos_dy, vec3 dpos_dz){
    /*
                        A =     
                        | x_dx x_dy x_dz |
                        | y_dx y_dy y_dz |
                        | z_dx z_dy z_dz |
    
    AT =
    | x_dx y_dx z_dx |   | a b c |
    | x_dy y_dy z_dy |   | d e f |
    | x_dz y_dz z_dz |   | g h i |

    */
    float x_dx = dpos_dx.x;
    float y_dx = dpos_dx.y;
    float z_dx = dpos_dx.z;

    float x_dy = dpos_dy.x;
    float y_dy = dpos_dy.y;
    float z_dy = dpos_dy.z;

    float x_dz = dpos_dz.x;
    float y_dz = dpos_dz.y;
    float z_dz = dpos_dz.z;

    float a = x_dx*x_dx + y_dx*y_dx + z_dx*z_dx;
    float b = x_dx*x_dy + y_dx*y_dy + z_dx*z_dy;
    float c = x_dx*x_dz + y_dx*y_dz + z_dx*z_dz;
    float d = b;//symmetry
    float e = x_dy*x_dy + y_dy*y_dy + z_dy*z_dy;
    float f = x_dy*x_dz + y_dy*y_dz + z_dy*z_dz;
    float g = c;//symmetry
    float h = f;//symmetry
    float i = x_dz*x_dz + y_dz*y_dz + z_dz*z_dz;
    
    mat3 matrix;//column major order, matrix[0] references the first column
    matrix[0] = vec3(a, d, g);
    matrix[1] = vec3(b, e, h);
    matrix[1] = vec3(c, f, i);

    return matrix;
}

/**
 * Intended for use with PSFTLE for billiards, i.e., we care about all 3 position components and all 3 velocity components
 * This version only cares about velocity
 */
mat2 BuildCauchyGreenVel(vec3 dvel_dx, vec3 dvel_dy){
    /*
                            A =     
                            | u_dx u_dy |
                            | v_dx v_dy |
                            | w_dx w_dy |
    
    AT =
    | u_dx v_dx w_dx |      | a b |
    | u_dy v_dy w_dy |      | c d |

    */
    float u_dx = dvel_dx.x;
    float v_dx = dvel_dx.y;
    float w_dx = dvel_dx.z;

    float u_dy = dvel_dy.x;
    float v_dy = dvel_dy.y;
    float w_dy = dvel_dy.z;

    float a = u_dx*u_dx + v_dx*v_dx + w_dx*w_dx;
    float b = u_dx*u_dy + v_dx*v_dy + w_dx*w_dy;
    //float c = u_dy*u_dx + v_dy*v_dx + w_dy*w_dx;
    float c = b;//symmetry
    float d = u_dy*u_dy + v_dy*v_dy + w_dy*w_dy;
    
    mat2 matrix;//column major order, matrix[0] references the first column
    matrix[0] = vec2(a, c);
    matrix[1] = vec2(b, d);

    return matrix;
}

/**
 * Intended for use with PSFTLE for billiards, i.e., we care about all 3 position components and all 3 velocity components
 * This version only cares about velocity
 */
mat3 BuildCauchyGreenVel(vec3 dvel_dx, vec3 dvel_dy, vec3 dvel_dz){
    /*
                        A =     
                        | u_dx u_dy u_dz |
                        | v_dx v_dy v_dz |
                        | w_dx w_dy w_dz |
    
    AT =
    | u_dx v_dx w_dx |   | a b c |
    | u_dy v_dy w_dy |   | d e f |
    | u_dz v_dz w_dz |   | g h i |

    */

    float u_dx = dvel_dx.x;
    float v_dx = dvel_dx.y;
    float w_dx = dvel_dx.z;

    float u_dy = dvel_dy.x;
    float v_dy = dvel_dy.y;
    float w_dy = dvel_dy.z;

    float u_dz = dvel_dz.x;
    float v_dz = dvel_dz.y;
    float w_dz = dvel_dz.z;

    float a = u_dx*u_dx + v_dx*v_dx + w_dx*w_dx;
    float b = u_dx*u_dy + v_dx*v_dy + w_dx*w_dy;
    float c = u_dx*u_dz + v_dx*v_dz + w_dx*w_dz;
    float d = b;//symmetry
    float e = u_dy*u_dy + v_dy*v_dy + w_dy*w_dy;
    float f = u_dy*u_dz + v_dy*v_dz + w_dy*w_dz;
    float g = c;//symmetry
    float h = f;//symmetry
    float i = u_dz*u_dz + v_dz*v_dz + w_dz*w_dz;
    
    mat3 matrix;//column major order, matrix[0] references the first column
    matrix[0] = vec3(a, d, g);
    matrix[1] = vec3(b, e, h);
    matrix[1] = vec3(c, f, i);

    return matrix;
}

`;

export { SHADER_MODULE_UTILITY }