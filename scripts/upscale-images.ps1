param(
    [double]$Scale = 2.0,
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
    [string]$BackupRoot = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')).Path '.image-backup'),
    [switch]$Force
)

Add-Type -AssemblyName System.Drawing

$Root = (Resolve-Path $Root).Path.TrimEnd('\', '/')
$BackupRoot = $BackupRoot.TrimEnd('\', '/')
$extensions = @('*.png', '*.jpg', '*.jpeg')
$files = Get-ChildItem -Path $Root -Recurse -File -Include $extensions |
    Where-Object {
        -not $_.FullName.StartsWith(
            "$BackupRoot$([System.IO.Path]::DirectorySeparatorChar)",
            [System.StringComparison]::OrdinalIgnoreCase
        )
    }

if (-not (Test-Path $BackupRoot)) {
    New-Item -ItemType Directory -Path $BackupRoot | Out-Null
}

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' } |
    Select-Object -First 1

$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality,
    [long]95
)

$processed = foreach ($file in $files) {
    $relative = $file.FullName.Substring($Root.Length).TrimStart('\', '/')
    $backupPath = Join-Path $BackupRoot $relative
    $backupDir = Split-Path $backupPath -Parent

    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }

    if (-not (Test-Path $backupPath)) {
        Copy-Item -LiteralPath $file.FullName -Destination $backupPath
    }

    if (-not $Force -and (Test-Path $backupPath)) {
        $currentImage = [System.Drawing.Image]::FromFile($file.FullName)
        $backupImage = [System.Drawing.Image]::FromFile($backupPath)
        try {
            $expectedWidth = [Math]::Max(1, [int][Math]::Round($backupImage.Width * $Scale))
            $expectedHeight = [Math]::Max(1, [int][Math]::Round($backupImage.Height * $Scale))
            if ($currentImage.Width -eq $expectedWidth -and $currentImage.Height -eq $expectedHeight) {
                [pscustomobject]@{
                    Path = $relative
                    Width = $currentImage.Width
                    Height = $currentImage.Height
                    Status = 'Skipped'
                }
                continue
            }
        }
        finally {
            $currentImage.Dispose()
            $backupImage.Dispose()
        }
    }

    $source = [System.Drawing.Image]::FromFile($file.FullName)
    try {
        $newWidth = [Math]::Max(1, [int][Math]::Round($source.Width * $Scale))
        $newHeight = [Math]::Max(1, [int][Math]::Round($source.Height * $Scale))

        $bitmap = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
        try {
            $bitmap.SetResolution($source.HorizontalResolution, $source.VerticalResolution)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            try {
                $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $graphics.DrawImage($source, 0, 0, $newWidth, $newHeight)
            }
            finally {
                $graphics.Dispose()
            }

            $tempPath = "$($file.FullName).upscale.tmp"
            $extension = $file.Extension.ToLowerInvariant()

            if (($extension -eq '.jpg' -or $extension -eq '.jpeg') -and $jpegCodec) {
                $bitmap.Save($tempPath, $jpegCodec, $encoderParams)
            }
            else {
                $bitmap.Save($tempPath, $source.RawFormat)
            }
        }
        finally {
            if ($bitmap) {
                $bitmap.Dispose()
            }
        }
    }
    finally {
        $source.Dispose()
    }

    Move-Item -LiteralPath $tempPath -Destination $file.FullName -Force

    [pscustomobject]@{
        Path = $relative
        Width = $newWidth
        Height = $newHeight
        Status = 'Upscaled'
    }
}

$processed | Sort-Object Path | Format-Table -AutoSize
$upscaledCount = ($processed | Where-Object { $_.Status -eq 'Upscaled' } | Measure-Object).Count
$skippedCount = ($processed | Where-Object { $_.Status -eq 'Skipped' } | Measure-Object).Count
Write-Host "Upscaled $upscaledCount image(s). Skipped $skippedCount already-HD image(s). Backups are in $BackupRoot"
