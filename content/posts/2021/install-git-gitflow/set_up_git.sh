#!/bin/bash
set -eu

# Define some colours for outputing text
GREEN='\033[0;32m'
NC='\033[0m' 

echo
echo -e "${GREEN}==> Install Git and GitFlow...${NC}"
echo
sudo apt-get -y update && sudo apt-get -y install git git-flow
echo

echo  -e "${GREEN}==> Set some Git and Github config defaults...${NC}"
echo 
IFS= read -r -p "Please enter your Git user.name: " GIT_USER_NAME
echo 
IFS= read -r -p "Please enter your Git user.email: " GIT_USER_EMAIL


# Git. See https://git-scm.com/docs/git-config
git config --global user.name "$GIT_USER_NAME"
git config --global user.email "$GIT_USER_EMAIL"
git config --global init.defaultBranch main
# GitFlow. See https://github.com/nvie/gitflow/wiki/Config-values
git config --global gitflow.branch.master main
git config --global gitflow.branch.develop develop
git config --global gitflow.prefix.feature feature-
git config --global gitflow.prefix.bugfix bugfix-
git config --global gitflow.prefix.release release-
git config --global gitflow.prefix.hotfix hotfix-
git config --global gitflow.prefix.support support-
git config --global gitflow.prefix.versiontag "" 
echo

echo  -e "${GREEN}==> Generate SSH Keys...${NC}"
echo
IFS= read -r -p "Please enter a comment for your SSH key: " SSH_KEY_COMMENT
ssh-keygen -t rsa -b 4096 -f ~/.ssh/vcs.key -C "$SSH_KEY_COMMENT"
echo

echo  -e "${GREEN}==> Updating SSH config...${NC}"
echo
cat << EOF >> ~/.ssh/config

Host github.com
  Hostname github.com
  User git
  IdentityFile ~/.ssh/vcs.key
  IdentitiesOnly yes

Host bitbucket.org
  Hostname bitbucket.org
  User git
  IdentityFile ~/.ssh/vcs.key
  IdentitiesOnly yes

#Host bitbucket.org-work
#  Hostname bitbucket.org
#  User git
#  IdentityFile ~/.ssh/vcs_work.key
#  IdentitiesOnly yes

Host ssh.dev.azure.com
  Hostname ssh.dev.azure.com
  User git
  IdentityFile ~/.ssh/vcs.key
  IdentitiesOnly yes

Host gitlab.com
  Hostname gitlab.com
  User git
  IdentityFile ~/.ssh/vcs.key
  IdentitiesOnly yes

EOF
echo

echo  -e "${GREEN}==> Updating SSH key and config file permissions...${NC}"
echo
chmod 600 ~/.ssh/*
echo

echo  -e "${GREEN}==> Configure ssh-agent to start on shell login...${NC}"
echo
cat << 'EOF' >> ~/.profile

# Read all keys in .ssh folder that start with 'vcs' and end in '.key'.
# Change to suit your requirements
keys=~/.ssh/vcs*.key
env=~/.ssh/agent.env

agent_load_env () { test -f "$env" && . "$env" >| /dev/null ; }

agent_start () {
    (umask 077; ssh-agent >| "$env")
    . "$env" >| /dev/null ; trap "kill $SSH_AGENT_PID" 0 }

agent_load_env

# agent_run_state: 0=agent running w/ key; 1=agent w/o key; 2=agent not running
agent_run_state=$(ssh-add -l >| /dev/null 2>&1; echo $?)

if [ ! "$SSH_AUTH_SOCK" ] || [ $agent_run_state = 2 ]; then
    agent_start
    ssh-add $keys
elif [ "$SSH_AUTH_SOCK" ] && [ ! $agent_run_state = 2 ]; then
    ssh-add $keys
fi

unset env

EOF
echo

echo  -e "${GREEN}==> Printing out your VCS public key...${NC}"
echo
cat ~/.ssh/vcs.key.pub
echo

echo  -e "${GREEN}==> Here are how to add your key to Git hosting providers...${NC}"
echo
echo "# https://insightsdude.uk/2021/08/setting-up-git-and-gitflow/#add-keys"
echo

echo  -e "${GREEN}==> Here are some test repos...${NC}"
echo
echo "git clone git@github.com:artislismanis/hello-world.git"
echo "git clone git@bitbucket.org:artislismanis/hello-world.git"
echo "git clone git@ssh.dev.azure.com:v3/artislismanis/hello-world/hello-world"
echo "git clone git@gitlab.com:artislismanis-projects/hello-world.git"
echo