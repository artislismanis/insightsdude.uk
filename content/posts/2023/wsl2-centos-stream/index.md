---
title: "WSL2: CentOS Stream Image Prep"
date: 2023-01-30T00:00:20
draft: false
categories:
  - "Development"
tags:
  - "howto"
  - "WSL"
asciinema: true
customCSS:  
  - "/css/asciinema-player.css"
customJS: 
  - "/js/asciinema-player.js"
toc: false
---

This is a companion article to [WSL2: Roll Your Own]({{< ref "/posts/2023/wsl2-roll-your-own" >}} "WSL2: Roll Your Own") and describes how to repackage CentOS Stream cloud image to create WSL compatible distribution. This tutorial assumes you have an existing WSL environment available help you repackage original distribution.

<!--more-->

See the terminal session recording below for end to end overview of the steps. You start by downloading latest build of CentOS Stream cloud image, extract the root file system and finish by cleaning up. Steps in this tutorial have been completed in Ubuntu based WSL environment (comes as a default environment in WSL) but should work on any Debian based system.

{{< asciinema key="wsl-centos" rows="30" cols="100" preload="1" >}}

Check that you have the required tools installed.

```bash
# We will need xz-utils to extract tar.xz files
sudo apt-get -y update && sudo apt-get -y install xz-utils  
```

The CentOS Stream cloud images can be downloaded from [https://cloud.centos.org/centos/](https://cloud.centos.org/centos/). This example uses the latest build of CentOS Stream 9. As with other distributions CentOS offers several different builds supporting multiple cloud providers and environments. I've chosen very minimalistic and lightweight Container Base flavour.

Start by downloading the image.

```bash
# Download the latest build of CentOS Stream 9 Container Base cloud image
wget --quiet https://cloud.centos.org/centos/9-stream/x86_64/images/CentOS-Stream-Container-Base-9-20230123.0.x86_64.tar.xz
```

Once the cloud image has been downloaded you can extract the root file system and repackage it for WSL. There is no strict requirement to GZIP the resulting tar file, but it reduces the storage requirements.

CentOS Stream 9 Container Base uses [Docker image tarball format](https://github.com/moby/moby/tree/master/image/spec). We need to locate layer.tar file which contains filesystem changeset for an image layer and in this case it will contain full CentOS Stream root file system.

```bash
# Check the contents of the downloaded file
tar -tvf CentOS-Stream-Container-Base-9-20230123.0.x86_64.tar.xz

# We only want to extract layer.tar
# Let's also rename it to CentOS-Stream-Container-Base-9.tar 
tar -xf CentOS-Stream-Container-Base-9-20230123.0.x86_64.tar.xz \
--no-anchored  --strip-components 1 \
--transform='flags=r;s|layer.tar|CentOS-Stream-Container-Base-9.tar|' layer.tar

# Compress the tar file into tar.gz
gzip --best CentOS-Stream-Container-Base-9.tar
```

Now you can move your CentOS distribution file to C:/WSL/images on the host system to store it alongside all other custom WSL starter images.

```bash
# Move the tarball to C:/WSL/images
mv -v ./CentOS-Stream-Container-Base-9.tar.gz /mnt/c/WSL/images/
```

Once above steps have been successfully completed you can clean up. In this case it means simply removing your file downloads to ensure you don't have any stray files knocking about in your existing WSL environments.

```bash
# Clean up while we are here
rm CentOS-Stream-Container-Base-9-20230123.0.x86_64.tar.xz
```

You can now import the tarball we created using the `wsl --import` command and configure as needed. For more info head back to [WSL2: Roll Your Own]({{< ref "/posts/2023/wsl2-roll-your-own/index.md#create-wsl-environment" >}} "WSL2: Roll Your Own").
