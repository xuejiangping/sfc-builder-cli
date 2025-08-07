<# 
 .DESCRIPTION
 
 #>
param(
  [ValidateSet('dirName', 'fileName') ] $idType = 'dirName',
  [string] $idPre,
  [string ] $compPath,
  [string]$executeFile,
  [string]$outputPath,
  [switch] $reset,
  [switch] $renderMode
)

# echo "idPre : $idPre"

if ( -not ($executeFile -and (Test-Path $executeFile)) ) { throw "executeFile not found"; }
# echo (Get-ChildItem $compPath -Recurse ).FullName

if ($reset.IsPresent) {
  Get-ChildItem "$outputPath\*" -Include  'index.js', 'index.css', '_build.json' -ErrorAction SilentlyContinue | Remove-Item
}

if (Test-Path $compPath ) {
  $vueFiles = (Get-ChildItem $compPath -Recurse -File -Include '*.vue' ).FullName
  $cmd = "node  $executeFile build --idType $idType --idPre $idPre -o $outputPath  $vueFiles" 
  if ($renderMode.IsPresent) { $cmd += " --renderMode" }
  # echo $cmd

  Invoke-Expression $cmd
}
else {
  <# Action when all if and elseif conditions are false #>
  Write-Error "$compPath 路径不存在,请传入包含vue文件的文件夹或者文件"
}