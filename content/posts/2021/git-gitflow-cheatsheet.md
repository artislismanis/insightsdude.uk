---
title: "Git and GitFlow Cheatsheet"
date: 2021-08-04
draft: true
categories:
  - "Development"
tags:
  - "howto"
  - "git"
  - "gitflow"
---

Being and an occasional developer I usually scramble to Google my git commands whenever I intend to do something more than just writing some throwaway code. It is almost embarrasing! Not to mention the panic that sets in when I need to do anything with GitFlow branching model adopted by the team. :see_no_evil: What follows is a very basic personal Git and GitFlow cheatsheet covering commands I find I keep coming back to and are just enough to get me by. 

<!--more-->

When developing I tend to work on Ubuntu based OS whether in VM or WSL. This is to get the Git and GitFlow installed.  

```shell
sudo apt-get install git git-flow
```
Set some basic Git config. 

```shell
git config --global init.defaultBranch main
git config --global user.name "Artis Lismanis"
git config --global user.email "artis@lismanis.co.uk"
```

#echo "==> Set git user and email details..."
#git config --global user.name "Firstname Lastname"
#git config --global user.email "firstname.lastname@example.com"

#echo "==> Generate SSH Keys for use with remote VCS..."
#ssh-keygen -t rsa -N "" -f ~/.ssh/vcs.key -C ""
#chmod 600 ~/.ssh/vcs.key
#chmod 600 ~/.ssh/vcs.key.pub
#cat <<EOF > ~/.ssh/config
#Host bitbucket.org
#	Hostname bitbucket.org
#	User git
#	IdentityFile ~/.ssh/vcs.key
#	IdentitiesOnly yes
#
#Host github.com
#	Hostname github.com
#	User git
#	IdentityFile ~/.ssh/vcs.key
#	IdentitiesOnly yes
# 

Host ssh.dev.azure.com
  IdentityFile ~/.ssh/your_private_key
  IdentitiesOnly yes
#EOF

#chmod 600 ~/.ssh/config

https://stackoverflow.com/questions/51584765/how-do-you-install-multiple-separate-instances-of-ubuntu-in-wsl

https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow