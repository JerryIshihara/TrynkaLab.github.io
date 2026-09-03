⚠️ This wiki is currently being updated together with the dev branch, so migh not reflect usage for previous versions!

# Installing (Sanger farm22)
Add the following to your .bashrc
```bash
# Set default LSF group, important for NF to work, change for your group here
export LSB_DEFAULTGROUP=teamtrynka

# Make conda available
module load ISG/conda

# Add the blipper executable to the path
export PATH="$PATH:/software/teamtrynka/installs/sc-blipper/"
```

Then 
```bash
source ~/.bashrc
```
And thats it, you are good to go!

# Installing (other configurations)

In short, these are the steps for installing the pipeline on an HPC cluster. While I strongly recommend running on an HPC, if you have a single good machine, you can use the profile 'local' to run the pipeline locally.


## Brief overview of the install process

1. Make sure you have nextflow (>=25.04.6) and conda available on your path
2. Clone the repo
3. Create a conda envs following the instructions below (needs some manual pacakges, future will add singularity containers)
4. Update `nextflow.config` or override with your config the path to the conda env (`params.rn_conda=/path/to/env"`)
5. Add a profile to work with your cluster configuration (can be put in './conf' folder). Also check if any enviroment variables need to be set for your scheduler, and if you need to update the process labels (particularly for the GPU process).
6. Add the new profile to the `nextflow.config` `profiles{}` block
7. (optional) Update the runner script `sc-blipper` as the primary entry point (By default works with LSF, easy to update to SLURM)
8. (optional) Add the runner script `sc-blipper` to your path

## Creating the conda enviroments (required)

Change into the repository root and create and activate conda environment
```bash
conda env create -f environment.yml
conda activate sc-blipper
```

> Note: If you want to give the env a different name: `conda env create -f environment.yml -n my_env`

Note down the install path for the conda env, we will need it later for configuring the pipeline
```bash
echo $CONDA_PREFIX  # On Unix/Linux/macOS
```

Exit conda env
```bash
conda deactivate
```

### I cannot use conda, now what?
You may be able to create a singularity/apptainer container based on the conda enviroment, As of writing I have not tested
this. Some resources below:
- https://arcdocs.leeds.ac.uk/arc3-arc4/usage/conda-containers.html
- https://stackoverflow.com/questions/76146763/create-apptainer-container-with-environment-yml-without-creating-a-new-conda-env
- https://csc-training.github.io/csc-env-eff/hands-on/singularity/singularity_extra_replicating-conda.html

Once you have your containers, you can set the parameters 

```
params.rn_container="/path/to/container"
params.scvi.container="/path/to/container-scvi"
```

Also make sure to tell nextflow to use your container engine of choice, example for singularity:
```
conda.enabled = false
singularity.enabled = true
```

More details: https://www.nextflow.io/docs/latest/container.html#singularity


### Install scVI (optional)
We will make a new enviroment for scVI to avoid conflicts and keep scVI optional so the pipeline is lighter
You will ideally need a GPU for scVI to run
```bash
conda env create -f environment_scvi.yml
conda activate sc-blipper-scvi 
```

Note down the install path for the conda env, we will need it later for configuring the pipeline
```bash
echo $CONDA_PREFIX  # On Unix/Linux/macOS
```

At this point I strongly recommend testing GPU is working. If on HPC, make sure to request a GPU node
You can test by running python and typing:
```python
import torch
print(torch.cuda.is_available()) # Should return True
import jax
print(jax.devices()) # Should show GPU devices
```

Exit conda env
```bash
conda deactivate
```

#### If this doesn't work

Remove the conda enviroment you just created
```bash
conda remove -n sc-blipper-scvi --all
```

Manually create a new one
```bash
conda create -n sc-blipper-scvi python==3.10
conda activate sc-blipper-scvi
```

Follow instructions here: https://docs.scvi-tools.org/en/1.0.0/installation.html
Install Pytorch, JAX, they might need to be tweaked depending on your system and GPU
Pytorch: https://pytorch.org/get-started/locally/
JAX: https://docs.jax.dev/en/latest/installation.html#installation

Cuda 12 on linux, make sure the CUDA version matches your GPU drivers
```bash
pip3 install torch torchvision
pip3 install -U "jax[cuda12]"
pip install scvi-tools scikit-misc ipython
```


### Install LDSC (optional)

To be able to run the LDSC workflow, we will need a seperate enviroment with the python 3.9 version of LDSC. We have created a fork as there were a couple of bugs preventing it from running. 

In future, will see if this can be integrated this into the main enviroment.yml
```bash
conda create -n sc-blipper-ldsc python=3.9 bedtools
conda activate sc-blipper-ldsc

pip install git+https://github.com/TrynkaLab/ldsc
```

Note down the install path for the conda env, we will need it later for configuring the pipeline
```bash
echo $CONDA_PREFIX  # On Unix/Linux/macOS
```



## Updating the conda path

Next, you want to take the two conda paths you noted down and set `params.rn_conda="</path/to/first/env>"` and `params.preprocess.scvi.conda="</path/to/scvi-env>"` and `params.ldsc.conda=</path/to/conda/env>`. You can do this either in the main nextflow.config (this will ensure everybody who uses the install doesn't need to override it), or in your run config file.


## Updating profile & process definitions

Not all HPC configurations are the same, to be able to use them, you may need to update the process defintions. Process requirements are handled in the pipeline through labels. A full list can be found in [conf/processes.config](https://github.com/TrynkaLab/sc-blipper/tree/main/conf/processes.config). Its likely you will need to update the 'queue' arguments to match your HPC config and the 'clusterOptions' for the GPU tags. Updating the GPU process is only needed if you are using scVI.

There are two three you can do this:
1. Update the `conf/processes.config` directly
2. Override the 'conf/processes.config' by adding a 'process {}' block to your runs config file
3. Override the 'conf/processes.config' by creating a new config file and including (sourcing) it  in your runs config file
 
You can find Nextflow profile configurations for most major research institutes here: https://nf-co.re/configs/
See more details on configuration of Nextflow here: https://www.nextflow.io/docs/latest/config.html

To add a profile to the pipeline you save the file in the `conf` folder, for instance 'conf/my_profile.config'. You can then add a `profiles{}` block to your run config (or add my_profile to the main `nextflow.config`).

```
profile {
    my_profile { includeConfig 'conf/my_profile.config' }
}
```


## Updating the sc-blipper script (optional)

The script sc-blipper is a utility script with some sanity checking, log management and job submission. It is fully optional and you can run the pipeline through Nextflow directly as well. However, if you configure this and put it on your PATH, it makes future job submissions a breeze. 

The bits you need to configure are at the start and end of the script, tagged by and anotated with inline comments.
```
#-----------------------------------------------------------------------
#                 Update these for your installation
#-----------------------------------------------------------------------
```

To use the script, you will need to update it to:

1. Update sourcing of nextflow "module load HGI/common/nextflow/25.04.6"
2. Point to the path of the main.nf file in this repo
3. Update any enviroment variables like NXF_SINGULARITY_CACHEDIR
3. Update the submit command if you don't have the LSF scheduler but something else replace the submit command for your scheduler at 'CMD="bsub -n 1 \'









