
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

        //test values
        mat_A[0] = 11; 
        mat_A[1] = 21; 
        mat_A[2] = 12; 
        mat_A[3] = 22; 
        mat_A[4] = 13; 
        mat_A[5] = 23; 

        this.AM_PrintMatrix(mat_A, mat_A_rows, mat_A_cols);
        this.AM_PrintWolfram(mat_A, mat_A_rows, mat_A_cols);

        var out = this.AM_Transpose(mat_A, mat_A_rows, mat_A_cols, mat_AT, mat_AT_rows, mat_AT_cols);
        mat_AT = out.mat_AT;
        mat_AT_rows = out.mat_AT_rows;
        mat_AT_cols = out.mat_AT_cols;
        this.AM_PrintMatrix(mat_AT, mat_AT_rows, mat_AT_cols);
        this.AM_PrintWolfram(mat_AT, mat_AT_rows, mat_AT_cols);

        var out = this.AM_Multiply(mat_AT, mat_AT_rows, mat_AT_cols, mat_A, mat_A_rows, mat_A_cols, mat_ATA, mat_ATA_rows, mat_ATA_cols);
        mat_ATA = out.mat_C;
        mat_ATA_rows = out.mat_C_rows;
        mat_ATA_cols = out.mat_C_cols;
        this.AM_PrintMatrix(mat_ATA, mat_ATA_rows, mat_ATA_cols);
        this.AM_PrintWolfram(mat_ATA, mat_ATA_rows, mat_ATA_cols);
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
        //swap row and col counts for transposed matrix;
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

    /*
    CreateMatrix(row_count, column_count){
        var matrix = new ArrayMatrix();

    }
        */
}

export { ArrayMath };