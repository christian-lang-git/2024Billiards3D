
/*
class ArrayMatrix{
    constructor(){
        this.row_count = 0;
        this.column_count = 0;
        this.column_count = 0;
    }
}
*/

/**
 * TEST CLASS
 * mxn: m rows, n columns
 * access element in i-th row and j-th col: index = i + j * mat_rows; 
 */
class ArrayMath {

    constructor() {

        var mat_A = new Array(48);
        var mat_A_rows = 2;
        var mat_A_cols = 3;

        var mat_AT = new Array(48);
        var mat_AT_rows = 0;
        var mat_AT_cols = 0;

        var mat_ATA = new Array(48);
        var mat_ATA_rows = 0;
        var mat_ATA_cols = 0;

        var mat_B = new Array(48);
        var mat_B_rows = 3;
        var mat_B_cols = 2;

        var mat_C = new Array(48);
        var mat_C_rows = 0;
        var mat_C_cols = 0;

        var vec_b = new Array(48);
        var vec_b_rows = 3;
        var vec_b_cols = 1;

        var mat_D = new Array(48);
        var mat_D_rows = 0;
        var mat_D_cols = 0;

        var mat_E = new Array(48);
        var mat_E_rows = 3;
        var mat_E_cols = 3;

        //test values A
        mat_A[0] = 11; 
        mat_A[1] = 21; 
        mat_A[2] = 12; 
        mat_A[3] = 22; 
        mat_A[4] = 13; 
        mat_A[5] = 23; 

        //test values B
        mat_B[0] = 111; 
        mat_B[1] = 121; 
        mat_B[2] = 131; 
        mat_B[3] = 112; 
        mat_B[4] = 122; 
        mat_B[5] = 132; 

        //test values vec b
        vec_b[0] = 101; 
        vec_b[1] = 102; 
        vec_b[2] = 103; 

        //test values E
        mat_E[0] = 11; 
        mat_E[1] = 20; 
        mat_E[2] = 40; 
        mat_E[3] = 20; 
        mat_E[4] = 50; 
        mat_E[5] = 80; 
        mat_E[6] = 40; 
        mat_E[7] = 80; 
        mat_E[8] = 100; 

        console.warn("#AM TEST A -----------------------------------------");
        this.AM_PrintMatrix(mat_A, mat_A_rows, mat_A_cols);
        this.AM_PrintWolfram(mat_A, mat_A_rows, mat_A_cols);

        console.warn("#AM TEST AT -----------------------------------------");
        var out = this.AM_Transpose(mat_A, mat_A_rows, mat_A_cols, mat_AT, mat_AT_rows, mat_AT_cols);
        mat_AT = out.mat_AT;
        mat_AT_rows = out.mat_AT_rows;
        mat_AT_cols = out.mat_AT_cols;
        this.AM_PrintMatrix(mat_AT, mat_AT_rows, mat_AT_cols);
        this.AM_PrintWolfram(mat_AT, mat_AT_rows, mat_AT_cols);

        console.warn("#AM TEST ATA -----------------------------------------");
        var out = this.AM_Multiply(mat_AT, mat_AT_rows, mat_AT_cols, mat_A, mat_A_rows, mat_A_cols, mat_ATA, mat_ATA_rows, mat_ATA_cols);
        mat_ATA = out.mat_C;
        mat_ATA_rows = out.mat_C_rows;
        mat_ATA_cols = out.mat_C_cols;
        this.AM_PrintMatrix(mat_ATA, mat_ATA_rows, mat_ATA_cols);
        this.AM_PrintWolfram(mat_ATA, mat_ATA_rows, mat_ATA_cols);
        var det = this.AM_Mat3Det(mat_ATA);
        console.warn("#AM det:", det);

        console.warn("#AM TEST B -----------------------------------------");
        this.AM_PrintMatrix(mat_B, mat_B_rows, mat_B_cols);
        this.AM_PrintWolfram(mat_B, mat_B_rows, mat_B_cols);

        console.warn("#AM TEST C=BA -----------------------------------------");
        var out = this.AM_Multiply(mat_B, mat_B_rows, mat_B_cols, mat_A, mat_A_rows, mat_A_cols, mat_C, mat_C_rows, mat_C_cols);
        mat_C = out.mat_C;
        mat_C_rows = out.mat_C_rows;
        mat_C_cols = out.mat_C_cols;
        this.AM_PrintMatrix(mat_C, mat_C_rows, mat_C_cols);
        this.AM_PrintWolfram(mat_C, mat_C_rows, mat_C_cols);
        var det = this.AM_Mat3Det(mat_C);
        console.warn("#AM det:", det);

        console.warn("#AM TEST b -----------------------------------------");
        this.AM_PrintMatrix(vec_b, vec_b_rows, vec_b_cols);
        this.AM_PrintWolfram(vec_b, vec_b_rows, vec_b_cols);

        console.warn("#AM TEST D=Cb -----------------------------------------");
        var out = this.AM_Multiply(mat_C, mat_C_rows, mat_C_cols, vec_b, vec_b_rows, vec_b_cols, mat_D, mat_D_rows, mat_D_cols);
        mat_D = out.mat_C;
        mat_D_rows = out.mat_C_rows;
        mat_D_cols = out.mat_C_cols;
        this.AM_PrintMatrix(mat_D, mat_D_rows, mat_D_cols);
        this.AM_PrintWolfram(mat_D, mat_D_rows, mat_D_cols);

        console.warn("#AM TEST b -----------------------------------------");
        this.AM_PrintMatrix(mat_E, mat_E_rows, mat_E_cols);
        this.AM_PrintWolfram(mat_E, mat_E_rows, mat_E_cols);
        var det = this.AM_Mat3Det(mat_E);
        console.warn("#AM det:", det);//-7400
        
    }

    AM_PrintMatrix(mat, mat_rows, mat_cols){
        console.warn("#AM matrix, rows=", mat_rows, "cols=", mat_cols);
        for(var i=0; i<mat_rows; i++){
            var s = "#AM ["
            for(var j=0; j<mat_cols; j++){
                if(j > 0){
                    s += ", "
                }
                var index = i + j * mat_rows;
                s += mat[index];
            }
            s += "]"
            console.warn(s);
        }
    }

    AM_PrintWolfram(mat, mat_rows, mat_cols){
        //console.warn("#AM matrix, rows=", mat_rows, "cols=", mat_cols);
        var s = "#AM Wolfram {"
        for(var i=0; i<mat_rows; i++){
            if(i > 0){
                s += ", "
            }
            s += "{"
            for(var j=0; j<mat_cols; j++){
                if(j > 0){
                    s += ", "
                }
                var index = i + j * mat_rows;
                s += mat[index];
            }
            s += "}"
        }
        s += "}"
        console.warn(s);
    }

    AM_Transpose(mat_A, mat_A_rows, mat_A_cols, mat_AT, mat_AT_rows, mat_AT_cols){
        //swap row and col counts for transposed matrix;
        mat_AT_rows = mat_A_cols;
        mat_AT_cols = mat_A_rows;
        for(var i=0; i<mat_A_rows; i++){
            for(var j=0; j<mat_A_cols; j++){
                var index = i + j * mat_A_rows;
                var index_transposed = j + i * mat_AT_rows;
                mat_AT[index_transposed] = mat_A[index];
            }
        }
        
        //simulate inout keyword
        var out = {};
        out.mat_AT = mat_AT;
        out.mat_AT_rows = mat_AT_rows;
        out.mat_AT_cols = mat_AT_cols;
        return out;
    }

    /**
     * Multiply matrices: C = A * B
     */
    AM_Multiply(mat_A, mat_A_rows, mat_A_cols, mat_B, mat_B_rows, mat_B_cols, mat_C, mat_C_rows, mat_C_cols){
        //set row and col counts for result matrix;
        mat_C_rows = mat_A_rows;
        mat_C_cols = mat_B_cols;
        for(var i=0; i<mat_C_rows; i++){
            for(var j=0; j<mat_C_cols; j++){
                var index_c = i + j * mat_C_rows;
                var value = 0;
                for(var k=0; k<mat_A_cols; k++){
                    var index_a = i + k * mat_A_rows;
                    var index_b = k + j * mat_B_rows;
                    value += mat_A[index_a] * mat_B[index_b];
                }
                mat_C[index_c] = value;
            }
        }
        
        //simulate inout keyword
        var out = {};
        out.mat_C = mat_C;
        out.mat_C_rows = mat_C_rows;
        out.mat_C_cols = mat_C_cols;
        return out;
    }

    AM_Mat3Det(mat){
        var a_0_0 = mat[0];
        var a_1_0 = mat[1];
        var a_2_0 = mat[2];
        var a_0_1 = mat[3];
        var a_1_1 = mat[4];
        var a_2_1 = mat[5];
        var a_0_2 = mat[6];
        var a_1_2 = mat[7];
        var a_2_2 = mat[8];
        
        return  a_0_0 * (a_1_1 * a_2_2 - a_1_2 * a_2_1) +
                a_0_1 * (a_1_2 * a_2_0 - a_1_0 * a_2_2) +
                a_0_2 * (a_1_0 * a_2_1 - a_1_1 * a_2_0);
    }

    /*
    CreateMatrix(row_count, column_count){
        var matrix = new ArrayMatrix();

    }
        */
}

export { ArrayMath };