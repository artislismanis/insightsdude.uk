---
title: "WSL2: Debian Image Prep"
date: 2023-02-12T00:00:10
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

See the terminal session recording below for end-to-end overview of the steps. You start by downloading latest build of Debian cloud image, then extract it, mount it as a drive, export the root file system as tarball, and finish by cleaning up. Steps in this tutorial have been completed in Ubuntu based WSL environment (comes as a default environment) but should work on any Debian based system.

{{< asciinema key="wsl-debian" rows="30" cols="100" preload="1" >}}

Check that you have the required tools installed.

```bash
# We will need fdisk for checking partition details
# and xz-utils to support extracting tar.xz files
sudo apt-get -y update && sudo apt-get -y install fdisk xz-utils  
```

Debian cloud images can be downloaded from [https://cloud.debian.org/images/cloud/](https://cloud.debian.org/images/cloud/). There are multiple builds available to support different cloud providers and environments. This how-to uses nocloud flavour as it allows passwordless root login and is well suited for WSL applications.

```bash
# Download the latest build of Debian 11 Bullseye cloud image
wget --quiet https://cloud.debian.org/images/cloud/bullseye/latest/debian-11-nocloud-amd64.tar.xz
```

Once the cloud image has been downloaded you can check and extract the archive.

```bash
# Check the contents of the downloaded file
tar -tvf debian-11-nocloud-amd64.tar.xz  

# Extract the archive
tar -xf debian-11-nocloud-amd64.tar.xz 
```

The current Debian packaging approach gives a single file `disk.raw` which is an image of a multi-partition hard drive.

A generic approach is to have a partition scheme where you have a separate root, boot and EFI partitions which then get mounted to the following paths in the root file system:

```plaintext
root --> \
boot --> \boot
EFI  --> \boot\efi
```

This varies from distribution to distribution, however, and sometimes you can have the complete root file system packaged in a single partition or only EFI partition being made separate. Where separate partitions for boot or EFI are used above approach for mapping these to file system location still applies. Some partitioning schemes also contain a BIOS partition, but this can be ignored for the purpose of creating WSL compatible distribution image.

You can usually find the partitioning scheme used by looking at distribution build files. Debian Cloud Image build scripts can be found on Debian GitLab instance:  [https://salsa.debian.org/cloud-team/debian-cloud-images](https://salsa.debian.org/cloud-team/debian-cloud-images). The `config_space > bullseye > hooks > partition.GRUB_CLOUD_AMD64` file specifies partitioning approach shown below.

```plaintext
# Size specified in sectors
# BIOS boot
p14 : start=2048, size=6144, type=21686148-6449-6E6F-744E-656564454649
# EFI system
p15 : start=8192, size=253952, type=C12A7328-F81F-11D2-BA4B-00A0C93EC93B
# Linux
p1 : start=262144, type=0FC63DAF-8483-4772-8E79-3D69D8477DE4

# Later in the script mount points set as follows
UUID=${uuid_root} / ext4 rw,discard,errors=remount-ro,x-systemd.growfs 0 1
UUID=${uuid_efi} /boot/efi vfat defaults 0 0
```

Let's mount `disk.raw` as a drive and explore its partitions.

```bash
# Attach disk.raw to the next available loop device 
# and create device nodes for all specified partitions 
sudo losetup -f -P ./disk.raw   

# Check which loop device disk.raw is attached to
# In my Ubuntu WSL environment this is /dev/loop0
sudo losetup -l  

# List partition details for /de/loop0 device
sudo fdisk -l /dev/loop0     
```

In `disk.raw` we have our Linux system root partition and EFI partition with no separate boot partition as per Debian Cloud Image build scripts.

```bash
Disk /dev/loop0: 2 GiB, 2147483648 bytes, 4194304 sectors
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: gpt
Disk identifier: 318C8BB1-532B-154F-92FA-3FADCC32586B
Device         Start     End Sectors  Size Type
/dev/loop0p1  262144 4194270 3932127  1.9G Linux filesystem
/dev/loop0p14   2048    8191    6144    3M BIOS boot
/dev/loop0p15   8192  262143  253952  124M EFI System

Partition table entries are not in disk order.
```

Let's mount the root file system and attach the EFI partition under /boot/efi in the file structure.

```bash
# Create folder for mounting your cloud image partitions
# Destination and naming choices somewhat arbitrary
sudo mkdir -p /media/cloudimage 

# Mount the root partition directly under the folder we created
sudo mount /dev/loop0p1 /media/cloudimage 
# Mount EFI under /boot/efi in this structure
sudo mount /dev/loop0p15 /media/cloudimage/boot/efi

# Have a quick peek at the folder structure
# Should look like standard Linux file system layout
cd /media/cloudimage
ls
```

Let's export this this filesystem as a tarball and move it to C:/WSL/images on the host system to store it alongside all other custom WSL starter images.

```bash
# Create tarball from the mounted Debian file system
# This assumes your current directory is /media/cloudimage
# and will create tarball in /media
sudo tar -czf ../debian-11-nocloud-amd64.tar.gz . 
# Move the tarball to C:/WSL/images
sudo mv -v /media/debian-11-nocloud-amd64.tar.gz /mnt/c/WSL/images/
```

Once above steps have been successfully completed you can clean up, remove your mounts working backwards, detach loop device and remove downloaded files. Mounts and loop devices will be reset when you restart your WSL environment so you don't need to worry about these too much, but probably a good idea to tidy up your file downloads as these can quickly add up.

```bash
# Switch back to home folder
cd ~                                                       

# Unmount partitions in reverse order to avoid errors
sudo umount /dev/loop0p15
sudo umount /dev/loop0p1

# Detach loop device
sudo losetup --detach /dev/loop0

# Remove downloaded files
rm disk.raw
rm debian-11-nocloud-amd64.tar.xz
```

You can now import the tarball we created using the `wsl --import` command and configure as needed. For more info head back to [WSL2: Roll Your Own]({{< ref "/posts/2023/wsl2-roll-your-own/index.md#create-wsl-environment" >}} "WSL2: Roll Your Own").

This post was inspired by the Developer Monkey's [Install Fedora 36 from RAW disk image on WSL – for free – by using WSL](https://develmonk.com/2022/07/29/install-fedora-36-on-wsl-for-free/) article.
