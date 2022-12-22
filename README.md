# insightsdude.uk

## What is this?

A GitHub repository behind my blog at https://insightsdude.uk. 

## Why do I need it?

You probably don't unless you want nose around to see how my blog is set up and how I manage the content. 

## OK, how do I get started?

Set up WSL2 environment, install git, git-flow and hugo, configure it all

```bash
# Clone the repo, pull the template, initialise git-flow
git clone git@github.com:artislismanis/lubuntu-datadev-vm.git
git submodule update --init --recursive
git flow init -d 

# Work with a new feature
git flow feature start MYFEATURE
git flow feature publish MYFEAT
git flow feature pull origin MYFEATURE
git flow feature finish MYFEATURE

# Create a release when happy to publish your content
git flow release start RELEASE
git flow release publish RELEASE
git flow release finish RELEASE
git push origin --tags

# Create and preview posts in Hugo 
hugo new posts/YYYY/title-of-your-post.md
hugo new posts/YYYY/title-of-your-post/index.md
hugo serve --watch --buildDrafts
```

## What else?

At some point I need to cover how I manage domain, hosting with AWS Amplify and what CI/CD setup looks like. 