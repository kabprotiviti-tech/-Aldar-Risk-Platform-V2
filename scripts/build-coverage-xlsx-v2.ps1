param(
  [string]$JsonPath = "C:\Users\Badal.Shah\AI projects\aldar-risk-platform-v2\scripts\erm-pricing-data.json",
  [string]$OutXlsx  = "C:\Users\Badal.Shah\OneDrive - Protiviti Member Firm\AI Projects\ALDAR Demo\ERM-BRD-Coverage-and-Pricing-v2.xlsx"
)
$ErrorActionPreference = 'Stop'
$data = Get-Content -LiteralPath $JsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
$reqs = $data.requirements
$adds = $data.additional

# Items delivered in Phases 0-4 (now demonstrable in the tool)
$DELIVERED = @{
  '1.2'='Phase 3 - User admin'; '1.4'='Phase 0 - Approval gate'; '1.5'='Phase 0 - Lifecycle actions';
  '1.10'='Phase 0 - Owner sign-off'; '2.6'='Phase 2 - Movement & trend'; '2.8'='Phase 2 - Review cycles';
  '3.2'='Phase 1 - Control reuse'; '3.3'='Phase 0 - Mitigation evidence'; '3.6'='Phase 2 - Mitigation to control';
  '4.3'='Phase 4 - KRI feeds'; '6.3'='Phase 3 - Reporting cut-offs'; '7.1'='Phase 0 - Enforced approval';
  '7.2'='Phase 0 - Lifecycle audit'; '7.5'='Phase 1 - Incidents'; '7.6'='Phase 1 - Risk acceptance';
  '7.7'='Phase 1 - Lessons learned'; 'P2.3'='Phase 3 - Scenario versioning'; 'P3.2'='Phase 1 - Framework tag';
}

function Status-Now($r) {
  if ($DELIVERED.ContainsKey($r.ref)) { return 'In tool (demo)' }
  if ($r.inTool -eq 'Yes') { return 'In tool (live)' }
  if ($r.inTool -eq 'Partial') { return 'Partial' }
  return 'Not built'
}

$C_NAVY = 6837815
$C_WHITE= 16777215
$C_RED  = 1638522
$GRN_BG=13561798; $GRN_FG=24832
$BLU_BG=16247773; $BLU_FG=7884319
$AMB_BG=10284031; $AMB_FG=26012
$RED_BG=13551615; $RED_FG=393372
$GREY  =8421504
$LGREY =15921906
$YELLOW=13434879

function StatusColors($s){
  switch -Wildcard ($s) {
    'In tool (live)*' { return @($GRN_BG,$GRN_FG) }
    'In tool (demo)*' { return @($BLU_BG,$BLU_FG) }
    'Partial*'        { return @($AMB_BG,$AMB_FG) }
    default           { return @($RED_BG,$RED_FG) }
  }
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible=$false; $excel.DisplayAlerts=$false
$wb = $excel.Workbooks.Add()
while ($wb.Sheets.Count -gt 1) { $wb.Sheets.Item($wb.Sheets.Count).Delete() }

try {
  # ===== COVERAGE & PRICING =====
  $ws = $wb.Sheets.Item(1); $ws.Name='Coverage and Pricing'
  $hdr=@('Ref','Section','BRD requirement','Status now','Delivered in','What exists in tool','Gap to production-grade','Effort to harden (days)','Day rate (AED)','Cost (AED)','Notes')
  for($c=0;$c -lt $hdr.Count;$c++){ $ws.Cells.Item(1,$c+1)=$hdr[$c] }
  $n=$reqs.Count
  $arr = New-Object 'object[,]' $n,11
  for($r=0;$r -lt $n;$r++){
    $x=$reqs[$r]; $st=Status-Now $x
    $arr[$r,0]=$x.ref; $arr[$r,1]=$x.section; $arr[$r,2]=$x.requirement; $arr[$r,3]=$st
    if($DELIVERED.ContainsKey($x.ref)){ $arr[$r,4]=$DELIVERED[$x.ref] } else { $arr[$r,4]='' }
    $arr[$r,5]=$x.whatExists; $arr[$r,6]=$x.whatsMissing
    if($st -like 'In tool (live)*'){ $arr[$r,7]=0 } else { $arr[$r,7]=$null }
    $arr[$r,8]=$null; $arr[$r,9]=$null; $arr[$r,10]=$x.notes
  }
  $ws.Range($ws.Cells.Item(2,1),$ws.Cells.Item($n+1,11)).Value2=$arr
  $ws.Range($ws.Cells.Item(2,10),$ws.Cells.Item($n+1,10)).Formula='=IF(H2="","",H2*I2)'
  $tr=$n+2; $ws.Cells.Item($tr,3)='TOTAL'; $ws.Cells.Item($tr,8).Formula="=SUM(H2:H$($n+1))"; $ws.Cells.Item($tr,10).Formula="=SUM(J2:J$($n+1))"
  $ws.Range($ws.Cells.Item($tr,1),$ws.Cells.Item($tr,11)).Font.Bold=$true
  $ws.Range($ws.Cells.Item($tr,1),$ws.Cells.Item($tr,11)).Interior.Color=$LGREY
  for($r=0;$r -lt $n;$r++){ $cl=StatusColors (Status-Now $reqs[$r]); $cell=$ws.Cells.Item($r+2,4); $cell.Interior.Color=$cl[0]; $cell.Font.Color=$cl[1]; $cell.Font.Bold=$true; $cell.HorizontalAlignment=-4108 }
  $ws.Range($ws.Cells.Item(2,8),$ws.Cells.Item($n+1,9)).Interior.Color=$YELLOW
  $ws.Range($ws.Cells.Item(2,9),$ws.Cells.Item($tr,10)).NumberFormat='#,##0'
  $w=@(7,24,44,15,20,42,40,13,12,14,34); for($c=0;$c -lt 11;$c++){ $ws.Columns.Item($c+1).ColumnWidth=$w[$c] }
  $body=$ws.Range($ws.Cells.Item(2,1),$ws.Cells.Item($n+1,11)); $body.WrapText=$true; $body.VerticalAlignment=-4160
  $h=$ws.Range($ws.Cells.Item(1,1),$ws.Cells.Item(1,11)); $h.Interior.Color=$C_RED; $h.Font.Color=$C_WHITE; $h.Font.Bold=$true; $h.HorizontalAlignment=-4108; $ws.Rows.Item(1).RowHeight=30
  $ws.Application.ActiveWindow.SplitRow=1; $ws.Application.ActiveWindow.FreezePanes=$true

  # ===== TOOL-TO-BRD MAPPING =====
  $ws2=$wb.Sheets.Add($wb.Sheets.Item($wb.Sheets.Count)); $ws2.Name='Tool-to-BRD Mapping'
  $hdr2=@('Ref','Section','BRD requirement','Status now','Delivered in','What exists today','What is still missing','Original BRD grade','Notes')
  for($c=0;$c -lt $hdr2.Count;$c++){ $ws2.Cells.Item(1,$c+1)=$hdr2[$c] }
  $arr2=New-Object 'object[,]' $n,9
  for($r=0;$r -lt $n;$r++){ $x=$reqs[$r]; $st=Status-Now $x
    $arr2[$r,0]=$x.ref;$arr2[$r,1]=$x.section;$arr2[$r,2]=$x.requirement;$arr2[$r,3]=$st
    if($DELIVERED.ContainsKey($x.ref)){ $arr2[$r,4]=$DELIVERED[$x.ref] } else { $arr2[$r,4]='' }
    $arr2[$r,5]=$x.whatExists;$arr2[$r,6]=$x.whatsMissing;$arr2[$r,7]=$x.inTool;$arr2[$r,8]=$x.notes }
  $ws2.Range($ws2.Cells.Item(2,1),$ws2.Cells.Item($n+1,9)).Value2=$arr2
  for($r=0;$r -lt $n;$r++){ $cl=StatusColors (Status-Now $reqs[$r]); $cell=$ws2.Cells.Item($r+2,4); $cell.Interior.Color=$cl[0]; $cell.Font.Color=$cl[1]; $cell.Font.Bold=$true; $cell.HorizontalAlignment=-4108 }
  $w2=@(7,22,42,15,20,48,44,12,40); for($c=0;$c -lt 9;$c++){ $ws2.Columns.Item($c+1).ColumnWidth=$w2[$c] }
  $b2=$ws2.Range($ws2.Cells.Item(2,1),$ws2.Cells.Item($n+1,9)); $b2.WrapText=$true; $b2.VerticalAlignment=-4160
  $h2=$ws2.Range($ws2.Cells.Item(1,1),$ws2.Cells.Item(1,9)); $h2.Interior.Color=$C_RED; $h2.Font.Color=$C_WHITE; $h2.Font.Bold=$true; $h2.HorizontalAlignment=-4108; $ws2.Rows.Item(1).RowHeight=30
  $ws2.Application.ActiveWindow.SplitRow=1; $ws2.Application.ActiveWindow.FreezePanes=$true

  # ===== BEYOND BRD =====
  $ws3=$wb.Sheets.Add($wb.Sheets.Item($wb.Sheets.Count)); $ws3.Name='Beyond BRD (extras)'
  $hdr3=@('Ref','Group','Feature (not in BRD)','What it does','Status','Showcase value')
  for($c=0;$c -lt $hdr3.Count;$c++){ $ws3.Cells.Item(1,$c+1)=$hdr3[$c] }
  $m=$adds.Count; $arr3=New-Object 'object[,]' $m,6
  for($r=0;$r -lt $m;$r++){ $y=$adds[$r]; $arr3[$r,0]=$y.ref;$arr3[$r,1]=$y.group;$arr3[$r,2]=$y.feature;$arr3[$r,3]=$y.whatItDoes;$arr3[$r,4]=$y.status;$arr3[$r,5]=$y.showcase }
  $ws3.Range($ws3.Cells.Item(2,1),$ws3.Cells.Item($m+1,6)).Value2=$arr3
  for($r=0;$r -lt $m;$r++){ $s=[string]$adds[$r].status; $bg=$GRN_BG;$fg=$GRN_FG; if($s -like 'Partial*'){$bg=$AMB_BG;$fg=$AMB_FG}elseif($s -like 'Stub*'){$bg=$RED_BG;$fg=$RED_FG}; $cell=$ws3.Cells.Item($r+2,5); $cell.Interior.Color=$bg; $cell.Font.Color=$fg; $cell.Font.Bold=$true; $cell.HorizontalAlignment=-4108 }
  $w3=@(7,24,34,56,16,40); for($c=0;$c -lt 6;$c++){ $ws3.Columns.Item($c+1).ColumnWidth=$w3[$c] }
  $b3=$ws3.Range($ws3.Cells.Item(2,1),$ws3.Cells.Item($m+1,6)); $b3.WrapText=$true; $b3.VerticalAlignment=-4160
  $h3=$ws3.Range($ws3.Cells.Item(1,1),$ws3.Cells.Item(1,6)); $h3.Interior.Color=$C_RED; $h3.Font.Color=$C_WHITE; $h3.Font.Bold=$true; $h3.HorizontalAlignment=-4108; $ws3.Rows.Item(1).RowHeight=30

  # ===== SUMMARY =====
  $SM=$wb.Sheets.Add($wb.Sheets.Item(1)); $SM.Name='Summary'
  $live=0;$demo=0;$part=0;$no=0
  foreach($r in $reqs){ switch -Wildcard (Status-Now $r){ 'In tool (live)*'{$live++} 'In tool (demo)*'{$demo++} 'Partial*'{$part++} default{$no++} } }
  $inTool=$live+$demo; $total=$reqs.Count
  $secOrder=@(); $secMap=@{}
  foreach($r in $reqs){ $s=$r.section; if(-not $secMap.ContainsKey($s)){ $secMap[$s]=@{tot=0;intool=0;part=0}; $secOrder+=$s }; $secMap[$s].tot++; $st=Status-Now $r; if($st -like 'In tool*'){$secMap[$s].intool++}elseif($st -like 'Partial*'){$secMap[$s].part++} }

  $SM.Range('A1:L1').Merge(); $SM.Cells.Item(1,1)='ABC Holdings - ERM Platform | BRD Coverage and Pricing'
  $SM.Cells.Item(1,1).Font.Size=20; $SM.Cells.Item(1,1).Font.Bold=$true; $SM.Cells.Item(1,1).Font.Color=$C_WHITE
  $SM.Range('A1:L1').Interior.Color=$C_RED; $SM.Range('A1:L1').VerticalAlignment=-4108; $SM.Rows.Item(1).RowHeight=34
  $SM.Range('A2:L2').Merge(); $SM.Cells.Item(2,1)='Status after build Phases 0-4  |  58 BRD line-items + 31 capabilities beyond the BRD  |  Prepared by Protiviti  |  Illustrative demo build (browser-persisted)'
  $SM.Cells.Item(2,1).Font.Size=10.5; $SM.Cells.Item(2,1).Font.Color=$GREY; $SM.Rows.Item(2).RowHeight=20

  $pct=[math]::Round($inTool/$total*100)
  $cards=@(
    @($total, 'BRD line-items', $LGREY, $C_NAVY),
    @($inTool, "In tool now ($pct%)", $GRN_BG, $GRN_FG),
    @($demo, 'Built in Phases 0-4', $BLU_BG, $BLU_FG),
    @($part, 'Partial (to harden)', $AMB_BG, $AMB_FG),
    @($adds.Count, 'Beyond the BRD', $LGREY, $C_RED)
  )
  $col=1
  foreach($cd in $cards){
    $c1=$col; $c2=$col+1
    $rngNum=$SM.Range($SM.Cells.Item(4,$c1),$SM.Cells.Item(4,$c2)); $rngNum.Merge(); $SM.Cells.Item(4,$c1)=$cd[0]
    $SM.Cells.Item(4,$c1).Font.Size=26; $SM.Cells.Item(4,$c1).Font.Bold=$true; $SM.Cells.Item(4,$c1).Font.Color=$cd[3]; $rngNum.HorizontalAlignment=-4108; $rngNum.Interior.Color=$cd[2]
    $rngLab=$SM.Range($SM.Cells.Item(5,$c1),$SM.Cells.Item(5,$c2)); $rngLab.Merge(); $SM.Cells.Item(5,$c1)=$cd[1]
    $SM.Cells.Item(5,$c1).Font.Size=9.5; $SM.Cells.Item(5,$c1).Font.Bold=$true; $SM.Cells.Item(5,$c1).Font.Color=$cd[3]; $rngLab.HorizontalAlignment=-4108; $rngLab.Interior.Color=$cd[2]; $rngLab.VerticalAlignment=-4160
    $col=$col+2
  }
  $SM.Rows.Item(4).RowHeight=34; $SM.Rows.Item(5).RowHeight=26

  $SM.Cells.Item(7,1)='Status key:'; $SM.Cells.Item(7,1).Font.Bold=$true
  $leg=@(@('In tool - live (production-grade)',$GRN_BG,$GRN_FG),@('In tool - demo (built Phases 0-4, illustrative)',$BLU_BG,$BLU_FG),@('Partial (works; needs hardening)',$AMB_BG,$AMB_FG))
  $lc=2; foreach($l in $leg){ $SM.Cells.Item(7,$lc)=$l[0]; $SM.Cells.Item(7,$lc).Interior.Color=$l[1]; $SM.Cells.Item(7,$lc).Font.Color=$l[2]; $SM.Cells.Item(7,$lc).Font.Size=9; $SM.Cells.Item(7,$lc).Font.Bold=$true; $SM.Range($SM.Cells.Item(7,$lc),$SM.Cells.Item(7,$lc+2)).Merge(); $lc=$lc+3 }

  $startRow=9
  $SM.Cells.Item($startRow,1)='Coverage by section'; $SM.Cells.Item($startRow,1).Font.Bold=$true; $SM.Cells.Item($startRow,1).Font.Size=12
  $hr=$startRow+1
  $SM.Cells.Item($hr,1)='Section'; $SM.Cells.Item($hr,2)='Total'; $SM.Cells.Item($hr,3)='In tool'; $SM.Cells.Item($hr,4)='Partial'; $SM.Cells.Item($hr,5)='% in tool'
  $hrng=$SM.Range($SM.Cells.Item($hr,1),$SM.Cells.Item($hr,5)); $hrng.Interior.Color=$C_NAVY; $hrng.Font.Color=$C_WHITE; $hrng.Font.Bold=$true
  $rr=$hr+1
  foreach($s in $secOrder){ $d=$secMap[$s]; $SM.Cells.Item($rr,1)=$s; $SM.Cells.Item($rr,2)=$d.tot; $SM.Cells.Item($rr,3)=$d.intool; $SM.Cells.Item($rr,4)=$d.part; $SM.Cells.Item($rr,5)=[math]::Round($d.intool/$d.tot*100); $SM.Cells.Item($rr,5).NumberFormat='0"%"'; $rr++ }
  $tblEnd=$rr-1
  $SM.Range($SM.Cells.Item($hr,1),$SM.Cells.Item($tblEnd,5)).Borders.Weight=2

  $co=$SM.ChartObjects().Add(430, 150, 470, 250)
  $ch=$co.Chart; $ch.ChartType=51
  $ch.SetSourceData($SM.Range($SM.Cells.Item($hr,1),$SM.Cells.Item($tblEnd,4)))
  $ch.HasTitle=$true; $ch.ChartTitle.Text='BRD coverage by section'

  $mr=$tblEnd+3
  $SM.Cells.Item($mr,1)='Effort to harden demo to production (person-days)'; $SM.Cells.Item($mr,2).Formula="='Coverage and Pricing'!H$($reqs.Count+2)"; $SM.Cells.Item($mr,2).NumberFormat='#,##0'
  $SM.Cells.Item($mr+1,1)='Estimated cost (AED)'; $SM.Cells.Item($mr+1,2).Formula="='Coverage and Pricing'!J$($reqs.Count+2)"; $SM.Cells.Item($mr+1,2).NumberFormat='#,##0'
  $SM.Cells.Item($mr,1).Font.Bold=$true; $SM.Cells.Item($mr+1,1).Font.Bold=$true
  $SM.Cells.Item($mr+3,1)='How to read this pack'; $SM.Cells.Item($mr+3,1).Font.Bold=$true; $SM.Cells.Item($mr+3,1).Font.Size=11
  $notes=@(
    '- All 13 BRD gaps from v1 are now BUILT (demo-real) across Phases 0-4 - none remain "not started".',
    '- "In tool - demo" = the capability is live and clickable in the tool on illustrative, browser-persisted data; it needs backend persistence / SSO / real integrations to be production-grade.',
    '- Enter person-days + day-rate in the yellow cells on Coverage and Pricing; effort now estimates demo-to-production hardening, not build-from-scratch.',
    '- Tool-to-BRD Mapping = the evidence/backup. Beyond BRD = 31 capabilities the client never asked for.'
  )
  $nr=$mr+4; foreach($t in $notes){ $SM.Cells.Item($nr,1)=$t; $SM.Range($SM.Cells.Item($nr,1),$SM.Cells.Item($nr,8)).Merge(); $SM.Cells.Item($nr,1).Font.Size=10; $SM.Cells.Item($nr,1).Font.Color=$GREY; $nr++ }

  $SM.Columns.Item(1).ColumnWidth=46; $SM.Columns.Item(2).ColumnWidth=10; $SM.Columns.Item(3).ColumnWidth=10; $SM.Columns.Item(4).ColumnWidth=10; $SM.Columns.Item(5).ColumnWidth=12

  if(Test-Path -LiteralPath $OutXlsx){ Remove-Item -LiteralPath $OutXlsx -Force }
  $wb.SaveAs($OutXlsx,51)
  Write-Output ("OK - in tool $inTool/$total (live $live, demo $demo), partial $part, not-built $no, extras $($adds.Count)")
} finally {
  $wb.Close($false); $excel.Quit()
}
