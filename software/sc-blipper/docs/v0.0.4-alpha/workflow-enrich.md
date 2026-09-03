⚠️ This wiki is currently being updated together with the dev branch, so migh not reflect usage for previous versions!

# Workflow: Enrich

## What it does

This workflow takes a numeric matrix (lfc/beta's/pvalues/-1,0,1) and runs enrichment analysis on it. It has strong overlaps with cNMF, but is slightly different in that the starting point is generalized to work with any numeric matrix. It is very configurable, so lots of options.


## General IO
- Input:
  - gene x condition matrix (can be tranposed if it is condition x gene, using `enrich.transpose=true`)
  - params.config file setting parameters
  - .gmt files for geneset and summary statistics for gwas enrichment
- Output:
  - Merged enrichment file with FDR correction
  - Individual enrichment files
  - Ensembl reference file and ID linkers

## Settings

### Required input

Several example configurations are provided in https://github.com/TrynkaLab/sc-blipper/tree/dev/conf/examples . A full list of parameters can be found in nextflow.config. 

Input matrix is provided with `enrich.input_matrix=<path/to/file>` and setting the namespace with 'enrich.input_namespace="<gene_name|ensembl>"'.

Reference databases are provided with `enrich.gmt_files="/path/to/file.gmt,/path/to/file2.gmt"`. By default 'enrich.gmt='DEFAULT'', all .gmt files in the assets folder are used.
The gmt files must be in the target namespace. Reference databases in ensembl ids and HCNG symbols are provided in the assets folder.

If not running magma (`enrich.run_magma=false`) this is all you need to set
If you are running magma, you also need to either provide:

- `magma.manifest_sumstats` A manifest tsv file with trait name, snpcol, pvalcol, path to summary stats
-  `magma.ld_reference` A suitable LD reference panel for inferring the gene-gene correlations

If using pre-computed magma scores:
- `magma.manifest_magma` A path to a previous pipeline run magma manifest

#### Using general numeric matrices (Coefficients / LFCs)

If the input matrix consists of DE results, you can leave the settings at default, these will work well with GSEA, Magma and ORA. For ORA when `enrich.use_top=null` the parameters `enrich.threshold`, `enrich.absolute`  and `enrich.threshold_invert` needs consideration.

#### Using binarized data
If the input matrix is binarzied to -1,0,1 you should set `enrich.use_top=null` and `enrich.run_gsea=false`. This will then run ORA for all -1,1 genes, (ALL), -1 (DOWN) 1 (UP). Behaviour can be customized using `enrich.threshold`, `enrich.absolute` and `enrich.threshold_invert` but defaults don't need to be modified

#### Using (signed) p-values
To use pvalues you can binrize them by setting `enrich.use_top=null`, `enrich.run_gsea=false`, `enrich.threshold=0.05` and `enrich.threshold_invert=true`. This will both work for signed and unsigned pvalues and run ORA for all -1,1 genes, (ALL), -1 (DOWN) 1 (UP). With pvalues you should NOT set `enrich.absolute=F` as this will then treat any negative signed pvale as significant. 

Alternatively you input them as if they were any numeric value by covnerting them to -log10, in which case see the Using DE results section.

### Gene universe (optional)
By default, the universe is all genes included in the matrix, this works well for DE tests for instance, as the background forms all tested genes. However there might be cases where the tested geneset is pre-enriched for something, or you tested all genes, so LFCs might have an expression bias. 

In these cases you can set `enrich.universe=<path/to/file>` to a file that has one column with the gene names/gene ids in the output namespace. So if `convert.convert_gene_names=true` make sure you provide this in the target namespace, not the input namespace.

NOTE: GSEA runs on numeric values, so if your universe is much larger then your tested genes, its best not to run this test by setting `enrich.run_gsea=false`


### Enrichment tests to run (optional)
There are 4 enrichment tests implemented, these can be toggeled on and off with the following flags
```
enrich {
    run_gsea = true
    run_ora = true
    run_decoupler = true
    run_magma = true
}
```

### Annotate the results table (optional)
You may wish to annotate the final results table with additional metadata. In this case these can be provided with `enrich.annotate` which should be the path to a tsv file containing the column annotations to add. Are assumed to be in the same order as colnames (I think). 
