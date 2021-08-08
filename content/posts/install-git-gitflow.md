---
title: "Setting up Git and GitFlow"
date: 2021-08-04
draft: true
categories:
  - "Development"
tags:
  - "howto"
  - "git"
  - "gitflow"
---

On those rare occasions when I get a chance to code I tend to work on Ubuntu based virtual environments - [VirtualBox VMs](https://www.virtualbox.org/), or more recently [WSL](https://docs.microsoft.com/en-us/windows/wsl/about). It is pretty much a given that I'd need to interact with different Git hosting services like [GutHub](https://github.com/) and [BitBucket](https://bitbucket.org/), and it usually takes quite a bit of tinkering to get everything set up and working smoothly with all the various accounts. These are my steps to to get the Git and GitFlow installed and configured.

<!--more-->

**TODO** - For impatient here is a gist with a commented Bash script.

This short how-to assumes you have a Debian-based Linux distribution installed and ready to go and that you are logged in as a non-root user with sudo permissions.

## Install Git & GitFlow

It is literally a one-liner to install Git and GitFlow extension. GitFlow is optional and only useful if you work with GitFlow branching model. I really like [BitBucket's git workflow explanations and comparison](https://www.atlassian.com/git/tutorials/comparing-workflows) if you want to dive into more detail around this.

```bash
# Update package list. Install git and git-flow. 
sudo apt-get update && sudo apt-get install git git-flow
```

Set some useful global Git configuration settings like your user details and how you want your default git branch to be named if you want to support [moving away from the historical use of 'master'](https://sfconservancy.org/news/2020/jun/23/gitbranchname/).  

```bash
# Configure Git
git config --global user.name "John Doe"
git config --global user.email "john.doe@example.com"
git config --global init.defaultBranch main
```

This is all you really need to start using Git locally.

I also like to tweak some GitFlow configuration defaults to my personal preferences. Changing these settings globally means I can initialise git flow repositories with these dfaults without having to specify them on a repository by repository basis. All this does is set the production release branch to 'main', next release to 'develop' and tweaks other default prefixes to change forward slash to a dash as a separator. There is a method in my madness around changing prefixes - I started following this convention to work round some bugs in how Azure Databricks workspace integrates with BitBucket for versioning Notebook code. You can probably safely ignore this whether you are using GitFlow or not.

```bash
# Configure GitFlow
git config --global gitflow.branch.master main
git config --global gitflow.branch.develop develop
git config --global gitflow.prefix.feature feature-
git config --global gitflow.prefix.bugfix bugfix-
git config --global gitflow.prefix.release release-
git config --global gitflow.prefix.hotfix hotfix-
git config --global gitflow.prefix.support support-
git config --global gitflow.prefix.versiontag "" 
```

Developing locally is great, but what's the fun in writing code and not sharing it with others?

## Working with Git hosting services

I find that setting up SSH keys to use for authentication is a convenient and a more secure way to work with various Git hosting providers. I generally tend to generate a new SSH key per virtual environment and reuse this across different services, but you can tweak instructions below to generate separate keys for each environment and service combination.

First we generate a new key pair: a public and a private key. Enter and confirm a passphrase when prompted. Leaving passphrase empty will create a key pair without a passphrase. You will keep the private key on your system and upload the public key to your Git hosting provider's account.

```bash
#Generate a new SSH key. -t sets the key type, -f destination file, -C comment. 
ssh-keygen -t ed25519 -f ~/.ssh/vcs.key -C "john.doe@example.com"

# If you want to live on the edge and create a key without a passphrase,
# you can add -N "" switch which specifies passphrase as empty string.
# This will generate a new SSH key without any prompts.
#ssh-keygen -t ed25519 -f ~/.ssh/vcs.key -N "" -C "john.doe@example.com"
```

If you have generated key with a passphrase, you will want to add this to ssh-agent so that you can easily use and move between different services without having to constantly type in your passphrase. First we start ssh-agent and then add the key we generated above. You will need to provide your SSH key passphrase when adding it to the ssh-agent.

```bash
# Start ssh-agent if not already running
eval "$(ssh-agent -s)"
# Add the newly generated key
ssh-add ~/.ssh/vcs.key
```

As a next step you will want to create a configuration file that specifies which keys are to be used for various services. You can copy and paste the code below to update your SSH config file to include settings for main Git hosting providers.

The configuration file is a bit repetitive for using the same key (vcs.key) across all providers, but can then be easily modified to specify a separate key per provider or even extended to support multiple accounts with the same provider.

```bash
# Append BitBucket, GitHub and Azure DevOps settings to SSH config
# Creates new config file if it doesn't already exist
cat << EOF >> ~/.ssh/config

Host bitbucket.org
  Hostname bitbucket.org
  User git
  IdentityFile ~/.ssh/vcs.key
  IdentitiesOnly yes

#Host bitbucket.org-work
#  Hostname bitbucket.org
#  User git
#  IdentityFile ~/.ssh/work_vcs.key
#  IdentitiesOnly yes

Host github.com
  Hostname github.com
  User git
  IdentityFile ~/.ssh/vcs.key
  IdentitiesOnly yes
 
Host ssh.dev.azure.com
  Hostname ssh.dev.azure.com
  User git
  IdentityFile ~/.ssh/vcs.key
  IdentitiesOnly yes

EOF
```

SSH requires for all files in .ssh folder to be properly secured. To keep it simple I tend to apply a blanket rule of only allowing the owner account to have read/write access to the files.

```bash
# Set all files in .ssh folder to only be accessible by the owner
chmod 600 ~/.ssh/*
```

Now that your SSH keys and configuration have been set up you can add your public key or keys to the relevant providers:

* [Adding a new SSH key to your GitHub account](https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)
* [Bitbucket - Set up an SSH key](https://support.atlassian.com/bitbucket-cloud/docs/set-up-an-ssh-key/)
* [Azure DevOps - Use SSH key authentication](https://docs.microsoft.com/en-us/azure/devops/repos/git/use-ssh-keys-to-authenticate?view=azure-devops)

```bash
#Output public key so this can be copied for adding to your account. 
cat ~/.ssh/vcs.key.pub
``` 

GitHub - Log in, head to https://github.com/settings/ssh/new. Give a descriptive title. Paste key value. Click Add SSH key. Might be asked to confirm your password.  Give a descriptive title. Paste key value.

Bitbucket - Log in, head to https://bitbucket.org/account/settings/ssh-keys/, Click Add key. Give a descriptive title. Paste key value. Click Add key.

Azure DevOps. Log in, head to https://dev.azure.com/{YOUR_ORG}/_usersSettings/keys?action=edit. Give a descriptive title. Paste key value. Click Save.

One interesting case is when you are working with multiple differnt accounts on the same provider and need to use different keys.

Git hosting providers identify you through the secret key you provide when authenticating. By setting up separate keys for each account you can differentiate between the accounts. How do you specify different keys when using Git? Thorugh SSH config! what you can do is effectively define mapping of what you feed into SSH and how it gets translated. e.g. bitbicket commented out. Config the same as standard access - changed Host & key used under it. host can be anything - only your ssh client will know about it. (like hosts file to override DNS, but for SSH)

How do you test if all this is a success?

**TODO** - Pull all this together into a Gist.

Putting this all together - Gist.

{{< gist spf13 7896402 >}}
