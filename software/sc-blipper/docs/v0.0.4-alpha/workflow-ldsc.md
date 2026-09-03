⚠️ This wiki is currently being updated together with the dev branch, so migh not reflect usage for previous versions!

# Workflow: LDSC

## What it does

This workflow runs partitioned (stratified) LD score regression to test whether gene sets of interest are enriched for SNP heritability in one or more GWAS traits. For each combination of phenotype and gene set condition, it estimates the proportion of heritability captured by the annotation (`Prop._h2`) and a corresponding enrichment statistic.

1. Munge summary statistics into LDSC format (`munge_sumstats.py`)
2. Convert Ensembl reference to LDSC gene coordinate file
3. Standardise gene IDs in the input matrix via the pipeline id-linker
4. Optionally binarize a numeric gene matrix (select top N genes per condition)
5. Build (per-chromosome) annotation files and compute LD scores (`make_annot.py` + `ldsc.py --l2`)
6. Run partitioned LDSC for every phenotype × condition pair (`ldsc.py --h2`)
7. Aggregate all `.results` files into a single table, and split by annotation index

> IMPORTANT NOTE: The baseline model used is baselineLD_v2.2. Custom annotations are added on top of this model with `--overlap-annot`, so enrichment estimates account for overlap between your gene windows and the baseline annotations.

> NOTE: LD score computation can be parallelised across chromosomes by setting `ldsc.calculate_ldscores_per_chr=true` (the default). This submits one cluster job per chromosome per condition rather than running all 22 chromosomes sequentially in a single job.


## General IO

- Input:
  - Summary statistics manifest TSV (one row per GWAS trait, see format below. This is different from the magma manifest!)
  - Gene × condition matrix (binary 0/1 or numeric, one column per gene set to test)
  - LDSC reference folder (see layout below)
  - `params.config` file setting parameters
- Output:
  - `ldsc_results_aggregated.tsv` — all phenotype × condition results in one table
  - `ldsc_results_aggregated_annot0.tsv` / `ldsc_results_aggregated_annot1.tsv` — per-annotation-index splits of the aggregated table (annot0 = baseline categories, annot1 = your custom annotations)
  - Per-phenotype × condition `.results` files
  - Per-condition annotation directories with `.annot.gz` and `.l2.ldscore.gz` files
  - Munged summary statistics (`.sumstats.gz`)

## Input formats

### Summary statistics manifest

A tab-separated file with one row per GWAS trait. Required columns:

| Column | Description |
|---|---|
| `name` | Unique phenotype identifier (used in output filenames) |
| `path` | Path to the raw summary statistics file (`.gz` or plain) |
| `variant_col` | Column name for the SNP / variant ID (default: `SNP`) |
| `effect_allele_col` | Column name for the effect allele A1 (default: `A1`) |
| `other_allele_col` | Column name for the other allele A2 (default: `A2`) |
| `sign_col` | Column name for the signed statistic (beta, OR, or Z); set `NA` if absent |
| `sign_null` | Null value for the signed statistic: `0` for beta/Z, `1` for OR; set `NA` if absent |
| `p_col` | Column name for the p-value |
| `n` | Fixed total sample size; ignored if both `n_case` and `n_control` are set |
| `n_case` | Fixed N cases; use `NA` if not a case/control study |
| `n_control` | Fixed N controls; use `NA` if not a case/control study |

### Gene matrix

A tab-separated file with genes as rows and conditions as columns. The first column contains gene identifiers. Two modes are supported:

- **Binary matrix** (`ldsc.binarize_top=null`, the default): values must be 0 or 1; 1 = gene is in the set.
- **Numeric matrix** (`ldsc.binarize_top=<N>`): any numeric scores; the top N genes per column are selected as the gene set. Use `ldsc.binarize_absolute=true` to rank by absolute value (useful for signed LFCs), and `ldsc.binarize_ascending=true` to select the lowest scores instead.

Gene identifiers must match the namespace set by `convert.output_namespace` (`gene_name` or `ensembl`). The pipeline applies the same id-linker conversion used by the other workflows.

### Reference folder layout

```
<reference_dir>/
├── hapmap3/
│   ├── w_hm3.snplist          – HapMap3 SNP list for munge_sumstats
│   └── hm3_no_MHC.list        – SNP IDs for LD score computation (MHC excluded)
├── plink/
│   └── <plink_prefix>{1..22}.{bed,bim,fam}
├── baselineLD_v2.2/
│   └── baselineLD.{1..22}.{annot.gz,l2.ldscore.gz,l2.M,l2.M_5_50}
├── weights/
│   └── weights.hm3_noMHC.{1..22}.l2.ldscore.gz
└── frq/
    └── <frq_prefix>{1..22}.frq
```

The default plink prefix is `1000G.EUR.hg38.` and the default frq prefix is `1000G.EUR.QC.`. These can be changed with `ldsc.plink_prefix` and `ldsc.frq_prefix`. Any individual path can also be overridden directly — see the settings section below.

See /software/teamtrynka/installs/sc-blipper-dev/prepare_ldsc_reference.md for more details on how to construct the reference.

## Output files

```
<rn_publish_dir>/ldsc/<rn_runname>/
├── annotations/
│   └── <condition_name>/       – per-chromosome .annot.gz and .l2.ldscore.gz files
├── results/
│   └── <phenotype>__<condition>.results
└── ldsc_results_aggregated.tsv
    ldsc_results_aggregated_annot0.tsv
    ldsc_results_aggregated_annot1.tsv
```

The aggregated table has the following key columns prepended to the standard LDSC `.results` output:

| Column | Description |
|---|---|
| `phenotype` | Trait name from the manifest `name` column |
| `condition` | Gene set condition (column name from the gene matrix) |
| `window_size` | Gene body window size in bp used to build the annotation |
| `binarize_top` | Number of top genes selected per condition (`null` if input was already binary) |
| `Category` | LDSC annotation category (e.g. `<condition>L2_1` for your custom annotation) |
| `Prop._h2` | Proportion of SNP heritability captured by this annotation |
| `Enrichment` | Fold-enrichment relative to annotation size |
| `Enrichment_p` | P-value for enrichment |
| `Coefficient` | Regression coefficient (contribution independent of other annotations) |

The per-annotation splits (`annot0`, `annot1`) separate the baseline model categories (suffix `_0`) from your custom annotation categories (suffix `_1`), making it straightforward to focus on your gene sets.


## Settings

### Required
> The input matrix can be pre-processed (gene name/id conversion, transposing from condition x gene to gene x condition, subset to biotype) in the same manner as the other pipeline workflows.
```
enrich {
    input_matrix      = "/path/to/genes_x_conditions.tsv"
}

ldsc {
    manifest_sumstats = "/path/to/manifest.tsv"
    reference_dir     = "/path/to/ldsc_reference/"
}
```

### Gene window and LD score computation

```
ldsc {
    window_size               = 100    // gene body window in bp for make_annot.py
    ld_wind_cm                = 1      // LD window in cM for --l2
    calculate_ldscores_per_chr = true  // one cluster job per chromosome (recommended)
}
```

`window_size` also accepts a list of values to run the workflow across multiple window sizes in one go:

```
ldsc {
    window_size = [50, 100, 200]   // runs once per window size
}
```

### Binarizing a numeric matrix

If your gene matrix contains scores rather than 0/1 values, set `binarize_top` to select the top N genes per condition:

```
ldsc {
    binarize_top       = 500   // select top 500 genes per condition
    binarize_absolute  = true  // rank by |score| (useful for signed LFCs)
    binarize_ascending = false // set true to select lowest scores instead
}
```

`binarize_top` also accepts a list to sweep over multiple cutoffs in one run:

```
ldsc {
    binarize_top = [100, 250, 500]   // runs once per cutoff
}
```

### Reference path overrides

By default all reference paths are derived from `reference_dir`. Individual paths can be overridden if your reference folder uses a non-standard layout:

```
ldsc {
    plink_prefix    = "1000G.EUR.hg38."   // filename prefix for plink files
    frq_prefix      = "1000G.EUR.QC."     // filename prefix for frq files

    // Full path overrides (null = derived from reference_dir)
    plink_dir       = null   // full prefix up to chromosome number for plink files
    hm3_no_mhc      = null   // path to hm3_no_MHC.list
    w_hm3_snplist   = null   // path to w_hm3.snplist
    baseline_ld_chr = null   // chr-split prefix for baselineLD (--ref-ld-chr)
    weights_chr     = null   // chr-split prefix for weights (--w-ld-chr)
    frq_chr         = null   // chr-split prefix for frq files (--frqfile-chr)
}
```

### Resource labels

```
ldsc {
    label      = "normal"       // munge_sumstats and aggregation
    label_high = "normal_plus"  // annotation building and LD score computation
    label_run  = "medium"       // partitioned LDSC (~20 GB for baselineLD_v2.2)
}
```

### Conda environment

The workflow requires a Python 3.9 LDSC environment, see install instructions on how to set it up.
Alternatively you can also use a singularity container

```
ldsc {
    conda = "/path/to/ldsc-conda-env"
    container = null
}
```
or

```
ldsc {
    conda = null
    container = "/path/to/ldsc-container"
}
```
