<# 
 .DESCRIPTION
 
 #>
param(
  [ValidateSet('dirName', 'fileName') ] $idType = 'dirName',
  [string] $idPre,
  [string ] $compPath,
  [string]$executeFile ,
  [switch] $reset,
  [switch] $renderMode
)
$curPath = Split-Path $PSCommandPath -Parent

# echo "idPre : $idPre"

if ( -not $executeFile ) { $executeFile = "$curPath\_build.dist.cjs" }
# echo (Get-ChildItem $compPath -Recurse ).FullName

if ($reset.IsPresent) {
  Get-ChildItem "$curPath\*" -Include  'index.js', 'index.css', '_build.json' | Remove-Item
}


if (Test-Path $compPath ) {


  if (Test-Path $compPath -Type Container ) {

    if ($renderMode.IsPresent) {
      node.exe $executeFile --idType $idType --idPre $idPre  (Get-ChildItem "$compPath\*.vue" -Recurse ).FullName --renderMode
    }
    else {
      node.exe $executeFile --idType $idType --idPre $idPre  (Get-ChildItem "$compPath\*.vue" -Recurse ).FullName
    }
  }
  elseif (Test-Path $compPath -Type Leaf) {
    if ($compPath.EndsWith('.vue')) {
      if ($renderMode.IsPresent) {
        node.exe $executeFile --idType $idType --idPre $idPre $compPath --renderMode
      }
      else {
        node.exe $executeFile --idType $idType --idPre $idPre $compPath
      }
    }
    else {
      Write-Error "不是vue文件,请传入包含vue文件的文件夹或者文件"
    }
  }
}
else {
  <# Action when all if and elseif conditions are false #>
  Write-Error "$compPath 路径不存在,请传入包含vue文件的文件夹或者文件"
}