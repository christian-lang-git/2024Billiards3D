
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

        var out = this.AM_Transpose(mat_A, mat_A_rows, mat_A_cols, mat_AT, mat_AT_rows, mat_AT_cols);
        mat_AT = out.mat_AT;
        mat_AT_rows = out.mat_AT_rows;
        mat_AT_cols = out.mat_AT_cols;
        this.AM_PrintMatrix(mat_AT, mat_AT_rows, mat_AT_cols);
        console.warn("#AM out", out);
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

    /*
    CreateMatrix(row_count, column_count){
        var matrix = new ArrayMatrix();

    }
        */
}

export { ArrayMath };