const glsl = x => x[0];
const SHADER_MODULE_ARRAY_MATH_DECLARATIONS = glsl`

const int MATRIX_SIZE = 64;//max 16 neighbors with 3 elements each = 48 values

struct ArrayMatrix {
    float values[MATRIX_SIZE];
    int rows;
    int cols;
};

void AM_Transpose(ArrayMatrix mat_A, inout ArrayMatrix mat_AT);
void AM_Multiply(ArrayMatrix mat_A, ArrayMatrix mat_B, inout ArrayMatrix mat_C);
float AM_Mat3Det(ArrayMatrix mat);
float AM_Mat4Det(ArrayMatrix mat);
bool AM_Mat3Inv(ArrayMatrix mat_A, inout ArrayMatrix mat_B);
bool AM_Mat4Inv(ArrayMatrix mat_A, inout ArrayMatrix mat_B);
void AM_ExtractColumns3x3(ArrayMatrix mat, inout vec3 col_0, inout vec3 col_1, inout vec3 col_2);
void AM_ExtractRows3x3(ArrayMatrix mat, inout vec3 row_0, inout vec3 row_1, inout vec3 row_2);
void AM_ExtractRows4x3(ArrayMatrix mat, inout vec3 row_0, inout vec3 row_1, inout vec3 row_2, inout vec3 row_3);

`;

export { SHADER_MODULE_ARRAY_MATH_DECLARATIONS }