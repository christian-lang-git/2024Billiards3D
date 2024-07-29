const glsl = x => x[0];
const SHADER_MODULE_BILLIARD_DECLARATIONS = glsl`

struct PhaseState{
    vec3 position;
    vec3 direction;
};

struct LocalAxes{            
    vec3 x_axis;            
    vec3 y_axis;            
    vec3 z_axis;
};

struct LocalGrid{
    PhaseState center;
    PhaseState xp;
    PhaseState xn;
    PhaseState yp;
    PhaseState yn;
    float dist_x;
    float dist_y;
};

struct FlowResults{
    PhaseState xp;
    PhaseState xn;
    PhaseState yp;
    PhaseState yn;
};

LocalGrid computeLocalGrid(vec3 position);
vec3 getSeedDirectionAtPosition(vec3 position);
FlowResults computeFlowResults(LocalGrid local_grid);
PhaseState computeFlow(PhaseState seed_state);
vec3 reflecion(vec3 direction, vec3 normal);
vec3 reflecion_regular(vec3 direction, vec3 normal);
float computePSFTLE(vec3 dpos_dx, vec3 dvel_dx, vec3 dpos_dy, vec3 dvel_dy, int type);

float evaluateSurface(vec3 position);
float evaluateSurfaceEllipsoid(vec3 position);
float evaluateSurfaceTorus(vec3 position);

vec3 evaluateGradient(vec3 position);
vec3 evaluateGradientEllipsoid(vec3 position);
vec3 evaluateGradientTorus(vec3 position);

vec3 computeTangentA(vec3 position);
vec3 computeTangentAEllipsoid(vec3 position);
vec3 computeTangentATorus(vec3 position);

vec3 bisectSurface(vec3 pos_inside, vec3 pos_outside);
PhaseState findIntersection(PhaseState phase_state);
PhaseState findIntersectionFromInside(PhaseState phase_state);
PhaseState findIntersectionFromOutside(PhaseState phase_state);
vec3 moveToSurface(vec3 position);

`;

export { SHADER_MODULE_BILLIARD_DECLARATIONS }