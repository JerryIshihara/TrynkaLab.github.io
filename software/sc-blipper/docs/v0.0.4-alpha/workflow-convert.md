⚠️ This wiki is currently being updated together with the dev branch, so migh not reflect usage for previous versions!

# Workflow: Convert

## What it does
Takes one or more seurat or h5ad files, optionally coverts gene names or ids and optionally run harmony batch correction.


## General IO
- Input:
 - manifest.tsv pointing to seurat.rds and or .h5ad with raw counts
 - params.config file setting parameters
- Output:
  - Merged, id converted h5ad
  - Optionally harmony corrected counts using the same process as described for cNMF
