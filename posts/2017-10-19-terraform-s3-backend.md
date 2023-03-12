# Terraform S3 backend

I've worked in projects that used terraform remote state in the past. Since I've been using terraform lately, decided
to configure remote state for terraform. I'm using terraform 0.10.7, however

```
terraform remote config
```

is not available in terraform anymore. After going through documentation and github issues for few hours figured that terraform
removed ```remote config``` from 0.9 and introduced ```backends``` instead. A document on [Backend and Legacy Remote State](https://www.terraform.io/docs/backends/legacy-0-8.html) has more information.
Also, a detailed documentation on backend configuration is available at [Backend Configuration](https://www.terraform.io/docs/backends/config.html).
Below I discuss approach I took as an example.

My current directory structure,

```
-rw-r--r--   1 xydinesh  staff   2.4K Oct 19 16:01 main.tf
drwxr-xr-x   6 xydinesh  staff   204B Oct 16 11:03 modules
drwxr-xr-x   4 xydinesh  staff   136B Oct 13 17:35 scripts
drwxr-xr-x   4 xydinesh  staff   136B Oct 16 15:16 task-definitions
-rw-r--r--   1 xydinesh  staff   1.4K Oct 19 15:05 terraform.tfstate
-rw-r--r--   1 xydinesh  staff    60K Oct 19 15:03 terraform.tfstate.backup
drwxr-xr-x   3 xydinesh  staff   102B Oct 19 15:02 terraform.tfstate.d
-rw-r--r--   1 xydinesh  staff    21B Oct 19 16:00 terraform.tfvars
-rw-r--r--   1 xydinesh  staff   109B Oct 19 16:01 variables.tf
```

In order to configure terraform to use ```backend``` (S3). I created two files, ```backend.tf``` and ```backend.config```.

### backend.tf
```
terraform {
    backend "s3" {}
}

```

### backend.config
```
bucket      = "terraform-state-bucket"
key         = "osrm-cluster/v1/terraform.tfstate"
region      = "us-east-1"
encrypt     = true
```

These two files along with ```fabfile.py``` added at the top level of the directory.

```
-rw-r--r--@  1 xydinesh  staff   142B Oct 19 15:45 backend.config
-rw-r--r--@  1 xydinesh  staff    33B Oct 19 15:43 backend.tf
-rw-r--r--@  1 xydinesh  staff   113B Oct 19 15:47 fabfile.py
-rw-r--r--   1 xydinesh  staff   2.4K Oct 19 16:01 main.tf
drwxr-xr-x   6 xydinesh  staff   204B Oct 16 11:03 modules
drwxr-xr-x   4 xydinesh  staff   136B Oct 13 17:35 scripts
drwxr-xr-x   4 xydinesh  staff   136B Oct 16 15:16 task-definitions
-rw-r--r--   1 xydinesh  staff   1.4K Oct 19 15:05 terraform.tfstate
-rw-r--r--   1 xydinesh  staff    60K Oct 19 15:03 terraform.tfstate.backup
drwxr-xr-x   3 xydinesh  staff   102B Oct 19 15:02 terraform.tfstate.d
-rw-r--r--   1 xydinesh  staff    21B Oct 19 16:00 terraform.tfvars
-rw-r--r--   1 xydinesh  staff   109B Oct 19 16:01 variables.tf
```

and then I called ```init``` command,

```
terraform init -backend -backend-config=backend.config
```

It asked me few questions on syncing local state to remote state. This was all the changes I needed to setup terraform backend.
After this I was able to use ```terraform workspace``` with remote backend. If you haven't used workspaces yet, I recommend you to take look.

## References
1. [terraform-13552](https://github.com/hashicorp/terraform/issues/13552)
2. [terraform-15358](https://github.com/hashicorp/terraform/issues/15358)
3. [S3 backend](https://www.terraform.io/docs/backends/types/s3.html)
4. [Stackoverflow-42886251](https://stackoverflow.com/questions/42886251/migrating-from-remote-state-to-backend-in-terraform-0-9)
