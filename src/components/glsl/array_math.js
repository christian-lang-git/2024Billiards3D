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

float AM_Mat4Det(ArrayMatrix mat){
    float m_0_0 = mat.values[0];
    float m_1_0 = mat.values[1];
    float m_2_0 = mat.values[2];
    float m_3_0 = mat.values[3];
    float m_0_1 = mat.values[4];
    float m_1_1 = mat.values[5];
    float m_2_1 = mat.values[6];
    float m_3_1 = mat.values[7];
    float m_0_2 = mat.values[8];
    float m_1_2 = mat.values[9];
    float m_2_2 = mat.values[10];
    float m_3_2 = mat.values[11];
    float m_0_3 = mat.values[12];
    float m_1_3 = mat.values[13];
    float m_2_3 = mat.values[14];
    float m_3_3 = mat.values[15];
    
    return m_0_0 * (m_1_1 * (m_2_2 * m_3_3 - m_2_3 * m_3_2) - m_1_2 * (m_2_1 * m_3_3 - m_2_3 * m_3_1) + m_1_3 * (m_2_1 * m_3_2 - m_2_2 * m_3_1)) -
    m_0_1 * (m_1_0 * (m_2_2 * m_3_3 - m_2_3 * m_3_2) - m_1_2 * (m_2_0 * m_3_3 - m_2_3 * m_3_0) + m_1_3 * (m_2_0 * m_3_2 - m_2_2 * m_3_0)) +
    m_0_2 * (m_1_0 * (m_2_1 * m_3_3 - m_2_3 * m_3_1) - m_1_1 * (m_2_0 * m_3_3 - m_2_3 * m_3_0) + m_1_3 * (m_2_0 * m_3_1 - m_2_1 * m_3_0)) -
    m_0_3 * (m_1_0 * (m_2_1 * m_3_2 - m_2_2 * m_3_1) - m_1_1 * (m_2_0 * m_3_2 - m_2_2 * m_3_0) + m_1_2 * (m_2_0 * m_3_1 - m_2_1 * m_3_0));
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

bool AM_Mat4Inv(ArrayMatrix mat_A, inout ArrayMatrix mat_B){
    //set row and col counts for result matrix
    mat_B.rows = mat_A.rows;
    mat_B.cols = mat_A.cols;

    float m_0_0 = mat_A.values[0];
    float m_1_0 = mat_A.values[1];
    float m_2_0 = mat_A.values[2];
    float m_3_0 = mat_A.values[3];
    float m_0_1 = mat_A.values[4];
    float m_1_1 = mat_A.values[5];
    float m_2_1 = mat_A.values[6];
    float m_3_1 = mat_A.values[7];
    float m_0_2 = mat_A.values[8];
    float m_1_2 = mat_A.values[9];
    float m_2_2 = mat_A.values[10];
    float m_3_2 = mat_A.values[11];
    float m_0_3 = mat_A.values[12];
    float m_1_3 = mat_A.values[13];
    float m_2_3 = mat_A.values[14];
    float m_3_3 = mat_A.values[15];

    
    float d = AM_Mat4Det(mat_A);
    if (d == 0.0) {
        return false;
    }

    float invDet = 1.0 / d;

    float inv_0_0 = invDet * (m_1_1 * (m_2_2 * m_3_3 - m_2_3 * m_3_2) - m_1_2 * (m_2_1 * m_3_3 - m_2_3 * m_3_1) + m_1_3 * (m_2_1 * m_3_2 - m_2_2 * m_3_1));
    float inv_0_1 = invDet * (m_0_1 * (m_2_3 * m_3_2 - m_2_2 * m_3_3) + m_0_2 * (m_2_1 * m_3_3 - m_2_3 * m_3_1) + m_0_3 * (m_2_2 * m_3_1 - m_2_1 * m_3_2));
    float inv_0_2 = invDet * (m_0_1 * (m_1_2 * m_3_3 - m_1_3 * m_3_2) - m_0_2 * (m_1_1 * m_3_3 - m_1_3 * m_3_1) + m_0_3 * (m_1_1 * m_3_2 - m_1_2 * m_3_1));
    float inv_0_3 = invDet * (m_0_1 * (m_1_3 * m_2_2 - m_1_2 * m_2_3) - m_0_2 * (m_1_3 * m_2_1 - m_1_1 * m_2_3) + m_0_3 * (m_1_2 * m_2_1 - m_1_1 * m_2_2));
    
    float inv_1_0 = invDet * (m_1_0 * (m_2_3 * m_3_2 - m_2_2 * m_3_3) + m_1_2 * (m_2_0 * m_3_3 - m_2_3 * m_3_0) + m_1_3 * (m_2_2 * m_3_0 - m_2_0 * m_3_2));
    float inv_1_1 = invDet * (m_0_0 * (m_2_2 * m_3_3 - m_2_3 * m_3_2) - m_0_2 * (m_2_0 * m_3_3 - m_2_3 * m_3_0) + m_0_3 * (m_2_0 * m_3_2 - m_2_2 * m_3_0));
    float inv_1_2 = invDet * (m_0_0 * (m_1_3 * m_3_2 - m_1_2 * m_3_3) + m_0_2 * (m_1_0 * m_3_3 - m_1_3 * m_3_0) + m_0_3 * (m_1_2 * m_3_0 - m_1_0 * m_3_2));
    float inv_1_3 = invDet * (m_0_0 * (m_1_2 * m_2_3 - m_1_3 * m_2_2) - m_0_2 * (m_1_0 * m_2_3 - m_1_3 * m_2_0) + m_0_3 * (m_1_0 * m_2_2 - m_1_2 * m_2_0));

    float inv_2_0 = invDet * (m_1_0 * (m_2_1 * m_3_3 - m_2_3 * m_3_1) - m_1_1 * (m_2_0 * m_3_3 - m_2_3 * m_3_0) + m_1_3 * (m_2_0 * m_3_1 - m_2_1 * m_3_0));
    float inv_2_1 = invDet * (m_0_0 * (m_2_3 * m_3_1 - m_2_1 * m_3_3) + m_0_1 * (m_2_0 * m_3_3 - m_2_3 * m_3_0) + m_0_3 * (m_2_1 * m_3_0 - m_2_0 * m_3_1));
    float inv_2_2 = invDet * (m_0_0 * (m_1_1 * m_3_3 - m_1_3 * m_3_1) - m_0_1 * (m_1_0 * m_3_3 - m_1_3 * m_3_0) + m_0_3 * (m_1_0 * m_3_1 - m_1_1 * m_3_0));
    float inv_2_3 = invDet * (m_0_0 * (m_1_3 * m_2_1 - m_1_1 * m_2_3) + m_0_1 * (m_1_0 * m_2_3 - m_1_3 * m_2_0) + m_0_3 * (m_1_1 * m_2_0 - m_1_0 * m_2_1));
    
    float inv_3_0 = invDet * (m_1_0 * (m_2_2 * m_3_1 - m_2_1 * m_3_2) + m_1_1 * (m_2_0 * m_3_2 - m_2_2 * m_3_0) + m_1_2 * (m_2_1 * m_3_0 - m_2_0 * m_3_1));
    float inv_3_1 = invDet * (m_0_0 * (m_2_1 * m_3_2 - m_2_2 * m_3_1) + m_0_1 * (m_2_2 * m_3_0 - m_2_0 * m_3_2) + m_0_2 * (m_2_0 * m_3_1 - m_2_1 * m_3_0));
    float inv_3_2 = invDet * (m_0_0 * (m_1_2 * m_3_1 - m_1_1 * m_3_2) + m_0_1 * (m_1_0 * m_3_2 - m_1_2 * m_3_0) + m_0_2 * (m_1_1 * m_3_0 - m_1_0 * m_3_1));
    float inv_3_3 = invDet * (m_0_0 * (m_1_1 * m_2_2 - m_1_2 * m_2_1) + m_0_1 * (m_1_2 * m_2_0 - m_1_0 * m_2_2) + m_0_2 * (m_1_0 * m_2_1 - m_1_1 * m_2_0));

    mat_B.values[0] = inv_0_0;
    mat_B.values[1] = inv_1_0;
    mat_B.values[2] = inv_2_0;
    mat_B.values[3] = inv_3_0;

    mat_B.values[4] = inv_0_1;
    mat_B.values[5] = inv_1_1;
    mat_B.values[6] = inv_2_1;
    mat_B.values[7] = inv_3_1;

    mat_B.values[8] = inv_0_2;
    mat_B.values[9] = inv_1_2;
    mat_B.values[10] = inv_2_2;
    mat_B.values[11] = inv_3_2;

    mat_B.values[12] = inv_0_3;
    mat_B.values[13] = inv_1_3;
    mat_B.values[14] = inv_2_3;
    mat_B.values[15] = inv_3_3;
    
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

void AM_ExtractRows3x3(ArrayMatrix mat, inout vec3 row_0, inout vec3 row_1, inout vec3 row_2){
    //access element in i-th row and j-th col: index = i + j * mat_rows;    
    row_0.x = mat.values[0];
    row_1.x = mat.values[1];
    row_2.x = mat.values[2];

    row_0.y = mat.values[3];
    row_1.y = mat.values[4];
    row_2.y = mat.values[5];

    row_0.z = mat.values[6];
    row_1.z = mat.values[7];
    row_2.z = mat.values[8];
}  

void AM_ExtractRows4x3(ArrayMatrix mat, inout vec3 row_0, inout vec3 row_1, inout vec3 row_2, inout vec3 row_3){
    //access element in i-th row and j-th col: index = i + j * mat_rows;    
    row_0.x = mat.values[0];
    row_1.x = mat.values[1];
    row_2.x = mat.values[2];
    row_3.x = mat.values[3];

    row_0.y = mat.values[4];
    row_1.y = mat.values[5];
    row_2.y = mat.values[6];
    row_3.y = mat.values[7];

    row_0.z = mat.values[8];
    row_1.z = mat.values[9];
    row_2.z = mat.values[10];
    row_3.z = mat.values[11];
}  

`;

export { SHADER_MODULE_ARRAY_MATH }