# Setting up gitlab runner in kubernetes

I spent time to configure gitlab runners in kubernetes. Until now we had runners on EC2 which worked well. However,
it was bugging me that those ec2 instances were under utilze. I wanted to configure gitlab runners in kubernetes to ensure that we are not wasting
resources. Gitlab already have extensive documentation on the topic, mainly I will refer to pointers in gitlab documentation.

## Add kubernetes cluster to gitlab.

This is straight forward and gitlab has a detailed documentation, When you are adding an existing cluster ![Cluster](/img/cluster.png)
Use "More Information" link to get more information on the topic. This [gitlab kubernetes documentation](https://gitlab.com/help/user/project/clusters/index.md#adding-an-existing-kubernetes-cluster) has additional information.

## Add gitlab runners in kubernetes.

As shown in [here](https://docs.gitlab.com/runner/install/kubernetes.html), you will need `gitlab url` and `runner registration token`. Also, you need `helm` configured on the system. `helm` uses `values.yaml` to pass configuration options to gitlab runners. A `values.yaml` exapmle is available in above document, also you can download from [here](https://gitlab.com/charts/gitlab-runner/blob/master/values.yaml). After download, uncomment `gitlabUrl` and `runnerRegistrationToken` to add your values. Please read above document to find out information on other configuration options. After modifying `values.yaml` run following commands.

```
helm init
helm install --namespace gitlab-managed-apps --name gitlab-runner -f values.yaml gitlab/gitlab-runner
```

after this step, you can see kubernetes runner appear in `Settings -> CI/CD -> Runners` section.

