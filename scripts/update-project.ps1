<#
Runs routine project maintenance from one command.

Examples:
  powershell -ExecutionPolicy Bypass -File .\scripts\update-project.ps1
  powershell -ExecutionPolicy Bypass -File .\scripts\update-project.ps1 -UpdateDependencies -Audit -UpscaleImages
  powershell -ExecutionPolicy Bypass -File .\scripts\update-project.ps1 -Start -StartPhp
#>

param(
    [switch]$UpdateDependencies,
    [switch]$Audit,
    [switch]$UpscaleImages,
    [switch]$Start,
    [switch]$StartPhp
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Action
    )

    Write-Host ""
    Write-Host "==> $Name"
    & $Action
}

function Test-CommandExists {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Install-BackendDependencies {
    if (-not (Test-CommandExists 'npm.cmd')) {
        throw 'npm.cmd was not found on PATH. Install Node.js, then run this script again.'
    }

    Push-Location $repoRoot
    try {
        & npm.cmd --prefix backend install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed with exit code $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }
}

function Update-BackendDependencies {
    Push-Location $repoRoot
    try {
        & npm.cmd --prefix backend update
        if ($LASTEXITCODE -ne 0) {
            throw "npm update failed with exit code $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }
}

function Audit-BackendDependencies {
    Push-Location $repoRoot
    try {
        & npm.cmd --prefix backend audit --audit-level=moderate
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "npm audit reported issues. Review the output above before shipping."
        }
    }
    finally {
        Pop-Location
    }
}

Invoke-Step 'Install backend dependencies' { Install-BackendDependencies }

if ($UpdateDependencies) {
    Invoke-Step 'Update backend dependencies within package.json ranges' { Update-BackendDependencies }
}

if ($Audit) {
    Invoke-Step 'Audit backend dependencies' { Audit-BackendDependencies }
}

if ($UpscaleImages) {
    Invoke-Step 'Upscale images to 2x when needed' {
        & (Join-Path $PSScriptRoot 'upscale-images.ps1') -Scale 2
    }
}

if ($Start) {
    Invoke-Step 'Start project' {
        $args = @()
        if ($StartPhp) {
            $args += '-StartPhp'
        }
        & (Join-Path $repoRoot 'run-project.ps1') @args
    }
}

Write-Host ""
Write-Host 'Maintenance finished.'
