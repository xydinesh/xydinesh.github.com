# Terraform Community Modules - AWS VPC


## Terraform Community Modules - AWS VPC

Terraform community has created modules and shared via Terraform community modules.
I found them useful as I don’t have to write modules myself for common tasks.
One such a task is creating VPC’s in AWS. See [terraform-aws-vpc](https://github.com/terraform-aws-modules/terraform-aws-vpc).
I decided to use Terraform AWS VPC modules for creating a VPC for my current project.
It was straight forward, I used it and confirmed that it worked as expected.

```
module "vpc" {
  source         = "terraform-aws-modules/vpc/aws"
  name           = "test-vpc"
  cidr           = "10.0.0.0/22"
  azs            = ["us-west-2a", "us-west-2b", "us-west-2c"]
  public_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]

  tags = {
    Terraform = "true"
    Environment = "dev"
  }
}
```

## Problem

I had one issue after I created an EC2 instance on that VPC. I logged into EC2 instance with public IP. 
I couldn’t connect or ping any external services. I checked and verified following but couldn’t find anything wrong with those. 

1. Security group outbound rules
2. Routing tables and routes.
3. NAT gateways (does not applicable as I was on a public subnet)

It was clear to me that something was wrong with DNS. Whenever I put 8.8.8.8 to /etc/resolve.conf everything worked fine. 
After reading in VPC documentation, I found the culprit.

[http://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/vpc-dns.html#vpc-dns-support](http://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/vpc-dns.html#vpc-dns-support)
![vpc-dns]({{site.base_url}}/assets/vpc_dns.png)
I was missing ```enable_dns_support = true``` from my VPC configuration.

```
module "vpc" {
  source             = "terraform-aws-modules/vpc/aws"
  name               = "test-vpc"
  cidr               = "10.0.0.0/22"
  azs                = ["us-west-2a", "us-west-2b", "us-west-2c"]
  public_subnets     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  enable_dns_support = true
  tags = {
    Terraform = "true"
    Environment = "dev"
  }
}
```

May be it make sense to set this value ```true``` as default value in the community module.
