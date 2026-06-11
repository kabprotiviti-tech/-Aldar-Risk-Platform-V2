param(
  [Parameter(Mandatory=$true)][string]$InPath,
  [Parameter(Mandatory=$true)][string]$OutDocx
)

# ---- Markdown -> HTML (handles headings, tables, bold, code, lists, hr, blockquote) ----
function Convert-Inline([string]$t) {
  $t = $t -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;'
  # bold **x**
  $t = [regex]::Replace($t, '\*\*(.+?)\*\*', '<strong>$1</strong>')
  # inline code `x`
  $t = [regex]::Replace($t, '`(.+?)`', '<code>$1</code>')
  return $t
}

$lines = Get-Content -LiteralPath $InPath -Encoding UTF8
$sb = New-Object System.Text.StringBuilder
$null = $sb.AppendLine('<html><head><meta charset="utf-8"><style>')
$null = $sb.AppendLine('body{font-family:Calibri,Segoe UI,Arial,sans-serif;font-size:10.5pt;color:#1a1a1a;line-height:1.35;}')
$null = $sb.AppendLine('h1{font-size:20pt;color:#7a0019;border-bottom:2px solid #E4002B;padding-bottom:4px;}')
$null = $sb.AppendLine('h2{font-size:15pt;color:#7a0019;margin-top:18px;}')
$null = $sb.AppendLine('h3{font-size:12.5pt;color:#333;margin-top:14px;}')
$null = $sb.AppendLine('table{border-collapse:collapse;width:100%;margin:8px 0;font-size:9pt;}')
$null = $sb.AppendLine('th,td{border:1px solid #bbb;padding:5px 7px;text-align:left;vertical-align:top;}')
$null = $sb.AppendLine('th{background:#7a0019;color:#fff;font-weight:bold;}')
$null = $sb.AppendLine('tr:nth-child(even) td{background:#f6f6f6;}')
$null = $sb.AppendLine('code{background:#eee;font-family:Consolas,monospace;font-size:9pt;padding:0 2px;}')
$null = $sb.AppendLine('blockquote{border-left:3px solid #E4002B;margin:8px 0;padding:2px 12px;color:#555;background:#faf3f4;}')
$null = $sb.AppendLine('hr{border:none;border-top:1px solid #ccc;margin:14px 0;}')
$null = $sb.AppendLine('em{color:#555;}')
$null = $sb.AppendLine('</style></head><body>')

$i = 0
$inList = $false
while ($i -lt $lines.Count) {
  $line = $lines[$i]

  # ---- table block ----
  if ($line -match '^\s*\|') {
    if ($inList) { $null = $sb.AppendLine('</ul>'); $inList = $false }
    $tbl = @()
    while ($i -lt $lines.Count -and $lines[$i] -match '^\s*\|') { $tbl += $lines[$i]; $i++ }
    $null = $sb.AppendLine('<table>')
    $rowIdx = 0
    foreach ($r in $tbl) {
      $trim = $r.Trim()
      # separator row like |---|---|
      if ($trim -match '^\|[\s:\-\|]+\|$') { $rowIdx++; continue }
      $cells = $trim.Trim('|') -split '\|'
      $tag = if ($rowIdx -eq 0) { 'th' } else { 'td' }
      $null = $sb.Append('<tr>')
      foreach ($c in $cells) { $null = $sb.Append("<$tag>" + (Convert-Inline $c.Trim()) + "</$tag>") }
      $null = $sb.AppendLine('</tr>')
      $rowIdx++
    }
    $null = $sb.AppendLine('</table>')
    continue
  }

  # ---- headings ----
  if ($line -match '^###\s+(.*)') { if($inList){$null=$sb.AppendLine('</ul>');$inList=$false}; $null = $sb.AppendLine('<h3>' + (Convert-Inline $Matches[1]) + '</h3>'); $i++; continue }
  if ($line -match '^##\s+(.*)')  { if($inList){$null=$sb.AppendLine('</ul>');$inList=$false}; $null = $sb.AppendLine('<h2>' + (Convert-Inline $Matches[1]) + '</h2>'); $i++; continue }
  if ($line -match '^#\s+(.*)')   { if($inList){$null=$sb.AppendLine('</ul>');$inList=$false}; $null = $sb.AppendLine('<h1>' + (Convert-Inline $Matches[1]) + '</h1>'); $i++; continue }

  # ---- horizontal rule ----
  if ($line -match '^---+\s*$') { if($inList){$null=$sb.AppendLine('</ul>');$inList=$false}; $null = $sb.AppendLine('<hr/>'); $i++; continue }

  # ---- blockquote ----
  if ($line -match '^>\s?(.*)') { if($inList){$null=$sb.AppendLine('</ul>');$inList=$false}; $null = $sb.AppendLine('<blockquote>' + (Convert-Inline $Matches[1]) + '</blockquote>'); $i++; continue }

  # ---- list item ----
  if ($line -match '^\s*[-*]\s+(.*)') {
    if (-not $inList) { $null = $sb.AppendLine('<ul>'); $inList = $true }
    $null = $sb.AppendLine('<li>' + (Convert-Inline $Matches[1]) + '</li>')
    $i++; continue
  }

  # ---- blank line ----
  if ($line -match '^\s*$') { if($inList){$null=$sb.AppendLine('</ul>');$inList=$false}; $i++; continue }

  # ---- paragraph ----
  if ($inList) { $null = $sb.AppendLine('</ul>'); $inList = $false }
  $null = $sb.AppendLine('<p>' + (Convert-Inline $line) + '</p>')
  $i++
}
if ($inList) { $null = $sb.AppendLine('</ul>') }
$null = $sb.AppendLine('</body></html>')

$htmlPath = [System.IO.Path]::ChangeExtension($OutDocx, '.html')
[System.IO.File]::WriteAllText($htmlPath, $sb.ToString(), (New-Object System.Text.UTF8Encoding($true)))

# ---- HTML -> DOCX via Word COM ----
$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
  $doc = $word.Documents.Open($htmlPath)
  $wdFormatDocumentDefault = 16  # .docx
  if (Test-Path -LiteralPath $OutDocx) { Remove-Item -LiteralPath $OutDocx -Force }
  $doc.SaveAs([ref]$OutDocx, [ref]$wdFormatDocumentDefault)
  $doc.Close()
  Write-Output ("DOCX written: " + $OutDocx)
} finally {
  $word.Quit()
  Remove-Item -LiteralPath $htmlPath -Force -ErrorAction SilentlyContinue
}
