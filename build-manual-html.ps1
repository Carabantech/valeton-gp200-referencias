$ErrorActionPreference = 'Stop'

$pythonDir = Join-Path $env:LOCALAPPDATA 'Programs\Python\Python313'
$scriptsDir = Join-Path $pythonDir 'Scripts'
$env:Path = "$pythonDir;$scriptsDir;$env:Path"

python .\build_manual_html.py
