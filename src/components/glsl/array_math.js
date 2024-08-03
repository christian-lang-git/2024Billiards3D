const glsl = x => x[0];
const SHADER_MODULE_ARRAY_MATH = glsl`

void AM_Transpose(float mat_A[], int mat_A_rows, int mat_A_cols, inout float mat_AT[], inout int mat_AT_rows, inout int mat_AT_cols){
    //swap row and col counts for transposed matrix;
    mat_AT_rows = mat_A_cols;
    mat_AT_cols = mat_A_rows;
    for(int i=0; i<mat_A_rows; i++){
        for(int j=0; j<mat_A_cols; j++){
            int index = i + j * mat_A_rows;
            int index_transposed = j + i * mat_AT_rows;
            mat_AT[index_transposed] = mat_A[index];
        }
    }
}

/**
 * Multiply matrices: C = A * B
 */
void AM_Multiply(float mat_A[], int mat_A_rows, int mat_A_cols, float mat_B[], int mat_B_rows, int mat_B_cols, inout float mat_C[], inout int mat_C_rows, inout int mat_C_cols){
    //set row and col counts for result matrix;
    mat_C_rows = mat_A_rows;
    mat_C_cols = mat_B_cols;
    for(int i=0; i<mat_C_rows; i++){
        for(int j=0; j<mat_C_cols; j++){
            int index_c = i + j * mat_C_rows;
            float value = 0;
            for(int k=0; k<mat_A_cols; k++){
                int index_a = i + k * mat_A_rows;
                int index_b = k + j * mat_B_rows;
                value += mat_A[index_a] * mat_B[index_b];
            }
            mat_C[index_c] = value;
        }
    }
}

float AM_Mat3Det(float mat[]){
    float a_0_0 = mat[0];
    float a_1_0 = mat[1];
    float a_2_0 = mat[2];
    float a_0_1 = mat[3];
    float a_1_1 = mat[4];
    float a_2_1 = mat[5];
    float a_0_2 = mat[6];
    float a_1_2 = mat[7];
    float a_2_2 = mat[8];
    
    return  a_0_0 * (a_1_1 * a_2_2 - a_1_2 * a_2_1) +
            a_0_1 * (a_1_2 * a_2_0 - a_1_0 * a_2_2) +
            a_0_2 * (a_1_0 * a_2_1 - a_1_1 * a_2_0);
}

bool AM_Mat3Inv(float mat_A[], inout float mat_B[]){
    float a_0_0 = mat_A[0];
    float a_1_0 = mat_A[1];
    float a_2_0 = mat_A[2];
    float a_0_1 = mat_A[3];
    float a_1_1 = mat_A[4];
    float a_2_1 = mat_A[5];
    float a_0_2 = mat_A[6];
    float a_1_2 = mat_A[7];
    float a_2_2 = mat_A[8];
    
    float d = AM_Mat3Det(mat_A);
    if (d == 0.0) {
        return false;
    }

    mat_B[0] = (a_1_1 * a_2_2 - a_1_2 * a_2_1) / d;
    mat_B[1] = (a_1_2 * a_2_0 - a_1_0 * a_2_2) / d;
    mat_B[2] = (a_1_0 * a_2_1 - a_1_1 * a_2_0) / d;
    mat_B[3] = (a_2_1 * a_0_2 - a_2_2 * a_0_1) / d;
    mat_B[4] = (a_2_2 * a_0_0 - a_2_0 * a_0_2) / d;
    mat_B[5] = (a_2_0 * a_0_1 - a_2_1 * a_0_0) / d;
    mat_B[6] = (a_0_1 * a_1_2 - a_0_2 * a_1_1) / d;
    mat_B[7] = (a_0_2 * a_1_0 - a_0_0 * a_1_2) / d;
    mat_B[8] = (a_0_0 * a_1_1 - a_0_1 * a_1_0) / d;
    
    return true;
}

`;

export { SHADER_MODULE_BILLIARD }