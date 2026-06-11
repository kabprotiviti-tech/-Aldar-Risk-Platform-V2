param(
  [Parameter(Mandatory=$true)][string]$JsonPath,
  [Parameter(Mandatory=$true)][string]$OutXlsx
)

$ErrorActionPreference = 'Stop'
$data = Get-Content -LiteralPath $JsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
$reqs = $data.requirements
$adds = $data.additional

# ---- colour helpers (BGR ints) ----
$HEADER_BG = 1638522;  $HEADER_FG = 16777215   # dark red / white
$GREEN_BG = 13561798;  $GREEN_FG = 24832
$AMBER_BG = 10284031;  $AMBER_FG = 26012
$RED_BG   = 13551615;  $RED_FG   = 393372
$BLUE_BG  = 16247773;  $BLUE_FG  = 7884319
$GREY_BG  = 15527148                          # light grey band

function Set-Status($cell, [string]$v) {
  $t = $v.ToLower()
  if ($t.StartsWith('yes') -or $t.StartsWith('live') -or $t -eq 'in tool now') { $cell.Interior.Color = $GREEN_BG; $cell.Font.Color = $GREEN_FG }
  elseif ($t.StartsWith('partial')) { $cell.Interior.Color = $AMBER_BG; $cell.Font.Color = $AMBER_FG }
  elseif ($t.StartsWith('no') -or $t.StartsWith('stub')) { $cell.Interior.Color = $RED_BG; $cell.Font.Color = $RED_FG }
  $cell.HorizontalAlignment = -4108  # center
}
function Set-Stage($cell, [string]$v) {
  $t = $v.ToLower()
  if ($t -eq 'in tool now') { $cell.Interior.Color = $GREEN_BG; $cell.Font.Color = $GREEN_FG }
  elseif ($t -eq 'poc') { $cell.Interior.Color = $BLUE_BG; $cell.Font.Color = $BLUE_FG }
  elseif ($t -eq 'mvp') { $cell.Interior.Color = $AMBER_BG; $cell.Font.Color = $AMBER_FG }
  elseif ($t.StartsWith('full')) { $cell.Interior.Color = $RED_BG; $cell.Font.Color = $RED_FG }
  $cell.HorizontalAlignment = -4108
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Add()

function New-Sheet([string]$name, [int]$pos) {
  $s = $wb.Sheets.Add($wb.Sheets.Item($wb.Sheets.Count))
  $s.Name = $name
  return $s
}
function Style-Header($ws, [int]$cols) {
  $h = $ws.Range($ws.Cells.Item(1,1), $ws.Cells.Item(1,$cols))
  $h.Interior.Color = $HEADER_BG; $h.Font.Color = $HEADER_FG; $h.Font.Bold = $true
  $h.HorizontalAlignment = -4108; $h.VerticalAlignment = -4108
  $ws.Rows.Item(1).RowHeight = 30
  $ws.Application.ActiveWindow.SplitRow = 1
  $ws.Application.ActiveWindow.FreezePanes = $true
}

try {
  # ============ SHEET 1: PRICING ============
  $ws = $wb.Sheets.Item(1); $ws.Name = 'Pricing'
  $hdr = @('Ref','Section','Requirement / Feature','Current Status','Delivery Stage','Effort (person-days)','Day Rate (AED)','Cost (AED)','Workstream / Phase','Comments')
  for ($c=0; $c -lt $hdr.Count; $c++) { $ws.Cells.Item(1,$c+1) = $hdr[$c] }
  $n = $reqs.Count
  $arr = New-Object 'object[,]' $n,10
  for ($r=0; $r -lt $n; $r++) {
    $x = $reqs[$r]
    $arr[$r,0]=$x.ref; $arr[$r,1]=$x.section; $arr[$r,2]=$x.requirement; $arr[$r,3]=$x.inTool; $arr[$r,4]=$x.recommendation
    if ($x.recommendation -eq 'In tool now') { $arr[$r,5]=0 } else { $arr[$r,5]=$null }
    $arr[$r,6]=$null; $arr[$r,7]=$null; $arr[$r,8]=$null; $arr[$r,9]=$null
  }
  $ws.Range($ws.Cells.Item(2,1), $ws.Cells.Item($n+1,10)).Value2 = $arr
  # cost formula
  $ws.Range($ws.Cells.Item(2,8), $ws.Cells.Item($n+1,8)).Formula = '=IF(F2="","",F2*G2)'
  # totals row
  $tr = $n+2
  $ws.Cells.Item($tr,3) = 'TOTAL'
  $ws.Cells.Item($tr,6).Formula = "=SUM(F2:F$($n+1))"
  $ws.Cells.Item($tr,8).Formula = "=SUM(H2:H$($n+1))"
  $totRange = $ws.Range($ws.Cells.Item($tr,1), $ws.Cells.Item($tr,10))
  $totRange.Font.Bold = $true; $totRange.Interior.Color = $GREY_BG
  $totRange.Borders.Item(8).Weight = 3  # top border (xlEdgeTop)
  # colour status + stage
  for ($r=0; $r -lt $n; $r++) {
    Set-Status $ws.Cells.Item($r+2,4) $reqs[$r].inTool
    Set-Stage  $ws.Cells.Item($r+2,5) $reqs[$r].recommendation
  }
  # input cells (F,G,I,J) light yellow to signal "fill me"
  $inp = $ws.Range($ws.Cells.Item(2,6), $ws.Cells.Item($n+1,7))
  $inp.Interior.Color = 13434879  # pale yellow
  $ws.Range($ws.Cells.Item(2,9), $ws.Cells.Item($n+1,10)).Interior.Color = 13434879
  # number formats
  $ws.Range($ws.Cells.Item(2,7), $ws.Cells.Item($tr,8)).NumberFormat = '#,##0'
  $ws.Range($ws.Cells.Item(2,6), $ws.Cells.Item($tr,6)).NumberFormat = '#,##0.0'
  # widths + wrap
  $w = @(7,26,46,13,15,12,12,14,18,30)
  for ($c=0; $c -lt 10; $c++) { $ws.Columns.Item($c+1).ColumnWidth = $w[$c] }
  $body = $ws.Range($ws.Cells.Item(2,1), $ws.Cells.Item($n+1,10))
  $body.WrapText = $true; $body.VerticalAlignment = -4160  # top
  Style-Header $ws 10
  $ws.Cells.Item(1,1).Select() | Out-Null

  # ============ SHEET 2: TOOL-TO-BRD MAPPING (BACKUP) ============
  $ws2 = New-Sheet 'Tool-to-BRD Mapping' 2
  $hdr2 = @('Ref','Section (BRD)','BRD Requirement / Line-item','In Tool?','What Exists Today','What''s Missing','Recommendation','Partner Notes')
  for ($c=0; $c -lt $hdr2.Count; $c++) { $ws2.Cells.Item(1,$c+1) = $hdr2[$c] }
  $arr2 = New-Object 'object[,]' $n,8
  for ($r=0; $r -lt $n; $r++) {
    $x = $reqs[$r]
    $arr2[$r,0]=$x.ref; $arr2[$r,1]=$x.section; $arr2[$r,2]=$x.requirement; $arr2[$r,3]=$x.inTool
    $arr2[$r,4]=$x.whatExists; $arr2[$r,5]=$x.whatsMissing; $arr2[$r,6]=$x.recommendation; $arr2[$r,7]=$x.notes
  }
  $ws2.Range($ws2.Cells.Item(2,1), $ws2.Cells.Item($n+1,8)).Value2 = $arr2
  for ($r=0; $r -lt $n; $r++) {
    Set-Status $ws2.Cells.Item($r+2,4) $reqs[$r].inTool
    Set-Stage  $ws2.Cells.Item($r+2,7) $reqs[$r].recommendation
  }
  $w2 = @(7,24,42,10,50,46,16,46)
  for ($c=0; $c -lt 8; $c++) { $ws2.Columns.Item($c+1).ColumnWidth = $w2[$c] }
  $body2 = $ws2.Range($ws2.Cells.Item(2,1), $ws2.Cells.Item($n+1,8))
  $body2.WrapText = $true; $body2.VerticalAlignment = -4160
  Style-Header $ws2 8
  $ws2.Cells.Item(1,1).Select() | Out-Null

  # ============ SHEET 3: ADDITIONAL FEATURES ============
  $ws3 = New-Sheet 'Additional Features' 3
  $hdr3 = @('Ref','Group','Feature (not in BRD)','What it does','Status','Showcase value')
  for ($c=0; $c -lt $hdr3.Count; $c++) { $ws3.Cells.Item(1,$c+1) = $hdr3[$c] }
  $m = $adds.Count
  $arr3 = New-Object 'object[,]' $m,6
  for ($r=0; $r -lt $m; $r++) {
    $y = $adds[$r]
    $arr3[$r,0]=$y.ref; $arr3[$r,1]=$y.group; $arr3[$r,2]=$y.feature; $arr3[$r,3]=$y.whatItDoes; $arr3[$r,4]=$y.status; $arr3[$r,5]=$y.showcase
  }
  $ws3.Range($ws3.Cells.Item(2,1), $ws3.Cells.Item($m+1,6)).Value2 = $arr3
  for ($r=0; $r -lt $m; $r++) { Set-Status $ws3.Cells.Item($r+2,5) $adds[$r].status }
  $w3 = @(7,24,34,56,16,40)
  for ($c=0; $c -lt 6; $c++) { $ws3.Columns.Item($c+1).ColumnWidth = $w3[$c] }
  $body3 = $ws3.Range($ws3.Cells.Item(2,1), $ws3.Cells.Item($m+1,6))
  $body3.WrapText = $true; $body3.VerticalAlignment = -4160
  Style-Header $ws3 6
  $ws3.Cells.Item(1,1).Select() | Out-Null

  # ============ SHEET 4: SUMMARY ============
  $ws4 = New-Sheet 'Summary' 4
  $yes = ($reqs | Where-Object { $_.inTool -eq 'Yes' }).Count
  $par = ($reqs | Where-Object { $_.inTool -eq 'Partial' }).Count
  $no  = ($reqs | Where-Object { $_.inTool -eq 'No' }).Count
  $sNow = ($reqs | Where-Object { $_.recommendation -eq 'In tool now' }).Count
  $sPoc = ($reqs | Where-Object { $_.recommendation -eq 'POC' }).Count
  $sMvp = ($reqs | Where-Object { $_.recommendation -eq 'MVP' }).Count
  $sFul = ($reqs | Where-Object { $_.recommendation -eq 'Full implementation' }).Count
  $ws4.Cells.Item(1,1) = 'PROS — ERM Tool vs BRD: Pricing & Coverage Summary'
  $ws4.Cells.Item(1,1).Font.Size = 16; $ws4.Cells.Item(1,1).Font.Bold = $true; $ws4.Cells.Item(1,1).Font.Color = $HEADER_BG
  $rows = @(
    @('',''),
    @('Total BRD line-items', $n),
    @('  In tool (Yes)', $yes),
    @('  Partial', $par),
    @('  Not built (No)', $no),
    @('',''),
    @('Delivery stage split',''),
    @('  Already in tool now', $sNow),
    @('  POC (quick, API-only)', $sPoc),
    @('  MVP (production-lean)', $sMvp),
    @('  Full implementation', $sFul),
    @('',''),
    @('Additional features beyond BRD', $m),
    @('',''),
    @('Total estimated effort (person-days)', $null),
    @('Total estimated cost (AED)', $null),
    @('',''),
    @('HOW TO USE',''),
    @('1) Pricing sheet: enter Effort (person-days) and Day Rate in the yellow cells; Cost auto-calculates.',''),
    @('2) Rows marked "In tool now" are already delivered (effort pre-set to 0).',''),
    @('3) Tool-to-BRD Mapping = the backup evidence: what exists, what is missing, per line-item.',''),
    @('4) Additional Features = capabilities already built that the BRD did not ask for.',''),
    @('',''),
    @('LEGEND','  Green = ready / in tool   ·   Amber = partial / MVP   ·   Red = not built / full build   ·   Blue = POC')
  )
  $rr = 3
  foreach ($pair in $rows) {
    $ws4.Cells.Item($rr,1) = $pair[0]
    if ($null -ne $pair[1] -and $pair[1] -ne '') { $ws4.Cells.Item($rr,2) = $pair[1] }
    $rr++
  }
  # link effort/cost totals to Pricing totals row
  $ws4.Cells.Item(17,2).Formula = "=Pricing!F$($n+2)"
  $ws4.Cells.Item(18,2).Formula = "=Pricing!H$($n+2)"
  $ws4.Cells.Item(18,2).NumberFormat = '#,##0'
  $ws4.Cells.Item(17,2).NumberFormat = '#,##0.0'
  # emphasise headline numbers
  foreach ($cellRef in @(5,6,7)) { $ws4.Cells.Item($cellRef,2).Font.Bold = $true }
  Set-Status $ws4.Cells.Item(5,2) 'Yes'; Set-Status $ws4.Cells.Item(6,2) 'Partial'; Set-Status $ws4.Cells.Item(7,2) 'No'
  $ws4.Cells.Item(20,1).Font.Bold = $true; $ws4.Cells.Item(26,1).Font.Bold = $true
  $ws4.Columns.Item(1).ColumnWidth = 46; $ws4.Columns.Item(2).ColumnWidth = 70
  # move Summary to first position
  $ws4.Move($wb.Sheets.Item(1))

  if (Test-Path -LiteralPath $OutXlsx) { Remove-Item -LiteralPath $OutXlsx -Force }
  $wb.SaveAs($OutXlsx, 51)  # xlOpenXMLWorkbook (.xlsx)
  Write-Output ("XLSX written: " + $OutXlsx + "  | line-items=" + $n + " (Yes $yes / Partial $par / No $no), additional=" + $m)
} finally {
  $wb.Close($false)
  $excel.Quit()
}
