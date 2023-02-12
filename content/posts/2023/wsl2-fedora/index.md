---
title: "WSL2: Fedora Image Prep"
date: 2023-01-30T00:00:30
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

This is a companion article to [WSL2: Roll Your Own]({{< ref "/posts/2023/wsl2-roll-your-own" >}} "WSL2: Roll Your Own") and describes how to repackage Debian cloud image to create WSL compatible distribution. This tutorial assumes you have an existing WSL environment available help you repackage original distribution.

<!--more-->

See the terminal session recording below for end to end overview of the steps. You start by downloading latest build of Fedora cloud image, then extract it, mount it as a drive, export the root file system as tarball, and finish by cleaning up. Steps in this tutorial have been completed in Ubuntu based WSL environment (comes as a default environment) but should work on any Debian based system.

{{< asciinema key="wsl-fedora" rows="30" cols="100" preload="1" >}}

Check that you have the required tools installed.

```bash
# We will need fdisk for checking partition details
# and xz-utils to support extracting tar.xz files
sudo apt-get -y update && sudo apt-get -y install fdisk xz-utils  
```

Fedora cloud images can be downloaded from [https://alt.fedoraproject.org/en/cloud/](https://alt.fedoraproject.org/en/cloud/). There are multiple builds available to support different cloud providers and environments. This how-to uses Cloud Base compressed raw image.

```bash
# Download the latest build of Fedora 37 Cloud Base image
wget --quiet https://download.fedoraproject.org/pub/fedora/linux/releases/37/Cloud/x86_64/images/Fedora-Cloud-Base-37-1.7.x86_64.raw.xz
```

Once the cloud image has been downloaded you can extract the archive.

```bash
# Check the contents of the downloaded file
xz -l Fedora-Cloud-Base-37-1.7.x86_64.raw.xz

# Extract the archive, the original archive will be removed
unxz Fedora-Cloud-Base-37-1.7.x86_64.raw.xz
```

The current Fedora raw image packaging approach gives a single file `Fedora-Cloud-Base-37-1.7.x86_64.raw` which is an image of a multi-partition hard drive.

A generic approach is to have a partition scheme where you have a separate root, boot and EFI partitions which then get mounted to the following paths in the root file system:

```plaintext
root --> \
boot --> \boot
EFI  --> \boot\efi
```

This varies from distribution to distribution, however, and sometimes you can have the complete root file system packaged in a single partition or only EFI partition being made separate. Where separate partitions for boot or EFI are used above approach for mapping these to file system location still applies. Some partitioning schemes also contain a BIOS partition, but this can be ignored for the purpose of creating WSL compatible distribution image.

You can usually find the partitioning scheme used by looking at distribution build files. Fedora kickstart files can be found on Fedora code hosting system:  [https://pagure.io/fedora-kickstarts](https://pagure.io/fedora-kickstarts). The `fedora-cloud-base.ks` kickstart file specifies partitioning approach shown below.

```plaintext
# Configure for gpt with bios+uefi
clearpart --all --initlabel --disklabel=gpt

# We can ignore BIOS partitions as they are not mounted
part prepboot  --size=4    --fstype=prepboot
part biosboot  --size=1    --fstype=biosboot

# EFI partition is sized at 100MB and mounted under /boot/efi
part /boot/efi --size=100  --fstype=efi

# Boot partition is sized at ~1GB and mounted under /boot
part /boot     --size=1000  --fstype=ext4 --label=boot

# Root file systems and home are set up as sub-volumes on the main partition
# The initial size is set to ~2GB but is allowed to grow as needed 
part btrfs.007 --size=2000 --fstype=btrfs --grow
btrfs none --label=fedora btrfs.007
btrfs /home --subvol --name=home LABEL=fedora
btrfs /     --subvol --name=root LABEL=fedora
```

Let's mount `Fedora-Cloud-Base-37-1.7.x86_64.raw` as a drive and explore it's partitions.

```bash
# Attach disk.raw to the next available loop device 
# and create device nodes for all specified partitions 
sudo losetup -f -P ./Fedora-Cloud-Base-37-1.7.x86_64.raw   

# Check which loop device disk.raw is attached to
# In my Ubuntu WSL environment this is /dev/loop0
sudo losetup -l  

# List partition details for /de/loop0 device
sudo fdisk -l /dev/loop0     
```

`Fedora-Cloud-Base-37-1.7.x86_64.raw` reflects the specification in the build kickstart file with the main partition almost doubling in size from initial 2GB to around 4GB.

```bash
Disk /dev/loop0: 5 GiB, 5368709120 bytes, 10485760 sectors
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: gpt
Disk identifier: CE202B35-1671-4520-BFBB-0CA31828411D

Device         Start      End Sectors  Size Type
/dev/loop0p1    2048     4095    2048    1M BIOS boot
/dev/loop0p2    4096  2052095 2048000 1000M Linux filesystem
/dev/loop0p3 2052096  2256895  204800  100M EFI System
/dev/loop0p4 2256896  2265087    8192    4M PowerPC PReP boot
/dev/loop0p5 2265088 10483711 8218624  3.9G Linux filesystem
```

Let's mount the root file system and attach both boot and EFI partitions under /boot and /boot/efi respectively.

```bash
# Create folder for mounting your cloud image partitions
# Destination and naming choices somewhat arbitrary
sudo mkdir -p /media/cloudimage

# Mount the main partition directly under the folder we created
sudo mount /dev/loop0p5  /media/cloudimage

# The main partition is split into two sub-volumes: home and root
# This is reflected through folder structure with root file system 
# placed in root subfolder
ls /media/cloudimage

# Mount boot partition under /boot in this structure
sudo mount /dev/loop0p2 /media/cloudimage/root/boot

# Mount EFI under /boot/efi in this structure
sudo mount /dev/loop0p3 /media/cloudimage/root/boot/efi

# Have a quick peek at the folder structure
# Should look like standard Linux file system layout
cd /media/cloudimage/root
ls
```

Let's export this this filesystem as a tarball and move it to C:/WSL/images on the host system to store it alongside all other custom WSL starter images.

```bash
# Create tarball from the mounted Debian file system
# This assumes your current directory is /media/cloudimage/root
# and will create tarball in /media
sudo tar -czf ../../fedora-cloud-37.tar.gz . 

# Move the tarball to C:/WSL/images
sudo mv -v /media/fedora-cloud-37.tar.gz /mnt/c/WSL/images/
```

Once above steps have been successfully completed you can clean up, remove your mounts working backwards, detach loop device and remove downloaded files. Mounts and loop devices will be reset when you restart your WSL environment so you don't need to worry about these too much, but probably a good idea to tidy up your file downloads as these can quickly add up.

```bash
# Switch back to home folder
cd ~                                                       

# Unmount partitions in reverse order to avoid errors
sudo umount /dev/loop0p3                                                   
sudo umount /dev/loop0p2                                                   
sudo umount /dev/loop0p5                                                   

# Detach loop device
sudo losetup --detach /dev/loop0

# Remove downloaded files
rm disk.raw
rm Fedora-Cloud-Base-37-1.7.x86_64.raw  
```

You can now import the tarball we created using the `wsl --import` command and configure as needed. For more info head back to [WSL2: Roll Your Own]({{< ref "/posts/2023/wsl2-roll-your-own/index.md#create-wsl-environment" >}} "WSL2: Roll Your Own").

You can use approach similar to that described in [WSL2: CentOS Stream Image Prep]({{< ref "/posts/2023/wsl2-centos-stream/index.md" >}} "WSL2: CentOS Stream Image Prep") if you source a slightly more hidden Fedora Container Base image which uses Docker image tarball format instead of raw disk image: [https://koji.fedoraproject.org/koji/packageinfo?packageID=26387](https://koji.fedoraproject.org/koji/packageinfo?packageID=26387).

This post was inspired by the Developer Monkey's [Install Fedora 36 from RAW disk image on WSL – for free – by using WSL](https://develmonk.com/2022/07/29/install-fedora-36-on-wsl-for-free/) article.
