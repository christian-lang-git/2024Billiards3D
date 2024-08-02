
const glsl = x => x[0];
const SHADER_MODULE_LINALG = glsl`
//code from linalg.h + additional wrapper

float mat2det(mat2 a) { return a[0][0] * a[1][1] - a[0][1] * a[1][0]; }

float mat3det(mat3 a) {
    return a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) +
           a[0][1] * (a[1][2] * a[2][0] - a[1][0] * a[2][2]) +
           a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
}

bool mat3inv(mat3 a, inout mat3 b) {
    float d = mat3det(a);
    if (d == 0.0) {
        return false;
    }
    b[0][0] = (a[1][1] * a[2][2] - a[1][2] * a[2][1]) / d;
    b[1][0] = (a[1][2] * a[2][0] - a[1][0] * a[2][2]) / d;
    b[2][0] = (a[1][0] * a[2][1] - a[1][1] * a[2][0]) / d;
    b[0][1] = (a[2][1] * a[0][2] - a[2][2] * a[0][1]) / d;
    b[1][1] = (a[2][2] * a[0][0] - a[2][0] * a[0][2]) / d;
    b[2][1] = (a[2][0] * a[0][1] - a[2][1] * a[0][0]) / d;
    b[0][2] = (a[0][1] * a[1][2] - a[0][2] * a[1][1]) / d;
    b[1][2] = (a[0][2] * a[1][0] - a[0][0] * a[1][2]) / d;
    b[2][2] = (a[0][0] * a[1][1] - a[0][1] * a[1][0]) / d;
    return true;
}

void mat2invariants(mat2 m, inout vec2 pqr) {
    // invariant0 = det(M)
    pqr[0] = mat2det(m);

    // invariant1 = -trace M
    pqr[1] = -(m[0][0] + m[1][1]);
}

void mat3invariants(mat3 m, inout vec3 pqr) {
    // invariant0 = -det(M)
    pqr[0] = -mat3det(m);

    // invariant1 = det2(M#0) + det2(M#1) + det2(M#2)
    pqr[1] = m[1][1] * m[2][2] - m[1][2] * m[2][1]
             + m[2][2] * m[0][0] - m[2][0] * m[0][2]
             + m[0][0] * m[1][1] - m[0][1] * m[1][0];

    // invariant2 = -trace M
    pqr[2] = -(m[0][0] + m[1][1] + m[2][2]);
}

int vec2squareroots(vec2 a, inout vec2 r)
/*
 *	Solves equation
 *	    1 * x^2 + a[1]*x + a[0] = 0
 *
 *	On output, 
 *	    r[0], r[1] or
 *	    r[0] +- i*r[1] are the roots 
 *	   
 *	returns number of real solutions
 */
{
    float discrim, root;

    discrim = a[1] * a[1] - 4.0 * a[0];

    if (discrim >= 0.0) {
        root = sqrt(discrim);
        r[0] = (-a[1] - root) / 2.0;
        r[1] = (-a[1] + root) / 2.0;
        return (2);
    } else {
        root = sqrt(-discrim);
        r[0] = -a[1] / 2.0;
        r[1] = root / 2.0;
        return (0);
    }
}

int vec3cubicroots(vec3 a, inout vec3 r, bool forceReal)
//  Cubic equation (multiple solutions are returned several times)
//
//	Solves equation
//	    1 * x^3 + a[2]*x^2 + a[1]*x + a[0] = 0
//
//	On output,
//	    r[0], r[1], r[2], or
//	    r[0], r[1] +- i*r[2] are the roots
//
//	returns number of real solutions

{
    
    // Eliminate quadratic term by substituting
    // x = y - a[2] / 3

    float c1 = a[1] - a[2] * a[2] / 3.;
    float c0 = a[0] - a[1] * a[2] / 3. + 2. / 27. * a[2] * a[2] * a[2];

    // Make cubic coefficient 4 and linear coefficient +- 3
    // by substituting y = z*k and multiplying with 4/k^3

    if (c1 == 0.) {
        if (c0 == 0.) r[0] = 0.;
        else if (c0 > 0.) r[0] = -pow(c0, 1. / 3.);
        else r[0] = pow(-c0, 1. / 3.);
    } else {
        bool negc1 = c1 < 0.;
        float absc1 = negc1 ? -c1 : c1;

        float k = sqrt(4. / 3. * absc1);

        float d0 = c0 * 4. / (k * k * k);

        // Find the first solution

        if (negc1) {
            if (d0 > 1.) r[0] = -cosh(acosh(d0) / 3.);
            else if (d0 > -1.) r[0] = -cos(acos(d0) / 3.);
            else r[0] = cosh(acosh(-d0) / 3.);
        } else {
            r[0] = -sinh(asinh(d0) / 3.);
        }

        // Transform back
        r[0] *= k;
    }
    
    r[0] -= a[2] / 3.;

    // Other two solutions
    float p = r[0] + a[2];
    float q = r[0] * p + a[1];

    float discrim = p * p - 4. * q;
    if (forceReal && discrim < 0.0) discrim = 0.0;

    if (discrim >= 0.0) {
        float root = sqrt(discrim);
        r[1] = (-p - root) / 2.;
        r[2] = (-p + root) / 2.;
        return 3;
    } else {
        float root = sqrt(-discrim);
        r[1] = -p / 2.;
        r[2] = root / 2.;
        return 1;
    }    
}

int mat2eigenvalues(mat2 m, inout vec2 lambda) {
    vec2 pqr;

    mat2invariants(m, pqr);

    return (vec2squareroots(pqr, lambda));
}

int mat3eigenvalues(mat3 m, inout vec3 lambda)
// calculate eigenvalues in lambda, return number of real eigenvalues.
// either returnval==1, lambda[0]=real ev, l[1] real part+-l[2] imag part
// or     returnval==3, lambda[0-2] = eigenvalues
{
    vec3 pqr;
    mat3invariants(m, pqr);

    // force real solutions for symmetric matrices
    bool forceReal = false;
    if (m[1][0] == m[0][1] && m[2][0] == m[0][2] && m[2][1] == m[1][2])
        forceReal = true;

    return (vec3cubicroots(pqr, lambda, forceReal));    
}

//this version uses column-major matrix m (the original code uses row-major matrix m)
bool mat3realEigenvector(mat3 m, float lambda, inout vec3 ev)
// calculates eigenvector corresponding to real lambda and returns true if ok
{
    mat3 m_cross;
    vec3 sqr;

    //mat3copy(m, reduced);
    mat3 reduced = mat3(m);// matrix minus lambda I
    reduced[0][0] -= lambda;
    reduced[1][1] -= lambda;
    reduced[2][2] -= lambda;

    //the following 3 lines are added to extract vectors from column-major format so that the rest of the code can stay the same
    vec3 reduced_0 = vec3(reduced[0][0], reduced[1][0], reduced[2][0]);
    vec3 reduced_1 = vec3(reduced[0][1], reduced[1][1], reduced[2][1]);
    vec3 reduced_2 = vec3(reduced[0][2], reduced[1][2], reduced[2][2]);

    m_cross[0] = cross(reduced_1, reduced_2);//vec3cross(reduced[1], reduced[2], m_cross[0]);
    m_cross[1] = cross(reduced_2, reduced_0);//vec3cross(reduced[2], reduced[0], m_cross[1]);
    m_cross[2] = cross(reduced_0, reduced_1);//vec3cross(reduced[0], reduced[1], m_cross[2]);

    sqr[0] = dot(m_cross[0], m_cross[0]);//vec3sqr(m_cross[0]); with vec3sqr(a) = vec3dot(a, a);
    sqr[1] = dot(m_cross[1], m_cross[1]);//vec3sqr(m_cross[1]); with vec3sqr(a) = vec3dot(a, a);
    sqr[2] = dot(m_cross[2], m_cross[2]);//vec3sqr(m_cross[2]); with vec3sqr(a) = vec3dot(a, a);

    // use largest cross product to calculate eigenvector
    int best;
    // ### TODO: divide e.g. sqr[0] by |reduced[1]|^2 * |reduced[2]|^2
    if (sqr[1] > sqr[0]) {
        if (sqr[2] > sqr[1]) best = 2; else best = 1;
    } else {
        if (sqr[2] > sqr[0]) best = 2; else best = 0;
    }

    float len = sqrt(sqr[best]);

    if (len > 0.) {
        ev[0] = m_cross[best][0] / len;
        ev[1] = m_cross[best][1] / len;
        ev[2] = m_cross[best][2] / len;
        return true;                              // result ok
    } else {
        return false;                             // result not ok: multiple eigenvalue, probably
    }
}

//---------------- END OF linalg.h ----------------------

//finds eigenvalue with smallest value and calculates associated eigenvector only if the eigenvalue is negative
//returns:
//if lamda is negative, ev contains the eigenvector, the return value is true (or false if there was a problem)
//if lamba is positive, ev is NOT calculated, the return value is false
bool mat3RidgeEigen(mat3 m, inout float lambda, inout vec3 ev, float ridge_lambda_threshold)
{
    vec3 lambdas = vec3(0,0,0);
    mat3eigenvalues(m, lambdas);
    int index = 0;
    if(lambdas[0] <= lambdas[1]){
        index = lambdas[0] < lambdas[2] ? 0 : 2;
    }else{//1 is smaller than 0
        index = lambdas[1] < lambdas[2] ? 1 : 2;
    }

    lambda = lambdas[index];
    if(lambda >= ridge_lambda_threshold){
        return false;
    }

    return mat3realEigenvector(m, lambda, ev);
}

//finds eigenvalue with smallest value and calculates associated eigenvector
//returns:
//ev contains the eigenvector, 
//the return value is true (or false if there was a problem)
bool mat3RidgeEigenNoThreshold(mat3 m, inout float lambda, inout vec3 ev)
{
    vec3 lambdas = vec3(0,0,0);
    mat3eigenvalues(m, lambdas);
    int index = 0;
    if(lambdas[0] <= lambdas[1]){
        index = lambdas[0] < lambdas[2] ? 0 : 2;
    }else{//1 is smaller than 0
        index = lambdas[1] < lambdas[2] ? 1 : 2;
    }

    lambda = lambdas[index];
    return mat3realEigenvector(m, lambda, ev);
}


`;

export { SHADER_MODULE_LINALG }