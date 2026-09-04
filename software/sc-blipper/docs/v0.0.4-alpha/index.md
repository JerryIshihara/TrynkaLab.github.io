---
title: Trynka Lab
titleSuffix: '| sc-blipper'
---

Welcome to the sc-blipper wiki!

sc-blipper is a Nextflow pipeline for post-QC analysis of (single cell) RNAseq data optimized for HPC enviroments. The core features include running consensus non-negative matrix factorization (cnmf), preprocessing (gene id/gene name/format conversion, merging), batch correction (harmony (cnmf adaptation), scvi) and gene set enrichment (fgsea, ora) and enrichment of GWAS signals through MAGMA. For enrichment, it comes bundled with common genesets for humans.  

The pipeline is highly configurable, but defaults are designed to work out of the box for datasets of 50-100k cells. Larger objects are possible, but you will need to tweak the resource 'label' arguments for each process to allow for more memory. While the pipeline is easy to run with no real Nextflow experiance, instalattion may require some tweaking depending on your HPC configuration. There is a guide for instalation on this wiki. Currently we do not offer singularity containers, but this is on the todo list which should help greatly with portability. 

⚠️ This wiki is currently being updated together with the dev branch, so migh not reflect usage for previous versions!
