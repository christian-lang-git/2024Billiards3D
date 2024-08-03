const glsl = x => x[0];
const SHADER_MODULE_ARRAY_MATH_DECLARATIONS = glsl`

void AM_Transpose(float mat_A[], int mat_A_rows, int mat_A_cols, inout float mat_AT[], inout int mat_AT_rows, inout int mat_AT_cols);
void AM_Multiply(float mat_A[], int mat_A_rows, int mat_A_cols, float mat_B[], int mat_B_rows, int mat_B_cols, inout float mat_C[], inout int mat_C_rows, inout int mat_C_cols);
float AM_Mat3Det(float mat[]);
bool AM_Mat3Inv(float mat_A[], inout float mat_B[]);

`;

export { SHADER_MODULE_BILLIARD_DECLARATIONS }