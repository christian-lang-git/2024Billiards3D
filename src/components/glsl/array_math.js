const glsl = x => x[0];
const SHADER_MODULE_ARRAY_MATH = glsl`

void AM_Transpose(ArrayMatrix mat_A, inout ArrayMatrix mat_AT){
    //swap row and col counts for transposed matrix
    mat_AT.rows = mat_A.cols;
    mat_AT.cols = mat_A.rows;
    for(int i=0; i<mat_A.rows; i++){
        for(int j=0; j<mat_A.cols; j++){
            int index = i + j * mat_A.rows;
            int index_transposed = j + i * mat_AT.rows;
            mat_AT.values[index_transposed] = mat_A.values[index];
        }
    }
}

/**
 * Multiply matrices: C = A * B
 */
void AM_Multiply(ArrayMatrix mat_A, ArrayMatrix mat_B, inout ArrayMatrix mat_C){
    //set row and col counts for result matrix
    mat_C.rows = mat_A.rows;
    mat_C.cols = mat_B.cols;
    for(int i=0; i<mat_C.rows; i++){
        for(int j=0; j<mat_C.cols; j++){
            int index_c = i + j * mat_C.rows;
            float value = 0.0;
            for(int k=0; k<mat_A.cols; k++){
                int index_a = i + k * mat_A.rows;
                int index_b = k + j * mat_B.rows;
                value += mat_A.values[index_a] * mat_B.values[index_b];
            }
            mat_C.values[index_c] = value;
        }
    }
}

float AM_Mat3Det(ArrayMatrix mat){
    float a_0_0 = mat.values[0];
    float a_1_0 = mat.values[1];
    float a_2_0 = mat.values[2];
    float a_0_1 = mat.values[3];
    float a_1_1 = mat.values[4];
    float a_2_1 = mat.values[5];
    float a_0_2 = mat.values[6];
    float a_1_2 = mat.values[7];
    float a_2_2 = mat.values[8];
    
    return  a_0_0 * (a_1_1 * a_2_2 - a_1_2 * a_2_1) +
            a_0_1 * (a_1_2 * a_2_0 - a_1_0 * a_2_2) +
            a_0_2 * (a_1_0 * a_2_1 - a_1_1 * a_2_0);
}

bool AM_Mat3Inv(ArrayMatrix mat_A, inout ArrayMatrix mat_B){
    //set row and col counts for result matrix
    mat_B.rows = mat_A.rows;
    mat_B.cols = mat_A.cols;

    float a_0_0 = mat_A.values[0];
    float a_1_0 = mat_A.values[1];
    float a_2_0 = mat_A.values[2];
    float a_0_1 = mat_A.values[3];
    float a_1_1 = mat_A.values[4];
    float a_2_1 = mat_A.values[5];
    float a_0_2 = mat_A.values[6];
    float a_1_2 = mat_A.values[7];
    float a_2_2 = mat_A.values[8];
    
    float d = AM_Mat3Det(mat_A);
    if (d == 0.0) {
        return false;
    }

    mat_B.values[0] = (a_1_1 * a_2_2 - a_1_2 * a_2_1) / d;
    mat_B.values[1] = (a_1_2 * a_2_0 - a_1_0 * a_2_2) / d;
    mat_B.values[2] = (a_1_0 * a_2_1 - a_1_1 * a_2_0) / d;
    mat_B.values[3] = (a_2_1 * a_0_2 - a_2_2 * a_0_1) / d;
    mat_B.values[4] = (a_2_2 * a_0_0 - a_2_0 * a_0_2) / d;
    mat_B.values[5] = (a_2_0 * a_0_1 - a_2_1 * a_0_0) / d;
    mat_B.values[6] = (a_0_1 * a_1_2 - a_0_2 * a_1_1) / d;
    mat_B.values[7] = (a_0_2 * a_1_0 - a_0_0 * a_1_2) / d;
    mat_B.values[8] = (a_0_0 * a_1_1 - a_0_1 * a_1_0) / d;
    
    return true;
}

void AM_ExtractColumns3x3(ArrayMatrix mat, inout vec3 col_0, inout vec3 col_1, inout vec3 col_2){
    //access element in i-th row and j-th col: index = i + j * mat_rows;    
    col_0.x = mat.values[0];
    col_0.y = mat.values[1];
    col_0.z = mat.values[2];

    col_1.x = mat.values[3];
    col_1.y = mat.values[4];
    col_1.z = mat.values[5];

    col_2.x = mat.values[6];
    col_2.y = mat.values[7];
    col_2.z = mat.values[8];
}  

`;

export { SHADER_MODULE_ARRAY_MATH }