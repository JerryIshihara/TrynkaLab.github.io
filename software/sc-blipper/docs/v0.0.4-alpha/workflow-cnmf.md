⚠️ This wiki is currently being updated together with the dev branch, so migh not reflect usage for previous versions!

# Workflow: CNMF

## What it does
This workflow takes raw counts from one or multiple files, optionally harmony or scvi corrects them, runs cNMF and then performs various enrichment analysis on the gene spectra scores from the cNMF to aid in annotation. 

1. Convert to anndata (only if Seurat)
2. Merge objects (only if manifest has more then 1 row)
3. Batch correct (Harmony / scVI)
4. Run cNMF (per K)
5. cNMF annotation / enrichment
    - Progeny
    - Decoupler
    - Gene set enrichment (GSEA / ORA)
    - Magma (genomic enrichment of GWAS results)
6. Merge cNMF enrichments, create h5ad
7. Create summary table
8. Create k-selection tree

> IMPORTANT NOTE: The usages in cNMF are not batch corrected as these are inferred on the 'raw' TPM matrix, so make sure to still include a batch term when modelling usages. The spectra are derrived from batch corrected counts. If using scVI to batch correct, the option `params.preprocess.scvi.denoise_tp10k` can save a batch corrected TPM matrix, but NMF spectra will only be available for the HVGs input into scVI. 

> IMPORTANT NOTE: The pipeline is reproducible, but steps in cNMF and pre-processing like scVI have stochastic component. By default, the config seeds are set (`params.cnmf.seed=42` and `params.preprocess.scvi.seed=314`), so you should get the same results, but you may want to change these seeds to evaluate the impact of the stochastic component. If set to `null` you will get a random seed selected for each step in the process. However, I would still reccomend setting the seeds explicitly, even if you manually generate a random number just to ensure reproducibility.


## General IO

Several example configurations are provided in `conf/examples`. A full list of parameters can be found in nextflow.config. 

The input is one more seurat and or h5ad files with raw counts in assays$RNA@counts for Seurat or for .h5ad in .X. The pipeline works with .h5ad so Seurat objects are first converted. Metadata is transferred through from @meta and .obs where possible. 

- Input:
  - manifest.tsv pointing to seurat.rds and or .h5ad with raw counts
  - params.config file setting parameters
  - Optional: .gmt files for geneset and summary statistics for gwas enrichment
- Output:
  - CNMF factors for each specified K
  - Formatted & merged .h5ad with counts 
  - Ensembl reference file and ID linkers
  - Optional Enrichments for each specified K
    - GSEA, ORA, Magma, DecoupleR
  - K-selection tree that shows how values of K correlate
  - Summary table for each value of K
  - GEP 'profile' plot showing spectra score distirbution and top20 genes, TFs and Cytokines (customizable, see assets folder)
  - Marker gene heatmap (customizable, defaults to a CD4 centric list, see assets folder)

## Output files

The output for the pipeline is organized into a couple of folders
```
├── cnmf
│   └── consensus > output of the cNMF consensus process, the intermediate cnmf outputs are not stages and just live in workdir for now (they are not very usefull)
├── h5ad
│   ├── cnmf > h5ad with HVGs with (optionally) harmony corrected counts
│   ├── scVI > h5ad with HVGs with scVI corrected 'counts'
│   ├── merged > Merged h5ad optionally gene name converted and subsetted to genes of interest
│   └── per_batch > Input converted to h5ad (if input is h5ad, this is just linked)
├── magma 
│   └── per_trait > per trais association results from magma
└── reference
    ├── ensembl > ensembl reference files
    └── magma > the magma reference files (pre-calculated gene scores for each trait, can be re-used between pipeline runs)
```

#### cnmf

This folder stores the output for the cNMF processes per value of k. The folders final and enrichments have merged versions over all K values if you want to contrast and compare. For more details on how to read the plots and what to look for, please see the page 'Understanding cNMF outputs'
```
└── consensus
    └── <rn_runname>
        ├── enrichments > Merged enrichment results for all K per database
        ├── final > Merged enrichment resuls for all K and all databases
        ├── k_<X>
        │   ├── enrichments > Enrichment results per database
        │   └── final > Enrichment results for all databases merged
        └── k_selection > files to aid in selecting optimal K value
```

So for example for k=18 the output might look like this. The output should be fairly self explanatory. A couple of key notes are that only the 'raw spectra' and 'starcat specta' are explicitly batch corrected, the usages and the 'spectra scores' are derrived from the 'raw spectra' and the TPM matrix which is not batch corrected. In other words, the programs that are learned should be batch invariant, but the usage is not expelicitly batch corrected and this might need to be taken into account for modelling. In practive we have found if there is a batch effect, it is learned in one program, but the others tend to remain unaffected, which is probably why it was done in this way. For a detailled breakdown on the nuances of the cNMF output please refer to:

- https://github.com/dylkot/cNMF
- https://github.com/dylkot/cNMF/issues/59#issuecomment-2099453595
- https://github.com/immunogenomics/starCAT/issues/5

```
.
├── enrichments
│   ├── k_18_collectri_activities.tsv.gz
│   ├── k_18_collectri_activity_matrix.tsv.gz
│   ├── k_18_collectri.enrich.gz
│   ├── k_18_fgsea_results.enrich.gz
│   ├── k_18_fgsea_results_top5.pdf
│   ├── k_18_fgsea_results_top5.tsv
│   ├── k_18_fgsea_results.tsv.gz
│   ├── k_18_merged_magma_results.enrich.gz
│   ├── k_18_merged_magma_results.tsv.gz
│   ├── k_18_ora_results.enrich.gz
│   ├── k_18_ora_results_top5.pdf
│   ├── k_18_ora_results_top5.tsv
│   ├── k_18_ora_results.tsv.gz
│   ├── k_18_pathways.pdf
│   ├── k_18_pathways_scaled.pdf
│   ├── k_18_progeny_activities.tsv.gz
│   ├── k_18_progeny_activity_matrix.tsv.gz
│   ├── k_18_progeny.enrich.gz
│   ├── k_18_signif_tfs.pdf
│   └── k_18_signif_tfs_scaled.pdf
├── final
│   ├── k_18_merged_nominal.tsv
│   └── k_18_merged.tsv.gz
├── immerse_pilot2_all_modalities_lrpprc_only.clustering.k_18.dt_0_1.png
├── immerse_pilot2_all_modalities_lrpprc_only.gene_spectra_score.k_18.dt_0_1.txt.gz
├── immerse_pilot2_all_modalities_lrpprc_only.gene_spectra_tpm.k_18.dt_0_1.txt.gz
├── immerse_pilot2_all_modalities_lrpprc_only.k_18.dt_0_1.h5ad
├── immerse_pilot2_all_modalities_lrpprc_only.spectra.k_18.dt_0_1.consensus.txt.gz
├── immerse_pilot2_all_modalities_lrpprc_only.starcat_spectra.k_18.dt_0_1.txt.gz
└── immerse_pilot2_all_modalities_lrpprc_only.usages.k_18.dt_0_1.consensus.txt.gz
```

#### H5ad

If enabbled (default), an h5ad file is created which has the usages as `X` and the spectra score as `.varm['spectra']`. The gene names for the spectra score can be found in `.uns['spectra_names']`. The `.obsm` contains the merged annotations from the original input for ease of use.


