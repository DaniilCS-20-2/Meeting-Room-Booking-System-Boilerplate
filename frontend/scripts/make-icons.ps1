Add-Type -AssemblyName System.Drawing

function New-Icon {
    param([int]$Size, [string]$OutPath)

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

    # Background: fill entire square with dark color (maskable-safe)
    $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(47, 51, 56))
    $g.FillRectangle($bg, 0, 0, $Size, $Size)

    # Calendar icon centered
    $white = [System.Drawing.Color]::White
    $penW = [Math]::Max(2, [int]($Size / 64))
    $pen = New-Object System.Drawing.Pen($white, $penW)
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $brushW = New-Object System.Drawing.SolidBrush($white)

    # Use inner safe area ~60% of canvas (maskable safe zone)
    $inner = [int]($Size * 0.56)
    $offset = [int](($Size - $inner) / 2)
    $x = $offset
    $y = $offset + [int]($Size * 0.03)

    # Top rings
    $ringW = [int]($inner * 0.06)
    $ringH = [int]($inner * 0.10)
    $ring1X = $x + [int]($inner * 0.22)
    $ring2X = $x + [int]($inner * 0.72)
    $ringY = $y - [int]($ringH * 0.5)
    $g.FillRectangle($brushW, $ring1X, $ringY, $ringW, $ringH)
    $g.FillRectangle($brushW, $ring2X, $ringY, $ringW, $ringH)

    # Calendar body (rounded rect approximated)
    $r = [int]($inner * 0.08)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($x, $y, $r*2, $r*2, 180, 90)
    $path.AddArc($x + $inner - $r*2, $y, $r*2, $r*2, 270, 90)
    $path.AddArc($x + $inner - $r*2, $y + $inner - $r*2, $r*2, $r*2, 0, 90)
    $path.AddArc($x, $y + $inner - $r*2, $r*2, $r*2, 90, 90)
    $path.CloseFigure()
    $g.DrawPath($pen, $path)

    # Header separator
    $headerY = $y + [int]($inner * 0.22)
    $g.DrawLine($pen, $x, $headerY, $x + $inner, $headerY)

    # Grid 4 cols x 3 rows inside body below header
    $gridTop = $headerY
    $gridBottom = $y + $inner
    $gridLeft = $x
    $gridRight = $x + $inner
    $cols = 4
    $rows = 3
    for ($i = 1; $i -lt $cols; $i++) {
        $cx = $gridLeft + [int](($gridRight - $gridLeft) * $i / $cols)
        $g.DrawLine($pen, $cx, $gridTop, $cx, $gridBottom)
    }
    for ($i = 1; $i -lt $rows; $i++) {
        $cy = $gridTop + [int](($gridBottom - $gridTop) * $i / $rows)
        $g.DrawLine($pen, $gridLeft, $cy, $gridRight, $cy)
    }

    # Fill two booked cells
    $cellW = ($gridRight - $gridLeft) / $cols
    $cellH = ($gridBottom - $gridTop) / $rows
    $pad = [int]($cellW * 0.20)
    $booked = @(@(1,0), @(2,1))
    foreach ($b in $booked) {
        $bx = $gridLeft + [int]($cellW * $b[0]) + $pad
        $by = $gridTop + [int]($cellH * $b[1]) + $pad
        $bw = [int]$cellW - $pad*2
        $bh = [int]$cellH - $pad*2
        $g.FillRectangle($brushW, $bx, $by, $bw, $bh)
    }

    $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Wrote $OutPath ($Size x $Size)"
}

$publicDir = Join-Path $PSScriptRoot "..\public"
New-Icon -Size 512 -OutPath (Join-Path $publicDir "icon-512.png")
New-Icon -Size 192 -OutPath (Join-Path $publicDir "icon-192.png")
