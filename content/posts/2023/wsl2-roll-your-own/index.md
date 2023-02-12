---
title: "WSL2: Roll Your Own"
date: 2023-02-12T00:00:40
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

I have always been fond of my VMs to isolate my experiments form my main OS. For a long time it was all about using [VirtualBox](https://www.virtualbox.org/) for running VMs, [Vagrant](https://www.vagrantup.com/) for provisioning them and [Packer](https://www.packer.io/) for creating my own custom images. Then WSL came along, and while lightweight, it never really felt as fully featured as I wanted it to be. Over the last few years, however, Microsoft have come a long way and now there is really no need to manage VMs yourself unless you are doing something very exotic. If fact the whole WSL experience is so smooth that it is indistinguishable from pure magic. This never sits well with the control freak in me. :rofl: This post is a summary of my approach to rolling my own WSL environment and will cover topics like using custom Linux images, managing multiple environments, and tweaking more advanced WSL settings.

<!--more-->

While WLS comes with several pre-packaged and easy to install Linux environments (you can check these out by running `wsl --list --online` on your PowerShell command prompt), it is relatively straight forward to create a custom one based on your favourite Linux distribution. This approach also allows you to create multiple environments based on the same image and run them side by side. The process has four main steps - download Linux OS image you want to use, make sure it is packaged in WSL friendly format, tell WSL to create a new environment based on the image and then configure the environment to meet your needs. Terminal session recording below provides an end-to-end example with the rest of the article looking at the process in more detail.

{{< asciinema key="wsl-roll-your-own" rows="30" cols="100" preload="1" >}}

{{< toc >}}

## Getting started

This 'how-to' assumes you are comfortable using WSL and can find your way around Linux command line. If you are after basics and getting started tutorial, Microsoft Learn has an excellent [Set up a WSL development environment](https://learn.microsoft.com/en-us/windows/wsl/setup/environment) article.

The code has been tested and runs Windows 11 Pro for Workstations (22H2) on the current version of WSL2. Some WSL features described here might be Windows 11 specific and not backwards compatible with Windows 10.

To help me manage my custom environments I start with a folder structure below where **environments** folder stores the customer environments I create and **images** is where I store downloaded Linux distribution files. The choice of folder names and location is arbitrary.

```powershell
PS C:\> ls C:\WSL\

    Directory: C:\WSL

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        21/01/2023     19:23                environments
d-----        15/01/2023     22:42                images
```

## Download Linux distribution

Probably the easiest distribution to get started with is Ubuntu as it has a pre-built image specifically for WSL use. You can download the latest Ubuntu WSL ready images here: [https://cloud-images.ubuntu.com/wsl/](https://cloud-images.ubuntu.com/wsl/). I usually tend to go for the latest build of the current long term support (LTS) version. In this case I'm using Ubuntu Jammy Jellyfish. You can download the desired tar.gz file manually via browser or run commands bellow in PowerShell command prompt.

```powershell
# Start by downloading Ubuntu WSL image
wget https://cloud-images.ubuntu.com/wsl/jammy/current/ubuntu-jammy-wsl-amd64-wsl.rootfs.tar.gz -OutFile C:\WSL\images\ubuntu-jammy-wsl-amd64-wsl.rootfs.tar.gz
```

If your favourite Linux distribution does not have a WSL specific image, you will need to start with a minimal / base image and repackage it as a full root system in a tarball. Your favourite distribution's cloud image is usually a good candidate for this. Check out mini-articles below for a few quick examples of how to prepare some of the other popular Linux distributions for WSL:

- [WSL2: Debian Image Prep]({{< ref "/posts/2023/wsl2-debian" >}} "WSL2: Debian Image Prep")
- [WSL2: Fedora Image Prep]({{< ref "/posts/2023/wsl2-fedora" >}} "WSL2: Fedora Image Prep")
- [WSL2: CentOS Stream Image Prep]({{< ref "/posts/2023/wsl2-centos-stream" >}} "WSL2: CentOS Stream Image Prep")

Note that there are additional flavours of Linux available for WSL via Microsoft Store or through several different community maintained projects on GitHub. You can use any of these as a starting point for your customisations. If you are familiar with Docker, you can also create WSL compatible images form a Docker environment by exporting it via `docker export` command.

There are only two reasons not to use a readily available and supported WSL distributions: a) to have full control over choosing specific version of OS and tools installed and b) irresistible urge to tinker. :stuck_out_tongue_winking_eye:

## Create WSL environment

Once you have downloaded and prepared your Linux distribution file you can create WSL environment by running the following general command on your PowerShell prompt.

```plaintext
wsl --import <EnvName> <EnvDestinationFolder> <DistroImageFileName>
```

In the example below I'm creating an environment called **UbuntuJammyExample**, specifying that it should be stored in **C:\WSL\environments\UbuntuJammyExample** and that it should be created using the file **ubuntu-jammy-wsl-amd64-wsl.rootfs.tar.gz** I downloaded from Ubuntu website in the previous step.

```powershell
wsl --import UbuntuJammyExample C:\WSL\environments\UbuntuJammyExample C:\WSL\images\ubuntu-jammy-wsl-amd64-wsl.rootfs.tar.gz
```

Once you run this command you should get a message saying that the import is in progress followed by a confirmation of success if all went as expected. You should now have new environment available in WSL and be able to access it using command below.

```powershell
# Run specific WSL distribution/environment 
# To see a list of all available environments run wsl --list
# I'm using --cd to default environment to the user's home folder 
# instead of using current folder in the active in PowerShell session
wsl --distribution UbuntuJammyExample  --cd ~
```

If you are using Windows Terminal, you will need to restart it for shortcut to this new environment to appear in your options.

## Configure WSL environment

We are now ready configure newly created WSL environment. Example below is specific to the Ubuntu environment we created earlier, should work on all Debian based systems, but will need to be changed for RedHat based distros (see guidance in code comments).

Start by fetching the latest updates and upgrading any out of date packages. If you are using recently downloaded build, there should be no or very few packages to upgrade.

```bash
# Update you package list and upgrade any out of date packages
# Using -y flag to skip manual confirmation prompts
apt-get -y update && apt-get -y upgrade

# Make sure sudo and systemd are installed
apt-get -y install sudo systemd

# On RedHat based systems the following should work
# yum -y update && yum -y upgrade
# yum -y install sudo systemd
```

Tidy up `/etc/fstab` file in case it holds irrelevant settings from original image build.

```bash
# Replace contents of the /etc/fstab with a comment
# Borrowed the comment text form pre-packaged WSL Ubuntu distro
echo "# UNCONFIGURED FSTAB FOR BASE SYSTEM" > /etc/fstab
```

By default, Linux distribution images are set up to run as a root user and it is a good idea to set up a separate non-root user to be used as a default login. There are two steps to this: a) set up non-root user  and b) configure WSL to use it as default for this specific environment.

```bash
# Add new user - read the command backwards 
# Create a new user insightsdude, -s set bash as default shell 
# -G add the user to group sudo to allow privilege elevation
# -m create a home folder for the user 
useradd -m -G sudo -s /bin/bash insightsdude

# On RedHat based systems add user to group 'wheel' instead
# useradd -m -G wheel -s /bin/bash insightsdude

# Set password for the account 
echo insightsdude:yourpasswordstring | chpasswd

# Example above runs as an easy one-liner, but keeps sensitive  
# information in your shell history so is more suited for 
# use in scripting. To be more secure you can change user password 
# interactively without it being echoed on CLI. 
# passwd insightsdude
```

This brings us to `/ect/wsl.config`, a WSL specific, per-environment configuration file. This allows you to configure certain aspects of your individual WSL environments and how they interact with the Windows host system. The configuration controls boot behaviour, mounting file systems, network settings, default user and interop capabilities with Windows host environment. Sensible defaults are provided, but this allows you to make your own customisations. Full details of configuration settings can be found in Microsoft Learn's [Advanced settings configuration in WSL](https://learn.microsoft.com/en-us/windows/wsl/wsl-config).

Let's start by creating the config file and specifying the non-root user we created in the previous step.

```bash
# Set default user for logging into WSL environment
# We are using > output redirector 
# This will replace any existing contents of the file
# Using -e allows to specify \n - new line character
echo -e "[user]\ndefault = insightsdude" > /etc/wsl.conf
```

I also like to customise my hostname as by default WSL re-uses your Windows hostname.

```bash
# Set the hostname to devbox
# Now we are using >> to append to config 
echo -e "[network]\nhostname = devbox01" >> /etc/wsl.conf
```

In the past I have found that on some systems changing your WSL hostname causes DNS lookup issues so tend to manage this manually as well. Instead of just changing the hostname I would go all in.

```bash
# Disable automatic generation of resolver configuration 
# Set hostname to devbox01
# Can always edit the file later to change this
cat << EOF >> /etc/wsl.conf
[network]
generateResolvConf = false
hostname = devbox01
EOF

# You need to remove autogenerated file and create fresh one
# If you just modify existing file, your changes will be removed 
# as a part of disabling auto generation of resolv.conf
rm /etc/resolv.conf

# Create your own resolv.conf
# Using Google Public DNS 
cat << EOF > /etc/resolv.conf
# Google Public DNS
nameserver 8.8.8.8
nameserver 8.8.4.4
EOF
```

One recent addition to WSL feature set is systemd support which is requirement for running some services and apps. This only works on later versions of WSL. Only enable if you know why you need it - generally makes your WSL environment behave a bit more like a traditional VM. Make sure your distribution has `systemd` installed before enabling this setting to avoid your WSL environment becoming unusable and erroring out on start. Also note that this functionality is relatively new in WSL and not all distributions will work smoothly and might require some further targeted tweaks.

```bash
echo -e "[boot]\nsystemd = true" >> /etc/wsl.conf
```

This is where I consider my base environment set up and ready to be used as a building block for whatever I'm experimenting with. Optionally you can install any other generic tools you tend to use often. All that's left now is to exit the environment, reboot it and start up again to see if everything works as expected.

```powershell
# Exit the Linux environment to return to PowerShell
exit

# Do a full reboot of WSL, I find this works better than
# terminating individual WSL environment instances as below
# wsl --terminate UbuntuJammyExample 
wsl --shutdown

# Check to see if environment is configured as expected
wsl --distribution UbuntuJammyExample --cd ~

# As a minimum I check the prompt to see logged in user and 
# to see if hostname has been updated correctly and then run 
# a command or two to test network connectivity
sudo apt-get update

# On RedHat based systems
# sudo yum update
```

## Saving customised images

Once you have fully set up your environment and tweaked it to your liking you can export it as a re-usable image.

```powershell
# Save your tweaked image for easy re-use
wsl.exe --export UbuntuJammyExample C:\WSL\images\UbuntuJammyExample.tar
```

My own preference is to fully script creation of my environments and treat them as throwaway. This means that every time I create an environment, I use the most current and up-to date OS and tools. However, there are plenty of scenarios where you might need keep your software locked to specific versions and approach above is perfect for locking in your requirements and sharing WSL environments with others.

You can now import the exported image as a new environment alongside the one we just created.

```powershell
# You can now easily re-import this environment as needed
# Actually you can create as many environments as you need
# using the same image, just give them different names
wsl --import UbuntuJammyExample01 C:\WSL\environments\UbuntuJammyExample01 C:\WSL\images\UbuntuJammyExample.tar   

 # Did it work?    
 wsl --distribution UbuntuJammyExample01 --cd ~  
```

## Global WSL environment config

As we saw above, we can use `wsl.config` file inside individual WSL environments to control some key aspects of how these environments behave. There is also a similar global configuration file `.wslconfig` on Windows host system that controls WSL2 behaviour at host level and across all environments. In many ways this works similar to specifying VM settings in tools like VirtualBox. The same as with wsl.config you get good defaults, but using this configuration file, among other things, gives you better control over resource allocation to WSL. See terminal session recording below for a quick demo of what is possible.

{{< asciinema key="wslconfig" rows="30" cols="100" preload="1" >}}

We start by checking our physical hardware details so we can see default WSL behaviours and how these then change once we introduce our own configuration tweaks.

```powershell
# Use Windows Management Instrumentation command-line tool
# to check your hardware information like RAM & CPU details 
WMCI ComputerSystem Get TotalPhysicalMemory
WMIC CPU Get NumberOfLogicalProcessors
WMIC CPU Get NumberOfCores

# Check if .wslconfig already exists
Test-Path -Path $env:USERPROFILE\.wslconfig -PathType Leaf

# You might want to remove it and reboot WSL to see default WSL behaviours
# Rename-Item -Path "$env:USERPROFILE\.wslconfig" -NewName ".wslconfig.old
# wsl --shutdown

# Start an existing WSL environment to see resource allocation 
# inside WSL. I'm using UbuntuJammyExample we set up above. 
wsl --distribution UbuntuJammyExample  --cd ~
```

Once you are inside a Linux environment you can use commands below to check RAM and CPU details reported by your Linux OS.

```bash
# Check RAM and SWAP details
free

# Show CPU details, limiting output to the first 15 rows 
lscpu | head -n15

# Return to your Windows environment to tweak the WSL settings
exit
```

Let's create a .wslconfig file that is different from default WSL settings. In example below I limit access to RAM and CPU resources on my PC, but force SWAP size to remain at a size WSL would default to if it had access to 50% RAM present on my workstation.  

```powershell
# Create a new .wslconfig file  
"[wsl2]" > $env:USERPROFILE\.wslconfig
# Set RAM to 4GB, limit processor cores to two and set swap to 8GB
"memory=4GB" >> $env:USERPROFILE\.wslconfig
"processors=2" >> $env:USERPROFILE\.wslconfig
"swap=8GB" >> $env:USERPROFILE\.wslconfig

# Check the contents of newly created WSL configuration file
Get-Content $env:USERPROFILE\.wslconfig

# Settings specified here will apply to all WSL environments 
# We need to restart WSL for the changes to take effect
wsl --shutdown

# Start a WSL environment
wsl --distribution UbuntuJammyExample  --cd ~
```

We can now check resource allocation within our WSL environment by running the commands above. The outputs from these should now match our custom configuration.

```bash
# Check RAM and SWAP details
free

# Show CPU details, limiting output to the first 15 rows 
lscpu | head -n15
```

Full details of available config settings can be found in [Advanced settings configuration in WSL](https://learn.microsoft.com/en-us/windows/wsl/wsl-config) article on Microsoft Learn.

## What’s next?

There are a couple more items I'd like to explore on this in the future. One is writing a script or two to automate creation of `wsl.config` and `.wslconfig` files. Wouldn't it be nice to interactively go over defaults and override as necessary without having to go back to the reference documentation? Maybe even incorporate this into an end-to-end WSL environment starter script. Also I've never really worked with Docker in the past and would be interesting to walk through the steps of creating WSL images from Docker environments.
