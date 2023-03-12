# Install Ansible on Alpine Linux


Getting current ansible on a linux usually a easy task, can be done with ```pip```.

```
pip install ansible
```

With Alpine I had to struggle a bit as it was missing some dependencies. After adding
dependencies I could install Ansible via ```pip```.

```
apk update && apk add --no-cache musl-dev libffi-dev openssl-dev make gcc python py2-pip python-dev
pip install cffi
pip install ansible
```
