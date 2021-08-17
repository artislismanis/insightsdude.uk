---
title: "PowerShell Measure-Command"
date: 2021-08-17
draft: false
categories:
  - "Development"
tags:
  - "one-liner"
  - "PowerShell"
toc: false
#customCSS:  
#  - "/css/asciinema-player.css"
#customJS: 
#  - "/js/asciinema-player.js"
---
 Recently I was putting together some VM provisioning scripts, was running and re-running these as a part of testing and wanted to measure how long it takes for some of these scripts to run. PowerShell one-liner to the rescue!

 ```powershell
 Measure-Command {Start-Sleep -s 10; Write-Output "Done!" | Out-Host}
 ```

This snippet consists of three parts. `Measure-Command {}` which is the bit that does the measuring. `Start-Sleep -s 10; Write-Output "Done!"` is the command that I'm executing - sleeps for 10 seconds and then prints out "Done!". Finally, output from the executed command is redirected to the command line like so `| Out-Host`.

<!--more-->