⚠️ This wiki is currently being updated together with the dev branch, so migh not reflect usage for previous versions!

# General usage

If you are not familiar with nextflow, While not needed, I would reccomend reading up a little first as it will make more sense, especially when it comes to resolving errors. I tried to write this so you don't need to get too deep into the weeds tough, nextflow can be a bit of a rabbithole. The pipeline loosely follows nf-core principles.

Some resources
- https://training.nextflow.io/2.1/#nextflow-for-science
- https://nf-co.re/docs/usage/getting_started/terminology
- https://nf-co.re/docs/usage/troubleshooting/basics

There are currently 3 workflows available in the pipeline, below is an overview of the minimal I/O, it can change depending on which options are provided

1. cnmf > runs consensus non-negative matrix factorization and annotation of the outputs 
2. enrich > runs various enrichment approaches on a matrix
3. convert > merge and convert a mixture of seurat and anndata objects (counts)    

Once installed and setup I reccomend running through the wrapper script `sc-blipper`.
General pipeline usage for sanger farm-22 is as such 

```
Usage: /software/teamtrynka/installs/sc-blipper/sc-blipper <cnmf|enrich|convert> [-c <file.nf>] [-lqtw] [-w workdir] -- [nextflow pipeline args]
<cnmf|enrich|convert>           The workflow to run
-c                              <path/to/config.nf> Nextflow config file for the run
-l                              Run nextflow locally instead of submitting to oversubscribed
-w                              Set the nextflow work directory (default: ../workdir)
-q                              Set the queue for the nextflow job (default: oversubscribed)
-w                              Set the time limit for the nextflow job (hours) (default: 120)
-- The rest is passed to nextlfow and overrides -c


Examples:
sc-blipper enrich -c conf.nf -l
sc-blipper enrich -c conf.nf -w /path/to/workdir -- --rn_runname hello_world --enrich.input_matrix matrix.tsv
```

For non sanger setups, the runner is fully configurable, mostly pointing to nextflow installs and setting env variables.
Alternatively, it is also fully possible to run the pipeline directly through nextflow with your own runner scripts.
But I will point to the nextflow documentation for setting this up

# Configuring a pipeline run

A run can be configured using a nextflow config file supplied to `sc-blipper -c <config.config>`. Please see `conf/example_<x>.config` for some examples. Also see `nextflow.config` for a full list of available options.

> IMPORTANT NOTE: The pipeline is reproducible, but steps in cNMF and pre-processing like scVI have stochastic component. By default, the config seeds are set (`params.cnmf.seed=42` and `params.preprocess.scvi.seed=314`), so you should get the same results, but you may want to change these seeds to evaluate the impact of the stochastic component. If set to `null` you will get a random seed selected for each step in the process. However, I would still reccomend setting the seeds explicitly, even if you manually generate a random number just to ensure reproducibility.

## Setting up the manfiest
The manifest is a `.tsv` file with a header which must have the columns id, file and namespace. H5ad files must end in `.h5ad`, Seurat files must end in `.rds/.Rds`. The file can have multiple rows, if it does, these are merged into one .h5ad on which cNMF is run. 

- `id`: This is the name for the batch / file 
- `file`: Path to the .h5ad or .rds file
- `namespace`: One of 'gene_name' / 'ensembl' describing the namespace of the file

If one of the files namespace doesn't match the `convert.output_namespace` of the pipline, the IDs / names are converted using the strategy outlined below.


# Note on gmt files

Reference pathways are provided as .gmt files in the assets folder. The ones you want to use can bet set with `enrich.gmt_files`. By default all are used, valid values are null, 'DEFAULT' or a string with a comma seperated list of paths. They are bundled in two flavours, as ensembl id or as gene symbols, by default the pipeline will auto match to your target namespace, if providing manually make sure to use the right namespace. For a description of bundled datasets, see `assets/README.md`

# Note on gene ids
The pipeline runs on either gene symbols if `convert.output_namespace='gene_name'` or ensemblid if `convert.output_namespace='ensembl'`.
The pipeline decides how to convert each input file based on the namespace you give in the manifest (or for workflow enrich, the parameter enrich.input_namespace). Ensembl > gene name mapping is not unique. To make sure gene names are unique and all genes are preserved, the following strategy is applied:

1. Sort ensembl on chromosome 1-22,X,Y, MT
2. Sort so biotype "protein_coding" apears first
3. Set missing gene names to NO_NAME
4. Make genes unique by appending a number at the end if duplicated `<gene_name>_<number>`

For example tp merge one h5ad with ensembl ids with a seurat file with gene symbols and end up with gene symbols:

1. for h5ad set namespace in manifest as'ensembl'
2. for seurat set namespace in manifest 'gene_name'
3. set `convert.output_namespace='gene_name'` (you want gene symbols)

If you indead want to run with ensembl_ids:

1. for h5ad set namespace in manifest as 'ensembl'
2. for seurat set namespace in manifest 'gene_name'
3. set `convert.output_namespace='ensembl'

By default, gene-ensembl links are downloaded from biomart, the version is controllable through `rn_ensembl_version` (currently 114 is the higest)


A custom id linking file with two columns, old id, new id can be specified with `convert.id_linker`, but this is mostly untested, it should work if the target is ensembl id or gene symbol, but others are untested and might fail for some of the steps.


# Note on configuring resource limits

The default resource labels have been tested and optimized to run with an object of ~50-100k cells. If a job crashes, Nextflow will attempt it again, doubling resource requirements where possible up to 2 times. However this can be quite wastefull, so with larger objects of million+ cells you may need to change resource labels, particularly for the `convert` and `cnmf` proccesses. The file `conf/processes.config` has a list of available resource labels. The resource labels for a config can be adjused by the `label` parameter. For instance to give the cnmf proccesses more memory set `cnmf.label='medium'`. Should a suitable resource label not be available, you can define your own in your config file, see the `conf/processes.config` for examples.


# Note on adjusted p-values in enrichment tests

Different files in the pipeline may have different values for padj. The core one you want to use is padj_test, which corrects for all the tests using Benjamini-Hochbergs method listed in the padj_group column. This is set by default to correct for all tests done within a test group (top50, top100, ALL, UP, DOWN etc) but across databases (gmt files). So if you specify top50,top100 and top500 with two gmt files, one with 500 pathways, and one with 250, the total number of tests corrected for is 750 for each of the 3 top tests seperately. The padj column from ORA or GSEA only controls for FDR within a test group and database. The padj_global column corrects for all of the tests reported in the table, this is likely to be too conservative if there are repeats of essentially the same test (GSEA, topX genes on the same database).

# Note on finalizing output and cleaning up after a successfull run

The pipeline results uses Nextflow publishDir directive, this means the output in results is linked to the process output in the workdir. This is nice and efficient for organizing output, especially when you are messing with the pipeline settings, as it avoids duplicating things. However, its not so handy for archiving or finalizing results. For this reason NEVER REMOVE THE WORKDIR BEFORE FINALIZING. To finalize the results and make them ready for backup etc:

```
rsync -rP --copy-links results results_final

```

This will make a deep copy of the results, copying all the symlinked files as files, not links. Then its safe to remove the results and workdir folders. This makes it impossible to pick a run up halfway, and you will need to start fresh after doing this.

```
rm -r results
rm -r workdir
```
